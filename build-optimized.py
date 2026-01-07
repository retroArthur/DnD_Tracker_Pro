#!/usr/bin/env python3
"""
Optimiertes Build-Skript mit Minifizierung
Reduziert Bundle-Größe durch HTML/CSS/JS-Minifizierung
"""

import os
import re
import subprocess

# Konfiguration - Verwende das Verzeichnis, in dem das Skript liegt
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = SCRIPT_DIR
OUTPUT_DIR = os.path.join(SOURCE_DIR, 'dist')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'dnd-tracker-optimized.html')

# Module in Ladereihenfolge (sync with build.py)
MODULES = [
    'core/config.js',
    'core/data.js',
    'core/constants.js',
    'utils/performance.js',
    'utils/basic.js',
    'utils/utilities.js',
    'utils/crud-helpers.js',
    'utils/validation.js',
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
    # Features
    'features/encounter-calculator.js',
    'features/initiative.js',
    'features/rest-manager.js',
    'features/quick-actions.js',
    'features/random-tables.js',
    'features/loot-distribution.js',
    # Shops-Module
    'features/shops/shops-core.js',
    'features/shops/spell-editor.js',
    'features/shops/sessions.js',
    'features/shops/wiki.js',
    'features/shops/links.js',
    'features/shops/mindmap.js',
    # Roadmap-Module (ersetzt Netzwerk)
    'features/roadmap/roadmap.js',
    'features/roadmap/roadmap-render.js',
    'features/roadmap/roadmap-crud.js',
    'features/roadmap/roadmap-ui.js',
    # DM Screen Module
    'features/dmscreen/dmscreen-render.js',
    # Dice-Module (ersetzt features/dice.js)
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
    'features/dice/debug.js',  # Debug-Modul (nur Development)
    'ui/dom-builder.js',
    'ui/safe-render.js',
    'ui/lazy-loading.js',
    'ui/event-delegation.js',
    # Action-Module
    'ui/actions/entity-actions.js',
    'ui/actions/combat-actions.js',
    'ui/actions/ui-actions.js',
    'ui/actions/dice-actions.js',
    'ui/actions/wiki-actions.js',
    'ui/actions/shop-actions.js',
    'ui/actions/map-actions.js',
    'ui/actions/roadmap-actions.js',
    'ui/actions/system-actions.js',
    'ui/virtual-scroll.js',
    'core/init.js'
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
    css_file = os.path.join(SOURCE_DIR, 'assets', 'styles.css')
    with open(css_file, 'r', encoding='utf-8') as f:
        css_content = f.read()
    
    print(f"   Original: {len(css_content):,} Zeichen")
    css_content = minify_css(css_content)
    print(f"   Minified: {len(css_content):,} Zeichen (↓{100 - len(css_content)*100//264704:.0f}%)")
    
    # 2. Lade HTML Body
    print("\n📦 Lade HTML Body...")
    body_file = os.path.join(SOURCE_DIR, 'assets', 'body.html')
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
        full_path = os.path.join(SOURCE_DIR, module_path)

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
