#!/usr/bin/env python3
"""
Teilt dice.js in separate Module auf basierend auf Sektions-Markern.
"""

import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = os.path.dirname(SCRIPT_DIR)
SOURCE_FILE = os.path.join(SOURCE_DIR, 'features', 'dice.js')
OUTPUT_DIR = os.path.join(SOURCE_DIR, 'features', 'dice-split')

# Sektions-Definitionen: (Marker, Dateiname, Beschreibung)
SECTIONS = [
    (r'^// DICE ROLLER', 'dice-core.js', 'Würfel-Kernfunktionen'),
    (r'^// TIMERS', 'timers.js', 'Timer-Funktionen'),
    (r'^// CAMPAIGN MANAGER', 'campaign-manager.js', 'Kampagnen-Verwaltung'),
    (r'^// GLOBAL SEARCH', 'global-search.js', 'Globale Suche mit Fuzzy-Match'),
    (r'^// DICE FAVORITES', 'dice-favorites.js', 'Würfel-Favoriten'),
    (r'^// MAP INTEGRATION', 'maps.js', 'Karten-Integration'),
    (r'^// WIKI LINKS', 'wiki-links.js', 'Wiki-Link-Syntax'),
    (r'^// MONSTER TEMPLATES', 'monster-templates.js', 'Monster-Vorlagen'),
    (r'^// SRD SPELLS', 'srd-spells.js', 'SRD-Zauber-Datenbank'),
    (r'^// SPELL SLOTS', 'spellslots-ui.js', 'Zauberplatz-UI'),
    (r'^// INITIATIVE AUTO', 'initiative-extras.js', 'Initiative Auto-Roll & Drag-Drop'),
    (r'^// DEBUG & TEST', 'debug.js', 'Debug & Test Funktionen'),
    (r'^// THEME SYSTEM', 'theme.js', 'Theme-System'),
    (r'^// LAYOUT PROFILES', 'layout-profiles.js', 'Layout-Profile'),
    (r'^// SESSION TIMER', 'session-timer.js', 'Session-Timer'),
    (r'^// PERFORMANCE', 'performance-extras.js', 'Performance-Optimierungen'),
]

def split_dice_js():
    print(f"📖 Lese {SOURCE_FILE}...")
    
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    total_lines = len(lines)
    print(f"   {total_lines} Zeilen geladen")
    
    # Finde Sektions-Grenzen
    section_starts = []
    for i, line in enumerate(lines):
        for marker, filename, desc in SECTIONS:
            if re.match(marker, line):
                section_starts.append((i, filename, desc, marker))
                break
    
    # Sortiere nach Zeilennummer
    section_starts.sort(key=lambda x: x[0])
    
    print(f"\n📍 {len(section_starts)} Sektionen gefunden:")
    for start, filename, desc, _ in section_starts:
        print(f"   Zeile {start+1}: {filename} - {desc}")
    
    # Erstelle Output-Verzeichnis
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Extrahiere Sektionen
    modules_created = []
    total_extracted = 0
    
    for i, (start, filename, desc, _) in enumerate(section_starts):
        # Ende ist der Start der nächsten Sektion oder EOF
        if i + 1 < len(section_starts):
            end = section_starts[i + 1][0]
        else:
            end = total_lines
        
        section_lines = lines[start:end]
        section_content = '\n'.join(section_lines)
        
        # Schreibe Modul-Datei
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        # Header hinzufügen
        header = f"""// [SECTION:{filename.replace('.js', '').upper().replace('-', '_')}]
// Extrahiert aus dice.js
// {desc}
// Zeilen: {len(section_lines)}

"""
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(header + section_content)
        
        size_kb = len(section_content) / 1024
        modules_created.append((filename, len(section_lines), size_kb))
        total_extracted += len(section_lines)
        print(f"   ✅ {filename}: {len(section_lines)} Zeilen ({size_kb:.1f} KB)")
    
    # Prolog (vor erster Sektion) extrahieren
    if section_starts and section_starts[0][0] > 0:
        prolog_lines = lines[:section_starts[0][0]]
        prolog_content = '\n'.join(prolog_lines)
        if prolog_content.strip():
            prolog_path = os.path.join(OUTPUT_DIR, 'dice-prolog.js')
            with open(prolog_path, 'w', encoding='utf-8') as f:
                f.write(f"// [SECTION:DICE_PROLOG]\n// Globale Variablen und Konstanten\n\n{prolog_content}")
            print(f"   ✅ dice-prolog.js: {len(prolog_lines)} Zeilen")
            total_extracted += len(prolog_lines)
    
    print(f"\n📊 Zusammenfassung:")
    print(f"   Original: {total_lines} Zeilen ({os.path.getsize(SOURCE_FILE) / 1024:.1f} KB)")
    print(f"   Extrahiert: {total_extracted} Zeilen in {len(modules_created)} Module")
    
    # Größte Module
    print(f"\n📈 Größte Module:")
    for filename, line_count, size_kb in sorted(modules_created, key=lambda x: -x[1])[:5]:
        print(f"   {filename}: {line_count} Zeilen ({size_kb:.1f} KB)")
    
    return modules_created

if __name__ == '__main__':
    split_dice_js()
