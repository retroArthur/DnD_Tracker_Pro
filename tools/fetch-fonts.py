#!/usr/bin/env python3
"""
tools/fetch-fonts.py — D-07: Google Fonts lokal bündeln
Lädt WOFF2-Dateien von Google Fonts herunter und speichert sie in assets/fonts/.
Nach dem Download kein Internet mehr nötig für Schriften.

Benötigte Schriften (aus build.py HTML-Head):
  - Roboto 400, 700
  - Inter 400, 500, 600
  - Poppins 400, 500, 600
  - Source Sans Pro 400, 600

Verwendung:
  python tools/fetch-fonts.py
  python tools/fetch-fonts.py --dry-run   # Zeige URLs, lade nichts
"""

import urllib.request
import os
import sys
import argparse

# Zielverzeichnis
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'fonts')

# User-Agent: Google Fonts antwortet mit WOFF2 nur bei modernem Browser-UA
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# Google Fonts CSS2-API URLs pro Familie+Gewicht
FONT_CSS_URLS = [
    # Roboto
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap',
    # Inter
    'https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap',
    'https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap',
    'https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap',
    # Poppins
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@500&display=swap',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap',
    # Source Sans Pro (heißt jetzt Source Sans 3 in Google Fonts)
    'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400&display=swap',
    'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@600&display=swap',
]

# Dateinamen-Mapping: CSS-URL -> lokaler Dateiname
FONT_FILENAMES = {
    'Roboto': {400: 'roboto-400.woff2', 700: 'roboto-700.woff2'},
    'Inter': {400: 'inter-400.woff2', 500: 'inter-500.woff2', 600: 'inter-600.woff2'},
    'Poppins': {400: 'poppins-400.woff2', 500: 'poppins-500.woff2', 600: 'poppins-600.woff2'},
    'Source Sans 3': {400: 'source-sans-pro-400.woff2', 600: 'source-sans-pro-600.woff2'},
}


def fetch_url(url, headers=None):
    """Lädt eine URL und gibt den Inhalt zurück."""
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()


def extract_woff2_url(css_content):
    """Extrahiert WOFF2-URL aus Google Fonts CSS-Antwort."""
    import re
    # Suche nach: src: url(https://...woff2) format('woff2')
    match = re.search(r"url\((https://[^)]+\.woff2)\)\s+format\('woff2'\)", css_content)
    if match:
        return match.group(1)
    return None


def extract_family_weight(css_url):
    """Extrahiert Schriftfamilie und Gewicht aus der CSS-URL."""
    import re
    import urllib.parse

    parsed = urllib.parse.urlparse(css_url)
    params = urllib.parse.parse_qs(parsed.query)
    family_str = params.get('family', [''])[0]

    # Format: "Roboto:wght@400" oder "Source+Sans+3:wght@600"
    match = re.match(r'([^:]+):wght@(\d+)', family_str)
    if match:
        family = match.group(1).replace('+', ' ')
        weight = int(match.group(2))
        return family, weight
    return None, None


def get_local_filename(family, weight):
    """Gibt den lokalen Dateinamen für die Schrift zurück."""
    for fam_name, weights in FONT_FILENAMES.items():
        if fam_name.lower() in family.lower() or family.lower() in fam_name.lower():
            return weights.get(weight)
    return None


def download_fonts(dry_run=False):
    """Lädt alle Schriften herunter."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Font-Bundle: Lade {len(FONT_CSS_URLS)} Schriften nach {OUTPUT_DIR}")
    print()

    success_count = 0
    skip_count = 0
    error_count = 0

    for css_url in FONT_CSS_URLS:
        family, weight = extract_family_weight(css_url)
        if not family:
            print(f"  SKIP: Konnte Familie/Gewicht nicht aus URL extrahieren: {css_url}")
            skip_count += 1
            continue

        local_name = get_local_filename(family, weight)
        if not local_name:
            print(f"  SKIP: Kein Dateiname für {family} {weight}: {css_url}")
            skip_count += 1
            continue

        local_path = os.path.join(OUTPUT_DIR, local_name)

        # Bereits vorhanden?
        if os.path.exists(local_path):
            size = os.path.getsize(local_path)
            print(f"  OK (cached): {local_name} ({size:,} Bytes)")
            success_count += 1
            continue

        if dry_run:
            print(f"  DRY-RUN: {local_name} würde von {css_url} geladen")
            success_count += 1
            continue

        try:
            # Schritt 1: CSS laden (enthält WOFF2-URL)
            css_bytes = fetch_url(css_url, HEADERS)
            css_text = css_bytes.decode('utf-8')

            # Schritt 2: WOFF2-URL extrahieren
            woff2_url = extract_woff2_url(css_text)
            if not woff2_url:
                print(f"  ERROR: Keine WOFF2-URL in CSS für {family} {weight}")
                error_count += 1
                continue

            # Schritt 3: WOFF2-Datei laden
            woff2_data = fetch_url(woff2_url)

            # Schritt 4: Speichern
            with open(local_path, 'wb') as f:
                f.write(woff2_data)

            size = len(woff2_data)
            print(f"  GELADEN: {local_name} ({size:,} Bytes)")
            success_count += 1

        except Exception as e:
            print(f"  ERROR: {local_name} — {e}")
            error_count += 1

    print()
    print(f"Ergebnis: {success_count} erfolgreich, {skip_count} übersprungen, {error_count} Fehler")

    if error_count > 0:
        print("HINWEIS: Fehlende Fonts können manuell heruntergeladen werden:")
        print("  https://fonts.google.com/")
        sys.exit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Lade Google Fonts lokal herunter (D-07)')
    parser.add_argument('--dry-run', action='store_true', help='Zeige URLs ohne zu laden')
    args = parser.parse_args()

    download_fonts(dry_run=args.dry_run)
