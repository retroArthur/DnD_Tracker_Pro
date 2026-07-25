---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Tech-Debt & Härtung
current_phase: 11
current_phase_name: Architektur- & Build-Hygiene
status: executing
stopped_at: Completed 11-06-PLAN.md
last_updated: "2026-07-25T22:11:41.806Z"
last_activity: 2026-07-25
last_activity_desc: Phase 11 execution started
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 27
  completed_plans: 25
  percent: 75
---

# Project State: D&D Kampagnen-Tracker Pro — Stabilisierung & Ausbau

**Last Updated:** 2026-07-25
**Phase:** 11 — Architektur- & Build-Hygiene
**Status:** Ready to execute

---

## Project Reference

**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

**Current Focus:** Phase 11 — architektur-build-hygiene

---

## Current Position

Phase: 11 (architektur-build-hygiene) — EXECUTING
Plan: 7 of 7
Status: Ready to execute
Last activity: 2026-07-25 — Phase 11 execution started

## Performance Metrics

- Plans completed: 44 / 44 (Phasen 1–7, Milestone v1.0)
- Phases completed: 7 / 7 (100%)
- Requirements delivered: 31 / 31 (STAB, INIT, BESTIARY, WELT, CHAR, UX — Milestone v1.0 vollständig)

---
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 08 P01 | 9min | 3 tasks | 7 files |
| Phase 08 P02 | 50min | 2 tasks | 4 files |
| Phase 08 P03 | 28min | 2 tasks | 16 files |
| Phase 08 P04 | 25min | 2 tasks | 2 files |
| Phase 09 P01 | 51min | 3 tasks | 2 files |
| Phase 09 P02 | 21min | 3 tasks | 5 files |
| Phase 09 P03 | 21min | 3 tasks | 1 files |
| Phase 09 P04 | 18min | 3 tasks | 2 files |
| Phase 09 P05 | 8min | 2 tasks | 2 files |
| Phase 9 P06 | 45min | 2 tasks | 3 files |
| Phase 09 P07 | 55min | 2 tasks | 3 files |
| Phase 09 P08 | 37min | 2 tasks | 3 files |
| Phase 09 P09 | 21min | 3 tasks | 5 files |
| Phase 10 P01 | 55min | 2 tasks | 4 files |
| Phase 10 P02 | 50min | 3 tasks | 3 files |
| Phase 10 P03 | 30min | 3 tasks | 6 files |
| Phase 10 P04 | 35min | 2 tasks | 3 files |
| Phase 10 P05 | ~50min | 2 tasks | 7 files |
| Phase 10 P06 | ~40min | 3 tasks | 4 files |
| Phase 10 P07 | ~55min | 3 tasks | 8 files |
| Phase 11 P01 | 11min | 2 tasks | 2 files |
| Phase 11 P02 | 4min | 3 tasks | 3 files |
| Phase 11 P03 | 11min | 3 tasks | 3 files |
| Phase 11 P04 | 25min | 2 tasks | 5 files |
| Phase 11 P05 | ~40min | 3 tasks | 4 files |
| Phase 11 P06 | ~35min | 3 tasks | 2 files |

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
| Phase 06 P01 | 45 | - tasks | - files |
| Phase 06-spieler-verwaltung P03 | 45 | 2 tasks | 7 files |

### Known Blockers / Research Flags

- **Phase 3 (Bestiary):** Datengröße-Spike + Prüfung deutscher SRD-Quellen-Vollständigkeit
- ~~**Phase 2 (PWA):** UX-Design für Cross-Origin-Datenmigration (file:// → PWA)~~ — geklärt in 02-CONTEXT.md (D-08 bis D-11: Voll-Export + geführter Wizard + Divergenz-Banner)
- ~~**Phase 7 (Soundboard):** Im `file://`-Modus müssen Audio-Dateien pro Session neu ausgewählt werden~~ — geklärt in 07-CONTEXT.md (D-01: dedizierter IndexedDB-Blob-Store persistiert Audio über Reload, voll `file://`-tauglich, kein File System Access API); RESEARCH bestätigt Blob-Persistenz unter `file://` (Annahme A3 → früher E2E-Check in Wave 1)

### Architecture Notes

- Non-ESM, kein Framework, kein Runtime-Dependency — bleibt unverändert
- Neue Collections: `D.bestiary[]`, `D.timeline[]`, `D.factions[]` — einmalige Migration `3.0.0` in `version-migration.js`
- SRD-Monsterdaten: NIEMALS in `D` speichern, niemals in Undo-Snapshots oder Exporten
- Combatant-Felder für Legendary Actions + Mob Mode: Runtime-only (keine Migration nötig)
- Würfel-Statistiken: Eigener IndexedDB-Store — niemals in `D`
- Neue Module, Templates und Stylesheets ausschliesslich in `loader.js` (`MODULES`/`TEMPLATES`) bzw. im `@import`-Hub `assets/styles.css` eintragen — `build.py` liest beide Listen zur Build-Zeit (SSoT, Phase 11 D-01/D-04); eine gelistete, aber fehlende Datei bricht den Build sofort ab (D-02). Es gibt nur noch eine Liste je Asset-Typ, kein Synchronhalte-Zwang mehr.

### Open TODOs

- [x] 3 manuelle Browser-Tests aus `01-HUMAN-UAT.md` ✓ (2026-07-20, 3/3 via /gsd-verify-work 1; Fixes: Manifest nur http/https cd75093, Konsolen-Hygiene c029f11)
- [x] Code-Review-Findings fixen (1 Critical: vorbestehender Import-XSS; 3 Warnings): `/gsd-code-review-fix 1` ✓ (2026-07-25, Phase 10: CR-01 kritisch behoben Plan 10-01/10-02, WR-03 behoben Plan 10-02; WR-01 lexikografische Versions-Sortierung und WR-02 irreführender Stale-Shadow-Test bleiben offen — kein Security-Threat, Kandidat für Phase 11)
- [x] Security-Audit nachziehen (SECURITY.md fehlt): `/gsd-secure-phase 1` ✓ (2026-07-25, Phase 10 Plan 05: 01-SECURITY.md erstellt, konsolidierte SECURITY.md im Repo-Root mit threats_open: 0)
- [x] Phase 10 abgeschlossen (Security-Härtung): `/gsd-execute-phase 10` ✓ (2026-07-25, 5/5 Pläne; SEC-01+SEC-02 vollständig erfüllt; vier Per-Phasen-SECURITY.md + konsolidierte SECURITY.md im Repo-Root mit threats_open: 0; volle Suiten grün: 554/554 Jest, 315 passed/2 skipped Playwright)
- [x] Phase 2 diskutieren: `/gsd-discuss-phase 2` ✓ (2026-06-12, 02-CONTEXT.md)
- [x] Phase 2 planen ✓ (Phase 2 Complete)
- [ ] Phase 3 — 3 manuelle Browser-Checks (nicht-blockierend, aus 03-VERIFICATION): Offline-Modus zeigt alle 112 Monster, Pergament-Statblock-Optik, Klick-Würfel-Feel am Spieltisch
- [ ] REQUIREMENTS.md Traceability: 4 REQ-IDs (WELT-06/07, CHAR-04, UX-03) aus späteren Phasen fehlen noch in der Traceability-Tabelle (von `phase complete` gemeldet)
- [x] Phase 5 diskutieren: `/gsd-discuss-phase 5` ✓ (2026-06-14, 05-CONTEXT.md)
- [x] Phase 5 planen: `/gsd-plan-phase 5` ✓ (2026-06-15, 7 Pläne / 7 Wellen, Checker PASSED)
- [x] Phase 5 ausführen: `/gsd-execute-phase 5` ✓ (2026-06-15, 7/7 Pläne, 5/5 must-haves, 37 Unit + 24 E2E grün)
- [x] Phase 5 — 2 menschliche Sichtungen ✓ (2026-06-20, 2/2: NPC-Qualität bestätigt, Harptos kanon-geprüft)
- [ ] Phase 5 (optional, benign): `D.calendar.month` 0→1-Basis in core/data.js angleichen (vom Verifier als nicht-user-sichtbar bestätigt)
- [x] Phase 6 diskutieren: `/gsd-discuss-phase 6` ✓ (2026-06-15, 06-CONTEXT.md, Commit d10df5c)
- [x] Phase 6 planen: `/gsd-plan-phase 6` ✓ (2026-06-15, 4 Pläne / 4 Wellen, `--skip-ui`, Research + manuelle 06-VALIDATION.md, Plan-Checker VERIFICATION PASSED — 0 Blocker; Commits 61c538c/8dfbcbf)
- [x] Phase 6 ausführen Plan 1 (06-01 Fundament): ✓ (2026-06-15, XP_LEVEL_THRESHOLDS + 4 helpers + migration 5.0.0 + Wave-0 tests; 49 unit tests grün, 2 E2E stubs runnable; Commits b79a1f4/21cf563/d268369/9fc7dd3)
- [x] Phase 6 ausführen Plan 2 (06-02 Inspiration): ✓ (2026-06-15, always-visible ⭐ toggle + stop-propagation handler + CSS + 5 E2E tests grün; Commits 4e5be0b/b289349)
- [x] Phase 6 ausführen Plan 3 (06-03 Charakterwerte): ✓ (2026-06-15, 18 Skill/Expertise-Checkboxen + Angriffsliste im Editor; Skills/Saves/Attribute/Angriffe als klickbare W20-Würfe mit Adv/Disadv im Detail-Modal; 4 CHAR-03 E2E-Tests grün; 49 Unit-Tests grün; window.diceHistory exportiert; roll-char-*-stop Handler; Commits 88b7752/ea9a64c)
- [x] Phase 6 ausführen Plan 4 (06-04 XP-/Milestone-Tracker, CHAR-01 Wave-4): ✓ (2026-06-15, finish-combat-xp Trigger + XP-Verteilungs-Modal + applyXpDistribution; Detail-Modal XP-Block + canLevelUp-Hint; confirm-level-up + milestone-level-up Handler; Milestone-Modus .char-xp-milestone-section; 4 CHAR-01 E2E-Tests aktiviert + grün; 421 Unit-Tests grün; Commits 2e18db8/6392d62)
- [x] Phase 6 ausführen Plan 5 (06-05 Gap-Closure D-07 Leveling-Toggle): ✓ (2026-06-16, .party-leveling-toggle Segmented-Control in #party-overview; set-leveling-mode Handler mit Whitelist ctx.value 'xp'|'milestone', plain save(), renderParty(), Live-Refresh offenes Detail-Modal; party.css Styles; neuer E2E-Test via UI-Klick (kein page.evaluate); 9/9 E2E grün; 421 Unit grün; Commit 52d973e)
- [x] Phase 6 ausführen Plan 9 (06-09 Gap-Closure xp-exclude-players, CHAR-01): ✓ (2026-06-18, #xp-dist-char-list Checkbox-Auswahlliste + Alle/Keine Quick-Select; showXpDistributionModal rendert alle D.characters (esc, HP-Badge, default checked); updateXpDistPreview nutzt selectedCount; applyXpDistribution kein hpCurrent-Filter, 0-Guard Warn-Toast; xpDistSelectAll/None; 4 neue E2E-Tests + 15/15 E2E grün; 421 Unit grün; Commit 1ff49ac)
- [x] Phase 7 diskutieren: `/gsd-discuss-phase 7` ✓ (2026-06-19, 07-CONTEXT.md, D-01..D-05)
- [x] Phase 7 planen: `/gsd-plan-phase 7` ✓ (2026-06-19, 4 Pläne / 3 Wellen, `--skip-ui` lean, Research 595a445 + manuelle 07-VALIDATION.md, Plan-Checker 0 Blocker / 3 Doku-Warnings behoben/akzeptiert; Plan-Commit 34ad3db)
- [x] Phase 7 ausführen: `/gsd-execute-phase 7` ✓ (2026-06-20, 4/4 Pläne sequenziell auf `main`; Wave1 07-01 Foundation, Wave2 07-02 Soundboard-Engine + 07-04 Würfel-Statistiken, Wave3 07-03 Soundboard-UI; Verifier 14/14 must-haves; Code-Review CR-01 (kritisch: Soundboard-Klick-Aktionen tot via parseEntityId) + WR-01/WR-03 gefixt in Commit 40a9009; Build exit 0, 432 Unit-Tests grün)
- [x] Phase 7 — 4 hörbare Audio-UAT ✓ (2026-06-20, 4/4; dabei 3 Bugs gefunden+gefixt: Doppel-Import 75aadfe, Audio-läuft-weiter b85dbe1, Live-Volume 801ed48)
- [ ] Milestone v1.0 abschließen: `/gsd-complete-milestone` (alle 7 Phasen complete)
- [x] Phase 9 — Regressionsnetz steht, D-04a Doppel-Grün geführt und protokolliert (09-BASELINE.md, Commit `c8239d7`) ✓ (2026-07-25, 09-05-PLAN.md; Netz eingefroren — Migration darf ab hier beginnen)
- [x] Phase 9 ausführen: `/gsd-execute-phase 9` ✓ (2026-07-25, 9/9 Pläne; execCommand-Migration 21→0 Call-Sites über sieben Migrationsgruppen A–G; komplettes Netz + volle Suiten grün nach jeder Gruppe; Handcheck im Browser freigegeben; EDIT-01/EDIT-02/EDIT-03 vollständig erfüllt — Phase 9 komplett)
- [x] Phase 10 ausführen: `/gsd-execute-phase 10` ✓ (2026-07-25, 5/5 Pläne in 5 Wellen; Anzeige-Grenze + Import-Grenze geschlossen, Sanitizer-Beweisnetz + Paritätstest, `<strike>`-Whitelist, Tabellenzweig-`on*`-Fix, Abschluss-Audit; alle Wave-Gates grün)
- [x] Phase 10 Gap-Plan erstellt: `/gsd-plan-phase 10 --gaps` ✓ (2026-07-25, 10-06-PLAN.md, Welle 6, 3 Tasks, Plan-Checker VERIFICATION PASSED im 1. Durchlauf, Requirements 2/2 + Decision-Coverage 16/16; Commits b8b2877/b48f9ba)
- [x] **Phase 10 Lücke SC3 schließen** ✓ (2026-07-25, 10-06-PLAN.md: Tabellenzweig in `ui/editors/rich-text.js` endet mit `window.sanitizeHTML()` als LETZTER Stufe, Mehrfach-Vektor-Regressionstest, T-10-15/T-10-17 korrigiert). **Zweiter, unabhängig gefundener Befund auf derselben Fläche geschlossen** ✓ (2026-07-25, 10-07-PLAN.md, Gap-Closure Runde 2: CSS-basierter Ausgangs-Beacon — Stil-Attribut-Filter prüfte nur den Eigenschaftsnamen, nie den Wert; Fix: Wertprüfung pro Deklaration gegen Erlaubnisliste `allowedStyleFunctions`/`isSafeStyleValue()` in beiden Sanitizer-Zwillingen; zusätzlich WR-01/WR-02/WR-03/IN-01 aus `10-REVIEW-GAP.md` behoben; `threats_open: 0` in `SECURITY.md` + `10-SECURITY.md` wieder wahr — Phase 10 SEC-01/SEC-02 vollständig erfüllt, bereit für `/gsd-verify-work 10`).
- [ ] Phase 10 Zusatzbefund IN-01 (nicht blockierend, echter Anzeigebug): `hasHtmlTags` in `ui/editors/markdown-converter.js:264` ist die nie verdrahtete Wächtervariable einer Guard — Markdown-Konvertierung läuft dadurch unbedingt über bereits-HTML; URLs mit ≥2 Unterstrichen werden korrumpiert (`Der_Hobbit_Buch` → `Der<i>Hobbit</i>Buch`, Link kaputt). Nur Anzeige, gespeicherte Daten unberührt.
- [ ] Phase 10 Zusatzbefunde (kosmetisch/fragil, unbestätigt dringlich): WR-02 doppeltes `data-id` in `features/wiki/wiki.js:391-392` (Parser verwirft das zweite, folgenlos); IN-02 un-escapte Regex-Capture in `parseWikiLinks()` (aktuell nicht ausnutzbar). WR-03 und WR-01 wurden gegengeprüft und sind KEINE Befunde.
- [x] Phase 10 abgeschlossen ✓ (2026-07-25, 7/7 Pläne, Verifikation 4/4 Must-Haves; SEC-01/SEC-02 Complete; Jest 621/621, Playwright 318 passed/2 skipped)
- [ ] **Latente Toast-Race in zwei Test-Dateien (Phase-8-Nachzug fehlt)**: `tests/e2e/crud/locations.spec.js` und `tests/e2e/crud/encounters.spec.js` haben das Seed aus Plan 08-02 NIE bekommen. 08-02 fand die Ursache (Boot-Zeit-`save()` aus `initRandomTables()` und `validateDataIntegrity()` löst den Backup-Hinweis-Toast aus, der den geteilten `#toast`-Knoten überschreibt, den Validierungstests auslesen) und behob sie per vollständigem `D`-Seed vor `loadApp()` — aber nur in `quests`/`npcs`/`party`. Symptom: `locations.spec.js:61` „Ort ohne Namen zeigt Fehlermeldung" fällt unter Volllast sporadisch mit Timeout aus (`fullyParallel: true`, lokal unbegrenzte Worker); isoliert 3/3 grün, Volllauf-Wiederholung grün. Fix: Seed-Payload aus `08-02-SUMMARY.md` in beide Dateien übernehmen.
- [ ] Codebase-Map veraltet (Drift-Gate-Hinweis, nicht blockierend): `/gsd-map-codebase`

---

## Session Continuity

**Last session:** 2026-07-25T22:11:41.786Z
**Stopped at:** Completed 11-06-PLAN.md
**Resume file:** None

**Last action:** Komplette Milestone-UAT abgeschlossen (2026-06-20 → 2026-07-20): alle 5 offenen Human-UAT-Sessions via `/gsd-verify-work` durchgetestet — 07 (4/4), 06 (5/5), 05 (2/2), 01 (3/3), 02 (6/6). Alle 7 VERIFICATION.md jetzt `status: passed`. Dabei gefundene+gefixte Bugs: Soundboard-Doppel-Import (75aadfe), Audio-läuft-nach-Szene-Löschen (b85dbe1), Volume nicht live (801ed48), Manifest-CORS unter file:// (cd75093), Konsolen-Hygiene (c029f11), Datei-Backup schrieb nie bei Entity-CRUD — window.save-Wrapper strukturell wirkungslos für bare save() (1430e8c), generischer registerPostSaveHook + DM-Screen-Live-Sync-Umstellung + CLAUDE.md-Pattern-Korrektur (6ea8309), „Anderen Ordner wählen"-Button (cc2af9e). Nebenbei: Repo mit origin gemergt (7 Mai-Commits, alter pages.yml-Deploy entfernt 7f4858a), 348 Commits gepusht, GitHub-Pages-Deploy live verifiziert (PWA installierbar, SW-Update-Flow, Datei-Backup, Migrations-Wizard file://→PWA). Zusätzlich in der Session: Soundboard-Erweiterungen (Loop-Toggle/Crossfade-Loop/Fortschritt 6636297, Per-Track-Play noch offen als Design), gruppierte Navigation (3d77ec0).
**Next action:** Phase 8 ausführen — `/gsd-execute-phase 8` (Wave 1 → 08-01 zuerst; Sampling gemäß 08-VALIDATION.md: volle Suite zweimal in Folge grün vor `/gsd-verify-work`). Offene Design-Entscheidung Soundboard Per-Track-Play (Layering gewählt, Szenen-Play-Variante unbestätigt). Optionale Altlasten: Phase-1-Security-Audit (`/gsd-secure-phase 1`), Phase-1-Code-Review-Findings, Phase-3 Browser-Checks (nicht-blockierend).

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
- [Phase 05-05]: advanceCalendarDate ohne pushUndo (Reise-Abschluss macht eigenes pushUndo vor Aufruf); Auto-Vorschlag-Dismissed in sessionStorage statt D (kein Undo-Bloat)
- [Phase 05-06]: startReise ohne D.reisen-Array (reine Berechnungs-UI, kein persistenter Zustand); jahreszeitAusDatum mit Fallback-Dict (kein crash bei fehlendem HARPTOS_SEASONS)
- [Phase 05-07]: FRAKTIONS_RUF_STUFEN in fraktionen-render.js (nicht crud.js) — rufStufe() von render + crud genutzt; setzeRuf() extra für direktes Setzen; Ruf-Buttons ±5 + ±10; npc.factionId parseInt()||null (0→null)
- [Phase ?]: [Phase 06-01]: window.MIGRATIONS export added to version-migration.js for test access via vm context
- [Phase ?]: [Phase 06-01]: XP_LEVEL_THRESHOLDS 0-based indexing (index[1]=300 for Level 2); canLevelUp uses XP_LEVEL_THRESHOLDS[nextLevel-1]
- [Phase 06-03]: roll-char-attack-stop uses dedicated handler (not bestiary-roll-dice/rollQrefDice) — rollQrefDice skips addToDiceHistory
- [Phase 06-03]: window.diceHistory exported from dice-core.js; E2E tests check (window.diceHistory||[]).length
- [Phase 06-04]: endCombat() unberührt — XP-Verteilung als separate finish-combat-xp Aktion (RESEARCH Muster 4 anti-overload)
- [Phase 06-04]: Milestone-Modus nutzt .char-xp-milestone-section (ohne .char-xp-section) für korrekte E2E not.toBeVisible()-Assertion
- [Phase 06-04]: pushUndo('XP verteilt') VOR distributeXP-Aufruf — distributeXP mutiert activeChars in-place sofort
- [Phase 06-05]: set-leveling-mode verwendet plain save() ohne saveUndoState() — Settings-Änderung ist trivial reversibel (Inspiration-Precedent)
- [Phase 06-05]: Modal-Live-Refresh liest Charakter-ID aus erstem [data-id]-Element im #char-detail-modal; kein neues data-Attribut nötig
- [Phase 05-08]: close-modal-overlay für transiente Modals (insertAdjacentHTML): remove() ist korrekt, hide-modal würde nur .show entfernen (Zombie); E2E via page.evaluate(switchView) statt page.click bei Fullscreen-Overlay (Pointer-Interception)
- [Phase ?]: Migration-Banner-Offset nutzt gemessene CSS-Custom-Property (--migration-hint-height) statt fixem 48px-Wert, da Bannerhoehe bei schmalen Viewports durch Textumbruch waechst
- [Phase ?]: Seed-Payload erweitert um randomTables/timers/shops/campaign/_nextId — zweite unabhaengige Boot-Zeit-Toast-Race (initRandomTables/validateDataIntegrity) via Stack-Trace-Analyse gefunden
- [Phase ?]: quests.spec.js Titel-Assertion auf title korrigiert (Validierungs-Schema nutzt englischen Feldnamen, Mismatch war durch Toast-Race maskiert)
- [Phase ?]: Phase 08-03: SRD-Monsterdatensatz-Counts, Fuzzy-Suche 'mindestens N', Zufalls-Wettertext, Random-HP-Variation und echte Date.now()-Timestamps bleiben bewusst loose (D-04) — nur deterministisch aus Fixtures ableitbare Counts wurden auf toBe(N) gehaertet
- [Phase ?]: Phase 08-03: quests.spec.js Root-Cause gefunden — .quest-details (edit/delete-quest) ist bis zum Klick auf .quest-header per CSS eingeklappt; vorherige isVisible()-Guards maskierten dieses fehlende Aufklappen als stillen Pass
- [Phase ?]: Phase 08-04: build-Jobs needs-Array um e2e erweitert (nicht nur smoke-test) — blockiert D-03-konform bereits den Production-Build bei rotem E2E-Lauf
- [Phase ?]: Baseline-Definition (Phase 9, 09-01): option-a — EDITOR_FONTS/TOOLBAR_DIMENSIONS werden in Plan 09-02 wiederhergestellt, reparierter Zustand gilt als eingefrorene Baseline (bewusste Ausnahme zur v1.1-Leitplanke, kein neues Feature, sondern Rueckgaengigmachen einer Fremd-Regression)
- [Phase ?]: A4-Teilentscheidung (Phase 9, 09-01): Strikethrough-Persistenz-Bug (sanitizeHTML kennt <s> aber nicht <strike>) wird eingefroren, nicht repariert; als Datenintegritaets-Item fuer Phase 10 vorgemerkt
- [Phase ?]: EDITOR_FONTS/TOOLBAR_DIMENSIONS wiederhergestellt + setEditorFont/setEditorFontSize Argument-Mismatch behoben (Baseline-Entscheidung option-a umgesetzt, Phase 9, 09-02)
- [Phase ?]: wiki.spec.js-Formatierungsblock ersatzlos entfernt statt umgeschrieben (Phase 9, 09-02) — eine Quelle der Wahrheit in editor-formatting.spec.js
- [Phase 9, 09-03]: Toggle-Tests der floating Toolbar brauchen Zeichen-Offset-Selektion auf dem Textknoten des Format-Tags statt range.selectNodeContents(element) — sonst trifft applyFloatingFormat()s .parentElement.closest(tag)-Erkennung den Editor-Container statt das Format-Tag (reines Testdesign-Detail, kein App-Bug)
- [Phase 9, 09-03]: highlight('none')-UI-lose-Test reproduziert exakt die 09-BASELINE.md-Messmethode (mark-basiertes set-highlight-color der statischen Toolbar zuerst, dann direkter window.formatText()-Aufruf) statt des eigenen span-basierten highlight-Zweigs — sonst waere das gemessene Markup nicht Baseline-konform
- [Phase ?]: Sicherheits-Regressionstest (T-09-01) nutzt bewusst ein Einfuege-Fragment ohne <table>-Wrapper (faellt sicher auf insertText() zurueck); der gleiche Payload IN einer Tabelle ueberlebt empirisch bis in den Editor-DOM (Tabellen-Zweig entfernt keine on*-Attribute) - als WINDOWS.md-Fund vorgemerkt, nicht in Plan 09-04 behoben (Plan-Kriterium: kein Produktionscode geaendert)
- [Phase ?]: dismissFloatingToolbar() ruft window.hideFloatingToolbar() direkt statt Escape - Escape wuerde in Modal-Editoren zusaetzlich das Modal schliessen und den Testfluss maskieren
- [Phase ?]: D-04a Doppel-Grün-Nachweis: Netz zweimal ohne Retry gegen unveränderten Editor-Code (c8239d7) grün; Netz ab jetzt eingefroren
- [Phase ?]: closestEditorAncestor() eingefuehrt (Phase 9, 09-06): korrigiert Toggle-Erkennung bei range.selectNodeContents(element)-Selektionen, die applyFloatingFormat()-Muster sonst verfehlt
- [Phase ?]: Zaehlnachweis-Test-Ausnahme zweimal angewandt statt nur final in 09-09 (Phase 9, 09-06): 21->16 nach Gruppe A, 16->12 nach Gruppe B, dokumentiert in 09-BASELINE.md
- [Phase 09]: Doppel-Dispatch-Guard (_lastFontCallKey) in rich-text.js statt Fix in event-delegation.js (Plan 09-07) — EventDelegation._handleChange UND _handleInput feuern beide fuer select data-action Elemente; Fix im Datei-Scope des Plans gehalten
- [Phase 09]: clearInlineFormattingAtSelection() um Tag-Unwrap (b/i/u/s/strike) erweitert statt Duplikat (Plan 09-07) — Repliziert empirisch verifizierte removeFormat-Eigenheit; Verhalten fuer bestehenden Aufrufer (highlight none) unveraendert
- [Phase ?]: sanitizeInsertedInlineStyle() als deterministische String-Transformation statt CSSOM-Touch (Plan 09-08) - reproduziert die execCommand-eigene background/color-Eigenheit bei Mehrfach-Deklarationen exakt
- [Phase ?]: Zero-Width-Space-Platzhalter + deleteData()-Cleanup fuer insertLineBreakAtSelection() (Plan 09-08) - Cursor hinter trailing br ist ohne Anker in Chromium nicht stabil
- [Phase ?]: [Phase 09, 09-09]: defaultParagraphSeparator-Setup-Aufruf ersatzlos entfernt statt kompensiert (A1-Referenztest belegt Wirkungslosigkeit) - toBe(1)->toBe(0) bereits in Task 1 gesetzt
- [Phase ?]: [Phase 09]: Phase 9 abgeschlossen - EDIT-01/EDIT-02/EDIT-03 vollstaendig erfuellt (21->0 execCommand-Call-Sites, Regressionsnetz gruen, Handcheck freigegeben)
- [Phase ?]: [Phase 10, 10-01]: renderWikiTOC(entry.content) bleibt bewusst auf dem Rohinhalt statt auf dem sanitisierten/verankerten Markup — extractWikiTOC()/addTOCAnchors() liefern bei reinen HTML-Ueberschriften dieselbe Trefferreihenfolge; Restbedingung bei gemischtem HTML+Markdown-Content dokumentiert
- [Phase ?]: [Phase 10, 10-02]: D-07/WR-03-Fix (Undo+Backup im Überschreib-Zweig von importDataGlobal()) in Task 2 statt Task 3 umgesetzt, weil Task 2s eigenes Verify-Gate die Task-1-Strukturprüfung dafür einschließt
- [Phase ?]: [Phase 10, 10-02]: validatedItems-Abbildung liegt tatsächlich in showImportModal(), nicht in executeImport() wie im Plan-Text notiert — Sanitisierung an der realen Stelle verdrahtet, Struktur-Test entsprechend korrigiert
- [Phase ?]: [Phase 10, 10-03]: Paritätstest-Strukturprüfung (a) nutzt Tag-Namen-Liste statt direktem allowedTags-Zugriff — allowedTags ist function-scoped const, ueber vm.runInContext(expr) nicht erreichbar
- [Phase ?]: [Phase 10, 10-03]: esc(0)-Drift zwischen utils/basic.js und utils/testable-utils.js bewusst nur dokumentiert (eigener Testfall), nicht behoben - ausserhalb des Plan-Scopes (nur <strike>-Whitelist-Fix)
- [Phase ?]: [Phase 10, 10-04]: Kein-Bild-Element-Kriterium als scope-konforme Fassung interpretiert (kein on*-Attribut statt vollstaendiger Tag-Entfernung) - explizite Plan-Prohibition schliesst DOMParser-Umbau/weitere Attribut-Entfernung aus
- [Phase ?]: [Phase 10, 10-04]: Fehlersammlung im neuen Sicherheitstest auf pageerror verengt (nicht generische console-Fehler) - beibehaltenes inertes img src=x erzeugt harmlosen Ressourcen-404-Konsoleneintrag ohne Sicherheitsrelevanz
- [Phase 10, 10-05]: Sanitisierung an beiden Grenzen (Anzeige UND Import-Rohdaten) als dauerhaftes Muster (D-01) — eine Schicht allein lässt Lücken, da mehrere Render-Pfade auf saubere Speicherinhalte vertrauen
- [Phase 10, 10-05]: HTML_FIELDS_BY_TYPE-Feldliste (neun Entity-Typen) als Ergebnis des Render-Pfad-Audits (D-02) — bewusst kein rekursives Sanitisieren aller String-Felder, um Nicht-HTML-Text (Namen, Würfelformeln mit spitzen Klammern) nicht zu beschädigen; künftige Import-Felder müssen die Liste explizit erweitern
- [Phase 10, 10-05]: <strike> additiv in die sanitizeHTML-Erlaubnisliste aufgenommen (D-06) — Reversibility costly: einmal in der Whitelist, erzeugen Nutzer-Daten <strike>-Markup, das eine spätere Verengung wieder zerstören würde; Paritätstest (61 Tests) verhindert künftige Drift zwischen utils/basic.js und utils/testable-utils.js
- [Phase 10, 10-05]: Zwei bewusst akzeptierte Risiken dokumentiert (D-08) statt behoben: keine Content-Security-Policy (Single-User-Offline-App ohne Server, 'unsafe-inline' architekturbedingt ohnehin nötig) und die Breite der class/style-Erlaubnis im Sanitizer (kein Multi-Tenant-Szenario) — dritter akzeptierter Punkt (regexbasierte Paste-Zeit-Bereinigung, T-10-17) in SECURITY.md ergänzt, da sanitizeHTML() als maßgebliche Speichern-Grenze diese Schwäche nicht teilt
- [Phase ?]: [Phase 10, 10-06]: Tabellenzweig ueber Allowlist-Sanitizer (window.sanitizeHTML) als letzte Einfuege-Stufe statt weiterem Denylist-Regex (SC3, CR-01) - Mehrfach-Vektor-Test nutzt iframe-srcdoc statt reinem script-Element (createContextualFragment markiert parser-erzeugte scripts als inert)
- [Phase ?]: [Phase 10, 10-06]: T-10-15 auf critical korrigiert, T-10-17/AR-10-02 im Geltungsbereich auf die verbleibende Darstellungs-Kosmetik-Kette verengt, T-10-23..T-10-29/AR-10-05 neu - threats_open: 0 ist in SECURITY.md und 10-SECURITY.md wieder wahr
- [Phase 10, 10-07]: CSS-basierter Ausgangs-Beacon (zweiter, unabhaengig von zwei Pruefern waehrend der 10-06-Verifikation gefundener Vektor auf derselben Flaeche) geschlossen ueber Wertpruefung pro Stil-Deklaration (allowedStyleFunctions/isSafeStyleValue, Erlaubnisliste statt Verbotsliste) identisch in utils/basic.js UND utils/testable-utils.js - Angriffsvektoren nutzen die Eigenschaft 'background' (bereits erlaubt), nicht 'background-image' (nie erlaubt, waere kein Beweis)
- [Phase 10, 10-07]: T-10-30..T-10-40/AR-10-06..AR-10-12 neu, WR-01 (Zeilenverweise), WR-02 (Datumsangaben 2026-07-26->2026-07-25), WR-03 (3 feste Wartezeiten entfernt), IN-01 (Protokollliste vollstaendig) aus 10-REVIEW-GAP.md behoben - threats_open: 0 in SECURITY.md und 10-SECURITY.md wieder wahr, jeder bekannte Restrisiko-Punkt hat Disposition (D-12)
- [Phase ?]: [Phase 11, 11-01]: parse_js_string_array() strips '//' line comments before extracting quoted literals (Tokenizer-Robustheitsrisiko Option 2) — eliminates apostrophe-in-comment parsing risk
- [Phase ?]: [Phase 11, 11-01]: check_module_list_sync() deleted outright (not kept as no-op) — its sole job, comparing two lists, is structurally impossible once there is only one list (D-01 SSoT)
- [Phase ?]: [Phase 11, 11-02]: load_template_list() reuses parse_js_string_array() unchanged despite TEMPLATES being function-local in loader.js — text-based regex parser is scope-agnostic
- [Phase ?]: [Phase 11, 11-02]: load_css_import_order() uses a dedicated regex instead of parse_js_string_array() — assets/styles.css has no comments between @import lines, so comment-stripping is unneeded
- [Phase ?]: [Phase 11, 11-03]: Pass 3 (remove_duplicate_functions) ersatzlos entfernt statt repariert (D-05) — check_duplicate_functions() auf function/const/let/class per Klammertiefen-Tracking erweitert (D-06); test_build_generates_valid_javascript-Vorbefund bleibt explizit ausserhalb des Scopes, WINDOWS-Eintrag 2 offen
- [Phase ?]: [Phase 11, 11-04]: Blocking-precondition test_build_generates_valid_javascript false positive fixed via brace-depth tracking (mirrors check_duplicate_functions()) before wiring pytest tests/build/ into CI (D-03) - WINDOWS.md entry 2 closed
- [Phase ?]: [Phase 11, 11-04]: Action-Version-Bumps auf Major-Tags (@vN, kein SHA) verifiziert via gh api zur Ausfuehrungszeit (D-09) - checkout/setup-node/setup-python/upload-artifact v7, download-artifact v8, configure-pages v6, upload-pages-artifact/deploy-pages v5
- [Phase ?]: [Phase 11, 11-05]: D-10 Favicon-Data-URI verifiziert per Raw-CDP-Probe (nicht nur ueber den committed Smoke-Test) - headless Chromium fuehrt den impliziten favicon.ico-Fetch nie aus, headed-Modus feuert real mit 404 aber Playwright-Page-Events sehen ihn nie; Fix bestaetigt via manuelle CDP-Gegenprobe
- [Phase ?]: [Phase 11, 11-05]: D-11-Zweig apple-Tag bleibt (additiv, nicht ersetzt) - Konsolen-Sammlung leer vor und nach dem Ergaenzen von mobile-web-app-capable auf Chromium 143.0.7499.4, dreifach unabhaengig gegengeprueft (console/CDP-Log/CDP-Audits)
- [Phase ?]: [Phase 11, 11-06]: 22/46 CONCERNS.md-Eintraege waren bereits durch Phasen 1/8-10/11-01..05 erledigt, ohne dass CONCERNS.md es wusste; Triage belegt jede Disposition gegen Live-Code statt gegen die CONCERNS-Beschreibung (D-15)
- [Phase ?]: [Phase 11, 11-06]: 15 Restposten als DEBT-01..15 in REQUIREMENTS.md uebernommen (D-16), inkl. 4 aus STATE.md Open TODOs (IN-01/WR-02/IN-02/Toast-Race); ARCH-04 bewusst NICHT als komplett markiert - nur die Triage-Haelfte ist erledigt, Map-Refresh folgt in Plan 11-07

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone

### Blockers

- [Phase 11, 11-05] WINDOWS.md Eintrag 3 (open): D-12-Smoke-Test kann Favicon-404 strukturell nicht falsifizieren (headless fetcht ihn nie; headed-Playwright-Page-Events sehen ihn nie) - Fix ist manuell per Raw-CDP verifiziert, aber der automatisierte Nachweis bleibt eine Luecke
