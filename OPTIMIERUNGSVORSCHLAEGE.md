# D&D Tracker - Weitere Optimierungsvorschläge

## Übersicht nach Priorität

| Priorität | Maßnahme | Aufwand | Nutzen | Status |
|-----------|----------|---------|--------|--------|
| 🔴 Hoch | Veraltete render/main.js löschen | 5 Min | -137 KB | Offen |
| 🔴 Hoch | dice.js Module integrieren | 30 Min | Wartbarkeit | Vorbereitet |
| 🟡 Mittel | shops.js aufteilen | 1 Std | -30 KB, Wartbarkeit | Offen |
| 🟡 Mittel | CSS-Purging | 1 Std | -50-100 KB | Offen |
| 🟡 Mittel | Lazy Loading für Daten | 2 Std | Schnellerer Start | Offen |
| 🟢 Niedrig | TypeScript Migration | 1 Woche | Typsicherheit | Offen |
| 🟢 Niedrig | Unit Tests | 2-3 Tage | Stabilität | Offen |
| 🟢 Niedrig | Service Worker/PWA | 1 Tag | Offline-Modus | Teilweise |

---

## 🔴 Hohe Priorität (Schnelle Gewinne)

### 1. Veraltete render/main.js löschen
**Aufwand:** 5 Minuten | **Ersparnis:** 137 KB

Die Datei `render/main.js` ist veraltet und wurde bereits in 8 separate Module aufgeteilt:
- render-dashboard.js
- render-party.js
- render-npcs.js
- render-locations.js
- render-quests.js
- render-encounters.js
- render-loot.js
- render-spells.js

**Aktion:** Datei löschen, da sie nicht mehr im Build verwendet wird.

---

### 2. dice.js Module integrieren
**Aufwand:** 30 Minuten | **Nutzen:** Bessere Wartbarkeit, Code-Splitting möglich

Die Aufteilung wurde bereits vorbereitet (`features/dice-split/`). Module:

| Modul | Zeilen | Größe | Beschreibung |
|-------|--------|-------|--------------|
| dice-core.js | 529 | 20 KB | Würfel-Kernfunktionen |
| maps.js | 575 | 16 KB | Karten-Integration |
| timers.js | 291 | 10 KB | Timer-System |
| srd-spells.js | 137 | 28 KB | SRD-Zauber-Datenbank |
| global-search.js | 249 | 8 KB | Globale Suche |
| debug.js | 1479 | 52 KB | Debug-Funktionen |
| ... | ... | ... | ... |

**Aktion:** Module in Build-System integrieren, Debug-Modul nur in Development laden.

---

## 🟡 Mittlere Priorität

### 3. shops.js aufteilen (124 KB)
**Aufwand:** 1 Stunde | **Nutzen:** Bessere Wartbarkeit

Enthält mehrere unabhängige Systeme:
- Shop-Verwaltung (~40 KB)
- Spell-Editor (~30 KB)
- Wiki-System (~25 KB)
- Mindmap (~20 KB)
- Link-Verwaltung (~10 KB)

---

### 4. CSS-Purging
**Aufwand:** 1 Stunde | **Potenzielle Ersparnis:** 50-100 KB

Aktuelle CSS: 275 KB (9.629 Zeilen)
- 16 Media Queries
- Viele Theme-spezifische Styles

Tools: PurgeCSS oder UnCSS um ungenutzte Selektoren zu entfernen.

---

### 5. Lazy Loading für große Datenstrukturen
**Aufwand:** 2 Stunden | **Nutzen:** Schnellerer App-Start

Kandidaten für Lazy Loading:
- `SRD_SPELLS` (28 KB) - nur bei Zauber-Tab laden
- `MONSTER_TEMPLATES` (6 KB) - nur bei Encounter-Tab laden
- `CR_TO_XP` Tabellen - nur bei Calculator laden

---

## 🟢 Niedrige Priorität (Langfristig)

### 6. innerHTML → Template Literals / DocumentFragment
**Aufwand:** 3-5 Stunden | **Nutzen:** Performance bei großen Listen

Aktuell: 309 innerHTML Zuweisungen

Für Listen mit vielen Einträgen (NPCs, Spells, Loot) könnten DocumentFragments oder Virtual DOM die Performance verbessern.

---

### 7. TypeScript Migration
**Aufwand:** 1 Woche | **Nutzen:** Typsicherheit, bessere IDE-Unterstützung

Schrittweise Migration möglich:
1. tsconfig.json mit `allowJs: true`
2. Neue Features in TypeScript
3. Bestehende Module nach und nach migrieren

---

### 8. Unit Tests
**Aufwand:** 2-3 Tage | **Nutzen:** Stabilität, Refactoring-Sicherheit

Kritische Funktionen für Tests:
- `save()` / `load()`
- `parseDiceFormula()`
- `calculateEncounterDifficulty()`
- `getSpellSlotsForClass()`
- Event-Delegation System

---

### 9. Webpack/Vite Tree-Shaking
**Aufwand:** 1 Tag | **Nutzen:** Automatische Optimierung

Die webpack.config.js existiert bereits. Aktivieren würde ermöglichen:
- Automatisches Tree-Shaking
- Code-Splitting
- Chunk-Loading
- Source Maps für Production

---

## Performance-Metriken zum Tracken

```javascript
// Vorgeschlagene Performance-Messung
const PERF_TARGETS = {
    initialLoad: 1000,      // ms - App-Start
    renderParty: 50,        // ms - Party-Tab rendern
    renderNPCs: 100,        // ms - NPC-Liste (bei 50+ NPCs)
    saveOperation: 200,     // ms - Speichern
    searchResponse: 150     // ms - Globale Suche
};
```

---

## Sofort umsetzbar

Falls gewünscht, kann ich jetzt folgende Optimierungen durchführen:

1. ✅ **render/main.js löschen** (5 Min, -137 KB)
2. ✅ **dice.js Module integrieren** (30 Min)
3. ✅ **Lazy Loading Grundstruktur** (1 Std)

Welche Optimierung soll ich als nächstes umsetzen?
