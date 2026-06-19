---
phase: 7
slug: komfort-analyse
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `07-RESEARCH.md` § "Validierungs-Architektur" (the Nyquist auto-grep
> looks for the English heading `## Validation Architecture`; this German project uses
> `## Validierungs-Architektur`, so this file is authored manually — see project memory
> `gsd-environment-quirks` #6).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (unit)** | Jest (jsdom) — `jest.config.cjs` |
| **Framework (E2E)** | Playwright (Chromium only) — `playwright.config.js` |
| **Quick run command** | `npx jest tests/unit/dice-stats.test.js` |
| **Full unit suite** | `npm run test` |
| **E2E command** | `PYTHONIOENCODING=utf-8 python build.py && npx playwright test tests/e2e/features/soundboard.spec.js tests/e2e/features/dice-stats.spec.js` |
| **E2E baseURL** | `file:///…/dist/dnd-tracker-bundled.html` (set in `playwright.config.js:38`) |
| **Estimated runtime** | unit ~30s; E2E ~1–2 min |

**E2E module-format guard (project memory `gsd-environment-quirks` #9):** repo is `"type": "module"` (ESM). New E2E specs MUST use `import { test, expect } from '@playwright/test';` and the `file://` `baseURL` — NOT CommonJS `require` and NOT a hard-coded `http://localhost:8000`. Follow the existing `tests/e2e/features/bestiary.spec.js` / `persistence.spec.js` pattern.

---

## Sampling Rate

- **After every task commit:** `npm run test` (unit suite, 421+ tests, <30s)
- **After every plan wave:** `npm run test && npx playwright test tests/e2e/features/soundboard.spec.js tests/e2e/features/dice-stats.spec.js`
- **Before `/gsd:verify-work`:** Full unit + new E2E suite green
- **Max feedback latency:** ~30s (unit)

---

## Per-Requirement Verification Map

(Task IDs filled in once plans exist; this is the requirement→test contract the planner must satisfy.)

| Req ID | Behavior | Threat Ref | Secure Behavior | Test Type | Automated Command | File (Wave 0) | Status |
|--------|----------|------------|-----------------|-----------|-------------------|---------------|--------|
| UX-01 | Soundboard/Audio tab is visible with scene list UI | — | N/A | E2E smoke | `npx playwright test -g "soundboard tab renders"` | soundboard.spec.js | ⬜ |
| UX-01 | Import an audio file → appears in Audio Library | T-07-AUDIO-NAME | `esc(file.name)` on render | E2E | `npx playwright test -g "import audio file"` | soundboard.spec.js | ⬜ |
| UX-01 | Audio Blob persists across page reload (IDB roundtrip) | — | N/A | E2E | `npx playwright test -g "audio blob persists after reload"` | soundboard.spec.js | ⬜ |
| UX-01 | Playing a scene starts audio; stop scene stops audio | T-07-AUDIO-DECODE | `decodeAudioData` try/catch + toast | E2E (state-only) + manual | `audioContext.state==='running'` via `page.evaluate` | soundboard.spec.js | ⬜ |
| UX-01 | Keyboard quick-slot (Alt+Shift+1) activates Scene 1 | — | conflict-free binding (D-03) | E2E | `npx playwright test -g "scene quickslot keyboard"` | soundboard.spec.js | ⬜ |
| UX-01 | Per-file size warning shown when file > threshold (D-01a) | T-07-AUDIO-DOS | size check before store | unit | `npx jest tests/unit/soundboard.test.js -t "size warning"` | soundboard.test.js | ⬜ |
| UX-01 | (If D-02a MVP chosen) scene switch hard-cuts old track | — | N/A | E2E | `npx playwright test -g "scene hard cut fallback"` | soundboard.spec.js | ⬜ |
| UX-02 | Dice Stats tab renders after rolls | — | N/A | E2E smoke | `npx playwright test -g "dice stats tab renders"` | dice-stats.spec.js | ⬜ |
| UX-02 | All rolls captured in IDB stats store via `addToDiceHistory()` | T-07-NOTATION-XSS | `esc(notation)` on label render | E2E | `npx playwright test -g "rolls captured in IDB"` (page.evaluate) | dice-stats.spec.js | ⬜ |
| UX-02 | Histogram SVG renders 20 bars (faces 1–20) | — | N/A | unit | `npx jest tests/unit/dice-stats.test.js -t "histogram 20 bars"` | dice-stats.test.js | ⬜ |
| UX-02 | Expected-distribution overlay at correct height (5% per face) | — | N/A | unit | `npx jest tests/unit/dice-stats.test.js -t "expected overlay"` | dice-stats.test.js | ⬜ |
| UX-02 | Crit(20) rate = actual % of 20s rolled | — | N/A | unit | `npx jest tests/unit/dice-stats.test.js -t "crit rate"` | dice-stats.test.js | ⬜ |
| UX-02 | Fumble(1) rate = actual % of 1s rolled | — | N/A | unit | `npx jest tests/unit/dice-stats.test.js -t "fumble rate"` | dice-stats.test.js | ⬜ |
| UX-02 | "Diese Session" filter shows only current-session rolls | — | N/A | unit | `npx jest tests/unit/dice-stats.test.js -t "session filter"` | dice-stats.test.js | ⬜ |
| UX-02 | Per-character breakdown shows charId-attributed rolls; rest under "Allgemein" | — | N/A | unit | `npx jest tests/unit/dice-stats.test.js -t "character breakdown"` | dice-stats.test.js | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements (test stubs to create first)

- [ ] `tests/unit/dice-stats.test.js` — histogram counts, expected overlay, crit/fumble rate, session filter, per-character breakdown (UX-02c–h)
- [ ] `tests/unit/soundboard.test.js` — size-warning logic (pure JS, no audio playback) (UX-01 size warning)
- [ ] `tests/e2e/features/soundboard.spec.js` — tab renders, import audio, blob persists after reload, scene quickslot (UX-01)
- [ ] `tests/e2e/features/dice-stats.spec.js` — tab renders, rolls captured in IDB (UX-02)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Actual audible audio output + perceived crossfade smoothness | UX-01 | Playwright cannot assert real audio output; autoplay needs a real user gesture | In `file://` build: import 2+ loops, build a scene (rain+tavern), play, switch scenes — confirm layered loops play and crossfade is smooth, volume sliders work |
| AudioContext resumes after user gesture under `file://` | UX-01 | Autoplay policy + `file://` runtime behavior | Click play, confirm sound starts (no silent-suspended context) |

---

## Validation Sign-Off

- [ ] All requirements have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING test files
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (unit)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
