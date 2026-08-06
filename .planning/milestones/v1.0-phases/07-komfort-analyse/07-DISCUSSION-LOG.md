# Phase 7: Komfort & Analyse - Discussion Log

> **Nur Audit-Trail.** Nicht als Input für Planung/Research/Execution nutzen.
> Entscheidungen stehen in CONTEXT.md — dieses Log bewahrt die erwogenen Alternativen.

**Date:** 2026-06-19
**Phase:** 7-komfort-analyse
**Areas discussed:** Soundboard Datei-Persistenz, Soundboard Szenen & Layering, Soundboard Schnelltasten, Statistiken Datenquelle/Umfang, Statistiken Darstellung

> Hinweis: Die AskUserQuestion-Auswahl scheiterte an einem Tool-Fehler (permission stream closed). Diskussion wurde im Klartext fortgeführt: Claude legte für jeden Graubereich eine begründete Empfehlung mit Alternative vor, der Nutzer bestätigte mit „machen wir weiter mit 7" (= passt so).

---

## Soundboard — Datei-Persistenz

| Option | Description | Selected |
|--------|-------------|----------|
| IndexedDB-Blob-Store | Audio als Blobs in eigenem IDB-Store, überlebt Reload, offline-tauglich (kein File System API) | ✓ |
| Re-Auswahl pro Session | Dateien jede Session neu wählen, Merkliste der Dateinamen | |

**User's choice:** IndexedDB-Blob-Store (D-01) mit Größen-Warnung + Bibliotheks-Verwaltung
**Notes:** Begründet über Kernwert „offline am Spieltisch, keine Datenverluste"; Re-Auswahl wäre am Tisch untauglich. Eigener Store, nie in `D`/Exporten.

---

## Soundboard — Szenen & Layering

| Option | Description | Selected |
|--------|-------------|----------|
| Geschichtete Szenen | Mehrere gleichzeitige Loops je Szene, eigene Lautstärke, Crossfade | ✓ |
| MVP: eine Loop/Szene | Eine Loop pro Szene, harter Schnitt | (Rückfallebene) |

**User's choice:** Geschichtete Szenen + Crossfade + Loop default (D-02)
**Notes:** MVP-Variante als dokumentierte Vereinfachungsoption (D-02a) hinterlegt, falls Umfang zu groß.

---

## Soundboard — Schnelltasten

| Option | Description | Selected |
|--------|-------------|----------|
| Quick-Slots mit freien Tasten | Szenen per Tastatur umschalten, Konflikt mit bestehenden Shortcuts vermeiden | ✓ |

**User's choice:** Quick-Slots, Belegung an Researcher/Planner (D-03)
**Notes:** Muss bestehende Shortcuts (1–9, R/T/L/N/P, Space, `/`, Strg-Kombis) meiden.

---

## Statistiken — Datenquelle & Umfang

| Option | Description | Selected |
|--------|-------------|----------|
| Persistenter IDB-Store, alle Würfe | Über Sessions, Hook in addToDiceHistory, alle Typen, d20 primär | ✓ |
| Nur aktuelle Session | In-Memory diceHistory, kein Persistenz-Store | |

**User's choice:** Persistenter IndexedDB-Roll-Store über Sessions (D-04)
**Notes:** diceHistory ist aktuell nur In-Memory → zu dünne Datenbasis für Crit-Quoten. Zentraler Hook in addToDiceHistory erfasst alle Wurf-Pfade.

---

## Statistiken — Darstellung

| Option | Description | Selected |
|--------|-------------|----------|
| Histogramm + Overlay + Pro-Charakter | d20-Histogramm, Erwartungs-Overlay, Crit/Patzer-Quote, gesamt + pro Charakter, Session/Gesamt-Filter | ✓ |
| Nur Gesamtansicht | Histogramm ohne Pro-Charakter-Aufschlüsselung | |

**User's choice:** Histogramm + Erwartungs-Overlay + Crit/Patzer-Quote + Pro-Charakter (wo zuordenbar) + Filter (D-05)
**Notes:** Nicht zuordenbare Würfe (Dice-Tab/Quick-Rolls) laufen unter „Allgemein".

## Claude's Discretion

- Konkrete Schnelltasten-Belegung, IDB-Schema-Details, Crossfade-Dauer, Histogramm-Render-Technik, Lautstärke-UI-Form.

## Deferred Ideas

- Audio-Effekt-Trigger an Spielereignisse (z.B. Auto-Sound bei Crit) — eigene Phase/Backlog.
- Würfel-Statistiken exportieren/teilen — eigene Phase/Backlog.
