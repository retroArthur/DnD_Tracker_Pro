# Milestones

## v1.1 Tech-Debt & Härtung (Shipped: 2026-07-27)

**Delivered:** Die Codebasis schuldenfrei und dauerhaft wartbar gemacht — deprecated APIs abgelöst, Test-Suite belastbar, Sicherheits-Altlasten geschlossen, Build-Architektur begradigt. Verhaltensneutral: keine Feature-Änderung aus Nutzersicht.

**Umfang:** 4 Phasen (8–11) · 27 Pläne · 69 Tasks · 185 Commits · 155 Dateien, +27.726 / −1.765 Zeilen · 22.07.2026 → 27.07.2026
**Qualität:** Jest 628 · Playwright 319 (2 skipped) · pytest 24 — alle grün · 11/11 Requirements · alle 4 VERIFICATIONs passed · Nyquist 4/4 validated · CI-Lauf 30301635918 mit sechs grünen Jobs

**Key accomplishments:**

1. **Test-Fundament belastbar** — 11 vorbestehende E2E-Fails behoben, davon drei echte App-Bugs (Action-Registry-Kollision, `renderAll()`-Dispatch-Lücke, Migration-Banner-Overlay); `e2e` blockiert seither die Deploy-Kette. Fails sind wieder als echte Regressionen lesbar statt als Grundrauschen.
2. **`execCommand` vollständig abgelöst** — 21 → 0 im Editor, drei dokumentierte Ausnahmen ausserhalb. Entscheidend war die Reihenfolge: erst die Markup-Baseline messen (`09-BASELINE.md`), dann das 79-Test-Netz bauen, dann migrieren. Ein Netz mit geratenen Sollwerten hätte nichts abgesichert.
3. **Security mit echtem Nachweis** — Import-XSS geschlossen; die Sanitizer-Tests laufen seither gegen den Produktionsquelltext statt gegen eine Kopie; vier `SECURITY.md` (Phasen 1, 2, 9, 10) mit je `threats_open: 0`.
4. **Build-Architektur begradigt** — eine Modulliste in `loader.js` statt zweier synchron zu haltender, mit Hard-Abort bei fehlender Datei; Dedup-Pass 3 ersatzlos entfernt und durch einen Quell-Pre-Check *vor* dem Bündeln ersetzt, wodurch die Klasse „stilles Bundle mit verwaistem Funktionsrumpf" strukturell verschwindet.
5. **Zwei Funde, die erst das Bestehen auf echten Nachweisen sichtbar machte** — eine unvollständige CI-Artefakt-Paketierung (der `smoke-test` prüfte ein Artefakt ohne Service Worker; lokal grün, weil dort Altbestände lagen) und ein stiller Datenverlust im Datei-Backup ab 5 MB Kampagnengröße, bei dem `pruneOldSnapshots()` binnen zehn Spieltagen alle echten Snapshots wegräumte — bei durchgehend grüner Statusanzeige. Beide behoben (`bfd6447`, `71fb6ef`).

**Übertrag nach v1.2:** 27 dispositionierte `DEBT`-Posten mit Live-Code-Belegen — das Produkt von ARCH-04, nicht dessen Versäumnis. Schwerste: `DEBT-18` (Umzugs-Export verliert Soundboard-Audio und Würfelstatistik aus IndexedDB), `DEBT-19` (Audio-Löschen ohne Undo), `DEBT-21/22` (Datei-Backup deckt nur die aktive Kampagne ab; Dateinamen können kollidieren).

**Archive:** [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) · [v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md) · [Audit](v1.1-MILESTONE-AUDIT.md)

---

## v1.0 Stabilisierung & Ausbau (Shipped: 2026-07-22)

**Delivered:** Vollständiger offline-first D&D-5e-Spielleiter-Begleiter — vom nicht startenden Prototyp zum installierbaren, getesteten Kampagnen-Tracker mit Bestiary, Kampf-Tiefe, Weltwerkzeugen, Spieler-Verwaltung und Soundboard.

**Umfang:** 7 Phasen · 44 Pläne · 83 Tasks · 517 Commits · ~81.000 Zeilen Quellcode · 28.12.2025 → 22.07.2026
**Qualität:** 453 Unit-Tests grün · Phasen-E2E grün · 31/31 Requirements · UAT 20/20 (alle 5 Human-UAT-Sessions) · alle 7 VERIFICATIONs passed

**Key accomplishments:**

1. **Stabilisierung** — von „App startet nicht" zu robustem file://-first-Boot mit LS+IDB-Dual-Persistenz (>5-MB-IDB-Fallback, deterministische D-07-Konfliktauflösung, sauberer Konsolen-Boot)
2. **PWA-Fundament** — installierbar via GitHub Pages (CI-Deploy), SW-Update-Hinweis ohne Zwangs-Reload, Datei-Backup per Ordner-Handle (generischer Post-Save-Hook), Migrations-Wizard file://→PWA mit Divergenz-Banner
3. **Bestiary** — 112 deutsche SRD-5.1-Statblocks offline (lazy IDB-Cache), Pergament-Optik mit klickbaren Würfeln, Encounter-/Initiative-Integration mit Auto-Roll+HP-Variation
4. **Kampf-Tiefe** — Legendary Actions, Mob-Mode, Death Saves, Concentration-Tracker, AoE-Rechner, Quick-Actions, Rest-Manager
5. **Welt & Story** — NPC-Generator (Modal, deutsch), Harptos-Kalender (kanon-geprüft), Reise-Rechner, Fraktionen mit Ruf-System, Session-Prep, Entity-Links
6. **Spieler & Komfort** — XP-/Milestone-Leveling mit Verteilungs-Modal, Inspiration, klickbare Skill-/Save-/Angriffs-Würfe, Soundboard (Web-Audio-Szenen mit Crossfade-Loops, Quick-Slots), Würfel-Statistiken (d20-Histogramm)

**Archive:** [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) · [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)

---
