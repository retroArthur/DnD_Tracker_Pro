# Phase 1: Stabilisierung - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 01-stabilisierung
**Areas discussed:** Persistenz-Fix >5MB, Mindmap-Altdaten, Doku- & Lizenz-Audit
**Areas offered but not selected:** CI-Smoke-Test-Umfang (→ Claude's Discretion)

---

## Persistenz-Fix >5MB

### Fix-Strategie Stale-Shadow-Bug

| Option | Description | Selected |
|--------|-------------|----------|
| Timestamp-Vergleich | Beide Speicher tragen Zeitstempel; beim Laden gewinnt der neueste Stand. Redundanz bleibt, betroffene Kampagnen selbstheilend | ✓ |
| LS-Key beim IDB-Save löschen | Einfachster Fix, aber kein LS-Fallback mehr für große Kampagnen | |
| Marker in LocalStorage | LS-Eintrag wird durch Verweis ersetzt; kein echter Fallback, Migrationslogik nötig | |

### Feedback bei Wechsel in IDB-only-Modus

| Option | Description | Selected |
|--------|-------------|----------|
| Event-Log-Hinweis | Einmaliger Hinweis im Event-Log beim Umschalten; 4-MB-Warnung bleibt | ✓ |
| Dauerhafter Indikator | Symbol im Header/Speicherstatus solange IDB-only aktiv | |
| Kein zusätzliches Feedback | Nur bestehende 4-MB-Warnung | |

**Notes:** Der bestehende Per-Save-Erfolgs-Toast („Große Kampagne in IndexedDB gespeichert") wird in den einmaligen Hinweis konsolidiert.

### Verhalten bei IDB-Schreibfehler

| Option | Description | Selected |
|--------|-------------|----------|
| Toast + Export-Aufforderung | Deutliche Warnung mit direktem Export-Hinweis | ✓ |
| Retry, dann Warnung | Erst stiller Wiederholungsversuch | |
| Nur Event-Log-Eintrag | Risiko: Nutzer übersieht Datenverlust-Pfad | |

### Automatisierter Regressionstest

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, Unit-Test | Jest Save/Load-Roundtrip >5MB mit gemocktem Storage | ✓ |
| Unit + E2E | Zusätzlich Playwright mit echtem Browser-Storage | |
| Nur manuell testen | Kein automatisierter Test | |

### Alte Exporte mit `_version: '2.11'`

| Option | Description | Selected |
|--------|-------------|----------|
| Als Altformat erkennen | '2.11' wird als Legacy-Stempel erkannt → Migrationen laufen | ✓ |
| Import-Warnung anzeigen | Nutzer bestätigt Import manuell | |
| Nicht speziell behandeln | Alte Dateien überspringen Migrationen weiterhin | |

### App-Version

| Option | Description | Selected |
|--------|-------------|----------|
| Patch-Bump auf 2.6.1 | APP_CONFIG.VERSION + package.json synchron | ✓ |
| Minor-Bump auf 2.7.0 | Sichtbarer Versionsschnitt | |
| Bleibt 2.6.0 | Nur Export-Stempel korrigieren | |

### Erstlade-Konflikt (LS ohne Timestamp vs. IDB mit Timestamp, Inhalte differieren)

| Option | Description | Selected |
|--------|-------------|----------|
| Einmaliger Auswahl-Dialog | Zeigt beide Stände (Größe, IDB-Datum), Nutzer wählt; erscheint nur einmal | ✓ |
| IndexedDB bevorzugen | Stille Sofort-Reparatur; Restrisiko bei geschrumpften Kampagnen | |
| LocalStorage bevorzugen | Gefährlich: Bug-Fall überschreibt neuere IDB-Daten endgültig | |

### 4-MB-Warnung Frequenz

| Option | Description | Selected |
|--------|-------------|----------|
| Einmal pro Sitzung | Erster Toast pro Sitzung, danach Event-Log | ✓ |
| Bei jedem Speichern (Status quo) | Toast-Spam bei Auto-Saves im 4–5-MB-Fenster | |
| Nur noch Event-Log | Kein Toast | |

---

## Mindmap-Altdaten

### D.mindmap in bestehenden Speicherständen/Exporten

| Option | Description | Selected |
|--------|-------------|----------|
| Smart strippen | Leere Keys still entfernen; bei echten Inhalten einmaliger Hinweis mit Export-Angebot | ✓ |
| Immer still strippen | Kompromisslos; alte Inhalte endgültig weg | |
| Mitschleppen (Status quo) | Nichts geht verloren, toter Ballast bleibt (zählt in 5-MB-Größe) | |

### tools/debug.js (Boot-Crash-Datei, 1.109 Zeilen, in dev+prod gebündelt)

| Option | Description | Selected |
|--------|-------------|----------|
| Nur reparieren | Tote Mindmap-Referenzen raus, bleibt in beiden Bundles | ✓ |
| Reparieren + nur Dev-Build | Zusätzlich Dev-only-Module in build.py | |
| Komplett entfernen | Debug-Werkzeug ganz löschen | |

### Export-Format beim Smart-Strip

| Option | Description | Selected |
|--------|-------------|----------|
| Eigene JSON-Datei | mindmap-backup-{kampagne}.json mit nodes/connections | ✓ |
| Voll-Export der Kampagne | Bestehender Export-Flow vor dem Strippen | |
| Kein Export, nur Info | Nur Anzeige + Bestätigung | |

### Veraltete Python-Tools (STAB-09)

| Option | Description | Selected |
|--------|-------------|----------|
| Löschen + validate.py reparieren | analyze-render.py, migrate-event-handlers.py, split-shops.py, purge-css.py löschen; validate.py mit skript-relativen Pfaden | ✓ |
| Alle reparieren und behalten | Aufwand fraglich, Migrationen abgeschlossen | |
| Alle löschen | Auch validate.py + npm run validate entfernen | |

**Notes (Befund, keine Frage):** `assets/styles-purged.css` wird gelöscht — kein Verweis in build.py, loader.js oder index.html.

---

## Doku- & Lizenz-Audit

### CLAUDE.md-Audit-Tiefe (1.715 Zeilen)

| Option | Description | Selected |
|--------|-------------|----------|
| Faktenkorrektur | Alle falschen Aussagen korrigieren, Struktur und historische Kapitel bleiben | ✓ |
| Korrektur + Verschlankung | Zusätzlich historische Kapitel nach docs/ auslagern | |
| Nur Mindmap & grobe Fehler | Minimal | |

### execCommand-Konvention vs. 21+ reale Call-Sites

| Option | Description | Selected |
|--------|-------------|----------|
| An Realität anpassen | Doku beschreibt Ist-Zustand, Ablösung als Tech-Debt dokumentiert | ✓ |
| Als Soll-Ziel behalten | Konvention bleibt mit Verletzungs-Hinweis | |

### SRD-Zaubertexte-Audit Ergebnis-Handling (Repo öffentlich auf GitHub)

| Option | Description | Selected |
|--------|-------------|----------|
| Dokumentieren + Attribution | Befund in docs/, CC-BY-Attribution in README/LICENSE ergänzen; hartes Risiko wird eskaliert | ✓ |
| Bei Risiko sofort handeln | Texte noch in dieser Phase ersetzen/entfernen | |
| Nur intern dokumentieren | Keine öffentlichen Lizenz-Hinweise | |

---

## Claude's Discretion

- CI-Smoke-Test-Umfang (STAB-08): Boot-Check vs. Tab-Sweep, dist-Build in CI — Bereich bewusst nicht zur Diskussion gewählt
- build.py-Härtungs-Ansatz (STAB-07): Pass-3-Fix vs. Pre-Build-Check, Sync-Check-Umsetzung
- Tote Dateien (main.js, tsconfig.json.backup, MIGRATION_REPORT.md), `python3`→`python` in npm-Scripts
- LS-Timestamp-Mechanik, Dialog-Gestaltung, exakte Hinweis-Texte

## Deferred Ideas

- execCommand-Ablösung im Rich-Text-Editor (21+ Call-Sites) — eigene Phase
- CLAUDE.md-Verschlankung (historische Kapitel auslagern)
- debug.js aus dem Production-Build (Dev-only-Module in build.py)
