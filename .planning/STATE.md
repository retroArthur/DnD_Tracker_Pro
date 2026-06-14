---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-06-14T20:38:43.129Z"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 23
  completed_plans: 23
  percent: 57
---

# Project State: D&D Kampagnen-Tracker Pro — Stabilisierung & Ausbau

**Last Updated:** 2026-06-14
**Phase:** 5
**Status:** Ready to plan

---

## Project Reference

**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

**Current Focus:** Phase 05 — welt-&-story (Phase 04 abgeschlossen + UAT approved 2026-06-14)

---

## Current Position

```
Phase: 04 (initiative-erweiterungen) — COMPLETE
Plan: Not started
Next:  Phase 05 (Welt & Story) starten
Status: Phase 04 abgeschlossen

Progress: [██████████] 100% Phase 4 (23/23 Pläne abgeschlossen)
```

**Phases:**
| # | Phase | Status |
|---|-------|--------|
| 1 | Stabilisierung | Complete |
| 2 | Technik-Fundament | Complete |
| 3 | Bestiary | Complete (5/5 Pläne) |
| 4 | Initiative-Erweiterungen | Complete (4/4 Pläne abgeschlossen) |
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
| EventDelegation TDZ deferred (03-03)                   | 3 (03-03)  | bestiary-render.js lädt bei Build-Position ~107, event-delegation.js bei ~145; registerAction in DOMContentLoaded wrappen                   |
| sanitize-then-dice order (03-03)                       | 3 (03-03)  | sanitizeHTML() strippt data-*-Attribute; Würfel-Spans NACH Sanitisierung injizieren                                                         |
| SRD string IDs: ctx.target.dataset.id statt parseEntityId | 3 (03-03) | parseEntityId('goblin') gibt null zurück; bestiary-select verwendet ctx.target.dataset.id direkt als String                                 |
| Custom-Creatures speichern Rich-Text als HTML-Strings (03-04) | 3 (03-04) | SRD nutzt [{name,desc}]-Arrays; renderTraitList() erkennt Typ per typeof — keine Migration nötig |
| bestiary-delete in plan-04 registriert (03-04) | 3 (03-04) | SC2 E2E braucht die Action in plan-04; plan-05 kann sie neu registrieren (EventDelegation last-write-wins) |
| getMonsterTemplates() → getSRDMonsters() Alias (03-02) | 3 (03-02) | Single source of truth; Code-Review fand Regression im Encounter-Template-Loader (deutsche _ids + Array-Shape) → behoben in ee66bbf |
| Phase 04 P04-02 | 20 | 3 tasks | 5 files |

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
- [x] Phase 2 planen ✓ (Phase 2 Complete)
- [ ] Phase 3 — 3 manuelle Browser-Checks (nicht-blockierend, aus 03-VERIFICATION): Offline-Modus zeigt alle 112 Monster, Pergament-Statblock-Optik, Klick-Würfel-Feel am Spieltisch
- [ ] REQUIREMENTS.md Traceability: 4 REQ-IDs (WELT-06/07, CHAR-04, UX-03) aus späteren Phasen fehlen noch in der Traceability-Tabelle (von `phase complete` gemeldet)

---

## Session Continuity

**Last action:** Phase 04 (Initiative-Erweiterungen) vollständig abgeschlossen (2026-06-14): 4 Pläne/4 Wellen ausgeführt (INIT-01 Statblock-Drawer, INIT-02 LA/LR-Pips, INIT-03 Mob-Modus), Code-Review + Verifikation (3/3 Wahrheiten). UAT vom Nutzer approved nach Drawer-Bugfix (Drawer dockte links statt rechts + nicht schließbar → 9107ec2). Zusätzlich Test-Infrastruktur gehärtet: 6 vorbestehend kaputte + 10 no-op Initiative-E2E-Tests mit echten Selektoren/Assertions repariert (Commits a613023, 9107ec2, 6906875) → 31/31 Initiative-E2E grün. Phase via `phase complete 04` markiert (next: Phase 05).
**Next action:** Phase 05 (Welt & Story) diskutieren und planen.

---

_State initialized: 2026-06-11_

## Decisions

- [Phase ?]: Quantity cap = 100 (BESTIARY_MAX_QUANTITY): clamp to 1-100 for DoS safety (T-03-10)
- [Phase ?]: INIT-01: renderStatblockHTML DRY-Extraktion in bestiary-render.js, E2E via evaluate()-Injektion
- [Phase 04-03]: D-07 LR kein Auto-Reset (manuell via lr-reset-btn); E2E via page.evaluate(nextTurn) statt UI-Button (data-action=call, nicht data-action=next-turn)
- [Phase 04-04]: rollMobAttack N-fach = alive Schadenswuerfe summiert (kein Trefferroll-Gating, DM entscheidet Kontext); dissolveMob nutzt numerischen cbId-Filter direkt ohne parseEntityId
