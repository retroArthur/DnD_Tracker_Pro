# Phase 2: Technik-Fundament - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 02-technik-fundament
**Areas discussed:** PWA-Hosting & Installation, Datenmigration file:// → PWA, Datei-Backup-Verhalten

---

## Bereichsauswahl

Angeboten: PWA-Hosting & Installation, Datenmigration file:// → PWA, Datei-Backup-Verhalten, Command Palette.
Gewählt: die ersten drei. **Command Palette** wurde nicht zur Diskussion gewählt → Claude's Discretion (mit Roadmap-Vorgaben: Shortcut-Audit, Kandidaten Strg+Shift+K / Strg+P).

---

## PWA-Hosting & Installation

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| GitHub Pages | CI deployed automatisch auf github.io; Installation von dort, danach offline via SW | ✓ |
| Lokaler Server (localhost) | Installation von localhost:8000; ohne Internet, aber Server für Install/Updates nötig | |
| Beides anbieten | Zwei Origins = zwei getrennte Datenbestände — Divergenz-Risiko | |

**User's choice:** GitHub Pages

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Hinweis + Klick | „Neue Version verfügbar — Neu laden?", Aktivierung per Klick | ✓ |
| Automatisch im Hintergrund | Neue Version still beim nächsten Start aktiv | |
| Nur manuell prüfen | Update-Check nur über Einstellungen | |

**User's choice:** Hinweis + Klick

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Claude gestaltet eins | d20-Motiv, Gold #d4af37 auf Dunkel #0d0d0d, SVG → PNG-Größen | ✓ |
| Eigenes Bild liefern | Nutzer stellt Artwork bereit | |
| 🎲-Emoji beibehalten | Bestehendes Emoji als PNG gerendert | |

**User's choice:** Claude gestaltet eins

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| PWA wird Hauptmodus | file:// bleibt Notfall-/Zweitmodus, nicht mehr priorisiert | ✓ |
| Beide gleichwertig | Jedes Feature braucht vollwertige file://-Fallbacks | |
| file:// nur noch Übergang | Dauerhafter Wechsel-Hinweis, minimaler Fallback-Aufwand | |

**User's choice:** PWA wird Hauptmodus

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Jeder main-Push, CI-gated | Deploy automatisch, aber nur bei grüner CI | ✓ |
| Nur bei Release-Tags | Deploy nur bei bewusstem Versions-Tag | |
| Manuell auslösen | workflow_dispatch per Hand | |

**User's choice:** Jeder main-Push, CI-gated

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Production-Build | Minifiziert, DEBUG_MODE aus — wie heutiges CI-Artefakt | ✓ |
| Dev-Build | Lesbar, DEBUG an — leichter zu debuggen, langsamer | |
| Beide (Prod + /dev-Pfad) | Prod als Standard, dev unter Unterpfad | |

**User's choice:** Production-Build

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Eigener Install-Button | beforeinstallprompt abfangen, Button im Header/Menü | ✓ |
| Nur Browser-Standard | Chrome-Icon in der Adressleiste | |
| Einmaliger Hinweis-Banner | Banner beim ersten Besuch | |

**User's choice:** Eigener Install-Button

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Fonts mit ausliefern | Schriftdateien im Build/SW-Cache — offline identisch | ✓ |
| System-Fallback akzeptieren | CDN-Laden, offline Systemschrift | |
| Nur Haupt-Font bündeln | Roboto gebündelt, Editor-Fonts CDN | |

**User's choice:** Fonts mit ausliefern

---

## Datenmigration file:// → PWA

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Alles | Alle Kampagnen, Einstellungen, Favoriten, DM-Screen-Profile; neues Voll-Export-Format | ✓ |
| Nur aktive Kampagne | Schlanker Umzug nur des aktuellen Spielstands | |
| Kampagnen auswählbar | Checkbox-Liste im Assistenten | |

**User's choice:** Alles

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Geführter Wizard | Erststart-Erkennung, Schritt-für-Schritt, Drag&Drop, Erfolgs-Bestätigung, überspringbar | ✓ |
| Schlanker Import-Dialog | Nur Dialog mit Datei-Picker | |
| Nur über Einstellungen | Kein automatischer Auftritt | |

**User's choice:** Geführter Wizard

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Ja, Umzugs-Knopf + Hinweis | „Zur installierbaren App umziehen" (Voll-Export + Pages-URL) + einmaliger Hinweis | ✓ |
| Nur Voll-Export-Knopf | Ohne Hinweis auf die PWA | |
| Nichts ändern | Bestehender Export (nur aktive Kampagne) — Voll-Migration so nicht möglich | |

**User's choice:** Ja, Umzugs-Knopf + Hinweis

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Dezenter Start-Hinweis | Abschaltbares Banner „Daten am [Datum] umgezogen" nach Umzugs-Export | ✓ |
| Kein Schutz | Stilles Risiko divergierender Stände | |
| Warn-Dialog bei jedem Save | Maximaler Schutz, widerspricht Spieltisch-Leitlinie | |

**User's choice:** Dezenter Start-Hinweis

---

## Datei-Backup-Verhalten

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Aktuelle Datei + Snapshots | Laufend überschriebene Datei + datierter Snapshot pro Spieltag, letzte N | ✓ |
| Nur eine aktuelle Datei | Keine Historie — kaputter Stand überschreibt einziges Backup | |
| Jedes Speichern eigene Datei | Lückenlos, aber Ordner wächst unkontrolliert | |

**User's choice:** Aktuelle Datei + Snapshots

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Je Kampagne eine Datei | Granular wiederherstellbar, kleine Schreibvorgänge | ✓ |
| Ein Voll-Export mit allem | Migrations-Format bei jedem Save komplett neu | |
| Nur aktive Kampagne | Andere Kampagnen ungeschützt | |

**User's choice:** Je Kampagne eine Datei

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Status + 1x Erinnerung | Sichtbarer Status + Download-Knopf, max. eine Erinnerung pro Sitzung | ✓ |
| Nur sichtbarer Knopf | Keine aktive Erinnerung | |
| Beim Beenden fragen | Browser schränken Beenden-Dialoge ein — unzuverlässig | |

**User's choice:** Status + 1x Erinnerung

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| 1x fragen + Status | Einmalig „Ordner wieder verbinden?", danach pausiert-Status + Event-Log | ✓ |
| Still pausieren | Nur Event-Log — Ausfall bleibt leicht unbemerkt | |
| Laut bei jedem Save | Toast-Gewitter, widerspricht Phase-1-Leitlinie | |

**User's choice:** 1x fragen + Status

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Backup-Browser in der App | Snapshots gelistet (Kampagne, Datum, Größe), Restore per Klick mit Bestätigung + Undo | ✓ |
| Über den Import-Dialog | Backup-Dateien wie Export-Dateien einspielen | |
| Beides | Browser + Import-Dialog | |

**User's choice:** Backup-Browser in der App

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Im Migrations-Wizard | Letzter Wizard-Schritt nach Import; zusätzlich über Einstellungen | ✓ |
| Nur über Einstellungen | Feature bleibt leicht unentdeckt | |
| Beim ersten Save nachfragen | Unterbrecher im ersten Arbeitsfluss | |

**User's choice:** Im Migrations-Wizard

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Letzte 10 | ~2-3 Monate Spieltage Rückgriff, <100 MB | ✓ |
| Letzte 5 | ~1 Monat Spieltage | |
| Unbegrenzt | Manuelles Aufräumen | |

**User's choice:** Letzte 10

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Einstellungen + Warnpunkt | Voller Status in Einstellungen; Header-Indikator nur bei Problemen | ✓ |
| Dauerhafter Header-Status | Backup-Symbol immer sichtbar | |
| Nur Einstellungen | Probleme fallen erst beim Nachschauen auf | |

**User's choice:** Einstellungen + Warnpunkt

---

## Claude's Discretion

- Command Palette (TECH-04) vollständig — Bereich bewusst nicht zur Diskussion gewählt; Roadmap-Vorgaben gelten (Shortcut-Audit, Strg+Shift+K / Strg+P als Kandidaten, Fuzzy-Suche über Aktions-Registry)
- SW-Cache-Strategie, Manifest-Struktur, Update-Erkennungs-Mechanik, Pages-Layout
- Backup-Debounce/Timing, atomare Schreibstrategie, Dateinamens-Konvention, Snapshot-Trigger
- Import-Dialog-Kompatibilität der Backup-Dateien
- Alle exakten deutschen UI-Texte

## Deferred Ideas

Keine — die Diskussion blieb im Phasen-Scope.
