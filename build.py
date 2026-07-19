#!/usr/bin/env python3
"""
D&D Tracker Build Script
========================

Combines all modular JavaScript files into a single standalone HTML file.
Supports both development and production builds.

Features:
- Three-pass deduplication system to resolve variable conflicts
- Optional CSS/JS/HTML minification
- Production mode: debug flags off, full minification
- Preserves module comments and structure for debugging (dev mode)

Usage:
    python build.py                # Development build (unminified)
    python build.py --minify       # Development build (minified)
    python build.py --production   # Production build (minified, debug off)

Output:
    dist/dnd-tracker-bundled.html   - Development build
    dist/dnd-tracker-optimized.html - Production build
"""

import os
import re
import sys
from pathlib import Path

# Logging importieren
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tools.logging_util import log

# Verwende das Verzeichnis, in dem das Skript liegt
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = SCRIPT_DIR

# Module in Ladereihenfolge (aus loader.js) — Modul-Level fuer Import-Barkeit in Tests
# WICHTIG: Diese Liste muss mit loader.js synchron bleiben!
MODULES = [
    'core/config.js',
    'core/data.js',
    'core/constants.js',
    'core/themes.js',
    'utils/performance.js',
    'utils/basic.js',
    'utils/utilities.js',
    'utils/crud-helpers.js',
    'utils/validation.js',
    'utils/form-helpers.js',
    'utils/filter-engine.js',
    'utils/game-rules.js',
    'systems/undo.js',
    # Spellslots-Module (ersetzt systems/spellslots.js)
    'systems/spellslots/spell-slots-core.js',
    'systems/spellslots/notes-templates.js',
    'systems/spellslots/quick-reference.js',
    'systems/spellslots/pwa-install.js',
    'systems/spellslots/version-migration.js',
    'systems/spellslots/virtual-list.js',
    'systems/spellslots/keyboard-shortcuts.js',
    'systems/spellslots/persistence.js',
    'systems/spellslots/quick-roll.js',
    'systems/spellslots/import-export.js',
    'systems/spellslots/navigation.js',
    'systems/conditions.js',
    'systems/hp-calculator.js',
    'systems/tags.js',
    'systems/entity-links.js',
    'systems/avatars.js',
    'systems/backups.js',
    'systems/tab-registry.js',
    'systems/session-timer.js',
    'systems/search/global-search.js',
    'systems/campaign-manager/campaign-manager.js',
    # Phase 2 Migrations- und Backup-Module (Welle 2 fuellt Implementierung)
    'systems/migration/full-export.js',
    'systems/migration/migration-wizard.js',
    'systems/file-backup/file-backup-permissions.js',
    'systems/file-backup/file-backup-manager.js',
    'systems/file-backup/file-backup-ui.js',
    'render/helpers.js',
    # Render-Feature-Module
    'features/render-dashboard.js',
    # Party-Module
    'features/party/party-render.js',
    'features/party/party-details.js',
    'features/party/party-crud.js',
    'features/render-spells.js',
    # Locations-Module
    'features/locations/locations-render.js',
    'features/locations/locations-crud.js',
    'features/render-loot.js',
    # NPC-Module
    'features/npcs/npc-render.js',
    'features/npcs/npc-interactions.js',
    'features/npcs/npc-dialogs.js',
    'features/npcs/npc-crud.js',
    'features/npcs/npc-popup.js',
    # Quests-Module
    'features/quests/quests-render.js',
    'features/quests/quests-crud.js',
    # Encounters-Module
    'features/encounters/encounters-render.js',
    'features/encounters/encounters-crud.js',
    # Bestiary-Module (Phase 3)
    'features/bestiary/bestiary-render.js',
    'features/bestiary/bestiary-crud.js',
    'features/bestiary/bestiary-editor.js',
    'features/bestiary/bestiary-actions.js',
    'features/initiative-statblock.js',
    # Features
    'features/encounter-calculator.js',
    'features/initiative.js',
    'features/rest-manager.js',
    'features/quick-actions.js',
    'features/random-tables.js',
    'features/loot-distribution.js',
    'features/sessions/sessions.js',
    # Phase 5: Welt & Story — Modul-Skelette (Wave 0)
    'features/session-prep/session-prep-render.js',
    'features/session-prep/session-prep-crud.js',
    # NPC-Generator (nach npc-crud.js — Abhaengigkeit)
    'features/npc-generator/npc-default-tables.js',
    'features/npc-generator/npc-generator.js',
    # Timeline/Kalender
    'features/timeline/timeline-render.js',
    'features/timeline/timeline-crud.js',
    # Reise (default-tables zuerst)
    'features/reise/reise-default-tables.js',
    'features/reise/reise-render.js',
    'features/reise/reise-crud.js',
    # Fraktionen
    'features/fraktionen/fraktionen-render.js',
    'features/fraktionen/fraktionen-crud.js',
    'features/wiki/wiki.js',
    # Shops-Module
    'features/shops/shops-core.js',
    'features/shops/shop-export.js',
    'features/shops/links.js',
    # DM Screen Module
    'features/dmscreen/dmscreen-render.js',
    # Phase 2 Command-Palette-Module (Welle 2 fuellt Implementierung)
    'features/command-palette/action-registry.js',
    'features/command-palette/command-palette.js',
    # Dice-Module
    'features/dice/dice-core.js',
    'features/dice/dice-favorites.js',

    # Phase 7: Komfort & Analyse — Soundboard + Wuerfel-Statistiken (Wave 0)
    'features/soundboard/soundboard-idb.js',
    'features/soundboard/soundboard-player.js',
    'features/soundboard/soundboard-crud.js',
    'features/soundboard/soundboard-render.js',
    'features/dice-stats/dice-stats-idb.js',
    'features/dice-stats/dice-stats-render.js',
    # Ehemals in dice/ — verschoben in passende Ordner
    'features/timers/timers.js',
    'systems/wiki-links.js',
    'features/encounters/monster-templates.js',
    'core/srd-spells.js',
    'core/srd-monsters.js',
    'systems/spellslots/spellslots-ui.js',
    'features/initiative-extras.js',
    'features/initiative-mob.js',
    'ui/layout-profiles.js',
    'utils/performance-extras.js',
    'ui/dom-builder.js',
    'ui/safe-render.js',
    'ui/lazy-loading.js',
    'ui/event-delegation.js',
    'ui/editors/rich-text.js',
    'ui/editors/markdown-shortcuts.js',
    'ui/editors/markdown-converter.js',
    'systems/markdown-import-export.js',
    # Action-Module
    'ui/actions/entity-actions.js',
    'ui/actions/combat-actions.js',
    'ui/actions/ui-actions.js',
    'ui/actions/dice-actions.js',
    'ui/actions/wiki-actions.js',
    'ui/actions/shop-actions.js',
    'ui/actions/system-actions.js',
    'ui/virtual-scroll.js',
    'tools/debug.js',
    'core/init.js'
]


def check_duplicate_functions(source_dir, modules):
    """Schlaegt fehl, wenn doppelte Top-Level-Funktionsnamen in gebuendelten Quelldateien existieren.

    Prueft NUR die MODULES-Liste — utils/testable-utils.js und das tests/-Verzeichnis
    sind nicht Teil von MODULES und damit korrekt ausgeschlossen.
    """
    func_pattern = re.compile(r'^function\s+(\w+)\s*\(', re.MULTILINE)
    seen = {}
    for module in modules:
        path = os.path.join(source_dir, module)
        if not os.path.exists(path):
            continue
        content = read_file(path)
        for match in func_pattern.finditer(content):
            name = match.group(1)
            if name in seen:
                print(f"[FEHLER] Doppelte Top-Level-Funktion '{name}': {seen[name]} und {module}")
                sys.exit(1)
            seen[name] = module


def check_module_list_sync(loader_path, build_modules):
    """Vergleicht das MODULES-Array aus loader.js mit der build.py-Liste.

    Bricht den Build ab, wenn die Listen voneinander abweichen.
    """
    content = read_file(loader_path)
    match = re.search(r'const MODULES\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        log.warning("Konnte MODULES-Array nicht aus loader.js parsen — Sync-Pruefung uebersprungen")
        return
    loader_modules = re.findall(r"'([^']+)'", match.group(1))
    build_set, loader_set = set(build_modules), set(loader_modules)
    only_in_build = build_set - loader_set
    only_in_loader = loader_set - build_set
    if only_in_build or only_in_loader:
        print("[FEHLER] Modullisten-Abweichung zwischen loader.js und build.py!")
        for m in sorted(only_in_build):
            print(f"  Nur in build.py: {m}")
        for m in sorted(only_in_loader):
            print(f"  Nur in loader.js: {m}")
        sys.exit(1)
    log.success(f"Modullisten synchron: {len(build_set)} Module")


def read_file(filepath):
    """Liest eine Datei"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    """Schreibt eine Datei"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def minify_js(js_code):
    """Sichere JS-Minifizierung: entfernt nur Leerzeilen.
    Kommentare werden NICHT entfernt, da regex-basierte Entfernung unsicher ist:
    - // Kommentare koennen URLs in Strings sein (http://)
    - /* */ Kommentare koennen Regex-Literale matchen (/<!--[\\s\\S]*?-->/g)
    - DEDUP-Platzhalter muessen erhalten bleiben"""
    # Entferne nur Leerzeilen
    js_code = re.sub(r'^\s*$\n', '', js_code, flags=re.MULTILINE)
    return js_code

def minify_css(css_code):
    """Einfache CSS-Minifizierung"""
    # Entferne Kommentare
    css_code = re.sub(r'/\*.*?\*/', '', css_code, flags=re.DOTALL)
    # Entferne Leerzeilen
    css_code = re.sub(r'^\s*$\n', '', css_code, flags=re.MULTILINE)
    # Entferne überflüssige Whitespace
    css_code = re.sub(r'\s+', ' ', css_code)
    css_code = re.sub(r'\s*{\s*', '{', css_code)
    css_code = re.sub(r'\s*}\s*', '}', css_code)
    css_code = re.sub(r'\s*:\s*', ':', css_code)
    css_code = re.sub(r'\s*;\s*', ';', css_code)
    return css_code.strip()

def minify_html(html_code):
    """Minifiziert HTML-Code (entfernt Kommentare und Whitespace).
    Schuetzt <script> und <style> Inhalte vor Whitespace-Aenderungen."""
    # Entferne HTML-Kommentare (aber nicht DOCTYPE)
    html_code = re.sub(r'<!--(?!DOCTYPE)[\s\S]*?-->', '', html_code)
    # Schuetze script/style Inhalte vor Whitespace-Minifizierung
    protected = {}
    counter = [0]
    def protect(match):
        key = f'__PROTECTED_{counter[0]}__'
        counter[0] += 1
        protected[key] = match.group(0)
        return key
    html_code = re.sub(r'(<script[^>]*>)(.*?)(</script>)', protect, html_code, flags=re.DOTALL)
    html_code = re.sub(r'(<style[^>]*>)(.*?)(</style>)', protect, html_code, flags=re.DOTALL)
    # Minifiziere nur den HTML-Teil
    html_code = re.sub(r'\s+', ' ', html_code)
    html_code = re.sub(r'>\s+<', '><', html_code)
    # Stelle script/style Inhalte wieder her
    for key, value in protected.items():
        html_code = html_code.replace(key, value)
    return html_code.strip()

def deduplicate_window_assignments(js_code):
    """
    Entfernt duplizierte Variablen-Deklarationen.

    Three-pass approach:
    1. Find all non-window-assignment declarations (real definitions)
    2. Remove window assignments that conflict with definitions
    3. Remove duplicate function declarations
    """
    lines = js_code.split('\n')

    # PASS 1: Find real definitions (NOT window assignments)
    # Pattern allows optional comments at end of line
    window_assignment_pattern = r'^(var|const|let)\s+(\w+)\s*=\s*window\.(\2)\s*;?\s*(//.*)?$'
    declaration_pattern = r'^(var|const|let)\s+(\w+)\s*='

    real_definitions = set()

    for line in lines:
        stripped = line.strip()
        # Skip comments
        if stripped.startswith('//'):
            continue

        # Check if it's a window assignment
        if re.match(window_assignment_pattern, stripped):
            continue

        # Check if it's any other declaration
        match = re.match(declaration_pattern, stripped)
        if match:
            var_name = match.group(2)
            real_definitions.add(var_name)

    log.info(f"Pass 1: {len(real_definitions)} real definitions found")

    # PASS 2: Remove window assignments that conflict or are duplicated
    filtered_lines = []
    removed_count = 0
    seen_window_assigns = set()

    for line in lines:
        stripped = line.strip()

        # Skip empty lines and already-commented lines
        if not stripped or stripped.startswith('//'):
            filtered_lines.append(line)
            continue

        match = re.match(window_assignment_pattern, stripped)
        if match:
            var_type = match.group(1)
            var_name = match.group(2)

            # Remove if:
            # 1. Already seen this window assignment (duplicate)
            # 2. Conflicts with a real definition
            if var_name in seen_window_assigns:
                removed_count += 1
                filtered_lines.append(f"// [DEDUP] Removed duplicate window assignment: {var_name}")
                continue

            if var_name in real_definitions:
                removed_count += 1
                filtered_lines.append(f"// [DEDUP] Removed conflicting window assignment: {var_name}")
                continue

            seen_window_assigns.add(var_name)
            filtered_lines.append(line)
        else:
            filtered_lines.append(line)

    log.info(f"Pass 2: {removed_count} window assignment conflicts removed")

    # PASS 3: Remove duplicate function declarations
    js_after_pass2 = '\n'.join(filtered_lines)
    js_final = remove_duplicate_functions(js_after_pass2)

    return js_final

def remove_duplicate_functions(js_code):
    """
    Removes duplicate function declarations.
    Keeps first occurrence, comments out duplicates.
    """
    lines = js_code.split('\n')
    function_pattern = r'^function\s+(\w+)\s*\('

    seen_functions = {}
    filtered_lines = []
    removed_count = 0

    for line_num, line in enumerate(lines):
        stripped = line.strip()

        if stripped.startswith('//'):
            filtered_lines.append(line)
            continue

        match = re.match(function_pattern, stripped)
        if match:
            func_name = match.group(1)

            if func_name in seen_functions:
                # Duplicate function - comment it out
                removed_count += 1
                filtered_lines.append(f"// [DEDUP] Removed duplicate function: {func_name}")

                # Find function body and comment it out too
                brace_count = 0
                in_function = False
                for i in range(line_num, len(lines)):
                    current_line = lines[i]
                    if '{' in current_line:
                        in_function = True
                        brace_count += current_line.count('{')
                    if '}' in current_line:
                        brace_count -= current_line.count('}')

                    if in_function and brace_count == 0:
                        # Found end of function
                        break
                continue
            else:
                seen_functions[func_name] = line_num
                filtered_lines.append(line)
        else:
            filtered_lines.append(line)

    if removed_count > 0:
        log.info(f"Pass 3: {removed_count} duplicate functions removed")

    return '\n'.join(filtered_lines)

def build(minify=False, production=False, verbose=False):
    """Erstellt die gebündelte HTML-Datei"""
    if production:
        minify = True  # Production impliziert Minifizierung
    if verbose:
        log.set_verbose(True)

    mode = "Production" if production else "Development"
    output_file = os.path.join(SCRIPT_DIR, 'dist',
        'dnd-tracker-optimized.html' if production else 'dnd-tracker-bundled.html')

    log.header(f"D&D Tracker Build ({mode})")
    log.info("🔨 Starte Build-Prozess...")
    log.info(f"Quelle: {SOURCE_DIR}")
    log.info(f"Ziel: {output_file}")
    log.info(f"Modus: {mode}")
    log.info(f"Minifizierung: {'Aktiviert' if minify else 'Deaktiviert'}")

    # Nutze die Modul-Level MODULES-Konstante (importierbar fuer Tests)
    modules = MODULES

    # 1. Lade CSS (modulare Dateien aus assets/styles/)
    print("\n[BUILD] Lade CSS...")
    css_files = [
        'fonts.css',
        'variables.css', 'core.css', 'editors.css',
        'npcs.css', 'encounters.css', 'initiative.css',
        'loot.css', 'spells.css', 'party.css',
        'dashboard.css', 'dmscreen.css', 'dice.css',
        'tools.css',
        'pwa.css', 'migration.css', 'file-backup.css', 'command-palette.css',
        'bestiary.css',
        'welt.css'
    ]
    css_parts = []
    for css_file in css_files:
        css_path = f"{SOURCE_DIR}/assets/styles/{css_file}"
        if os.path.exists(css_path):
            css_parts.append(read_file(css_path))
            log.info(f"  {css_file}")
        else:
            log.warning(f"  {css_file} NICHT GEFUNDEN")
    css_content = '\n'.join(css_parts)
    # CR-08: Relative url()-Pfade aus assets/styles/fonts.css fuer das Inlining
    # umschreiben. Inline-<style> loest gegen die DOKUMENT-URL auf, nicht mehr
    # gegen assets/styles/ — '../fonts/' zeigte damit eine Ebene UEBER das
    # App-Verzeichnis (404 in jedem dist-Build). Ziel: ./assets/fonts/ relativ
    # zur HTML-Datei (Deploy legt assets/fonts/ daneben, siehe ci.yml).
    css_content = css_content.replace("url('../fonts/", "url('./assets/fonts/")
    if minify:
        log.info("Minifiziere CSS...")
        css_content = minify_css(css_content)
    log.success(f"CSS geladen: {len(css_content):,} Zeichen ({len(css_files)} Dateien)")
    
    # 2. Lade HTML Body (aus Template-Dateien)
    print("\n[BUILD] Lade HTML Templates...")
    html_templates = [
        'header.html', 'view-party.html', 'view-content.html',
        'view-encounters.html', 'view-bestiary.html', 'view-resources.html', 'view-tools.html',
        'view-welt.html',
        'modals-entity.html', 'modals-shops.html', 'modals-tools.html',
        'modals-editors.html'
    ]
    html_parts = []
    for tf in html_templates:
        tpl_path = f"{SOURCE_DIR}/assets/templates/{tf}"
        html_parts.append(read_file(tpl_path))
    body_content = '\n'.join(html_parts)
    log.success(f"HTML Body geladen: {len(body_content):,} Zeichen ({len(html_templates)} Templates)")
    
    # STAB-07: Vor dem Kombinieren — Modullisten-Sync und Duplikat-Check
    print("\n[CHECK] Pruefe Modullisten-Sync und Duplikat-Funktionen...")
    loader_js_path = os.path.join(SCRIPT_DIR, 'loader.js')
    check_module_list_sync(loader_js_path, MODULES)
    check_duplicate_functions(SOURCE_DIR, MODULES)
    log.success("Pre-Build-Checks bestanden")

    # 3. Lade und kombiniere JavaScript
    print("\n[BUILD] Lade JavaScript-Module...")
    js_combined = ""
    total_js_size = 0
    
    for i, module in enumerate(modules, 1):
        module_path = f"{SOURCE_DIR}/{module}"
        if os.path.exists(module_path):
            module_content = read_file(module_path)
            js_combined += f"\n// ========== {module} ==========\n"
            js_combined += module_content + "\n"
            total_js_size += len(module_content)
            log.info(f"[{i}/{len(modules)}] {module}: {len(module_content):,} Zeichen")
        else:
            log.warning(f"[{i}/{len(modules)}] {module} NICHT GEFUNDEN")

    # CRITICAL: Dedupliziere window-Zuweisungen BEFORE minification
    print("\n[BUILD] Dedupliziere window-Zuweisungen...")
    original_size = len(js_combined)
    js_combined = deduplicate_window_assignments(js_combined)
    dedupe_saved = original_size - len(js_combined)
    log.success(f"Deduplizierung: {dedupe_saved:,} Zeichen gespart")

    # Production: Setze Debug-Flags auf false
    if production:
        print("\n[PROD] Setze Debug-Flags fuer Production...")
        js_combined = js_combined.replace("DEBUG_MODE: true,", "DEBUG_MODE: false,", 1)
        js_combined = js_combined.replace("DEBUG_VALIDATE_ON_SAVE: true,", "DEBUG_VALIDATE_ON_SAVE: false,", 1)
        # STAB-07: Abbruch, falls der Flip fehlschlug (z.B. nach Prettier-Reformatierung von core/config.js)
        if "DEBUG_MODE: true" in js_combined:
            print("[ABORTED] DEBUG_MODE ist noch true im Production-Build! core/config.js Formatierung pruefen.")
            sys.exit(1)
        log.success("DEBUG_MODE deaktiviert und verifiziert.")

    # Production (T-02-04): Bump CACHE_VERSION in bundled JS mit version+timestamp,
    # damit jeder Deploy den SW-Cache invalidiert (Pitfall 5).
    # sw.js wird nicht in den Bundle eingebunden — das dist/-Verzeichnis braucht
    # eine separate Kopie mit gebumpter Version. Wir patchen CACHE_VERSION im
    # kombinierten JS (falls pwa-install.js oder ein anderes Modul den Wert referenziert)
    # UND speichern den Wert für den späteren sw.js-Schreibschritt.
    if production:
        import re as _re, datetime as _dt
        # Lese VERSION aus core/config.js
        config_path = os.path.join(SOURCE_DIR, 'core', 'config.js')
        app_version = '2.6.1'  # Fallback
        try:
            config_src = read_file(config_path)
            vm = _re.search(r"VERSION:\s*'([^']+)'", config_src)
            if vm:
                app_version = vm.group(1)
        except Exception:
            pass
        timestamp = _dt.datetime.utcnow().strftime('%Y%m%d%H%M')
        bumped_cache_version = f'dnd-tracker-v{app_version}-{timestamp}'
        print(f"\n[PROD] CACHE_VERSION bump: dnd-tracker-v3 -> {bumped_cache_version}")
        # Patch CACHE_VERSION in kombiniertem JS (falls enthalten)
        js_combined = js_combined.replace("'dnd-tracker-v3'", f"'{bumped_cache_version}'", 1)
        # Schreibe gepatchte sw.js nach dist/
        dist_dir = os.path.join(SCRIPT_DIR, 'dist')
        os.makedirs(dist_dir, exist_ok=True)
        sw_src_path = os.path.join(SCRIPT_DIR, 'sw.js')
        sw_dst_path = os.path.join(dist_dir, 'sw.js')
        try:
            sw_src = read_file(sw_src_path)
            sw_patched = sw_src.replace("'dnd-tracker-v3'", f"'{bumped_cache_version}'", 1)
            write_file(sw_dst_path, sw_patched)
            log.success(f"sw.js nach dist/ kopiert (CACHE_VERSION={bumped_cache_version})")
        except Exception as e:
            log.warning(f"sw.js konnte nicht nach dist/ kopiert werden: {e}")

    if minify:
        print("\n[MINIFY] Minifiziere JavaScript...")
        original_size = len(js_combined)
        js_combined = minify_js(js_combined)
        saved = original_size - len(js_combined)
        log.success(f"Gespart: {saved:,} Zeichen ({saved/original_size*100:.1f}%)")
    
    print(f"\n[OK] JavaScript kombiniert: {len(js_combined):,} Zeichen")
    
    # 4. Erstelle finale HTML-Datei
    print("\n[BUILD] Erstelle finale HTML-Datei...")
    
    html_template = f"""<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#0d0d0d">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="D&D Tracker">
    <meta name="description" content="D&D Kampagnen-Tracker Pro - Modulare Version (Gebündelt)">
    <title>D&D Kampagnen-Tracker Pro</title>
    <!-- PWA-Manifest wird zur Laufzeit nur unter http/https injiziert (core/init.js registerServiceWorker) —
         als statischer <link> würde es unter file:// per CORS (origin 'null') rote Konsolenfehler werfen. -->
    <!-- Fonts lokal gebündelt via assets/styles/fonts.css (D-07) — kein Google-Fonts-CDN mehr -->
    <style>
{css_content}
    </style>
</head>
<body>
{body_content}
<script>
{js_combined}

// Manuelle Initialisierung nach dem Laden aller Module
if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', () => {{
        if (typeof init === 'function') {{
            init().catch(err => console.error('Init error:', err));
        }}
    }});
}} else {{
    if (typeof init === 'function') {{
        init().catch(err => console.error('Init error:', err));
    }}
}}
</script>
</body>
</html>"""
    
    # Production: Minifiziere das gesamte HTML
    if production:
        print("\n[MINIFY] Minifiziere HTML...")
        original_html_size = len(html_template)
        html_template = minify_html(html_template)
        saved = original_html_size - len(html_template)
        log.success(f"HTML minifiziert: {saved:,} Zeichen gespart ({saved/original_html_size*100:.1f}%)")

    # Post-Build-Validierung: Pruefe auf bekannte Build-Breaker
    print("\n[VALIDATE] Pruefe Build-Integritaet...")
    build_errors = []

    # 1. Pruefe ob HTML-Tags im JS-Block stehen (Browser interpretiert sie als echtes HTML)
    js_match = re.search(r'<script>(.*?)</script>', html_template, re.DOTALL)
    if js_match:
        js_in_html = js_match.group(1)
        dangerous_tags = {
            '</script>': 'Schliesst das Script-Tag vorzeitig',
            '</style>': 'Kann CSS-Parsing brechen',
            '</body>': 'Beendet den Body vorzeitig',
            '</html>': 'Beendet das Dokument vorzeitig',
        }
        for tag, desc in dangerous_tags.items():
            if tag in js_in_html:
                build_errors.append(f"KRITISCH: '{tag}' im JavaScript gefunden - {desc}")

        # 2. Pruefe ob JS auf zu wenige Zeilen kollabiert ist (Kommentare werden zu Inline-Kommentaren)
        js_lines = js_in_html.split('\n')
        if len(js_lines) < 100 and len(js_in_html) > 100000:
            build_errors.append(f"KRITISCH: JavaScript hat nur {len(js_lines)} Zeilen bei {len(js_in_html)} Zeichen - Kommentare schneiden Code ab")

        # 3. Pruefe auf doppelte Top-Level const/let/function Deklarationen
        depth = 0
        top_decls = {}
        for i, line in enumerate(js_lines, 1):
            for ch in line:
                if ch == '{': depth += 1
                elif ch == '}': depth -= 1
            if depth == 0:
                m = re.match(r'^\s*(const|let|function)\s+(\w+)', line)
                if m:
                    name = m.group(2)
                    if name in top_decls:
                        build_errors.append(f"FEHLER: Doppelte Deklaration '{name}' auf Zeile {top_decls[name]} und {i}")
                    else:
                        top_decls[name] = i
                m2 = re.match(r'^\s*var\s+(\w+)\s*=', line)
                if m2 and m2.group(1) in top_decls:
                    build_errors.append(f"FEHLER: 'var {m2.group(1)}' (Zeile {i}) kollidiert mit Deklaration auf Zeile {top_decls[m2.group(1)]}")

    if build_errors:
        print(f"\n[ERROR] {len(build_errors)} Build-Fehler gefunden:")
        for err in build_errors:
            print(f"   ❌ {err}")
        print("\n[ABORTED] Build NICHT geschrieben! Bitte Fehler beheben.")
        sys.exit(1)
    else:
        log.success("Alle Validierungen bestanden")

    # Schreibe finale Datei
    write_file(output_file, html_template)

    # Statistiken
    final_size = len(html_template)
    print(f"\n[SUCCESS] Build abgeschlossen! ({mode})")
    log.info(f"Datei: {output_file}")
    log.info(f"Größe: {final_size:,} Zeichen ({final_size/1024/1024:.2f} MB)")
    print(f"\n[INFO] Komponenten:")
    print(f"   CSS:        {len(css_content):>10,} Zeichen")
    print(f"   HTML Body:  {len(body_content):>10,} Zeichen")
    print(f"   JavaScript: {len(js_combined):>10,} Zeichen")
    print(f"   {'-' * 40}")
    print(f"   Total:      {final_size:>10,} Zeichen")

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='D&D Tracker Build Script')
    parser.add_argument('--minify', action='store_true', help='Minifiziere CSS und JS')
    parser.add_argument('--production', action='store_true', help='Production-Build (minifiziert, Debug aus)')
    args = parser.parse_args()

    build(minify=args.minify, production=args.production)
