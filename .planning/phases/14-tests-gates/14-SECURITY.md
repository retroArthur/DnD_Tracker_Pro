---
phase: "14"
slug: "tests-gates"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-09-07"
---

# Phase 14 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register aus den `<threat_model>`-Bloecken aller neun PLAN-Dateien (T-14-01..T-14-31)
> plus der in acht Plaenen wiederholt deklarierten Lieferketten-Bedrohung (T-14-SC).
> Verifiziert am 2026-09-07 gegen den Live-Baum, nicht gegen die SUMMARY-Behauptungen.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Quellbaum -> Lint-/Typecheck-Konfiguration | `eslint.config.js`, `tsconfig.strict.json`, `package.json`-Skripte entscheiden, welcher Code ueberhaupt geprueft wird | Konfigurationswerte (Ignorier-Listen, Zulassungslisten, Warngrenzen) |
| `loader.js MODULES` -> Generator -> `eslint.generated-globals.js` | Erzeugter Code, der anschliessend die Lint-Regeln speist | Bezeichnernamen aus dem Quellbaum |
| Quellbaum -> `build.py` -> `dist/*.html` | Was gebuendelt wird, geht an den Endnutzer aus (file://-Nutzung) | Anwendungscode inkl. Aktionsregistrierungen |
| Testbaum -> Bundle | `tests/**` darf den Auslieferungspfad nie erreichen | Seed-Daten, Testfixtures |
| Externe Registry -> `package.json` / `package-lock.json` | Abhaengigkeiten der Test- und Gate-Werkzeuge | npm-Pakete (T-14-SC) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-14-01 | Tampering | `systems/avatars.js` Steuerzeichen-Strip | high | mitigate | Regex unveraendert (`systems/avatars.js:18`); `tests/unit/avatars.test.js` (14 Tests) laeuft in CI | closed |
| T-14-02 | Tampering | Reichweite der Lint-Ausnahme | high | mitigate | Ausnahme ausschliesslich als `eslint-disable-next-line`; Live-Zaehlung: `eslint-disable` == 1, `eslint-disable-next-line no-control-regex` == 1 | closed |
| T-14-03 | Repudiation | Messprotokoll | low | accept | `14-TOAST-RACE-MEASUREMENT.md` ist eingecheckt und git-verfolgt, mit Befehl und Datum | closed |
| T-14-04 | Tampering | `eslint.generated-globals.js` (Handbearbeitung) | medium | mitigate | `tests/unit/eslint-globals-freshness.test.js` — 5/5 gruen im Live-Lauf, inkl. Fail-First-Driftfall | closed |
| T-14-05 | Tampering | Generator-Ausgabe (Code-Erzeugung) | medium | mitigate | `tools/generate-eslint-globals.js:217-232`: Schluessel per `JSON.stringify(key)`, Werte feste Literale `'readonly'`/`'writable'` — nie quelltextabgeleitet | closed |
| T-14-06 | Denial of Service | Generator liest `loader.js MODULES` | low | accept | Fehlende Dateien werden uebersprungen; linearer Scan, kein Netzwerk-, kein Nutzereingabepfad | closed |
| T-14-07 | Spoofing | Konfigurationsumfang der neuen `files`-Bloecke | medium | mitigate | Drei eng gefasste Bloecke in `eslint.config.js`; Node-Globals nicht projektweit geoeffnet | closed |
| T-14-08 | Information Disclosure | Fester Seed-Datensatz in `test-utils.js` | low | accept | Nur Struktur- und Standardwerte, keine Zugangsdaten; `grep "tests/" loader.js` = 0 Treffer, `tests/**` erreicht das Bundle nie | closed |
| T-14-09 | Tampering | Beweisfuehrung des Lastlaufs | high | mitigate | Roter Vorlauf (5 fehlgeschlagen/95, `--retries=0`) und zwei gruene Nachlaeufe protokolliert; menschliche Freigabe in `14-UAT.md` (Test 1 = pass) | closed |
| T-14-10 | Denial of Service | Lastlauf mit hoher Worker-Zahl | low | accept | `playwright.config.js:27,30` unveraendert: `retries: process.env.CI ? 2 : 0`, `workers: process.env.CI ? 1 : undefined` — der Lastlauf ist lokal und manuell | closed |
| T-14-11 | Tampering | Testmenge waehrend der E2E-Aufteilung | high | mitigate | Unabhaengig nachgezaehlt: 5+8+4+4+5 = **26**; `welt-story.spec.js` nachweislich entfernt | closed |
| T-14-12 | Repudiation | Entfernen der Sammel-Spec | low | accept | `git log --diff-filter=D` weist `d74bb38` nach; Historie vollstaendig | closed |
| T-14-13 | Tampering | Testmenge waehrend der Unit-Aufteilung | high | mitigate | Unabhaengig nachgezaehlt: 3+4+7+11+12 = **37**; `welt-story.test.js` nachweislich entfernt | closed |
| T-14-14 | Elevation of Privilege | Reichweite des Testsetups | medium | mitigate | `git log -- tests/setup.js`: letzte Aenderung liegt vollstaendig vor Phase 14 | closed |
| T-14-15 | Repudiation | Entfernen der Unit-Sammeldatei | low | accept | `git log --diff-filter=D` weist `bf809d5` nach | closed |
| T-14-16 | Tampering | CSV-Export ueber `data-value` | medium | mitigate | `systems/spellslots/import-export.js:233-243`: `IO_SCHEMA[dataType]`-Waechter und Array-Inhaltspruefung intakt, Datenfluss unveraendert | closed |
| T-14-17 | Denial of Service | Tote Aktionsregistrierungen | medium | mitigate | **War realisiert, heute geschlossen.** `populateImportNodesList` stand tot in `ALLOWED_CHANGE_HANDLERS` und ging in beide dist-Bundles; entfernt in `47f07c5`. Alle sieben toten Namen: 0 Treffer in `ui/`, `features/`, `systems/`, `types/`, `tests/` und beiden Bundles. Stehender Waechter `tests/unit/action-target-integrity.test.js` 2/2 gruen (mutationsgeprueft) | closed |
| T-14-18 | Spoofing | Ambiente Deklaration ohne Implementierung | medium | mitigate | `exportDataCSV` (verwaist): 0 Treffer projektweit; `exportToCSV` hat echte Definition (`import-export.js:233`) und passende `.d.ts` | closed |
| T-14-19 | Tampering | Umgehung der Verschaerfung durch Konfiguration | high | mitigate | `git diff 1f5abd0^..HEAD -- eslint.config.js`: beide `ignores`-Bloecke (Zeile 112, 252) byte-identisch vor/nach der Phase. `sw.js` war bereits vorher ausgeschlossen — kein in dieser Phase geoeffneter Fluchtweg | closed |
| T-14-20 | Tampering | `include`-Zulassungsliste | high | mitigate | `tsconfig.strict.json`: Nur-Wachsen-Regel, Erhebungsdatum (2026-09-07) und zweistufiger Erhebungsbefehl im Kommentar; Liste nicht leer (8 Eintraege) | closed |
| T-14-21 | Tampering | Compiler-Optionen als Fluchtweg | medium | mitigate | Genau drei Optionen ueberschrieben (`checkJs`, `noEmit`, `emitDeclarationOnly`); `tsconfig.json` seit Phase-1-Zeit unveraendert | closed |
| T-14-22 | Elevation of Privilege | Schreibender Probelauf | medium | mitigate | `noEmit: true` bestaetigt; `git status` und `git ls-files --others` zeigen keine verirrten `.d.ts`-Dateien | closed |
| T-14-23 | Repudiation | Umfang des geschlossenen Anteils | medium | mitigate | `DEBT-01`-Restposten mit gemessenen Zahlen (1751/117/134) in `14-GATE-BASELINE.md` und `REQUIREMENTS.md`; ausdruecklich NICHT als erledigt gefuehrt | closed |
| T-14-24 | Tampering | `roots`-Aenderung veraendert unbemerkt die Testmenge | high | mitigate | `roots: ['<rootDir>']`; Live-Lauf 50 Suiten / 1120 Tests deckt sich mit dem protokollierten Stand; `testMatch`/`testPathIgnorePatterns` unveraendert | closed |
| T-14-25 | Tampering | Beschoenigung der Coverage-Zahl | high | mitigate | `jest.config.cjs:48-59`: `collectCoverageFrom` weiterhin der volle breite Glob-Satz (`core/**`, `features/**`, `systems/**`, `ui/**`, `render/**`) — nicht gekuerzt | closed |
| T-14-26 | Tampering | Wirkungslose Schwelle | medium | mitigate | Live `npx jest --coverage`: gemessen 92.81/89.28/100/94.44 gegen Schwellen 92/89/99/94 — Ratsche greift eine ganze Zahl unter dem Messwert; beidseitiger Nachweis in 14-08 protokolliert | closed |
| T-14-27 | Denial of Service | Coverage-Lauf ueber den gesamten Quellbaum | low | accept | `collectCoverageFrom` ist ein statischer Quell-Glob; kein dynamischer, Nutzereingabe- oder Netzwerkpfad | closed |
| T-14-28 | Tampering | Wachsen der Ausnahmeliste | high | mitigate | Live `npx jest tests/unit/module-test-coverage.test.js` 4/4 gruen inkl. Ratschen-Testfall. Zum Wachstum 78 -> 86 siehe *Beurteilung* unten — kein Verstoss gegen die Prohibition | closed |
| T-14-29 | Spoofing | Falsch-positive Abdeckung durch zu lockeres Kriterium | high | mitigate | `module-test-coverage.test.js:21-36`: beide gemessenen Zahlen (78 vs. 62) und die Begruendung fuer das strengere Pfadkriterium dokumentiert | closed |
| T-14-30 | Repudiation | Verwaiste Ausnahmen | medium | mitigate | Live-Testfall "kein Eintrag der Ausnahmeliste ist verwaist" gruen | closed |
| T-14-31 | Tampering | Modul aus `loader.js` entfernen, um das Gate zu umgehen | medium | mitigate | `build.py:109-116` bricht bei fehlender gelisteter Datei hart ab (`[FEHLER]`); `loader.js` seit Phase 13 unveraendert | closed |
| T-14-SC | Tampering | Lieferkette (npm-Abhaengigkeiten) — in 8 der 9 Plaene deklariert | high | mitigate | `git diff 1f5abd0^..HEAD -- package.json`: **null** Aenderungen im Abhaengigkeitsteil (nur `scripts`); `package-lock.json` in Phase 14 unberuehrt (0 geaenderte Dateien) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — nur offene Bedrohungen ab `block_on: high` zaehlen in `threats_open`*
*Disposition: mitigate (Umsetzung noetig) · accept (dokumentiertes Restrisiko) · transfer (Dritte)*

---

## Beurteilung: Wachstum der Ausnahmeliste (T-14-28)

Die `MODULE_TEST_EXCEPTIONS`-Liste ist waehrend der Phase von 78 auf 86 Eintraege gewachsen
(Commit `f284fb7`, CR-01). Das ist **kein** Verstoss gegen die Prohibition des Plans.

Der Prohibitionstext (`tests/unit/module-test-coverage.test.js:41-43`) verbietet, ein **neu**
zu `loader.js MODULES` hinzugefuegtes Modul in die Ausnahmeliste zu setzen, statt es zu testen.
Die acht ergaenzten Eintraege sind dagegen **vorbestehende** Module, die ein Messfehler
(`walk()` hat die beilaeufigen String-Erwaehnungen einer Python-Datei mitgezaehlt) faelschlich
als "abgedeckt" gefuehrt hatte. Die Fehlerbehebung hat echte, vorbestehende Luecken sichtbar
gemacht; sie wurden anschliessend datiert und offen gelistet — genau der in D-13 vorgesehene
Mechanismus. Das ist die ehrliche Nutzung des gebauten Verfahrens, nicht seine Umgehung.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-14-01 | T-14-03 | Messprotokoll ist ein eingechecktes Artefakt; Manipulation waere in der Git-Historie sichtbar | Plan 14-03 (disposition: accept) | 2026-09-07 |
| R-14-02 | T-14-06 | Generator-Scan ist linear und laeuft im Rahmen eines `npx jest`-Laufs; kein Nutzereingabepfad | Plan 14-02 (disposition: accept) | 2026-09-07 |
| R-14-03 | T-14-08 | Seed-Datensatz enthaelt nur Struktur- und Standardwerte, keine Zugangsdaten | Plan 14-03 (disposition: accept) | 2026-09-07 |
| R-14-04 | T-14-10 | Lastlauf ist lokal und manuell; CI behaelt `retries: 2` / `workers: 1` | Plan 14-03 (disposition: accept) | 2026-09-07 |
| R-14-05 | T-14-12, T-14-15 | Entfernen der Sammeldateien per `git rm`; Historie bleibt vollstaendig | Plaene 14-04, 14-05 (disposition: accept) | 2026-09-07 |
| R-14-06 | T-14-27 | Groesserer Instrumentierungsumfang bleibt in der Laufzeit eines regulaeren Jest-Laufs | Plan 14-08 (disposition: accept) | 2026-09-07 |

*Accepted risks do not resurface in future audit runs.*

---

## Durability Notes (nicht blockierend)

Diese Punkte sind **keine offenen Bedrohungen** — die jeweilige Mitigation ist vorhanden und
wirksam. Sie halten fest, wo eine Mitigation *vorhanden aber ungesichert* ist, also durch eine
einmalige Pruefung statt durch ein stehendes Gate belegt wird.

| Ref | Beobachtung |
|-----|-------------|
| T-14-02 | Die Zaehlpruefung der Lint-Ausnahme war ein einmaliger Shell-Check. Ein spaeteres dateiweites `/* eslint-disable */` in `systems/avatars.js` bliebe unbemerkt. Der Plan hat allerdings nie ein stehendes Gate zugesagt — dies ist eine Haltbarkeitsnotiz, keine Luecke gegen die deklarierte Disposition. |
| T-14-20, T-14-24, T-14-28 | Die drei Ratschen der Phase (`--max-warnings`, `tsconfig.strict`-Include, `MODULE_TEST_EXCEPTIONS`) sind je durch Kommentar/Konvention plus einen engen Test gesichert, nicht durch ein strukturelles Gate. Als Validierungsluecken erfasst unter `14-VALIDATION.md` NQ-03 und NQ-08 — dort, nicht hier, weil Validierungsluecken keine STRIDE-Bedrohungen sind. |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-07 | 32 | 32 | 0 | gsd-security-auditor (sonnet), ASVS L1, orchestrator-verifiziert |

**Methode:** Register aus den `<threat_model>`-Bloecken aller neun Plaene extrahiert. Der
Orchestrator hat die elf `high`-Bedrohungen vorab per Grep klassifiziert; der Auditor hat alle
32 unabhaengig gegen den Live-Baum nachgeprueft und dabei jedes zitierte Waechter-Testfile
tatsaechlich ausgefuehrt statt nur gelesen. Der Orchestrator hat anschliessend T-14-SC
(Abhaengigkeitsdiff) und T-14-18 (verwaiste Deklaration) stichprobenartig gegengeprueft.
Keine SUMMARY-Behauptung wurde ungeprueft uebernommen — im Gegenteil hat der Nyquist-Schritt
derselben Sitzung eine falsche SUMMARY-Behauptung (14-06 D1) aufgedeckt, die T-14-17 betraf.

**Keine `## Threat Flags` in den neun SUMMARY-Dateien** — kein Executor hat neue Angriffsflaeche
gemeldet.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed (0 auf Stufe `high`, 0 auf jeder Stufe)
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-07
