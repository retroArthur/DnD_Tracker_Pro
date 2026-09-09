---
phase: 15-befundlage-vorlauf
plan: 03
subsystem: documentation
tags: [design-handoff, css-audit, roadmap, requirements, traceability]

# Dependency graph
requires:
  - phase: 15-01
    provides: "Ratschen-Schleife bewiesen, `declarationsOf()`-Vorarbeit, N-08 im Handoff geschlossen"
provides:
  - "Die 36 korrigierten Kennzahlen aus HANDOFF-V2-VERIFIKATION.md in BEFUNDE-v2.md, PATCHES.md, CHECKLISTE.md, README.md eingearbeitet — alte Bericht-Werte bleiben als Vergleichswert sichtbar"
  - "Jeder Anker in PATCHES.md ist ein Tripel (Datei+Zeile, woertliches Zitat, grep+Trefferzahl); zwei nachweislich falsche Anker (§1b, §3b) repariert"
  - "ROADMAP.md und REQUIREMENTS.md ohne unerfuellbare oder nicht reproduzierbare Erfolgskriterien; vier neue Canonical-refs-Zeilen fuer Phasen 16-19"
affects: [15-05, 15-06, 15-07, 15-08, "16", "17", "18", "19"]

# Actuals (#2632)
actuals:
  tokens: 14580
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bericht-Wert bleibt als Vergleichswert sichtbar (Klammer-Zusatz '[Bericht]' bzw. Kursiv-Kommentar) — nie spurloses Ersetzen, Fortsetzung des N-08-Musters aus Plan 15-01"
    - "PATCHES-Anker als Tripel: Datei+Zeile+Erhebungsdatum, woertliches Mehrzeilenzitat, grep-Ausdruck mit erwarteter Trefferzahl — ueberlebt Verschiebungen, die eine reine Zeilennummer nicht ueberlebt"
    - "Nicht reproduzierbare Zielzahlen werden durch die Formulierung 'die vom Werkzeug gemessene Menge' ersetzt statt durch eine neue, ebenso ungeprüfte Zahl"

key-files:
  created: []
  modified:
    - "Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/BEFUNDE-v2.md"
    - "Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md"
    - "Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/CHECKLISTE.md"
    - "Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/README.md"
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Task 1 und Task 2 beruehren beide PATCHES.md und wurden nach der Bearbeitung nicht mehr sauber per Diff trennbar — ein Commit deckt Task 1s Zahlenkorrekturen UND Task 2s Anker-Tripel fuer diese Datei gemeinsam ab; die uebrigen drei Handoff-Dateien (nur Task 1) und ROADMAP/REQUIREMENTS (nur Task 3) haben eigene Commits"
  - "Bei der 'Sammel-Kurzform' (transition: all) blieb der alte Wert 151 im Fliesstext als klar gekennzeichneter Vergleichswert stehen statt ihn auf 0 Vorkommen zu druecken — die Abnahmezeile selbst nennt jetzt verbindlich 163 (D-06)"
  - "Erfolgskriterium 4 (ROADMAP Phase 15) nennt neu `.char-card-slots .slot-pip` als Nachfolgeselektor fuer `.char-slot-pip` — selbst erhoben aus `features/party/party-render.js` und `dashboard.css:1320`, nicht aus der abweichenden Selektor-Vermutung in 15-CONTEXT.md D-15 (`.spell-slots-compact .slot-pip`), die beim Nachmessen nicht zum tatsaechlichen Container-Markup der Charakterkarte passte"
  - "FIX-01s Fundstellenangaben wurden am HEUTIGEN Codestand (nach Plan 15-04) neu erhoben, nicht am Stand vor der Reparatur — die Zeilenangaben in REQUIREMENTS.md sind damit fuer den aktuellen Baum korrekt, koennen sich aber von den in 15-CONTEXT.md D-11 genannten Zeilen unterscheiden, weil Plan 15-04 dazwischen CSS verschoben hat"

requirements-completed: [BASE-02]

coverage:
  - id: D1
    description: "Alle anwendbaren Zeilen der Tabelle 'Korrigierte Ausgangswerte' (33 von 36 — 3 bereits durch Plan 15-01 fuer N-08 geschlossen) in BEFUNDE-v2.md, PATCHES.md, CHECKLISTE.md, README.md eingearbeitet, mit Kopfvermerk je Datei und Bericht-Wert als sichtbarem Vergleichswert"
    requirement: "BASE-02"
    verification:
      - kind: other
        ref: "grep -c HANDOFF-V2-VERIFIKATION je Datei > 0 (BEFUNDE-v2.md 3, PATCHES.md 3, CHECKLISTE.md 2, README.md 1)"
        status: pass
      - kind: other
        ref: "grep -c 32x/12x BEFUNDE-v2.md, grep -c 143 BEFUNDE-v2.md/CHECKLISTE.md, grep -c 163 CHECKLISTE.md"
        status: pass
    human_judgment: false
  - id: D2
    description: "Jeder Anker in PATCHES.md ist ein Tripel; zwei nachweislich falsche Anker (§1b core.css-Einzeiler, §3b core.css-Zeile) auf die tatsaechliche Datei/Struktur korrigiert; neun Anker im aktuellen Baum stichprobenartig nachgemessen"
    requirement: "BASE-02"
    verification:
      - kind: other
        ref: "grep -c \"grep \" PATCHES.md == 16 (> 0)"
        status: pass
      - kind: other
        ref: "grep -n .btn-primary { core.css == 1 Treffer (Zeile 2497); grep loot.css rgba(212,175,55,0.3) == 2 Treffer (Zeilen 439/483)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ROADMAP.md/REQUIREMENTS.md ohne unerfuellbare/nicht-reproduzierbare Kriterien; vier Canonical-refs-Zeilen fuer Phasen 16-19; design-consistency.test.js unveraendert gruen"
    requirement: "BASE-02"
    verification:
      - kind: other
        ref: "test $(grep -c '^**Canonical refs**' ROADMAP.md) = 4 && grep -q css-usage-report REQUIREMENTS.md"
        status: pass
      - kind: unit
        ref: "npx jest tests/unit/design-consistency.test.js (67/67 passed)"
        status: pass
    human_judgment: false

# Metrics
duration: ~55min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 03: Handoff-Kennzahlen korrigieren, Anker verankern, ROADMAP/REQUIREMENTS nachfuehren Summary

**36 korrigierte Kennzahlen aus HANDOFF-V2-VERIFIKATION.md in die vier Handoff-Dateien eingearbeitet (Bericht-Werte bleiben sichtbar), zwei nachweislich falsche PATCHES-Anker auf ihre tatsaechliche Fundstelle repariert, und ROADMAP/REQUIREMENTS von drei unerfuellbaren Erfolgskriterien sowie drei nicht reproduzierbaren Loeschzahlen befreit.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-09-09
- **Tasks:** 3
- **Files modified:** 6 (4 Handoff-Dateien, ROADMAP.md, REQUIREMENTS.md)

## Accomplishments

- **Task 1:** 33 der 36 Zeilen der Tabelle „Korrigierte Ausgangswerte" (3 bereits durch Plan 15-01 fuer N-08 geschlossen) in `BEFUNDE-v2.md`, `PATCHES.md`, `CHECKLISTE.md`, `README.md` eingearbeitet. Jede Datei traegt einen Kopfvermerk mit Datum und Verweis auf `HANDOFF-V2-VERIFIKATION.md`. Kein Bericht-Wert wurde spurlos ersetzt — jeder steht als Vergleichswert (Klammer-Zusatz „[Bericht]" oder Kursiv-Kommentar) neben dem gemessenen Wert. Zwei Zeilen betrafen Werte, die im Ziel-Dokument nicht vorkamen (siehe „Nicht auffindbare Korrekturstellen" unten).
- **Task 2:** Alle "Anker:"-Referenzen in `PATCHES.md` (§1a, §1b, §2a, §3a, §3b, §4a, §5a, §7a, §7b) sind jetzt Tripel aus Datei+Zeile+Erhebungsdatum, woertlichem Mehrzeilenzitat und grep-Ausdruck mit erwarteter Trefferzahl. Zwei nachweislich falsche Anker repariert: §1b zitierte einen nicht existierenden Einzeiler fuer `.btn-primary` — korrekt ist der 6-zeilige Block `core.css:2497-2503`; §3b zitierte eine `core.css`-Zeile, die tatsaechlich zweimal in `loot.css` (Zeilen 439, 483) steht. Neun Anker im aktuellen Baum stichprobenartig nachgemessen (uebersteigt die geforderten fuenf).
- **Task 3:** `FIX-01` in `REQUIREMENTS.md` auf alle drei Widgets (Gelaende/Fertigkeiten/Wissensgebiete) erweitert und mit selbst erhobenen Fundstellen (Stand nach Plan 15-04) korrigiert. `DEAD-01`/`DEAD-02` und ROADMAP-Erfolgskriterium 3 sowie die Milestone-Bullet-Zeile ersetzen die drei kolportierten Loeschzahlen (438/607/~3.174) durch „die von `tools/css-usage-report.js` gemessene Menge". Phase-15-Erfolgskriterium 4 prueft jetzt den Nachfolgeselektor `.char-card-slots .slot-pip` statt der verschwindenden `.char-slot-pip`-Klasse und verlangt zusaetzlich, dass ein Klick den persistierten Zustand aendert. Phase-15-Erfolgskriterium 5 beschreibt die dreistufige Abnahme (D-53) statt einer vollen Vier-Themes-Sichtung jede Welle. `COLOR-08`/Phase-16-Kriterium 5 (173→143) und `ELEV-04`/Phase-17-Kriterium 1 (22→rund 40) korrigiert. Vier neue `**Canonical refs**`-Zeilen in den Detailbloecken der Phasen 16-19.

## Task Commits

Each task was committed atomically (mit einer Ausnahme, siehe Deviations):

1. **Task 1 (drei der vier Handoff-Dateien): Korrigierte Kennzahlen einarbeiten** - `654b736` (docs)
2. **Task 1 (PATCHES.md-Anteil) + Task 2 (Anker-Tripel): PATCHES.md** - `bc27e31` (docs)
3. **Task 3: ROADMAP.md/REQUIREMENTS.md nachfuehren, Canonical refs** - `83a7ba2` (docs)

## Files Created/Modified

- `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/BEFUNDE-v2.md` - Kopfvermerk, 15 Kennzahl-Korrekturen (N-01 bis N-09) mit sichtbarem Bericht-Wert
- `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md` - Kopfvermerk, 3b/1c/2c/4b-Zahlenkorrekturen, neun Anker als Tripel, zwei Anker repariert (§1b, §3b)
- `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/CHECKLISTE.md` - Kopfvermerk, N-01/N-03/N-04/N-06/N-07/N-09-Ausgangswerte korrigiert, Abnahmezeile nennt jetzt 163
- `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/README.md` - Kopfvermerk, Kopfzahlen (Dateien/Zeilen) korrigiert
- `.planning/ROADMAP.md` - Phase-15-Milestone-Bullet und Erfolgskriterien 3/4/5 korrigiert, Phase-16-Kriterium 5 und Phase-17-Kriterium 1 korrigiert, vier Canonical-refs-Zeilen (Phasen 16-19)
- `.planning/REQUIREMENTS.md` - FIX-01, DEAD-01, DEAD-02, COLOR-08, ELEV-04 korrigiert

## Nicht auffindbare Korrekturstellen (Pflichtangabe laut Plan-Output)

Zwei Zeilen der Tabelle „Korrigierte Ausgangswerte" betreffen Behauptungen, die in den vier Ziel-Dateien nicht woertlich vorkommen — sie werden hier als Fund gemeldet, nicht stillschweigend uebersprungen:

1. **N-01: „Anteil der 390 Literale, der wirklich die Dark-Palette ist"** (Tabellenzeile: implizit alle → gemessen 198 von 390 exakt Dark, 66 palettenfremd, 25 fremde Theme-Paletten). `BEFUNDE-v2.md` §N-01 behauptet an keiner Stelle woertlich, dass alle 390 Literale die Dark-Palette seien — die Aussage ist eine Verallgemeinerung, die aus dem Fehlen einer Einschraenkung abgeleitet wird, kein Zitat. Keine Textstelle zum Korrigieren gefunden; die Information ist als Erweiterung fuer die Ausfuehrung in Phase 16 relevant (`.planning/REQUIREMENTS.md` COLOR-08/COLOR-11), nicht fuer diese vier Dateien.
2. **„Testsuite-Ausgangslage (im Handoff nirgends benannt)"** (Jest 64/64, `DUBLETTEN_MAX`=0, `IMPORTANT_MAX`=105, `INLINE_MAX`=257). Die Tabelle selbst vermerkt „nicht genannt" — es gibt keine Stelle in den vier Dateien, die diese Zahlen behauptet und zu korrigieren waere.

## Decisions Made

Siehe `key-decisions` im Frontmatter. Kernpunkte: (1) PATCHES.md-Anteile von Task 1 und Task 2 liessen sich nach der Bearbeitung nicht mehr sauber per Commit trennen — ein Commit deckt beide ab; (2) der Nachfolgeselektor fuer Erfolgskriterium 4 wurde am Code selbst erhoben (`.char-card-slots .slot-pip`) statt aus `15-CONTEXT.md` D-15 uebernommen, weil die dortige Vermutung (`.spell-slots-compact .slot-pip`) beim Nachmessen nicht zum tatsaechlichen Party-Card-Markup passte — `.spell-slots-compact` gehoert zu einer anderen Komponente (`systems/spellslots/spellslots-ui.js`, 0 Aufrufstellen).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Korrektur einer im Plan-Kontext genannten Vermutung] Nachfolgeselektor fuer Erfolgskriterium 4 abweichend von 15-CONTEXT.md D-15**
- **Found during:** Task 3
- **Issue:** `15-CONTEXT.md` D-15 nennt als Nachfolgeselektor fuer `.char-slot-pip` die Klasse `.spell-slots-compact .slot-pip`. Nachmessung zeigt: der Container, den `renderCompactSpellSlots()` in `features/party/party-render.js:320` tatsaechlich erzeugt, heisst `.char-card-slots`, nicht `.spell-slots-compact`. Letztere Klasse gehoert zu einer anderen, in Phase 15 nicht betroffenen Komponente (`systems/spellslots/spellslots-ui.js`, `renderSpellSlotPips()` — laut `15-CONTEXT.md` selbst mit 0 Aufrufstellen im Baum).
- **Fix:** ROADMAP-Erfolgskriterium 4 nennt den selbst erhobenen Selektor `.char-card-slots .slot-pip` statt der abweichenden Vermutung aus D-15, mit Verweis auf die Messung.
- **Files modified:** `.planning/ROADMAP.md`
- **Verification:** `grep -n "char-card-slots" features/party/party-render.js` (Zeile 320: Container-Erzeugung); `grep -rn "spell-slots-compact" features/` findet keinen Treffer in `features/party/`
- **Committed in:** `83a7ba2`

---

**Total deviations:** 1 auto-fixed (Rule 1 — Korrektur einer plan-internen Vermutung anhand einer Selbstmessung, kein Scope-Wechsel).
**Impact on plan:** Das Erfolgskriterium bleibt inhaltlich unveraendert (definierte, klickbare Breite > 0, jetzt zusaetzlich Klick-aendert-Zustand); nur der zitierte Selektor wurde auf den tatsaechlich existierenden korrigiert. Kein Scope Creep.

## Issues Encountered

Keine blockierenden Probleme. Die Ueberschneidung von Task 1 und Task 2 auf `PATCHES.md` (siehe Decisions) ist eine Eigenschaft der Plan-Struktur (beide Tasks nennen dieselbe Datei), keine Ausfuehrungsstoerung.

## User Setup Required

None - keine externe Service-Konfiguration noetig.

## Next Phase Readiness

- Die vier Handoff-Dateien sind konsistent mit `HANDOFF-V2-VERIFIKATION.md`; Plan 15-05 (FIX-02/FIX-03) kann direkt auf den korrigierten Kennzahlen aufsetzen
- `PATCHES.md`s Anker ueberleben jetzt den Loeschlauf (Plan 15-06/15-07) — jeder traegt einen grep-Ausdruck zur Wiederauffindung nach Verschiebungen
- ROADMAP.md/REQUIREMENTS.md tragen keine unerfuellbaren oder nicht reproduzierbaren Kriterien mehr; Phasen 16-19 haben ihre Canonical-refs-Zeile
- Volle Design-Consistency-Suite unveraendert gruen: `npx jest tests/unit/design-consistency.test.js` 67/67 (keine Quelldatei wurde in diesem reinen Dokumentations-Plan angefasst)

## Self-Check: PASSED

- FOUND: `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/BEFUNDE-v2.md` (Kopfvermerk vorhanden)
- FOUND: `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md` (Anker-Tripel vorhanden)
- FOUND: `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/CHECKLISTE.md` (163 in Abnahmezeile)
- FOUND: `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/README.md` (Kopfvermerk vorhanden)
- FOUND: `.planning/ROADMAP.md` (4 Canonical-refs-Zeilen)
- FOUND: `.planning/REQUIREMENTS.md` (css-usage-report referenziert)
- FOUND: commit `654b736` in `git log --oneline --all`
- FOUND: commit `bc27e31` in `git log --oneline --all`
- FOUND: commit `83a7ba2` in `git log --oneline --all`
- All plan-level `<verification>` commands re-run and green (siehe Accomplishments/Next Phase Readiness)

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
