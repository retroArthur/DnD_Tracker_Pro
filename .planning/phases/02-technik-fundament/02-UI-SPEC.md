---
phase: 2
slug: technik-fundament
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-12
---

# Phase 2 — UI Design Contract: Technik-Fundament

> Visueller und interaktiver Vertrag für Phase 2 (PWA, Datenmigration, Datei-Backup, Command Palette).
> Erzeugt von gsd-ui-researcher, verifiziert von gsd-ui-checker.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — bestehende CSS-Custom-Properties + BEM-lite |
| Preset | nicht zutreffend (kein shadcn; Vanilla-JS/HTML, kein React) |
| Component library | keine — bestehende `.modal-overlay`/`.modal`-Muster aus `assets/styles/dashboard.css` |
| Icon library | Unicode-Zeichen + Emojis (bestehendes Muster des Projekts) |
| Font | Roboto 400/700 (gebündelt per D-07); Fallback: system-ui, sans-serif |

**Quelle:** CONTEXT.md D-07, Codebase-Scan (`assets/styles/variables.css`, `assets/styles/dashboard.css`)

---

## Spacing Scale

Alle Abstände folgen dem bestehenden 4-Punkt-Raster des Projekts (`--content-padding: 16px` für Desktop,
`10px` für Mobile laut `variables.css`). Für Phase-2-Komponenten gelten folgende verbindlichen Werte:

| Token | Value | Verwendung |
|-------|-------|-----------|
| xs | 4px | Icon-Lücken, Badge-Innenabstand, Wizard-Schritt-Punkt-Abstände |
| sm | 8px | Zeilenabstand in Ergebnislisten, Drag&Drop-Hinweistext-Gap |
| md | 16px | Standard-Elementabstand, Innenabstand Wizard-Karte, Command-Palette-Input-Padding |
| lg | 24px | Modal-Innenabstand (entspricht bestehendem `.modal { padding: 24px }`), Wizard-Schrittabstand |
| xl | 32px | Abstand zwischen Wizard-Schritten (vertikal), Backup-Browser-Sektionsabstand |
| 2xl | 48px | Wizard-Hero-Bereich vertikaler Einzug |
| 3xl | 64px | nicht genutzt in Phase 2 |

Ausnahmen:
- Touch-Targets (Buttons, klickbare Listenzeilen): Mindesthöhe **44px** (Mobile-Regel aus `variables.css` `--button-padding` + `min-height: 44px`)
- Command-Palette-Ergebniszeilen: Mindesthöhe **48px** (ausreichend Klickfläche auf Touch-Geräten)
- Drag&Drop-Zone im Wizard: Mindesthöhe **120px** (erkennbar als Drop-Bereich)
- Divergenz-Banner: Höhe **40px**, kein Padding-Stack — schmal und nicht aufdringlich
- Update-Hinweis-Leiste: Höhe **40px**, `position: fixed; bottom: 0` — kein Modal

**Quellen:** `assets/styles/variables.css` (Mobile-Profil), `assets/styles/dashboard.css` (`.modal { padding: 24px }`)

---

## Typography

Alle Schriftgrößen folgen den bestehenden CSS-Custom-Properties:
- `--font-size-base: 14px` (Desktop) / `16px` (Mobile)
- `--font-size-small: 12px` (Desktop) / `14px` (Mobile)

Für Phase-2-Komponenten gelten exakt diese vier Rollen:

| Rolle | Größe | Gewicht | Zeilenhöhe | Verwendung |
|-------|-------|---------|-----------|-----------|
| Body | 14px (Desktop) / 16px (Mobile) | 400 (regular) | 1.5 | Fließtext in Wizard-Beschreibungen, Backup-Browser-Zeilen, Command-Palette-Keywords |
| Label | 12px (Desktop) / 14px (Mobile) | 400 (regular) | 1.4 | Metadaten (Datum, Dateigröße im Backup-Browser), Wizard-Schritt-Nummern, Status-Text im Header-Warnindikator |
| Heading | 16px (= `1.2em` relativ zu base) | 600 (semibold) | 1.2 | Wizard-Schrittüberschriften, Modal-Titel (entspricht bestehendem `.modal-title`), Backup-Browser-Abschnittstitel |
| Display | 20px | 600 (semibold) | 1.2 | Wizard-Hauptüberschrift „Willkommen in der D&D Tracker App", Command-Palette-Overlay-Heading |

Schriftgewichte: ausschließlich **400** (regular) und **600** (semibold) — keine weiteren Gewichte einführen.

**Quellen:** `assets/styles/variables.css` (`--font-size-base`, `--font-size-small`), `assets/styles/dashboard.css` (`.modal-title { font-size: 1.2em; font-weight: 600 }`)

---

## Color

Das Projekt hat vier Themes (dark, light, sepia, contrast). Der Vertrag gilt für **Dark (default)** und
muss über CSS-Custom-Properties so geschrieben sein, dass er in allen Themes korrekt funktioniert.

| Rolle | Dark-Wert | CSS-Variable | Verwendung |
|-------|-----------|--------------|-----------|
| Dominant (60%) | `#0d0d0d` | `var(--bg-dark)` | App-Hintergrund, Overlay-Backdrop |
| Secondary (30%) | `#1a1a1a` | `var(--bg-card)` | Modal-Hintergründe, Wizard-Karten, Backup-Browser-Zeilen, Command-Palette-Box |
| Accent (10%) | `#d4af37` | `var(--gold)` | Reserviert für spezifische Elemente — siehe unten |
| Destructive | `#ef4444` | `var(--red)` | Ausschließlich destruktive Aktionen: „Restore"-Bestätigung (Datenüberschreibung), „Backup-Ordner trennen"-Button |

**Accent `var(--gold)` ist reserviert für:**
1. Install-Button-Beschriftung und -Rahmen (D-05)
2. Aktiver Wizard-Schritt-Indikator (aktueller Schritt)
3. Drag&Drop-Zonen-Rahmen im aktiven Hover-/Drag-Zustand
4. Primär-CTA-Buttons im Wizard (Haupt-Aktion je Schritt)
5. Command-Palette-Eingabefeld-Fokusring
6. Hervorgehobenes Ergebniselement in der Command Palette (Tastatur-Fokus)
7. Modal-Titel (bestehendes Muster `.modal-title { color: var(--gold) }`)

**Accent ist NICHT reserviert für:** Standard-Links, sekundäre Buttons, allgemeine Hover-Zustände, Statusmeldungen.

Weitere Farbrollen für Phase-2-UI:
- `var(--yellow)` `#fbbf24`: Update-Hinweis-Leiste Hintergrund (Warn-Kontext ohne Datenverlustrisiko)
- `var(--green)` `#4ade80`: Wizard-Erfolgsbestätigung (Migration erfolgreich), Backup-Status „aktiv"
- `var(--text-dim)` `#888`: Divergenz-Banner-Text, Label-Texte, deaktivierte Zustände
- `var(--border)` `#3a3a3a`: Standard-Trennlinien, nicht-fokussierte Eingaberahmen

**Quellen:** CONTEXT.md D-04 (Icon-Farben), `assets/styles/variables.css` (alle Tokens), `assets/styles/dashboard.css` (`.modal-title` Gold)

---

## Komponenten-Inventar

Alle neuen UI-Elemente dieser Phase. CSS-Klassen folgen dem BEM-lite-Muster mit Feature-Präfix.

### 1. Update-Hinweis-Leiste (D-03)

```
Klasse: .pwa-update-banner
Position: fixed, bottom: 0, left: 0, right: 0; z-index: 1050
Höhe: 40px
Hintergrund: var(--yellow) bei 80% Deckkraft
Text: var(--bg-dark) (Kontrast auf Gelb)
Layout: flex, space-between, align-items center, padding: 0 16px
```

Zustände:
- **Sichtbar:** `display: flex` — sobald SW `updatefound`-Event feuert, einmalig pro Sitzung
- **Verborgen:** `display: none` — Standard; nach Klick auf „Neu laden" oder „Jetzt nicht"

Interaktion: Zwei Buttons — „Neu laden" (Primär, startet `SKIP_WAITING`) und „Jetzt nicht" (schließt Banner für Session). Kein Timeout, kein Auto-Close.

### 2. Install-Button im Header (D-05)

```
Klasse: .pwa-install-btn
Position: innerhalb .header-actions (nach bestehendem Muster)
Aussehen: wie bestehende .header-action-btn — aber mit var(--gold) als Textfarbe und einem 1px var(--gold)-Rahmen
```

Zustände:
- **Sichtbar:** wenn `beforeinstallprompt`-Event abgefangen und App noch nicht installiert
- **Verborgen:** `display: none` — Standard; nach Installation dauerhaft ausgeblendet (`localStorage`-Flag)

Text: „App installieren" (Desktop) / Icon-only mit `title`-Tooltip auf Mobile (`⬇️` o.ä.)

### 3. Migrations-Wizard (D-09)

```
Container: .migration-wizard-overlay (= .modal-overlay + Wizard-spezifische Erweiterung)
Innenbox: .migration-wizard (= .modal, max-width: 560px)
Backdrop: rgba(0,0,0,0.75) — dicker als normales Modal, da wichtige Aktion
```

**Schritte-Indikator:**
```
Klasse: .wizard-steps
Layout: flex, gap: 8px, margin-bottom: 24px
Schritt-Punkt: .wizard-step — 8px Kreis, var(--text-dim)
Aktiver Punkt: .wizard-step.active — var(--gold), leichter Box-Shadow
Abgeschlossener Punkt: .wizard-step.done — var(--green)
```

**Schritt-Inhalte:**

Schritt 1 — Datei öffnen:
- Überschrift (Heading-Rolle): „Schritt 1: Bisherige Tracker-Datei öffnen"
- Beschreibungstext (Body-Rolle): Anleitung in 2–3 Sätzen
- Button (Primär-CTA): „Datei öffnen" (`var(--gold)` Hintergrund, `var(--bg-dark)` Text)

Schritt 2 — Umzugs-Export klicken:
- Überschrift: „Schritt 2: Umzugs-Export erstellen"
- Beschreibungstext: Anleitung
- Button (Primär-CTA): „Export erstellen und herunterladen"

Schritt 3 — Datei hierher ziehen:
- Überschrift: „Schritt 3: Export-Datei hierher ziehen"
- **Drag&Drop-Zone:** `.wizard-dropzone` — gestrichelter 2px-Rahmen `var(--border)`, Mindesthöhe 120px, border-radius 8px, zentrierter Hinweistext
- **Drag-aktiv-Zustand:** `.wizard-dropzone.dragover` — Rahmen `var(--gold)`, Hintergrund `rgba(212,175,55,0.08)`
- **Datei-ausgewählt-Zustand:** `.wizard-dropzone.file-ready` — Rahmen `var(--green)`, zeigt Dateiname an
- Alternativ-Link: „oder Datei auswählen" (Standard `<input type="file">`)

Schritt 4 — Erfolgsbestätigung:
- Icon: Checkmark in `var(--green)`, 32px
- Überschrift: „Umzug erfolgreich!"
- Metadaten-Zeilen (Label-Rolle): Anzahl Kampagnen, Gesamtgröße
- Button (Primär-CTA): „Fertig — App nutzen"
- Optionaler Folgeschritt: „Automatische Datei-Backups jetzt einrichten" (sekundärer Button, öffnet Backup-Setup)

**Überspringen-Button:** text-only, `var(--text-dim)`, immer sichtbar unten rechts im Wizard.
**Schließen-Button:** nur im letzten Schritt als ✕ oben rechts.

### 4. Einmaliger Umzugs-Hinweis in file://-App (D-10)

```
Klasse: .migration-hint-banner
Position: fixed, top: 0 (unterhalb Header), width: 100%; z-index: 990
Höhe: auto, min 48px
Hintergrund: var(--bg-elevated)
Rahmen-unten: 1px solid var(--gold) bei 40% Deckkraft
```

Nur einmal pro Sitzung — danach `sessionStorage`-Flag. Text und CTA siehe Copywriting-Abschnitt.

### 5. Divergenz-Banner (D-11) — nur in file://-App nach Umzug

```
Klasse: .divergence-banner
Position: fixed, top: [Header-Höhe], width: 100%; z-index: 989
Höhe: 40px
Hintergrund: var(--bg-elevated)
Linker Rand (border-left): 4px solid var(--yellow)
Text: var(--text-dim), 12px (Label-Rolle)
```

Zustände:
- **Sichtbar:** Dauerhaft nach Umzugs-Export, bis Nutzer „Nicht mehr zeigen" klickt
- **Verborgen:** Nach `localStorage`-Flag gesetzt

Interaktion: Einziger Button „Nicht mehr anzeigen" (text-only, `var(--text-dim)`).

### 6. Backup-Status in Einstellungen (D-17)

```
Klasse: .backup-status-section (innerhalb bestehender Einstellungs-Ansicht)
```

Zustände mit visueller Darstellung:
- **Aktiv:** grüner Punkt (8px, `var(--green)`) + Text „Letztes Backup: {Uhrzeit}, Ordner: {Name}" (Label-Rolle)
- **Pausiert (Fehler):** gelber Punkt (`var(--yellow)`) + Text „Datei-Backup pausiert — Ordner nicht erreichbar" + Button „Ordner wieder verbinden"
- **Nicht eingerichtet:** kein Punkt + Text „Kein Datei-Backup eingerichtet" + Button „Ordner wählen"

Button-Stil in allen Fällen: sekundärer Button (`.btn .btn-sm`), kein Gold — keine Primärpriorität.

### 7. Header-Warnindikator bei Backup-Problemen (D-17)

```
Klasse: .backup-warning-indicator
Position: innerhalb .header-actions, nach .save-indicator
Aussehen: kleines Icon ⚠️ + „Backup" in var(--yellow), font-size: 12px
```

Zustände:
- **Verborgen:** `display: none` — Standard (kein Problem)
- **Sichtbar:** `display: flex` — nur bei Backup-Fehler/-Pause. Tooltip: vollständige Fehlermeldung.

Klick öffnet direkt Einstellungen-Tab auf Backup-Bereich.

### 8. file://-Fallback Backup-Status (D-18)

```
Klasse: .file-backup-fallback (in Datei-Tab oder Einstellungen)
```

Enthält:
- Status-Text: „Kein automatisches Backup — file://-Modus" (Label, `var(--text-dim)`)
- Download-Button: „Backup jetzt herunterladen" (sekundärer Button, immer sichtbar)

Einmalige Sitzungs-Erinnerung bei ungesicherter Änderung: als normaler Toast via `showToast()` — kein neues Muster.

### 9. Backup-Browser / Restore-Liste (D-14)

```
Klasse: .backup-browser-modal (= .modal-overlay + .modal, max-width: 600px)
```

Listen-Zeile `.backup-entry`:
```
Layout: grid, columns: [Kampagnenname 1fr] [Datum 120px] [Größe 80px] [Restore-Button 100px]
Höhe: 44px (Touch-Target)
Hover: var(--bg-hover)
Rahmen-unten: 1px solid var(--border)
```

- Kampagnenname: Body-Rolle, `var(--text)`
- Datum: Label-Rolle, `var(--text-dim)`
- Dateigröße: Label-Rolle, `var(--text-dim)`
- Restore-Button: `.btn .btn-sm` mit `var(--red)` Outline-Stil (destruktiv, aber nicht solid rot — erst im Bestätigungsdialog)

Bestätigungsdialog (erscheint über Backup-Browser):
- Zweites kleines Modal (max-width: 380px), erscheint über dem Backup-Browser
- Überschrift: „Kampagne wiederherstellen?" (Heading-Rolle, `var(--red)`)
- Text: „[Kampagnenname] wird auf den Stand vom [Datum] zurückgesetzt. Dieser Vorgang kann rückgängig gemacht werden (Strg+Z)."
- Buttons: „Wiederherstellen" (`var(--red)` solid) und „Abbrechen" (sekundär)

### 10. Command Palette (TECH-04 — Claude's Discretion)

**Design-Entscheidung:** Die Command Palette ist konzeptuell verwandt mit der bestehenden Global Search (`systems/search/global-search.js`), aber funktional getrennt — sie findet **Aktionen**, nicht **Entitäten**. Visuell lehnt sie sich ans gleiche Modal-Vokabular an, ist aber als zentriertes Top-Overlay platziert (nicht in der Header-Leiste).

```
Klasse: .cp-overlay (eigene Overlay-Ebene, z-index: 1200 — über allen Modals)
Backdrop: rgba(0,0,0,0.6), backdrop-filter: blur(4px)
Box: .cp-box — max-width: 560px, width: 90%, background: var(--bg-card), border: 1px solid rgba(212,175,55,0.3), border-radius: 12px, box-shadow: 0 16px 48px rgba(0,0,0,0.6)
Position der Box: top: 20vh (nicht mittig — Augen wandern oben hin beim Tastaturaufruf)
```

**Input-Bereich:**
```
Klasse: .cp-input-row
Padding: 12px 16px
Layout: flex, gap: 8px, align-items: center
Icon: 🔍 (16px, var(--text-dim))
Input: .cp-input — width: 100%, border: none, background: transparent, font-size: 16px (immer, auch Desktop), color: var(--text), outline: none
```

Fokusring: `border-bottom: 2px solid var(--gold)` auf `.cp-input-row` (nicht auf dem Input selbst)

**Ergebnisliste:**
```
Klasse: .cp-results
Max-Height: 360px
Overflow-Y: auto
Trennlinie oben: 1px solid var(--border)
```

Ergebnis-Zeile `.cp-result`:
```
Padding: 12px 16px
Höhe: 48px
Cursor: pointer
Layout: flex, align-items: center, gap: 12px
```
- Icon/Emoji (20px Breite): Aktions-Icon
- Label (Body-Rolle, `var(--text)`): Aktionsname
- Shortcut-Hint (Label-Rolle, `var(--text-dim)`, `font-size: 11px`, marginLeft: auto): ggf. Shortcut

**Zustände:**
- `.cp-result.focused` (Tastatur-Fokus): `background: var(--bg-elevated)`, `border-left: 2px solid var(--gold)`
- `.cp-result:hover`: `background: var(--bg-hover)` (ohne Gold-Rahmen)
- Leer (keine Ergebnisse): `.cp-empty` — zentrierter Text „Keine Aktion gefunden" (`var(--text-dim)`, Label-Rolle)
- Standard-Zustand (kein Query): 8 Top-Aktionen aus Registry, ohne Score-Filterung

**Shortcut-Entscheidung:** `Strg+Shift+K` — Begründung: `Strg+K` ist durch Global Search belegt (`systems/spellslots/keyboard-shortcuts.js:59`); `Strg+P` blockiert Browser-Drucken; `Strg+Shift+K` ist in Chrome/Edge-Normal-Tab unbelegt und im PWA-Standalone-Modus definitiv frei. Shortcut-Audit in Smoke-Test verifizieren.

**Verhältnis zu Global Search:** Global Search (`Strg+K`) findet **Entitäten** (NPCs, Orte, Quests). Command Palette (`Strg+Shift+K`) führt **Aktionen** aus. Beide können gleichzeitig existieren. Visuell: Global Search ist in der Header-Leiste eingebettet; Command Palette ist ein zentriertes Floating-Overlay.

---

## Copywriting Contract

Alle Texte auf Deutsch. Exakte Formulierungen — keine Varianten erlaubt.

### Primäre CTAs

| Element | Copy |
|---------|------|
| Wizard Hauptaktion (Schritt 1) | „Datei auswählen" |
| Wizard Hauptaktion (Schritt 2) | „Umzugs-Export erstellen" |
| Wizard Hauptaktion (Schritt 3) | „Datei hier ablegen oder klicken zum Auswählen" (Drag&Drop-Zone, groß) |
| Wizard Fertigstellen | „App jetzt nutzen" |
| Wizard Backup-Folgeschritt | „Automatische Backups einrichten" |
| Wizard Überspringen | „Überspringen — ich starte neu" |
| Install-Button (Desktop) | „App installieren" |
| Install-Button (Mobile Tooltip) | „Als App installieren" |
| Backup einrichten (Einstellungen) | „Backup-Ordner wählen" |
| Backup wiederverbinden | „Ordner wieder verbinden" |
| Restore-Button (Liste) | „Wiederherstellen" |
| Restore bestätigen | „Jetzt wiederherstellen" |
| Backup herunterladen (file://) | „Backup jetzt herunterladen" |

### Update-Hinweis-Leiste (D-03)

| Element | Copy |
|---------|------|
| Hinweistext | „Neue Version verfügbar" |
| Primärer Button | „Jetzt neu laden" |
| Sekundärer Button | „Später" |

### Einmaliger Umzugs-Hinweis in file://-App (D-10)

| Element | Copy |
|---------|------|
| Text | „Die D&D Tracker App ist jetzt als installierbare Web-App verfügbar — Daten können verlustfrei umgezogen werden." |
| Link | „Zum App-Umzug" |
| Schließen | „✕" (aria-label: „Hinweis schließen") |

### Divergenz-Banner (D-11)

| Element | Copy |
|---------|------|
| Bannertext | „Diese Daten wurden am {Datum} in die App umgezogen — Änderungen hier kommen dort nicht an." |
| Schaltfläche | „Nicht mehr anzeigen" |

### Backup-Status (D-17)

| Zustand | Copy |
|---------|------|
| Aktiv | „Letztes Backup: {Uhrzeit} · Ordner: {Ordnername}" |
| Pausiert | „Datei-Backup pausiert — Ordner nicht mehr erreichbar" |
| Nicht eingerichtet | „Kein automatisches Datei-Backup eingerichtet" |
| Header-Warnindikator-Tooltip | „Datei-Backup pausiert. Klicken zum Einstellungen öffnen." |

### file://-Fallback (D-18)

| Element | Copy |
|---------|------|
| Status-Text | „file://-Modus: Kein automatisches Backup möglich." |
| Erinnerungs-Toast (max. 1×/Sitzung) | „Ungesicherte Änderungen — Backup herunterladen?" |

### Backup-Browser (D-14)

| Element | Copy |
|---------|------|
| Modal-Titel | „Backup-Verlauf" |
| Tabellenkopf | „Kampagne · Datum · Größe · Aktion" |
| Leerer Zustand | „Keine Backup-Dateien im verbundenen Ordner gefunden." |
| Bestätigung Überschrift | „Kampagne wiederherstellen?" |
| Bestätigung Text | „{Kampagnenname} wird auf den Stand vom {Datum} zurückgesetzt. Dieser Vorgang kann mit Strg+Z rückgängig gemacht werden." |
| Bestätigung Abbrechen | „Abbrechen" |
| Bestätigung Bestätigen | „Jetzt wiederherstellen" |

### Fehlerzustände

| Fehler | Copy |
|--------|------|
| Wizard: Datei ungültig | „Die Datei konnte nicht gelesen werden — bitte eine gültige Tracker-Exportdatei wählen." |
| Wizard: Import-Fehler | „Import fehlgeschlagen: {Fehlermeldung}. Bitte erneut versuchen oder Überspringen wählen." |
| Backup: Ordnerzugriff verweigert | „Backup-Ordner nicht erreichbar — Zugriff wurde verweigert." |
| Backup: Schreibfehler | „Backup konnte nicht geschrieben werden — Speicherplatz oder Berechtigungen prüfen." |
| Command Palette: keine Ergebnisse | „Keine Aktion gefunden — Tipp anpassen oder Esc zum Schließen." |

### Destruktive Aktionen

| Aktion | Bestätigung |
|--------|-------------|
| Kampagne per Backup wiederherstellen | Bestätigungsdialog mit rotem Titel + explizitem Hinweis auf Undo-Möglichkeit (s.o.) |
| Backup-Ordner trennen (Einstellungen) | Inline-Bestätigung: „Backup-Verbindung wirklich trennen? Bereits erstellte Backups bleiben erhalten." + Button „Trennen" (rot) |

---

## Interaktions-Kontrakte

### Reihenfolge-Regeln (Spieltisch-Leitlinien aus CONTEXT.md)

1. **Einmal-pro-Sitzung-Regel:** Jeder nicht-destruktive Hinweis (Umzugs-Hinweis D-10, Backup-Erinnerung D-18) erscheint maximal einmal pro Browser-Session (`sessionStorage`-Flag). Nach dem ersten Schließen — weg bis zum nächsten App-Start.
2. **Still statt laut:** Backup-Status ist dauerhafter ruhiger Zustand in Einstellungen. Warnindikator im Header erscheint erst bei tatsächlichem Fehler. Kein Toast-Gewitter bei wiederholten Backup-Fehlern (D-16).
3. **Laut nur bei Datenverlust-Risiko:** Restore-Bestätigung ist der einzige Moment mit rotem UI-Element und Blockier-Dialog. Alle anderen Phase-2-Aktionen sind rückgängig machbar oder nicht datengefährdend.

### Tastatur-Navigation

| Shortcut | Aktion |
|----------|--------|
| `Strg+Shift+K` | Command Palette öffnen/schließen |
| `↑` / `↓` | In Command-Palette-Ergebnissen navigieren |
| `Enter` | Fokussierte Aktion in Command Palette ausführen |
| `Esc` | Command Palette / Wizard / Backup-Browser schließen |
| `Tab` | Standard-Fokus-Navigation in Wizard und Dialogen |

### Animationen

Alle Animationen folgen dem bestehenden Modal-Muster (`transition: transform 0.25s ease, opacity 0.25s ease`):
- Command Palette öffnet: Slide-down 20px → 0 + opacity 0→1, 0.2s ease
- Wizard-Schritte wechseln: opacity 0→1, 0.15s ease (kein Slide — spart Rechenzeit auf Spieltisch-Hardware)
- Update-Banner: slide-up von unten, 0.2s ease
- Keine Animationen bei reduzierten Bewegungen (`prefers-reduced-motion: reduce` → `transition: none`)

### Focus-Management

- Command Palette öffnen: Fokus landet sofort auf `.cp-input`
- Wizard öffnen: Fokus landet auf Primär-CTA des aktuellen Schritts
- Modal schließen (Esc): Fokus kehrt zum auslösenden Element zurück (Standard)

---

## Registry Safety

| Registry | Genutzte Blöcke | Safety Gate |
|----------|----------------|-------------|
| shadcn official | keine — nicht initialisiert | nicht zutreffend |
| Drittanbieter | keine | nicht zutreffend |

Keine externen Component-Registries. Alle Phase-2-Komponenten werden aus dem bestehenden CSS-Custom-Properties-System und dem `.modal`/`.modal-overlay`-Muster des Projekts gebaut.

---

## SVG-Icon-Spezifikation: PWA App-Icon (D-04)

**Anforderung:** d20-Motiv, Gold `#d4af37` auf Dunkel `#0d0d0d`. Als SVG entworfen, gerendert als PNG 192x192 und 512x512 (maskable).

**Design-Vertrag:**

```
Hintergrund: #0d0d0d (volles Quadrat für maskable)
Safe-Zone (maskable): 80% des Bildbereichs = 154px bei 192px / 410px bei 512px
Hauptmotiv: Zwanzigflächner (Ikosaeder) in Vorderansicht
Linienfarbe / Füllfarbe: #d4af37 (Gold)
Linienstärke (SVG stroke): 2px relativ zu viewBox 100x100
Zahl auf Vorderseite: „20" in Gold, zentriert, font-weight: 700, Monospace-ähnlich
Hintergrundkreis / -form: kein zusätzliches Element — d20 direkt auf dunklem Hintergrund
```

**Geometrie (viewBox="0 0 100 100"):**
- Äußeres Polygon: Vereinfachtes Ikosaeder in Frontansicht (fünfseitige Sichtfläche + drei sichtbare Dreiecks-Kanten)
- Mittlere Frontfläche: Fünfeck, zentriert
- Obere Kante: nach oben zeigend (Standardausrichtung d20)

**Maskable-Kompatibilität:** Alle wichtigen Elemente innerhalb von 80% Radius (40px Marge auf jeder Seite bei 192px-Version). Getestet via maskable.app vor Deployment.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

## Quellen-Mapping

| Entscheidung | Quelle |
|-------------|--------|
| Alle D-0x Entscheidungen | CONTEXT.md (gesperrt) |
| Spacing-Werte (16px, 10px, 44px) | `assets/styles/variables.css` — Codebase-Scan |
| Typografie-Tokens (14/16/12px, Gewichte) | `assets/styles/variables.css` — Codebase-Scan |
| Farb-Tokens (--gold, --bg-dark, --red etc.) | `assets/styles/variables.css` — Codebase-Scan |
| Modal-Muster (overlay + transform-slide) | `assets/styles/dashboard.css` L551–608 — Codebase-Scan |
| z-index-Hierarchie (1100 für Modals) | `assets/styles/dashboard.css` L555 — Codebase-Scan |
| Toast/Event-Log-System | CONTEXT.md Code-Context + `utils/utilities.js` |
| Command-Palette-Shortcut Strg+Shift+K | RESEARCH.md Pattern 5 + Pitfall 7 |
| Global-Search-Abgrenzung | RESEARCH.md Pattern 5, CONTEXT.md Code-Context |
| Spieltisch-Leitlinien (einmal pro Sitzung) | CONTEXT.md Specifics + 01-CONTEXT.md Verweis |
| Wizard-Drag&Drop-Pattern | RESEARCH.md „Don't Hand-Roll" |

*Phase: 02-technik-fundament*
*UI-SPEC erstellt: 2026-06-12*
