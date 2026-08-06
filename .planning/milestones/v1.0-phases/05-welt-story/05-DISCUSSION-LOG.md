# Phase 5: Welt & Story - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 5-welt-story
**Areas discussed:** Session-Prep, NPC-Generator, Kalender+Timeline+Reise, Fraktionen & Ruf

---

## Session-Prep (WELT-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Eigener Tab | Neuer Tab + D.sessionPreps[], getrennt von Notizen | ✓ |
| In Sessions integriert | Erweitert sessions.js / D.sessionNotes | |
| Du entscheidest | Claude wählt | |

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy-DM-Vorlage | Feste Abschnitte: Strong Start, Szenen, Hinweise, NPCs, Belohnungen | ✓ |
| Freie Szenenkarten | Nur Strong Start + frei betitelte Karten | |
| Du entscheidest | Claude wählt | |

| Option | Description | Selected |
|--------|-------------|----------|
| Auto aus Quests/Arcs + manuell | Offene Quests & Story-Arcs auto + ergänzbar | ✓ |
| Rein manuell | Freie Liste pro Prep | |
| Aus letzter Prep übernehmen | Offene Punkte der vorigen Prep kopieren | |

| Option | Description | Selected |
|--------|-------------|----------|
| Entity-Links zu NPCs/Orten/Encountern | Nutzt entity-links.js, Klick öffnet Entität | ✓ |
| Nur Rich-Text/Markdown | Freitext ohne Verknüpfungen | |
| Du entscheidest | Claude wählt | |

**User's choice:** Eigener Tab · Lazy-DM-Vorlage · Auto-Fäden aus Quests/Arcs + manuell · Entity-Links
**Notes:** —

---

## NPC-Generator (WELT-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Volk/Spezies | Beeinflusst Namensliste | ✓ |
| Beruf/Rolle | Sofort-Aufhänger | ✓ |
| Aussehen/Merkmal | Markantes Detail | ✓ |
| Stimme/Sprechweise | Dialekt/Tonlage | |

| Option | Description | Selected |
|--------|-------------|----------|
| Eingebaut + optional eigene | Code-Defaults + erweiterbar via D.randomTables | ✓ |
| Nur feste eingebaute | Nicht editierbar | |
| Nur editierbare Random Tables | Alles über D.randomTables | |

| Option | Description | Selected |
|--------|-------------|----------|
| Vor-Filter Volk + Geschlecht | Vor dem Generieren wählbar | ✓ |
| Komplett zufällig | Ein Klick, alles zufällig | |
| Du entscheidest | Claude wählt | |

| Option | Description | Selected |
|--------|-------------|----------|
| Vorschau → Als NPC speichern | Re-Roll + Undo, kein Müll | ✓ |
| Sofort als NPC anlegen | Jeder Klick = gespeicherter NPC | |
| Du entscheidest | Claude wählt | |

**User's choice:** Extra-Felder Volk+Beruf+Aussehen · eingebaut + erweiterbar · Vor-Filter Volk+Geschlecht · Vorschau→Speichern
**Notes:** Stimme/Sprechweise bewusst nicht ausgewählt.

---

## Kalender + Timeline (WELT-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Harptos/Faerûn vorkonfiguriert | 12×30 + Festtage, 1492 DR | ✓ |
| Generischer 12-Monats-Kalender | Neutrale Monatsnamen | |
| Frei konfigurierbar | Eigene Monate/Wochentage | |

| Option | Description | Selected |
|--------|-------------|----------|
| Datum pro Ereignis, chronologisch sortiert | D.calendar.events {datum, titel, beschreibung, typ} | ✓ |
| Freie Reihenfolge, Datum optional | Manuell sortierbar | |
| Du entscheidest | Claude wählt | |

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-Vorschlag aus Reisen & Sessions | Bestätigen/verwerfen | ✓ |
| Rein manuell | Nutzer legt alles selbst an | |
| Du entscheidest | Claude wählt | |

**User's choice:** Harptos-Kalender · Datum pro Ereignis chronologisch · Auto-Vorschläge aus Reisen/Sessions
**Notes:** In-Game-Datum ist geteiltes Substrat mit der Reise.

---

## Reise & Wetter (WELT-04)

| Option | Description | Selected |
|--------|-------------|----------|
| 5e-Standard: Tempo × Gelände | 18/24/30 mi/Tag, schwieriges Gelände halbiert | ✓ |
| Distanz-Eingabe → Tage berechnen | Strecke → Dauer | |
| Beides (Modus wählbar) | Tage marschieren ODER Strecke | |

| Option | Description | Selected |
|--------|-------------|----------|
| Klima + Jahreszeit-Tabelle | Temp/Niederschlag/Wind je Klima & Jahreszeit | ✓ |
| Einfache d20-Wettertabelle | Eine generische Tabelle | |
| Du entscheidest | Claude wählt | |

| Option | Description | Selected |
|--------|-------------|----------|
| Gelände-Tabellen + Chance pro Tag | Eingebaut + erweiterbar via D.randomTables | ✓ |
| Feste eingebaute Tabellen je Gelände | Nicht editierbar | |
| Du entscheidest | Claude wählt | |

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, Kalender automatisch +Reisetage | + optional Timeline-Eintrag | ✓ |
| Nein, Datum bleibt manuell | Reise rechnet nur | |
| Du entscheidest | Claude wählt | |

**User's choice:** 5e-Tempo×Gelände · Wetter Klima+Jahreszeit · Gelände-Begegnungstabellen + Tageschance · Reise rückt Kalender vor
**Notes:** —

---

## Fraktionen & Ruf (WELT-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Benannte Stufen + Zahlenwert | −50..+50 → Feindlich…Verbündet | ✓ |
| Nur benannte Stufen | Durchschalten wie npc.relations | |
| Nur Zahlenwert | Reiner Punktestand | |

| Option | Description | Selected |
|--------|-------------|----------|
| +/- Buttons + Notiz, mit Historie | Grund landet in Ruf-Historie | ✓ |
| Nur direktes Setzen | Keine Historie | |
| Du entscheidest | Claude wählt | |

| Option (Mehrfach) | Description | Selected |
|--------|-------------|----------|
| Beschreibung & Symbol/Icon | Flavor + Icon | ✓ |
| Mitglieder (NPCs verknüpfen) | npc.factionId, Entity-Link | ✓ |
| Sitz/Einflussgebiet (Orte verknüpfen) | Location-Link | ✓ |
| Rivalen/Verbündete (Liste) | Textuell, KEINE visuelle Matrix | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Eigener Tab | Fraktionen-Tab + D.factions[] | ✓ |
| Tab + DM-Screen-Widget | Zusätzliches Ruf-Widget | |
| Du entscheidest | Claude wählt | |

**User's choice:** Benannte Stufen + Zahlenwert · +/- mit Historie · alle Zusatzfelder · eigener Tab
**Notes:** Rivalen/Verbündete bleibt textuell — visuelle Matrix ist v2 (WELT-06).

---

## Claude's Discretion

- Generator-Platzierung/Einstieg (NPC-Tab-Button / Command-Palette-Aktion)
- Konkrete Harptos-Kalenderdaten (Festtage, Wochentage, Mondphasen)
- Tab-Reihenfolge in der Navigation
- Konkrete Default-Tabelleninhalte (Namen, Marotten, Begegnungs-/Wettertabellen)

## Deferred Ideas

- Visuelle Fraktions-Beziehungsmatrix → WELT-06 (v2)
- Horizontale Zoom-Timeline → WELT-07 (v2)
- Fraktions-Ruf pro Charakter → CHAR-04 (v2)
- Große Default-Tabellen per Build-Time-Skript statt Hand-Tippen erzeugen (Umsetzungs-Notiz)
