#!/usr/bin/env python3
"""
tools/fetch-fonts.py — D-07: Google Fonts lokal buendeln.

Laedt die WOFF2-Dateien, die assets/styles/fonts.css einbindet, nach
assets/fonts/. Danach kein Internet mehr noetig fuer Schriften.

Verwendung:
  python tools/fetch-fonts.py
  python tools/fetch-fonts.py --dry-run   # Zeige URLs, lade nichts

================================================================
DIE FALLE, IN DIE DIESES WERKZEUG GEFUEHRT HAT
================================================================
Von 2026-06-12 bis 2026-10-13 lagen in assets/fonts/ ZEHN Dateien mit dem
FALSCHEN Subset: Inter, Roboto und Source Sans trugen Kyrillisch, Poppins trug
Devanagari. Fuenf der zehn trugen ein grosses 'A' (Inter dreimal, Source Sans
Pro zweimal), keine einzige ein kleines 'a', einen Umlaut oder ein Eszett.
Der Browser lud sie ohne 404,
fand keinen Glyphen und fiel zeichenweise auf Arial zurueck — vier der sieben
Eintraege im Schriftmenue des Editors waren Dekoration. Ursache: Googles
CSS-Antwort ordnet die @font-face-Bloecke cyrillic-ext, cyrillic, greek-ext,
greek, vietnamese, latin-ext, LATIN — latin steht ZULETZT, bei Poppins steht
devanagari ZUERST. `extract_woff2_url()` unten greift darum ausdruecklich den
`/* latin */`-Block und nicht den ersten Treffer.

Der Austausch in `b0ada5b` hat die zehn durch SIEBEN richtige ersetzt. Dieses
Werkzeug fuehrte danach weiter die zehn alten Namen, und ein Lauf hatte damit
drei Wirkungen gleichzeitig (Gegenpruefung Runde 4, Befunde 6 und 12):

  1. Fuenf abgeschaffte Namen kamen zurueck (roboto-400/700,
     inter-400/500/600). Nachgemessen lief `python build.py` damit GRUEN und
     veroeffentlichte ZWOELF Schriften; `pruefe_keine_fremdschriften()` in
     build.py deckelt das seit Befund 6, aber eine Haertung am Build ist kein
     Grund, hier falsch zu bleiben.
  2. `Source+Sans+3` wurde unter dem Pro-Namen abgelegt. Gemessen ist das ein
     echter Austausch und keine Umbenennung:
         Source+Sans+3    15.696 B   /s/sourcesans3/
         Source+Sans+Pro  14.812 B   /s/sourcesanspro/   <- Datei im Baum
  3. Roboto und Inter waeren als STATISCHE Instanzen gekommen. Beide liegen
     heute als EINE variable Datei vor; eine URL mit `wght@400` liefert dafuer
     einen festen Schnitt. Die Datei waere da, die Achse nicht, und
     `font-weight: 100 900` in fonts.css waere eine Luege. Die Achsen-URL
     lautet darum `wght@100..900`.

================================================================
DIE REGEL: FONTS.CSS IST DIE EINZIGE LISTE
================================================================
`SCHRIFT_PLAN` unten nennt je Datei den lokalen Namen UND die CSS-URL, und
`pruefe_plan_gegen_fonts_css()` vergleicht die Namen VOR dem ersten Download
mit den url()-Angaben in assets/styles/fonts.css — in BEIDE Richtungen. Weicht
etwas ab, laedt dieses Werkzeug nichts, sondern sagt, was auseinanderlaeuft.
Dieselbe Regel wie fuer Module, Templates und CSS (CLAUDE.md Gotcha 1,
ARCH-01) und wie fuer die Dateiliste von tools/pruefe-schriftdateien.js.

WARUM DER PLAN EIN PAAR (NAME, URL) IST und nicht wie vorher eine URL-Liste
plus eine Familie-Gewicht-Tabelle: der alte Weg las Familie und Gewicht aus
der URL ZURUECK (`([^:]+):wght@(\\d+)`) und suchte den Dateinamen ueber einen
Teilstring-Vergleich der Familiennamen (`'source sans 3' in 'source sans
pro'`). Daran hing Fehler 2 oben — der Vergleich war unscharf und hat genau
deshalb zwei Familien verwechselt. Und `wght@100..900` haette der Regex gar
nicht getroffen. Steht der Zielname im Paar, gibt es nichts zurueckzurechnen.

================================================================
GEMESSEN, NICHT BEHAUPTET
================================================================
Jede der sieben URLs ist gegen die Datei im Baum gemessen, Antwort fuer
Antwort bitgleich:
    roboto-variable.woff2       43.136 B  sha256 1404ca348bd75ef8
    inter-variable.woff2        48.256 B  sha256 3100e775e8616cd2
    poppins-400.woff2            7.884 B  sha256 7d93459d86585bfc
    poppins-500.woff2            7.748 B  sha256 cd36de204aca2d5f
    poppins-600.woff2            8.000 B  sha256 f4e80d9dfd374d02
    source-sans-pro-400.woff2   14.812 B  sha256 fb7b366bd65fb747
    source-sans-pro-600.woff2   14.772 B  sha256 a2fe82406659ad9a
Summe 144.608 B. Dieselben Zahlen in assets/fonts/HERKUNFT.md, in
tests/unit/schriftdateien.test.js und in
tests/e2e/features/schriftdateien.spec.js (BYTE_SUMME_SOLL).

Ratsche: tests/build/test_fetch_fonts.py (laedt nichts, prueft den Plan).
"""

import argparse
import os
import re
import sys
import urllib.request

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Zielverzeichnis und die EINZIGE Liste, gegen die sich dieses Werkzeug prueft.
OUTPUT_DIR = os.path.join(REPO_ROOT, 'assets', 'fonts')
FONTS_CSS = os.path.join(REPO_ROOT, 'assets', 'styles', 'fonts.css')

# User-Agent: Google Fonts antwortet mit WOFF2 nur bei modernem Browser-UA.
HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
}

# (lokaler Dateiname, Google-Fonts-CSS2-URL).
#
# Roboto und Inter: EINE variable Datei je Familie, Achsenbereich in der URL.
# Poppins und Source Sans Pro: statisch, eine Datei je Gewicht.
# Die Familie im Namen ist die Familie in der URL — kein Rueckrechnen.
SCHRIFT_PLAN = (
    (
        'roboto-variable.woff2',
        'https://fonts.googleapis.com/css2?family=Roboto:wght@100..900&display=swap',
    ),
    (
        'inter-variable.woff2',
        'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
    ),
    (
        'poppins-400.woff2',
        'https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap',
    ),
    (
        'poppins-500.woff2',
        'https://fonts.googleapis.com/css2?family=Poppins:wght@500&display=swap',
    ),
    (
        'poppins-600.woff2',
        'https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap',
    ),
    (
        'source-sans-pro-400.woff2',
        'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400&display=swap',
    ),
    (
        'source-sans-pro-600.woff2',
        'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@600&display=swap',
    ),
)

# Die url()-Angaben in fonts.css. Dieselbe Form wie in
# tools/pruefe-schriftdateien.js und build.py, nur gegen den QUELLPFAD
# ('../fonts/') statt gegen den umgeschriebenen des Buendels.
FONTS_CSS_URL_MUSTER = re.compile(r"""url\(\s*['"]?\.\./fonts/([^'")]+)['"]?\s*\)""")


def lese_fonts_css_namen(css_pfad=None):
    """Die Dateinamen, die assets/styles/fonts.css per url() einbindet."""
    pfad = css_pfad or FONTS_CSS
    with open(pfad, encoding='utf-8') as f:
        return sorted(set(FONTS_CSS_URL_MUSTER.findall(f.read())))


def pruefe_plan_gegen_fonts_css(streng=True):
    """SCHRIFT_PLAN und fonts.css muessen dieselben Dateien nennen.

    VOR dem ersten Download, und in BEIDE Richtungen:
      - eine Datei im Plan, die fonts.css nicht nennt, landet unangefordert im
        Baum (Befund 6: der Build hat das vier Monate lang nicht gemerkt);
      - eine Datei in fonts.css, die der Plan nicht nennt, kann dieses
        Werkzeug nicht beschaffen — der Nutzer glaubt, er habe alles.

    @param streng True beendet den Prozess bei Abweichung (Vorgabe).
    @returns Liste der Befundzeilen (leer = in Ordnung).
    """
    try:
        genannt = lese_fonts_css_namen()
    except OSError as e:
        print(f"[FEHLER] assets/styles/fonts.css nicht lesbar: {e}")
        if streng:
            sys.exit(1)
        return [str(e)]

    geplant = sorted(name for name, _ in SCHRIFT_PLAN)
    befunde = [f"nur in diesem Werkzeug, kein @font-face dafuer: {n}"
               for n in geplant if n not in genannt]
    befunde += [f"nur in fonts.css, dieses Werkzeug holt es nicht: {n}"
                for n in genannt if n not in geplant]

    if befunde:
        print("[FEHLER] Der Schriftplan weicht von assets/styles/fonts.css ab:")
        for b in befunde:
            print(f"   {b}")
        print()
        print("   fonts.css ist die einzige Liste. Eine Datei, die dort kein")
        print("   @font-face hat, wird vom Browser niemals angefordert — sie")
        print("   liegt nur im Baum, wird vom Job 'deploy' veroeffentlicht und")
        print("   faellt niemandem auf. Genau so lagen von 2026-06-12 bis")
        print("   2026-10-13 zehn Dateien mit dem FALSCHEN Subset hier.")
        print("   Erst SCHRIFT_PLAN und fonts.css in Deckung bringen, dann laden.")
        if streng:
            sys.exit(1)
    return befunde


def fetch_url(url, headers=None):
    """Laedt eine URL und gibt den Inhalt zurueck."""
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()


def extract_woff2_url(css_content):
    """Die WOFF2-URL des LATIN-Subsets aus Googles CSS-Antwort.

    WR-12: Die CSS2-Antwort enthaelt mehrere @font-face-Bloecke mit
    unicode-range (cyrillic/greek/... zuerst, latin ZULETZT; bei Poppins
    devanagari ZUERST). Der erste Treffer waere also verlaesslich das falsche
    Subset — und weil die lokale fonts.css KEINE unicode-range setzt, wuerde
    diese eine Datei fuer ALLE Zeichen benutzt. Das war der ganze Vorfall.
    """
    # Der Block mit dem Kommentar /* latin */ (exakt, NICHT latin-ext).
    match = re.search(
        r"/\* latin \*/.*?url\((https://[^)]+\.woff2)\)\s+format\('woff2'\)",
        css_content,
        re.DOTALL,
    )
    if match:
        return match.group(1)
    # KEIN Rueckfall auf den ersten Treffer. Er stand hier und war die bequeme
    # Haelfte des Vorfalls: aendert Google das Kommentarformat, holt der
    # Rueckfall schweigend das cyrillische Subset. Lieber nichts holen und es
    # sagen.
    return None


def download_fonts(dry_run=False):
    """Laedt die Schriften aus SCHRIFT_PLAN."""
    # ZUERST der Waechter, dann alles andere. Ein Lauf gegen einen Plan, der
    # nicht zu fonts.css passt, ist der Weg zurueck in den kaputten Stand.
    pruefe_plan_gegen_fonts_css()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Font-Bundle: Lade {len(SCHRIFT_PLAN)} Schriften nach {OUTPUT_DIR}")
    print()

    success_count = 0
    error_count = 0

    for local_name, css_url in SCHRIFT_PLAN:
        local_path = os.path.join(OUTPUT_DIR, local_name)

        if os.path.exists(local_path):
            size = os.path.getsize(local_path)
            print(f"  OK (cached): {local_name} ({size:,} Bytes)")
            success_count += 1
            continue

        if dry_run:
            print(f"  DRY-RUN: {local_name} wuerde von {css_url} geladen")
            success_count += 1
            continue

        try:
            # Schritt 1: CSS laden (enthaelt die WOFF2-URLs je Subset)
            css_text = fetch_url(css_url, HEADERS).decode('utf-8')

            # Schritt 2: die URL des LATIN-Subsets herausziehen
            woff2_url = extract_woff2_url(css_text)
            if not woff2_url:
                print(f"  ERROR: Kein /* latin */-Block in der Antwort fuer {local_name}")
                print(f"         URL: {css_url}")
                print("         Google hat das Kommentarformat geaendert. NICHT auf den")
                print("         ersten woff2-Treffer ausweichen — das ist das cyrillische")
                print("         Subset (siehe Kopf dieser Datei).")
                error_count += 1
                continue

            # Schritt 3+4: Datei laden und speichern
            woff2_data = fetch_url(woff2_url)
            with open(local_path, 'wb') as f:
                f.write(woff2_data)
            print(f"  GELADEN: {local_name} ({len(woff2_data):,} Bytes)")
            success_count += 1

        except Exception as e:  # noqa: BLE001 — Netz/IO/Decode gleich behandelt
            print(f"  ERROR: {local_name} — {e}")
            error_count += 1

    print()
    print(f"Ergebnis: {success_count} erfolgreich, {error_count} Fehler")

    if error_count > 0:
        print("HINWEIS: Fehlende Schriften koennen von Hand geholt werden.")
        print("  Die genauen Quellen, Groessen und sha256-Summen der sieben")
        print("  Dateien stehen in assets/fonts/HERKUNFT.md.")
        sys.exit(1)

    print("Nachpruefen: node tools/pruefe-schriftdateien.js --check")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Lade Google Fonts lokal herunter (D-07)')
    parser.add_argument('--dry-run', action='store_true', help='Zeige URLs ohne zu laden')
    args = parser.parse_args()

    download_fonts(dry_run=args.dry_run)
