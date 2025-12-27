# 🚀 Schnellstart - D&D Tracker (Modular)

## 📦 Was ist enthalten?

Sie haben jetzt **zwei Versionen** Ihrer Anwendung:

### 1. **Modulare Version** (Development)
- 📁 Verzeichnis: `dnd-tracker-modular/`
- ✅ Bessere Wartbarkeit
- ✅ Einfacheres Debugging
- ✅ Team-Zusammenarbeit möglich
- ⚠️ Benötigt lokalen Server

### 2. **Gebündelte Version** (Production)
- 📄 Datei: `dist/dnd-tracker-bundled.html`
- ✅ Einzelne Datei
- ✅ Funktioniert offline
- ✅ Kann direkt geöffnet werden
- ⚠️ Schwerer zu warten

## 🏃 Sofort loslegen

### Modulare Version nutzen

```bash
cd dnd-tracker-modular
python3 -m http.server 8000
```

Dann öffnen: `http://localhost:8000`

### Gebündelte Version nutzen

Öffnen Sie einfach `dist/dnd-tracker-bundled.html` im Browser!

## 📊 Vergleich

| Aspekt | Original | Modular | Gebündelt |
|--------|----------|---------|-----------|
| **Dateien** | 1 Datei | 25 Module | 1 Datei |
| **Größe** | 1.2 MB | 1.2 MB | 1.2 MB |
| **Zeilen** | 30,882 | ~30,882 | ~30,882 |
| **Wartbarkeit** | ❌ Schwer | ✅ Gut | ❌ Schwer |
| **Debugging** | ❌ Schwer | ✅ Einfach | ❌ Schwer |
| **Offline** | ✅ Ja | ❌ Nein* | ✅ Ja |
| **Team** | ❌ Schlecht | ✅ Gut | ❌ Schlecht |

*Modulare Version benötigt lokalen Server

## 🔄 Build-Prozess

Wenn Sie die Module ändern, erstellen Sie eine neue gebündelte Version:

```bash
cd dnd-tracker-modular
python3 build.py

# Mit Minifizierung (kleinere Dateien):
python3 build.py --minify
```

## 🛠️ Entwicklungsworkflow

### Neue Features hinzufügen

1. **Modul erstellen**
   ```bash
   # Erstellen Sie z.B. features/new-feature.js
   touch features/new-feature.js
   ```

2. **In loader.js registrieren**
   ```javascript
   const MODULES = [
       // ... andere Module
       'features/new-feature.js',  // ← Hier hinzufügen
       // ...
   ];
   ```

3. **Testen**
   - Öffnen Sie modulare Version im Browser
   - Überprüfen Sie Browser-Konsole auf Fehler

4. **Build erstellen**
   ```bash
   python3 build.py
   ```

### Bugs fixen

1. **Modul identifizieren**
   - Fehler in Browser-Konsole zeigt welches Modul

2. **Direkt bearbeiten**
   - Änderungen in `features/xyz.js` oder anderem Modul

3. **Sofort testen**
   - Browser neu laden (F5)
   - Kein Build nötig während Development!

4. **Production-Build**
   - Erst wenn alles funktioniert: `python3 build.py`

## 📁 Wichtigste Dateien

```
dnd-tracker-modular/
├── index.html           ← Start-Datei (lädt Module)
├── loader.js            ← Definiert Lade-Reihenfolge
├── build.py             ← Erstellt gebündelte Version
├── README.md            ← Vollständige Dokumentation
│
├── assets/
│   ├── styles.css       ← Alle Styles
│   └── body.html        ← HTML-Struktur
│
├── core/                ← Kern-Funktionalität
├── utils/               ← Hilfsfunktionen
├── systems/             ← Spielsysteme (Zauber, Undo, etc.)
├── render/              ← Anzeige-Logik
├── features/            ← Features (Würfel, Shops, etc.)
└── ui/                  ← UI-Komponenten (Events, etc.)
```

## ⚠️ Nächste Schritte empfohlen

### 🎯 Sofort (Priorität HOCH)

Die folgenden Module sind noch **zu groß** und sollten aufgeteilt werden:

1. **render/main.js** (134 KB)
   - Enthält ALLE Render-Funktionen
   - Sollte aufgeteilt werden in:
     - `features/party.js`
     - `features/npcs.js`
     - `features/locations.js`
     - `features/quests.js`
     - `features/loot.js`
     - `features/spells.js`
     - etc.

2. **features/dice.js** (176 KB)
   - Sehr großes Würfel-System
   - Könnte in kleinere Teile aufgeteilt werden

3. **features/shops.js** (122 KB)
   - Komplexes Shop-System
   - Evtl. in UI und Logik trennen

### 🔧 Mittelfristig

- **Inline Event-Handler entfernen**
  - 638 Handler in HTML
  - Auf `data-action` System migrieren
  - In `ui/event-delegation.js` bereits vorbereitet

- **Build-Optimierung**
  - Webpack oder Rollup einrichten
  - Automatische Minifizierung
  - Source Maps für Debugging

### 🚀 Langfristig

- **TypeScript** (optionale Typ-Sicherheit)
- **Tests** (Unit, Integration, E2E)
- **CI/CD** (Automatische Builds)

## 💡 Tipps

### Schnelles Debugging

```javascript
// In Browser-Konsole:
D  // Zeigt alle Daten
APP_CONFIG  // Zeigt Konfiguration
```

### Performance überwachen

```javascript
// In Browser-Konsole:
PerformanceManager.getStats()
```

### Module neu laden

Einfach Browser-Tab neu laden (F5) - Module werden automatisch neu geladen!

## 📚 Weitere Informationen

Lesen Sie `README.md` für:
- Detaillierte Architektur-Dokumentation
- Code-Style-Richtlinien  
- Contribution-Guide
- Vollständige Modul-Liste mit Beschreibungen

## ❓ Probleme?

1. **Modules laden nicht**
   - Lokalen Server gestartet? (`python3 -m http.server`)
   - Browser-Konsole (F12) auf Fehler prüfen

2. **Änderungen werden nicht angezeigt**
   - Hard-Refresh: Strg+Shift+R (Windows) / Cmd+Shift+R (Mac)
   - Browser-Cache leeren

3. **Fehler in Konsole**
   - Modul-Name wird angezeigt
   - Öffnen Sie das entsprechende Modul
   - Zeile und Fehler werden präzise angezeigt

---

**Viel Erfolg mit der modularen Version! 🎲⚔️**
