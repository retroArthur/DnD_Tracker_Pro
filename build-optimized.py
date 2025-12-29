#!/usr/bin/env python3
"""
Optimiertes Build-Skript mit Minifizierung
Reduziert Bundle-Größe durch HTML/CSS/JS-Minifizierung
"""

import os
import re
import subprocess

# Konfiguration
SOURCE_DIR = '/mnt/user-data/outputs/dnd-tracker-modular'
OUTPUT_DIR = f'{SOURCE_DIR}/dist'
OUTPUT_FILE = f'{OUTPUT_DIR}/dnd-tracker-optimized.html'

# Module in Lade-Reihenfolge
MODULES = [
    # Core (4 Module)
    'core/config.js',
    'core/constants.js',
    'core/data.js',
    'core/storage.js',
    
    # Utils (3 Module)
    'utils/basic.js',
    'utils/performance.js',
    'utils/utilities.js',
    
    # Systems (18 Module)
    'systems/undo.js',
    'systems/backups.js',
    'systems/tags.js',
    'systems/entity-links.js',
    'systems/conditions.js',
    'systems/hp-calculator.js',
    'systems/avatars.js',
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
    
    # Render (1 Modul)
    'render/helpers.js',
    
    # Features - Render Module (8 Module)
    'features/render-dashboard.js',
    'features/render-party.js',
    'features/render-spells.js',
    'features/render-locations.js',
    'features/render-loot.js',
    'features/render-npcs.js',
    'features/render-quests.js',
    'features/render-encounters.js',
    
    # Features - Other (3 Module)
    'features/encounter-calculator.js',
    'features/initiative.js',
    'features/shops.js',
    'features/dice.js',
    
    # UI (4 Module)
    'ui/virtual-scroll-helper.js',
    'ui/lazy-loading.js',
    'ui/event-delegation.js',
    'ui/virtual-scroll.js',
    
    # Init (1 Modul)
    'core/init.js',
]

def minify_js(js_code):
    """Minifiziert JavaScript-Code - konservativ um Fehler zu vermeiden"""
    
    # Entferne Kommentare (// am Zeilenanfang oder nach Whitespace)
    lines = js_code.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Entferne // Kommentare (aber nur wenn // am Anfang steht oder nach Whitespace)
        line = re.sub(r'^\s*//.*$', '', line)  # Ganze Zeile ist Kommentar
        line = re.sub(r'\s+//(?![:/]).*$', '', line)  # Kommentar am Ende (aber nicht http:// oder https://)
        
        # Behalte die Zeile wenn sie nicht leer ist
        if line.strip():
            cleaned_lines.append(line)
    
    js_code = '\n'.join(cleaned_lines)
    
    # Entferne /* */ Kommentare (vorsichtig)
    js_code = re.sub(r'/\*[\s\S]*?\*/', '', js_code)
    
    # Entferne mehrfache Leerzeilen (aber behalte die Zeilenstruktur)
    js_code = re.sub(r'\n\s*\n\s*\n', '\n\n', js_code)
    
    return js_code

def minify_css(css_code):
    """Minifiziert CSS-Code"""
    
    # Entferne Kommentare
    css_code = re.sub(r'/\*[\s\S]*?\*/', '', css_code)
    
    # Entferne Whitespace
    css_code = re.sub(r'\s+', ' ', css_code)
    css_code = re.sub(r'\s*([{}:;,])\s*', r'\1', css_code)
    
    # Entferne letzte Semikolons vor }
    css_code = re.sub(r';\s*}', '}', css_code)
    
    return css_code.strip()

def minify_html(html_code):
    """Minifiziert HTML-Code"""
    
    # Entferne Kommentare (aber nicht <!-- DOCTYPE -->)
    html_code = re.sub(r'<!--(?!DOCTYPE)[\s\S]*?-->', '', html_code)
    
    # Entferne mehrfache Leerzeichen
    html_code = re.sub(r'\s+', ' ', html_code)
    
    # Entferne Whitespace zwischen Tags
    html_code = re.sub(r'>\s+<', '><', html_code)
    
    return html_code.strip()

def build():
    """Erstellt optimierte Bundle-Datei"""
    
    print("🚀 Starte optimierten Build-Prozess...\n")
    
    # Erstelle Output-Verzeichnis
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. Lade CSS
    print("📦 Lade CSS...")
    css_file = f'{SOURCE_DIR}/assets/styles.css'
    with open(css_file, 'r', encoding='utf-8') as f:
        css_content = f.read()
    
    print(f"   Original: {len(css_content):,} Zeichen")
    css_content = minify_css(css_content)
    print(f"   Minified: {len(css_content):,} Zeichen (↓{100 - len(css_content)*100//264704:.0f}%)")
    
    # 2. Lade HTML Body
    print("\n📦 Lade HTML Body...")
    body_file = f'{SOURCE_DIR}/assets/body.html'
    with open(body_file, 'r', encoding='utf-8') as f:
        body_content = f.read()
    
    print(f"   Original: {len(body_content):,} Zeichen")
    body_content = minify_html(body_content)
    print(f"   Minified: {len(body_content):,} Zeichen (↓{100 - len(body_content)*100//255661:.0f}%)")
    
    # 3. Kombiniere JavaScript-Module
    print("\n📦 Kombiniere JavaScript-Module...")
    js_parts = []
    total_original_size = 0
    
    for i, module_path in enumerate(MODULES, 1):
        full_path = f'{SOURCE_DIR}/{module_path}'
        
        if not os.path.exists(full_path):
            print(f"⚠️  [{i}/{len(MODULES)}] {module_path} nicht gefunden!")
            continue
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_size = len(content)
        total_original_size += original_size
        
        js_parts.append(content)
        print(f"✓ [{i}/{len(MODULES)}] {module_path:45s} ({original_size:7,} Zeichen)")
    
    js_combined = '\n'.join(js_parts)
    print(f"\n   Original JS: {len(js_combined):,} Zeichen")
    
    # 4. Minifiziere JavaScript
    print("\n🔧 Minifiziere JavaScript...")
    js_minified = minify_js(js_combined)
    print(f"   Minified JS: {len(js_minified):,} Zeichen (↓{100 - len(js_minified)*100//len(js_combined):.0f}%)")
    
    # 5. Erstelle finale HTML-Datei
    print("\n📝 Erstelle finale HTML-Datei...")
    
    html_template = f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>D&D Kampagnen-Tracker Pro</title>
<style>{css_content}</style>
</head>
<body>
{body_content}
<script>
{js_minified}
</script>
</body>
</html>'''
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(html_template)
    
    # 6. Statistiken
    total_size = len(html_template)
    original_total = 264704 + 255661 + total_original_size  # CSS + HTML + JS
    
    print(f"\n✅ Build abgeschlossen!")
    print(f"📄 Datei: {OUTPUT_FILE}")
    print(f"\n📊 Größenvergleich:")
    print(f"   Original:  {original_total:,} Zeichen ({original_total/1024/1024:.2f} MB)")
    print(f"   Optimiert: {total_size:,} Zeichen ({total_size/1024/1024:.2f} MB)")
    print(f"   Ersparnis: {original_total - total_size:,} Zeichen (↓{100 - total_size*100//original_total:.1f}%)")
    
    print(f"\n📦 Komponenten:")
    print(f"   CSS:           {len(css_content):,} Zeichen")
    print(f"   HTML Body:     {len(body_content):,} Zeichen")
    print(f"   JavaScript:    {len(js_minified):,} Zeichen")
    print(f"   {'-'*40}")
    print(f"   Total:       {total_size:,} Zeichen")

if __name__ == '__main__':
    build()
