#!/usr/bin/env python3
"""
D&D Tracker - Automatische Validierung
Überprüft die modulare Version auf häufige Fehler
"""

import os
import re
from pathlib import Path

from build import load_css_import_order, load_module_list, load_template_list, require_files_exist

SOURCE_DIR = str(Path(__file__).parent)


def check_modules():
    print("\n🔍 Überprüfe JavaScript-Module aus loader.js...")
    modules = load_module_list(f"{SOURCE_DIR}/loader.js")
    require_files_exist(SOURCE_DIR, modules, 'JS-Modul')
    return True


def check_templates():
    print("\n🔍 Überprüfe HTML-Templates aus loader.js...")
    templates = load_template_list(f"{SOURCE_DIR}/loader.js")
    require_files_exist(SOURCE_DIR, templates, 'HTML-Template')
    return True


def check_stylesheets():
    print("\n🔍 Überprüfe CSS-Imports aus assets/styles.css...")
    css_files = load_css_import_order(f"{SOURCE_DIR}/assets/styles.css")
    require_files_exist(SOURCE_DIR, [f"assets/styles/{name}" for name in css_files], 'CSS-Datei')
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
        ("index.html", check_index_html),
        ("loader.js", check_loader_js),
        ("core/init.js", check_init_js),
        ("JavaScript-Module", check_modules),
        ("HTML-Templates", check_templates),
        ("CSS-Imports", check_stylesheets),
        ("Gebündelte Version", check_bundled_version),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
        except SystemExit:
            # Die Build-Prüfungen geben den Fehler aus, bevor sie abbrechen.
            result = False
        except OSError as error:
            print(f"  ❌ {error}")
            result = False
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
