---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-06-13T10:27:12.966Z"
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 14
  completed_plans: 14
  percent: 29
---

# Project State: D&D Kampagnen-Tracker Pro — Stabilisierung & Ausbau

**Last Updated:** 2026-06-13
**Phase:** 3
**Status:** Ready to plan

---

## Project Reference

**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

**Current Focus:** Phase 03 — bestiary

---

## Current Position

```
Phase: 03 (bestiary) — CONTEXT GATHERED
Plan: Not started
Status: Ready to plan Phase 03

Progress: [===>......] 29% (2/7 Phasen abgeschlossen)
```

**Phases:**
| # | Phase | Status |
|---|-------|--------|
| 1 | Stabilisierung | Complete |
| 2 | Technik-Fundament | Complete |
| 3 | Bestiary | Context gathered |
| 4 | Initiative-Erweiterungen | Not started |
| 5 | Welt & Story | Not started |
| 6 | Spieler-Verwaltung | Not started |
| 7 | Komfort & Analyse | Not started |

---

## Performance Metrics

- Plans completed: 9 (Phase 1)
- Plans total: 9 (Phase 1) + TBD (Phasen 2-7 nach Planung)
- Requirements delivered: 11 / 31 (STAB-01 bis STAB-11)

---

## Accumulated Context

### Key Decisions

| Decision                                               | Phase      | Rationale                                                                                                                                    |
| ------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Stabilisierung vor allen Features                      | 1          | App startet aktuell nicht; Fundament zuerst                                                                                                  |
| PWA vor Datei-Backup                                   | 2          | File System Access API erfordert HTTPS/localhost-Origin; file:// blockiert diese API                                                         |
| Bestiary vor Initiative-Erweiterungen                  | 3 before 4 | Statblock-Popup, Legendary-Auto-Detection und Mob-Mode benötigen Bestiary-Daten                                                              |
| Monster-Datengröße erst in Phase 3 klären              | 3          | Spike nötig (pruned+minified messen): <200 KB inline, >=200 KB Index+IndexedDB lazy-load                                                     |
| Mindmap bleibt entfernt                                | 1          | Bereits entschieden (Commit 7ef9bf5); nur Reste bereinigen                                                                                   |
| Command-Palette-Shortcut final in Phase 2 festlegen    | 2          | Ctrl+K belegt (Global Search + Browser-Adressleiste); Ctrl+Shift+K oder Ctrl+P nach Shortcut-Audit                                           |
| resolveStorageConflict statt showStorageConflictDialog | 1 (01-08)  | Unterschiedlicher Name verhindert Selbstrekursion strukturell; window.showStorageConflictDialogUI als Andockpunkt für D-07-Dialog reserviert |
| D-07-Auswahl-Dialog nicht in Gap-Plan 01-08            | 1 (01-08)  | Nur CR-01-Bugfix-Scope; IDB-Vorrang als deterministischer Fallback erfüllt SC2/STAB-05 code-seitig                                           |
| no-misleading-character-class auf warn (Option d-1)    | 1 (01-09)  | Emoji-Regex in dice-core.js bleibt unverändert; kein u-Flag-Umbau in der Stabilisierungsphase (Surrogate/ZWJ-Risiko)                        |
| lint ohne --max-warnings                               | 1 (01-09)  | 1215 legitime Non-ESM-Warnungen blockieren Gate nicht; echte Errors (Severity 2) weiterhin fatal; robuster als festes Limit                 |

### Known Blockers / Research Flags

- **Phase 3 (Bestiary):** Datengröße-Spike + Prüfung deutscher SRD-Quellen-Vollständigkeit
- ~~**Phase 2 (PWA):** UX-Design für Cross-Origin-Datenmigration (file:// → PWA)~~ — geklärt in 02-CONTEXT.md (D-08 bis D-11: Voll-Export + geführter Wizard + Divergenz-Banner)
- **Phase 7 (Soundboard):** Im `file://`-Modus müssen Audio-Dateien pro Session neu ausgewählt werden (kein File System API) — UX-Tradeoff mit Nutzer klären

### Architecture Notes

- Non-ESM, kein Framework, kein Runtime-Dependency — bleibt unverändert
- Neue Collections: `D.bestiary[]`, `D.timeline[]`, `D.factions[]` — einmalige Migration `3.0.0` in `version-migration.js`
- SRD-Monsterdaten: NIEMALS in `D` speichern, niemals in Undo-Snapshots oder Exporten
- Combatant-Felder für Legendary Actions + Mob Mode: Runtime-only (keine Migration nötig)
- Würfel-Statistiken: Eigener IndexedDB-Store — niemals in `D`
- Alle neuen Module in `build.py` UND `loader.js` eintragen (Modullisten müssen synchron bleiben)

### Open TODOs

- [ ] 3 manuelle Browser-Tests aus `01-HUMAN-UAT.md` durchführen (file://-Boot, >5-MB-Persistenz, Konfliktpfad) — via `/gsd-verify-work 1`
- [ ] Code-Review-Findings fixen (1 Critical: vorbestehender Import-XSS; 3 Warnings): `/gsd-code-review-fix 1`
- [ ] Security-Audit nachziehen (SECURITY.md fehlt): `/gsd-secure-phase 1`
- [x] Phase 2 diskutieren: `/gsd-discuss-phase 2` ✓ (2026-06-12, 02-CONTEXT.md)
- [ ] Phase 2 planen: `/gsd-plan-phase 2`

---

## Session Continuity

**Last action:** Phase 3 Kontext erfasst (2026-06-13) — 3 Bereiche diskutiert (SRD-Umfang & Sprache, Darstellung & Tab-Aufbau, Übernahme Encounter/Initiative), 17 Entscheidungen in 03-CONTEXT.md; Editor-Form/Encounter-Weg/Template-Schicksal als Claude's Discretion
**Next action:** Phase 03 planen — `/gsd-plan-phase 3`

---

_State initialized: 2026-06-11_
