#!/usr/bin/env python3
"""
TDD Tests für Build-Deduplizierung

Diese Tests prüfen:
1. Stabilität: Build läuft ohne Fehler durch
2. Funktionalität: Deduplizierung entfernt alle window-assignment Konflikte
3. Code-Integrität: Generierte HTML enthält keine duplicate declarations
"""

import pytest
import re
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from build import deduplicate_window_assignments, build


class TestBuildDeduplication:
    """Tests für die Build-Deduplizierungs-Funktionalität"""

    def test_deduplicate_removes_duplicate_window_assignments(self):
        """
        STABILITY: Deduplizierung muss identische window assignments entfernen
        """
        js_code = """
var APP_CONFIG = window.APP_CONFIG;
var D = window.D;
var APP_CONFIG = window.APP_CONFIG;  // DUPLICATE
var save = window.save;
var D = window.D;  // DUPLICATE
"""
        result = deduplicate_window_assignments(js_code)

        # Zähle wie oft "var APP_CONFIG = window.APP_CONFIG" vorkommt
        app_config_count = result.count("var APP_CONFIG = window.APP_CONFIG")
        d_count = result.count("var D = window.D")

        assert app_config_count == 1, f"Expected 1 APP_CONFIG assignment, found {app_config_count}"
        assert d_count == 1, f"Expected 1 D assignment, found {d_count}"

    def test_deduplicate_removes_conflicting_definitions(self):
        """
        FUNCTIONALITY: Deduplizierung muss Konflikte zwischen Definition und Import entfernen
        """
        js_code = """
const UI_TIMING = {
    DM_SCREEN_SYNC_DELAY: 150,
    AOE_UPDATE_DEBOUNCE: 50
};
window.UI_TIMING = UI_TIMING;

var UI_TIMING = window.UI_TIMING;  // CONFLICT - should be removed
"""
        result = deduplicate_window_assignments(js_code)

        # Original definition muss bleiben
        assert "const UI_TIMING = {" in result

        # Conflicting assignment darf nicht als aktiver Code existieren
        # (nur als Kommentar erlaubt)
        lines = [l.strip() for l in result.split('\n') if l.strip() and not l.strip().startswith('//')]
        conflicting_lines = [l for l in lines if 'var UI_TIMING = window.UI_TIMING' in l]

        assert len(conflicting_lines) == 0, f"Found {len(conflicting_lines)} conflicting UI_TIMING assignments"

    def test_deduplicate_handles_multiple_conflicts(self):
        """
        CODE INTEGRITY: Deduplizierung muss alle Konflikte korrekt behandeln
        """
        js_code = """
const BACKUP_INTERVAL = 5000;
window.BACKUP_INTERVAL = BACKUP_INTERVAL;

const save = function() { /* ... */ };
window.save = save;

const MAX_BACKUPS = 5;
window.MAX_BACKUPS = MAX_BACKUPS;

var BACKUP_INTERVAL = window.BACKUP_INTERVAL;  // CONFLICT
var save = window.save;  // CONFLICT
var MAX_BACKUPS = window.MAX_BACKUPS;  // CONFLICT
"""
        result = deduplicate_window_assignments(js_code)

        # Original definitions müssen bleiben
        assert "const BACKUP_INTERVAL = 5000" in result
        assert "const save = function()" in result
        assert "const MAX_BACKUPS = 5" in result

        # Keine aktiven conflicting assignments
        active_lines = [l for l in result.split('\n') if l.strip() and not l.strip().startswith('//')]

        backup_interval_conflicts = [l for l in active_lines if 'var BACKUP_INTERVAL = window.BACKUP_INTERVAL' in l]
        save_conflicts = [l for l in active_lines if 'var save = window.save' in l]
        max_backups_conflicts = [l for l in active_lines if 'var MAX_BACKUPS = window.MAX_BACKUPS' in l]

        assert len(backup_interval_conflicts) == 0, "BACKUP_INTERVAL conflict not removed"
        assert len(save_conflicts) == 0, "save conflict not removed"
        assert len(max_backups_conflicts) == 0, "MAX_BACKUPS conflict not removed"

    def test_full_build_has_no_duplicate_declarations(self):
        """
        STABILITY: Voller Build darf keine duplicate declarations haben
        """
        # Lese die generierte HTML
        dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-bundled.html'

        if not dist_file.exists():
            pytest.skip("Build file nicht gefunden, führe zuerst 'python build.py' aus")

        with open(dist_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Extrahiere JavaScript aus <script> tag
        script_match = re.search(r'<script>(.*?)</script>', html_content, re.DOTALL)
        assert script_match, "Kein <script> tag gefunden"

        js_content = script_match.group(1)

        # Prüfe auf duplicate window assignments
        pattern = r'^(var|const|let)\s+(\w+)\s*=\s*window\.(\2)\s*;'

        assignments = {}
        for line_num, line in enumerate(js_content.split('\n'), 1):
            if line.strip().startswith('//'):
                continue  # Skip comments

            match = re.match(pattern, line.strip())
            if match:
                var_name = match.group(2)
                if var_name not in assignments:
                    assignments[var_name] = []
                assignments[var_name].append(line_num)

        # Finde Duplikate
        duplicates = {name: lines for name, lines in assignments.items() if len(lines) > 1}

        assert len(duplicates) == 0, f"Found duplicate window assignments: {duplicates}"

    def test_build_generates_valid_javascript(self):
        """
        CODE INTEGRITY: Build muss valides JavaScript generieren
        """
        dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-bundled.html'

        if not dist_file.exists():
            pytest.skip("Build file nicht gefunden")

        with open(dist_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Basic validation: Muss <script> tag haben
        assert '<script>' in content
        assert '</script>' in content

        # Muss init() Funktion haben
        assert 'function init(' in content or 'async function init(' in content

        # Darf keine offensichtlichen Syntax-Fehler haben
        # (zwei aufeinanderfolgende const/var/let mit gleichem Namen)
        lines = content.split('\n')
        prev_declarations = {}

        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith('//'):
                continue

            match = re.match(r'^(var|const|let)\s+(\w+)\s*=', stripped)
            if match:
                var_type = match.group(1)
                var_name = match.group(2)

                if var_name in prev_declarations:
                    prev_line, prev_type = prev_declarations[var_name]

                    # Allow const/let duplicates (local scopes) but not var
                    if var_type in ('const', 'let') and prev_type in ('const', 'let'):
                        # Both are block-scoped - likely different scopes, allow it
                        continue

                    # Erlaubt wenn mindestens 50 Zeilen dazwischen (verschiedene Module)
                    if i - prev_line < 50:
                        pytest.fail(
                            f"Duplicate {var_type} declaration found: {var_name} at lines {prev_line} ({prev_type}) and {i} ({var_type})"
                        )

                prev_declarations[var_name] = (i, var_type)

    def test_constants_are_available_in_build(self):
        """
        FUNCTIONALITY: Alle APP_CONFIG Konstanten müssen im Build verfügbar sein
        """
        dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-bundled.html'

        if not dist_file.exists():
            pytest.skip("Build file nicht gefunden")

        with open(dist_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Diese Konstanten müssen definiert sein
        required_constants = [
            'BACKUP_INTERVAL',
            'MAX_BACKUPS',
            'MAX_BACKUP_SIZE_MB',
            'UI_TIMING',
            'COMBAT_CONSTANTS'
        ]

        for const in required_constants:
            # Muss entweder als Definition oder als window assignment vorhanden sein
            has_definition = f'const {const} =' in content or f'var {const} =' in content
            has_window_export = f'window.{const} = {const}' in content

            assert has_definition or has_window_export, \
                f"Constant {const} is not defined or exported in build"
