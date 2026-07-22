# Milestones

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
