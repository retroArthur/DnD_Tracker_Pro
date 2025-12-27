#!/usr/bin/env python3
"""
Production Build für D&D Tracker
- Debug-Code entfernen
- JavaScript minifizieren
- CSS minifizieren
- Bundle-Größe optimieren
"""

import os
import re
import sys
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = SCRIPT_DIR
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'dist')

# Module die im Production-Build AUSGESCHLOSSEN werden
EXCLUDE_MODULES = [
    'debug',  # Debug-Funktionen
]

# Module in korrekter Ladereihenfolge
MODULES = [
    # Core
    'core/config.js',
    'core/data.js',
    'core/constants.js',
    
    # Utils
    'utils/performance.js',
    'utils/basic.js',
    'utils/utilities.js',
    
    # Systems
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
    
    # Render
    'render/helpers.js',
    
    # Features
    'features/render-dashboard.js',
    'features/render-party.js',
    'features/render-spells.js',
    'features/render-locations.js',
    'features/render-loot.js',
    'features/render-npcs.js',
    'features/render-quests.js',
    'features/render-encounters.js',
    'features/encounter-calculator.js',
    'features/initiative.js',
    # Shops-Module (ersetzt features/shops.js)
    'features/shops/shops-core.js',
    'features/shops/spell-editor.js',
    'features/shops/sessions.js',
    'features/shops/wiki.js',
    'features/shops/links.js',
    'features/shops/mindmap.js',
    # Dice-Module (ohne debug.js für Production)
    'features/dice/dice-core.js',
    'features/dice/dice-favorites.js',
    'features/dice/timers.js',
    'features/dice/campaign-manager.js',
    'features/dice/global-search.js',
    'features/dice/maps.js',
    'features/dice/wiki-links.js',
    'features/dice/monster-templates.js',
    'features/dice/srd-spells.js',
    'features/dice/spellslots-ui.js',
    'features/dice/initiative-extras.js',
    'features/dice/theme.js',
    'features/dice/layout-profiles.js',
    'features/dice/session-timer.js',
    'features/dice/performance-extras.js',
    # debug.js wird NICHT in Production geladen
    
    # UI
    'ui/dom-builder.js',
    'ui/safe-render.js',
    'ui/virtual-scroll-helper.js',
    'ui/lazy-loading.js',
    'ui/event-delegation.js',
    'ui/virtual-scroll.js',
    
    # Init (muss zuletzt)
    'core/init.js',
]

def read_file(path):
    """Liest eine Datei"""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def minify_js(js_code):
    """JavaScript-Minifizierung (sicher)"""
    # Entferne mehrzeilige Kommentare
    js_code = re.sub(r'/\*[\s\S]*?\*/', '', js_code)
    
    # Entferne einzeilige Kommentare (aber nicht URLs und String-Literale)
    js_code = re.sub(r'(?<![:\'\"])//[^\n]*', '', js_code)
    
    # Entferne leere Zeilen und mehrfache Zeilenumbrüche
    js_code = re.sub(r'\n\s*\n+', '\n', js_code)
    
    # Entferne führende Whitespaces
    js_code = re.sub(r'^\s+', '', js_code, flags=re.MULTILINE)
    
    return js_code.strip()

def minify_html(html_code):
    """HTML-Minifizierung"""
    # Entferne HTML-Kommentare
    html_code = re.sub(r'<!--[\s\S]*?-->', '', html_code)
    
    # Entferne mehrfache Whitespaces
    html_code = re.sub(r'\s+', ' ', html_code)
    
    # Entferne Whitespace um Tags
    html_code = re.sub(r'>\s+<', '><', html_code)
    
    return html_code.strip()

def minify_css(css_code):
    """Einfache CSS-Minifizierung"""
    # Entferne Kommentare
    css_code = re.sub(r'/\*[\s\S]*?\*/', '', css_code)
    
    # Entferne mehrfache Leerzeilen
    css_code = re.sub(r'\n\s*\n', '\n', css_code)
    
    # Entferne Leerzeichen um bestimmte Zeichen
    css_code = re.sub(r'\s*{\s*', '{', css_code)
    css_code = re.sub(r'\s*}\s*', '}', css_code)
    css_code = re.sub(r'\s*;\s*', ';', css_code)
    css_code = re.sub(r'\s*:\s*', ':', css_code)
    css_code = re.sub(r'\s*,\s*', ',', css_code)
    
    return css_code.strip()

def remove_debug_code(js_code):
    """Entfernt Debug-Code aus JavaScript"""
    # Entferne console.log/debug/info Statements (behalte console.error und console.warn für Fehler)
    js_code = re.sub(r'console\.(log|debug|info)\([^;]*\);?\s*', '', js_code)
    
    # Entferne debugLogAdd Aufrufe
    js_code = re.sub(r'debugLogAdd\([^;]*\);?\s*', '', js_code)
    
    # Entferne Debug-Variablen und ihre Verwendung
    js_code = re.sub(r'let debugLog = \[\];?\s*', '', js_code)
    
    # Entferne ganze DEBUG-Sektionen mit ihren Funktionen
    # Pattern: // DEBUG & TEST ... bis zum nächsten Hauptsektions-Marker
    js_code = re.sub(
        r'// DEBUG & TEST FUNKTIONEN\s*\n// =+\s*\n[\s\S]*?(?=\n// [A-Z][A-Z\s&]+ *\n// =+|\Z)',
        '\n// [DEBUG CODE REMOVED FOR PRODUCTION]\n',
        js_code
    )
    
    return js_code

def get_version():
    """Liest Version aus config.js"""
    config_path = os.path.join(SOURCE_DIR, 'core', 'config.js')
    if os.path.exists(config_path):
        content = read_file(config_path)
        match = re.search(r"VERSION:\s*['\"]([^'\"]+)['\"]", content)
        if match:
            return match.group(1)
    return "2.4.0"

def build_production():
    """Erstellt optimiertes Production-Bundle"""
    print("🔨 D&D Tracker - Production Build")
    print("=" * 50)
    
    version = get_version()
    print(f"📦 Version: {version}")
    
    # CSS laden und minifizieren
    print("\n📄 CSS verarbeiten...")
    
    # Prüfe ob gepurgtes CSS existiert und neuer ist
    css_path = os.path.join(SOURCE_DIR, 'assets', 'styles.css')
    css_purged_path = os.path.join(SOURCE_DIR, 'assets', 'styles-purged.css')
    
    if os.path.exists(css_purged_path):
        css_content = read_file(css_purged_path)
        print(f"   Verwende gepurgtes CSS")
    else:
        css_content = read_file(css_path)
        print(f"   Verwende Original-CSS (führe tools/purge-css.py aus für Optimierung)")
    
    original_css_size = len(css_content)
    css_minified = minify_css(css_content)
    print(f"   Größe: {original_css_size:,} Bytes")
    print(f"   Minifiziert: {len(css_minified):,} Bytes ({100-len(css_minified)*100//original_css_size}% gespart)")
    
    # HTML Body laden und minifizieren
    print("\n📄 HTML Body laden...")
    html_path = os.path.join(SOURCE_DIR, 'assets', 'body.html')
    html_content = read_file(html_path)
    original_html_size = len(html_content)
    html_minified = minify_html(html_content)
    print(f"   Original: {original_html_size:,} Bytes")
    print(f"   Minifiziert: {len(html_minified):,} Bytes ({100-len(html_minified)*100//original_html_size}% gespart)")
    
    # JavaScript-Module laden und kombinieren
    print("\n📄 JavaScript-Module laden...")
    js_parts = []
    total_original_size = 0
    modules_loaded = 0
    modules_skipped = 0
    
    for module_path in MODULES:
        full_path = os.path.join(SOURCE_DIR, module_path)
        
        if not os.path.exists(full_path):
            print(f"   ⚠️  Nicht gefunden: {module_path}")
            continue
        
        # Prüfe ob Modul ausgeschlossen werden soll
        module_name = os.path.basename(module_path).replace('.js', '')
        if module_name in EXCLUDE_MODULES:
            print(f"   ⏭️  Übersprungen (Debug): {module_path}")
            modules_skipped += 1
            continue
        
        content = read_file(full_path)
        original_size = len(content)
        total_original_size += original_size
        
        # Debug-Code entfernen
        content = remove_debug_code(content)
        
        js_parts.append(f"// === {module_path} ===")
        js_parts.append(content)
        modules_loaded += 1
        
        savings = original_size - len(content)
        if savings > 100:
            print(f"   ✅ {module_path}: {original_size:,} → {len(content):,} Bytes ({savings:,} gespart)")
        else:
            print(f"   ✅ {module_path}: {original_size:,} Bytes")
    
    # JavaScript kombinieren und minifizieren
    combined_js = '\n\n'.join(js_parts)
    js_minified = minify_js(combined_js)
    
    # Stub-Funktionen für entfernte Debug-Features hinzufügen
    debug_stubs = """
// Production Stubs für entfernte Debug-Funktionen
function showDebugModal() { showToast('Debug-Modus deaktiviert in Production', 'info'); }
function debugLogAdd() {}
function renderDebugLog() {}
let debugLog = [];
"""
    js_minified = debug_stubs + js_minified
    
    print(f"\n📊 JavaScript-Zusammenfassung:")
    print(f"   Module geladen: {modules_loaded}")
    print(f"   Module übersprungen: {modules_skipped}")
    print(f"   Original gesamt: {total_original_size:,} Bytes")
    print(f"   Nach Optimierung: {len(js_minified):,} Bytes")
    print(f"   Ersparnis: {total_original_size - len(js_minified):,} Bytes ({(total_original_size - len(js_minified)) * 100 // total_original_size}%)")
    
    # HTML zusammenbauen
    final_html = f'''<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D&D Session Tracker Pro v{version}</title>
    <style>
{css_minified}
    </style>
</head>
<body>
{html_minified}
    <script>
{js_minified}
    </script>
</body>
</html>'''
    
    # Ausgabeverzeichnis erstellen
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Production-Bundle schreiben
    output_path = os.path.join(OUTPUT_DIR, 'dnd-tracker-production.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_html)
    
    final_size = len(final_html)
    
    print(f"\n✅ Production-Build erstellt:")
    print(f"   {output_path}")
    print(f"   Größe: {final_size:,} Bytes ({final_size/1024:.1f} KB)")
    
    # Vergleich mit normalem Build
    normal_build = os.path.join(OUTPUT_DIR, 'dnd-tracker-bundled.html')
    if os.path.exists(normal_build):
        normal_size = os.path.getsize(normal_build)
        savings = normal_size - final_size
        print(f"\n📉 Vergleich mit normalem Build:")
        print(f"   Normal: {normal_size:,} Bytes ({normal_size/1024:.1f} KB)")
        print(f"   Production: {final_size:,} Bytes ({final_size/1024:.1f} KB)")
        print(f"   Ersparnis: {savings:,} Bytes ({savings*100//normal_size}%)")
    
    return output_path

if __name__ == '__main__':
    build_production()
