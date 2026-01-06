#!/usr/bin/env python3
"""
D&D Tracker Build Script
Bündelt alle Module in eine einzige Production-HTML-Datei
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
OUTPUT_FILE = os.path.join(SCRIPT_DIR, 'dist', 'dnd-tracker-bundled.html')

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
    """Einfache JS-Minifizierung (entfernt Kommentare und Leerzeilen)"""
    # Entferne einzeilige Kommentare
    js_code = re.sub(r'//.*?$', '', js_code, flags=re.MULTILINE)
    # Entferne mehrzeilige Kommentare
    js_code = re.sub(r'/\*.*?\*/', '', js_code, flags=re.DOTALL)
    # Entferne Leerzeilen
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

def build(minify=False, verbose=False):
    """Erstellt die gebündelte HTML-Datei"""
    if verbose:
        log.set_verbose(True)
    log.header("D&D Tracker Build")
    log.info("🔨 Starte Build-Prozess...")
    log.info(f"Quelle: {SOURCE_DIR}")
    log.info(f"Ziel: {OUTPUT_FILE}")
    log.info(f"Minifizierung: {'Aktiviert' if minify else 'Deaktiviert'}")
    
    # Module in Ladereihenfolge (aus loader.js)
    modules = [
        'core/config.js',
        'core/data.js',
        'core/constants.js',
        'utils/performance.js',
        'utils/basic.js',
        'utils/utilities.js',
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
    
    # 1. Lade CSS
    print("\n[BUILD] Lade CSS...")
    css_content = read_file(f"{SOURCE_DIR}/assets/styles.css")
    if minify:
        log.info("Minifiziere CSS...")
        css_content = minify_css(css_content)
    log.success(f"CSS geladen: {len(css_content):,} Zeichen")
    
    # 2. Lade HTML Body
    print("\n[BUILD] Lade HTML Body...")
    body_content = read_file(f"{SOURCE_DIR}/assets/body.html")
    log.success(f"HTML Body geladen: {len(body_content):,} Zeichen")
    
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
    
    if minify:
        print("\n⚙️ Minifiziere JavaScript...")
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
    <link rel="manifest" href="data:application/json,{{%22name%22:%22D%26D%20Kampagnen-Tracker%20Pro%22,%22short_name%22:%22D%26D%20Tracker%22,%22start_url%22:%22.%22,%22display%22:%22standalone%22,%22background_color%22:%22%230d0d0d%22,%22theme_color%22:%22%23d4af37%22,%22icons%22:[{{%22src%22:%22data:image/svg+xml,%253Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%253E%253Ctext%20y='.9em'%20font-size='90'%253E%F0%9F%8E%B2%253C/text%253E%253C/svg%253E%22,%22sizes%22:%22any%22,%22type%22:%22image/svg+xml%22}}]}}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@400;500;600&family=Roboto:wght@400;700&family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet">
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
    
    # Schreibe finale Datei
    write_file(OUTPUT_FILE, html_template)
    
    # Statistiken
    final_size = len(html_template)
    print(f"\n[SUCCESS] Build abgeschlossen!")
    log.info(f"Datei: {OUTPUT_FILE}")
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
    args = parser.parse_args()
    
    build(minify=args.minify)
