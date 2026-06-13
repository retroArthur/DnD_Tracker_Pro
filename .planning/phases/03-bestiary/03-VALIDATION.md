---
phase: 03
slug: bestiary
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `03-RESEARCH.md` § "Validierungs-Architektur". Task IDs are filled by the planner — see "Per-Task Verification Map".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (Unit)** | Jest (`jest.config.cjs`) |
| **Framework (E2E)** | Playwright (`playwright.config.js`) |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test && npm run test:e2e` |
| **Estimated runtime** | Unit ~30 s · Full suite a few minutes |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit` (< 30 s)
- **After every plan wave:** Run `npm run test && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds (unit)

---

## Per-Task Verification Map

> Task IDs assigned by the planner (PLAN.md not yet written — UI-SPEC precedes planning). Rows below pre-seed the map from RESEARCH.md Req→Test mapping; the planner/nyquist-auditor binds each to a concrete `{phase}-{plan}-{task}` ID and confirms the Wave-0 test file exists.

| Task ID | Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|---------|-------------|----------|-----------|-------------------|-------------|--------|
| TBD | BEST-01 (SC1) | Suche „Goblin" → Ergebnis sofort, offline (kein Netzwerk) | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Goblin suchen"` | ❌ W0 | ⬜ pending |
| TBD | BEST-01 (SC1) | Filter CR „1/4" → korrekte Ergebnismenge | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "CR-Filter"` | ❌ W0 | ⬜ pending |
| TBD | BEST-01 (SC1) | Filter Typ „Humanoid" → korrekte Ergebnismenge | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Typ-Filter"` | ❌ W0 | ⬜ pending |
| TBD | BEST-01 (D-09) | Klick auf Schadensformel im Statblock → Würfelergebnis erscheint | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Wuerfelklick"` | ❌ W0 | ⬜ pending |
| TBD | BEST-02 (SC2) | Neue Kreatur anlegen → erscheint in Liste | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Kreatur anlegen"` | ❌ W0 | ⬜ pending |
| TBD | BEST-02 (SC2) | Kreatur bearbeiten → Änderung gespeichert | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Kreatur bearbeiten"` | ❌ W0 | ⬜ pending |
| TBD | BEST-02 (SC2) | Kreatur löschen → aus Liste entfernt | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Kreatur loeschen"` | ❌ W0 | ⬜ pending |
| TBD | BEST-02 (SC2) | Ctrl+Z nach Löschen → Kreatur wiederhergestellt (Undo) | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Undo loeschen"` | ❌ W0 | ⬜ pending |
| TBD | BEST-03 (SC3) | „Zur Initiative" → Kombattant mit korrekter HP und AC | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Zur Initiative"` | ❌ W0 | ⬜ pending |
| TBD | BEST-03 (SC3) | „Zu Encounter" → Encounter-Eintrag mit korrekter HP und AC | E2E | `npx playwright test tests/e2e/features/bestiary.spec.js -g "Zu Encounter"` | ❌ W0 | ⬜ pending |
| TBD | BEST-01 (Schema) | `getSRDMonsters()` gibt Array mit `cr`/`hp`/`ac`/`name` zurück | Unit | `npx jest tests/unit/srd-monsters.test.js` | ❌ W0 | ⬜ pending |
| TBD | BEST-02 (Schema) | Migration 3.0.0 initialisiert leeres `D.bestiary[]` | Unit | `npx jest tests/unit/migration.test.js -t "3.0.0"` | ⚠️ partial (migration.test.js) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/features/bestiary.spec.js` — alle SC1/SC2/SC3-Szenarien (Suche/Filter/Würfelklick, CRUD+Undo, Zur Initiative/Zu Encounter)
- [ ] `tests/unit/srd-monsters.test.js` — Schema-Validierung, `getSRDMonsters()` liefert vollständige Statblock-Felder
- [ ] `tests/unit/migration.test.js` — Migration 3.0.0 (Erweiterung der bestehenden Datei) legt `D.bestiary`/`D.bestiaryFavorites` an

*Framework already installed (Jest + Playwright) — Wave 0 only adds the test files above.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Echte Offline-Tauglichkeit (file://, kein Server) | BEST-01 (SC1) | E2E-Runner lädt über HTTP; „wirklich offline" lässt sich am besten am Tisch prüfen | App via `file://` öffnen bzw. Netzwerk in DevTools auf „Offline" → Bestiary-Suche/Filter müssen ohne Fehler sofort liefern |
| Übersetzungs-/Statblock-Qualität der kuratierten ~100–150 Monster | BEST-01 | Inhaltliche Korrektheit ist nicht automatisierbar | Stichprobe deutscher Statblocks gegen SRD 5.1 DE prüfen (Namen, Aktionen, CR) |

*All structural behaviors have automated E2E/Unit verification; the two rows above are content/offline checks that complement the suite.*

---

## Security Domain (ASVS L1)

> From RESEARCH.md § "Sicherheits-Domäne". Carried into PLAN.md `<threat_model>` blocks per the security gate.

| Threat | STRIDE | Mitigation |
|--------|--------|------------|
| XSS in Statblock-Texten (Traits/Aktionen enthalten `<b>`) | Spoofing/Tampering | `sanitizeHTML()` (erlaubt `<b>`, blockt `<script>`) für alle Statblock-HTML-Felder |
| XSS in Nutzereingaben (eigene Kreaturen) | Spoofing | `esc()` für Name/Typ/Alignment; `sanitizeHTML()` für Rich-Text |
| Prototype Pollution via Statblock-JSON | Tampering | JSON nie ungeprüft via `Object.assign()` in `D` kopieren |
| LocalStorage-Überlauf durch SRD-Daten in `D` | DoS | SRD-Daten NIEMALS in `D` (Architektur-Constraint) |
| URL-Injektion in Portrait-Avatar-URL | Tampering | `validateAvatarURL()` aus `systems/avatars.js` (vorhanden) |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (3 test files)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (unit)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
