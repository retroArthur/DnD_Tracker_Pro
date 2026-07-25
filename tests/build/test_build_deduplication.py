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

from build import deduplicate_window_assignments, build, check_duplicate_functions, load_module_list, require_files_exist, load_template_list, load_css_import_order

# D-07: der von Pass 3 (entfernt in D-05) erzeugte Markertext. Als Modulkonstante
# gefuehrt, damit der Literal-String genau einmal in dieser Datei steht.
DEDUP_FUNCTION_MARKER = "[DEDUP] Removed duplicate function"


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
        # (zwei aufeinanderfolgende const/var/let mit gleichem Namen auf Klammertiefe 0)
        #
        # D-06-Nachzug (WINDOWS.md Eintrag 2, 11-04): dieselbe Klammertiefen-Technik
        # wie check_duplicate_functions() (build.py) und die Post-Build-Validierung
        # in build() — eine reine Text-Heuristik ohne Tiefen-Tracking erkennt
        # funktionslokale Deklarationen (z.B. zwei unabhaengige `var el` in
        # getrennten Closures von features/bestiary/bestiary-editor.js) faelschlich
        # als Top-Level-Duplikate. Nur der <script>-Block wird gescannt, damit CSS-
        # Klammern aus dem HTML-Kopf die Tiefenzaehlung nicht verfaelschen.
        js_match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
        assert js_match, "Kein <script>-Block gefunden"
        lines = js_match.group(1).split('\n')
        prev_declarations = {}
        depth = 0

        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith('//'):
                continue

            match = re.match(r'^(var|const|let)\s+(\w+)\s*=', stripped) if depth == 0 else None

            for ch in line:
                if ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1

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

    # STAB-07: Neue Tests fuer Build-Haertung

    def test_production_build_has_debug_mode_false(self):
        """
        SECURITY: Production-Build muss DEBUG_MODE=false haben (STAB-07 T-04-01).
        Verifiziert, dass der DEBUG_MODE-Flip in build.py korrekt funktioniert.
        """
        dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-optimized.html'
        if not dist_file.exists():
            pytest.skip("Production-Build nicht gefunden — zuerst 'python build.py --production' ausfuehren")

        with open(dist_file, 'r', encoding='utf-8') as f:
            content = f.read()

        assert 'DEBUG_MODE: true' not in content, \
            "DEBUG_MODE ist noch true im Production-Build! core/config.js Formatierung pruefen."
        assert 'DEBUG_MODE: false' in content, \
            "DEBUG_MODE: false nicht im Production-Build gefunden — Flip fehlgeschlagen?"

    def test_ssot_module_list_parses_from_loader(self):
        """
        SSOT (ARCH-01/D-01): load_module_list() liefert die vollstaendige, geordnete
        Modulliste ausschliesslich aus loader.js — build.py hat keine zweite Liste mehr.
        """
        loader_path = Path(__file__).parent.parent.parent / 'loader.js'
        project_root = Path(__file__).parent.parent.parent

        modules = load_module_list(str(loader_path))

        assert len(modules) == 123, f"Erwartet 123 Module, gefunden {len(modules)}"

        # Reihenfolge muss der Reihenfolge im Datei-Text entsprechen
        loader_content = loader_path.read_text(encoding='utf-8')
        positions = [loader_content.index(f"'{m}'") for m in modules]
        assert positions == sorted(positions), "Modulreihenfolge weicht von der loader.js-Textreihenfolge ab"

        # Jeder Pfad muss relativ zum Projektwurzel-Verzeichnis existieren
        missing = [m for m in modules if not (project_root / m).exists()]
        assert missing == [], f"Fehlende Moduldateien: {missing}"

    def test_missing_module_file_aborts_build(self, tmp_path):
        """
        D-02: require_files_exist() bricht mit SystemExit ab, wenn eine gelistete
        Datei fehlt; sind alle gelisteten Dateien vorhanden, laeuft der Aufruf durch.
        """
        file_a = tmp_path / 'module-a.js'
        file_a.write_text('// exists\n', encoding='utf-8')
        # module-b.js wird absichtlich NICHT angelegt

        with pytest.raises(SystemExit):
            require_files_exist(str(tmp_path), ['module-a.js', 'module-b.js'], 'JS-Modul')

        # Positiv-Gegenprobe: legt module-b.js nachtraeglich an, jetzt ohne Exception
        file_b = tmp_path / 'module-b.js'
        file_b.write_text('// exists too\n', encoding='utf-8')
        require_files_exist(str(tmp_path), ['module-a.js', 'module-b.js'], 'JS-Modul')

    def test_build_aborts_without_writing_output_on_missing_module(self, monkeypatch):
        """
        D-02: Ein Build-Lauf, dessen Modulliste einen nicht existierenden Pfad enthaelt,
        endet mit Exit-Code != 0 UND laesst eine vorher vorhandene Ausgabedatei
        unveraendert bzw. erzeugt keine neue.
        """
        import build as build_module

        dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-bundled.html'
        existed_before = dist_file.exists()
        content_before = dist_file.read_bytes() if existed_before else None

        real_load_module_list = build_module.load_module_list

        def fake_load_module_list(loader_path):
            modules = real_load_module_list(loader_path)
            return modules + ['core/__does-not-exist__.js']

        monkeypatch.setattr(build_module, 'load_module_list', fake_load_module_list)

        with pytest.raises(SystemExit):
            build_module.build()

        if existed_before:
            assert dist_file.read_bytes() == content_before, \
                "Vorhandene Ausgabedatei wurde trotz Abbruch veraendert"
        else:
            assert not dist_file.exists(), \
                "Es wurde eine neue Ausgabedatei geschrieben, obwohl der Build abgebrochen ist"

    def test_ssot_parse_failure_aborts_build(self, tmp_path):
        """
        D-01: Ein Loader ohne MODULES-Array bricht load_module_list() mit SystemExit ab —
        kein stiller Rueckgabewert, keine leere Liste.
        """
        fake_loader = tmp_path / 'loader-no-modules.js'
        fake_loader.write_text("const OTHER_ARRAY = ['a.js', 'b.js'];\n", encoding='utf-8')

        with pytest.raises(SystemExit):
            load_module_list(str(fake_loader))

    def test_ssot_empty_array_aborts_build(self, tmp_path):
        """
        D-01: Ein leeres MODULES-Array bricht load_module_list() mit SystemExit ab.
        """
        fake_loader = tmp_path / 'loader-empty-modules.js'
        fake_loader.write_text("const MODULES = [\n];\n", encoding='utf-8')

        with pytest.raises(SystemExit):
            load_module_list(str(fake_loader))

    def test_ssot_template_list_parses_from_loader(self):
        """
        SSOT (ARCH-01/D-01/D-04): load_template_list() liefert die vollstaendige,
        geordnete Template-Liste ausschliesslich aus loader.js's TEMPLATES-Array.
        """
        loader_path = Path(__file__).parent.parent.parent / 'loader.js'
        project_root = Path(__file__).parent.parent.parent

        templates = load_template_list(str(loader_path))

        assert len(templates) == 12, f"Erwartet 12 Templates, gefunden {len(templates)}"

        # Reihenfolge muss der Reihenfolge im Datei-Text entsprechen
        loader_content = loader_path.read_text(encoding='utf-8')
        positions = [loader_content.index(f"'{t}'") for t in templates]
        assert positions == sorted(positions), "Template-Reihenfolge weicht von der loader.js-Textreihenfolge ab"

        # Jeder Pfad muss relativ zum Projektwurzel-Verzeichnis existieren
        missing = [t for t in templates if not (project_root / t).exists()]
        assert missing == [], f"Fehlende Template-Dateien: {missing}"

    def test_missing_template_file_aborts_build(self, monkeypatch):
        """
        D-02: Ein Build-Lauf, dessen Template-Liste einen nicht existierenden Pfad
        enthaelt, endet mit Exit-Code != 0 UND laesst eine vorher vorhandene
        Ausgabedatei unveraendert bzw. erzeugt keine neue.
        """
        import build as build_module

        dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-bundled.html'
        existed_before = dist_file.exists()
        content_before = dist_file.read_bytes() if existed_before else None

        real_load_template_list = build_module.load_template_list

        def fake_load_template_list(loader_path):
            templates = real_load_template_list(loader_path)
            return templates + ['assets/templates/__does-not-exist__.html']

        monkeypatch.setattr(build_module, 'load_template_list', fake_load_template_list)

        with pytest.raises(SystemExit):
            build_module.build()

        if existed_before:
            assert dist_file.read_bytes() == content_before, \
                "Vorhandene Ausgabedatei wurde trotz Abbruch veraendert"
        else:
            assert not dist_file.exists(), \
                "Es wurde eine neue Ausgabedatei geschrieben, obwohl der Build abgebrochen ist"

    def test_ssot_css_order_matches_styles_hub(self):
        """
        SSOT (ARCH-01/D-01/D-04): load_css_import_order() liefert die vollstaendige,
        geordnete CSS-Dateiliste ausschliesslich aus dem @import-Hub assets/styles.css.
        """
        styles_css_path = Path(__file__).parent.parent.parent / 'assets' / 'styles.css'
        styles_dir = Path(__file__).parent.parent.parent / 'assets' / 'styles'

        css_files = load_css_import_order(str(styles_css_path))

        assert len(css_files) == 20, f"Erwartet 20 CSS-Dateien, gefunden {len(css_files)}"
        assert css_files[0] == 'fonts.css'
        assert css_files[-1] == 'welt.css'

        # Reihenfolge muss der Reihenfolge im Datei-Text entsprechen
        styles_css_content = styles_css_path.read_text(encoding='utf-8')
        positions = [styles_css_content.index(f"styles/{c}") for c in css_files]
        assert positions == sorted(positions), "CSS-Reihenfolge weicht von der styles.css-Textreihenfolge ab"

        # Jede Datei muss unter assets/styles/ existieren
        missing = [c for c in css_files if not (styles_dir / c).exists()]
        assert missing == [], f"Fehlende CSS-Dateien: {missing}"

    def test_missing_css_file_aborts_build(self, monkeypatch):
        """
        D-02: Ein Build-Lauf, dessen CSS-Liste einen nicht existierenden Dateinamen
        enthaelt, endet mit Exit-Code != 0 UND laesst eine vorher vorhandene
        Ausgabedatei unveraendert bzw. erzeugt keine neue.
        """
        import build as build_module

        dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-bundled.html'
        existed_before = dist_file.exists()
        content_before = dist_file.read_bytes() if existed_before else None

        real_load_css_import_order = build_module.load_css_import_order

        def fake_load_css_import_order(styles_css_path):
            css_files = real_load_css_import_order(styles_css_path)
            return css_files + ['__does-not-exist__.css']

        monkeypatch.setattr(build_module, 'load_css_import_order', fake_load_css_import_order)

        with pytest.raises(SystemExit):
            build_module.build()

        if existed_before:
            assert dist_file.read_bytes() == content_before, \
                "Vorhandene Ausgabedatei wurde trotz Abbruch veraendert"
        else:
            assert not dist_file.exists(), \
                "Es wurde eine neue Ausgabedatei geschrieben, obwohl der Build abgebrochen ist"

    def test_duplicate_function_check_detects_duplicate(self, tmp_path):
        """
        DETECTION: check_duplicate_functions muss bei doppelten Top-Level-Funktionen SystemExit ausloesen (STAB-07 T-04-02).
        Simuliert das 2026-01-10-Incident-Pattern (toggleNPCCard in zwei Modulen).
        """
        # Zwei Quelldateien mit demselben Top-Level-Funktionsnamen
        file_a = tmp_path / 'module-a.js'
        file_a.write_text('function duplicateFunction() {\n    return "a";\n}\n', encoding='utf-8')
        file_b = tmp_path / 'module-b.js'
        file_b.write_text('function duplicateFunction() {\n    return "b";\n}\n', encoding='utf-8')

        fake_modules = ['module-a.js', 'module-b.js']

        # Muss SystemExit ausloesen (kein stiller Fehler)
        with pytest.raises(SystemExit):
            check_duplicate_functions(str(tmp_path), fake_modules)

    def test_duplicate_const_check_detects_duplicate(self, tmp_path):
        """
        D-06: check_duplicate_functions muss bei doppelten Top-Level-const-
        Deklarationen in zwei Quellmodulen SystemExit ausloesen.
        """
        file_a = tmp_path / 'module-a.js'
        file_a.write_text("const DUPLICATE_CONST = 1;\n", encoding='utf-8')
        file_b = tmp_path / 'module-b.js'
        file_b.write_text("const DUPLICATE_CONST = 2;\n", encoding='utf-8')

        fake_modules = ['module-a.js', 'module-b.js']

        with pytest.raises(SystemExit):
            check_duplicate_functions(str(tmp_path), fake_modules)

    def test_duplicate_class_check_detects_duplicate(self, tmp_path):
        """
        D-06: check_duplicate_functions muss bei doppelten Top-Level-class-
        Deklarationen in zwei Quellmodulen SystemExit ausloesen (real existierender
        Fall im Bestandscode: VirtualList, DOMVirtualList, SafeRender, BatchUpdater).
        """
        file_a = tmp_path / 'module-a.js'
        file_a.write_text("class DuplicateClass {\n    constructor() {}\n}\n", encoding='utf-8')
        file_b = tmp_path / 'module-b.js'
        file_b.write_text("class DuplicateClass {\n    constructor() {}\n}\n", encoding='utf-8')

        fake_modules = ['module-a.js', 'module-b.js']

        with pytest.raises(SystemExit):
            check_duplicate_functions(str(tmp_path), fake_modules)

    def test_duplicate_let_check_detects_duplicate(self, tmp_path):
        """
        D-06: check_duplicate_functions muss bei doppelten Top-Level-let-
        Deklarationen in zwei Quellmodulen SystemExit ausloesen.
        """
        file_a = tmp_path / 'module-a.js'
        file_a.write_text("let duplicateLet = 1;\n", encoding='utf-8')
        file_b = tmp_path / 'module-b.js'
        file_b.write_text("let duplicateLet = 2;\n", encoding='utf-8')

        fake_modules = ['module-a.js', 'module-b.js']

        with pytest.raises(SystemExit):
            check_duplicate_functions(str(tmp_path), fake_modules)

    def test_nested_declaration_is_not_a_duplicate(self, tmp_path):
        """
        D-06/T-11-07: Deklarationen INNERHALB einer Funktion (Klammertiefe > 0)
        duerfen den Pre-Check nicht als Kollision melden, auch wenn derselbe Name
        in zwei Modulen jeweils funktionslokal verwendet wird — Klammertiefen-
        Tracking statt Texteinruckungs-Heuristik ist robuster gegen genau diesen
        Fall (mirrort den 2026-01-10 bestiary-editor.js var-el-Befund).
        """
        file_a = tmp_path / 'module-a.js'
        file_a.write_text(
            "function helperA() {\n"
            "    const nestedName = 1;\n"
            "    return nestedName;\n"
            "}\n",
            encoding='utf-8'
        )
        file_b = tmp_path / 'module-b.js'
        file_b.write_text(
            "function helperB() {\n"
            "    const nestedName = 2;\n"
            "    return nestedName;\n"
            "}\n",
            encoding='utf-8'
        )

        fake_modules = ['module-a.js', 'module-b.js']

        # Darf NICHT abbrechen — beide Deklarationen sind funktionslokal (Tiefe > 0)
        check_duplicate_functions(str(tmp_path), fake_modules)

    def test_source_duplicate_aborts_build_without_writing_output(self, tmp_path, monkeypatch):
        """
        D-07 (zweite Haelfte der Verhaltensgarantie, ergaenzt den Marker-Regressions-
        test aus test_no_dedup_function_marker_in_bundle): ein Build-Lauf, dessen
        Modulliste zwei Quelldateien mit derselben Top-Level-const-Deklaration
        enthaelt, endet mit SystemExit UND laesst eine vorher vorhandene Ausgabedatei
        byte-identisch (bzw. erzeugt keine neue, wenn keine vorhanden war).

        Nutzt absolute tmp_path-Dateipfade als zusaetzliche Modulliste-Eintraege —
        os.path.join(SOURCE_DIR, module) verwirft SOURCE_DIR fuer einen bereits
        absoluten zweiten Pfad (Windows-Laufwerksbuchstabe), require_files_exist()
        und check_duplicate_functions() finden die Kollisionsdateien damit unabhaengig
        vom echten SOURCE_DIR. check_duplicate_functions() laeuft in build() VOR der
        JS-Ladeschleife, die absolute Pfade sonst falsch verketten wuerde.
        """
        import build as build_module

        file_a = tmp_path / 'dup-a.js'
        file_a.write_text("const SOURCE_DUPLICATE_CONST = 1;\n", encoding='utf-8')
        file_b = tmp_path / 'dup-b.js'
        file_b.write_text("const SOURCE_DUPLICATE_CONST = 2;\n", encoding='utf-8')

        dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-bundled.html'
        existed_before = dist_file.exists()
        content_before = dist_file.read_bytes() if existed_before else None

        real_load_module_list = build_module.load_module_list

        def fake_load_module_list(loader_path):
            modules = real_load_module_list(loader_path)
            return modules + [str(file_a), str(file_b)]

        monkeypatch.setattr(build_module, 'load_module_list', fake_load_module_list)

        with pytest.raises(SystemExit):
            build_module.build()

        if existed_before:
            assert dist_file.read_bytes() == content_before, \
                "Vorhandene Ausgabedatei wurde trotz Quell-Duplikat-Abbruch veraendert"
        else:
            assert not dist_file.exists(), \
                "Es wurde eine neue Ausgabedatei geschrieben, obwohl der Build wegen eines Quell-Duplikats abgebrochen ist"

    def test_no_dedup_function_marker_in_bundle(self):
        """
        D-05/D-07 Regressionstest: Der dritte Dedup-Pass (der einen Funktionskopf
        auskommentierte und dessen Rumpf verwaist im Bundle stehen liess, siehe der
        2026-01-10-Incident) existiert nicht mehr. Dieser Test verankert das —
        er verhindert eine spaetere Wiederbelebung, indem er belegt, dass der von
        Pass 3 erzeugte Markerkommentar in keinem erzeugten Bundle mehr vorkommt.

        Ersetzt test_no_orphaned_return_statements (das den jetzt unmoeglichen
        Orphan-Zustand pruefte); dies ist die erste Haelfte der D-07-Verhaltens-
        garantie (die zweite ist test_source_duplicate_aborts_build_without_writing_output).
        """
        dist_file = Path(__file__).parent.parent.parent / 'dist' / 'dnd-tracker-bundled.html'
        if not dist_file.exists():
            pytest.skip("Dev-Build nicht gefunden — zuerst 'python build.py' ausfuehren")

        with open(dist_file, 'r', encoding='utf-8') as f:
            content = f.read()

        assert DEDUP_FUNCTION_MARKER not in content, \
            f"Bundle enthaelt den Pass-3-Marker '{DEDUP_FUNCTION_MARKER}' — Pass 3 sollte entfernt sein (D-05)"
