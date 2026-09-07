# Handoff: Design-Konsistenz D&D Kampagnen-Tracker Pro

## Auftrag in einem Satz
Die Design-Inkonsistenzen in `dnd-tracker-bundled.html` (bzw. in den modularen Quelldateien, aus denen das Bündel entsteht) beheben — beginnend mit dem sichtbaren Bruch zwischen den Tabs **Orte** und **Kalender**.

## Ausgangslage
Die App ist eine Single-File-/modulare Vanilla-JS-App (kein Framework, kein Build-Step nötig): ein `<style>`-Block mit ~3.729 CSS-Regeln, ein HTML-Body mit 30 `<section class="view">`, ein `<script>`-Block. Sie ist über mehrere Ausbaustufen gewachsen. Dabei sind **zwei parallele CSS-Sprachen** entstanden:

| | Altbestand (12 Views) | „Welt"-Modul (4 Views) |
|---|---|---|
| Views | Party, NPCs, Orte, Quests, Encounter, Bestiar, Truhe, Shops, Zauber, Notizen, Wiki, Links | Session-Prep, Kalender, Reise, Fraktionen |
| Präfixe | `loc- npc- loot- enc- bestiary-` | `wp- tl- rs- fr- npcg-` |
| Tokens | `--bg-card`, `--border`, `--gold` (definiert) | `--surface`, `--radius`, `--space-md` (**nie definiert**) |
| Einheiten | px | rem |
| Ort im DOM | in `<main class="main-content">` | **außerhalb** von `</main>` |

Dazu kommen acht Werkzeug-Views (Start, Würfel, Timer, Initiative, DM Screen, Soundboard, Statistiken, Daten) mit je eigener Kopfzeile ohne `.section-toolbar`.

## Wichtig: Was diese Dateien sind
* `BEFUNDE.md` — der vollständige Auditbericht: 19 Befunde, je mit Belegstelle im Code und empfohlenem Fix. **Das ist die Aufgabenliste.**
* `PATCHES.md` — konkrete, einsetzbare Code-Blöcke für die Befunde mit dem größten Effekt (Welle 1 und 2), jeweils mit Such-Anker statt Zeilennummer.
* `CHECKLISTE.md` — Abnahmekriterien, überprüfbar per `grep`.
* `Design-Konsistenz-Bericht.dc.html` — derselbe Bericht als lesbare HTML-Seite (Design-Referenz, kein Produktionscode). Braucht den mitgelieferten `_ds/`-Ordner daneben.

Die geprüfte Fassung ist die vom Nutzer bereitgestellte `dnd-tracker-bundled.html` (85.534 Zeilen). **Zeilennummern in den Befunden gelten nur für diese Fassung** — im Repo bitte über die angegebenen Such-Anker gehen.

## Arbeitsweise
1. **Nicht neu bauen.** Es ist eine Refactoring-Aufgabe im Bestand, kein Redesign. Bestehende Klassennamen, Datenattribute (`data-action`, `data-render`, `data-value`) und die JS-Delegation bleiben, wo nicht anders angegeben.
2. **Am Bündel oder an den Modulen?** Wenn die modularen Quelldateien (`assets/styles/*.css`, `views/*`, `core/*`) existieren, dort ändern und neu bündeln. Nur wenn es sie nicht gibt, direkt im Bündel.
3. **Wellenweise, je Welle ein Commit** — Reihenfolge siehe unten. Nach jeder Welle die Checkliste durchlaufen.
4. **Kein neues Farb-, Abstands- oder Radius-Wert erfinden.** Alles, was neu gebraucht wird, kommt als Token in den `:root`-Block und wird von dort referenziert.
5. **Funktion darf sich nicht ändern**, außer wo ein Befund ausdrücklich eine fehlende Funktion nachrüstet (F-09: Suche und Import/Export in den vier Welt-Views).

## Reihenfolge
**Welle 1 — behebt den Orte/Kalender-Bruch (kleiner Eingriff, größter sichtbarer Effekt)**
* F-01 — 19 fehlende Custom Properties als Alias im `:root` nachtragen → `PATCHES.md` §1
* F-07 — die vier Welt-Views in `<main class="main-content">` verschieben → §2
* F-13 — `btn-secondary`, `btn-warning`, `btn-icon` definieren → §3

**Welle 2 — Kontrakte**
* F-02 — eine Karten-/Listenzeilen-Klasse für alle Views → §4
* F-08 / F-09 — Toolbar-Kontrakt: Identität + Zähler · Suche · Filter + IO · Primäraktion → §5
* F-14 — eine Primärfarbe für „Neu anlegen" → §6
* F-10 — ein Zähler-ID-Schema + `setViewCount()` → §7
* F-11 — `.master-detail` als gemeinsame Layout-Klasse → §8

**Welle 3 — Skalen und Hygiene**
* F-03 – F-06 (Einheiten, Farben, Radien/Abstände, Schriften), F-12 (Breakpoints), F-15 – F-17 (Bestiar, Filter, Leerzustände), F-18 – F-19 (Dubletten, `!important`, Inline-Styles, z-index). Details in `BEFUNDE.md`.

## Abnahme
Siehe `CHECKLISTE.md`. Kurzfassung: kein `var(--x)` ohne Definition oder Fallback; alle 30 Views innerhalb `<main>`; jede Listen-View hat Titel, Zähler, Suche, Filter, IO und genau eine Primäraktion in derselben Zeile; Orte und Kalender sind visuell nicht mehr unterscheidbar (gleiche Kartenfläche, gleicher Radius, gleiche Abstände, gleiche Buttonfarbe).

## Nicht Teil des Auftrags
Neue Features, Umstellung auf ein Framework, Änderung der Datenhaltung (localStorage/Kampagnen), Änderung der Navigationsstruktur oder der Emoji-Icons.
