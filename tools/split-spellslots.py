#!/usr/bin/env python3
"""
Teilt spellslots.js in separate Module auf
"""

import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = os.path.dirname(SCRIPT_DIR)
SOURCE_FILE = os.path.join(SOURCE_DIR, 'systems', 'spellslots.js')
OUTPUT_DIR = os.path.join(SOURCE_DIR, 'systems', 'spellslots-split')

# Sektionen mit Start-Zeile und Dateiname
SECTIONS = [
    (1, 95, 'spell-slots-core.js', 'Zauberslot-Kernfunktionen'),
    (96, 165, 'notes-templates.js', 'Notizen-Templates'),
    (166, 301, 'quick-reference.js', 'Schnell-Referenz Panel'),
    (302, 366, 'pwa-install.js', 'PWA Install Prompt'),
    (367, 452, 'version-migration.js', 'Versionierung & Migration'),
    (453, 501, 'virtual-list.js', 'Virtual List Performance'),
    (502, 694, 'keyboard-shortcuts.js', 'Keyboard Shortcuts'),
    (695, 858, 'persistence.js', 'Save/Load Funktionen'),
    (859, 971, 'quick-roll.js', 'Quick Roll System'),
    (972, 1464, 'import-export.js', 'Import/Export System'),
    (1465, 9999, 'navigation.js', 'Navigation'),
]

def split_spellslots():
    print(f"📖 Lese {SOURCE_FILE}...")
    
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    total_lines = len(lines)
    print(f"   {total_lines} Zeilen geladen")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for start, end, filename, desc in SECTIONS:
        # Anpassen für 0-basierte Indizierung
        start_idx = start - 1
        end_idx = min(end, total_lines)
        
        section_lines = lines[start_idx:end_idx]
        
        header = f"""// [SECTION:{filename.replace('.js', '').upper().replace('-', '_')}]
// Extrahiert aus spellslots.js
// {desc}
// Zeilen: {len(section_lines)}

"""
        
        output_path = os.path.join(OUTPUT_DIR, filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(header)
            f.writelines(section_lines)
        
        size_kb = len(''.join(section_lines)) / 1024
        print(f"   ✅ {filename}: {len(section_lines)} Zeilen ({size_kb:.1f} KB)")
    
    print(f"\n📊 Zusammenfassung:")
    print(f"   Original: {total_lines} Zeilen ({os.path.getsize(SOURCE_FILE) / 1024:.1f} KB)")
    print(f"   Extrahiert: {len(SECTIONS)} Module")

if __name__ == '__main__':
    split_spellslots()
