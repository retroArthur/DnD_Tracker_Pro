---
status: partial
phase: 05-welt-story
source: [05-VERIFICATION.md]
started: 2026-06-15
updated: 2026-06-16
---

# Phase 5 — Human Verification (UAT)

> Alle automatisierten Checks bestanden (5/5 must-haves, 37 Unit- + 24 E2E-Tests grün, Build grün, 4 Tabs rendern fehlerfrei). Die folgenden 2 Punkte sind rein subjektiv/kanon-bezogen und brauchen menschliche Sichtung. Nicht-blockierend — die Phase ist als abgeschlossen markiert.

## Current Test

[awaiting human testing]

## Tests

### 1. NPC-Generator: Inhaltsqualität & gefühlte Latenz
expected: 10× „NPC generieren" liefert jeweils in unter ~1 Sekunde einen NPC mit deutschem Namen + Persönlichkeitszug + Marotte (+ Volk/Beruf/Aussehen); die Inhalte lesen sich plausibel und setting-passend, ohne offensichtliche Wiederholungen/Platzhalter.
result: [pending]

### 2. Harptos-Kalender: Kanon-Korrektheit
expected: Die 12 Monatsnamen (Hammer, Alturiak, Ches, Tarsakh, Mirtul, Kythorn, Flamerule, Eleasis, Eleint, Marpenoth, Uktar, Nightal) und die 5 Festtage (Midwinter, Greengrass, Midsummer, Highharvestide, Feast of the Moon) entsprechen dem Forgotten-Realms-/Harptos-Kanon; das Startdatum 1492 DR ist korrekt.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps

- truth: "Der NPC-Generator öffnet sich als zentriertes Modal-Overlay und verschwindet beim Tab-Wechsel"
  status: failed
  reason: "UAT-Beobachtung (2026-06-16, während Phase-6-UAT entdeckt; Feature stammt aus 05-04): showNPCGeneratorModal() (features/npc-generator/npc-generator.js:170) injiziert das Modal mit `class=\"modal\"` (= innere Karten-Klasse) als ÄUSSERES Element und zeigt es per inline `style=\"display:flex\"` — statt der App-Standard-Struktur `<div class=\"modal-overlay\">…<div class=\"modal\">`. Folge: kein `position:fixed`-Overlay → das Modal fällt ans Seitenende (normaler Fluss, kein Backdrop). Zusätzlich wird es via insertAdjacentHTML an document.body gehängt und NICHT an den View-Lifecycle gekoppelt → bleibt beim Tab-Wechsel sichtbar (nur close-modal/Backdrop/Save entfernen es)."
  severity: major
  test: npc-generator-modal-overlay
  artifacts: ["features/npc-generator/npc-generator.js:170", "features/npc-generator/npc-generator.js:210", "assets/styles/dashboard.css:551 (.modal-overlay = fixed/zentriert/backdrop, z-index 1100)", "assets/templates/modals-tools.html:88-89 (korrektes Muster: modal-overlay > modal)"]
  missing: ["äußeres Element auf .modal-overlay umstellen (innere Karte .modal/.npcg-modal-content)", "Anzeige via showModal('npc-generator-modal') statt inline display:flex", "Entfernen/Schließen des Modals beim View-Wechsel (switchView-Cleanup)", "E2E: Modal ist zentriertes Overlay + nach Tab-Wechsel verschwunden"]
