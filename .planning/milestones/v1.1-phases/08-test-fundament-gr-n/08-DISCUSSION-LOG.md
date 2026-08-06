# Phase 8: Test-Fundament grün - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-22
**Phase:** 8-Test-Fundament grün
**Areas discussed:** App-Bug-Politik, CI-Gate-Umfang, Härtungs-Reichweite, Doku-Form

---

## App-Bug-Politik

| Option | Description | Selected |
|--------|-------------|----------|
| In Phase 8 fixen (Empfohlen) | Roadmap-konform: „Fail geklärt = Test-Bug behoben ODER App-Bug gefixt"; Bugfixes verhaltensneutral im Sinne der Milestone-Leitplanke | ✓ |
| Kleine Fixes ja, tiefe deferren | Tiefe Fixes (Undo, Render-Registry) dokumentieren + Folgephase; Risiko: nicht 0 Fails | |
| Nur dokumentieren | Reine Test-Phase, App-Bugs in Backlog; widerspricht Success Criterion 1 | |

**User's choice:** In Phase 8 fixen

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, je App-Bug ein Test (Empfohlen) | Bestehender Test prüft Symptom, gezielter Test die Root-Cause (Unit wo möglich) | ✓ |
| Bestehender Test reicht | Der reparierte E2E-Test ist der Regressionstest | |
| Claude entscheidet je Fall | Pro Bug entscheiden | |

**User's choice:** Ja, je App-Bug ein gezielter Regressionstest

---

## CI-Gate-Umfang

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, blockierend aktivieren (Empfohlen) | Eigener CI-Job: build:dev + npx playwright test (Chromium, Artefakte bei Fail); SC5 wird bewiesen | ✓ |
| Non-blocking CI-Job | continue-on-error als Beobachtungsphase, Schärfung in Phase 11 | |
| Nur lokal, CI in Phase 11 | ci.yml unberührt, Aktivierung mit ARCH-03 | |

**User's choice:** Ja, blockierend aktivieren

---

## Härtungs-Reichweite

| Option | Description | Selected |
|--------|-------------|----------|
| Ganze Suite systematisch (Empfohlen) | Inventar aller Zähl-Assertions (Jest + Playwright), härten wo exakter Wert erwartbar | ✓ |
| Nur betroffene Specs | Nur die 11 Fail-Specs + berührte Helper | |

**User's choice:** Ganze Suite systematisch

| Option | Description | Selected |
|--------|-------------|----------|
| Nur in angefassten Specs (Empfohlen) | waitForTimeout opportunistisch ersetzen, kein Flächenumbau stabiler Specs | ✓ |
| Flächendeckend ersetzen | Alle fixen Wartezeiten der Suite; gründlicher, höheres Flaking-Risiko | |
| Nicht anfassen | Strikt beim TEST-02-Wortlaut bleiben | |

**User's choice:** Nur in angefassten Specs

| Option | Description | Selected |
|--------|-------------|----------|
| Kriterium statt Pauschale (Empfohlen) | page.evaluate verboten wenn es den geprüften Interaktionspfad ersetzt; erlaubt als dokumentiertes Setup-Vehikel; Bestand einzeln bewerten | ✓ |
| Alle auf echte UI-Klicks umbauen | Konsequent, aber Pointer-Interception-Probleme kommen zurück | |
| Alle Ausnahmen pauschal behalten | Nur neue Dispatches verhindern | |

**User's choice:** Kriterium statt Pauschale

---

## Doku-Form

| Option | Description | Selected |
|--------|-------------|----------|
| Triage-Doku fortschreiben (Empfohlen) | docs/e2e-failure-triage.md: je Fail Klassifikation, Fix, Commit-Hash | ✓ |
| Neues Abschlussdokument | docs/e2e-fixes-v1.1.md, alte Triage als Archiv | |
| Nur SUMMARY/Commits | Keine Repo-Doku | |

**User's choice:** Triage-Doku fortschreiben

---

## Claude's Discretion

- Arbeits-Reihenfolge (Fails fixen vs. Härtung, sequenziell oder verschränkt)
- CI-Job-Konfigurationsdetails (Timeouts/Retries/Worker auf Basis playwright.config.js)
- Erhebungsmethode des Assertion-Inventars
- Format der Triage-Fortschreibung (Tabelle vs. Abschnitte)
- Relevanzprüfung Undo-nach-Delete-Verdacht (CONCERNS.md Cluster 4)

## Deferred Ideas

None — Diskussion blieb im Phasen-Scope.
