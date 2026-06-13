# Phase 3: Bestiary - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 3-bestiary
**Areas discussed:** SRD-Umfang & Sprache, Darstellung & Tab-Aufbau, Übernahme Encounter/Initiative

---

## SRD-Umfang & Sprache

### Sprache der Statblocks

| Option | Description | Selected |
|--------|-------------|----------|
| Deutsch durchgängig | Namen + alle Texte auf Deutsch, konsistent mit Zaubern/Templates; Übersetzungen beim Implementieren | ✓ |
| Hybrid: Namen DE, Texte EN | Deutsche Namen, englische Trait-/Aktionstexte; schnellste Abdeckung, lizenzklar | |
| Englisch komplett | 1:1 aus engl. SRD; minimaler Aufwand, bricht mit deutscher UI | |

**User's choice:** Deutsch durchgängig
**Notes:** Konsistenz mit den 76 deutschen SRD-Zaubern und 12 Monster-Templates wiegt schwerer als der Übersetzungsaufwand. Research prüft Community-Quellen (dnddeutsch.de) auf Brauchbarkeit/Lizenz.

### Anzahl SRD-Monster

| Option | Description | Selected |
|--------|-------------|----------|
| Kuratiert ~100–150 | Häufigste Monster über alle CR-Stufen, erweiterbar | ✓ |
| Vollständig ~330 | Komplettes SRD-Verzeichnis; größerer Aufwand, Richtung IndexedDB | |
| Klein ~40–60 | Nur Low/Mid-Level; schnell, aber lückenhaft | |

**User's choice:** Kuratiert ~100–150
**Notes:** Vollbestand als deferred idea festgehalten.

### Regelstand / Quelle

| Option | Description | Selected |
|--------|-------------|----------|
| SRD 5.1 / 2014er | Klassische Statblocks, passt zu Templates + deutschen Quellen | ✓ |
| SRD 5.2 / 2024er | Moderner Stand, kaum deutsche Übersetzungen, Stilbruch | |
| Du entscheidest | Claude wählt nach Research-Lage | |

**User's choice:** SRD 5.1 / 2014er Regeln

### Datentiefe pro Statblock

| Option | Description | Selected |
|--------|-------------|----------|
| Voller SRD-Statblock | Attribute, Saves, Skills, Resistenzen, Sinne, Sprachen, Traits, Aktionen, Reaktionen, Legendäre Aktionen | ✓ |
| Kampfkern wie Templates | Nur AC/HP/Attribute/Traits/Aktionen; Phase 4 müsste nachrüsten | |

**User's choice:** Voller SRD-Statblock
**Notes:** Bewusst als Fundament für Phase 4 (Statblock-Popup, Legendary-Tracker).

---

## Darstellung & Tab-Aufbau

### Tab-Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Liste + Detail-Panel | Liste links, voller Statblock rechts; Muster wie NPC-Tab | ✓ |
| Karten-Grid + Popup | Karten-Kacheln, Statblock als Popup; mehr Klicks | |
| Sortierbare Tabelle + Detail | Spalten Name/CR/Typ/HP/AC, sortierbar; nüchternster Look | |

**User's choice:** Liste + Detail-Panel

### Statblock-Optik

| Option | Description | Selected |
|--------|-------------|----------|
| Klassischer 5e-Look | Pergament-Optik, rote Überschriften, Trennlinien; vorhandenes CSS | ✓ |
| App-natives Panel | Dunkel/Gold wie NPC-/Encounter-Panels; konsistent, weniger vertraut | |
| Du entscheidest | Claude wählt nach vorhandenem CSS/Aufwand | |

**User's choice:** Klassischer 5e-Look

### Suche & Filter

| Option | Description | Selected |
|--------|-------------|----------|
| Suchleiste + Filter-Chips | Suchfeld oben, CR-/Typ-Filter immer sichtbar | ✓ |
| Nur Suchleiste, Filter ausklappbar | Aufgeräumter, Filter ein Klick weiter weg | |
| Kombinierte Live-Suche | Ein Feld für Name/CR/Typ; minimalistisch, unpräziser | |

**User's choice:** Suchleiste + Filter-Chips

### SRD vs. eigene Kreaturen in der Liste

| Option | Description | Selected |
|--------|-------------|----------|
| Gemischt, mit Herkunfts-Badge | Gemeinsame Liste, Badge SRD/Eigen + Filter „Nur Eigene" | ✓ |
| Getrennte Reiter/Sektionen | Zwei Bereiche; aufgeräumt, aber Suchort muss bekannt sein | |
| Du entscheidest | Claude wählt nach Datenmodell | |

**User's choice:** Gemischt, mit Herkunfts-Badge

### Anklickbare Würfe im Statblock

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, Angriffs-/Schadenwürfe klickbar | Über vorhandenen Dice-Roller; rollQrefDice als Vorbild | ✓ |
| Nein, nur Text | Einfacher; Würfeln separat | |
| Du entscheidest | Claude nach Aufwand/Parsing-Sicherheit | |

**User's choice:** Ja, klickbar

### Monster-Portraits

| Option | Description | Selected |
|--------|-------------|----------|
| Nur bei eigenen Kreaturen | URL-Portrait via avatars.js; SRD bildlos | ✓ |
| Keine Bilder | Reine Text-Statblocks | |
| Optional für alle | Auch SRD; mehr Pflegeaufwand, Offline-Bildquelle unklar | |

**User's choice:** Nur bei eigenen Kreaturen

### Schnellzugriff / Favoriten

| Option | Description | Selected |
|--------|-------------|----------|
| Favoriten-Stern | Anheften/Favoriten-Filter; dice-favorites als Muster | ✓ |
| Keine Favoriten, nur Suche | Schlankste Umsetzung | |
| Zuletzt verwendet automatisch | Automatische Schnellzugriffsleiste | |

**User's choice:** Favoriten-Stern
**Notes:** Favoriten als reine ID/Key-Liste im User-State (D.bestiaryFavorites), nie SRD-Daten kopieren.

---

## Übernahme Encounter/Initiative

### Menge beim Hinzufügen

| Option | Description | Selected |
|--------|-------------|----------|
| Mengen-Dialog beim Hinzufügen | Dialog fragt Anzahl, fügt in einem Rutsch hinzu; addMonster-Mechanik | ✓ |
| Einzeln, mehrfach klicken | Simpler, aber lästig bei vielen | |
| Anzahl-Feld direkt am Eintrag | Ohne Extra-Dialog, mehr UI in der Liste | |

**User's choice:** Mengen-Dialog beim Hinzufügen

### Initiative-Wurf & HP

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-Wurf + HP-Variation, wie Calculator | 1d20+Bonus je Exemplar, HP ±10 %; addMonster-Verhalten | ✓ |
| Auto-Wurf, feste Durchschnitts-HP | Initiative gewürfelt, HP = Statblock-Wert | |
| Nichts automatisch | Initiative 0, Statblock-HP, manuell würfeln | |

**User's choice:** Auto-Wurf + HP-Variation, wie Calculator

### Nummerierung gleicher Monster

| Option | Description | Selected |
|--------|-------------|----------|
| Automatisch nummeriert | „Goblin 1", „Goblin 2" … | ✓ |
| Gleicher Name, separate Zeilen | Simpel, schwerer zuzuordnen | |
| Du entscheidest | Claude wählt Schema | |

**User's choice:** Automatisch nummeriert

### Statblock-Referenz am Kombattanten

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, Referenz speichern | Combatant merkt sich Bestiary-Herkunft (statblockRef); Fundament Phase 4; Runtime-Feld | ✓ |
| Nur Werte kopieren | Nur HP/AC/Name; Phase 4 müsste neu zuordnen | |
| Du entscheidest | Claude wählt technisch sauberste Verknüpfung | |

**User's choice:** Ja, Referenz speichern

---

## Claude's Discretion

- Editor für eigene Kreaturen: Wiederverwendung/Erweiterung des Encounter-Statblock-Formulars (`saveEncounter`) als Superset vs. eigener Editor — Empfehlung: gemeinsames Superset-Formular.
- „Zu Encounter hinzufügen"-Verdrahtung (BEST-03): Mapping Bestiary-Monster → `D.encounters`-Eintrag.
- Schicksal der 12 `monster-templates.js`-Einträge — Empfehlung: in den kuratierten SRD-Seed überführen, `loadMonsterTemplate`-Knopf entfernen/umlenken.
- Datengröße-Spike (pruned+minified messen: <200 KB inline, ≥200 KB Index+IndexedDB-Lazy-Load).
- Daten-Repräsentation der SRD-Statblocks (Lazy-Proxy-Muster), CR-Sortier-/Anzeigeformat, Badge-Gestaltung, alle exakten deutschen UI-Texte.

## Deferred Ideas

- Erweiterung auf den vollständigen SRD-Monsterbestand (~330) — spätere Ausbau-Phase.
- Statblock-Popup (INIT-01), Legendary-Tracker (INIT-02), Mob-Modus (INIT-03) — bereits Phase 4; Phase 3 liefert nur die Datengrundlage.
