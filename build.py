#!/usr/bin/env python3
"""
D&D Tracker Build Script
========================

Combines all modular JavaScript files into a single standalone HTML file.
Supports both development and production builds.

Features:
- Two-pass deduplication system to resolve window-assignment variable conflicts
  (source-level duplicate declarations are caught earlier by a pre-build check, D-05)
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

def parse_js_string_array(source_text, array_name, source_label):
    """Extrahiert die einfach quotierten String-Literale eines JS-Array-Literals.

    Strippt zeilenweise '//'-Kommentare VOR der Literal-Extraktion, damit ein
    Apostroph in einem Gruppierungskommentar den Parser nicht verfaelscht
    (Tokenizer-Robustheitsrisiko, 11-RESEARCH.md Option 2).

    Bricht mit sys.exit(1) ab, wenn das Array nicht gefunden wird oder keine
    Literale enthaelt (D-01) — statt still eine leere Liste zurueckzugeben.
    """
    stripped_text = re.sub(r'//.*$', '', source_text, flags=re.MULTILINE)
    match = re.search(rf'const {array_name}\s*=\s*\[(.*?)\];', stripped_text, re.DOTALL)
    literals = re.findall(r"'([^']+)'", match.group(1)) if match else []
    if not match or not literals:
        print(f"[FEHLER] Konnte '{array_name}'-Array nicht aus {source_label} parsen oder es ist leer")
        sys.exit(1)
    return literals


def load_module_list(loader_path):
    """Liest die Modulliste zur Build-Zeit ausschliesslich aus loader.js (D-01, SSoT).

    Es gibt ab jetzt keine zweite Liste mehr in build.py — Divergenz ist damit
    strukturell unmoeglich statt nur erkennbar.
    """
    content = read_file(loader_path)
    modules = parse_js_string_array(content, 'MODULES', loader_path)
    log.success(f"Modulliste geladen: {len(modules)} Module aus {loader_path}")
    return modules


def load_template_list(loader_path):
    """Liest die HTML-Template-Liste zur Build-Zeit ausschliesslich aus loader.js's
    funktionslokalem TEMPLATES-Array (D-01/D-04, SSoT).

    parse_js_string_array() arbeitet textbasiert (Regex), nicht auf JS-Scope-Ebene —
    deshalb findet der Anker das Array trotz seiner Deklaration innerhalb von
    loadModules() zuverlaessig. Ein spaeterer Umbau auf einen strengeren Tokenizer
    sollte diese Annahme kennen.

    TEMPLATES fuehrt vollstaendige Pfade (Praefix 'assets/templates/'), anders als
    die zuvor hartkodierte html_templates-Liste in build.py, die nur Dateinamen
    fuehrte.
    """
    content = read_file(loader_path)
    templates = parse_js_string_array(content, 'TEMPLATES', loader_path)
    log.success(f"Template-Liste geladen: {len(templates)} Templates aus {loader_path}")
    return templates


def load_css_import_order(styles_css_path):
    """Liest die CSS-Kaskadenreihenfolge zur Build-Zeit ausschliesslich aus dem
    @import-Hub assets/styles.css (D-01/D-04, SSoT).

    assets/styles.css fuehrt genau ein @import pro Zeile und keine Kommentare
    zwischen den Imports — deshalb ist keine Kommentar-Vorbehandlung noetig, anders
    als bei parse_js_string_array(). Ein leeres Ergebnis ist immer ein Fehler (D-01),
    nie eine stille leere Liste.
    """
    content = read_file(styles_css_path)
    css_files = re.findall(r"@import url\('styles/([^']+)'\);", content)
    if not css_files:
        print(f"[FEHLER] Konnte keine @import-Eintraege aus {styles_css_path} parsen oder die Liste ist leer")
        sys.exit(1)
    log.success(f"CSS-Reihenfolge geladen: {len(css_files)} Dateien aus {styles_css_path}")
    return css_files


def require_files_exist(base_dir, rel_paths, label):
    """Bricht den Build ab, wenn eine gelistete Datei fehlt (D-02).

    Es gibt im Repo keine optionalen gelisteten Dateien — ein fehlender Pfad
    ist immer ein Fehler, nie ein stiller Skip.
    """
    missing = [p for p in rel_paths if not os.path.exists(os.path.join(base_dir, p))]
    if missing:
        print(f"[FEHLER] {len(missing)} fehlende {label}-Datei(en):")
        for p in missing:
            print(f"  {label}: {p}")
        sys.exit(1)


def build_favicon_data_uri(svg_path):
    """Erzeugt einen 'data:image/svg+xml,...'-URI aus der Icon-Quelle icons/icon.svg
    zur Build-Zeit (D-10) — das Icon wird nicht dupliziert, sondern aus der
    bestehenden SVG inline gebuendelt (SSoT-Linie wie D-01/D-04).

    file://-Doppelklick auf die gebaute Einzeldatei ist der primaere Nutzungsmodus
    (PROJECT.md-Constraint) — ein relativer Datei-Link waere dort genau der 404,
    den dieser Fix schliesst. Deshalb ein Data-URI statt eines Datei-Pfads.

    Fehlt die Icon-Quelle, gilt dieselbe Linie wie D-02: [FEHLER]-Meldung und
    sys.exit(1) statt eines stillen Fallbacks.

    Encoding-Reihenfolge ist korrektheitsrelevant: '%' MUSS zuerst kodiert werden,
    sonst kodieren die nachfolgenden Ersetzungen ihre eigenen erzeugten '%xx'-Folgen
    ein zweites Mal (Doppelkodierung). Die Raute ist kein theoretischer Fall — die
    Icon-Quelle nutzt mehrfach Hex-Farbwerte (#0d0d0d, #d4af37); ohne deren Kodierung
    interpretiert der Browser sie als URI-Fragment-Identifier und der Data-URI bricht.
    """
    if not os.path.exists(svg_path):
        print(f"[FEHLER] Icon-Quelle nicht gefunden: {svg_path}")
        sys.exit(1)
    svg = read_file(svg_path)
    # HTML-Kommentarbloecke entfernen (icon.svg traegt einen mehrzeiligen
    # Erklaerkommentar, der im Data-URI nur Ballast waere)
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.DOTALL)
    # Whitespace zwischen Tags und Mehrfach-Whitespace kollabieren
    svg = re.sub(r'>\s+<', '><', svg.strip())
    svg = re.sub(r'\s+', ' ', svg)
    # Minimale Ersetzungsliste, Reihenfolge wie oben begruendet
    svg = svg.replace('"', "'")
    svg = svg.replace('%', '%25')
    svg = svg.replace('#', '%23')
    svg = svg.replace('{', '%7B')
    svg = svg.replace('}', '%7D')
    svg = svg.replace('<', '%3C')
    svg = svg.replace('>', '%3E')
    return f'data:image/svg+xml,{svg}'


def check_duplicate_functions(source_dir, modules):
    """Schlaegt fehl, wenn doppelte Top-Level-Deklarationen (function/const/let/class)
    in gebuendelten Quelldateien existieren (D-06).

    Prueft NUR die MODULES-Liste — utils/testable-utils.js und das tests/-Verzeichnis
    sind nicht Teil von MODULES und damit korrekt ausgeschlossen.

    Klammertiefen-Tracking statt Texteinrueckungs-Heuristik (dieselbe, bereits in der
    Post-Build-Validierung produktiv laufende Technik, siehe build() weiter unten):
    pro Datei wird die Klammertiefe zeilenweise mitgefuehrt und NUR auf Tiefe 0
    gegen das Deklarations-Pattern geprueft. Die Tiefe wird VOR der Aktualisierung
    ausgewertet, damit die Deklarationszeile selbst noch auf Tiefe 0 zaehlt. Das ist
    robuster gegen Formatierungsabweichungen als eine reine Einrueckungs-Heuristik,
    weil echte Verschachtelung gemessen wird statt Text-Whitespace (T-11-07).
    """
    decl_pattern = re.compile(r'^\s*(function|const|let|class)\s+(\w+)')
    seen = {}
    for module in modules:
        path = os.path.join(source_dir, module)
        if not os.path.exists(path):
            continue
        content = read_file(path)
        depth = 0
        for line in content.split('\n'):
            match = decl_pattern.match(line) if depth == 0 else None
            for ch in line:
                if ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
            if match:
                name = match.group(2)
                if name in seen:
                    print(f"[FEHLER] Doppelte Top-Level-Deklaration '{name}': {seen[name]} und {module}")
                    sys.exit(1)
                seen[name] = module


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

    Two-pass approach (D-05: der ehemalige dritte Pass, der Funktionsdeklarationen
    auskommentierte und dabei verwaiste Funktionsrumpf-Fragmente im Bundle stehen
    liess, entfaellt ersatzlos — Kollisionen werden stattdessen vor dem Buendeln
    durch check_duplicate_functions() abgefangen):
    1. Find all non-window-assignment declarations (real definitions)
    2. Remove window assignments that conflict with definitions
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

    # SSoT (D-01): Modulliste ausschliesslich aus loader.js beziehen, dann
    # sofort gegen das Dateisystem verifizieren (D-02) — vor jedem weiteren
    # Beschaffungsschritt, damit ein fehlender Pfad so frueh wie moeglich abbricht.
    loader_js_path = os.path.join(SCRIPT_DIR, 'loader.js')
    modules = load_module_list(loader_js_path)
    require_files_exist(SOURCE_DIR, modules, 'JS-Modul')

    # SSoT (D-01/D-04): Template-Liste ausschliesslich aus loader.js's TEMPLATES-
    # Array beziehen, dann sofort gegen das Dateisystem verifizieren (D-02).
    templates = load_template_list(loader_js_path)
    require_files_exist(SOURCE_DIR, templates, 'HTML-Template')

    # SSoT (D-01/D-04): CSS-Kaskadenreihenfolge ausschliesslich aus dem @import-Hub
    # assets/styles.css beziehen, dann sofort gegen das Dateisystem verifizieren
    # (D-02) — das ist dieselbe Datei, die der Dev-Modus im Browser laedt.
    styles_css_path = os.path.join(SOURCE_DIR, 'assets', 'styles.css')
    css_files = load_css_import_order(styles_css_path)
    css_styles_dir = os.path.join(SOURCE_DIR, 'assets', 'styles')
    require_files_exist(css_styles_dir, css_files, 'CSS-Datei')

    # 1. Lade CSS (modulare Dateien aus assets/styles/)
    print("\n[BUILD] Lade CSS...")
    css_parts = []
    for css_file in css_files:
        css_path = f"{SOURCE_DIR}/assets/styles/{css_file}"
        css_parts.append(read_file(css_path))
        log.info(f"  {css_file}")
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
    
    # 2. Lade HTML Body (aus Template-Dateien; Liste + Existenz bereits SSoT-
    # beschafft/geprueft ueber load_template_list()/require_files_exist() oben)
    print("\n[BUILD] Lade HTML Templates...")
    html_parts = []
    for template in templates:
        tpl_path = os.path.join(SOURCE_DIR, template)
        html_parts.append(read_file(tpl_path))
    body_content = '\n'.join(html_parts)
    log.success(f"HTML Body geladen: {len(body_content):,} Zeichen ({len(templates)} Templates)")
    
    # STAB-07: Vor dem Kombinieren — Duplikat-Check (Modullisten-Sync entfaellt,
    # SSoT-Parser oben garantiert bereits Existenz und Einzigartigkeit der Liste)
    print("\n[CHECK] Pruefe Duplikat-Funktionen...")
    check_duplicate_functions(SOURCE_DIR, modules)
    log.success("Pre-Build-Checks bestanden")

    # 3. Lade und kombiniere JavaScript
    print("\n[BUILD] Lade JavaScript-Module...")
    js_combined = ""
    total_js_size = 0

    for i, module in enumerate(modules, 1):
        module_path = f"{SOURCE_DIR}/{module}"
        module_content = read_file(module_path)
        js_combined += f"\n// ========== {module} ==========\n"
        js_combined += module_content + "\n"
        total_js_size += len(module_content)
        log.info(f"[{i}/{len(modules)}] {module}: {len(module_content):,} Zeichen")

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

    # D-10: Favicon-Data-URI zur Build-Zeit aus icons/icon.svg erzeugen. Data-URI
    # statt Datei-Link, weil file://-Doppelklick auf die gebaute Einzeldatei der
    # primaere Nutzungsmodus ist (PROJECT.md) — ein relativer Pfad waere dort
    # genau der 404, den dieser Fix schliesst.
    icon_svg_path = os.path.join(SOURCE_DIR, 'icons', 'icon.svg')
    favicon_data_uri = build_favicon_data_uri(icon_svg_path)
    log.success(f"Favicon-Data-URI erzeugt: {len(favicon_data_uri):,} Zeichen aus {icon_svg_path}")

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
    <!-- D-10: Data-URI statt Datei-Link — file://-Doppelklick auf diese Einzeldatei
         ist der primaere Nutzungsmodus, ein relativer Pfad waere hier ein 404. -->
    <link rel="icon" href="{favicon_data_uri}">
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
