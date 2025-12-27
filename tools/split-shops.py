#!/usr/bin/env python3
"""
Teilt shops.js in separate Module auf basierend auf Sektions-Markern.
"""

import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = os.path.dirname(SCRIPT_DIR)
SOURCE_FILE = os.path.join(SOURCE_DIR, 'features', 'shops.js')
OUTPUT_DIR = os.path.join(SOURCE_DIR, 'features', 'shops-split')

# Sektions-Definitionen: (Start-Marker, End-Marker, Dateiname, Beschreibung)
SECTIONS = [
    (r'^// SHOPS', r'^// SPELLS', 'shops-core.js', 'Shop-System für Händler und Inventar'),
    (r'^// SPELLS', r'^// SESSIONS', 'spell-editor.js', 'Zauber-Verwaltung und Editor'),
    (r'^// SESSIONS', r'^// WIKI', 'sessions.js', 'Session Notes'),
    (r'^// WIKI', r'^// LINKS', 'wiki.js', 'Wiki-System'),
    (r'^// LINKS', r'^// MINDMAP', 'links.js', 'Link-Verwaltung'),
    (r'^// MINDMAP', None, 'mindmap.js', 'Mindmap/Netzwerk-Visualisierung'),
]

def split_shops_js():
    print(f"📖 Lese {SOURCE_FILE}...")
    
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    total_lines = len(lines)
    print(f"   {total_lines} Zeilen geladen")
    
    # Finde Sektions-Grenzen
    section_positions = []
    for start_marker, end_marker, filename, desc in SECTIONS:
        start_line = None
        end_line = None
        
        for i, line in enumerate(lines):
            if re.match(start_marker, line):
                start_line = i
            if end_marker and re.match(end_marker, line):
                end_line = i
                break
        
        if start_line is not None:
            if end_line is None:
                end_line = total_lines
            section_positions.append((start_line, end_line, filename, desc))
    
    print(f"\n📍 {len(section_positions)} Sektionen gefunden:")
    for start, end, filename, desc in section_positions:
        print(f"   Zeile {start+1}-{end}: {filename} ({end-start} Zeilen)")
    
    # Erstelle Output-Verzeichnis
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Extrahiere Sektionen
    modules_created = []
    
    for start, end, filename, desc in section_positions:
        section_lines = lines[start:end]
        section_content = '\n'.join(section_lines)
        
        # Header hinzufügen
        header = f"""// [SECTION:{filename.replace('.js', '').upper().replace('-', '_')}]
// Extrahiert aus shops.js
// {desc}
// Zeilen: {len(section_lines)}

"""
        
        output_path = os.path.join(OUTPUT_DIR, filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(header + section_content)
        
        size_kb = len(section_content) / 1024
        modules_created.append((filename, len(section_lines), size_kb))
        print(f"   ✅ {filename}: {len(section_lines)} Zeilen ({size_kb:.1f} KB)")
    
    # Prolog (globale Variablen vor erster Sektion)
    first_section_start = section_positions[0][0] if section_positions else 0
    if first_section_start > 0:
        prolog_lines = lines[:first_section_start]
        if any(line.strip() for line in prolog_lines):
            prolog_path = os.path.join(OUTPUT_DIR, 'shops-prolog.js')
            with open(prolog_path, 'w', encoding='utf-8') as f:
                f.write("// [SECTION:SHOPS_PROLOG]\n// Globale Konstanten und Typen\n\n")
                f.write('\n'.join(prolog_lines))
            print(f"   ✅ shops-prolog.js: {len(prolog_lines)} Zeilen")
    
    print(f"\n📊 Zusammenfassung:")
    print(f"   Original: {total_lines} Zeilen ({os.path.getsize(SOURCE_FILE) / 1024:.1f} KB)")
    print(f"   Extrahiert: {len(modules_created)} Module")
    
    # Größte Module
    print(f"\n📈 Module nach Größe:")
    for filename, line_count, size_kb in sorted(modules_created, key=lambda x: -x[1]):
        print(f"   {filename}: {line_count} Zeilen ({size_kb:.1f} KB)")
    
    return modules_created

if __name__ == '__main__':
    split_shops_js()
