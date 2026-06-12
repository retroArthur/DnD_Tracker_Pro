<div align="center">

# D&D Kampagnen-Tracker Pro

**Ein vollwertiger D&D 5e Kampagnen-Manager - komplett offline im Browser**

[![Version](https://img.shields.io/badge/version-2.6.1-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![CI](https://github.com/retroArthur/DnD_Tracker_Pro/actions/workflows/ci.yml/badge.svg)](https://github.com/retroArthur/DnD_Tracker_Pro/actions)
[![Size](https://img.shields.io/badge/size-1.72MB-orange.svg)]()
[![Language](https://img.shields.io/badge/language-German-yellow.svg)]()
[![Platform](https://img.shields.io/badge/platform-Browser-purple.svg)]()

[Features](#-features) | [Installation](#-installation) | [Tastenkuerzel](#-tastenkuerzel) | [Entwicklung](#-entwicklung)

</div>

---

## Highlights

| | Feature | Beschreibung |
|---|---------|--------------|
| | **Offline-First** | Laeuft komplett im Browser - kein Server noetig |
| | **Single-File** | Eine HTML-Datei, fertig zum Einsatz |
| | **LocalStorage** | Alle Daten bleiben lokal auf deinem Geraet |
| | **Undo/Redo** | Vollstaendige Rueckgaengig-Funktion |
| | **PWA-Ready** | Installierbar als Desktop-App |

---

## Features

### Kampf & Initiative

| Feature | Beschreibung |
|---------|--------------|
| **Initiative Tracker** | Automatische Sortierung, Rundenanzeige, aktiver Kaempfer |
| **Death Saves** | Todes-Rettungswuerfe mit Auto-Stabilisierung |
| **Konzentration** | Tracker mit DC-Berechnung bei Schaden |
| **AoE-Schaden** | Flaechenschaden auf mehrere Ziele mit Save-Option |
| **Quick Actions** | Dodge, Dash, Hide, Help, Ready etc. mit einem Klick |
| **Terrain-Modifikatoren** | Normal, Schwierig, Gefaehrlich, Extrem |
| **Lair Actions** | +25% XP, Erinnerung bei Initiative 20 |

### Encounter Calculator

| Feature | Beschreibung |
|---------|--------------|
| **CR-Berechnung** | Automatische Schwierigkeitsbestimmung |
| **Gruppen-Multiplikator** | Nach offiziellen D&D 5e Regeln |
| **XP-Verteilung** | Pro Spieler und gesamt |
| **Monster zu Initiative** | Direkt mit gewuerfelter Initiative & HP-Variation |

### Party Management

| Feature | Beschreibung |
|---------|--------------|
| **Charakterverwaltung** | HP, AC, Spell Slots, Hit Dice |
| **Party-Uebersicht** | Passive Perception, AC-Range, HP-Status |
| **Rast-System** | Kurz- und Langrast mit automatischer Heilung |
| **Spell Slots** | Verbrauch und Regeneration tracken |
| **Zustaende** | Alle D&D 5e Conditions mit Beschreibung |

### Wiki & Notizen

| Feature | Beschreibung |
|---------|--------------|
| **Wiki-System** | Verknuepfte Eintraege mit [[Wiki-Links]] |
| **Rich-Text Editor** | Formatierung, Tabellen, Listen |
| **Vorlese-Texte** | 6 Stile fuer boxed text (Pergament, Karmesin, etc.) |
| **Entity-Links** | Verknuepfungen zu NPCs, Orten, Quests |
| **Tags & Suche** | Kategorisierung und Filterung |

### NPCs & Beziehungen

| Feature | Beschreibung |
|---------|--------------|
| **NPC-Datenbank** | Name, Beruf, Ort, Notizen |
| **Beziehungssystem** | Freundlich / Neutral / Feindlich |
| **Popup-Karten** | Schnellansicht beim Hover |
| **Interaktions-Log** | Vergangene Begegnungen dokumentieren |

### Weitere Features

| Kategorie | Features |
|-----------|----------|
| **Orte** | Hierarchische Struktur, Tags, Beschreibungen |
| **Quests** | Status-Tracking, verknuepfte NPCs/Orte |
| **Loot** | Items, Gold-Verteilung, Party-Inventar |
| **Shops** | Haendler mit Inventar, Handout-Export (HTML/Print) |
| **Zauber** | SRD-Datenbank, Filter nach Klasse/Stufe/Schule |
| **Wuerfel** | d4-d100, Vorteil/Nachteil, History, Floating Panel |
| **Timer** | Session-Timer, Custom-Timer |
| **Zufallstabellen** | Eigene Tabellen mit Gewichtung |
| **Sessions** | Session-Notizen und -Log |
| **DM Screen** | Widget-Dashboard mit 21 Widgets und Profilen |
| **Markdown** | Live-Shortcuts, Import/Export, Render-on-Display |
| **Kampagnen** | Mehrere Kampagnen mit getrennten Daten |

---

## Installation

### Schnellstart (Empfohlen)

```bash
# Einfach die fertige HTML-Datei oeffnen:
dist/dnd-tracker-bundled.html
```

Keine Installation noetig - laeuft direkt im Browser!

### Von GitHub

```bash
git clone https://github.com/retroArthur/DnD_Tracker_Pro.git
cd DnD_Tracker_Pro

# App oeffnen
start dist/dnd-tracker-bundled.html   # Windows
open dist/dnd-tracker-bundled.html    # macOS
xdg-open dist/dnd-tracker-bundled.html # Linux
```

---

## Tastenkuerzel

| Taste | Aktion |
|-------|--------|
| `1-9` | Tab wechseln |
| `Strg+Z` | Rueckgaengig |
| `Strg+Y` | Wiederholen |
| `Strg+S` | Speichern |
| `Strg+K/F` | Globale Suche |
| `R` | Schneller d20-Wurf |
| `T` | Session-Timer |
| `L` | Event-Log (persistent) |
| `/` | Quick Reference oeffnen |
| `?` | Tastenkuerzel anzeigen |
| `N` | Naechster Zug (Initiative) |
| `P` | Vorheriger Zug |
| `Space` | Naechster Zug |
| `Escape` | Overlays schliessen |

---

## Entwicklung

### Build

```bash
# Development Build (lesbar)
python build.py

# Production Build (minifiziert, Debug aus)
python build.py --production

# Mit npm
npm run build        # Production
npm run build:dev    # Development
```

### Projektstruktur

```
dnd-tracker-modular/
├── core/           # Config, Constants, Init
├── utils/          # DOM-Helpers, Performance
├── systems/        # Undo, Backups, Tags, Conditions
├── features/       # Alle Feature-Module
│   ├── party/      # Charakterverwaltung
│   ├── npcs/       # NPC-System
│   ├── encounters/ # Begegnungen
│   ├── locations/  # Orte
│   ├── quests/     # Quest-System
│   ├── shops/      # Shops, Wiki, Sessions
│   └── dice/       # Wuerfel, Timer, Maps
├── ui/             # Event Delegation, Actions
├── render/         # Render-Helpers
├── assets/         # CSS, HTML Template
└── dist/           # Build Output
```

### Tests

```bash
npm run test        # Unit Tests (Jest)
npm run test:e2e    # E2E Tests (Playwright)
npm run lint        # ESLint
npm run typecheck   # TypeScript Validation
```

---

## Technologie

- **Frontend**: Vanilla JavaScript (kein Framework)
- **Styling**: Custom CSS mit CSS Variables
- **Storage**: LocalStorage
- **Build**: Python (`build.py`)
- **Tests**: Jest + Playwright
- **CI/CD**: GitHub Actions

---

## Lizenz & Attribution

**App-Code:** MIT License — siehe [LICENSE](LICENSE)

**SRD-Inhalte:** Diese App enthält Regelinhalte (Zauberbeschreibungen) aus dem System Reference Document 5.1 ("SRD 5.1") von Wizards of the Coast LLC. Das SRD 5.1 steht unter der Creative Commons Attribution 4.0 International License (CC-BY-4.0).

> This application includes content from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at https://creativecommons.org/licenses/by/4.0/.

Weitere Details: [docs/srd-license.md](docs/srd-license.md)

---

<div align="center">

**Made with :heart: for D&D 5e**

[Nach oben](#dd-kampagnen-tracker-pro)

</div>
