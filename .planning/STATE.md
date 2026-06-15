---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-06-15T14:27:06.785Z"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 30
  completed_plans: 25
  percent: 57
---

# Project State: D&D Kampagnen-Tracker Pro — Stabilisierung & Ausbau

**Last Updated:** 2026-06-15
**Phase:** 5
**Status:** Ready to execute

---

## Project Reference

**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

**Current Focus:** Phase 05 — Welt & Story

---

## Current Position

```
Phase: 05 (Welt & Story) — EXECUTING
Plan: 5 of 7
Next:  Phase 05 ausführen (/gsd-execute-phase 5)
Status: Ready to execute

Progress: [██████████] 100% Phase 4 (23/23 Pläne) · Phase 5 geplant (7 Pläne)
```

**Phases:**
| # | Phase | Status |
|---|-------|--------|
| 1 | Stabilisierung | Complete |
| 2 | Technik-Fundament | Complete |
| 3 | Bestiary | Complete (5/5 Pläne) |
| 4 | Initiative-Erweiterungen | Complete (4/4 Pläne abgeschlossen) |
| 5 | Welt & Story | In Progress (4/7 Pläne) |
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
| Phase 05-welt-story P02 | 5 | 2 tasks | 4 files |

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
- [x] Phase 5 diskutieren: `/gsd-discuss-phase 5` ✓ (2026-06-14, 05-CONTEXT.md)
- [x] Phase 5 planen: `/gsd-plan-phase 5` ✓ (2026-06-15, 7 Pläne / 7 Wellen, Checker PASSED)

---

## Session Continuity

**Last action:** Plan 05-04 (WELT-02 NPC-Generator) ausgeführt (2026-06-15). generiereNPCName/generiereNPC Kernlogik, showNPCGeneratorModal (Vor-Filter Volk+Geschlecht, Vorschau-Karte, Re-Roll, Speichern), saveGeneratedNPC (pushUndo + D.npcs.push + renderNPCList), entity-actions (3 neue Handler), Command-Palette-Eintrag, npcg-CSS, 4 WELT-02 Unit-Tests + 5 E2E-Tests aktiviert. Build: python build.py grün (2.56 MB).
**Next action:** Plan 05-05 ausführen (WELT-03 Kampagnen-Timeline).

---

_State initialized: 2026-06-11_

## Decisions

- [Phase ?]: Quantity cap = 100 (BESTIARY_MAX_QUANTITY): clamp to 1-100 for DoS safety (T-03-10)
- [Phase ?]: INIT-01: renderStatblockHTML DRY-Extraktion in bestiary-render.js, E2E via evaluate()-Injektion
- [Phase 04-03]: D-07 LR kein Auto-Reset (manuell via lr-reset-btn); E2E via page.evaluate(nextTurn) statt UI-Button (data-action=call, nicht data-action=next-turn)
- [Phase 04-04]: rollMobAttack N-fach = alive Schadenswuerfe summiert (kein Trefferroll-Gating, DM entscheidet Kontext); dissolveMob nutzt numerischen cbId-Filter direkt ohne parseEntityId
- [Phase ?]: Build-Time-Python-Generatoren für große Tabellen statt Hand-Tippen
- [Phase 05-03]: sanitize-then-parse: sanitizeHTML() vor parseEntityLinks() (T-05-10 Mitigation, RESEARCH-Risikotabelle)
- [Phase 05-03]: offeneFaeden quelleId display-only (T-05-11 accept — DM-eigene Daten, keine EntityLookup-Prüfung nötig)
- [Phase 05-04]: NPC-Generator modal via insertAdjacentHTML (transient) statt showModal() — kein HTML-Skelett vorhanden; Modal wird nach Schließen via .remove() bereinigt
- [Phase 05-04]: saveGeneratedNPC direkt D.npcs.push (Option A) statt saveNPC() aufrufen — dedup-sicher, kein Formular-Zyklus
