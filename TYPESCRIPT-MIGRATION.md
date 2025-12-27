# TypeScript Migration - D&D Tracker

## Übersicht

Die TypeScript-Migration wurde initiiert. Das Projekt unterstützt jetzt schrittweise Migration mit `allowJs: true`.

## Status

| Kategorie | Status | Dateien |
|-----------|--------|---------|
| **Typdefinitionen** | ✅ Abgeschlossen | 3 Dateien |
| **Utilities** | ✅ Beispiel | 1 von 3 |
| **Features** | ✅ Beispiel | 1 von 25+ |
| **Core** | ⬜ Ausstehend | 0 von 4 |
| **UI** | ⬜ Ausstehend | 0 von 4 |
| **Render** | ⬜ Ausstehend | 0 von 9 |

## Erstellte Dateien

### Typdefinitionen (`types/`)

1. **`entities.d.ts`** - Alle Entity-Typen
   - Character, NPC, Location, Quest, Encounter
   - LootItem, Spell, WikiEntry, Shop
   - Initiative, Combatant, Condition, Effect
   - Tag, Calendar, Settings
   - AppData (Haupt-Datenstruktur)

2. **`globals.d.ts`** - Globale Funktionen
   - DOM-Utilities ($, esc, sanitizeHTML)
   - Storage-Funktionen (save, load, undo, redo)
   - Render-Funktionen (renderAll, renderParty, etc.)
   - Entity-Funktionen (editChar, saveNPC, etc.)
   - UI-Funktionen (showModal, showToast)

3. **`index.d.ts`** - Index & Utility-Typen
   - Re-exports
   - Nullable, Optional, DeepPartial
   - EntityMap, EntityOf

### TypeScript-Module (`src/`)

1. **`src/utils/utilities.ts`** - Utility-Funktionen
   - debounce, throttle, memoize
   - escapeHtml, stripHtml, truncate
   - clamp, randomInt, formatNumber
   - formatDate, getRelativeTime
   - shuffle, groupBy, unique, sortBy
   - deepClone, deepMerge, pick, omit
   - getModifier, getProficiencyBonus
   - parseDiceNotation, rollDice

2. **`src/features/character-service.ts`** - Character-Service
   - CRUD-Operationen
   - HP-Management
   - Spell-Slot-Verwaltung
   - Condition-Handling
   - Berechnungen

## Konfiguration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "allowJs": true,        // JS-Dateien erlauben
    "checkJs": false,       // Keine JS-Prüfung
    "strict": false,        // Anfangs locker
    "noImplicitAny": false, // Später aktivieren
    "outDir": "./dist/ts",
    "paths": {
      "@core/*": ["src/core/*"],
      "@features/*": ["src/features/*"],
      "@ui/*": ["src/ui/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

## Migrations-Strategie

### Phase 1: Typdefinitionen (✅ Abgeschlossen)
- Alle Entity-Typen definiert
- Globale Funktionen deklariert
- D-Variable typisiert

### Phase 2: Utilities (Begonnen)
- [ ] utils/basic.js → basic.ts
- [x] utils/utilities.js → utilities.ts
- [ ] utils/performance.js → performance.ts

### Phase 3: Core
- [ ] core/config.js → config.ts
- [ ] core/constants.js → constants.ts
- [ ] core/data.js → data.ts
- [ ] core/init.js → init.ts

### Phase 4: Features (Begonnen)
- [x] CharacterService (NEU)
- [ ] render-party.js → character-ui.ts
- [ ] render-npcs.js → npc-ui.ts
- [ ] etc.

### Phase 5: UI-Komponenten
- [ ] event-delegation.js → event-delegation.ts
- [ ] lazy-loading.js → lazy-loading.ts
- [ ] virtual-scroll.js → virtual-scroll.ts

### Phase 6: Strenge Typen aktivieren
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

## Verwendung

### TypeScript kompilieren

```bash
# TypeScript installieren (bereits erledigt)
npm install --save-dev typescript @types/node

# Kompilieren
npx tsc

# Watch-Modus
npx tsc --watch
```

### In bestehenden Code importieren

```javascript
// In JavaScript-Dateien (nach Kompilierung):
// import { CharacterService } from './dist/ts/features/character-service';

// Oder direkt mit ts-node:
// import { CharacterService } from './src/features/character-service';
```

## Vorteile der Migration

1. **Typsicherheit** - Fehler zur Compile-Zeit statt Runtime
2. **IDE-Unterstützung** - Bessere Autovervollständigung
3. **Dokumentation** - Typen als lebende Dokumentation
4. **Refactoring** - Sicheres Umbenennen/Verschieben
5. **API-Klarheit** - Klare Schnittstellen

## Bekannte Einschränkungen

1. **Build-System** - Noch nicht in build.py integriert
2. **Browser-Kompatibilität** - Kompilierung nötig
3. **Globale Variablen** - D, APP_CONFIG etc. sind global

## Nächste Schritte

1. ⬜ Weitere Utilities migrieren
2. ⬜ Core-Module konvertieren
3. ⬜ Build-System anpassen
4. ⬜ Tests hinzufügen
5. ⬜ Strenge Typen aktivieren

## Befehle

```bash
# TypeScript prüfen
npx tsc --noEmit

# Nur Typen prüfen (ohne Output)
npx tsc --noEmit --pretty

# Kompilieren
npx tsc

# Watch-Modus
npx tsc -w
```

## Ressourcen

- [TypeScript Dokumentation](https://www.typescriptlang.org/docs/)
- [Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [tsconfig Reference](https://www.typescriptlang.org/tsconfig)
