# Phase 14: Tests & Gates - Discussion Log

> **Nur Prüfpfad.** Nicht als Eingabe für Planung, Recherche oder Ausführung verwenden.
> Die Entscheidungen stehen in `14-CONTEXT.md` — dieses Protokoll bewahrt die verworfenen
> Alternativen.

**Datum:** 2026-09-06
**Phase:** 14-Tests & Gates
**Besprochene Bereiche:** Toast-Race (Weg & Beweis), Zuschnitt der Welt-Testdateien,
Lint & Typecheck schärfen, Coverage messbar machen
**Modus:** Auswahl aller vier Bereiche + Delegation („Führe alle Bereiche nach deinen
Empfehlungen aus") — dieselbe Vorgabe wie in Phase 13

---

## Auswahl der Bereiche

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Toast-Race: Weg & Beweis | Fünfte wortgleiche Kopie des ~40-Zeilen-Seeds oder gemeinsamer Helfer? Und wie wird „unter Volllast nicht reproduzierbar" belegt, wenn CI zweimal wiederholt? | ✓ |
| Zuschnitt Welt-Testdateien | Nur die E2E-Sammel-Spec aufteilen oder auch `welt-story.test.js`? Mechanisch verschieben oder Lücken schließen? | ✓ |
| Lint & Typecheck schärfen | Roten Fehler beheben; 539 undeklarierte Globals deklarieren und `no-undef` auf `error`, oder Warnungszahl einfrieren? `checkJs` an oder aus? | ✓ |
| Coverage messbar machen | `roots` reparieren, `vm`-Pfad instrumentieren, oder Statement-Coverage durch ein anderes Gate ersetzen? | ✓ |

**Antwort des Nutzers:** „Führe alle Bereiche nach deinen Empfehlungen aus." (zusätzlich zu allen
vier Bereichen)
**Konsequenz:** Keine Einzelfragen je Bereich. Alle Entscheidungen als Empfehlung getroffen, gegen
den Live-Code gemessen und in `14-CONTEXT.md` D-01…D-15 mit Beleg festgehalten.

---

## Toast-Race: Weg & Beweis (TEST-03)

### Seed-Weg

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Fünfte wortgleiche Kopie | 61 Zeilen ein viertes und fünftes Mal einfügen; hält den Wortlaut von Erfolgskriterium 1 exakt ein | |
| Gemeinsamer Helfer in `test-utils.js` | `seedCleanSession(page)`; alle fünf Specs rufen ihn auf, Ursachenkommentar wandert mit | ✓ (D-01) |
| Playwright-Fixture / globalSetup | Zentral, aber implizit — Seed wäre für alle Specs aktiv, auch die, die ihn nicht wollen | |

**Ausschlaggebend:** Die drei bestehenden Blöcke sind byte-identisch (md5 `6364cafedc46`, je 61
Zeilen). Der teure Teil einer Extraktion — abweichende Varianten zusammenführen — existiert hier
nicht. Eine Fixture wurde verworfen, weil sie den Seed implizit auf Specs ausdehnen würde, die ihn
nie geprüft haben.

### Beweisverfahren

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Protokollierter `--repeat-each`-Lauf mit `--retries=0` + Falsifikationsprobe | Einmaliger Nachweis als Artefakt, Vorlauf gegen den ungefixten Stand | ✓ (D-02) |
| Dauerhafter CI-Wiederholungsjob | Vervielfacht die CI-Zeit für alle Specs | |
| CI-`retries` auf 0 senken | Macht jeden Infrastruktur-Schluckauf auf `main` rot | verworfen (D-03) |
| Deterministischer Test „kein früher `save()`-Toast" | Prüft die Ursache statt das Symptom — attraktiv, aber kein Nachweis für „unter Volllast" | |

**Notiz:** Die Falsifikationsprobe ist die eigentliche Härte. Reproduziert der Lauf die Race gegen
den ungefixten Stand nicht, beweist der grüne Nachlauf nichts über den Fix. Direkte Anwendung des
wiederkehrenden Projektbefunds „ein grüner Test ist kein Beweis" (`08-LEARNINGS.md`,
`11-LEARNINGS.md`).

---

## Zuschnitt der Welt-Testdateien (TEST-04)

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Nur die E2E-Sammel-Spec aufteilen (2 → 6 Dateien) | Hält den Singular in Erfolgskriterium 2 ein | |
| Beide Sammeldateien aufteilen (2 → 10 Dateien) | `DEBT-28` nennt ausdrücklich beide | ✓ (D-04) |
| Beide aufteilen **und** Abdeckungslücken schließen | Ungleich größer, ohne Grenze im Requirement | verschoben |

**Ausschlaggebend:** `v1.1-REQUIREMENTS.md:134` nennt `tests/unit/welt-story.test.js` **und**
`tests/e2e/features/welt-story.spec.js`. Nur die E2E-Hälfte zu teilen ließe 593 Zeilen mit fünf
Domänen genau so stehen, wie das Requirement es beklagt.

**Zusatzentscheidungen:** Benennung nach Quellverzeichnis statt nach den `WELT-NN`-Planungscodes
(D-04). Aufteilung mechanisch, Testzahl vorher = nachher (26 E2E, 37 Unit, D-05). `APP_URL` wird
beim Verschieben **nicht** auf `loadApp()` umgestellt, weil das eine Timing-Änderung wäre (D-06).

---

## Lint & Typecheck schärfen (TEST-05)

### Lint

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Nur den roten Fehler beheben | Minimal, aber keine Schärfung | |
| Fehler beheben + Warnungszahl einfrieren (Ratsche) | Trend statt Härte | teilweise ✓ (D-10) |
| Fehler beheben + Globals **generieren** + `no-undef` auf `error` + Warnungs-Ratsche | Härte dort, wo sie greift; Trend beim Rest | ✓ (D-07/D-08/D-10) |
| Globals-Liste von Hand pflegen | 510 Namen; verrottet binnen einer Phase | verworfen |

**Notiz:** Die Triage der 1829 `no-undef`-Treffer war entscheidend — 516 fehlende Node-Globals,
15 Browser-Globals, 1259 legitime Projekt-Globals, **39 Restposten mit 6 toten Aktionszielen in
Produktionscode**. Ohne deren Behebung (D-09) ist `no-undef: error` nicht erreichbar. `--max-warnings 0`
wurde verworfen, weil die 336 `no-unused-vars` überwiegend aus dem `const X = window.X`-Muster
stammen, das Phase 13 D-14 als Projektstandard schützt.

**Befund, der die Reihenfolge bestimmt:** `npm run lint` bricht seit dem 2026-09-05 (`d2a521c`) mit
Exit 1 ab. Der CI-Job `lint-and-typecheck` ist rot, `e2e`/`build`/`smoke-test`/`deploy` hängen per
`needs:` daran.

### Typecheck

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| `checkJs: true` global | Gemessen: 1617 Fehler in 98 von 103 Dateien | verworfen |
| `checkJs: true` über eine wachsende Zulassungsliste (`tsconfig.strict.json`) | Echte, verifizierbare Ratsche | ✓ (D-11) |
| `tsconfig.json` unverändert lassen | Keine Schärfung | |
| `strict: true` setzen und Fehler wegkonfigurieren | Ein Gate, das grün ist, weil es nichts prüft | verworfen |

**Notiz:** 1268 der 1617 Fehler sind TS2339 aus dem `window.X`/`D.X`-Zugriffsmuster — Architektur,
kein Defekt. Weitere 240 sind TS2304, dieselbe Sache, die `no-undef: error` eine Ebene tiefer bereits
hart macht. Der Restertrag von `checkJs` (~25 Tippfehlerkandidaten, ~69 Typkonflikte) rechtfertigt
den globalen Flaggenwechsel nicht. `DEBT-01`s tsconfig-Hälfte bleibt bewusst als benannter
Restposten offen — mit Messwert statt stiller Abnahme.

---

## Coverage messbar machen (TEST-05)

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| `roots` reparieren + globale Statement-Schwelle als Ratsche | Ehrlich, aber die Zahl (0,77 %) taugt nicht als Gate | teilweise ✓ (D-12) |
| `vm`-Pfad mit `babel-plugin-istanbul` instrumentieren | Einziger Weg zu echter Statement-Coverage — 30 handgerollte Ladestellen, kein gemeinsamer Helfer | verschoben |
| Statement-Coverage durch ein Modul-zu-Test-Abdeckungs-Gate ersetzen | Aus `loader.js MODULES` ableitbar, Ausnahmeliste als Ratsche | ✓ (D-13) |
| Alles lassen wie es ist | Zwei von 134 Modulen instrumentiert | verworfen |

**Notiz:** Die Messung war ausschlaggebend. Heute instrumentiert `jest --coverage` **2 von 134
Modulen**; die Kopfzahl „92,45 %" bezieht sich auf 159 Statements. Ursache: `roots: ['<rootDir>/tests']`
lässt Jest die in `collectCoverageFrom` gelisteten Verzeichnisse nie durchsuchen. Mit repariertem
`roots` lautet die ehrliche Zahl **0,77 % (147/18950)** — weil 30 von 40 Unit-Testdateien Quelltext
über `vm` + `readFileSync` laden, woran Istanbul strukturell nicht herankommt, und weil ein
erheblicher Teil dieser Tests Quelltext **als Text** prüft und per Konstruktion keine Coverage
erzeugen kann.

**Basislinie des neuen Gates:** 75 von 134 Modulen ohne jede Testerwähnung — als datierte
Ausnahmeliste eingefroren, der Test bricht bei Wachstum. `TEST-04` nimmt elf davon herunter (75 → 64).

---

## Claude's Discretion

Der Nutzer hat alle vier Bereiche gewählt und die Entscheidungen delegiert. Sämtliche D-01…D-15 in
`14-CONTEXT.md` sind daher Empfehlungsentscheidungen — nach Projektkonvention und gegen den
gemessenen Live-Stand getroffen, damit der Planer sie nicht neu wählt.

**Drei Abweichungen von der Roadmap-Erwartung, jeweils mit Beleg begründet:**
- D-01 — Erfolgskriterium 1 legt einen Seed-*Nachzug* nahe; empfohlen ist die Extraktion
- D-04 — Erfolgskriterium 2 spricht von *einer* Sammel-Spec; es sind zwei
- D-11 — Erfolgskriterium 3 verlangt drei geschärfte, grüne Gates; für Typecheck wird das nur für
  eine Zulassungsliste erreicht

---

## Deferred Ideas

Vollständige Liste in `14-CONTEXT.md` §`<deferred>`. Kurzfassung:

- Abdeckungslücken der fünf Welt-Features schließen (nach der Aufteilung sichtbar)
- `welt-story.spec.js`s `APP_URL` auf `loadApp()` vereinheitlichen
- `vm`-Ladepfad instrumentierbar machen (gemeinsamer Helfer + `babel-plugin-istanbul`)
- `checkJs` über die Zulassungsliste hinaus ausrollen (braucht `window`- und `D`-Typdeklaration)
- `tests/unit/markdown-converter.test.js` — Platzhalter-Assertions, die nichts prüfen
- Dedizierte DM-Screen-Widget-Tests (aus Phase 13 D-04 weitergereicht)
- `console.*` per Build-Schritt strippen (aus Phase 13 weitergereicht)
- Nächtlicher Lauf mit `retries: 0`, um Flakes dauerhaft sichtbar zu machen
