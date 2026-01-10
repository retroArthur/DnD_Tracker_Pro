#!/usr/bin/env python3
"""
Script zum Hinzufügen von _nextId Feldern zu D&D Tracker JSON-Daten

Usage:
    python add-nextid-to-json.py input.json output.json
    python add-nextid-to-json.py input.json  # überschreibt input.json
"""

import json
import sys
from pathlib import Path

# Arrays die _nextId benötigen
ARRAYS_WITH_NEXTID = [
    'characters',
    'npcs',
    'locations',
    'quests',
    'encounters',
    'spells',
    'loot',
    'items',
    'wiki',
    'sessionNotes',
    'randomTables'
]

def add_nextid_to_array(array):
    """Berechnet _nextId für ein Array (max ID + 1)"""
    if not array:
        return 1

    max_id = max(item.get('id', 0) for item in array)
    return max_id + 1

def process_json_data(data):
    """Fügt _nextId Felder zu allen relevanten Arrays hinzu"""
    modified = False

    for array_name in ARRAYS_WITH_NEXTID:
        if array_name in data and isinstance(data[array_name], list):
            # Berechne _nextId
            next_id = add_nextid_to_array(data[array_name])

            # Prüfe ob bereits vorhanden
            if data.get(f'{array_name}_nextId') != next_id:
                data[f'{array_name}_nextId'] = next_id
                modified = True
                print(f"[OK] {array_name}: _nextId = {next_id} (max ID: {next_id - 1})")
            else:
                print(f"  {array_name}: _nextId bereits korrekt ({next_id})")

    return data, modified

def main():
    if len(sys.argv) < 2:
        print("Usage: python add-nextid-to-json.py input.json [output.json]")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else input_file

    if not input_file.exists():
        print(f"Error: {input_file} nicht gefunden!")
        sys.exit(1)

    print(f"Lese {input_file}...")

    # JSON laden
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("\nVerarbeite Daten...")
    data, modified = process_json_data(data)

    if modified:
        # JSON speichern
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\n[OK] Gespeichert: {output_file}")
        print(f"  Größe: {output_file.stat().st_size:,} Bytes")
    else:
        print("\n[OK] Keine Aenderungen noetig - alle _nextId Felder bereits vorhanden")

if __name__ == '__main__':
    main()
