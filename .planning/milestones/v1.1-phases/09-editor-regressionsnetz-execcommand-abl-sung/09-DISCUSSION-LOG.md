# Phase 9: Editor-Regressionsnetz & execCommand-Ablösung - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 9-Editor-Regressionsnetz & execCommand-Ablösung
**Areas discussed:** Editor-Undo (Strg+Z), Markup-Kompatibilität, Regressionsnetz-Prüftiefe, Migrations-Strategie

---

## Bereichsauswahl

Vorgeschlagen: Editor-Undo (Strg+Z im Text), Markup-Kompatibilität, Regressionsnetz-Prüftiefe, Migrations-Strategie.
**User's choice:** Alle vier Bereiche ausgewählt.

---

## Editor-Undo (Strg+Z im Text)

Befund vorab (Code-Scout): `systems/spellslots/keyboard-shortcuts.js:66` fängt Strg+Z „immer aktiv" ab (`preventDefault()` + App-Undo) — natives Text-Undo per Tastatur existiert im Editor schon heute nicht.

| Option | Description | Selected |
|--------|-------------|----------|
| Status quo festschreiben (Recommended) | Strg+Z bleibt App-Undo, Text-Undo im Editor ist explizit KEIN Ziel; Netz dokumentiert die Baseline | ✓ |
| Eigenen Text-Undo einführen | Editor-Fokus: Strg+Z macht Textschritte rückgängig (eigener Stack) — Verhaltensänderung gegen v1.1-Leitplanke + Mehraufwand | |
| Text-Undo als Deferred Idea | Status quo jetzt, Idee für späteren Milestone notieren | |

**User's choice:** Status quo festschreiben.
**Notes:** Konsequenz akzeptiert: Kontextmenü-Undo wirkt nach Migration nicht mehr auf Formatierungen (ersatzlos). Editor-Text-Undo wurde zusätzlich als Deferred Idea in CONTEXT.md festgehalten.

---

## Markup-Kompatibilität

| Option | Description | Selected |
|--------|-------------|----------|
| Identisches Markup (Recommended) | Exakt die Chromium-execCommand-Tags (`<b>`, `<font>`, `<div>` …); Netz beweist Identität, sanitizeHTML/CSS unangetastet, Alt/Neu ununterscheidbar | ✓ |
| Modernes Markup (semantisch gleich) | `<strong>`/`<em>`/`<span style>`; sauberer Standard, aber Mischdokumente, Whitelist-/CSS-Erweiterung, Toggle-Erkennung × 2 Formen | |
| Du entscheidest | Claude wählt nach technischer Abwägung in Research/Planung | |

**User's choice:** Identisches Markup.

---

## Regressionsnetz-Prüftiefe

### Teilfrage 1: Prüfebene

| Option | Description | Selected |
|--------|-------------|----------|
| Markup + Roundtrip (Recommended) | DOM-Assertion nach Aktion PLUS formatieren→speichern→neu laden→intakt (deckt sanitizeHTML-Pipeline) | ✓ |
| Nur Markup direkt | Schlanker/schneller, aber blind für Speicher-/Sanitize-Pipeline | |
| Du entscheidest | Claude legt Prüftiefe fest | |

**User's choice:** Markup + Roundtrip.

### Teilfrage 2: Abdeckungsbreite

| Option | Description | Selected |
|--------|-------------|----------|
| Referenz-Editor + Smoke je Editor (Recommended) | Wiki vollständig (alle Formatgruppen × beide Toolbars), je weiterer Editor ein Smoke-Test | ✓ |
| Vollmatrix | Jede Formatierung × jeder Editor × beide Toolbars — redundant (geteilte Engine), langsame Suite | |
| Du entscheidest | Claude legt Matrix fest | |

**User's choice:** Referenz-Editor + Smoke je Editor.

---

## Migrations-Strategie

| Option | Description | Selected |
|--------|-------------|----------|
| Inkrementell je Gruppe, kein Fallback (Recommended) | Kommandogruppen, Netz nach jeder Gruppe grün, atomare Commits, Rollback via Git-Revert | ✓ |
| Big-Bang hinter grünem Netz | Alles in einem Zug; Fehlersuche über alle 21 Stellen gleichzeitig | |
| Mit temporärem execCommand-Fallback | Laufzeit-Flag mit Doppel-Codepfaden; EDIT-01 erst nach Flag-Entfernung erfüllt | |

**User's choice:** Inkrementell je Gruppe, kein Fallback.

---

## Claude's Discretion

- Exakte Gruppenaufteilung/Reihenfolge der Migration
- Range/Selection-Technik je Kommando (solange Markup identisch)
- Testdatei-Organisation des Netzes und Gestalt der Smoke-Tests
- Umgang mit `defaultParagraphSeparator`-Setup-Call
- `insertHTML`-Ersatztechnik

## Deferred Ideas

- Editor-Text-Undo (eigener Undo-Stack, Strg+Z im Editor-Fokus) — späterer Milestone
