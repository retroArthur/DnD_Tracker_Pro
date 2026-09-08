---
phase: "15"
slug: "befundlage-vorlauf"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-08"
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Quelle: `15-RESEARCH.md` § Validation Architecture (Werte am lebenden Baum bei HEAD `522ad13` gemessen).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^30.2.0 (`jest.config.cjs`) · Playwright (`playwright.config.js`) · pytest (`tests/build/`) |
| **Config file** | `jest.config.cjs`, `playwright.config.js`, `pytest` über `tests/build/` |
| **Quick run command** | `npx jest tests/unit/design-consistency.test.js` |
| **Full suite command** | `npx jest && npx playwright test && python -m pytest tests/build -q && python build.py && python build.py --production` |
| **Estimated runtime** | Quick ~0,6 s · Jest voll ~3,2 s · Playwright ~2,1 min · pytest build ~0,9 s |

**Gemessene Ausgangswerte (Baseline, HEAD `522ad13`):**

| Suite | Baseline |
|-------|----------|
| `npx jest` | 53 Suiten / 1217 Tests / 50 Snapshots grün |
| `npx playwright test` | 354 Fälle — 352 passed, 2 skipped |
| `npx jest tests/unit/design-consistency.test.js` | 64/64 grün |
| `python -m pytest tests/build -q` | 24 passed |
| `python build.py` / `python build.py --production` | beide laufen durch |

---

## Sampling Rate

- **After every task commit:** `npx jest tests/unit/design-consistency.test.js` (~0,6 s) plus die
  vom Task betroffene gezielte Suite
- **After every plan wave:** volle Kette —
  `npx jest && npx playwright test && python -m pytest tests/build -q && python build.py && python build.py --production`
- **Before `/gsd-verify-work`:** volle Suite grün, plus die gezielte Vier-Themes-Sichtung (D-53)
- **Max feedback latency:** ~1 s für den Quick-Run; ~3 min für die volle Kette

---

## Per-Task Verification Map

Task-IDs werden beim Planen gebunden (`15-NN-MM`); diese Karte ist requirement-scoped und wird von
`/gsd-validate-phase` gegen die dann existierenden Tasks aufgelöst.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | BASE-01 | — | N/A | doc-review | `grep -c "B-0" .planning/PROJECT.md` (13 Blocker als Entscheidung gebucht) | ✅ | ⬜ pending |
| TBD | TBD | TBD | BASE-02 | — | N/A | doc-review | Stichproben-`grep` gegen die in D-08 gelisteten 36 Korrekturstellen | ✅ | ⬜ pending |
| TBD | TBD | TBD | BASE-03 | — | N/A | doc-review + ratchet | `grep -c "VERWORFEN (B-07" PATCHES.md` → 1 | ✅ | ⬜ pending |
| TBD | TBD | TBD | BASE-04 | — | N/A | unit (Ratschen-Selbstprüfung) | Beweisprotokoll je Ratsche nach D-49 | ❌ W0 (`15-RATCHET-BASELINE.md`) | ⬜ pending |
| TBD | TBD | TBD | DEAD-01 | — | N/A | unit + build | `node tools/css-usage-report.js` liefert die vier Basisgrößen | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DEAD-02 | — | N/A | unit + e2e + build | volle Kette (siehe Full suite command) | ✅ | ⬜ pending |
| TBD | TBD | TBD | DEAD-03 | — | N/A | unit + e2e + build | volle Kette nach dem Löschlauf | ✅ | ⬜ pending |
| TBD | TBD | TBD | FIX-01 | — | N/A | e2e (`getComputedStyle`) | neuer Playwright-Spec (D-17) gegen `.dms-terrain-item` / `.dms-skill-header.str` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FIX-02 | — | N/A | e2e | neuer Playwright-Spec (D-17) gegen den `.char-slot-pip`-Nachfolger | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FIX-03 | — | N/A | e2e | neuer Playwright-Spec (D-17) gegen `#dice-hero-result` nach einem Wurf | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GATE-03 | — | N/A | unit (Verfahren) | Messprotokoll nach D-49-Checkliste, beidseitig rot-grün | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GATE-04 | — | N/A | doc-review | `PROJECT.md` § Übertrag (D-33) — Geltungsbereich je Befund | ✅ | ⬜ pending |
| TBD | TBD | TBD | GATE-05 | — | N/A | unit + e2e + build + manuell | volle Kette + Vier-Themes-Sichtung (D-53) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/css-usage-report.js` — Node-Skript (Vorbild `tools/generate-eslint-globals.js`),
      produziert die vier DEAD-Basisgrößen und tote Klassen/Blöcke je CSS-Datei, mit
      Präfixerkennung für dynamisch zusammengesetzte Klassennamen (D-20).
      **Ohne dieses Werkzeug sind die Zahlen 438/607/~3.174 nicht reproduzierbar** — sie dürfen
      bis dahin in keinem Task als Zielwert stehen (Annahme A1 im RESEARCH).
- [ ] Neuer Playwright-Spec für die berechneten Endwerte von FIX-01/02/03 (`getComputedStyle`, D-17)
- [ ] `DMS_UNSTYLED_MAX`-Ratsche in `tests/unit/design-consistency.test.js` — zählt regelfreie
      `dms-*`-Klassen aus `class`-Attributen, **nicht** aus `data-action`-Werten/IDs (D-17: 15 statt
      32 ohne den Attribut-Filter)
- [ ] `prefers-reduced-motion`-Rückbau-Ratsche (genau 1 Treffer, in `core.css`, D-19)
- [ ] `declarationsOf()`-Erweiterung um `fonts.css`-Ausschluss (D-42; Vorarbeit für eine spätere,
      in dieser Phase **nicht** geschriebene `font-weight`-Ratsche)
- [ ] `15-RATCHET-BASELINE.md` — Formvorbild `14-GATE-BASELINE.md`, letzter Plan-Schritt (D-26)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 13 Blocker sind *begründet* entschieden (nicht nur erwähnt) | BASE-01 | Begründungsqualität ist nicht greppbar | Diff-Review von `PROJECT.md` gegen die Liste B-01..B-13; je Blocker Entscheidung + Begründung sichtbar |
| 36 korrigierte Zahlen sind an der *richtigen* Stelle eingearbeitet | BASE-02 | Zahlengleichheit ≠ Kontextrichtigkeit | Stichproben gegen die D-08-Liste; je Stichprobe alter und neuer Wert nebeneinander |
| Vier-Themes-Sichtung der App | GATE-05, FIX-01..03 | Visuelle Bewertung | `python build.py`, Bündel öffnen, in allen vier Themes: DM-Screen „Gelände"/„Wissensgebiete", Zauberplatz-Pips, Würfelwurf-Ergebnis (inkl. Crit/Fumble) sichten |
| Geltungsbereich CSS vs. JS/Templates je Befund | GATE-04 | Entscheidung, kein Messwert | `PROJECT.md` § Übertrag prüfen: jeder Befund trägt eine Geltungsbereichs-Entscheidung, inkl. der ~170 Fundstellen außerhalb `assets/styles/` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s (Quick-Run)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
