#!/usr/bin/env python3
"""
Findet fehlende globale Variablen nach einem Module-Split
"""

import re
import os

OUTPUT_DIR = '/mnt/user-data/outputs/dnd-tracker-modular'

def find_global_variable_usage():
    """Findet alle verwendeten aber nicht deklarierten Variablen"""
    
    print("🔍 Suche nach fehlenden globalen Variablen...\n")
    
    # Liste der bekannten globalen Variablen aus core/constants.js
    known_globals = {
        'D', 'APP_CONFIG', 'CATS', 'LINK_CATS', 'CONDITIONS', 'TAG_COLORS',
        'DAMAGE_TYPES', 'SPELL_SCHOOLS', 'ATTRIBUTES', 'SKILL_INFO', 'RARITIES',
        'STORAGE_KEY', 'DEBUG_MODE', 'PERF_MODE', 'EntityLookup', 'ENTITY_TYPE_CONFIG',
        '$', 'ErrorHandler', 'PerformanceManager', 'DOMBatch', 'ObjectPool',
        'requestIdleCallback', 'cancelIdleCallback', 'document', 'window', 'console',
        'localStorage', 'JSON', 'Array', 'Object', 'Set', 'Map', 'Date', 'Math',
        'Promise', 'setTimeout', 'clearTimeout', 'requestAnimationFrame',
    }
    
    # Scanne alle Module
    module_dirs = ['core', 'utils', 'systems', 'render', 'features', 'ui']
    
    issues = []
    
    for module_dir in module_dirs:
        dir_path = f"{OUTPUT_DIR}/{module_dir}"
        if not os.path.exists(dir_path):
            continue
        
        for filename in os.listdir(dir_path):
            if not filename.endswith('.js'):
                continue
            
            filepath = os.path.join(dir_path, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Finde alle Variablen-Verwendungen (nicht Deklarationen)
            # Muster: Wort gefolgt von . oder ( oder [ aber nicht von = oder let/const/var
            used_vars = set()
            for match in re.finditer(r'\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[.\[(]', content):
                var_name = match.group(1)
                # Ignoriere Schlüsselwörter und bekannte Globals
                if var_name not in ['if', 'for', 'while', 'function', 'return', 'new', 'this']:
                    used_vars.add(var_name)
            
            # Finde deklarierte Variablen in diesem Modul
            declared_vars = set()
            for match in re.finditer(r'\b(let|const|var|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', content):
                declared_vars.add(match.group(2))
            
            # Finde potenziell fehlende Variablen
            potentially_missing = used_vars - declared_vars - known_globals
            
            if potentially_missing:
                # Filtere offensichtliche False Positives
                filtered = {v for v in potentially_missing 
                           if not v[0].isupper()  # Keine Konstanten (meist aus anderen Modulen)
                           and len(v) > 2}  # Keine sehr kurzen Variablen
                
                if filtered:
                    issues.append({
                        'file': f"{module_dir}/{filename}",
                        'vars': filtered
                    })
    
    if issues:
        print("⚠️ Potentiell fehlende Variablen gefunden:\n")
        for issue in issues:
            print(f"  📄 {issue['file']}:")
            for var in sorted(issue['vars'])[:5]:  # Zeige max 5
                print(f"     - {var}")
            if len(issue['vars']) > 5:
                print(f"     ... und {len(issue['vars']) - 5} weitere")
            print()
    else:
        print("✅ Keine offensichtlich fehlenden Variablen gefunden")

def check_specific_variables():
    """Prüft spezifische bekannte globale Variablen"""
    
    print("\n🔍 Prüfe bekannte globale Render-Variablen...\n")
    
    checks = [
        ('renderPending', 'features/render-dashboard.js'),
        ('expandedLocations', 'features/render-locations.js'),
        ('dialogFieldCounter', 'features/render-npcs.js'),
    ]
    
    all_ok = True
    
    for var_name, expected_file in checks:
        filepath = f"{OUTPUT_DIR}/{expected_file}"
        
        if not os.path.exists(filepath):
            print(f"  ❌ {expected_file} existiert nicht!")
            all_ok = False
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Prüfe ob Variable deklariert ist
        declarations = re.findall(rf'\b(let|const|var)\s+{var_name}\s*=', content)
        
        if len(declarations) == 0:
            print(f"  ❌ {var_name:20s} fehlt in {expected_file}")
            all_ok = False
        elif len(declarations) == 1:
            print(f"  ✅ {var_name:20s} → {expected_file}")
        else:
            print(f"  ⚠️ {var_name:20s} → {expected_file} (DUPLIKAT! {len(declarations)}× deklariert)")
            all_ok = False
    
    return all_ok

if __name__ == '__main__':
    all_ok = check_specific_variables()
    find_global_variable_usage()
    
    if all_ok:
        print("\n✅ Alle globalen Variablen korrekt deklariert")
    else:
        print("\n⚠️ Es gibt Probleme mit globalen Variablen")
