# Development Setup - Bug-Fixes & Features

## Aktuelles Setup (nach TypeScript-Migration)

### Verzeichnisstruktur:

```
dnd-tracker-modular/
├── src/                    ← TypeScript-Dateien (für Type-Checking)
│   ├── features/
│   ├── systems/
│   ├── utils/
│   └── types/
├── features/               ← Laufende JavaScript-Dateien (HIER arbeiten!)
├── systems/                ← Laufende JavaScript-Dateien
├── utils/                  ← Laufende JavaScript-Dateien
└── loader.js               ← Lädt alle JS-Module
```

### Workflow für Bug-Fixes:

1. **Änderungen machen:**
    - Arbeite direkt in `features/*.js`, `systems/*.js`, `utils/*.js`
    - Die App lädt diese Dateien (siehe `loader.js`)

2. **Type-Checking (optional):**

    ```bash
    npm run typecheck    # Prüft src/**/*.ts (parallel-Dokumentation)
    ```

3. **Testen:**

    ```bash
    npm run test         # Unit Tests
    npm run test:e2e     # E2E Tests
    ```

4. **Committen:**
    ```bash
    git add features/xyz.js
    git commit -m "fix: beschreibung"
    ```

### Wichtig:

- **Laufende App:** Lädt JavaScript aus `features/`, `systems/`, `utils/`
- **TypeScript in `src/`:** Nur für Type-Checking, nicht für Runtime
- **Keine Build-Schritte:** Änderungen direkt wirksam (Browser-Reload)

### Backups:

- **Lokales Backup:** `D:\AI_CLI\Claude\Backup\DnD_Tracker_Modular_Backup_2026-01-07_14-34-48`
- **Git main Branch:** Pre-Migration Version
- **Git typescript-migration Branch:** Aktueller Stand (gepusht)

### Nächste Schritte:

- Bug-Fixes direkt in JavaScript-Dateien
- Später: Optional zu vollständigem TypeScript-Build wechseln

---

## Browser-Mindestanforderung ("Browserboden")

**Chromium/Edge 121 · Firefox 121.** Aufgeschrieben am 2026-09-29
(Design-Handoff v3, Welle 2, Schritt 11, Entscheidung E4). Vorher stand die
Zahl nirgends — weder als `browserslist`, noch in README, Manifest oder
Dokumentation; CLAUDE.md nannte nur die Namen der getesteten Browser.

### Woher die Zahl kommt

Der Boden ist die höchste Anforderung aller benutzten CSS-Fähigkeiten, nicht
die der zuletzt eingeführten:

| Fähigkeit         | Fundstellen                                                     | Chromium | Firefox |
| ----------------- | --------------------------------------------------------------- | -------- | ------- |
| `scrollbar-color` | 1 Regel in `assets/styles/dmscreen.css`                         | **121**  | 64      |
| `:has()`          | 6 Regeln in `core.css`, `loot.css`, `npcs.css`, `party.css` (3) | 105      | **121** |
| `color-mix()`     | seit Welle 2 flächendeckend in `assets/styles/`                 | 111      | 113     |

Beide Zahlen der ersten zwei Zeilen liegen **über** dem, was `color-mix()`
verlangt. Die Farbumstellung der Welle 2 hat den Boden also nicht angehoben;
sie hat nur sichtbar gemacht, dass es ihn gibt.

Nachzählen (Zeilennummern wandern, die Befehle nicht):

```bash
grep -rn "scrollbar-color" assets/styles/*.css
grep -rn ":has(" assets/styles/*.css       # 6 Regeln + 2 Nennungen in Kommentaren
```

Safari ist **kein geprüftes Ziel** (CLAUDE.md § Known Issues). Wer es aufnimmt,
misst den Boden dort neu: `:has()` ist ab 15.4 da, `color-mix()` ab 16.2,
`scrollbar-color` deutlich später (nach Fremddokumentation 18.2 — in diesem
Repository nicht nachgemessen).

### Was unterhalb des Bodens passiert

Ein Browser ohne `color-mix()` liest ein Custom Property wie
`--red-dim: color-mix(…)` beim Einlesen **klaglos** — der Wert ist bis zur
Verwendung nur eine Zeichenkette. Erst `var(--red-dim)` schlägt fehl, und zwar
nicht sichtbar, sondern als „invalid at computed value time": die Eigenschaft
nimmt ihren Anfangswert an, ein Hintergrund wird also **durchsichtig**, nicht
blass. Deshalb hilft dort weder eine davor stehende Ersatzzeile noch ein
Rückfall im `var()` — nur `@supports`.

- **Abgesichert:** die sechs abgeleiteten Hover-/Dim-Tokens (`--gold-hover`,
  `--green-hover`, `--red-dim`, `--green-dim`, `--red-dark`, `--orange-dim`)
  fallen per `@supports not (…)` in `assets/styles/variables.css` auf ihre
  Basisrolle zurück.
- **Nicht abgesichert:** die neun Auflagen- und Blenden-Tokens
  (`--overlay-*`, `--scrim-*`). R-13 in
  `tests/unit/design-consistency.test.js` führt sie als Inventar,
  `.planning/HANDOFF-V3-OFFENE-PUNKTE.md` als offenen Punkt.

Flächenregeln brauchen **keinen** solchen Rückfall: dort gewinnt bei
unbekanntem `color-mix()` die vorausgehende Deklaration derselben
Eigenschaft von selbst.

### Kein `browserslist`

`package.json` bekommt bewusst keinen `browserslist`-Eintrag: das Projekt
baut mit `build.py` (Python), nicht mit einer Toolchain, die ihn läse — ein
Eintrag dort wäre eine Angabe, die niemand auswertet und die deshalb
unbemerkt veralten würde. Die Zahl steht hier, wo sie gelesen wird, und
zusätzlich als Kommentar an der Stelle in `variables.css`, an der sie etwas
entscheidet.
