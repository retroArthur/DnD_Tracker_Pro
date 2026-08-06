# Phase 4: Initiative-Erweiterungen - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 4-initiative-erweiterungen
**Areas discussed:** Statblock-Popup, Legendäre Resistenzen, Legendäre Aktionen, Mob-Modus

---

## Bereichsauswahl

Alle vier identifizierten Graubereiche wurden zur Diskussion gewählt (Mehrfachauswahl): Statblock-Popup, Legendäre Resistenzen, Legendäre Aktionen, Mob-Modus.

---

## Statblock-Popup (INIT-01)

### Darstellung
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Modal-Popup | Zentriertes Overlay, vorhandene Modal-Infrastruktur, passt zum Wort „Popup" im SC | |
| Seitliches Panel | Drawer rechts, Initiative-Liste bleibt sichtbar — Statblock + Kampf gleichzeitig | ✓ |
| Inline aufklappen | Statblock klappt unter der Zeile auf, kompakt aber sprengt bei Bossen die Liste | |

### Auslöser
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Eigener 📖-Button | Dedizierter Button pro Zeile, kein Konflikt mit HP-/Effekt-/Auswahl-Klicks | ✓ |
| Klick auf Kombattant | Wörtlich laut SC1, aber konkurriert mit vorhandenen Zeilen-Interaktionen | |
| Beides | Name-Klick + Button | |

### Kombattanten ohne statblockRef
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Kein Statblock | Button/Popup nur bei Bestiary-Monstern | |
| Nachträglich verknüpfen | Dialog zum Verknüpfen mit Bestiary-Monster anbieten | |
| Basis-Infos zeigen | Panel zeigt HP/AC/Effekte für Spieler/manuelle Einträge | ✓ |

### Klickbare Würfe im Popup
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Ja, wie im Bestiary | Treffer-/Schadensformeln klickbar (renderClickableDice) | ✓ |
| Nur Anzeige | Rein darstellend | |

**Notes:** Der 📖-Button erscheint dadurch bei ALLEN Kombattanten; der Inhalt richtet sich nach Verfügbarkeit von `statblockRef`.

---

## Legendäre Resistenzen (INIT-02)

**Kontext vorab:** Hinweis gegeben, dass Legendäre Resistenzen nach 5e-Regeln pro Tag (Long Rest) sind, nicht pro Runde — im Gegensatz zum Roadmap-SC2, das LR + LA gemeinsam bei Init 20 zurücksetzt.

### Datenquelle
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Auto-Parsen + Override | Regex auf „(N/Tag)" im Trait-Text, manuell korrigierbar | ✓ |
| Nur manuell | DM setzt Anzahl von Hand | |
| Nur Auto-Parsen | Rein automatisch, keine Korrektur-UI | |

### Anzeige
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Auto bei Erkennung | Zähler nur bei erkannter Legendärer Resistenz | ✓ |
| Manuell aktivierbar | DM blendet pro Kombattant ein | |
| Auto + manuell | Beides | |

### Reset-Verhalten
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Kein Auto-Reset (/Tag) | Klickbare Pips, kein Init-20-Reset, regelkonform; Reset per Rast/Knopf | ✓ |
| Reset bei Init 20 | Wie SC2 wörtlich, aber regelwidrig (Boss unbesiegbar gegen Saves) | |
| Reset per Rast-Manager | Reset bei Langer Rast, an Rest-Manager gekoppelt | |

**Notes:** Bewusste, vom Nutzer bestätigte Abweichung vom Roadmap-SC2-Wortlaut. Rest-Manager-Kopplung bleibt als optionale Veredelung (Claude's Discretion).

---

## Legendäre Aktionen (INIT-02)

### Zähler-Modell
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Einfacher Punkte-Zähler | Pips, Klick verbraucht 1 (wie Death-Save-Dots); Details im Statblock-Panel | ✓ |
| Itemisierte Aktionsliste | Aktionsliste mit Punktkosten, Klick zieht Kosten ab | |
| Beides | Pips + optionale Aktionsliste | |

### Anzeige
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Auto bei > 0 | Nur bei legendaryActionsPerRound > 0 | ✓ |
| Auto + manuell | Automatisch + manuell nachrüstbar | |
| Nur manuell | DM aktiviert selbst | |

### Reset-Verhalten
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Auto bei Init 20 | Punkte füllen sich beim Rundenwechsel auf (regelkonform, hängt an nextTurn()) | ✓ |
| Auto + manueller Reset | Runden-Reset + Korrektur-Knopf | |

---

## Mob-Modus (INIT-03)

### Erstellung
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Toggle im Mengen-Dialog | „als Mob führen" im bestehenden Phase-3-Dialog → 1 Mob-Zeile | ✓ |
| Zeilen zusammenfassen | Bestehende Einzelzeilen nachträglich bündeln | |
| Beides | Beim Hinzufügen ODER nachträglich | |

### Pool-HP & Status
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Pool + „X von N am Leben" | Pool-HP = Summe; lebende Kreaturen automatisch berechnet; 0 = besiegt | ✓ |
| Nur eine Pool-Zahl | Gesamt-HP ohne Einzel-Tracking | |

### Sammel-Angriff
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Beide Modi anbieten | Umschaltbar: N-fach-Wurf ODER DMG-Mob-Regel | ✓ |
| DMG-Mob-Regel | Aus Ziel-AC ableiten, wie viele automatisch treffen | |
| Einfacher N-fach-Wurf | Eine Probe, N-mal gewertet | |

### Schaden
| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Auto summieren | App würfelt/summiert Schaden der Treffer automatisch (klickbarer Roller) | ✓ |
| Nur Trefferanzahl | App zeigt nur Treffer, DM würfelt Schaden selbst | |

---

## Claude's Discretion

- Genaue deutsche UI-Texte (Button-Tooltip, Panel-Header, Mob-Toggle-Label, Mob-Zeilen-Format, Pip-Labels)
- Panel-Realisierung (eigenes Drawer-Element vs. wiederverwendetes Modal-Gerüst; direkter `renderBestiaryDetail()`-Aufruf vs. schlanke Kopie)
- Exakte DMG-Mob-Regel-Formel (Schwellen-Tabelle d20-Wert → Trefferanteil)
- LR-Reset-Kopplung an Rest-Manager vs. nur manueller Knopf
- Pip-CSS/Optik (Anlehnung an Death-Saves/Concentration)
- Integration Mob-Sonderzeile ↔ Death Saves / Concentration / AoE-Modal / Quick Actions / Conditions (Research-/Planungs-Flag)

## Deferred Ideas

- Itemisierte Legendäre-Aktionsliste mit Punktkosten (zugunsten einfacher Pips zurückgestellt)
- Nachträgliches Verknüpfen von Kombattanten ohne statblockRef mit einem Bestiary-Monster
- Nachträgliches Zusammenfassen bestehender Einzelzeilen zu einem Mob
- LR-Reset an Rest-Manager / Lange Rast koppeln (optionale Veredelung)
