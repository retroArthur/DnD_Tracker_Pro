#!/usr/bin/env python3
"""
D&D Tracker - Automatische Validierung
Überprüft die modulare Version auf häufige Fehler
"""

import os
import re
from pathlib import Path

SOURCE_DIR = '/mnt/user-data/outputs/dnd-tracker-modular'

def check_html_tags_in_js():
    """Überprüft, ob JavaScript-Module HTML-Tags enthalten"""
    print("🔍 Überprüfe JavaScript-Module auf HTML-Tags...")
    
    js_dirs = ['core', 'utils', 'systems', 'render', 'features', 'ui']
    errors = []
    
    for js_dir in js_dirs:
        dir_path = f"{SOURCE_DIR}/{js_dir}"
        if not os.path.exists(dir_path):
            continue
            
        for filename in os.listdir(dir_path):
            if filename.endswith('.js'):
                filepath = os.path.join(dir_path, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Suche nach HTML-Tags
                html_tags = re.findall(r'</?(?:html|head|body|script|style)(?:\s|>)', content)
                if html_tags:
                    errors.append(f"  ❌ {js_dir}/{filename}: {set(html_tags)}")
    
    if errors:
        print(f"  ❌ HTML-Tags gefunden in {len(errors)} Datei(en):")
        for error in errors:
            print(error)
        return False
    else:
        print("  ✅ Keine HTML-Tags in JavaScript-Modulen")
        return True

def check_body_html():
    """Überprüft body.html auf korrekte Tags"""
    print("\n🔍 Überprüfe body.html...")
    
    body_file = f"{SOURCE_DIR}/assets/body.html"
    
    if not os.path.exists(body_file):
        print("  ❌ body.html nicht gefunden!")
        return False
    
    with open(body_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        first_line = lines[0].strip() if lines else ""
        
        # Sollte mit <body> beginnen
        if not first_line.startswith('<body'):
            print(f"  ❌ body.html beginnt nicht mit <body> (gefunden: {first_line[:50]})")
            return False
        
        # Sollte NICHT mit </head> beginnen
        if first_line.startswith('</head>'):
            print("  ❌ body.html beginnt mit </head> (sollte entfernt sein)")
            return False
        
        # Sollte KEIN </body> enthalten
        content = ''.join(lines)
        if '</body>' in content:
            print("  ❌ body.html enthält </body> Tag (sollte nicht da sein)")
            return False
        
        print("  ✅ body.html ist korrekt strukturiert")
        return True

def check_index_html():
    """Überprüft index.html auf korrekte Skript-Tags"""
    print("\n🔍 Überprüfe index.html...")
    
    index_file = f"{SOURCE_DIR}/index.html"
    
    if not os.path.exists(index_file):
        print("  ❌ index.html nicht gefunden!")
        return False
    
    with open(index_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # Sollte KEIN type="module" haben
        if 'type="module"' in content:
            print('  ❌ index.html enthält type="module" (sollte normales Skript sein)')
            return False
        
        # Sollte loader.js laden
        if 'src="loader.js"' not in content:
            print("  ❌ index.html lädt loader.js nicht")
            return False
        
        print("  ✅ index.html ist korrekt konfiguriert")
        return True

def check_loader_js():
    """Überprüft loader.js auf korrekte Konfiguration"""
    print("\n🔍 Überprüfe loader.js...")
    
    loader_file = f"{SOURCE_DIR}/loader.js"
    
    if not os.path.exists(loader_file):
        print("  ❌ loader.js nicht gefunden!")
        return False
    
    with open(loader_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
        checks = [
            ('await init()', "manueller init()-Aufruf"),
            ('DOMContentLoaded', "DOMContentLoaded-Check"),
            ('loadModules', "loadModules Funktion"),
        ]
        
        all_passed = True
        for check, description in checks:
            if check not in content:
                print(f"  ❌ {description} fehlt")
                all_passed = False
        
        if all_passed:
            print("  ✅ loader.js ist korrekt konfiguriert")
        
        return all_passed

def check_init_js():
    """Überprüft core/init.js"""
    print("\n🔍 Überprüfe core/init.js...")
    
    init_file = f"{SOURCE_DIR}/core/init.js"
    
    if not os.path.exists(init_file):
        print("  ❌ core/init.js nicht gefunden!")
        return False
    
    with open(init_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # Sollte automatischen init()-Aufruf NICHT haben (sollte auskommentiert sein)
        auto_init_pattern = r'^\s*if\s*\(\s*document\.readyState.*init\s*\('
        if re.search(auto_init_pattern, content, re.MULTILINE):
            print("  ⚠️ Automatischer init()-Aufruf ist NICHT auskommentiert")
            print("     (Dies könnte zu Timing-Problemen führen)")
            return False
        
        print("  ✅ core/init.js ist korrekt konfiguriert")
        return True

def check_module_count():
    """Überprüft, ob alle erwarteten Module vorhanden sind"""
    print("\n🔍 Überprüfe Modul-Anzahl...")
    
    expected_modules = {
        'core': 4,  # config.js, data.js, constants.js, init.js
        'utils': 3,
        'systems': 8,
        'render': 2,
        'features': 3,
        'ui': 4
    }
    
    all_correct = True
    total_found = 0
    
    for folder, expected_count in expected_modules.items():
        folder_path = f"{SOURCE_DIR}/{folder}"
        if not os.path.exists(folder_path):
            print(f"  ❌ Ordner {folder}/ nicht gefunden!")
            all_correct = False
            continue
        
        js_files = [f for f in os.listdir(folder_path) if f.endswith('.js')]
        count = len(js_files)
        total_found += count
        
        if count != expected_count:
            print(f"  ⚠️ {folder}/: {count} Module (erwartet: {expected_count})")
            all_correct = False
        else:
            print(f"  ✅ {folder}/: {count} Module")
    
    print(f"\n  📦 Gesamt: {total_found} Module")
    return all_correct

def check_bundled_version():
    """Überprüft die gebündelte Version"""
    print("\n🔍 Überprüfe gebündelte Version...")
    
    bundled_file = f"{SOURCE_DIR}/dist/dnd-tracker-bundled.html"
    
    if not os.path.exists(bundled_file):
        print("  ⚠️ Gebündelte Version nicht gefunden (dist/dnd-tracker-bundled.html)")
        print("     → Führe 'python3 build.py' aus, um sie zu erstellen")
        return None  # Nicht kritisch
    
    with open(bundled_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # Überprüfe auf problematische Muster
        issues = []
        
        # Suche nach </body> vor dem letzten Skript-Tag
        script_positions = [m.start() for m in re.finditer(r'</script>', content)]
        body_positions = [m.start() for m in re.finditer(r'</body>', content)]
        
        if script_positions and body_positions:
            last_script = max(script_positions)
            early_body_tags = [pos for pos in body_positions if pos < last_script]
            
            if early_body_tags:
                # Finde Zeilennummer
                lines_before = content[:early_body_tags[0]].count('\n')
                issues.append(f"</body> Tag vor letztem </script> (ca. Zeile {lines_before})")
        
        if issues:
            print(f"  ❌ Probleme gefunden:")
            for issue in issues:
                print(f"     - {issue}")
            return False
        else:
            file_size_mb = len(content) / 1024 / 1024
            print(f"  ✅ Gebündelte Version ist OK ({file_size_mb:.2f} MB)")
            return True

def main():
    print("=" * 60)
    print("🔧 D&D Tracker - Automatische Validierung")
    print("=" * 60)
    print()
    
    checks = [
        ("HTML-Tags in JS", check_html_tags_in_js),
        ("body.html", check_body_html),
        ("index.html", check_index_html),
        ("loader.js", check_loader_js),
        ("core/init.js", check_init_js),
        ("Module-Anzahl", check_module_count),
        ("Gebündelte Version", check_bundled_version),
    ]
    
    results = []
    for name, check_func in checks:
        result = check_func()
        results.append((name, result))
    
    # Zusammenfassung
    print("\n" + "=" * 60)
    print("📊 Zusammenfassung")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r is True)
    failed = sum(1 for _, r in results if r is False)
    skipped = sum(1 for _, r in results if r is None)
    
    for name, result in results:
        if result is True:
            print(f"  ✅ {name}")
        elif result is False:
            print(f"  ❌ {name}")
        else:
            print(f"  ⚠️ {name} (übersprungen)")
    
    print()
    print(f"  Bestanden: {passed}/{len(checks)}")
    if failed > 0:
        print(f"  Fehlgeschlagen: {failed}")
    if skipped > 0:
        print(f"  Übersprungen: {skipped}")
    
    print()
    
    if failed == 0:
        print("🎉 Alle Checks bestanden! Die modulare Version ist einsatzbereit.")
        return 0
    else:
        print("⚠️ Einige Checks sind fehlgeschlagen. Bitte beheben Sie die Probleme.")
        print("\nHilfe:")
        print("  - BUGFIXES.md für Lösungen")
        print("  - HOTFIX-2.md für letzte Fixes")
        print("  - TESTING.md für manuelle Tests")
        return 1

if __name__ == '__main__':
    exit(main())
