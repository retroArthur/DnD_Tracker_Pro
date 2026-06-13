---
status: partial
phase: 04-initiative-erweiterungen
source: [04-VERIFICATION.md]
started: 2026-06-14T14:00:00Z
updated: 2026-06-14T14:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Statblock-Panel Optik (Pergament-Look, Drawer rechts, Mobile-Bottom-Sheet)
expected: App per `file://` öffnen → Initiative-Tab → Bestiary-Monster hinzufügen → 📖-Button klicken. Desktop: Drawer erscheint rechts (420px breit, volle Höhe, Parchment-Statblock mit Sektionen Attribute/Aktionen/Traits/Senses). Browser auf <600px verkleinern → Bottom-Sheet öffnet von unten (60vh, 12px Radius oben, scrollbar).
result: [pending]

### 2. Pip-Feel am Tisch — LA/LR-Klick-Reaktion wie Death-Save-Dots
expected: Boss-Monster (z.B. Vampir) zur Initiative → LA-Pips (⭐) und LR-Pips (🛡️) anklicken. Klick ist sofort reaktiv (scale(1.15) Hover, Gold/Lila Farbwechsel ohne Lag). Nach vollem Rundenübergang: LA-Pips wieder voll (auto-reset), LR-Pips unverändert (D-07); LR-Reset-Knopf stellt LR manuell wieder her.
result: [pending]

### 3. Mob-Schaden-Workflow am Tisch — beide Angriffsmodi (N-fach und DMG-Mob-Regel)
expected: 10 Goblins → Mob-Modus (JA im Confirm-Dialog) → Sammel-Angriff-Button in beiden Modi. N-fach: Toast mit auto-summiertem Gesamtschaden. DMG-Mob-Regel: RK + Angriffsbonus eingeben → Toast "X Treffer (von Y lebend, RK Z) | Schaden: W". Ein Klick = Gesamtschaden.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
