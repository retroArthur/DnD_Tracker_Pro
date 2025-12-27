#!/usr/bin/env python3
"""
Event-Handler Migration Tool
Findet inline Event-Handler und konvertiert sie zu data-action Attributen
"""

import re
import os
from collections import defaultdict

SOURCE_HTML = '/mnt/user-data/outputs/dnd-tracker-modular/assets/body.html'
OUTPUT_HTML = '/mnt/user-data/outputs/dnd-tracker-modular/assets/body-migrated.html'

# Event-Handler-Patterns
EVENT_PATTERNS = {
    'onclick': r'onclick="([^"]+)"',
    'onchange': r'onchange="([^"]+)"',
    'oninput': r'oninput="([^"]+)"',
    'onfocus': r'onfocus="([^"]+)"',
    'onblur': r'onblur="([^"]+)"',
    'onkeypress': r'onkeypress="([^"]+)"',
    'onsubmit': r'onsubmit="([^"]+)"',
}

def analyze_handlers(dry_run=True):
    """Analysiert alle inline Event-Handler"""
    
    print("🔍 Analysiere inline Event-Handler...")
    print(f"📂 Quelle: {SOURCE_HTML}\n")
    
    if not os.path.exists(SOURCE_HTML):
        print(f"❌ Datei nicht gefunden: {SOURCE_HTML}")
        return
    
    with open(SOURCE_HTML, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Sammle Statistiken
    stats = defaultdict(list)
    total_count = 0
    
    for event_type, pattern in EVENT_PATTERNS.items():
        matches = re.finditer(pattern, content)
        for match in matches:
            handler_code = match.group(1)
            stats[event_type].append({
                'code': handler_code,
                'position': match.start()
            })
            total_count += 1
    
    # Zeige Statistiken
    print(f"📊 Gefundene Handler: {total_count}\n")
    
    for event_type in sorted(stats.keys()):
        handlers = stats[event_type]
        print(f"  {event_type:15s}: {len(handlers):4d} Handler")
    
    # Zeige Beispiele
    print(f"\n📝 Beispiele (erste 10):")
    shown = 0
    for event_type, handlers in stats.items():
        for handler in handlers[:3]:
            if shown >= 10:
                break
            code = handler['code'][:60]
            print(f"  {event_type}: {code}...")
            shown += 1
    
    # Finde häufigste Patterns
    print(f"\n🔥 Häufigste Funktionsaufrufe:")
    func_calls = defaultdict(int)
    
    for handlers in stats.values():
        for handler in handlers:
            # Extrahiere Funktionsnamen
            func_match = re.match(r'(\w+)\s*\(', handler['code'])
            if func_match:
                func_name = func_match.group(1)
                func_calls[func_name] += 1
    
    for func_name, count in sorted(func_calls.items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"  {func_name:25s}: {count:3d}×")
    
    if not dry_run:
        migrate_handlers(content, stats)
    else:
        print(f"\n💡 Führe mit --execute aus, um Migration durchzuführen")

def migrate_handlers(content, stats):
    """Migriert Handler zu data-action Attributen"""
    
    print(f"\n🔧 Starte Migration...")
    
    # Mapping von Funktionsaufrufen zu data-action
    action_mappings = {
        'deleteChar': 'delete-char',
        'editChar': 'edit-char',
        'saveCharacter': 'save-character',
        'cancelCharEdit': 'cancel-char-edit',
        'deleteNPC': 'delete-npc',
        'editNPC': 'edit-npc',
        'saveNPC': 'save-npc',
        'deleteLocation': 'delete-location',
        'editLocation': 'edit-location',
        'saveLocation': 'save-location',
        'deleteQuest': 'delete-quest',
        'editQuest': 'edit-quest',
        'saveQuest': 'save-quest',
        'deleteEnc': 'delete-encounter',
        'editEnc': 'edit-encounter',
        'saveEncounter': 'save-encounter',
        'showCharacterDetails': 'show-character-details',
        'showNPCPopup': 'show-npc-popup',
        'renderParty': 'render-party',
        'renderNPCList': 'render-npc-list',
        'renderLocations': 'render-locations',
        'renderQuests': 'render-quests',
        'renderEncounters': 'render-encounters',
        # Füge weitere Mappings hinzu...
    }
    
    migrated_content = content
    migration_count = 0
    
    # Konvertiere onclick Handler
    for match in re.finditer(r'onclick="([^"]+)"', content):
        handler = match.group(1)
        
        # Extrahiere Funktionsname und Parameter
        func_match = re.match(r'(\w+)\(([^)]*)\)', handler)
        if func_match:
            func_name = func_match.group(1)
            params = func_match.group(2).strip()
            
            if func_name in action_mappings:
                action_name = action_mappings[func_name]
                
                # Erstelle data-action Ersetzung
                if params and params != '':
                    # Einfacher Fall: einzelner Parameter (meist ID)
                    if params.isdigit() or re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', params):
                        new_attr = f'data-action="{action_name}" data-id="{params}"'
                    else:
                        # Komplexere Parameter - erstmal überspringen
                        continue
                else:
                    new_attr = f'data-action="{action_name}"'
                
                # Ersetze im Content
                old_attr = match.group(0)
                migrated_content = migrated_content.replace(old_attr, new_attr, 1)
                migration_count += 1
    
    print(f"  ✓ {migration_count} Handler migriert")
    
    # Schreibe migrierte Datei
    with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
        f.write(migrated_content)
    
    print(f"\n✅ Migration abgeschlossen!")
    print(f"📄 Ausgabe: {OUTPUT_HTML}")
    print(f"\n⚠️ Wichtig:")
    print(f"  1. Überprüfen Sie die migrierte Datei")
    print(f"  2. Testen Sie alle Funktionen")
    print(f"  3. Backup der Original-Datei erstellen")
    print(f"  4. Event-Delegation in ui/event-delegation.js erweitern")

def generate_event_delegation_code(stats):
    """Generiert Code für Event-Delegation basierend auf gefundenen Handlern"""
    
    print("\n📝 Generiere Event-Delegation-Code...\n")
    
    func_calls = set()
    for handlers in stats.values():
        for handler in handlers:
            func_match = re.match(r'(\w+)\s*\(', handler['code'])
            if func_match:
                func_calls.add(func_match.group(1))
    
    print("// Füge diese Actions zu ui/event-delegation.js hinzu:")
    print("const actions = {")
    
    for func in sorted(func_calls)[:20]:  # Ersten 20 als Beispiel
        action_name = re.sub(r'([A-Z])', r'-\1', func).lower().lstrip('-')
        print(f"    '{action_name}': () => {func}(id),")
    
    print("    // ... weitere Actions\n};")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Event-Handler Migration Tool')
    parser.add_argument('--execute', action='store_true', help='Führe Migration durch (Standard: nur Analyse)')
    parser.add_argument('--generate-delegation', action='store_true', help='Generiere Event-Delegation-Code')
    
    args = parser.parse_args()
    
    # Analysiere Handler
    analyze_handlers(dry_run=not args.execute)
    
    # Optional: Generiere Event-Delegation-Code
    if args.generate_delegation:
        with open(SOURCE_HTML, 'r', encoding='utf-8') as f:
            content = f.read()
        
        stats = defaultdict(list)
        for event_type, pattern in EVENT_PATTERNS.items():
            matches = re.finditer(pattern, content)
            for match in matches:
                stats[event_type].append({'code': match.group(1)})
        
        generate_event_delegation_code(stats)
