---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 1
total_count: 2
last_updated: 2026-07-25T20:37:52.722Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 09 | deviation | ui/editors/rich-text.js | 594 | handleEditorPaste()s Tabellen-insertHTML-Zweig (Zeilen 615/623) entfernt nur eine feste Attribut-Liste (class/style/width/...), NICHT on*-Ereignis-Attribute — ein onerror-Attribut in eingefuegtem Tabellen-HTML ueberlebt bis in den Editor-DOM und feuert (empirisch bestaetigt). Nicht in Plan 09-04 behoben (Plan-Verifikationskriterium 'kein Produktionscode geaendert'); Fund fuer Triage vorgemerkt. | fixed |  | 2026-07-25T03:13:49.269Z | 2026-07-25T11:10:15.660Z |
| 2 | 11 | deviation | tests/build/test_build_deduplication.py | 189 | Pre-existing false-positive in test_build_generates_valid_javascript (naive brace-depth heuristic flags bestiary-editor.js scoped var el as duplicate top-level); confirmed pre-dating 11-01, not caused by SSoT parser change; fix deferred to D-06 plan | open |  | 2026-07-25T20:37:52.722Z |  |

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
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-25T20:37:52.722Z",
    "resolved_at": null
  }
]
````
