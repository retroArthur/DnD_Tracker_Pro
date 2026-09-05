---
phase: "13"
slug: "h-rtung-wartbarkeit"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-06"
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Abgeleitet aus `13-RESEARCH.md` → `## Validation Architecture`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.2.0 (Unit) + Playwright 1.57.0 (E2E) |
| **Config file** | `jest.config.cjs` (testEnvironment: jsdom, setupFilesAfterEnv: `tests/setup.js`) · `playwright.config.js` (testDir: `tests/e2e`, baseURL: `dist/dnd-tracker-bundled.html`) |
| **Quick run command** | `npx jest tests/unit/<datei>.test.js` |
| **Full suite command** | `npm run test` (Jest) · `PYTHONIOENCODING=utf-8 python build.py && npx playwright test` (E2E) |
| **Estimated runtime** | ~30 s (Jest voll) · ~8–12 min (Playwright voll inkl. Build) |

**Bundle-Vorbedingung für E2E:** Playwright läuft gegen `dist/dnd-tracker-bundled.html`. `npm run build`
schreibt nur das Production-Bundle — vor jedem E2E-Lauf `PYTHONIOENCODING=utf-8 python build.py`
(Dev-Variante) ausführen, sonst testet die Suite einen veralteten Stand.

---

## Sampling Rate

- **After every task commit:** die in der Verifikationskarte zur Aufgabe genannte(n) Unit-Test-Datei(en)
- **After every plan wave:** `npm run test` (voller Jest-Lauf)
- **Before `/gsd-verify-work`:** `PYTHONIOENCODING=utf-8 python build.py && npx playwright test` grün,
  **plus** die MAINT-04-/MAINT-06-Grep-Checks liefern 0 Treffer außerhalb Kommentaren bzw.
  `DEBUG_MODE`-Guards
- **Max feedback latency:** 30 s (Unit-Ebene)

---

## Per-Task Verification Map

> Task-IDs entstehen erst mit den PLAN.md-Dateien. Die Zeilen unten sind **anforderungsgebunden**
> vorgezeichnet; `/gsd-validate-phase` bindet sie an die konkreten Task-IDs.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | SEC-03 | T-13-01 | `call`-Aktion ruft ausschließlich Whitelist-Ziele auf; unbekanntes Ziel wird verworfen und protokolliert | unit | `npx jest tests/unit/event-delegation.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | SEC-03 | T-13-01 | Alle 131 legitimen statischen `data-action="call"`-Ziele funktionieren unverändert | e2e | `npx playwright test tests/e2e/integration/workflows.spec.js` | ✅ | ⬜ pending |
| TBD | TBD | TBD | SEC-04 | T-13-02 | `parseWikiLinks()` escapt die Regex-Capture; `<`/`>`/`"`/`'` in `linkText` erzeugen kein Markup | unit | `npx jest tests/unit/wiki-links.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PERF-01 | — | Save-Pfad ohne Blob-Allokation pro Operation, Schwellenwerte unverändert | unit | `npx jest tests/unit/stability.test.js -t "saveImmediate"` | ✅ | ⬜ pending |
| TBD | TBD | TBD | PERF-01 | — | Undo dedupliziert identische Snapshots und verdrängt bei Byte-Budget-Überschreitung den ältesten Eintrag | unit | `npx jest tests/unit/stability.test.js -t "Undo"` | ⚠️ W0 (Datei ✅, Fälle fehlen) | ⬜ pending |
| TBD | TBD | TBD | PERF-02 | — | `diceStats`-Store hat harte Obergrenze und Löschfunktion; Aggregation läuft über Cursor statt Vollladung | unit | `npx jest tests/unit/dice-stats-idb.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | MAINT-01 | — | `rich-text.js`-Split verhaltensneutral — eingefrorenes 79-Test-Netz aus Phase 9 bleibt grün | e2e | `npx playwright test tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js` | ✅ | ⬜ pending |
| TBD | TBD | TBD | MAINT-01 | — | `dmscreen-render.js`: Charakterisierungs-Snapshot existiert und ist grün **vor** der ersten Codeverschiebung (D-04) | unit | `npx jest tests/unit/dmscreen-characterization.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | MAINT-01 | — | Alle vier Splits verhaltensneutral gegen die volle Suite | e2e | `PYTHONIOENCODING=utf-8 python build.py && npx playwright test` | ✅ | ⬜ pending |
| TBD | TBD | TBD | MAINT-02 | — | Tab-Registry ist gegen Funktions-Umbenennung abgesichert (Registry-Einträge zeigen auf existierende Funktionen) | unit | `npx jest tests/unit/tab-registry.test.js` | ⬜ zu prüfen | ⬜ pending |
| TBD | TBD | TBD | MAINT-03 | — | URLs mit ≥2 Unterstrichen (`foo_bar_baz`) bleiben unkorrumpiert; `hasHtmlTags`-Entscheidung bricht Tabellen-/Read-Aloud-Erkennung nicht | unit | `npx jest tests/unit/markdown-converter.test.js` | ⚠️ W0 (Datei ✅, Fälle fehlen) | ⬜ pending |
| TBD | TBD | TBD | MAINT-04 | — | 0 `execCommand`-Treffer außerhalb Kommentaren im gesamten Quellbaum | smoke (grep) | `grep -rn "execCommand" --include=*.js . \| grep -v dist/ \| grep -v node_modules \| grep -v "^\s*//"` | ✅ | ⬜ pending |
| TBD | TBD | TBD | MAINT-05 | — | `initPerformanceMonitoring()` startet bei erneutem Aufruf kein zweites Interval (Guard-Parität zu `startAutoBackup()`) | unit | `npx jest tests/unit/backups.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | MAINT-05 | — | Tote `mindmap`-Seeds, `const D`-Überschattung (`soundboard-player.js:145`) und doppeltes `data-id` sind entfernt | unit | `npx jest tests/unit/soundboard.test.js` | ✅ | ⬜ pending |
| TBD | TBD | TBD | MAINT-06 | — | Keine ungeguardeten `console.*`-Aufrufe in Produktionspfaden (Baseline: 89 Treffer) | smoke (grep) | `grep -rnE "console\.(log\|error\|warn\|info\|debug)" --include=*.js . \| grep -v tests/ \| grep -v dist/ \| grep -v node_modules` | ✅ | ⬜ pending |
| TBD | TBD | TBD | MAINT-06 | — | Kopfkommentare im Datei-Backup beschreiben `registerPostSaveHook()` statt `window.save` (`file-backup-manager.js:674`) | unit | `npx jest tests/unit/file-backup.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/event-delegation.test.js` (neu) — SEC-03: Whitelist blockiert unbekannte Ziele, legitime Ziele passieren
- [ ] `tests/unit/wiki-links.test.js` (neu) — SEC-04: `parseWikiLinks()`-Escaping, insbesondere `linkText` mit `<`/`>`/`"`/`'`
- [ ] `tests/unit/stability.test.js` (Ergänzung) — PERF-01: Undo-Dedupe (identischer Snapshot wird nicht gepusht) und Byte-Budget-Verdrängung
- [ ] `tests/unit/dice-stats-idb.test.js` (neu, `createMockIDB`-Muster) — PERF-02: Cap, Löschfunktion, Aggregat-Cursor-Pfad
- [ ] `tests/unit/dmscreen-characterization.test.js` (neu) — MAINT-01/D-04: **harte Reihenfolge-Vorgabe**, muss vor der ersten Codeverschiebung in `dmscreen-render.js` grün sein; Snapshot gegen die öffentliche API (`window.renderDMScreen` / `getDMScreenWidgets()`), damit er den Split unverändert übersteht
- [ ] `tests/unit/markdown-converter.test.js` (Ergänzung) — MAINT-03: `foo_bar_baz`-URL bleibt unkorrumpiert; Regressionsfall, dass die `hasHtmlTags`-Entscheidung Tabellen-/Read-Aloud-Erkennung nicht bricht
- [ ] `tests/unit/backups.test.js` (neu oder Ergänzung in `stability.test.js`) — MAINT-05: Guard-Parität zwischen `startAutoBackup()` und `initPerformanceMonitoring()` bei Mehrfachaufruf

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Editor-Formatierung fühlt sich nach dem `rich-text.js`-Split unverändert an (Auswahl, Floating-Toolbar, Read-Aloud-Stile) | MAINT-01 | Subjektive Interaktionsqualität; das 79-Test-Netz deckt die Funktionalität, nicht das Bediengefühl | `dist/dnd-tracker-bundled.html` per `file://` öffnen → Wiki-Eintrag anlegen → Text markieren → Floating-Toolbar prüfen (Fett/Kursiv/Schriftart/Read-Aloud), Tabelle einfügen, Formatierung entfernen |
| DM-Screen-Widget-Layout (Masonry) nach dem `dmscreen-render.js`-Split | MAINT-01 | CSS-Masonry-Umbruch ist visuell, nicht per Assertion greifbar | DM-Screen öffnen → alle 21 Widget-Typen einblenden → bei 320 px, 768 px und Vollbreite auf Spaltenumbruch und Header-/Grid-Zuordnung prüfen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
