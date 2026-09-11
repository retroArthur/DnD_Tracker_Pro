---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 4
total_count: 7
last_updated: 2026-09-11T20:49:08.687Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 09 | deviation | ui/editors/rich-text.js | 594 | handleEditorPaste()s Tabellen-insertHTML-Zweig (Zeilen 615/623) entfernt nur eine feste Attribut-Liste (class/style/width/...), NICHT on*-Ereignis-Attribute — ein onerror-Attribut in eingefuegtem Tabellen-HTML ueberlebt bis in den Editor-DOM und feuert (empirisch bestaetigt). Nicht in Plan 09-04 behoben (Plan-Verifikationskriterium 'kein Produktionscode geaendert'); Fund fuer Triage vorgemerkt. | fixed |  | 2026-07-25T03:13:49.269Z | 2026-07-25T11:10:15.660Z |
| 2 | 11 | deviation | tests/build/test_build_deduplication.py | 189 | Pre-existing false-positive in test_build_generates_valid_javascript (naive brace-depth heuristic flags bestiary-editor.js scoped var el as duplicate top-level); confirmed pre-dating 11-01, not caused by SSoT parser change; fix deferred to D-06 plan | fixed |  | 2026-07-25T20:37:52.722Z | 2026-07-25T21:10:59.019Z |
| 3 | 11 | unrun-verify | tests/e2e/smoke.spec.js | 40 | D-12-Smoke-Test (page.on('response')/page.on('console')) kann den Favicon-404 nicht beobachten: headless Chromium (CI/Playwright-Default) fuehrt den impliziten favicon.ico-Fetch gar nicht aus (0 CDP-Events); im headed-Modus feuert er real mit 404 (CDP-bestaetigt), aber Playwright-Page-Events (request/response/requestfinished/requestfailed) sehen ihn nie. Meta-Tag-Deprecation-Warnung wurde auf Chromium 143.0.7499.4 auf keinem der drei geprueften Kanaele (console/CDP-Log/CDP-Audits) je beobachtet, weder vor noch nach D-11. Fix (D-10) manuell per Raw-CDP-Probe verifiziert (Fetch verschwindet nach dem Fix im headed-Modus); der automatisierte Test bleibt in dieser Umgebung strukturell unfaehig, die beiden Bedingungen zu falsifizieren. | open |  | 2026-07-25T21:52:04.204Z |  |
| 4 | 12 | deviation | systems/migration/full-export.js | 90 | downloadFullExport() haengt den Anchor nicht an document.body an vor dem Klick (dieselbe Schwaeche wie audio-export.js vor 12-02-Checkpoint-Fix) — bewusst nicht mitgefixt, ausserhalb files_modified von 12-02 | open |  | 2026-08-18T21:08:28.958Z |  |
| 5 | 15 | unmet-truth | tools/css-usage-report.js |  | Nach Plan 15-12 (Neumessung nach den CR-02/CR-03-Detektorfixes aus Plan 15-11 und den Wiederherstellungen aus Plan 15-12) bleiben 159 tote Klassennamen ausserhalb der Ausnahmeliste in --check (Ziel: Exit-Code 0; Ausgangswert vor dem CR-01/WR-01-Fix in Plan 15-09 war 204) — alle 159 sind Ankerregel-Ueberlebende in Verbund-/Kommaselektoren mit mindestens einer lebenden Geschwisterklasse (z.B. .pwa-banner.visible, .dice-btn.d4); 0 vollstaendig tote Regelbloecke bleiben (Loeschziel erreicht), aber --check erreicht Exit-Code 0 nicht. | open |  | 2026-09-09T10:47:24.319Z |  |
| 6 | 15 | deviation | tools/css-usage-report.js |  | CR-01: collectLiveTokens() erkannte zwei reale Klassen-Kontexte nicht — eine Ternary rechts von .className= (dom-builder.js im ui/-Verzeichnis) und die Objektschluessel containerClass:/className: (safe-render.js im ui/-Verzeichnis). Dadurch wurden in Plan 15-07 die Regelbloecke .npc-grid (assets/styles/npcs.css) und .list-view-container (assets/styles/encounters.css) faelschlich als tot geloescht. Plan 15-09 hat beide Bloecke woertlich aus Commit 4faca38 wiederhergestellt und die Erkennung in collectLiveTokens() um drei mechanische Regeln erweitert (CR-01a/b/c, WR-01), belegt durch vier rot-gruen bewiesene Testfaelle. Die verbleibende strukturelle Grenze — eine Text-Pruefung ohne echten JS-Parser kann nie vollstaendig sein — ist in deferred-items.md dieser Phase gefuehrt. Korrektur (Plan 15-12, Eintrag 7): der Status fixed bezog sich nur auf den damals bekannten Teil des Fundes — eine Gegenprobe des gesamten Loeschstands wurde erst durch Eintrag 7 nachgeholt. | fixed |  | 2026-09-09T12:57:18.484Z | 2026-09-09T12:57:25.222Z |
| 7 | 15 | deviation | tools/css-usage-report.js |  | CR-01/CR-02/CR-03: die Lebend-Erkennung in collectLiveTokens() brach seit Plan 15-09 bei jedem Zeilenumbruch innerhalb einer anweisungsweiten Zuweisung ab (scanBalancedSegment()s Umbruchschranke) und verwarf den gesamten Inhalt einer ${...}-Interpolation innerhalb eines Klassen-Kontexts vollstaendig, statt seine Zeichenketten-Literale zu ernten. Eine Gegenprobe des GESAMTEN Loeschstands der Welle aus Plan 15-07 wurde dabei nie gefahren -- nur die zwei damals namentlich bekannten Faelle wurden in Plan 15-09 nachgeprueft. Dadurch blieben die Regelbloecke fuer shop-meta-tag, si-unavailable, fr-hist-plus, fr-hist-minus, init-mob-dmg-inputs, npc-header, dice-crit und dice-fail faelschlich geloescht, obwohl ihre Klassen ueber reale class=/.className=/containerClass:/.className+=-Kontexte im Quellbaum lebendig sind. Plan 15-11 hat die drei mechanischen Erkennungsluecken (Umbruchschranke, Interpolations-Ernte, Zwischenvariablen-Kontext) geschlossen, und Plan 15-12 hat alle acht Regelbloecke woertlich aus ihrem jeweiligen Loeschcommit-Elternstand wiederhergestellt. Die Gegenprobe faehrt ab jetzt als tests/unit/css-deletion-audit.test.js bei jedem Jest-Lauf mit und macht jede kuenftige Fehlloeschung dieser Art rot. | fixed |  | 2026-09-11T20:48:23.792Z | 2026-09-11T20:49:08.687Z |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "09",
    "file": "ui/editors/rich-text.js",
    "line": 594,
    "description": "handleEditorPaste()s Tabellen-insertHTML-Zweig (Zeilen 615/623) entfernt nur eine feste Attribut-Liste (class/style/width/...), NICHT on*-Ereignis-Attribute — ein onerror-Attribut in eingefuegtem Tabellen-HTML ueberlebt bis in den Editor-DOM und feuert (empirisch bestaetigt). Nicht in Plan 09-04 behoben (Plan-Verifikationskriterium 'kein Produktionscode geaendert'); Fund fuer Triage vorgemerkt.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-07-25T03:13:49.269Z",
    "resolved_at": "2026-07-25T11:10:15.660Z"
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "11",
    "file": "tests/build/test_build_deduplication.py",
    "line": 189,
    "description": "Pre-existing false-positive in test_build_generates_valid_javascript (naive brace-depth heuristic flags bestiary-editor.js scoped var el as duplicate top-level); confirmed pre-dating 11-01, not caused by SSoT parser change; fix deferred to D-06 plan",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-07-25T20:37:52.722Z",
    "resolved_at": "2026-07-25T21:10:59.019Z"
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "11",
    "file": "tests/e2e/smoke.spec.js",
    "line": 40,
    "description": "D-12-Smoke-Test (page.on('response')/page.on('console')) kann den Favicon-404 nicht beobachten: headless Chromium (CI/Playwright-Default) fuehrt den impliziten favicon.ico-Fetch gar nicht aus (0 CDP-Events); im headed-Modus feuert er real mit 404 (CDP-bestaetigt), aber Playwright-Page-Events (request/response/requestfinished/requestfailed) sehen ihn nie. Meta-Tag-Deprecation-Warnung wurde auf Chromium 143.0.7499.4 auf keinem der drei geprueften Kanaele (console/CDP-Log/CDP-Audits) je beobachtet, weder vor noch nach D-11. Fix (D-10) manuell per Raw-CDP-Probe verifiziert (Fetch verschwindet nach dem Fix im headed-Modus); der automatisierte Test bleibt in dieser Umgebung strukturell unfaehig, die beiden Bedingungen zu falsifizieren.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-25T21:52:04.204Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "12",
    "file": "systems/migration/full-export.js",
    "line": 90,
    "description": "downloadFullExport() haengt den Anchor nicht an document.body an vor dem Klick (dieselbe Schwaeche wie audio-export.js vor 12-02-Checkpoint-Fix) — bewusst nicht mitgefixt, ausserhalb files_modified von 12-02",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-18T21:08:28.958Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "unmet-truth",
    "phase": "15",
    "file": "tools/css-usage-report.js",
    "line": null,
    "description": "Nach Plan 15-12 (Neumessung nach den CR-02/CR-03-Detektorfixes aus Plan 15-11 und den Wiederherstellungen aus Plan 15-12) bleiben 159 tote Klassennamen ausserhalb der Ausnahmeliste in --check (Ziel: Exit-Code 0; Ausgangswert vor dem CR-01/WR-01-Fix in Plan 15-09 war 204) — alle 159 sind Ankerregel-Ueberlebende in Verbund-/Kommaselektoren mit mindestens einer lebenden Geschwisterklasse (z.B. .pwa-banner.visible, .dice-btn.d4); 0 vollstaendig tote Regelbloecke bleiben (Loeschziel erreicht), aber --check erreicht Exit-Code 0 nicht.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-09T10:47:24.319Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "15",
    "file": "tools/css-usage-report.js",
    "line": null,
    "description": "CR-01: collectLiveTokens() erkannte zwei reale Klassen-Kontexte nicht — eine Ternary rechts von .className= (dom-builder.js im ui/-Verzeichnis) und die Objektschluessel containerClass:/className: (safe-render.js im ui/-Verzeichnis). Dadurch wurden in Plan 15-07 die Regelbloecke .npc-grid (assets/styles/npcs.css) und .list-view-container (assets/styles/encounters.css) faelschlich als tot geloescht. Plan 15-09 hat beide Bloecke woertlich aus Commit 4faca38 wiederhergestellt und die Erkennung in collectLiveTokens() um drei mechanische Regeln erweitert (CR-01a/b/c, WR-01), belegt durch vier rot-gruen bewiesene Testfaelle. Die verbleibende strukturelle Grenze — eine Text-Pruefung ohne echten JS-Parser kann nie vollstaendig sein — ist in deferred-items.md dieser Phase gefuehrt. Korrektur (Plan 15-12, Eintrag 7): der Status fixed bezog sich nur auf den damals bekannten Teil des Fundes — eine Gegenprobe des gesamten Loeschstands wurde erst durch Eintrag 7 nachgeholt.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-09T12:57:18.484Z",
    "resolved_at": "2026-09-09T12:57:25.222Z"
  },
  {
    "id": 7,
    "kind": "deviation",
    "phase": "15",
    "file": "tools/css-usage-report.js",
    "line": null,
    "description": "CR-01/CR-02/CR-03: die Lebend-Erkennung in collectLiveTokens() brach seit Plan 15-09 bei jedem Zeilenumbruch innerhalb einer anweisungsweiten Zuweisung ab (scanBalancedSegment()s Umbruchschranke) und verwarf den gesamten Inhalt einer ${...}-Interpolation innerhalb eines Klassen-Kontexts vollstaendig, statt seine Zeichenketten-Literale zu ernten. Eine Gegenprobe des GESAMTEN Loeschstands der Welle aus Plan 15-07 wurde dabei nie gefahren -- nur die zwei damals namentlich bekannten Faelle wurden in Plan 15-09 nachgeprueft. Dadurch blieben die Regelbloecke fuer shop-meta-tag, si-unavailable, fr-hist-plus, fr-hist-minus, init-mob-dmg-inputs, npc-header, dice-crit und dice-fail faelschlich geloescht, obwohl ihre Klassen ueber reale class=/.className=/containerClass:/.className+=-Kontexte im Quellbaum lebendig sind. Plan 15-11 hat die drei mechanischen Erkennungsluecken (Umbruchschranke, Interpolations-Ernte, Zwischenvariablen-Kontext) geschlossen, und Plan 15-12 hat alle acht Regelbloecke woertlich aus ihrem jeweiligen Loeschcommit-Elternstand wiederhergestellt. Die Gegenprobe faehrt ab jetzt als tests/unit/css-deletion-audit.test.js bei jedem Jest-Lauf mit und macht jede kuenftige Fehlloeschung dieser Art rot.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-11T20:48:23.792Z",
    "resolved_at": "2026-09-11T20:49:08.687Z"
  }
]
````
