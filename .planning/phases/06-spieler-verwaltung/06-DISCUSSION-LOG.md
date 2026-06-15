# Phase 6: Spieler-Verwaltung - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 06-spieler-verwaltung
**Areas discussed:** Inspiration-Bedienung, Skills/Saves/Angriffe; CHAR-01 (XP/Milestone) per Default-Übernahme gelockt

---

## Bereichsauswahl (Gray Areas)

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| XP & Levelaufstieg | XP-/Milestone-Modus, Level-Hinweis vs. Auto-Bump, Gruppen-XP-Verteilung | |
| Encounter → XP-Übernahme | Abschluss-Trigger (Initiative/Encounters), Auto-Summe vs. manuell | |
| Inspiration-Bedienung | Klick-Toggle + Ort, binär vs. zählbar | ✓ |
| Skills, Saves & Angriffe | 18 Skills + Expertise, klickbare Würfe, Angriffsmodell, Heimat | ✓ |

**Notes:** XP & Encounter-XP wurden nicht zur Diskussion gewählt → am Ende per bestätigtem Default-Vorschlag gelockt (siehe unten).

---

## Inspiration-Bedienung

**Frage 1 — Ort des Klick-Toggles:**

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Stern auf der Karte | Klickbarer ⭐ in der Karten-Kopfzeile, `-stop`-Handler | ✓ |
| Eigene Pille im Karten-Body | Klickbare „Inspiration"-Pille neben RK/Init/Tempo/Wahr | |
| In der Quick-Stats-Leiste | Sterne je Charakter in `renderPartyOverview` | |

**Frage 2 — Datenmodell:**

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Binär An/Aus | Bleibt `inspiration`-Boolean, keine Migration, 5e-RAW | ✓ |
| Zählbar (0…n) | Migration Boolean→Zahl, mehr UI, weicht von RAW ab | |

**User's choice:** Stern auf der Karte + Binär An/Aus.
**Notes:** Stern muss immer sichtbar sein (gefüllt = an / Umriss = aus), damit auch das Vergeben per Klick geht. Toggle als reguläre `save()`-Mutation ohne Undo (Claude-Detail, vom Muster der HP-Edits abgeleitet).

---

## Skills, Saves & Angriffe

**Frage 1 — Skill-Umfang:**

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| 18 Skills + Expertise | Alle 18 + optionales Expertise-Häkchen | ✓ |
| 18 Skills, ohne Expertise | Nur einfache Übung | |
| 18 + Expertise + Jack-of-all-Trades | Zusätzlich Barden-JoAT | |

**Frage 2 — Würfel-Mechanik:**

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Klick = Wurf + Adv/Disadv-Buttons | W20+Mod+Übung(×2 Expertise), Vorteil/Nachteil-Buttons, Skills+Saves+Attribut-Checks klickbar | ✓ |
| Nur normaler Wurf | Ein Klick = ein Wurf, Adv/Disadv separat im Panel | |
| Wurf + Modifier-Klick (Shift/Alt) | Kompakt, aber versteckt | |

**Frage 3 — Angriffsmodell:**

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Freie Angriffsliste + klickbare Würfe | {Name, Bonus, Schaden, opt. Typ}, `renderClickableDice` | ✓ |
| Nur Textnotiz | Freitext ohne strukturierte Würfe | |
| Aus Items/Waffen ableiten | Kein Waffen-/Schadens-Schema im Loot vorhanden | |

**Frage 4 — Heimat / Bearbeitung:**

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Anzeige im Detail-Modal, Edit im Editor | `showCharacterDetails` zeigt; Pflege im Charakter-Formular | ✓ |
| Alles inline im Detail-Modal | Edit direkt im Modal | |
| Eigener Charakterbogen-Tab | Vollansicht (Out-of-Scope-Konflikt) | |

**User's choice:** 18 Skills + Expertise; Klick=Wurf mit Adv/Disadv-Buttons (Skills+Saves+Attribut-Checks); freie Angriffsliste mit klickbaren Würfen; Anzeige im Detail-Modal, Bearbeitung im bestehenden Editor.
**Notes:** Skill→Attribut-Mapping aus vorhandenem `SKILL_INFO` (`core/constants.js:217`), nicht neu definieren. Ergebnisse landen in der bestehenden Würfel-Historie/Event-Log.

---

## CHAR-01: XP/Milestone (per Default-Übernahme gelockt)

**Frage — jetzt besprechen oder Defaults übernehmen:**

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Defaults übernehmen | Vorgeschlagene 5e-Defaults als gelockte Entscheidungen | ✓ |
| Jetzt besprechen | XP/Milestone in gezielten Fragen durchgehen | |
| Bereit für Context | CHAR-01 komplett als Claude's Discretion | |

**User's choice:** Defaults übernehmen → als gelockte Entscheidungen D-07…D-11 in CONTEXT.md.
**Notes:** Beide Aufstiegsarten (XP|Milestone), `xp`-Feld + Migration, Abschluss-Trigger in der Initiative mit Auto-Summe via `CR_TO_XP`, Gleichverteilung auf aktive Charaktere, Level = Hinweis (kein Auto-Bump), neue PHB-Level→XP-Tabelle nötig (XP_THRESHOLDS ≠ Aufstiegstabelle).

---

## Claude's Discretion

- Genaue deutsche UI-Texte; exakte Feld-/Schema-Benennung; Platzierung des Abschluss-Buttons (+ optionaler Encounters-Tab-Einstieg); Adv/Disadv-Bedienform; optionaler Inspiration-Überblick in `renderPartyOverview`; Migrationsstrategie; XP-Stand-Darstellung. (Siehe CONTEXT.md § Claude's Discretion.)

## Deferred Ideas

- Fraktions-Ruf pro Charakter → CHAR-04 (v2)
- Jack-of-all-Trades (v1 ausgelassen)
- Angriffe aus Loot-Waffen ableiten (kein Waffen-Schema)
- Inspiration zählbar/stapelbar (5e-RAW-Binär gewählt)
- Zusätzlicher XP-Abschluss-Einstieg im Encounters-Tab (optional)
