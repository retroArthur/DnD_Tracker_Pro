# Start-Prompt für Claude Code (in den Repo-Root von DnD_Tracker_App_Pro kopieren)

```
Lies zuerst, in dieser Reihenfolge, vollständig:
1. Anpassungen/Design-Konsistenz und Verbesserungen/HANDOFF-v3/DESIGN-HANDOFF-v3.md  (Auftrag, Soll-System, Wellen, Ratschen)
2. .planning/HANDOFF-V2-VERIFIKATION.md  (Messgrundlage und 13 Blocker — gilt, wo v3 nichts anderes sagt)
3. .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md  (Stand Phase 15)
4. CLAUDE.md, tests/unit/design-consistency.test.js, assets/styles/variables.css

Auftrag: Das Design der App durchgehend konsistent und stabil machen — als Token-System und
Komponentenverträge nach DESIGN-HANDOFF-v3.md §3, umgesetzt in den sechs Wellen aus §5, mit den
Ratschen aus §6. Kein Redesign, keine neuen Features, keine Framework- oder Datenänderung.

Vorgehen:
- Welle 0 (Phase 15) ist Voraussetzung. Prüfe, ob sie abgeschlossen ist (15-RATCHET-BASELINE.md
  vorhanden, Löschlauf und FIX-01..03 committed). Falls nicht: erst abschließen.
- Beginne mit Welle 1 (Farbe). Vor der ersten Codezeile: die offenen Entscheidungen aus §8 Punkt 2
  und 3 als Frage an mich stellen, dann warten.
- Pro Welle: (a) Ratsche schreiben und ROT beweisen, Ausgangswert im Kommentar; bestehende
  Ratschen (F-01, F-03, F-14, DUBLETTEN_MAX, IMPORTANT_MAX, INLINE_MAX) VORHER anpassen, wie in §5
  je Welle benannt; (b) Tokens in variables.css — themenfolgend in ALLEN VIER Theme-Blöcken,
  abgeleitet im Aliasblock; (c) mechanische Stellen dateiweise committen; (d) Urteilsstellen
  einzeln, Kontrast NACH der Änderung gegen die tatsächliche Trägerfläche in vier Themes
  nachrechnen; (e) python build.py && python build.py --production, npm test, npm run test:e2e,
  pytest tests/build; (f) Screenshot-Serie der Stellenliste × vier Themes nach
  tests/e2e/__screens__/<welle>/; (g) Ratsche GRÜN, Commit, kurzer Bericht mit Vorher/Nachher-Zahlen.
- Keine Roh-Werte (Hex, rgba, px-Schriftgröße, Dauer, Schattenwert) im Komponenten-CSS. Wenn ein
  Token fehlt, lege es an — nicht den Roh-Wert.
- Alte Klassennamen bleiben als Alias-Selektoren; Templates und JS werden nur dort geändert, wo §5
  es ausdrücklich sagt (locations-render.js:153, renderSpells/renderQuests, Inline-font-size in
  Welle 5, Fokus-Selektoren in Welle 6).
- Ausnahmen aus §7 werden nicht angefasst; jede neue Ausnahme braucht einen Kommentar im CSS UND
  einen Eintrag in der Ausnahmeliste der zugehörigen Ratsche.
- Melde dich nach jeder Welle mit: Ratschenwerte vorher/nachher, Liste der Urteilsentscheidungen,
  offene Punkte für meine Vier-Themes-Sichtung. Starte die nächste Welle erst nach meiner Freigabe.

Referenzen zum Ansehen (nicht Produktionscode): Design-Übersicht.dc.html und Ist-Zustand App.dc.html
im selben Ordner — Kontrasttabellen und Komponenten in vier Themes mit dem echten Stylesheet.
```

## Hinweise für dich (nicht Teil des Prompts)

- Den Ordner `HANDOFF-v3/` samt `Design-Übersicht.dc.html`, `Ist-Zustand App.dc.html` und `app/assets/` nach `Anpassungen/Design-Konsistenz und Verbesserungen/HANDOFF-v3/` kopieren (die `.dc.html`-Dateien brauchen eine `support.js` daneben — wie beim v2-Bericht).
- Den alten Ordner `design_handoff_konsistenz_v2/` nicht löschen, aber im README dort einen Hinweis „abgelöst durch HANDOFF-v3“ setzen, damit Claude Code nicht zwei Aufgabenlisten findet.
- Falls Claude Code im GSD-Ablauf arbeitet: v3 bildet die Phasen 16–19 des Milestones v1.3 ab (16 = Welle 1+2, 17 = Welle 3+4, 18 = Welle 5, 19 = Welle 6). `REQUIREMENTS.md` und `ROADMAP.md` entsprechend nachführen lassen, bevor `/gsd-plan-phase 16` läuft.
