---
phase: 5
slug: welt-story
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-15
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Manuell erstellt (deutsche RESEARCH.md-Sektion „## Validierungs-Architektur" wird vom
> englischen Auto-Grep nicht erkannt — siehe Memory gsd-environment-quirks #6).
> Quelle: `05-RESEARCH.md` § Validierungs-Architektur.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (unit) + Playwright (E2E) |
| **Config file** | `jest.config.js` / `playwright.config.js` (Repo-Root) |
| **Quick run command** | `npx jest tests/unit/welt-story.test.js` |
| **Full suite command** | `npm run test:unit && npm run test:e2e` |
| **Estimated runtime** | ~60–120 Sekunden (Unit < 15s, E2E variabel) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest tests/unit/welt-story.test.js` (reine Rechen-/Mapping-Logik)
- **After every plan wave:** Run `npm run test:unit && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 Sekunden (Unit-Quick-Run)

---

## Per-Requirement Verification Map

> Plans existieren zum Zeitpunkt der VALIDATION-Erstellung noch nicht (Nyquist läuft VOR dem Planner).
> Karte ist auf Anforderungsebene; der Planner/Executor verfeinert sie zu Task-IDs (`5-PP-TT`)
> in den PLAN.md-Dateien. Quelle für jede Zeile: `05-RESEARCH.md` § Validierungs-Architektur.

| Req | Verhalten (beobachtbar) | Test Type | Automated Command / Assertion |
|-----|-------------------------|-----------|-------------------------------|
| WELT-01 | Tab „Session-Prep" erscheint nach Tab-Klick | E2E | `page.click('[data-view="sessionprep"]')` → Container sichtbar |
| WELT-01 | Neue Prep öffnet Lazy-DM-Vorlage mit allen 5 Abschnitten | E2E | Felder Strong-Start / Szenen / Hinweise / NPCs / Belohnungen vorhanden |
| WELT-01 | Offene Quests/Story-Arcs erscheinen als vorgeschlagene „offene Fäden" | Unit/E2E | `D.quests` mit offener Quest → Vorschlag in Fäden-Liste |
| WELT-01 | Entity-Link in Szene ist klickbar | E2E | `[[npcs:1:Elara]]` → `.entity-link[data-type="npcs"]` |
| WELT-01 | Undo nach Speichern löscht Eintrag aus `D.sessionPreps` | E2E | `Strg+Z` → `D.sessionPreps.length === 0` |
| WELT-02 | Klick „NPC generieren" → Vorschau mit Name+Zug+Marotte in < 1s | E2E | `performance.now()`-Delta < 1000ms; 3 Pflichtfelder befüllt |
| WELT-02 | Vor-Filter Volk+Geschlecht ändert Namens-Pool | Unit | `generiereNPCName('zwerg','maennlich')` ∈ `NPC_DEFAULT_TABLES.namen.zwerg.maennlich` |
| WELT-02 | Re-Roll erzeugt anderen NPC ohne Müll in `D.npcs` | E2E | 3× Re-Roll → `D.npcs.length === 0` (kein Auto-Save) |
| WELT-02 | „Als NPC speichern" legt `D.npcs`-Eintrag an (mit Undo) | E2E | Button → `D.npcs.length === 1`, Felder korrekt |
| WELT-03 | Kalender zeigt Harptos-Monatsnamen (z.B. „Hammer 1492 DR") | E2E | Kalender-Anzeige enthält Monatsname + Jahr |
| WELT-03 | Timeline-Eintrag mit In-Game-Datum wird gespeichert | E2E | Formular → `D.calendar.events.length === 1` |
| WELT-03 | Einträge erscheinen chronologisch sortiert | Unit | 3 Einträge unterschiedlicher Daten → Render-Reihenfolge korrekt |
| WELT-03 | Auto-Vorschlag nach abgeschlossener Reise/Session | E2E | Reise abschließen → Dialog „Timeline-Eintrag hinzufügen?" |
| WELT-04 | Normales Tempo × normales Gelände → 24 Meilen/Tag | Unit | `berechneTagesmarsch('normal','normal') === 24` |
| WELT-04 | Langsam × schwieriges Gelände → 9 Meilen/Tag | Unit | `berechneTagesmarsch('langsam','schwierig') === 9` (18 × 0,5) |
| WELT-04 | Wetter-Roll abhängig von Jahreszeit (aus In-Game-Datum) | Unit | `rollWetter('gemässigt','winter')` → nicht null, `result.entry.text` gesetzt |
| WELT-04 | Begegnungs-Roll mit konfigurierbarer Chance | Unit | `rollBegegnung('wald', 20, 1)` → `{begegnung:bool, ergebnis}` |
| WELT-04 | Reise-Abschluss rückt `D.calendar` um korrekte Tage vor | E2E | Start Tag 1, 3 Tage Reise → `D.calendar.day === 4` |
| WELT-05 | Fraktion anlegen → erscheint in Übersichtsliste | E2E | Formular → `D.factions.length === 1`; Karte sichtbar |
| WELT-05 | Rufwert-Änderung wechselt benannte Stufe korrekt | Unit | `rufStufe(15).label === 'Freundlich'`; `rufStufe(21).label === 'Verbündet'` |
| WELT-05 | Ruf-Anpassung schreibt Eintrag in `rufHistorie` | E2E | „+10" mit Grund → `faction.rufHistorie.length === 1` |
| WELT-05 | Undo nach Ruf-Änderung stellt alten Wert wieder her | E2E | Ruf 0 → +10 → `Strg+Z` → `faction.ruf === 0` |
| WELT-05 | NPC mit `factionId` erscheint in Fraktions-Mitgliederliste | E2E | NPC mit factionId speichern → Fraktion-Detail zeigt NPC-Namen |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky — alle aktuell ⬜ pending*

---

## Wave 0 Requirements

Reine Rechen-/Mapping-Logik bekommt Unit-Tests; die übrige UI-Verifikation läuft per E2E.
Empfohlene Wave-0-Test-Stubs (vor Feature-Implementierung):

- [ ] `tests/unit/welt-story.test.js` — Stubs für die Unit-verifizierbaren Wahrheiten:
  - `berechneTagesmarsch(tempo, gelaende)` (WELT-04: 24 / 9 Fälle)
  - `rufStufe(rufwert)` Stufen-Grenzen (WELT-05: −50…+50 → 5 Stufen)
  - `generiereNPCName(volk, geschlecht)` Pool-Zuordnung (WELT-02)
  - `rollWetter(klima, jahreszeit)` / `rollBegegnung(...)` Rückgabeform (WELT-04)
  - chronologische Sortierung der Timeline-Events (WELT-03)
- [ ] `tests/e2e/features/welt-story.spec.js` — E2E-Flows je neuem Tab (Session-Prep, Kalender, Reise, Fraktionen)
- [ ] Framework bereits installiert (Jest + Playwright vorhanden) — kein Install nötig

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| „< 1 Sekunde gefühlt" Generierungs-Latenz | WELT-02 | Subjektive UX-Wahrnehmung über automatisierter `performance.now()`-Grenze hinaus | Generator 10× auslösen, Reaktionszeit beobachten; muss flüssig wirken |
| Deutsche Tabelleninhalte lesen sich plausibel/setting-passend | WELT-02/04 | Inhaltsqualität (Namen, Marotten, Begegnungen) ist Geschmacks-/Kanon-Frage | Stichprobe generierter NPCs + Begegnungstabellen sichten |
| Harptos-Monatsnamen/Festtage kanonisch korrekt | WELT-03 | Forgotten-Realms-Kanon (ASSUMED in Research A1/A2) | Monatsnamen + Festtags-Positionen gegen Setting prüfen |

---

## Validation Sign-Off

- [ ] Alle Unit-verifizierbaren Wahrheiten haben einen Test in `tests/unit/welt-story.test.js`
- [ ] Sampling-Kontinuität: keine 3 aufeinanderfolgenden Tasks ohne automatisierte Verifikation
- [ ] Wave 0 deckt alle MISSING-Referenzen (Test-Stubs angelegt)
- [ ] Keine Watch-Mode-Flags in Kommandos
- [ ] Feedback-Latenz < 15s (Unit-Quick-Run)
- [ ] `nyquist_compliant: true` im Frontmatter gesetzt (durch Nyquist-Auditor nach Stub-Anlage)

**Approval:** pending
