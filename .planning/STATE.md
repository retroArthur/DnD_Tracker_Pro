---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Not started
last_updated: "2026-06-11T23:17:15.788Z"
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State: D&D Kampagnen-Tracker Pro — Stabilisierung & Ausbau

**Last Updated:** 2026-06-11
**Phase:** 1 — Stabilisierung
**Status:** Not started

---

## Project Reference

**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

**Current Focus:** Phase 1 — Stabilisierung (Boot-Crash beheben, Datenverlust-Bugs fixen, CI härten, Doku aktuell machen)

---

## Current Position

```
Phase:    1 / 7 — Stabilisierung
Plan:     None started
Status:   Not started

Progress: [          ] 0%
```

**Phases:**
| # | Phase | Status |
|---|-------|--------|
| 1 | Stabilisierung | Not started |
| 2 | Technik-Fundament | Not started |
| 3 | Bestiary | Not started |
| 4 | Initiative-Erweiterungen | Not started |
| 5 | Welt & Story | Not started |
| 6 | Spieler-Verwaltung | Not started |
| 7 | Komfort & Analyse | Not started |

---

## Performance Metrics

- Plans completed: 0
- Plans total: TBD (filled after phase planning)
- Requirements delivered: 0 / 31

---

## Accumulated Context

### Key Decisions

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Stabilisierung vor allen Features | 1 | App startet aktuell nicht; Fundament zuerst |
| PWA vor Datei-Backup | 2 | File System Access API erfordert HTTPS/localhost-Origin; file:// blockiert diese API |
| Bestiary vor Initiative-Erweiterungen | 3 before 4 | Statblock-Popup, Legendary-Auto-Detection und Mob-Mode benötigen Bestiary-Daten |
| Monster-Datengröße erst in Phase 3 klären | 3 | Spike nötig (pruned+minified messen): <200 KB inline, >=200 KB Index+IndexedDB lazy-load |
| Mindmap bleibt entfernt | 1 | Bereits entschieden (Commit 7ef9bf5); nur Reste bereinigen |
| Command-Palette-Shortcut final in Phase 2 festlegen | 2 | Ctrl+K belegt (Global Search + Browser-Adressleiste); Ctrl+Shift+K oder Ctrl+P nach Shortcut-Audit |

### Known Blockers / Research Flags

- **Phase 3 (Bestiary):** Datengröße-Spike + Prüfung deutscher SRD-Quellen-Vollständigkeit
- **Phase 2 (PWA):** UX-Design für Cross-Origin-Datenmigration (file:// → PWA) vor Implementierung
- **Phase 7 (Soundboard):** Im `file://`-Modus müssen Audio-Dateien pro Session neu ausgewählt werden (kein File System API) — UX-Tradeoff mit Nutzer klären

### Architecture Notes

- Non-ESM, kein Framework, kein Runtime-Dependency — bleibt unverändert
- Neue Collections: `D.bestiary[]`, `D.timeline[]`, `D.factions[]` — einmalige Migration `3.0.0` in `version-migration.js`
- SRD-Monsterdaten: NIEMALS in `D` speichern, niemals in Undo-Snapshots oder Exporten
- Combatant-Felder für Legendary Actions + Mob Mode: Runtime-only (keine Migration nötig)
- Würfel-Statistiken: Eigener IndexedDB-Store — niemals in `D`
- Alle neuen Module in `build.py` UND `loader.js` eintragen (Modullisten müssen synchron bleiben)

### Open TODOs

- [ ] Phase 1 planen: `/gsd-plan-phase 1`

---

## Session Continuity

**Last action:** Phase 1 context gathered (2026-06-12) — 17 Entscheidungen in `.planning/phases/01-stabilisierung/01-CONTEXT.md`
**Next action:** `/gsd-plan-phase 1` — Stabilisierungs-Phase planen

---

*State initialized: 2026-06-11*
