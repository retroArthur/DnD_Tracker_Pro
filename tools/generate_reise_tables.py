#!/usr/bin/env python3
"""
tools/generate_reise_tables.py
Erzeugt features/reise/reise-default-tables.js mit deutschen Default-Tabellen
für den Reise-Simulator (WELT-04).

Aufruf: python tools/generate_reise_tables.py
Output: features/reise/reise-default-tables.js
        (in loader.js + build.py registriert durch Plan 05-01)

Inhalt:
  - REISE_BEGEGNUNGS_TABELLEN: 6 Geländearten × 1W8-Begegnungen
  - WETTER_TABELLEN: gemässigt × 4 Jahreszeiten × 1W8-Einträge
  - REISE_GELÄNDE und REISE_TEMPO (statische Daten, inline in dieser Datei)

Format: {range: '1', text: '...'} oder {range: '1-2', text: '...'}
        kompatibel mit rollWeightedEntry(table) in features/random-tables.js
"""

import os
import sys
import json

# ---------------------------------------------------------------------------
# Pfad-Setup (script-relativ, idempotent)
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT   = os.path.dirname(SCRIPT_DIR)
OUTPUT_PATH = os.path.join(REPO_ROOT, 'features', 'reise', 'reise-default-tables.js')


# ---------------------------------------------------------------------------
# ROHDATEN
# ---------------------------------------------------------------------------

# --- Begegnungstabellen (1W8) ---
# Jeder Eintrag: (range_str, text)
# range-Strings müssen 1..8 lückenlos abdecken.

BEGEGNUNG_WALD = [
    ('1',   '1W4 Wölfe streifen durch das Unterholz.'),
    ('2',   '1W6 Goblins hinterhältig aufgestellt — Hinterhalt!'),
    ('3',   'Ein verletzter Hirsch liegt auf dem Weg; Fährte führt zu einem Fallstrick.'),
    ('4',   'Eine Gruppe Holzfäller bittet um Hilfe gegen einen aggressiven Bären.'),
    ('5',   '1W4 Banditen, getarnt als Händler, sperren den Pfad.'),
    ('6',   'Ein alter Waldläufer bietet Essen und harmlose Information an.'),
    ('7',   'Ein einsamer Druide meditiert; greift niemanden an, bewacht aber seinen Kreis.'),
    ('8',   'Ein riesiger Elch mit leuchtenden Augen — Naturgeist oder Zeichen?'),
]

BEGEGNUNG_GEBIRGE = [
    ('1',   '1W4 Bergziegen werden von einem Schneeleo gejagt — gefährliche Herde in Panik.'),
    ('2',   '1W6 Ork-Späher sichern einen Gebirgspass.'),
    ('3',   'Ein Steinlavinen-Geräusch — Würfelprobe oder 2W6 Wuchtschaden durch fallende Brocken.'),
    ('4',   'Eine kleine Zwergengruppe auf Erkundung, misstrauisch, aber handelswillig.'),
    ('5',   '1W4 Harpyien kreisen über einem engen Kamm.'),
    ('6',   'Ein verlassenes Bergdorf — Ruinen deuten auf einen Dämonangriff hin.'),
    ('7',   'Ein Yeti (Eisriese) beobachtet aus der Ferne; weicht zurück wenn nicht bedroht.'),
    ('8',   'Ein aufgebrachter Riese rollt Felsbrocken; seine Hütte wurde von Banditen geplündert.'),
]

BEGEGNUNG_KUESTE = [
    ('1',   '1W4 Riesenkrabben an einem Strandabschnitt; aggressiv bei Berührung.'),
    ('2',   'Ein gestrandetes Fischerboot mit verwundeten Überlebenden.'),
    ('3',   '1W4 Sahuagin waten aus dem Wasser — patrouillieren ihr Territorium.'),
    ('4',   'Ein Schiff unter falscher Flagge liegt in einer Bucht; Piraten beobachten das Ufer.'),
    ('5',   'Ein Leuchtturmwärter bittet um Hilfe — Geister machen nachts Licht unmöglich.'),
    ('6',   'Sturmtang treibt an Land; darin ein wasserdichter Behälter mit Nachricht.'),
    ('7',   'Eine Meerjungfrau (Nixe) tauscht Informationen gegen ein Silberobjekt.'),
    ('8',   'Nebelbank rollt heran; darin schimmert silhouettenhaft ein Geisterschiff.'),
]

BEGEGNUNG_STRASSE = [
    ('1',   '1W6 Straßenräuber verlangen Wegzoll; bereit zu verhandeln oder zu kämpfen.'),
    ('2',   'Eine umgekippte Handelskutsche — der Fahrer braucht Hilfe, die Ware ist verstreut.'),
    ('3',   'Ein Edelmann reitet vorbei, sucht seinen entlaufenen Boten.'),
    ('4',   'Militärpatrouille kontrolliert Ausweise und Waren.'),
    ('5',   'Ein Flüchtlingstreck aus einem nahen Dorf — Schreckensnachrichten.'),
    ('6',   'Ein Pilger mit Reliquie, der Begleitung nach dem nächsten Tempel sucht.'),
    ('7',   'Fahrendes Volk schlägt Lager auf — Wahrsagerin bietet fragwürdige Prophezeiung an.'),
    ('8',   'Totenstille — ein frisch aufgestellter Galgen am Wegrand, das Opfer ist verschwunden.'),
]

BEGEGNUNG_RUINEN = [
    ('1',   '2W4 Zombies sitzen in einer dunklen Kammer und reagieren erst auf Lärm.'),
    ('2',   '1W4 Schakale (oder Schrat) fressen an einem frischen Kadaver.'),
    ('3',   'Ein Mimic tarnt sich als Truhe — Warnsignal: Schimmel in perfektem Quadratmuster.'),
    ('4',   'Ein Geist schwebt durch einen Flur; er sucht seinen Mörder.'),
    ('5',   'Ein Räubertrupp hat die Ruine als Basis genutzt; Wache schläft.'),
    ('6',   'Ein altes Golem-Wächter aktiviert sich automatisch beim Betreten eines Raums.'),
    ('7',   'Eine alte Bibliothek — 1W4 wertvolle Schriftrollen, aber Decke ist instabil.'),
    ('8',   'Ein Kult-Ritual läuft im Keller; Kultisten zu abgelenkt zum Bemerken — noch.'),
]

BEGEGNUNG_SUMPF = [
    ('1',   '1W4 Riesenschlangen umringeln leise einen Baum in der Nähe des Pfades.'),
    ('2',   'Irrlichter locken in den Sumpfnebel — Orientierung verloren ohne Würfelprobe.'),
    ('3',   'Ein Trapper, der den Sumpf kennt, bietet Führerdienste gegen fairen Lohn an.'),
    ('4',   '1W6 Lizardfolk-Krieger, misstrauisch gegenüber Eindringlingen in ihr Revier.'),
    ('5',   'Schlickfalle — Boden gibt nach; Strength-Probe oder 1 Runde eingesunken.'),
    ('6',   'Ein altes Hexenhaus auf Stelzen; die Bewohnerin handelt mit Giften und Zutaten.'),
    ('7',   'Ein Sumpftroll schläft auf einem Geflecht aus Schilf; Erschütterung weckt ihn.'),
    ('8',   'Grüner Nebel senkt sich: Giftnebel-Zone — CON-Probe oder 1 Stufe Erschöpfung.'),
]

# --- Wettertabellen (1W8, nach Jahreszeit) ---

WETTER_GEMUESSIGT_WINTER = [
    ('1',   'Eisiger Ostwind, Schneeschauer — Reise um 2 Meilen verlangsamt, Sicht 30 m.'),
    ('2',   'Dichter Schneefall, keine Sicht über 10 m — Orientierungsprobe nötig.'),
    ('3',   'Beißende Kälte (−10 °C), klarer Himmel, Boden vereist — Gelände schwierig.'),
    ('4',   'Grauer Winterhimmel, leichter Schneeflockentreiben, kalt aber trocken.'),
    ('5',   'Tauwetter: Matsch und Eis im Wechsel — Tempo halbe Meilen weniger pro Stunde.'),
    ('6',   'Klarer, strahlend blauer Wintertag, hart gefroren, perfekte Sicht.'),
    ('7',   'Schwerer Schneesturm, Winde bis Stufe 3 — Lager notwendig, kein Vorankommen.'),
    ('8',   'Dunstiger Morgennebel löst sich zu Mittag, mild für die Jahreszeit (0 °C).'),
]

WETTER_GEMUESSIGT_FRUEHLING = [
    ('1',   'Warmer Frühlingsregen, leichter Wind — Wege rutschig aber begehbar.'),
    ('2',   'Starker Gewitterregen mit Blitzen, kurze Unterbrechung des Weges nötig.'),
    ('3',   'Sonnig mit einzelnen Schauerwolken, angenehme 15 °C, leichte Brise.'),
    ('4',   'Dichter Frühlingsmorgennebel — Sicht 30 m bis 9 Uhr, dann klar.'),
    ('5',   'Kühler Frühlingstag, 8 °C, Wind aus Nord, keine Niederschläge.'),
    ('6',   'Wolkenbruch für 1W4 Stunden, danach Regenbogen und Sonnenschein.'),
    ('7',   'Warmer Südwind, Blütengeruch, ideales Reisewetter (18 °C, leicht bewölkt).'),
    ('8',   'Hagelschauer für 10 Minuten — kleine Beulen, Pferde scheu, danach trocken.'),
]

WETTER_GEMUESSIGT_SOMMER = [
    ('1',   'Schwüle Hitze (32 °C), kein Wind — CON-Probe nach 4 Stunden Marsch oder 1 Stufe Erschöpfung.'),
    ('2',   'Sommergewitter am Nachmittag, kräftige Schauer, Abkühlung auf 20 °C.'),
    ('3',   'Ideales Sommerwetter, 24 °C, leichte Brise, klare Sicht — Bonus +2 Meilen.'),
    ('4',   'Drückende Schwüle, keine Brise, Mücken — Ablenkung (Nachteil auf Wahrnehmung).'),
    ('5',   'Dunstige Sommerhitze, Wege flimmern — Distanzen scheinen weiter als sie sind.'),
    ('6',   'Heftiges Sommergewitter mit Starkregen (30 Min.) — Lager schlagen, kein Blitz.'),
    ('7',   'Sonnig und warm (26 °C), leichte Cirruswolken, angenehmer Reisewind.'),
    ('8',   'Trockenheit: verstaubte Wege, ausgetrocknete Bäche — Wasservorkommen prüfen.'),
]

WETTER_GEMUESSIGT_HERBST = [
    ('1',   'Dichter Herbstmorgennebel, Sicht 20 m, löst sich gegen Mittag, kalt (7 °C).'),
    ('2',   'Ruhiger Herbsttag mit buntem Laubfall, mild (14 °C), keine Wolken.'),
    ('3',   'Anhaltender Nieselregen, grauer Himmel, 10 °C — alles wird durchweicht.'),
    ('4',   'Stürmischer Herbstwind, Blätter fliegen, Äste knacken — Zelte brauchen Verankerung.'),
    ('5',   'Klarer, kühler Herbsttag mit Bodenfrost am Morgen, 5 °C, sonnig.'),
    ('6',   'Starker Herbstregen, Pfade werden schlammig — Geschwindigkeit −3 Meilen.'),
    ('7',   'Herbststurm: Böen bis 60 km/h, Bäume brechen — Orientierung erschwert, Probe nötig.'),
    ('8',   'Goldener Herbsttag, 16 °C, kaum Wind, Sicht weit — angenehmes Reisewetter.'),
]


# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------

def validate_entries(entries, name):
    """Prüft, dass entries genau die Ranges 1-8 lückenlos abdecken (Zahlen 1..8)."""
    errors = []
    if len(entries) < 8:
        errors.append(f'{name}: nur {len(entries)} Eintraege (< 8)')
        return errors
    # Prüfe, dass 1W8 abgedeckt ist (alle Werte 1..8 in ranges)
    covered = set()
    for (rng, _) in entries:
        if '-' in rng:
            start, end = map(int, rng.split('-'))
            for v in range(start, end + 1):
                covered.add(v)
        else:
            covered.add(int(rng))
    missing = set(range(1, 9)) - covered
    if missing:
        errors.append(f'{name}: fehlende Range-Werte {sorted(missing)}')
    extra = covered - set(range(1, 9))
    if extra:
        errors.append(f'{name}: Werte ausserhalb 1-8: {sorted(extra)}')
    return errors


def js_entries(entries, indent='        '):
    """Gibt JS-Array-Literal der entries zurück."""
    rows = []
    for (rng, text) in entries:
        rows.append(f'{indent}    {{ range: {json.dumps(rng)}, text: {json.dumps(text, ensure_ascii=False)} }}')
    return '[\n' + ',\n'.join(rows) + '\n' + indent + ']'


def js_table(table_id, dice_type, entries, indent='    '):
    inner = indent + '    '
    return (
        f'{indent}{{ id: {json.dumps(table_id)}, diceType: {dice_type}, '
        f'entries: {js_entries(entries, inner)} }}'
    )


# ---------------------------------------------------------------------------
# Build JS
# ---------------------------------------------------------------------------

def build_js():
    lines = []
    lines.append('// [SECTION:REISE_DEFAULT_TABLES]')
    lines.append('// ACHTUNG: Diese Datei wird von tools/generate_reise_tables.py generiert.')
    lines.append('// Nicht manuell bearbeiten! Aenderungen im Python-Skript vornehmen.')
    lines.append('// Aufruf: python tools/generate_reise_tables.py')
    lines.append('// ============================================================')
    lines.append('')

    # REISE_GELÄNDE (statische Daten, bleiben hier)
    lines.append('/**')
    lines.append(' * Gelaendetypen fuer den Reise-Simulator mit Distanzfaktoren.')
    lines.append(' * Distanzfaktor 0.5 = schwieriges Gelaende halbiert Tagesmarsch.')
    lines.append(' * @type {Array<{id: string, label: string, distanzFaktor: number}>}')
    lines.append(' */')
    lines.append('const REISE_GELÄNDE = [')
    lines.append('    { id: \'normal\',    label: \'Normal\',             distanzFaktor: 1.0 },')
    lines.append('    { id: \'schwierig\', label: \'Schwieriges Gelaende\', distanzFaktor: 0.5 },')
    lines.append('    { id: \'gebirge\',   label: \'Gebirge\',             distanzFaktor: 0.5 },')
    lines.append('    { id: \'sumpf\',     label: \'Sumpf\',               distanzFaktor: 0.5 },')
    lines.append('    { id: \'meer\',      label: \'Schiff\',              distanzFaktor: 1.0 }')
    lines.append('];')
    lines.append('')

    # REISE_TEMPO
    lines.append('/**')
    lines.append(' * Reisetempo-Definitionen (5e PHB S. 182).')
    lines.append(' * Basiswerte in Meilen/Tag.')
    lines.append(' * @type {Object.<string, {label: string, meilenProTag: number, effekt: string}>}')
    lines.append(' */')
    lines.append('const REISE_TEMPO = {')
    lines.append('    langsam: { label: \'Langsam\',  meilenProTag: 18, effekt: \'Heimlichkeit moeglich\' },')
    lines.append('    normal:  { label: \'Normal\',   meilenProTag: 24, effekt: \'\\u2014\' },')
    lines.append('    schnell: { label: \'Schnell\',  meilenProTag: 30, effekt: \'\\u22125 passive Wahrnehmung\' }')
    lines.append('};')
    lines.append('')

    # REISE_BEGEGNUNGS_TABELLEN
    lines.append('/**')
    lines.append(' * Begegnungstabellen nach Gelaendetyp (1W8).')
    lines.append(' * Format kompatibel mit rollWeightedEntry(table): {diceType, entries:[{range, text}]}')
    lines.append(' * @type {Object}')
    lines.append(' */')
    lines.append('const REISE_BEGEGNUNGS_TABELLEN = {')

    terrain_tables = [
        ('wald',    'begegnung_wald',    8, BEGEGNUNG_WALD),
        ('gebirge', 'begegnung_gebirge', 8, BEGEGNUNG_GEBIRGE),
        ('kueste',  'begegnung_kueste',  8, BEGEGNUNG_KUESTE),
        ('strasse', 'begegnung_strasse', 8, BEGEGNUNG_STRASSE),
        ('ruinen',  'begegnung_ruinen',  8, BEGEGNUNG_RUINEN),
        ('sumpf',   'begegnung_sumpf',   8, BEGEGNUNG_SUMPF),
    ]

    for i, (key, tid, dt, entries) in enumerate(terrain_tables):
        comma = ',' if i < len(terrain_tables) - 1 else ''
        lines.append(f'    {key}: {js_table(tid, dt, entries, "    ")}{comma}')

    lines.append('};')
    lines.append('')

    # WETTER_TABELLEN
    lines.append('/**')
    lines.append(' * Wettertabellen nach Klima und Jahreszeit (1W8).')
    lines.append(' * Format: WETTER_TABELLEN[klima][jahreszeit] = {id, diceType, entries}')
    lines.append(' * @type {Object}')
    lines.append(' */')
    lines.append('const WETTER_TABELLEN = {')
    lines.append("    'gemässigt': {")

    season_tables = [
        ('winter',    'wetter_gem_winter',  8, WETTER_GEMUESSIGT_WINTER),
        ('fruehling', 'wetter_gem_frueh',   8, WETTER_GEMUESSIGT_FRUEHLING),
        ('sommer',    'wetter_gem_sommer',  8, WETTER_GEMUESSIGT_SOMMER),
        ('herbst',    'wetter_gem_herbst',  8, WETTER_GEMUESSIGT_HERBST),
    ]

    for i, (key, tid, dt, entries) in enumerate(season_tables):
        comma = ',' if i < len(season_tables) - 1 else ''
        lines.append(f'        {key}: {js_table(tid, dt, entries, "        ")}{comma}')

    lines.append('    }')
    lines.append('};')
    lines.append('')

    # Exports
    lines.append("window.REISE_GELÄNDE = REISE_GELÄNDE;")
    lines.append('window.REISE_TEMPO = REISE_TEMPO;')
    lines.append('window.REISE_BEGEGNUNGS_TABELLEN = REISE_BEGEGNUNGS_TABELLEN;')
    lines.append('window.WETTER_TABELLEN = WETTER_TABELLEN;')
    lines.append('')

    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Validierung
# ---------------------------------------------------------------------------

def validate():
    errors = []
    all_terrain = [
        ('wald',    BEGEGNUNG_WALD),
        ('gebirge', BEGEGNUNG_GEBIRGE),
        ('kueste',  BEGEGNUNG_KUESTE),
        ('strasse', BEGEGNUNG_STRASSE),
        ('ruinen',  BEGEGNUNG_RUINEN),
        ('sumpf',   BEGEGNUNG_SUMPF),
    ]
    for name, entries in all_terrain:
        errors.extend(validate_entries(entries, f'Begegnung/{name}'))

    all_weather = [
        ('winter',    WETTER_GEMUESSIGT_WINTER),
        ('fruehling', WETTER_GEMUESSIGT_FRUEHLING),
        ('sommer',    WETTER_GEMUESSIGT_SOMMER),
        ('herbst',    WETTER_GEMUESSIGT_HERBST),
    ]
    for name, entries in all_weather:
        errors.extend(validate_entries(entries, f'Wetter/gemässigt/{name}'))

    return errors


# ---------------------------------------------------------------------------
# Haupt-Einstiegspunkt
# ---------------------------------------------------------------------------

def main():
    errors = validate()
    if errors:
        print('FEHLER — Tabellen unvollständig oder fehlerhaft:', file=sys.stderr)
        for e in errors:
            print(f'  - {e}', file=sys.stderr)
        sys.exit(1)

    js_content = build_js()

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(js_content)

    total_begegnung = sum(len(e) for (_, e) in [
        ('wald', BEGEGNUNG_WALD), ('gebirge', BEGEGNUNG_GEBIRGE),
        ('kueste', BEGEGNUNG_KUESTE), ('strasse', BEGEGNUNG_STRASSE),
        ('ruinen', BEGEGNUNG_RUINEN), ('sumpf', BEGEGNUNG_SUMPF),
    ])
    total_wetter = sum(len(e) for (_, e) in [
        ('winter', WETTER_GEMUESSIGT_WINTER), ('fruehling', WETTER_GEMUESSIGT_FRUEHLING),
        ('sommer', WETTER_GEMUESSIGT_SOMMER), ('herbst', WETTER_GEMUESSIGT_HERBST),
    ])

    print(f'OK — {OUTPUT_PATH}')
    print(f'     Begegnungen: {total_begegnung} Eintraege (6 Gelaende)')
    print(f'     Wetter:      {total_wetter} Eintraege (gemässigt × 4 Jahreszeiten)')
    print(f'     Gesamt:      {total_begegnung + total_wetter} Eintraege')


if __name__ == '__main__':
    main()
