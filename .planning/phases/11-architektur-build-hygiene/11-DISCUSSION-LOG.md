# Phase 11: Architektur- & Build-Hygiene - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-25
**Phase:** 11-Architektur- & Build-Hygiene
**Areas discussed:** Modullisten-Sync, Dedup Pass 3, CI- & Konsolen-Hygiene, Map-Refresh & CONCERNS-Triage

**Vorbemerkung:** Der Nutzer wählte alle vier vorgeschlagenen Bereiche zur Diskussion. Nach der ersten Frage zu CI- & Konsolen-Hygiene delegierte er den Rest explizit an Claude („mach weiter mit deinen Empfehlungen, ohne mich zu fragen"). Ab D-09 sind die Entscheidungen daher Claude-gewählte Empfehlungen — im Log unten als solche gekennzeichnet.

---

## Modullisten-Sync (ARCH-01)

### Frage 1: Single Source of Truth oder bestehenden Gate verschärfen?

| Option | Description | Selected |
|--------|-------------|----------|
| Single Source of Truth | build.py parst MODULES zur Build-Zeit aus loader.js; die 148-Zeilen-Kopie in build.py:40-187 entfällt. Drift wird unmöglich statt erkannt, inkl. Reihenfolge. Preis: Regex-Abhängigkeit von loader.js-Formatierung; test_module_lists_are_synchronized verliert seinen Gegenstand. | ✓ |
| Bestehenden Gate verschärfen | Beide Listen bleiben; Vergleich wird ordnungssensitiv, Parse-Fehler bricht ab, fehlende Datei wird Fehler. Kleinerer Eingriff, Doppelpflege bleibt. | |
| Du entscheidest | Claude wählt beim Planen anhand der Parsbarkeit. | |

**User's choice:** Single Source of Truth
**Notes:** Ausgangslage beim Scouting: ein harter Gate existiert bereits (build.py:211-232, sys.exit(1)), hat aber drei Löcher — Mengenvergleich statt Reihenfolge, Parse-Fehler überspringt sich still, fehlende Datei nur Warnung.

### Frage 2: Fehlende gelistete Datei — wie hart?

| Option | Description | Selected |
|--------|-------------|----------|
| Alles hart abbrechen | JS-Module (build.py:518), CSS (build.py:468) und Templates gleichermaßen. Kein bekannter Fall im Repo braucht optionale Dateien. | ✓ |
| Nur JS-Module hart | Enger am ARCH-01-Wortlaut; fehlendes Stylesheet fällt weiter nur visuell auf. | |
| Du entscheidest | Claude prüft beim Planen die Vollständigkeit der Listen. | |

**User's choice:** Alles hart abbrechen
**Notes:** —

### Frage 3: Wie wird tests/build/ zum echten CI-Gate?

| Option | Description | Selected |
|--------|-------------|----------|
| pytest in den bestehenden test-Job | ci.yml:22-31 bekommt setup-python + pytest-Schritt. Ein Job weniger in der Matrix. | ✓ |
| Eigener build-tests-Job | Klarere Fehlerzuordnung, unabhängige Laufzeit, dafür zusätzlicher Setup-Overhead. | |
| Du entscheidest | Claude wählt die Variante, die sich sauberer in die Job-Kette fügt. | |

**User's choice:** pytest in den bestehenden test-Job
**Notes:** Befund: tests/build/test_build_deduplication.py hat 11 Tests, läuft aber in keinem CI-Job — die vorhandene Absicherung war faktisch keine.

### Frage 4: Wie weit zieht ARCH-01 den Kreis?

| Option | Description | Selected |
|--------|-------------|----------|
| Alle drei Listen | Module + Templates aus loader.js, CSS-Reihenfolge aus assets/styles.css. Gleiche Mechanik, ein Durchgang. | ✓ |
| Nur die Modulliste | Streng am Wortlaut; Templates/CSS bleiben doppelt gepflegt und werden CONCERNS-Posten. | |
| Module + Templates, CSS später | Beide loader.js-Listen zur SSoT, CSS später wegen zweiter Quelle. | |

**User's choice:** Alle drei Listen
**Notes:** Befund: Template-Liste doppelt (loader.js:220-230 ↔ build.py:483), CSS-Liste doppelt (assets/styles.css @import ↔ build.py:450). Nachgeprüft: die 20 @import-Zeilen decken sich 1:1 in Inhalt und Reihenfolge mit css_files.

---

## Dedup Pass 3 (ARCH-02)

### Frage 1: Was wird aus Pass 3?

| Option | Description | Selected |
|--------|-------------|----------|
| Ersatzlos entfernen | remove_duplicate_functions() fällt weg; der Pre-Check bleibt einzige Instanz. Erfüllt „Build-Fehler statt still kaputtem Bundle" strikter — der kaputte Zustand kann nicht mehr entstehen. | ✓ |
| Zum harten Abbruch umbauen | Pass 3 bleibt, bricht bei Duplikat ab. Zweite Verteidigungslinie, dafür zwei Mechanismen für dasselbe Ziel. | |
| Reparieren (Rumpf mit auskommentieren) | Minimalster Eingriff, aber Ergebnis ist ein Bundle mit still fehlender Funktionsdefinition — die Fehlerklasse vom 2026-01-10. | |

**User's choice:** Ersatzlos entfernen
**Notes:** Befund: Pass 3 kann faktisch nicht mehr feuern, seit check_duplicate_functions (build.py:190) vor dem Bündeln hart abbricht — toter Code mit dem bekannten Orphan-Bug (build.py:402-415).

### Frage 2: Pre-Check-Reichweite?

| Option | Description | Selected |
|--------|-------------|----------|
| Auf const/let/class erweitern | Nennt beide Quelldateien beim Namen statt einer Zeilennummer im 59k-Zeilen-Bundle. Bundle-Validierung bleibt Backstop. | ✓ |
| Beim function-Check belassen | Fokus auf die historische Fehlerklasse; const/let deckt die Bundle-Validierung ab, mit schlechterer Meldung. | |
| Du entscheidest | Claude prüft Regex-Machbarkeit gegen den Quellbaum. | |

**User's choice:** Auf const/let/class erweitern
**Notes:** Befund: die Post-Build-Validierung (build.py:657-672) prüft bereits Depth-0-Duplikate für const/let/function/var und bricht ab, bevor die Datei geschrieben wird.

### Frage 3: Was soll tests/build/ nach dem Entfernen beweisen?

| Option | Description | Selected |
|--------|-------------|----------|
| Verhalten statt Interna | Exit ≠ 0 und keine geschriebene Ausgabedatei; plus Regressionstest gegen [DEDUP]-Marker im Bundle (Schutz gegen Wiederbelebung). Bindet nicht an Funktionsnamen. | ✓ |
| Unit-Tests auf die Prüffunktionen | Nah am bestehenden tmp_path-Muster, sagt aber nichts über den tatsächlichen Build-Abbruch aus. | |
| Beides | Vollständigste Absicherung, größte Suite, Build-Lauf kostet CI-Zeit. | |

**User's choice:** Verhalten statt Interna
**Notes:** —

### Frage 4: Wie weit reicht die Doku-Nachführung?

| Option | Description | Selected |
|--------|-------------|----------|
| Betroffene Abschnitte präzise | Nur was durch D-01/D-05 faktisch falsch wird: Pass-3-Beschreibung, Perf-Tabelle, Modullisten-Constraint, Debugging-Rezepte. | ✓ |
| Vollaudit der Build-Doku | Auch vor Phase 11 gedriftete Aussagen (Modulzahlen, Byte-Angaben) — überlappt mit ARCH-04 und bläht die Phase. | |
| Du entscheidest | Claude zieht die Grenze beim Planen. | |

**User's choice:** Betroffene Abschnitte präzise
**Notes:** —

---

## CI- & Konsolen-Hygiene (ARCH-03)

### Frage 1: Wie weit Node heben?

| Option | Description | Selected |
|--------|-------------|----------|
| Auf Node 22 LTS | Aktive LTS; Node 20 läuft in den Wartungsmodus. Risiko null zusätzlicher Runtime-Abweichungen, weil die App kein Node braucht. | ✓ (Claude-gewählt) |
| Auf Node 24 | Folgt dem Requirement-Wortlaut wörtlich; Toolchain-Ecken weniger breit erprobt. | |
| Actions prüfen, Node lassen | Minimales Risiko, aber Deprecation-Warnung bliebe — Erfolgskriterium 3 unerfüllt. | |

**User's choice:** „mach weiter mit deinen Empfehlungen, ohne mich zu fragen" → Delegation an Claude ab hier
**Notes:** Befund: alle Actions stehen bereits auf aktuellen Majors (checkout@v4, setup-node@v4, upload-artifact@v4, setup-python@v5, configure-pages@v5, deploy-pages@v4). Die Deprecation-Warnung stammt aus `node-version: '20'` an sechs Stellen, nicht aus veralteten Action-Versionen — das Requirement („Actions auf Node-24-kompatible Versionen gehoben") beschreibt die Ursache leicht anders als sie tatsächlich liegt.

### Nicht mehr gestellt — von Claude entschieden (D-10 bis D-12)

- **Favicon (D-10):** Data-URI im Bundle (build-time aus `icons/icon.svg` inlined), Datei-Link in `index.html`. Alternative — überall Datei-Link — verworfen, weil `file://`-Doppelklick auf die Einzeldatei der primäre Nutzungsmodus ist und dort genau der 404 entstünde, den die Phase schließen soll.
- **apple-mobile-web-app-capable (D-11):** `mobile-web-app-capable` ergänzen, apple-Tag behalten. Alternative — ersetzen — bleibt Rückfallposition, falls die Konsole nach dem Ergänzen weiterhin warnt (iOS ist kein Zielsystem).
- **Konsolen-Nachweis (D-12):** gezielte Assertion in `tests/e2e/smoke.spec.js` (keine fehlgeschlagenen Requests, keine der beiden bekannten Deprecation-Meldungen). Alternative — pauschal „keine Warnungen" — verworfen als flaky.

---

## Map-Refresh & CONCERNS-Triage (ARCH-04)

### Nicht mehr gestellt — von Claude entschieden (D-13 bis D-16)

- **Reihenfolge (D-13):** erst triagieren und in `11-CONCERNS-TRIAGE.md` dokumentieren, dann regenerieren. Grund: `/gsd-map-codebase` überschreibt CONCERNS.md vollständig, die Triage-Historie ginge sonst verloren.
- **Refresh-Umfang (D-14):** alle sieben Map-Dateien, nicht nur CONCERNS.md. Alle stammen vom 2026-06-11, vor den Phasen 3–10; ein Teil-Refresh hinterlässt einen widersprüchlichen Satz. Alternative — nur CONCERNS.md — verworfen.
- **Belegpflicht (D-15):** jede Disposition zitiert Datei:Zeile oder Phase/Commit gegen den Live-Code. Grund: CONCERNS.md ist nachweislich stale — beim Scouting fielen mehrere längst erledigte Einträge auf (sw.js-Cache-Liste, „no automated dist smoke test", testable-utils-Parität, 26 E2E-Fails).
- **Fix-Scope (D-16):** Phase 11 fixt keine Restposten aktiv; Ausnahme sind Posten im Build-/CI-/Doku-Bereich, die durch D-01..D-12 ohnehin angefasst werden. Alles andere wird als benanntes Backlog-Requirement übernommen. Grund: Milestone-Leitplanke ist verhaltensneutral, die Roadmap fordert Disposition, keinen Fix.

---

## Claude's Discretion

- D-09 bis D-16 insgesamt (explizite Delegation durch den Nutzer) — beim Review von CONTEXT.md oder PLAN.md jederzeit umstoßbar
- Technische Form des loader.js-Parsers und der @import-Auswertung
- Ob `MODULES` in build.py als importierbare Konstante bestehen bleibt
- Plan-/Wellen-Aufteilung (ARCH-01 und ARCH-02 gebündelt oder getrennt)
- Gestalt von `11-CONCERNS-TRIAGE.md`
- Zeitpunkt des Map-Refresh innerhalb der Phase (muss den Stand nach den Änderungen abbilden)

## Deferred Ideas

- Verschärfung von Pass 2 (`deduplicate_window_assignments`, build.py:293-371) — dieselbe „still statt laut"-Klasse, aber ohne Schadensfall und mit echtem Regressionsrisiko
- Flächenumbau der ~504 funktions-lokalen `const X = window.X` — explizit Out of Scope laut REQUIREMENTS.md:47
- Aktive Fixes der CONCERNS-Restposten (`_version: '2.11'`, ungeschütztes setInterval in backups.js:318, Undo-Snapshot-Performance, oversized modules, Tab-Registry-Strings, `no-undef` als Error, die drei execCommand-Stellen außerhalb des Editors) — per D-16 in den Backlog
- CSP-Meta-Tag und class-Präfix-Whitelist — bereits in Phase 10 (D-08) als akzeptierte Risiken entschieden
