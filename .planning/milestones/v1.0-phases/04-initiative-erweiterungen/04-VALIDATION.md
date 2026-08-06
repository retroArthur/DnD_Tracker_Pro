---
phase: 4
slug: initiative-erweiterungen
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 4 — Validierungs-Strategie

> Per-Phasen-Validierungsvertrag für Feedback-Sampling während der Ausführung.
> Quelle: `04-RESEARCH.md` §"Validierungs-Architektur" (deutschsprachige Phase — vom Auto-Grep des plan-phase-Workflows nicht erkannt, daher manuell erstellt).

---

## Test-Infrastruktur

| Eigenschaft | Wert |
|-------------|------|
| **Unit-Framework** | Jest 29.x (bestehend, `tests/unit/`) |
| **E2E-Framework** | Playwright (bestehend, `tests/e2e/features/`) |
| **Config-Datei** | `jest.config.js` + `playwright.config.js` (vorhanden) |
| **Schneller Lauf** | `npm run test:unit` |
| **Vollständige Suite** | `npm run test && npm run test:e2e` |
| **Bestehende Init-Tests** | `tests/e2e/features/initiative.spec.js` (Datei existiert, Phase-4-Suites fehlen noch) |
| **Geschätzte Laufzeit** | Unit ~10 s · E2E-Init ~30–60 s |

---

## Sampling-Rate

- **Nach jedem Task-Commit:** `npm run build` (Build-Integrität) + Browser-Öffnung (visuelle Prüfung)
- **Nach jeder Plan-Welle:** `npm run test:unit`
- **Vor `/gsd:verify-work` (Phase-Gate):** `npm run test && npm run test:e2e` muss grün sein + 3 manuelle Checks (Panel-Optik, Pip-Feel, Mob-Schaden am Tisch)
- **Max. Feedback-Latenz:** ~60 s (Unit < 15 s, E2E-Subset < 60 s)

---

## Anforderungs-Test-Mapping (Per-Requirement-Verifikation)

| Req-ID | Verhalten | Test-Typ | Automatisierter Befehl | Datei vorhanden? | Status |
|--------|-----------|----------|------------------------|------------------|--------|
| INIT-01 | 📖-Button in jeder Init-Zeile sichtbar | E2E | `npx playwright test tests/e2e/features/initiative.spec.js -g "statblock"` | ❌ Wave 0 | ⬜ pending |
| INIT-01 | Panel öffnet bei Klick mit Statblock-Inhalt (Monster mit `statblockRef`) | E2E | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-01 | Panel zeigt Basis-Infos bei Kombattant ohne `statblockRef` | E2E | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-01 | Klickbare Würfe im Panel lösen Würfelwurf aus | E2E | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-02 | LA-Pips erscheinen bei Monster mit `legendaryActionsPerRound > 0` | E2E | `npx playwright test tests/e2e/features/initiative.spec.js -g "legendary"` | ❌ Wave 0 | ⬜ pending |
| INIT-02 | Pip-Klick reduziert verbleibende LA um 1 | E2E | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-02 | LA-Pips füllen sich bei Rundenübergang (Init 20) wieder auf | E2E | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-02 | LR-Pips erscheinen bei Monster mit `(N-mal täglich)`-Trait | E2E | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-02 | LR resetten **NICHT** bei Rundenübergang (D-07, regelkonform /Tag) | E2E | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-02 | Manueller LR-Reset-Knopf setzt LR zurück | E2E | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-02 | `parseLegendaryResistanceCount()` erkennt "3-mal täglich" | Unit | `npm run test:unit -- --testPathPattern=initiative-mob` | ❌ Wave 0 | ⬜ pending |
| INIT-03 | Mengen-Dialog-Toggle erzeugt EINE Mob-Zeile statt N Zeilen | E2E | `npx playwright test tests/e2e/features/initiative.spec.js -g "mob"` | ❌ Wave 0 | ⬜ pending |
| INIT-03 | Pool-HP = Summe aller Einzel-HP | Unit | `npm run test:unit -- --testPathPattern=initiative-mob` | ❌ Wave 0 | ⬜ pending |
| INIT-03 | Mob-Anzeige `"X von N am Leben"` korrekt berechnet | Unit | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-03 | DMG-Mob-Regel: 10 Goblins (+4) vs AC 15 = 5 Treffer | Unit | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-03 | Schaden-Applikation auf Pool (nicht auf maxHp) | Unit | s.o. | ❌ Wave 0 | ⬜ pending |
| INIT-03 | Bei 0 Pool-HP: Mob als besiegt markiert | E2E | s.o. | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ grün · ❌ rot · ⚠️ flaky*

---

## Wave-0-Anforderungen (Test-Stubs zuerst anlegen)

- [ ] `tests/unit/initiative-mob.test.js` — Unit-Tests für `parseLegendaryResistanceCount()`, `getMobAlive()` (`"X von N am Leben"`), `calcMobHits()` (DMG-Mob-Regel), Pool-HP-Berechnung & -Schadensabzug
- [ ] `tests/e2e/features/initiative.spec.js` — Erweiterung um Test-Suites `"statblock"`, `"legendary"`, `"mob"` (Datei existiert bereits, Phase-4-Suites fehlen)

---

## Manuelle Verifikationen (nicht automatisierbar)

| Verhalten | Req-ID | Warum manuell | Test-Anweisung |
|-----------|--------|---------------|----------------|
| Statblock-Panel-Optik (Pergament-Look, Drawer rechts, Mobile-Bottom-Sheet) | INIT-01 | Visuelle/Layout-Qualität | App öffnen → Init mit Bestiary-Monster → 📖 klicken → Panel-Optik + Mobile-Viewport (< 600 px) prüfen |
| Pip-„Feel" am Tisch (Klick-Reaktion Death-Save-Stil) | INIT-02 | Interaktions-Haptik | Boss-Kombattant → LA-/LR-Pips klicken → flüssige Reaktion prüfen |
| Mob-Schaden-Workflow am Tisch (ein Klick = Gesamtschaden) | INIT-03 | End-to-End-DM-Erlebnis | 10 Goblins als Mob → Sammel-Angriff (beide Modi) → automatisch summierter Schaden prüfen |

---

## Bekannte Annahmen mit Test-Implikation

- **DMG-Mob-Regel-Formel** (`hits = floor(N × (21 − needed) / 20)`, `needed = max(2, AC − attackBonus)`) ist [ASSUMED] aus DMG S. 250 (NIEDRIGE Konfidenz, nicht tool-verifiziert). Der Unit-Test `INIT-03 / DMG-Mob-Regel` (10 Goblins +4 vs AC 15 = 5 Treffer) verankert die Formel — falls Arthur die DMG-Tabelle abweichend liest, ist der Test der einzige Korrekturpunkt.

---

## Validierungs-Sign-Off

- [ ] Jeder Task hat `<automated>`-Verifikation ODER eine Wave-0-Abhängigkeit
- [ ] Sampling-Kontinuität: keine 3 aufeinanderfolgenden Tasks ohne automatisierte Verifikation
- [ ] Wave 0 deckt alle ❌-Referenzen ab (`initiative-mob.test.js` + E2E-Suites)
- [ ] Keine Watch-Mode-Flags in den Test-Befehlen
- [ ] Feedback-Latenz < 60 s
- [ ] `nyquist_compliant: true` im Frontmatter gesetzt

**Approval:** pending
