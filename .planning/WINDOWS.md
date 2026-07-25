---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-07-25T03:13:49.269Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 09 | deviation | ui/editors/rich-text.js | 594 | handleEditorPaste()s Tabellen-insertHTML-Zweig (Zeilen 615/623) entfernt nur eine feste Attribut-Liste (class/style/width/...), NICHT on*-Ereignis-Attribute — ein onerror-Attribut in eingefuegtem Tabellen-HTML ueberlebt bis in den Editor-DOM und feuert (empirisch bestaetigt). Nicht in Plan 09-04 behoben (Plan-Verifikationskriterium 'kein Produktionscode geaendert'); Fund fuer Triage vorgemerkt. | open |  | 2026-07-25T03:13:49.269Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "09",
    "file": "ui/editors/rich-text.js",
    "line": 594,
    "description": "handleEditorPaste()s Tabellen-insertHTML-Zweig (Zeilen 615/623) entfernt nur eine feste Attribut-Liste (class/style/width/...), NICHT on*-Ereignis-Attribute — ein onerror-Attribut in eingefuegtem Tabellen-HTML ueberlebt bis in den Editor-DOM und feuert (empirisch bestaetigt). Nicht in Plan 09-04 behoben (Plan-Verifikationskriterium 'kein Produktionscode geaendert'); Fund fuer Triage vorgemerkt.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-25T03:13:49.269Z",
    "resolved_at": null
  }
]
````
