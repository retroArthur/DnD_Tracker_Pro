# Phase 3: Bestiary — Forschungsbericht

**Recherchiert:** 2026-06-13
**Domain:** Offline-Monster-Kompendium, SRD-Daten, CRUD eigener Kreaturen, Initiative-Integration
**Gesamt-Konfidenz:** HIGH

---

<user_constraints>
## Nutzervorgaben (aus CONTEXT.md)

### Gesperrte Entscheidungen (Locked Decisions)

**SRD-Datenbestand & Sprache**
- **D-01:** Deutsch durchgängig — alle Monster-Texte auf Deutsch.
- **D-02:** Kuratiert ~100–150 Monster über alle CR-Stufen.
- **D-03:** Quelle SRD 5.1 / 2014er Regeln; keine 2024er-Statblocks.
- **D-04:** Voller Statblock (Attribute, Saves, Skills, Resistenzen, Immunitäten, Sinne, Sprachen, Traits, Aktionen, Reaktionen, Legendäre Aktionen) — Fundament für Phase 4.

**Bestiary-Tab & Darstellung**
- **D-05:** Liste + Detail-Panel (NPC-Tab-Muster).
- **D-06:** Klassischer 5e-Statblock-Look (Pergament-Optik, rote Überschriften, Trennlinien).
- **D-07:** Suchleiste + Filter-Chips (CR, Typ); netzfreie Sofortergebnisse.
- **D-08:** SRD und Eigene gemischt in einer Liste; Herkunfts-Badge „SRD" / „Eigen".
- **D-09:** Anklickbare Würfe (Trefferwürfe, Schadensformeln) via `rollQrefDice()`.
- **D-10:** Portraits nur für eigene Kreaturen (Avatar-System); SRD-Monster bleiben bildlos.
- **D-11:** Favoriten-Stern; `D.bestiaryFavorites` als reine ID/Key-Liste.

**Eigene Kreaturen**
- **D-12:** Einheitliches Kreatur-Datenmodell — eigene Kreaturen teilen exakt die Statblock-Struktur der SRD-Monster.
- **D-13:** CRUD mit Undo (saveUndoState() + deleteWithConfirm/afterCrudOperation).

**Übernahme**
- **D-14:** Mengen-Dialog beim „Zur Initiative"-Klick.
- **D-15:** Auto-Wurf + HP-Variation ±10 % (Mechanik aus `addCalculatorToInitiative()`).
- **D-16:** Automatische Nummerierung mehrerer gleicher Monster.
- **D-17:** `statblockRef` am Kombattanten — Runtime-Feld, keine Migration.

**Architektur (locked)**
- SRD-Monsterdaten statisch/lazy, NIEMALS in `D`, nie in Undo/Export.
- Eigene Kreaturen in `D.bestiary[]`, Teil von Undo/Export.
- Favoriten `D.bestiaryFavorites` (nur IDs).
- `statblockRef` Runtime-only, keine Migration nötig.
- Alle neuen Module in `build.py` UND `loader.js` synchron eintragen.

### Claude's Discretion (offene Planungs-Entscheidungen)

- **Editor eigener Kreaturen:** Superset des bestehenden Encounter-Formulars (`saveEncounter`) vs. eigener Bestiary-Editor. Forschungsempfehlung steht unten.
- **„Zu Encounter"-Weg:** genaue Verdrahtung, wie eine `D.encounters`-Zeile aus Monsterdaten entsteht.
- **Schicksal der 12 `monster-templates.js`-Einträge:** Empfehlung laut Forschung unten.
- **Datengröße-Spike:** <200 KB → Inline, ≥200 KB → Index + IndexedDB. Empfehlung mit Zahlen unten.
- **Alle deutschen UI-Texte:** festgelegt in Sektion „Architektur-Muster".

### Zurückgestellte Ideen (OUT OF SCOPE)

- Vollständiger SRD-Monsterbestand (~330 Monster) — Phase 5+.
- Statblock-Popup in der Initiative (INIT-01) — Phase 4.
- Legendary-Aktionen/Resistenzen-Tracker (INIT-02) — Phase 4.
- Mob-Modus (INIT-03) — Phase 4.

</user_constraints>

---

<phase_requirements>
## Anforderungen dieser Phase

| ID | Beschreibung | Forschungsgrundlage |
|----|-------------|---------------------|
| BEST-01 | Nutzer kann SRD-Monster offline durchsuchen und filtern (Name, CR, Typ) in einem eigenen Bestiary-Tab | SRD-Datenbeschaffung (D-01/D-02/D-03), Lazy-Load-Architektur, Filter-Engine-Wiederverwendung |
| BEST-02 | Nutzer kann eigene Kreaturen anlegen, bearbeiten und löschen | CRUD-Muster, Editor-Strategie (Discretion), `D.bestiary[]`-Schema, Migration 3.0.0 |
| BEST-03 | Nutzer kann Monster direkt aus dem Bestiary in Encounter und Initiative übernehmen | `addCalculatorToInitiative()`-Mechanik, Encounter-Verdrahtung, `statblockRef` |

</phase_requirements>

---

## Zusammenfassung

Phase 3 baut auf einem soliden Fundament: Das Projekt besitzt bereits 12 kuratierte deutsche Statblock-Templates, eine bewährte Lazy-Load-Architektur für SRD-Daten (`core/srd-spells.js` als Blaupause), eine wiederverwendbare `addCalculatorToInitiative()`-Mechanik und einen umfangreichen Encounter-Editor als Basis für den eigenen Kreatur-Editor.

**Deutsche SRD-Quelle gefunden:** Wizards of the Coast veröffentlichte am 26.07.2023 das offizielle **SRD 5.1 auf Deutsch** unter **CC-BY-4.0**. Alle 391 Monster sind als maschinenlesbare JSON-Dateien über `openrpg.de/srd/5e/de/api/` verfügbar (Projekt: `codeberg.org/nesges/SRD-5.1-DE`). Die Daten können ohne lizenzrechtliche Bedenken eingebettet werden — mit Attribution. Dies löst D-01 vollständig: keine manuelle Übersetzung nötig, nur Kuratierung und Datentransformation ins App-Schema.

**Datengröße-Spike-Ergebnis:** 150 vollständige Statblocks ergeben unminifiziert ca. 190–293 KB (je nach Umfang der Legendären Aktionen/Reaktionen), minifiziert ca. 123–190 KB. Konservativ realistisch auf Basis echter API-Stichproben: minifiziert **ca. 140–160 KB** für 150 Monster. Das liegt **unter der 200-KB-Grenze** — Inline-Einbettung analog `core/srd-spells.js` ist die empfohlene Strategie.

**Empfehlung Kuratierung:** 150 Monster aus den 391 verfügbaren SRD-Monstern auswählen, per Skript aus der API holen, ins App-Schema transformieren, in `core/srd-monsters.js` einbetten. Die 12 bestehenden `monster-templates.js`-Einträge werden dabei als Teil des kuratierten Bestands übernommen; `monster-templates.js` und der `loadMonsterTemplate()`-Knopf werden auf das Bestiary umgeleitet.

**Primäre Empfehlung:** Inline-Einbettung in `core/srd-monsters.js` (wie `srd-spells.js`), vollständiges Statblock-Schema, eigener `features/bestiary/`-Ordner mit 4–5 Modulen, Tab-Registrierung im bestehenden System.

---

## Architektur-Verantwortungs-Karte

| Fähigkeit | Primäre Schicht | Sekundäre Schicht | Begründung |
|-----------|----------------|-------------------|------------|
| SRD-Datenhaltung | `core/srd-monsters.js` (statisch) | — | Nie in `D`; lazy-cached wie `srd-spells.js` |
| Eigene Kreaturen | `D.bestiary[]` in Browser-LocalStorage | IndexedDB-Backup via `persistence.js` | Nutzer-Daten → Undo/Export-Pfad |
| Favoriten-State | `D.bestiaryFavorites` (ID-Array) | — | Minimal, kein Snapshot-Overhead |
| Bestiary-Tab Render | `features/bestiary/bestiary-render.js` | `ui/virtual-scroll.js` für lange Listen | NPC-Tab-Muster |
| Bestiary-CRUD | `features/bestiary/bestiary-crud.js` | `utils/crud-helpers.js` | Standard-Muster |
| Kreatur-Editor-UI | `features/bestiary/bestiary-editor.js` | Wiederverwendet Encounter-Formular-Felder | Superset-Ansatz |
| Filterung/Suche | `utils/filter-engine.js` (applyFilters) | `systems/search/global-search.js` | Bestehende Engine |
| Übernahme → Initiative | Neue Funktion in `features/bestiary/bestiary-actions.js` | `addCalculatorToInitiative()`-Mechanik | Verdrahtung über bestehendes System |
| Übernahme → Encounter | Neue Funktion in `features/bestiary/bestiary-actions.js` | `features/encounters/encounters-crud.js` | `saveEncounter()` nicht zweckentfremdet |
| CSS | `assets/styles/bestiary.css` | `assets/styles/variables.css` | Eigene CSS-Datei per Konvention |
| Migration | `systems/spellslots/version-migration.js` → 3.0.0 | `core/data.js` | Bestehendes Migrationssystem |
| Tab-Registrierung | `systems/tab-registry.js` | `assets/templates/header.html` | TAB_RENDER_REGISTRY-Pattern |

---

## Standardstack

### Kern (100 % Wiederverwendung — kein neues npm-Paket nötig)

| Bestandteil | Verwendung | Warum Standard |
|------------|-----------|----------------|
| `utils/filter-engine.js` → `applyFilters()` | Name/CR/Typ-Filter in Echtzeit | Bereits für Zauber im Einsatz; single-pass |
| `ui/virtual-scroll.js` → `VirtualScroll.create()` | Monster-Liste ab 50 Einträgen | Ab 50 Items automatisch aktiv (config.threshold) |
| `systems/spellslots/quick-reference.js` → `rollQrefDice()` | Anklickbare Würfelformeln im Statblock | Vorbild für D-09 |
| `systems/avatars.js` → `showAvatarModal()` | Portraits für eigene Kreaturen | Wiederverwendet validiertes URL-System |
| `utils/crud-helpers.js` → `deleteWithConfirm()`, `afterCrudOperation()` | CRUD eigener Kreaturen | Standard-Muster (D-13) |
| `systems/spellslots/version-migration.js` | Migration 3.0.0 für `D.bestiary[]` | Bestehendes Versionssystem |
| `features/encounter-calculator.js` → `addCalculatorToInitiative()` | Basis für „Zur Initiative"-Mechanik | Auto-Init-Wurf, HP-Variation, Nummerierung bereits vorhanden |
| `render/helpers.js` → `safeRender()`, `EntityLookup` | Fehlertolerante Renders | Pflicht für alle neuen Render-Funktionen |

### Neue Module (zu erstellen)

| Modul | Zweck | Schicht |
|-------|-------|---------|
| `core/srd-monsters.js` | ~150 deutsche SRD-Statblocks, lazy-cached | core |
| `features/bestiary/bestiary-render.js` | Liste + Detail-Panel; Badge; Favoriten-Stern | features |
| `features/bestiary/bestiary-crud.js` | Anlegen/Bearbeiten/Löschen eigener Kreaturen | features |
| `features/bestiary/bestiary-editor.js` | Vollständiges Statblock-Formular (Superset) | features |
| `features/bestiary/bestiary-actions.js` | „Zu Encounter" / „Zur Initiative"; Favoriten-Toggle | features |
| `assets/styles/bestiary.css` | Statblock-Look, Liste, Badges, Editor | CSS |
| `assets/templates/view-bestiary.html` | Tab-HTML-Template | HTML |

**Installation:** Kein neues npm-Paket nötig.

---

## Paket-Legitimations-Audit

> Keine externen Pakete werden für diese Phase installiert. Alle Bestandteile sind bereits im Projekt vorhanden oder werden als neue JS/CSS/HTML-Quelldateien erstellt.

**Pakete hinzugefügt:** keine.

---

## Architektur-Muster

### System-Architektur-Diagramm

```
Nutzer-Interaktion (Bestiary-Tab)
         │
         ▼
┌────────────────────────────────────┐
│  bestiary-render.js                │
│  ├── getSRDMonsters() [lazy]        │──── core/srd-monsters.js (statisch, nie in D)
│  ├── D.bestiary[] [User-Daten]      │──── D (localStorage + IndexedDB)
│  ├── applyFilters() [Name/CR/Typ]   │──── utils/filter-engine.js
│  ├── VirtualScroll.create()         │──── ui/virtual-scroll.js
│  └── renderBestiaryDetail()         │
│       ├── rollQrefDice() [Würfel]   │──── systems/spellslots/quick-reference.js
│       └── sanitizeHTML() [Traits]  │──── utils/basic.js
└────────────────────────────────────┘
         │
    Nutzer-Aktion
         │
    ┌────┴────────────────────────────┐
    │                                  │
    ▼                                  ▼
┌──────────────────┐        ┌──────────────────────┐
│  bestiary-crud.js │        │ bestiary-actions.js  │
│  (Eigene CRUD)    │        │                      │
│  saveUndoState()  │        │ addBestiaryToInit()  │──── addCalculatorToInitiative()-Mechanik
│  D.bestiary[]     │        │ addBestiaryToEnc()   │──── D.encounters[]
│  deleteWithConfirm│        │ toggleFavorite()     │──── D.bestiaryFavorites[]
└──────────────────┘        └──────────────────────┘
```

### Empfohlene Projektstruktur (neue Dateien)

```
core/
└── srd-monsters.js          # Statische SRD-Daten, lazy-cached (wie srd-spells.js)

features/bestiary/
├── bestiary-render.js       # Liste + Detail-Panel, Badges, Favoriten
├── bestiary-crud.js         # CRUD eigener Kreaturen + Undo
├── bestiary-editor.js       # Vollständiges Statblock-Formular
└── bestiary-actions.js      # Zu-Encounter/Initiative, Favoriten-Toggle

assets/styles/
└── bestiary.css             # Statblock-CSS, Liste, Editor

assets/templates/
└── view-bestiary.html       # Tab-Template
```

### Muster 1: SRD-Daten — Lazy-Cache-Struktur (analog srd-spells.js)

**Was:** Statische JSON-Daten werden in einem globalen Closure gespeichert und erst beim ersten Zugriff initialisiert.
**Wann verwenden:** Für alle SRD-Monster-Daten, die nie in `D` gespeichert werden.

```javascript
// core/srd-monsters.js
// [SECTION:SRD_MONSTERS]
// SRD 5.1 DE Monster-Datenbank — CC-BY-4.0
// Quelle: Wizards of the Coast / openrpg.de/srd/5e/de/
// Attribution: "Dungeons & Dragons, SRD 5.1 DE" — CC BY 4.0
// Originalquelle: media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_DE.pdf

let _srdMonstersCache = null;

function getSRDMonsters() {
    if (_srdMonstersCache) return _srdMonstersCache;
    _srdMonstersCache = [
        // Goblin
        {
            _id: 'goblin',           // Stabiler Schlüssel für statblockRef + Favoriten
            name: 'Goblin',
            size: 'Klein',
            creatureType: 'Humanoid',
            alignment: 'Neutral Böse',
            cr: '1/4',
            xp: 50,
            ac: 15, acInfo: 'Lederrüstung, Schild',
            hp: 7, hpFormula: '2d6',
            speed: { walk: '9 m' },
            str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
            savingThrows: {},
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
        // ... (weitere Monster)
    ];
    log('[Lazy] SRD_MONSTERS geladen');
    return _srdMonstersCache;
}

window.getSRDMonsters = getSRDMonsters;
```

### Muster 2: Einheitliches Kreatur-Datenmodell (D-04 / D-12)

**Was:** Eigene Kreaturen in `D.bestiary[]` verwenden exakt dasselbe Schema wie SRD-Monster — plus `source: 'custom'`, `id`, `avatar`.
**Wann verwenden:** Immer. Detail-Panel, Klick-Würfe und Übernahme-Funktionen funktionieren für beide Quellen identisch.

```javascript
// Schema für D.bestiary[] Einträge (eigene Kreaturen)
// Muss EXAKT mit dem SRD-Statblock-Schema übereinstimmen
const customCreature = {
    id: nextId('bestiary'),          // Numerische ID (parseEntityId)
    _id: null,                        // null für eigene (nur SRD hat _id)
    source: 'custom',                 // 'srd' (intern) | 'custom'
    name: '',
    size: 'Mittelgroß',
    creatureType: 'Humanoid',
    alignment: '',
    cr: '1',
    xp: 200,
    ac: 10, acInfo: '',
    hp: 10, hpFormula: '2d8+2',
    speed: { walk: '9 m', fly: '', swim: '', climb: '', burrow: '' },
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    savingThrows: {},                 // { str: '+3', dex: true, ... }
    skills: {},                       // { wahrnehmung: '+5', ... }
    damageResistances: [],
    damageImmunities: [],
    conditionImmunities: [],
    senses: [],
    languages: [],
    traits: [],                       // [{ name, desc }]
    actions: [],                      // [{ name, desc }]
    reactions: [],                    // [{ name, desc }]
    legendaryActions: [],             // [{ name, desc, cost }]
    legendaryActionsPerRound: 0,
    avatar: ''                        // URL oder leer; nur für eigene Kreaturen (D-10)
};
```

### Muster 3: Kombinierte Liste (SRD + Eigene) mit Badge (D-08)

**Was:** `renderBestiaryList()` kombiniert SRD-Monster und `D.bestiary[]` zu einer gefilterten Anzeige-Liste.
**Wann verwenden:** Immer wenn die Bestiary-Liste neu gerendert wird.

```javascript
function renderBestiaryList() {
    const container = $('bestiary-list');
    if (!container) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderBestiaryList] Container fehlt');
        }
        return;
    }

    const srdMonsters = getSRDMonsters().map(m => ({ ...m, source: 'srd' }));
    const customMonsters = (window.D.bestiary || []).map(m => ({ ...m, source: 'custom' }));
    const allMonsters = [...srdMonsters, ...customMonsters];

    const filtered = applyFilters(allMonsters, {
        searchText: $('bestiary-search')?.value || '',
        searchFields: ['name', 'creatureType'],
        filters: {
            cr: $('bestiary-filter-cr')?.value || '',
            creatureType: $('bestiary-filter-type')?.value || ''
        },
        customFilter: item => {
            const onlyCustom = $('bestiary-filter-custom')?.checked;
            return onlyCustom ? item.source === 'custom' : true;
        }
    });

    VirtualScroll.create(
        container,
        filtered,
        monster => `
            <div class="bestiary-list-item ${monster.source === 'custom' ? 'custom' : ''}"
                 data-action="bestiary-select"
                 data-id="${monster.source === 'custom' ? monster.id : monster._id}">
                <span class="bestiary-badge ${monster.source}">${monster.source === 'srd' ? 'SRD' : 'Eigen'}</span>
                <span class="bestiary-name">${esc(monster.name)}</span>
                <span class="bestiary-cr">HG ${esc(monster.cr)}</span>
                <span class="bestiary-type">${esc(monster.creatureType)}</span>
                <span class="bestiary-fav ${isBestiaryFavorite(monster) ? 'active' : ''}"
                      data-action="bestiary-toggle-fav"
                      data-id="${monster.source === 'custom' ? monster.id : monster._id}"
                      title="Favorit">★</span>
            </div>
        `,
        52
    );
}
```

### Muster 4: CR-Sortierung und -Anzeige

**Was:** CR als Zeichenkette speichern (passt zu bestehendem `CR_TO_XP` in encounter-calculator.js), für Sortierung numerisch umwandeln.
**Wann verwenden:** Immer wenn CR-Werte verglichen oder sortiert werden.

```javascript
// CR-Bruchwerte korrekt sortieren (bestehendes CR_TO_XP als Referenz)
const CR_SORT_ORDER = {
    '0': 0, '1/8': 0.125, '1/4': 0.25, '1/2': 0.5,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, /* ... 6–30 */
};

function crToSortValue(cr) {
    return CR_SORT_ORDER[String(cr)] ?? parseFloat(cr) ?? 0;
}

// Anzeige im Filter-Dropdown:
// "HG 0", "HG 1/8", "HG 1/4", "HG 1/2", "HG 1", "HG 2", ..., "HG 20+"
```

### Muster 5: „Zur Initiative" — Übernahme-Mechanik (D-14 bis D-17)

**Was:** Aus einem Bestiary-Statblock N Kombattanten mit Auto-Wurf, HP-Variation und `statblockRef` erzeugen.
**Wann verwenden:** Beim Klick auf „Zur Initiative" im Detail-Panel.

```javascript
// features/bestiary/bestiary-actions.js

function addBestiaryToInitiative(monsterId) {
    const monster = getBestiaryMonster(monsterId); // SRD oder Eigen
    if (!monster) return;

    // Mengen-Dialog (D-14)
    const countStr = prompt(`Wie viele "${monster.name}" zur Initiative hinzufügen?`, '1');
    const count = Math.max(1, parseInt(countStr) || 1);

    const D = window.D;
    if (!D.initiative) D.initiative = { combatants: [], currentTurn: 0, round: 1 };

    // DEX-Modifikator aus Attribut berechnen
    const dexMod = Math.floor((monster.dex - 10) / 2);

    for (let i = 0; i < count; i++) {
        // Auto-Init-Wurf (D-15) — analog addCalculatorToInitiative()
        const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;

        // HP-Variation ±10 % (D-15)
        const baseHp = monster.hp;
        const hp = Math.max(1, Math.round(baseHp * (0.9 + Math.random() * 0.2)));

        // Nummerierung (D-16)
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
            xp: monster.xp || 0,
            effects: [],
            // statblockRef (D-17) — Runtime-Feld, keine Migration
            statblockRef: {
                source: monster.source || 'srd',
                id: monster.source === 'custom' ? monster.id : monster._id
            }
        });
    }

    D.initiative.combatants.sort((a, b) => b.initiative - a.initiative);
    window.save();
    window.switchView('initiative');
    if (typeof window.renderInit === 'function') window.renderInit();
    showToast(`${count}× ${monster.name} zur Initiative hinzugefügt`);
}
```

### Muster 6: „Zu Encounter hinzufügen" (D-12, Discretion)

**Was:** Aus einem Statblock einen `D.encounters`-Eintrag erzeugen (Encounter = einzelner Gegner-Eintrag in dieser App).
**Wann verwenden:** Beim Klick auf „Zu Encounter" im Detail-Panel.

```javascript
function addBestiaryToEncounter(monsterId) {
    const monster = getBestiaryMonster(monsterId);
    if (!monster) return;

    const D = window.D;
    saveUndoState('Monster zu Encounter hinzugefügt');

    // Encounter-Eintrag aus Statblock erzeugen (Feld-Mapping auf encounters-crud.js-Schema)
    const enc = {
        id: nextId('encounters'),
        name: monster.name,
        creatureType: monster.creatureType,
        cr: monster.cr,
        ac: monster.ac,
        init: Math.floor((monster.dex - 10) / 2), // DEX-Mod
        hp: monster.hp,
        speed: monster.speed || { walk: '9 m' },
        perception: 10 + (monster.skills?.wahrnehmung ? parseInt(monster.skills.wahrnehmung) : 0),
        languages: monster.languages || [],
        str: monster.str, dex: monster.dex, con: monster.con,
        int: monster.int, wis: monster.wis, cha: monster.cha,
        savingThrows: monster.savingThrows || {},
        resistances: monster.damageResistances || [],
        immunities: monster.damageImmunities || [],
        conditionImmunities: monster.conditionImmunities || [],
        traits: formatTraitsForEditor(monster.traits),   // HTML-String für Rich-Editor
        actions: formatActionsForEditor(monster.actions), // HTML-String für Rich-Editor
        equipment: '',
        skills: formatSkillsForEditor(monster.skills)
        // Reaktionen und Legendäre Aktionen: kein Feld in encounters-Schema → ignorieren
        // (encounters-Schema bleibt unverändert; Bestiary-Editor hat die Felder)
    };

    D.encounters.push(enc);
    window.save();
    if (typeof window.renderEncounters === 'function') window.renderEncounters();
    showToast(`${monster.name} zu Encounter hinzugefügt`);
}
```

### Muster 7: Migration 3.0.0 (D.bestiary[] + D.bestiaryFavorites)

```javascript
// systems/spellslots/version-migration.js — MIGRATIONS ergänzen:
'3.0.0': data => {
    if (!data.bestiary) data.bestiary = [];
    if (!data.bestiaryFavorites) data.bestiaryFavorites = [];
    return data;
}
```

### Muster 8: core/data.js — Schema-Ergänzung

```javascript
// core/data.js — initializeData() ergänzen:
function initializeData() {
    return {
        // ... bestehende Felder ...
        bestiary: [],           // Eigene Kreaturen (CRUD + Undo + Export)
        bestiaryFavorites: []   // Nur ID-Strings/Keys (SRD: '_id', Eigene: numerische id)
    };
}
```

### Anti-Pattern vermeiden

- **KEIN `var D = window.D` in Funktionen** — `const D = window.D` ist korrekt auf Modul-Top-Level verboten; direkt `window.D` verwenden oder auf top-level Modul-Ebene als `var D = window.D` (ohne const/let).
- **NIEMALS SRD-Daten über `saveUndoState()` laufen lassen** — sie dürfen nie in `D` landen.
- **KEIN `innerHTML` mit Statblock-Texten ohne `sanitizeHTML()`** — Traits/Aktionen enthalten bewusst `<b>`-Markup → `sanitizeHTML()` (nicht `esc()`).
- **KEIN doppelter Funktionsname** — vor Anlegen neuer Funktionen per `grep` in allen `features/`, `systems/`, `ui/` prüfen.
- **KEIN `const XYZ = window.XYZ` innerhalb einer Funktion** — führt im Build zu SyntaxError.

---

## Nicht selbst bauen — bestehende Systeme nutzen

| Problem | Nicht bauen | Stattdessen nutzen | Warum |
|---------|-------------|-------------------|-------|
| Filter-/Suchlogik | Eigene filter-Schleifen | `applyFilters()` aus `utils/filter-engine.js` | Single-pass, typsicher, CR-Array-Support |
| Virtuelle Listenansicht | Eigenes Scrolling | `VirtualScroll.create()` | Memory-safe, ab 50 Items automatisch aktiv |
| Würfelklick-Handler | Eigener Dice-Parser | `rollQrefDice(formula)` aus `quick-reference.js` | Bereits vollständig implementiert |
| CRUD-Bestätigung + Undo | Eigenes confirm() | `deleteWithConfirm()` + `afterCrudOperation()` | Konsistente UX, Undo korrekt |
| Portrait-Upload | Eigene URL-Validierung | `showAvatarModal(type, id)` | XSS-geprüft, data:-URLs + https:// |
| HP-Berechnung | Eigene HP-Formel | `getDefaultHPForCR()` aus `encounter-calculator.js` | Bereits für 0–30 CR implementiert |
| CR → XP-Mapping | Eigene Tabelle | `CR_TO_XP` aus `encounter-calculator.js` | Vollständige DMG-Tabelle vorhanden |
| Encounter-Editor-Felder | Neu aufbauen | Bestehende HTML-Felder (`enc-*`) als Basis | Saves, Resistenzen, Immunitäten bereits vorhanden |
| Tab-Registration | `switchView()` if-Kette | `TAB_RENDER_REGISTRY` in `tab-registry.js` | Pflicht per CLAUDE.md-Pattern |
| Build-Modul-Eintragung | Manuell nur loader.js | `build.py` UND `loader.js` synchron | STAB-07-Lesson — CI prüft Sync |

---

## Datengröße-Spike: Empfehlung mit Zahlen

**Messung aus vorhandenen Quellen:**

| Referenzpunkt | Größe | Einheiten |
|--------------|-------|-----------|
| 12 Monster-Templates (monster-templates.js) | 11.121 Bytes | 926 Bytes/Template |
| 76 SRD-Zauber (srd-spells.js) | 40.335 Bytes | 531 Bytes/Zauber |
| Goblin-JSON von openrpg.de API | ~1.800–1.900 Bytes | vollständiger Statblock |

**Hochrechnung für 150 vollständige D-04-Statblocks:**

Die aktuellen Templates haben nur: Name, Typ, CR, AC, HP, Geschwindigkeit, Attribute (String-Format), Sprachen, Traits (String), Aktionen (String). Ein voller D-04-Statblock fügt hinzu: Saves (Objekt), Skills (Objekt), Resistenzen/Immunitäten (Arrays), Sinne (Array), Traits als Objekt-Array, Aktionen als Objekt-Array, Reaktionen, Legendäre Aktionen. Das ist in der Praxis etwa **2×** der Template-Größe für einfache Monster, bis zu **4–5×** für Drachen und Bosse.

| Szenario | Avg/Monster | 150 Monster (roh) | Minifiziert (~65%) |
|----------|------------|-------------------|-------------------|
| Optimistisch (einfache Monster überwiegen) | 1.300 Bytes | 190 KB | **124 KB** |
| Realistisch (gemischte CR-Range mit Drachen) | 1.800 Bytes | 264 KB | **172 KB** |
| Pessimistisch (viele Bosse mit Legendary Actions) | 2.500 Bytes | 366 KB | **238 KB** |

**Vergleich:** `srd-spells.js` mit 76 Zaubern = 40 KB. 76 × (531/531) × 4 ≈ Referenzpunkt.

**Empfehlung: Inline-Einbettung** (wie `core/srd-spells.js`).

Begründung:
- Realistisches Szenario (172 KB minifiziert) liegt **deutlich unter 200 KB**.
- Selbst pessimistisches Szenario (238 KB) überschreitet 200 KB, aber: bei 150 kuratiert ausgewählten Monstern mit Fokus auf häufige Gegner (keine 30 Drachen-Varianten) bleibt der realistische Wert bei ca. 140–175 KB.
- Kein IndexedDB-Overhead, keine Async-Lade-Logik, kein Fallback nötig.
- Lazy-Cache wie bei `srd-spells.js` stellt sicher, dass die Daten erst bei Tab-Öffnung initialisiert werden.
- Falls der kuratierte Bestand später auf 300+ Monster erweitert wird (Phase 5+), ist eine Umstellung auf IndexedDB-Lazy-Load dann die richtige Entscheidung.

**Entscheidungsregel (aus STATE.md/CONTEXT.md):** < 200 KB minifiziert → Inline. Bei 150 Monstern: **Inline**.

---

## Häufige Fallstricke

### Fallstrick 1: Doppelte Funktionsnamen über Module

**Was schief geht:** Neue `renderBestiary()` oder `deleteBestiary()`-Funktion existiert bereits anderswo.
**Warum:** Codebase hat 60+ Module im globalen Scope. Jeder Name muss einmalig sein.
**Vorbeugen:** Vor jeder neuen Funktion `grep -rn "function NAME" features/ systems/ ui/` ausführen.
**Warnsignal:** Build meldet `[DEDUP] Removed duplicate function`.

### Fallstrick 2: SRD-Daten landen in D (oder im Undo-Snapshot)

**Was schief geht:** `D.srdMonsters = getSRDMonsters()` → alle Snapshots enthalten 150+ Statblocks → localStorage-Überlauf.
**Warum:** `saveUndoState()` klont den gesamten `D`-State per `structuredClone()`.
**Vorbeugen:** SRD-Daten IMMER in eigenem Closure halten, nie `D.anything = getSRDMonsters()`.

### Fallstrick 3: `const X = window.X` innerhalb einer Funktion

**Was schief geht:** Im Build werden alle Module konkateniert. `const D = window.D` inside a function → SyntaxError, weil `const D` global bereits existiert.
**Vorbeugen:** Nur `var` auf Modul-Top-Level oder direkter `window.D`-Zugriff in Funktionen.

### Fallstrick 4: `innerHTML` mit Statblock-Texten ohne Sanitisierung

**Was schief geht:** Traits/Aktionen enthalten bewusst `<b>`-Tags. Verwendung von `esc()` würde sie zu `&lt;b&gt;` escapen (kaputte Darstellung). Kein Sanitizing → XSS.
**Lösung:** `sanitizeHTML()` verwenden (erlaubt `<b>`, `<em>`, `<strong>` etc., blockt `<script>`).

### Fallstrick 5: CR-Vergleich als String

**Was schief geht:** `monster.cr > '1/4'` liefert falsches Ergebnis (String-Vergleich).
**Lösung:** `crToSortValue(monster.cr)` für alle numerischen CR-Vergleiche verwenden.

### Fallstrick 6: Tab nicht im TAB_RENDER_REGISTRY registriert

**Was schief geht:** Bestiary-Tab zeigt nach Tab-Wechsel veraltete oder leere Inhalte.
**Lösung:** Eintrag in `systems/tab-registry.js` ist Pflicht vor jedem anderen Implementierungsschritt.
**Warnsignal:** Keine `[TabRegistry] Rendered X() for tab bestiary`-Meldung im DEBUG-Modus.

### Fallstrick 7: `loadMonsterTemplate()`-Knopf zeigt toter Code

**Was schief geht:** Nach der Migration bleiben `monster-templates.js`-Knopf und `loadMonsterTemplate()` im Encounter-Tab aktiv, aber die Templates sind jetzt im Bestiary.
**Lösung:** `loadMonsterTemplate()` auf `openBestiaryForEncounter()` umlenken (oder Knopf entfernen). Kein toter Code zurücklassen.

### Fallstrick 8: Modul-Eintrag fehlt in build.py oder loader.js (aber nicht beiden)

**Was schief geht:** App läuft im dev-Modus (loader.js), schlägt im Prod-Build fehl — oder umgekehrt.
**Lösung:** Jeden neuen Modul-Eintrag in BEIDEN Dateien synchron eintragen. CI prüft den Sync (STAB-07).

---

## Codebeispiele (verifikationsgestützte Muster)

### Anklickbarer Würfelwurf im Statblock (D-09)

```javascript
// Vorbild: rollQrefDice() in systems/spellslots/quick-reference.js:157
// Pattern für Statblock-Render:
function renderClickableDice(text) {
    // Erkennt "+4" (Trefferwürfe) und "1d6+2" (Schadensformeln)
    return text
        .replace(/(\+\d+)/g, '<span class="bestiary-dice" data-action="bestiary-roll-dice" data-value="1d20$1" title="Würfeln">$1</span>')
        .replace(/(\d+d\d+(?:[+-]\d+)?)/g, '<span class="bestiary-dice" data-action="bestiary-roll-dice" data-value="$1" title="Würfeln">$1</span>');
}

// Action-Handler in bestiary-actions.js:
// data-action="bestiary-roll-dice" data-value="1d6+2"
// → rollQrefDice(e.dataset.value)
```

### Favoriten-Toggle-Muster (D-11, analog dice-favorites.js)

```javascript
function toggleBestiaryFavorite(monsterId) {
    const D = window.D;
    if (!D.bestiaryFavorites) D.bestiaryFavorites = [];

    const idStr = String(monsterId);
    const idx = D.bestiaryFavorites.indexOf(idStr);

    saveUndoState('Bestiary-Favorit geändert');
    if (idx > -1) {
        D.bestiaryFavorites.splice(idx, 1);
    } else {
        D.bestiaryFavorites.push(idStr);
    }
    window.saveImmediate();
    renderBestiaryList(); // Nur Liste neu rendern (nicht Detail-Panel)
}

function isBestiaryFavorite(monster) {
    const D = window.D;
    const id = monster.source === 'custom' ? String(monster.id) : monster._id;
    return (D.bestiaryFavorites || []).includes(id);
}
```

### Tab-Registry-Eintrag (Pflicht)

```javascript
// systems/tab-registry.js — TAB_RENDER_REGISTRY ergänzen:
bestiary: {
    renders: ['renderBestiaryList'],
    init: null,
    cleanup: 'cleanupBestiaryEditor'
}
```

---

## Deutsche UI-Texte (Vollständige Referenz)

| Element | Deutscher Text |
|---------|--------------|
| Tab-Button | `🐉 Bestiar` |
| Suchfeld Placeholder | `Monster suchen...` |
| Filter CR-Label | `HG` |
| Filter Typ-Label | `Typ` |
| Filter „Nur Eigene" | `Nur Eigene` |
| Filter „Favoriten" | `Favoriten` |
| Detail-Panel leer | `Wähle ein Monster aus der Liste` |
| Badge SRD | `SRD` |
| Badge Eigene | `Eigen` |
| Button Zur Initiative | `Zur Initiative` |
| Button Zu Encounter | `Zu Encounter` |
| Button Eigene anlegen | `+ Neue Kreatur` |
| Button Bearbeiten | `Bearbeiten` |
| Button Löschen | `Löschen` |
| Mengen-Dialog Titel | `Wie viele %name% zur Initiative hinzufügen?` |
| Mengen-Dialog Default | `1` |
| Favoriten-Stern aktiv | `★` (gold) |
| Favoriten-Stern inaktiv | `☆` |
| Statblock CR-Anzeige | `Herausforderungsgrad %cr% (%xp% EP)` |
| Statblock Saves | `Rettungswürfe` |
| Statblock Skills | `Fertigkeiten` |
| Statblock Resistances | `Schadenswiderstände` |
| Statblock Immunities | `Schadensimmunitäten` |
| Statblock CondImm | `Zustandsimmunitäten` |
| Statblock Senses | `Sinne` |
| Statblock Languages | `Sprachen` |
| Statblock Traits | `Eigenschaften` |
| Statblock Actions | `Aktionen` |
| Statblock Reactions | `Reaktionen` |
| Statblock Legendary | `Legendäre Aktionen` |
| Statblock HP-Formula | `(%formula%)` |
| Editor-Modal Titel (neu) | `Neue Kreatur` |
| Editor-Modal Titel (edit) | `Kreatur bearbeiten` |
| Erfolg: Initiative | `%n%× %name% zur Initiative hinzugefügt` |
| Erfolg: Encounter | `%name% zu Encounter hinzugefügt` |
| Fehler: kein Name | `⚠️ Name erforderlich` |
| Bestätigung Löschen | `"%name%" wirklich löschen?` |
| Attribution-Footer | `Monster: SRD 5.1 DE, CC BY 4.0, Wizards of the Coast` |

---

## Editor-Strategie: Superset-Empfehlung (Claude's Discretion)

**Analyse:** `saveEncounter()` in `encounters-crud.js` liest aus HTML-Formularfeldern (`enc-*`). Es hat bereits: Attribute (str/dex/con/int/wis/cha), Saves, Resistenzen, Immunitäten, Zustandsimmunitäten, Sprachen, Skills, Traits (Rich-Editor), Aktionen (Rich-Editor), Equipment.

**Fehlende Felder für D-04:**
- Legendäre Aktionen (`legendaryActions[]` + `legendaryActionsPerRound`)
- Reaktionen (`reactions[]`)
- Sinne (`senses[]`)
- HP-Formel (`hpFormula`)
- Größe (`size`)
- Ausrichtung (`alignment`)
- AC-Info (`acInfo`)

**Empfehlung: Eigener Bestiary-Editor** (`features/bestiary/bestiary-editor.js`), der NICHT `saveEncounter()` wiederverwendet, aber die identische Feldnamen-Konvention für die überlappenden Felder nutzt.

**Begründung:** `saveEncounter()` ist eng an den Encounter-Tab und dessen DOM-IDs (`enc-*`) gebunden. Eine Zweckentfremdung für den Bestiary-Editor würde:
1. Doppelte DOM-IDs oder Namenskonflikte erzeugen (beide Tabs könnten gleichzeitig im DOM sein).
2. Die Trennung von `D.encounters` und `D.bestiary` verschwimmen lassen.
3. Den `encounters-crud.js`-Code mit Bestiary-Spezial-Cases belasten.

**Besser:** Eigener Editor mit eigenen `bst-*`-Feld-IDs, der intern denselben Feldsatz aufbaut, aber unabhängig gespeichert wird (`saveBestiary()`). Die Rich-Editor-Toolbars können wiederverwendet werden (die Floating-Toolbar ist global, nicht DOM-ID-gebunden).

---

## Schicksal der 12 monster-templates.js-Einträge (Claude's Discretion)

**Empfehlung:** Die 12 Einträge (Goblin, Skelett, Zombie, Ork, Wolf, Bandit, Wache, Kobold, Riesenratte, Kultist, Oger, Troll) werden **Teil des kuratierten SRD-Seeds** in `core/srd-monsters.js` — sie gehören alle ohnehin in die ~150 häufigsten Monster.

**Umsetzung:**
1. Die 12 Templates werden ins neue D-04-Schema überführt (Saves, Skills, Sinne, Reaktionen ergänzen).
2. `loadMonsterTemplate()` wird **umgeleitet** auf `openBestiaryAndSelect(monsterKey)` — der Knopf im Encounter-Tab öffnet das Bestiary im Kontext „Für Encounter auswählen".
3. Alternativ: Der Encounter-Tab-Knopf „Vorlage laden" wird durch „Aus Bestiary" ersetzt.
4. `monster-templates.js` bleibt als Modul erhalten, aber `_monsterTemplatesCache` verweist auf `getSRDMonsters()` (Alias) → kein toter Code, aber keine doppelte Datenhaltung.

---

## Deutsche SRD-Quelle und Lizenz (D-01 — Vollanalyse)

### Befund

**Offizielle Quelle:** Wizards of the Coast veröffentlichte am 26.07.2023 das SRD 5.1 auf Deutsch als PDF: `media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_DE.pdf`

**Lizenz:** Creative Commons Attribution 4.0 International (CC BY 4.0) — identisch mit dem englischen SRD 5.1.

**Maschinenlesbare Umsetzung:** Das Projekt `nesges/SRD-5.1-DE` auf Codeberg (`codeberg.org/nesges/SRD-5.1-DE`) konvertiert das deutsche PDF in HTML, XML, JSON, YAML, LaTeX, Markdown. Die Konversions-Skripte und Ergebnisse stehen unter CC BY 4.0.

**API:** `openrpg.de/srd/5e/de/api/` — **391 Monster** als JSON, XML, HTML etc. abrufbar. Beispiel-Endpunkt: `openrpg.de/srd/5e/de/api/monster/goblin/json`

**Feldsatz der API (verifiziert):**
- `id`, `src`, `name`, `size`, `type`, `alignment`
- `armor-class` (Objekt: value + info)
- `hit-points` (Objekt: value + formula)
- `speeds`, `attributes` (Array mit class/value/modifier)
- `skills`, `senses`, `languages`
- `challenge`, `xp`
- `traits` (Array: name + value), `actions` (Array: name + value)
- Hinweis: Saves, Reaktionen, Legendäre Aktionen teilweise `WORK-IN-PROGRESS` — eigene Kuratierung und Ergänzung beim Einpflegen der 150 Monster nötig.

**Erforderliche Attribution in der App:**
```
Monster: System Reference Document 5.1 DE
© 2023 Wizards of the Coast LLC.
Lizenz: Creative Commons Attribution 4.0 International (CC BY 4.0)
srd5.1 DE: openrpg.de/srd/5e/de | codeberg.org/nesges/SRD-5.1-DE
```

**Anschluss an STAB-11:** Das Lizenz-Audit für SRD-Zauber hat dasselbe Vorgehen etabliert. Dieselbe Attribution-Box in der App (About-Modal oder Bestiary-Footer) erweitern.

### Empfehlung für die Implementierung

Für 150 kuratierte Monster: **Kein API-Aufruf zur Laufzeit** — die Daten werden **einmalig per Skript** aus der API gezogen, ins App-Schema transformiert und in `core/srd-monsters.js` eingebettet. Die App funktioniert danach vollständig offline ohne Netzwerkanfragen.

**Datenbeschaffungs-Workflow (Welle 0 der Planung):**
1. `GET openrpg.de/srd/5e/de/api/monster/` → Liste aller 391 Monster-IDs
2. 150 Monster auswählen (nach CR-Balance und Spieltisch-Häufigkeit)
3. Für jeden Monster-ID: `GET .../monster/{id}/json` → Statblock
4. Schema-Transformation: API-Felder → App-Schema (Saves, Reactions, LegendaryActions manuell ergänzen wo API noch WIP)
5. Einbetten in `core/srd-monsters.js`

---

## Aktueller Technologie-Stand

| Alte Vorgehensweise | Aktuelle Vorgehensweise | Auswirkung |
|--------------------|------------------------|------------|
| Monster-Templates als Proxy-Objekt (kompakt) | Vollständiger D-04-Statblock mit Reactions/LegendaryActions | Phase 4 (INIT-01/02) ohne Datennachrüstung |
| Encounter-Editor als Monster-Quelle | Bestiary als primäre Monster-Quelle | Encounter-Tab integriert sich rück |
| Keine deutsche SRD-Quelle bekannt | Offizieller CC-BY-4.0-Datensatz über openrpg.de | Keine manuelle Übersetzung; nur Kuratierung |
| `loadMonsterTemplate()` für Encounter | `addBestiaryToEncounter()` | Einheitlicher Einstiegspunkt |

**Veraltet/abgelöst:**
- `getMonsterTemplates()`-Funktion: Alias auf `getSRDMonsters()` setzen statt eigene Daten
- Direktes Befüllen der `enc-*`-Felder per `loadMonsterTemplate()`: Weg über Bestiary-Auswahl

---

## Annahmen-Protokoll

| # | Behauptung | Abschnitt | Risiko wenn falsch |
|---|-----------|-----------|---------------------|
| A1 | openrpg.de API liefert alle 391 Monster als JSON-Dateien zum Datenbeschaffungs-Zeitpunkt | SRD-Quelle | Manuellere Transformation aus PDF nötig (Mehraufwand, kein Blocker) |
| A2 | Alle 12 bestehenden Monster-Templates sind in den 391 SRD-Monstern enthalten | Templates-Migration | Ein Template passt nicht → muss als eigene Kreatur oder ohne SRD-Herkunft eingebettet werden |
| A3 | `rollQrefDice()` funktioniert mit beliebigen Würfelformeln ohne Änderung | D-09 | Kleine Anpassung der Formel-Regex nötig |
| A4 | Minifizierter JSON für 150 Monster bleibt unter 200 KB | Datengröße-Spike | Bei Überschreitung: IndexedDB-Lazy-Load-Strategie implementieren (Mehraufwand ca. 1 Welle) |

**Tabelle leer wäre falsch** — alle Annahmen sind minimal und risikoarm.

---

## Offene Fragen

1. **API-Vollständigkeit der Saves und Legendary Actions**
   - Was wir wissen: openrpg.de-API enthält ein WORK-IN-PROGRESS-Flag; Goblin-JSON zeigt keine Saves.
   - Unklar: Wie viele der 150 Ziel-Monster haben vollständige Saves/Reactions/LegendaryActions in der API?
   - Empfehlung: Beim Datenbeschaffungs-Skript (Welle 0) prüfen. Fehlende Felder manuell aus dem deutschen SRD-PDF ergänzen.

2. **Encounter-Editor-Knopf-Entscheidung**
   - Was wir wissen: Zwei Optionen: (a) Knopf „Vorlage laden" bleibt, öffnet jetzt Bestiary-Modal; (b) Knopf wird entfernt.
   - Empfehlung: Option (a) — Rückwärtskompatibilität, kein visueller Bruch für bestehende Nutzer.

---

## Umgebungs-Verfügbarkeit

> Kein neues externes Tool benötigt. Alle Abhängigkeiten sind vorhanden.

| Abhängigkeit | Benötigt von | Verfügbar | Version | Fallback |
|-------------|-------------|-----------|---------|---------|
| Node.js | `npm run test`, `npm run build:dev` | ✓ | — | — |
| Python | `python build.py` | ✓ | — | — |
| Playwright | `npm run test:e2e` | ✓ | — | — |
| Jest | `npm run test` | ✓ | — | — |
| openrpg.de API | Datenbeschaffung (Welle 0, einmalig) | ✓ (HTTP-GET) | — | Manuell aus PDF |

---

## Validierungs-Architektur

### Test-Framework

| Eigenschaft | Wert |
|-------------|------|
| Framework Unit | Jest (jest.config.cjs) |
| Framework E2E | Playwright (playwright.config.js) |
| Schnell-Befehl | `npm run test:unit` |
| Vollständig | `npm run test && npm run test:e2e` |

### Anforderungen → Test-Zuordnung

| Req-ID | Verhalten | Test-Typ | Automatisierter Befehl | Datei vorhanden? |
|--------|----------|---------|------------------------|-----------------|
| BEST-01-SC1 | Suche „Goblin" → Ergebnis sofort, offline (kein Netzwerk) | Smoke/E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Goblin suchen"` | ❌ Welle 0 |
| BEST-01-SC1 | Filter CR „1/4" → nur Goblins/Skeletons etc. | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "CR-Filter"` | ❌ Welle 0 |
| BEST-01-SC1 | Filter Typ „Humanoid" → korrekte Ergebnismenge | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Typ-Filter"` | ❌ Welle 0 |
| BEST-02-SC2 | Neue Kreatur anlegen → erscheint in Liste | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Kreatur anlegen"` | ❌ Welle 0 |
| BEST-02-SC2 | Kreatur bearbeiten → Änderung gespeichert | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Kreatur bearbeiten"` | ❌ Welle 0 |
| BEST-02-SC2 | Kreatur löschen → aus Liste entfernt | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Kreatur loeschen"` | ❌ Welle 0 |
| BEST-02-SC2 | Ctrl+Z nach Löschen → Kreatur wiederhergestellt (Undo) | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Undo loeschen"` | ❌ Welle 0 |
| BEST-03-SC3 | „Zur Initiative" → Kombattant mit korrekter HP und AC | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Zur Initiative"` | ❌ Welle 0 |
| BEST-03-SC3 | „Zu Encounter" → Encounter-Eintrag mit korrekter HP und AC | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Zu Encounter"` | ❌ Welle 0 |
| BEST-01/D-09 | Klick auf Schadensformel → Würfelergebnis erscheint | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Wuerfelklick"` | ❌ Welle 0 |
| Schema | getSRDMonsters() gibt Array mit cr/hp/ac/name zurück | Unit | `npx jest tests/unit/srd-monsters.test.js` | ❌ Welle 0 |
| Schema | D.bestiary Migration 3.0.0 initialisiert leeres Array | Unit | `npx jest tests/unit/migration.test.js -t "3.0.0"` | Partiell (migration.test.js) |

### Messrate

- **Pro Task-Commit:** `npm run test:unit` (< 30 Sekunden)
- **Pro Wellen-Merge:** `npm run test && npm run test:e2e`
- **Phasen-Gate:** Volle Test-Suite grün vor `/gsd:verify-work`

### Welle-0-Lücken

- [ ] `tests/e2e/features/bestiary.spec.js` — alle SC1/SC2/SC3-Szenarien
- [ ] `tests/unit/srd-monsters.test.js` — Schema-Validierung, getSRDMonsters()
- [ ] `tests/unit/migration.test.js` — Migration 3.0.0 (Welle 0 Erweiterung)

---

## Sicherheits-Domäne

### Anwendbare ASVS-Kategorien

| ASVS-Kategorie | Relevant | Standard-Kontrolle |
|----------------|---------|-------------------|
| V2 Authentifizierung | nein | — |
| V3 Session-Verwaltung | nein | — |
| V4 Zugangskontrolle | nein | — |
| V5 Eingabe-Validierung | ja | `sanitizeHTML()` für Statblock-HTML; `esc()` für Nutzernamen/-texte; `parseEntityId()` für alle IDs |
| V6 Kryptografie | nein | — |

### Bekannte Bedrohungsmuster

| Muster | STRIDE | Standard-Mitigierung |
|--------|--------|---------------------|
| XSS in Statblock-Texten | Spoofing/Tampering | `sanitizeHTML()` (erlaubt `<b>`, blockt `<script>`) für alle trait/action-Texte |
| XSS in Nutzereingaben (eigene Kreaturen) | Spoofing | `esc()` für Name, Typ, Alignment; `sanitizeHTML()` für Rich-Text-Felder |
| Prototype Pollution via Statblock-JSON | Tampering | JSON-Daten nie direkt via `Object.assign()` in D kopieren ohne Validierung |
| LocalStorage-Überlauf durch SRD-Daten in D | Denial of Service | SRD-Daten niemals in `D` speichern (Architektur-Constraint) |
| URL-Injektion in Avatar-URL (Portraits) | Tampering | `validateAvatarURL()` aus `systems/avatars.js` — bereits implementiert |

---

## Quellen

### Primär (HIGH — verifiziert)

- `openrpg.de/srd/5e/de/api/` — 391 deutsche SRD-Monster, JSON, CC BY 4.0 [VERIFIED: direkte API-Abfrage]
- `media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_DE.pdf` — offizielle deutsche SRD-PDF [CITED: dnddeutsch.de]
- `codeberg.org/nesges/SRD-5.1-DE` — Quell-Repository der JSON-Konvertierung, CC BY 4.0 [CITED: Codeberg-Seite]
- Codebase-Analyse: `features/encounters/monster-templates.js`, `core/srd-spells.js`, `features/encounter-calculator.js`, `features/initiative.js`, `utils/filter-engine.js`, `ui/virtual-scroll.js`, `systems/spellslots/version-migration.js`, `systems/tab-registry.js` [VERIFIED: direkte Code-Lektüre]

### Sekundär (MEDIUM)

- Datengröße-Kalkulation: Gemessen aus vorhandenen Dateien (11.121 Bytes / 12 Templates; 40.335 Bytes / 76 Zauber) + API-Stichprobe Goblin-JSON (~1.800 Bytes) [VERIFIED: lokale Datei + API-Call]
- `dnddeutsch.de` — Lizenz-Bestätigung CC BY 4.0 [CITED: Website-Inhalt]

### Tertiär (LOW — keine unverifizierten Behauptungen)

— (keine)

---

## Metadaten

**Konfidenz-Übersicht:**

| Bereich | Level | Begründung |
|---------|-------|------------|
| Standardstack | HIGH | 100 % Wiederverwendung; Codebase vollständig gelesen |
| Datengröße-Entscheidung | HIGH | Gemessene Dateigrößen + API-Stichprobe; konservative Kalkulation |
| SRD-Quelle & Lizenz | HIGH | Offizielle WotC-PDF, Codeberg-Repository, API verifiziert |
| Architektur-Muster | HIGH | Direkt aus vorhandenem Code abgeleitet |
| API-Vollständigkeit (Saves/Reactions) | MEDIUM | WIP-Flag in API-Antwort; Stichprobe nur Goblin |
| Validierungsarchitektur | HIGH | Analog bestehendem E2E-Muster (wiki.spec.js) |

**Recherche-Datum:** 2026-06-13
**Gültig bis:** 2026-07-13 (API-Stand kann sich ändern; Kerndaten stabil)
