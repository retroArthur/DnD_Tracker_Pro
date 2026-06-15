---
phase: 06
slug: spieler-verwaltung
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-15
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Abgeleitet aus `06-RESEARCH.md` § „Validierungs-Architektur".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (Unit)** | Jest (`jest.config.cjs`) |
| **Framework (E2E)** | Playwright (`playwright.config.js`) — `file://`-Basis, KEIN localhost |
| **Quick run command** | `npx jest` |
| **Full suite command** | `npm run test && npm run test:e2e` |
| **Estimated runtime** | ~30–90 s (Unit schnell; E2E je Spec wenige Sekunden) |
| **E2E import** | `import { test, expect } from '@playwright/test'` (ESM, kein CommonJS `require`) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest` (quick)
- **After every plan wave:** Run `npm run test` (full unit), plus the relevant `npx playwright test tests/e2e/features/<spec>.spec.js`
- **Before `/gsd:verify-work`:** `npm run test && npm run test:e2e` must be green — E2E **wirklich laufen lassen** (der gsd-verifier prüft nur Unit; E2E-Ladefehler bleiben sonst unentdeckt)
- **Max feedback latency:** ~90 s

---

## Per-Requirement Verification Map

> Task-IDs werden vom Planner/Executor zugewiesen (Pläne noch nicht erstellt). Diese Map ist der Validierungs-Vertrag je Anforderung/Entscheidung.

| Req / Decision | Beobachtbares Verhalten | Test Type | Assertion | Wave 0 |
|----------------|-------------------------|-----------|-----------|--------|
| **CHAR-02** Inspiration-Toggle | Klick auf ☆ → ⭐; Reload → weiterhin ⭐ | E2E | `.char-inspiration-toggle.active` sichtbar nach Toggle, persistiert nach Reload | ❌ W0 |
| **CHAR-02** Toggle-Stop (D-01) | Klick auf ⭐ öffnet KEIN Charakter-Formular (`-stop`-Handler) | E2E | `#char-form.open` NICHT sichtbar nach Inspiration-Klick | ❌ W0 |
| **CHAR-02 / D-02** Kein Undo | `saveUndoState` wird beim Inspiration-Toggle nicht aufgerufen | unit | Spy auf `saveUndoState` = 0 Aufrufe nach Toggle | ❌ W0 |
| **CHAR-03 / D-04** Skill-Modifier-Mathematik | Schurke L5, DEX 18, Expertise Heimlichkeit | unit | `calcSkillModifier(ch,'stealth') === 10` (DEX +4 + 2×Übungsbonus +3) | ❌ W0 |
| **CHAR-03 / D-04** Klickbarer Attribut-/Skill-/Save-Wurf | Klick auf Box im Detail-Modal → Ergebnis in Dice-Historie | E2E | `diceHistory.length` steigt nach Klick | ❌ W0 |
| **CHAR-03 / D-05** Angriff klickbar | Angriff +5 / 1d8+3 → Treffer- und Schadenswurf separat | E2E | Dice-Span `data-value="1d20+5"` und `data-value="1d8+3"` im Modal vorhanden | ❌ W0 |
| **CHAR-01 / D-09** XP-Auto-Summe | Kampf mit 2 Wölfen (CR 1/4 = je 50 XP) → Summe 100 XP vorberechnet | unit | `getXPForCR('1/4') === 50`; Summe zweier Wölfe = 100 | ❌ W0 |
| **CHAR-01 / D-10** XP-Verteilung gleichmäßig | 400 XP auf 4 lebende Charaktere → je 100 | unit | `distributeXP(400, 4activeChars)` → je 100 (Rest dokumentiert) | ❌ W0 |
| **CHAR-01 / D-11** Levelaufstieg-Hinweis | L1, xp=300 → „kann aufsteigen"; xp=299 → nicht | unit | `canLevelUp({level:1,xp:300})===true`; `canLevelUp({level:1,xp:299})===false` | ❌ W0 |
| **CHAR-01 / D-11** Konstanten getrennt | Aufstiegstabelle ≠ Encounter-Schwierigkeit | unit | `XP_LEVEL_THRESHOLDS[1]===300` (für L2) **und** `XP_THRESHOLDS` bleibt Encounter-Tabelle | ❌ W0 |
| **CHAR-01 / D-07** Milestone-Modus | `D.settings.levelingMode='milestone'` → XP-Felder versteckt, „+1 Level"-Button sichtbar | E2E | Sichtbarkeit abhängig von `levelingMode` | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/character-advancement.test.js` — Unit-Stubs für `calcSkillModifier`, `canLevelUp`, `getXPForCR`, `distributeXP` (ungeübt/geübt/Expertise; Grenzwerte 299→false / 300→true; Bruch-CRs '1/8'/'1/4'/'1/2'; Rest-Verteilung 401/4)
- [ ] Fixture (inline oder `tests/setup.js`): Beispiel-Charakter mit `level`, `xp`, `attributes`, `skillProficiencies`, `skillExpertise`, `attacks[]`
- [ ] `tests/e2e/features/inspiration.spec.js` — Inspiration-Toggle + `-stop`-Verhalten (`file://`-Basis, ESM-Import)
- [ ] `tests/e2e/features/character-advancement.spec.js` — klickbare Würfe, Angriffe, XP-Verteilung/Levelaufstieg-Hinweis

*Bekannter E2E-Fallstrick: `addCombatant()`-Helper in `tests/e2e/features/initiative.spec.js` ist kaputt (`docs/e2e-failure-triage.md`) — XP-Verteilungs-E2E muss ohne diesen Helper auskommen.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ⭐ immer sichtbar (gefüllt=an / Umriss=aus), nicht nur bei `inspiration===true` | CHAR-02 / D-01 | visuelle Zustandsanzeige | Charakterkarte mit `inspiration=false` öffnen → ausgegrauter Stern sichtbar und klickbar |
| Levelaufstieg-Hinweis (Badge/Toast „X kann aufsteigen") erscheint optisch korrekt | CHAR-01 / D-11 | visuelle Platzierung | xp auf Schwelle setzen → Hinweis erscheint, kein Auto-Bump des Levels |
| Skills nach Attribut gruppiert „auf einen Blick" im Detail-Modal | CHAR-03 / D-06 | Layout/Lesbarkeit | Detail-Modal öffnen → Skills-Sektion nach Attribut gruppiert, deutsche Namen aus `SKILL_INFO` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (4 Dateien oben)
- [ ] No watch-mode flags
- [ ] Feedback latency < 90 s
- [ ] `nyquist_compliant: true` set in frontmatter (nach Wave 0)

**Approval:** pending
