---
plan: 06-07
phase: 06-spieler-verwaltung
gap_closure: true
requirements: [CHAR-03]
status: complete
completed: 2026-06-16T00:00:00Z
key-files:
  modified:
    - assets/styles/party.css
---

# 06-07 Summary — Fertigkeiten-Layout (UAT gap `skills-layout`)

## Self-Check: PASSED

## Was geschlossen wurde

UAT-Beobachtung (Nutzer, Screenshot "Conan der Barbar"): die Fertigkeiten im Detail-Modal waren
"zu verteilt und ungerade". Ursache: `.char-skills-by-attr` nutzte `display: grid` mit
`repeat(auto-fit, minmax(150px, 1fr))` — die 5 ungleich großen Attribut-Gruppen (STR=1, DEX=3,
INT=5, WIS=5, CHA=4; CON leer) wurden über die volle Modal-Breite gestreckt und zeilenweise
platziert → breite Name↔Modifier-Lücken + CHA als Waisen-Zeile mit leeren Zellen daneben.

## Was gemacht wurde

`assets/styles/party.css`:
- `.char-skills-by-attr`: Grid → balancierter Mehrspalten-Fluss (`column-width: 215px;
  column-gap: 22px; max-width: 960px`). Gruppen packen sich spaltenweise dicht und balancieren
  nach Höhe; die `max-width`-Kappung hält die Zeilen kompakt und begrenzt auf ~4 Spalten auf
  breiten Screens (statt ~5 zerfließender Spalten).
- `.char-skill-attr-group`: `break-inside: avoid` (+ -webkit-column-break-inside / page-break-inside)
  damit eine Gruppe nie über Spaltengrenzen reißt; `margin-bottom: 12px`; Skill-Zeilen-`gap` 3px→2px.

## Verifikation

- Visuell per Playwright-Screenshot geprüft (Conan-Profil, 1366px-Viewport): 5 Gruppen packen sich
  in balancierte Spalten (STR+DEX | INT | WIS+CHA), kompakte Zeilen, keine Waisen-Spalte.
- `python build.py` exit 0; `npx jest` 421/421; `npx playwright test character-advancement.spec.js` 10/10
  (Roll-Verhalten + V/N-Hover-Test unverändert).

## Hinweise

- Reines CSS — `party-details.js` unverändert, kein neues Modul.
- Nutzer-Sichtprüfung auf eigenem (breiterem) Screen noch offen → ~4 balancierte Spalten erwartet.
