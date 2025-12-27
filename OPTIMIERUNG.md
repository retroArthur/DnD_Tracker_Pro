# D&D Tracker - Performance Optimierung v2.7

## Zusammenfassung

| Build | Größe | Reduktion |
|-------|-------|-----------|
| Development (vorher) | 1.42 MB | - |
| Development (aktuell) | 1.18 MB | -17% |
| **Production (optimiert)** | **798 KB** | **-44%** |

## Durchgeführte Optimierungen

### 1. Veraltete Dateien entfernt ✅
- `render/main.js` (137 KB) - war bereits aufgeteilt
- `features/dice.js` (179 KB) - ersetzt durch Module
- `features/shops.js` (124 KB) - ersetzt durch Module

### 2. dice.js → 16 Module ✅
Monolith aufgeteilt in wartbare Einheiten:

| Modul | Größe | Beschreibung |
|-------|-------|--------------|
| dice-core.js | 20 KB | Würfel-Kernfunktionen |
| timers.js | 11 KB | Timer-System |
| maps.js | 16 KB | Karten-Integration |
| srd-spells.js | 28 KB | SRD-Zauber (Lazy) |
| global-search.js | 8 KB | Globale Suche |
| monster-templates.js | 7 KB | Vorlagen (Lazy) |
| debug.js | 34 KB | Nur Development |
| ... | ... | ... |

### 3. shops.js → 7 Module ✅
Aufgeteilt nach Funktionalität:

| Modul | Zeilen | Größe | Beschreibung |
|-------|--------|-------|--------------|
| shops-core.js | 859 | 37 KB | Shop-System |
| spell-editor.js | 918 | 35 KB | Zauber-Editor |
| wiki.js | 553 | 20 KB | Wiki-System |
| mindmap.js | 714 | 23 KB | Netzwerk-Visualisierung |
| sessions.js | 105 | 4 KB | Session Notes |
| links.js | 128 | 4 KB | Link-Verwaltung |

### 4. CSS-Purging ✅
Ungenutzte CSS-Selektoren entfernt:
- Original: 275 KB
- Gepurged: 234 KB
- Minifiziert: 150 KB
- **Ersparnis: 45%**

### 5. Lazy Loading ✅
Große Datenstrukturen werden erst bei Bedarf geladen:

```javascript
// SRD_SPELLS (28 KB) - geladen bei loadSRDSpells()
let _srdSpellsCache = null;
function getSRDSpells() {
    if (_srdSpellsCache) return _srdSpellsCache;
    _srdSpellsCache = [...];
    return _srdSpellsCache;
}

// MONSTER_TEMPLATES (7 KB) - geladen bei loadMonsterTemplate()
let _monsterTemplatesCache = null;
function getMonsterTemplates() { ... }
```

### 6. Event-Handler Migration ✅
Alle inline `onclick` zu `data-action` migriert:
- 20 onclick Handler → data-action
- CSP-kompatibel
- Zentrale Event-Verwaltung

### 7. Debug-Code-Entfernung (Production) ✅
- console.log/debug/info entfernt
- debugLogAdd() Aufrufe entfernt
- Debug-Sektionen entfernt
- debug.js nicht in Production geladen
- **Ersparnis: ~50 KB**

## Build-Befehle

```bash
# Development Build (mit Debug)
python3 build.py

# Production Build (optimiert)
python3 build-production.py

# CSS-Purging erneuern
python3 tools/purge-css.py
```

## Modul-Struktur

```
features/
├── dice/                    # 16 Module
│   ├── dice-core.js         # Würfel-Kern
│   ├── timers.js            # Timer
│   ├── maps.js              # Karten
│   ├── srd-spells.js        # Lazy SRD-Daten
│   ├── monster-templates.js # Lazy Vorlagen
│   ├── debug.js             # Nur Development
│   └── ...
├── shops/                   # 7 Module
│   ├── shops-core.js        # Shop-System
│   ├── spell-editor.js      # Zauber-Editor
│   ├── wiki.js              # Wiki
│   ├── mindmap.js           # Mindmap
│   └── ...
├── render-*.js              # 8 Render-Module
├── encounter-calculator.js
└── initiative.js

dist/
├── dnd-tracker-bundled.html    # 1.18 MB (Development)
└── dnd-tracker-production.html # 798 KB (Production)
```

## Tools

| Tool | Beschreibung |
|------|--------------|
| `build.py` | Development-Build mit Debug |
| `build-production.py` | Optimiertes Production-Bundle |
| `tools/purge-css.py` | CSS-Purging |
| `tools/split-dice.py` | dice.js Modul-Splitter |
| `tools/split-shops.py` | shops.js Modul-Splitter |

## Weitere Möglichkeiten

### Kurz-/Mittelfristig
- [ ] Webpack/Vite für Tree-Shaking
- [ ] spellslots.js aufteilen (55 KB)
- [ ] render-npcs.js optimieren (41 KB)

### Langfristig
- [ ] Service Worker für Offline-Modus
- [ ] IndexedDB statt localStorage
- [ ] TypeScript Migration

## Version
- Aktuell: v2.7.0
- Letzte Optimierung: 2024-12-26
