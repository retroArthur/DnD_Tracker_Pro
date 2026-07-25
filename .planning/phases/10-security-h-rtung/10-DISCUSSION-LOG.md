# Phase 10: Security-Härtung - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-25
**Phase:** 10-Security-Härtung
**Areas discussed:** Fix-Ort des Import-XSS, Scope der Beifang-Findings, Audit-Zuschnitt (SECURITY.md), Regressionstest-Design

---

## Fix-Ort des Import-XSS

| Option | Description | Selected |
|--------|-------------|----------|
| Beides: Import + Anzeige | Defense-in-Depth wie im Review empfohlen: Import sanitisiert HTML-tragende Felder, renderMarkdownInContent() sanitisiert am Ende | ✓ |
| Nur Anzeige-Grenze | Minimal-invasiv, importierte Daten bleiben roh im Storage | |
| Nur Import-Grenze | Storage garantiert sauber, aber Altdaten und künftige Import-Pfade ungeschützt | |

**User's choice:** Beides: Import + Anzeige (Defense-in-Depth)

| Option | Description | Selected |
|--------|-------------|----------|
| HTML-Felder per Render-Pfad-Audit | Researcher leitet Feldliste aus tatsächlichen innerHTML-Pfaden ab | ✓ |
| Alle String-Felder rekursiv | Maximal sicher, aber Risiko für Nicht-HTML-Daten (Formeln, Namen) | |
| Nur die Review-Minimal-Liste | content/description/traits/actions ohne Audit | |

**User's choice:** HTML-Felder per Render-Pfad-Audit

| Option | Description | Selected |
|--------|-------------|----------|
| Keine Migration | Anzeige-Grenze neutralisiert Altdaten beim Rendern | ✓ |
| Einmalige Storage-Migration | Bestand einmalig säubern — Mutations-Risiko | |
| Lazy beim nächsten Speichern | Storage bleibt lange gemischt | |

**User's choice:** Keine Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Still säubern | Kommentarlos übernehmen, maximal verhaltensneutral | ✓ |
| Event-Log-Hinweis | Info-Eintrag bei tatsächlicher Säuberung | |
| Warnung mit Bestätigung | Import pausiert, DM bestätigt | |

**User's choice:** Still säubern

---

## Scope der Beifang-Findings

| Option | Description | Selected |
|--------|-------------|----------|
| In Phase 10 fixen | on*-Attribute im Tabellen-Zweig strippen, Ledger auf fixed, /gsd-ship frei | ✓ |
| Waiven mit Begründung | XSS bliebe im Produkt | |
| Auf Phase 11 verschieben | SEC-02-Kriterium kaum erfüllbar | |

**User's choice (Broken-Windows #1 Paste-XSS):** In Phase 10 fixen

| Option | Description | Selected |
|--------|-------------|----------|
| Whitelist-Fix in Phase 10 | `<strike>` in sanitizeHTML aufnehmen (beide Zwillinge), Netz-Test begründet anpassen | ✓ |
| Eingefroren lassen | Datenverlust-Bug bleibt, nur Audit-Vermerk | |
| Editor auf `<s>` umstellen | Bricht Phase-9-Markup-Identität (D-02) | |

**User's choice (`<strike>`-Whitelist):** Whitelist-Fix in Phase 10

| Option | Description | Selected |
|--------|-------------|----------|
| In Phase 10 fixen | saveUndoState() + createAutoBackup() nach executeImport()-Muster | ✓ |
| Nur im Audit vermerken | Fix bleibt für später | |
| Out of Scope | Posten versandet | |

**User's choice (WR-03):** In Phase 10 fixen

| Option | Description | Selected |
|--------|-------------|----------|
| Audit-Vermerk, akzeptiert | Beide als bewusst akzeptierte Risiken mit Begründung dokumentieren | ✓ |
| CSP-Meta-Tag einführen | Testaufwand file:// + PWA/SW | |
| Beides härten | CSP + class-Präfix-Whitelist — Leitplanken-Risiko | |

**User's choice (CSP + class/style):** Audit-Vermerk, akzeptiert

---

## Audit-Zuschnitt (SECURITY.md)

| Option | Description | Selected |
|--------|-------------|----------|
| Angriffsflächen-getrieben: 1, 2, 9, 10 | Genau die Phasen der vier kritischen Flächen | ✓ |
| Alle bisherigen Phasen (1–9) | Viel Aufwand ohne Erkenntnisgewinn | |
| Nur Phase 1 | Erfüllt SEC-02 nicht (Editor-Implementierung fehlt) | |

**User's choice:** Angriffsflächen-getrieben: Phasen 1, 2, 9, 10

| Option | Description | Selected |
|--------|-------------|----------|
| Konsolidiert im Repo-Root | EINE SECURITY.md als Gesamtbilanz (GitHub-Konvention), per-Phase-Artefakte in .planning/ | ✓ |
| Nur per-Phase in .planning/ | Verstreute Dateien, Kriterium schwer prüfbar | |
| Konsolidiert in .planning/ | Ohne öffentliche Sichtbarkeit | |

**User's choice:** Konsolidiert im Repo-Root

| Option | Description | Selected |
|--------|-------------|----------|
| Fixes zuerst, Audit als Abschluss-Gate | Audit dokumentiert den finalen Stand | ✓ |
| Audit zuerst, dann fixen | Zwei Audit-Durchläufe | |
| Iterativ je Angriffsfläche | Vier kleine Zyklen, Koordinations-Overhead | |

**User's choice:** Fixes zuerst, Audit als Abschluss-Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Triage nach Schwere | Critical/High in Phase 10 fixen, Low/Info begründet akzeptieren | ✓ |
| Alles fixen bis 0 | Phase kann unkontrolliert wachsen | |
| Checkpoint bei dir | Unterbricht den autonomen Lauf | |

**User's choice:** Triage nach Schwere

---

## Regressionstest-Design

Ab der ersten Frage dieses Bereichs bat der Nutzer, die Claude-Empfehlungen anzuwenden („fahre fort und wende auch in den nächsten Fragen deine Empfehlung an"):

| Frage | Angewandte Empfehlung |
|-------|----------------------|
| Testebene | E2E + Unit kombiniert (E2E: Import-Datei → kein Script-Execute im CI-Job; Unit: Payload-Vektoren feingranular) |
| Echte Sanitizer | Neue Security-Tests laden `utils/basic.js` via vm.runInContext (Präzedenz storage-conflict.test.js) + Paritäts-Test testable-utils ↔ basic.js |
| Vektor-Katalog | Kuratiert: Review-Exploit, javascript:-URLs, `<script>`, SVG-Handler, T-09-01-Tabellen-Payload |
| Paste-XSS-Test | Im bestehenden Editor-Netz (editor-insert.spec.js neben T-09-01), T-09-01-Anpassung dokumentiert begründet |

---

## Claude's Discretion

- Exakte technische Umsetzung der Sanitisierungs-Aufrufe (Ort im Import-Flow, Helper-Extraktion)
- Vektor-Katalog-Zusammensetzung über die Pflicht-Vektoren hinaus
- SECURITY.md-Struktur/Format, solange `threats_open: 0` und die vier Flächen auditierbar sind
- Plan-/Wellen-Aufteilung der Fixes

## Deferred Ideas

- CSP-Meta-Tag + class-Präfix-Whitelist (akzeptierte Risiken, späterer Milestone falls Nutzungsmodell sich ändert)
- Drei verbleibende execCommand-Call-Sites außerhalb des Editors (Kandidat Phase 11 / später)
