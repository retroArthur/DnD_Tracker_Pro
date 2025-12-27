#!/usr/bin/env python3
"""
Render-Module Analyzer
Analysiert render/main.js und erstellt einen Plan zum Aufteilen
"""

import re
import os
from collections import defaultdict

SOURCE_FILE = '/mnt/user-data/outputs/dnd-tracker-modular/render/main.js'
OUTPUT_DIR = '/mnt/user-data/outputs/dnd-tracker-modular/features'

# Feature-Keywords in Funktionsnamen
FEATURE_KEYWORDS = {
    'party': ['Party', 'Character', 'Char', 'Prof'],
    'npcs': ['NPC', 'Dialog'],
    'locations': ['Location', 'Filter', 'Trigger'],
    'quests': ['Quest', 'Reward'],
    'encounters': ['Encounter', 'Enc'],
    'loot': ['Loot', 'Item'],
    'spells': ['Spell'],
    'notes': ['Note', 'Session'],
    'wiki': ['Wiki', 'Article'],
    'links': ['Link'],
    'maps': ['Map'],
    'timers': ['Timer'],
    'dashboard': ['Dashboard', 'renderAll'],
}

def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def analyze_functions():
    """Analysiert alle Funktionen in render/main.js"""
    
    print("🔍 Analysiere render/main.js...")
    print(f"📂 Quelle: {SOURCE_FILE}\n")
    
    if not os.path.exists(SOURCE_FILE):
        print(f"❌ Datei nicht gefunden: {SOURCE_FILE}")
        return
    
    content = read_file(SOURCE_FILE)
    
    # Finde alle Function Declarations
    func_pattern = r'^function\s+(\w+)\s*\('
    functions = []
    
    for match in re.finditer(func_pattern, content, re.MULTILINE):
        func_name = match.group(1)
        line_num = content[:match.start()].count('\n') + 1
        functions.append({
            'name': func_name,
            'line': line_num,
            'start': match.start()
        })
    
    print(f"📊 Gefundene Funktionen: {len(functions)}\n")
    
    # Kategorisiere Funktionen
    categories = defaultdict(list)
    uncategorized = []
    
    for func in functions:
        categorized = False
        for feature, keywords in FEATURE_KEYWORDS.items():
            for keyword in keywords:
                if keyword.lower() in func['name'].lower():
                    categories[feature].append(func)
                    categorized = True
                    break
            if categorized:
                break
        
        if not categorized:
            uncategorized.append(func)
    
    # Zeige Kategorisierung
    print("📂 Kategorisierung:")
    for feature in sorted(categories.keys()):
        funcs = categories[feature]
        size_estimate = len(funcs) * 50  # Grobe Schätzung: 50 Zeilen pro Funktion
        print(f"  {feature:15s}: {len(funcs):3d} Funktionen (~{size_estimate:4d} Zeilen)")
    
    if uncategorized:
        print(f"\n  {'uncategorized':15s}: {len(uncategorized):3d} Funktionen")
    
    # Zeige Details pro Kategorie
    print(f"\n📝 Funktionen pro Kategorie:\n")
    
    for feature in sorted(categories.keys()):
        funcs = categories[feature]
        print(f"  {feature.upper()}:")
        for func in funcs[:5]:  # Zeige erste 5
            print(f"    - {func['name']:30s} (Zeile {func['line']:4d})")
        if len(funcs) > 5:
            print(f"    ... und {len(funcs) - 5} weitere")
        print()
    
    # Zeige Größenstatistik
    total_lines = content.count('\n') + 1
    print(f"\n📏 Größenstatistik:")
    print(f"  Gesamt:        {total_lines:,} Zeilen")
    print(f"  Funktionen:    {len(functions)}")
    print(f"  ∅ Zeilen/Func: {total_lines // max(len(functions), 1)}")
    
    # Erstelle Splitting-Plan
    print(f"\n📋 Empfohlener Splitting-Plan:\n")
    
    for feature in sorted(categories.keys()):
        funcs = categories[feature]
        func_names = [f['name'] for f in funcs]
        
        print(f"  features/render-{feature}.js:")
        print(f"    Funktionen: {', '.join(func_names[:3])}")
        if len(func_names) > 3:
            print(f"                ... und {len(func_names) - 3} weitere")
        print()
    
    # Zeige Beispiel-Modul
    print(f"\n💡 Beispiel: features/render-party.js\n")
    print("```javascript")
    print("// ============================================================")
    print("// PARTY - Render-Funktionen")
    print("// ============================================================")
    print()
    
    if 'party' in categories:
        for func in categories['party'][:2]:
            # Extrahiere Funktions-Code (grobe Approximation)
            start = func['start']
            # Finde nächste Function oder Ende
            next_func_start = content.find('\nfunction ', start + 1)
            if next_func_start == -1:
                next_func_start = len(content)
            
            func_code = content[start:next_func_start].strip()
            # Zeige erste paar Zeilen
            lines = func_code.split('\n')[:5]
            for line in lines:
                print(line)
            print("  // ...")
            print("}\n")
    
    print("```")
    
    # Generiere Loader-Update
    print(f"\n🔧 Loader-Update (loader.js):\n")
    print("```javascript")
    print("const MODULES = [")
    print("  // ... existing modules ...")
    print()
    for feature in sorted(categories.keys()):
        print(f"  'features/render-{feature}.js',")
    print("  // ...")
    print("];")
    print("```")
    
    return categories, uncategorized

def generate_split_files(categories, dry_run=True):
    """Generiert separate Modul-Dateien"""
    
    if dry_run:
        print(f"\n💡 Führe mit --execute aus, um Dateien zu erstellen")
        return
    
    print(f"\n🔨 Erstelle Module...")
    
    content = read_file(SOURCE_FILE)
    
    for feature, funcs in categories.items():
        if not funcs:
            continue
        
        # Erstelle Modul-Content
        module_content = f"""// ============================================================
// {feature.upper()} - Render-Funktionen  
// ============================================================
// Extrahiert aus render/main.js

"""
        
        # Extrahiere alle Funktionen für dieses Feature
        for func in funcs:
            start = func['start']
            # Finde Ende der Funktion (nächste Function oder EOF)
            next_func = content.find('\nfunction ', start + 1)
            if next_func == -1:
                next_func = len(content)
            
            func_code = content[start:next_func].strip()
            module_content += func_code + '\n\n'
        
        # Schreibe Datei
        output_file = f"{OUTPUT_DIR}/render-{feature}.js"
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(module_content)
        
        size_kb = len(module_content) / 1024
        print(f"  ✓ render-{feature}.js ({size_kb:.1f} KB, {len(funcs)} Funktionen)")
    
    print(f"\n✅ Module erstellt!")
    print(f"📂 Ausgabe: {OUTPUT_DIR}")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Render-Module Analyzer')
    parser.add_argument('--execute', action='store_true', 
                        help='Erstelle Module (Standard: nur Analyse)')
    
    args = parser.parse_args()
    
    categories, uncategorized = analyze_functions()
    
    if args.execute and categories:
        generate_split_files(categories, dry_run=False)
