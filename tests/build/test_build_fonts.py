#!/usr/bin/env python3
"""
TDD-Tests: build.py legt die Schriftdateien neben das Bundle (SCHR).

WARUM DIESE DATEI EXISTIERT. build.py schreibt die url()-Pfade aus
assets/styles/fonts.css auf './assets/fonts/' um (build.py, CR-08) — relativ
zur erzeugten HTML-Datei. Es kopierte die Dateien aber nicht dorthin. Wer das
Bundle oeffnet, bekam darum zehn Schriften, die nicht aufloesen, und im
CI-Job 'e2e' (.github/workflows/ci.yml) war genau das der Zustand: checkout
-> npm ci -> python build.py -> npx playwright test, OHNE Kopierschritt.
Gemessen im nachgestellten CI-Zustand (frischer Worktree auf b824c5a):

    $ python build.py && ls dist/
    dnd-tracker-bundled.html            (dist/assets/fonts/: 0 Dateien)
    $ CI=1 npx playwright test tests/e2e/features/schriftdateien.spec.js
    2 failed / 11 passed, Retries erschoepft
      Teil 0 Nicht-Leerlauf -> 'Roboto/400 steht auf "error", nicht "loaded"'
      Teil 4 -> expect.poll(rohAntworten.length) Expected >= 10, Received 0

Kopiert wurde nur in den Jobs 'build' und 'deploy', je von Hand per
'cp -r assets/fonts dist/assets/'. Das sind zwei handgepflegte Stellen fuer
eine Zusicherung, die build.py selbst schuldet — genau das Muster, das
CLAUDE.md fuer Modul-, Template- und CSS-Listen verbietet (Gotcha 1, ARCH-01).
Darum kopiert build.py jetzt selbst, und diese Datei haelt das fest.

Die Dateiliste kommt aus dem Verzeichnis, nie aus einem Literal hier — ein
Waechter mit eigener Liste uebersieht die elfte Datei.

STAND 2026-10-13: AUS ZEHN DATEIEN SIND SIEBEN GEWORDEN. Die zehn oben
genannten trugen seit ihrer Geburt das falsche Subset (kyrillisch bzw.
Devanagari; fuenf trugen ein grosses 'A', keine ein kleines 'a' oder einen
Umlaut); der Austausch hat sie durch sieben
richtige ersetzt — Roboto und Inter als je EINE variable Datei fuer alle
Gewichte, Poppins und Source Sans Pro statisch je Gewicht. Die Messprotokolle
in den Docstrings dieser Datei nennen weiter 'zehn': sie sind auf einen Commit
datiert und bleiben als Protokoll stehen. Die ZUSICHERUNGEN nennen
SCHRIFTDATEIEN_SOLL, und das ist jetzt 7.

Herkunft, Lizenz und Nachpruefung je Datei: assets/fonts/HERKUNFT.md.
"""

import os
import sys
from pathlib import Path

import pytest

# Projektwurzel in den Pfad (wie in test_build_deduplication.py)
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import build as build_module
from build import kopiere_schriftdateien

REPO = Path(__file__).parent.parent.parent
QUELL_SCHRIFTEN = REPO / 'assets' / 'fonts'

# Die Zahl der gebuendelten Schriftdateien, EXAKT — nicht '>= N'.
#
# Sie stand hier zweimal als '>= 10' und war nach dem Austausch (sieben Dateien)
# an beiden Stellen rot. '>= 7' waere der bequeme Weg und der falsche: der Zweck
# der Zahl ist Leerlauf-Erkennung, und eine untere Schranke uebersieht genau den
# Fall, der hier schon einmal eingetreten ist — eine Datei, die versehentlich
# DAZUKOMMT. Die Waisen in dist/assets/fonts/ (siehe TestKeineWaisenNebenDemBuendel
# unten) sind dieselbe Krankheit eine Ebene weiter. Die exakte Zahl faengt den
# Leerlauf genauso (0 != 7) und zusaetzlich das Wachsen.
#
# Dieselbe Zahl und dieselbe Begruendung in tests/unit/schriftdateien.test.js
# (SCHRIFTDATEIEN_SOLL) und tests/e2e/features/schriftdateien.spec.js (FACES_SOLL).
SCHRIFTDATEIEN_SOLL = 7

# Endungen, die der Kopierschritt als Schrift behandelt. Spiegelt
# build.SCHRIFT_DATEIENDUNGEN — hier bewusst ein eigenes Literal, damit der
# Waechter rot wird, wenn dort jemand die Menge aufweitet.
SCHRIFT_ENDUNGEN = {'.woff2', '.woff', '.ttf', '.otf'}


def _woff2_namen(verzeichnis):
    """Die woff2-Dateinamen eines Verzeichnisses, sortiert."""
    if not verzeichnis.is_dir():
        return []
    return sorted(p.name for p in verzeichnis.iterdir() if p.suffix == '.woff2')


def _alle_namen(verzeichnis):
    """ALLE Dateinamen eines Verzeichnisses, sortiert — auch die, die keine
    Schrift sind. Ohne diesen Blick ist nicht zu sehen, was der Kopierschritt
    zusaetzlich mitnimmt."""
    if not verzeichnis.is_dir():
        return []
    return sorted(p.name for p in verzeichnis.iterdir() if p.is_file())


class TestSchriftenNebenDasBundle:
    """build.py schuldet die Dateien, auf die es die url()-Pfade umschreibt."""

    def test_quellverzeichnis_fuehrt_ueberhaupt_schriften(self):
        """Gegenprobe gegen Leerlauf: ohne Quelldateien sagt alles Folgende
        nichts, weil 'alle kopiert' bei null Dateien trivial wahr ist."""
        namen = _woff2_namen(QUELL_SCHRIFTEN)
        assert len(namen) == SCHRIFTDATEIEN_SOLL, (
            f"assets/fonts/ fuehrt {len(namen)} woff2 — erwartet genau "
            f"{SCHRIFTDATEIEN_SOLL}: {namen}. Bei NULL prueft diese Datei nichts "
            f"('alle kopiert' ist dann trivial wahr). Bei MEHR ist eine Datei "
            f"dazugekommen, die weder fonts.css noch sw.js kennt — dann erst "
            f"assets/fonts/HERKUNFT.md fortschreiben und die Zahl hier mitziehen."
        )

    def test_kopiert_alle_schriften_in_ein_leeres_ziel(self, tmp_path):
        """Der Kopierschritt legt jede Quelldatei bytegleich unter
        <dist>/assets/fonts/ ab."""
        ziel = tmp_path / 'dist'
        ziel.mkdir()

        anzahl = kopiere_schriftdateien(str(ziel))

        kopiert = ziel / 'assets' / 'fonts'
        assert _woff2_namen(kopiert) == _woff2_namen(QUELL_SCHRIFTEN)
        assert anzahl == len(_woff2_namen(QUELL_SCHRIFTEN))
        for name in _woff2_namen(QUELL_SCHRIFTEN):
            assert (kopiert / name).read_bytes() == (QUELL_SCHRIFTEN / name).read_bytes(), \
                f"{name} wurde nicht bytegleich kopiert"

    def test_kopiert_nicht_in_einen_unterordner_fonts_fonts(self, tmp_path):
        """CR-09 in ci.yml beschreibt die Falle: 'cp -r assets/fonts
        dist/assets/' kopiert das Quellverzeichnis HINEIN, sobald das Ziel
        schon existiert (dist/assets/fonts/fonts/*). Ein zweiter Lauf darf
        das nicht erzeugen — der Kopierschritt muss idempotent sein."""
        ziel = tmp_path / 'dist'
        ziel.mkdir()

        kopiere_schriftdateien(str(ziel))
        kopiere_schriftdateien(str(ziel))

        kopiert = ziel / 'assets' / 'fonts'
        assert not (kopiert / 'fonts').exists(), \
            "Der zweite Lauf hat dist/assets/fonts/fonts/ erzeugt"
        assert _woff2_namen(kopiert) == _woff2_namen(QUELL_SCHRIFTEN)

    def test_ueberschreibt_eine_veraltete_kopie(self, tmp_path):
        """Ein alter Rueckstand im Ziel darf nicht ueberleben — sonst
        veroeffentlicht der Deploy eine Schrift von vorletzter Woche."""
        ziel = tmp_path / 'dist'
        (ziel / 'assets' / 'fonts').mkdir(parents=True)
        erste = _woff2_namen(QUELL_SCHRIFTEN)[0]
        (ziel / 'assets' / 'fonts' / erste).write_bytes(b'veralteter Rueckstand')

        kopiere_schriftdateien(str(ziel))

        assert (ziel / 'assets' / 'fonts' / erste).read_bytes() == \
            (QUELL_SCHRIFTEN / erste).read_bytes()

    def test_build_ruft_den_kopierschritt_mit_dem_dist_verzeichnis(self, monkeypatch):
        """Verdrahtung: der Dev-Build nutzt den Kopierschritt wirklich.
        write_file wird stillgelegt (wie in test_build_deduplication.py, F7),
        damit der Waechter nicht das echte dist/ dieses Repos ueberschreibt;
        der Kopierschritt wird mitgeschrieben statt ausgefuehrt."""
        geschrieben = []
        monkeypatch.setattr(
            build_module, 'write_file', lambda p, c: geschrieben.append(os.path.basename(p))
        )
        kopien = []
        monkeypatch.setattr(
            build_module, 'kopiere_schriftdateien', lambda d: kopien.append(d) or 0
        )
        # Auch die Verweispruefung stilllegen — wie im Geschwisterfall
        # test_build_prueft_die_verweise_des_erzeugten_buendels. Dieser Fall prueft die
        # VERDRAHTUNG des Kopierschritts, nicht die Pruefung. Lief sie hier echt, pruefte
        # sie dist/assets/fonts/ gegen Dateien, die der stillgelegte Kopierschritt gerade
        # nicht gelegt hat: auf einem frischen Baum '[FEHLER] 10 Schriftverweis(e) ...
        # loesen nicht auf' und sys.exit(1). Gruen war der Fall nur, wenn ein FRUEHERER
        # Build die Dateien schon dorthin gelegt hatte — er hing an einem Rueckstand in
        # dist/ und an der Schrittreihenfolge in ci.yml (build vor pytest).
        monkeypatch.setattr(build_module, 'pruefe_schriftverweise', lambda css, d: [])

        build_module.build()

        assert geschrieben == ['dnd-tracker-bundled.html'], \
            f"Unerwartete Schreibvorgaenge: {geschrieben}"
        assert len(kopien) == 1, f"Kopierschritt {len(kopien)}-mal aufgerufen, erwartet 1"
        erwartet = os.path.normcase(os.path.abspath(os.path.join(build_module.SCRIPT_DIR, 'dist')))
        assert os.path.normcase(os.path.abspath(kopien[0])) == erwartet

    def test_production_build_ruft_den_kopierschritt_ebenfalls(self, monkeypatch):
        """Auch der Production-Build: der Deploy-Job veroeffentlicht dist/,
        und die SW-Precache-Pfade ./assets/fonts/*.woff2 waeren sonst 404."""
        monkeypatch.setattr(build_module, 'write_file', lambda p, c: None)
        kopien = []
        monkeypatch.setattr(
            build_module, 'kopiere_schriftdateien', lambda d: kopien.append(d) or 0
        )
        # Verweispruefung stilllegen, gleiche Begruendung wie im Dev-Fall darueber.
        monkeypatch.setattr(build_module, 'pruefe_schriftverweise', lambda css, d: [])

        build_module.build(production=True)

        assert len(kopien) == 1, f"Kopierschritt {len(kopien)}-mal aufgerufen, erwartet 1"


class TestKeineWaisenNebenDemBuendel:
    """Der Kopierschritt legt dazu, raeumt aber nicht auf (Befund Runde 2).

    NACHGESTELLT, nicht vermutet. Im Arbeitsbaum dieses Repos, nach dem
    Austausch von zehn auf sieben Dateien:

        $ ls dist/assets/fonts/*.woff2 | wc -l
          12
        $ comm -13 <(ls assets/fonts | sort) <(ls dist/assets/fonts | sort)
          inter-400.woff2  inter-500.woff2  inter-600.woff2
          roboto-400.woff2 roboto-700.woff2        (66.140 Bytes)

    Fuenf Waisen mit genau den Namen, die der Austausch abgeschafft hat — und
    mit dem FALSCHEN Subset, das der ganze Vorfall war. shutil.copy2() je
    Quelldatei legt dazu und nimmt nie weg, und nichts darunter stellt das rot:
    pruefe_schriftverweise() prueft die Gegenrichtung ('jeder Verweis loest
    auf'), eine Waise wird von keinem Verweis genannt.

    WARUM DAS NICHT KOSMETIK IST. dist/ ist gitignoriert, der CI-Job startet
    also sauber und sieht nichts — aber der Job 'deploy' veroeffentlicht dist/,
    und ein Arbeitsbaum laeuft damit gruen, wo er es nicht sollte. Das ist
    derselbe Mechanismus wie im Docstring oben, nur von der anderen Seite: dort
    verdeckte alter Rueckstand in dist/ einen FEHLENDEN Kopierschritt, hier
    verdeckt er abgeschaffte Dateien. Beides heisst: dist/ muss sagen, was der
    Quellbaum sagt — nicht mehr.

    Geprueft wird in tmp_path, nicht am echten dist/: eine Zusicherung gegen
    das echte dist/ waere umgebungsabhaengig (in CI gruen, lokal rot) und
    damit wertlos.
    """

    def test_entfernt_eine_waise_aus_dem_ziel(self, tmp_path):
        """Eine Schriftdatei im Ziel, die die Quelle nicht (mehr) kennt, muss
        verschwinden — sonst veroeffentlicht der Deploy eine abgeschaffte
        Schrift weiter."""
        ziel = tmp_path / 'dist'
        (ziel / 'assets' / 'fonts').mkdir(parents=True)
        waise = ziel / 'assets' / 'fonts' / 'roboto-400.woff2'
        waise.write_bytes(b'abgeschaffte Schrift mit kyrillischem Subset')

        kopiere_schriftdateien(str(ziel))

        assert not waise.exists(), (
            "roboto-400.woff2 liegt weiter neben dem Buendel, obwohl die Quelle "
            "sie nicht kennt — der Deploy veroeffentlicht sie mit."
        )
        assert _woff2_namen(ziel / 'assets' / 'fonts') == _woff2_namen(QUELL_SCHRIFTEN)

    def test_laesst_fremde_dateien_im_ziel_unberuehrt(self, tmp_path):
        """Gegenprobe zum Aufraeumen: es darf NUR Schriften wegnehmen. Ein
        'rm -rf dist/assets/fonts/*' waere der bequeme Weg und wuerde beim
        naechsten Nachbarn im Verzeichnis Schaden anrichten."""
        ziel = tmp_path / 'dist'
        (ziel / 'assets' / 'fonts').mkdir(parents=True)
        fremd = ziel / 'assets' / 'fonts' / 'LIZENZ.txt'
        fremd.write_bytes(b'kein Schriftschnitt')

        kopiere_schriftdateien(str(ziel))

        assert fremd.exists(), "Der Kopierschritt hat eine Nicht-Schrift geloescht"
        assert fremd.read_bytes() == b'kein Schriftschnitt'

    def test_kopiert_schriften_und_lizenz_aber_nicht_die_doku(self, tmp_path, monkeypatch):
        """Der Kopierschritt nimmt Schriften und ihre LIZENZ, nicht
        Verzeichnisinhalt.

        Zwei Nicht-Schriften liegen in assets/fonts/, und sie werden
        verschieden behandelt — das ist der Kern dieses Falls:

          HERKUNFT.md bleibt im Quellbaum. Entwicklerdokumentation, von nichts
            verlinkt; neben dem Buendel haette sie nur Ladezeit gekostet.
          OFL.txt MUSS mit. SIL OFL 1.1, Bedingung 2 verlangt, dass jede Kopie
            der Schriftsoftware den Urhebervermerk UND den Lizenztext
            mitfuehrt. Der Job 'deploy' veroeffentlicht dist/, und sw.js
            spielt das Verzeichnis beim Nutzer aus — beides sind Kopien im
            Sinne der Lizenz. Nachgemessen trug dist/assets/fonts/ bis
            2026-10-14 die sieben Schriften OHNE ihre Lizenz.
        """
        quelle = tmp_path / 'quelle' / 'assets' / 'fonts'
        quelle.mkdir(parents=True)
        (quelle / 'echte-400.woff2').write_bytes(b'Schrift')
        (quelle / 'HERKUNFT.md').write_text('Herkunftsnotiz', encoding='utf-8')
        (quelle / 'OFL.txt').write_text('Lizenztext', encoding='utf-8')
        monkeypatch.setattr(build_module, 'SOURCE_DIR', str(tmp_path / 'quelle'))
        ziel = tmp_path / 'dist'
        ziel.mkdir()

        anzahl = kopiere_schriftdateien(str(ziel))

        kopiert = ziel / 'assets' / 'fonts'
        assert _alle_namen(kopiert) == ['OFL.txt', 'echte-400.woff2'], (
            f"Erwartet Schrift UND Lizenz, ohne die Doku: {_alle_namen(kopiert)}"
        )
        # `anzahl` ist die Zahl der SCHRIFTEN. pruefe_schriftverweise() und die
        # Verdrahtungsfaelle lesen sie; eine Lizenzdatei darf sie nicht
        # aufblaehen.
        assert anzahl == 1, f"anzahl={anzahl} zaehlt Nicht-Schriften mit"

    def test_fehlende_lizenz_beendet_den_build(self, tmp_path, monkeypatch):
        """Die Lizenzpflicht ist HART, nicht hoeflich.

        Ohne diese Schranke ist der Zustand von 2026-10-13 wieder erreichbar:
        sieben Schriften neben dem Buendel, kein Lizenztext, Exit 0. Ein
        Lizenzverstoss faellt niemandem auf, weil nichts rot wird.
        """
        quelle = tmp_path / 'quelle' / 'assets' / 'fonts'
        quelle.mkdir(parents=True)
        (quelle / 'echte-400.woff2').write_bytes(b'Schrift')
        monkeypatch.setattr(build_module, 'SOURCE_DIR', str(tmp_path / 'quelle'))
        ziel = tmp_path / 'dist'
        ziel.mkdir()

        with pytest.raises(SystemExit) as abbruch:
            kopiere_schriftdateien(str(ziel))
        assert abbruch.value.code == 1

    def test_die_pflichtliste_ist_nicht_leer(self):
        """Gegenprobe gegen Leerlauf: waere SCHRIFT_PFLICHTDATEIEN leer, waeren
        die zwei Faelle darueber trivial erfuellt — nichts muesste mitreisen,
        und nichts koennte fehlen."""
        assert build_module.SCHRIFT_PFLICHTDATEIEN == {'OFL.txt'}

    def test_das_echte_quellverzeichnis_fuehrt_nur_schriften_doku_und_lizenz(self):
        """Gegenprobe gegen Leerlauf der Faelle darueber: sie nehmen an, dass in
        assets/fonts/ ueberhaupt etwas liegt, das keine Schrift ist — eines
        davon mitzukopieren, eines nicht. Faellt eine der beiden Dateien weg,
        pruefen sie eine Lage, die es nicht gibt."""
        nicht_schrift = [
            n for n in _alle_namen(QUELL_SCHRIFTEN)
            if not any(n.endswith(e) for e in SCHRIFT_ENDUNGEN)
        ]
        assert nicht_schrift == ['HERKUNFT.md', 'OFL.txt'], (
            f"assets/fonts/ fuehrt neben den Schriften {nicht_schrift} — erwartet "
            f"genau ['HERKUNFT.md', 'OFL.txt']. Ohne HERKUNFT.md ist die Herkunft "
            f"der sieben Dateien nirgends festgehalten (der Vorfall, der sie "
            f"verlangt hat: fonts.css); ohne OFL.txt ist die Weitergabe ein "
            f"Lizenzverstoss (OFL 1.1, Bedingung 2)."
        )


class TestFehlendeSchriftenBeendenDenBuild:
    """Der Kopierschritt darf nicht weich scheitern (Gegenpruefung Runde 2, B-06).

    NACHGESTELLT, nicht vermutet. Im isolierten HEAD-Export:

        $ mv assets/fonts assets/fonts_weg && python build.py
          WARNUNG Schriftverzeichnis fehlt: .../assets/fonts
          [SUCCESS] Build abgeschlossen! (Development)
          BUILD_EXIT=0
        $ grep -o "url('./assets/fonts/[a-z0-9-]*\\.woff2')" \\
              dist/dnd-tracker-bundled.html | wc -l
          10

    Also: ein Buendel mit zehn unaufloesbaren url()-Pfaden, eine Warnung, und
    Exit 0. Vorher liess 'cp -r assets/fonts dist/assets/' in den Jobs 'build'
    und 'deploy' den Schritt HART scheitern; der Umzug nach build.py hat die
    Zusicherung an einen Ort gezogen (richtig) und dabei weich gemacht
    (falsch). Auf dem Deploy-Pfad stellt nichts mehr rot: die zehn
    SW-Precache-Pfade in sw.js werden zu 404 und cache.addAll() scheitert
    beim Nutzer, nicht im CI.
    """

    def test_fehlendes_quellverzeichnis_beendet_den_build(self, tmp_path, monkeypatch):
        """Kein assets/fonts/ -> sys.exit(1), nicht log.warning + return 0."""
        leere_wurzel = tmp_path / 'quelle'
        leere_wurzel.mkdir()
        monkeypatch.setattr(build_module, 'SOURCE_DIR', str(leere_wurzel))
        ziel = tmp_path / 'dist'
        ziel.mkdir()

        with pytest.raises(SystemExit) as abbruch:
            kopiere_schriftdateien(str(ziel))
        assert abbruch.value.code == 1

    def test_leeres_quellverzeichnis_beendet_den_build(self, tmp_path, monkeypatch):
        """Ein vorhandenes, aber leeres assets/fonts/ ist derselbe Fall: das
        Buendel verweist auf Dateien, die niemand neben es legt."""
        wurzel = tmp_path / 'quelle'
        (wurzel / 'assets' / 'fonts').mkdir(parents=True)
        monkeypatch.setattr(build_module, 'SOURCE_DIR', str(wurzel))
        ziel = tmp_path / 'dist'
        ziel.mkdir()

        with pytest.raises(SystemExit) as abbruch:
            kopiere_schriftdateien(str(ziel))
        assert abbruch.value.code == 1


class TestSchriftverweiseLoesenAuf:
    """Die eigentliche Schuld: jeder Schriftverweis IM BUENDEL muss neben dem
    Buendel aufloesen.

    'Das Verzeichnis war da' ist die falsche Frage — build.py schreibt die
    url()-Pfade auf './assets/fonts/' um (CR-08) und schuldet damit genau die
    Dateien, die es nennt. Geprueft wird darum gegen den umgeschriebenen CSS,
    nicht gegen eine Liste und nicht gegen das Quellverzeichnis.
    """

    def test_meldet_eine_fehlende_datei_und_beendet_den_build(self, tmp_path):
        css = "@font-face{src:url('./assets/fonts/gibtesnicht-400.woff2') format('woff2')}"
        ziel = tmp_path / 'dist'
        (ziel / 'assets' / 'fonts').mkdir(parents=True)

        with pytest.raises(SystemExit) as abbruch:
            build_module.pruefe_schriftverweise(css, str(ziel))
        assert abbruch.value.code == 1

    def test_ist_gruen_wenn_die_datei_daneben_liegt(self, tmp_path):
        css = "@font-face{src:url('./assets/fonts/da-400.woff2') format('woff2')}"
        ziel = tmp_path / 'dist'
        (ziel / 'assets' / 'fonts').mkdir(parents=True)
        (ziel / 'assets' / 'fonts' / 'da-400.woff2').write_bytes(b'x')

        assert build_module.pruefe_schriftverweise(css, str(ziel)) == ['da-400.woff2']

    def test_findet_die_echten_verweise_des_baums(self, tmp_path):
        """Gegenprobe gegen Leerlauf: ein kaputtes Muster wuerde NICHTS finden
        und alles oben trivial erfuellen. Gemessen wird am echten fonts.css,
        durch dieselbe Umschreibung, die der Build fuehrt."""
        fonts_css = (REPO / 'assets' / 'styles' / 'fonts.css').read_text(encoding='utf-8')
        umgeschrieben = fonts_css.replace("url('../fonts/", "url('./assets/fonts/")
        ziel = tmp_path / 'dist'
        (ziel / 'assets' / 'fonts').mkdir(parents=True)
        for name in _woff2_namen(QUELL_SCHRIFTEN):
            (ziel / 'assets' / 'fonts' / name).write_bytes(b'x')

        gefunden = build_module.pruefe_schriftverweise(umgeschrieben, str(ziel))

        assert len(gefunden) == SCHRIFTDATEIEN_SOLL, (
            f"{len(gefunden)} Schriftverweise im umgeschriebenen fonts.css gefunden, "
            f"erwartet {SCHRIFTDATEIEN_SOLL}: {gefunden}. Bei NULL greift das Muster "
            f"in pruefe_schriftverweise() nicht mehr und alles darueber ist trivial "
            f"erfuellt."
        )
        assert gefunden == _woff2_namen(QUELL_SCHRIFTEN)

    def test_build_prueft_die_verweise_des_erzeugten_buendels(self, monkeypatch):
        """Verdrahtung: der Build fuehrt die Pruefung wirklich, mit dem
        umgeschriebenen CSS und dem dist-Verzeichnis."""
        monkeypatch.setattr(build_module, 'write_file', lambda p, c: None)
        # Rueckgabewert aus dem Verzeichnis, nicht als Literal: hier stand '10'
        # und blieb beim Austausch stehen. Niemand prueft ihn, darum war er
        # stumm falsch — genau die Sorte Zahl, die beim naechsten Mal gelesen
        # und geglaubt wird.
        monkeypatch.setattr(
            build_module, 'kopiere_schriftdateien', lambda d: len(_woff2_namen(QUELL_SCHRIFTEN))
        )
        aufrufe = []
        monkeypatch.setattr(
            build_module,
            'pruefe_schriftverweise',
            lambda css, d: aufrufe.append((css, d)) or [],
        )

        build_module.build()

        assert len(aufrufe) == 1, f"Pruefung {len(aufrufe)}-mal aufgerufen, erwartet 1"
        css, verzeichnis = aufrufe[0]
        assert "url('./assets/fonts/" in css, \
            "Die Pruefung bekommt nicht den umgeschriebenen CSS"
        erwartet = os.path.normcase(os.path.abspath(os.path.join(build_module.SCRIPT_DIR, 'dist')))
        assert os.path.normcase(os.path.abspath(verzeichnis)) == erwartet


class TestKeineFremdschriftInDerQuelle:
    """DIE GEGENRICHTUNG, und sie war offen (Gegenpruefung Runde 4, Befund 6).

    pruefe_schriftverweise() oben prueft 'jede url() loest auf'. Eine
    Schriftdatei, die im QUELLVERZEICHNIS liegt und die KEINE url() nennt,
    wird davon nicht gesehen — sie wird mitkopiert, mitveroeffentlicht und von
    keiner Zeile in build.py beanstandet.

    NACHGESTELLT, nicht vermutet. Der Zustand nach einem Lauf von
    tools/fetch-fonts.py (dessen FONT_FILENAMES noch die zehn abgeschafften
    Namen fuehrt), simuliert durch die fuenf Zusatznamen im echten Baum:

        $ for n in roboto-400 roboto-700 inter-400 inter-500 inter-600; do \\
              cp assets/fonts/poppins-400.woff2 "assets/fonts/$n.woff2"; done
        $ ls assets/fonts/*.woff2 | wc -l      -> 12
        $ PYTHONIOENCODING=utf-8 python build.py
          [OK] 12 Schriftdateien nach dist/assets/fonts/ kopiert
          [OK] 7 Schriftverweise loesen neben dem Buendel auf
          BUILD_EXIT=0
        $ ls dist/assets/fonts/*.woff2 | wc -l -> 12

    Zwei Erfolgsmeldungen, Exit 0, und zwoelf Dateien in dem Verzeichnis, das
    der CI-Job 'deploy' veroeffentlicht — fuenf davon mit genau dem falschen
    Subset, das der ganze SCHR-Vorfall war. Die Schutzwirkung lag
    ausschliesslich bei den drei Test-/Werkzeugschichten:

        $ node tools/pruefe-schriftdateien.js --check   -> exit 1
          'nur im Verzeichnis [inter-400, inter-500, inter-600,
           roboto-400, roboto-700]'
        $ npx jest tests/unit/schriftdateien.test.js    -> 4 failed / 71 / 75
        $ python -m pytest tests/build/test_build_fonts.py -q -> 3 failed / 13

    Wer nur baut und deployt, faehrt an allen drei vorbei. Die Begruendung,
    mit der auf eine Haertung verzichtet wurde ('der Schaden ist gedeckelt,
    weil der Build hart scheitert'), traegt also nicht — der Build scheitert
    nicht.

    GEPRUEFT WIRD DIE QUELLE, nicht das Ziel. Nach kopiere_schriftdateien()
    sind die beiden Schriftmengen deckungsgleich (alles kopiert, Waisen
    entfernt); die QUELLE ist der Ort, an dem der Entwickler handeln muss, und
    ihr Name gehoert darum in die Meldung. Eine zweite Pruefung auf dem Ziel
    waere dieselbe Zusicherung an zwei Orten — genau das, was CLAUDE.md
    (Gotcha 1, ARCH-01) verbietet.
    """

    def _quelle_mit(self, tmp_path, namen):
        q = tmp_path / 'assets' / 'fonts'
        q.mkdir(parents=True)
        for n in namen:
            (q / n).write_bytes(b'x')
        return q

    def test_meldet_eine_fremdschrift_und_beendet_den_build(self, tmp_path):
        css = "@font-face{src:url('./assets/fonts/genannt-400.woff2') format('woff2')}"
        self._quelle_mit(tmp_path, ['genannt-400.woff2', 'niemand-nennt-mich.woff2'])

        with pytest.raises(SystemExit) as abbruch:
            build_module.pruefe_keine_fremdschriften(css, str(tmp_path))
        assert abbruch.value.code == 1

    def test_ist_gruen_wenn_jede_quellschrift_genannt_ist(self, tmp_path):
        css = (
            "@font-face{src:url('./assets/fonts/a-400.woff2') format('woff2')}"
            "@font-face{src:url('./assets/fonts/b-600.woff2') format('woff2')}"
        )
        self._quelle_mit(tmp_path, ['a-400.woff2', 'b-600.woff2', 'HERKUNFT.md'])

        # HERKUNFT.md ist keine Schrift und darf NICHT beanstandet werden —
        # sonst waere die Erlaubnisliste aus build.py hier nicht wirksam.
        assert build_module.pruefe_keine_fremdschriften(css, str(tmp_path)) == []

    def test_ein_fetch_fonts_lauf_beendet_den_build(self, tmp_path):
        """Der Befund selbst, als Fall. Die fuenf abgeschafften Namen neben den
        sieben aktuellen — genau der Zustand nach einem fetch-fonts-Lauf."""
        fonts_css = (REPO / 'assets' / 'styles' / 'fonts.css').read_text(encoding='utf-8')
        umgeschrieben = fonts_css.replace("url('../fonts/", "url('./assets/fonts/")
        abgeschafft = [
            'roboto-400.woff2', 'roboto-700.woff2',
            'inter-400.woff2', 'inter-500.woff2', 'inter-600.woff2',
        ]
        self._quelle_mit(tmp_path, _woff2_namen(QUELL_SCHRIFTEN) + abgeschafft)

        with pytest.raises(SystemExit) as abbruch:
            build_module.pruefe_keine_fremdschriften(umgeschrieben, str(tmp_path))
        assert abbruch.value.code == 1

    def test_das_echte_quellverzeichnis_ist_deckungsgleich(self):
        """Gegenprobe gegen Leerlauf: am ECHTEN Baum, durch dieselbe
        Umschreibung, die der Build fuehrt. Findet das Muster nichts, waere
        JEDE Datei fremd und die Faelle oben waeren aus dem falschen Grund
        rot; nennt fonts.css eine Datei zu viel, waere sie trivial gruen."""
        fonts_css = (REPO / 'assets' / 'styles' / 'fonts.css').read_text(encoding='utf-8')
        umgeschrieben = fonts_css.replace("url('../fonts/", "url('./assets/fonts/")
        genannt = sorted(set(build_module.SCHRIFT_URL_MUSTER.findall(umgeschrieben)))

        assert len(genannt) == SCHRIFTDATEIEN_SOLL, (
            f"{len(genannt)} Verweise in fonts.css, erwartet {SCHRIFTDATEIEN_SOLL}: {genannt}"
        )
        assert genannt == _woff2_namen(QUELL_SCHRIFTEN), (
            f"fonts.css nennt {genannt}, im Verzeichnis liegen "
            f"{_woff2_namen(QUELL_SCHRIFTEN)}"
        )
        assert build_module.pruefe_keine_fremdschriften(
            umgeschrieben, str(REPO)
        ) == []

    def test_build_prueft_die_quelle_ebenfalls(self, monkeypatch):
        """Verdrahtung: der Build fuehrt die Pruefung wirklich, mit dem
        umgeschriebenen CSS. Ohne diesen Fall koennte die Funktion richtig sein
        und nie gerufen werden — genau der Zustand, der den Befund ausgemacht
        hat."""
        monkeypatch.setattr(build_module, 'write_file', lambda p, c: None)
        monkeypatch.setattr(
            build_module, 'kopiere_schriftdateien', lambda d: len(_woff2_namen(QUELL_SCHRIFTEN))
        )
        monkeypatch.setattr(build_module, 'pruefe_schriftverweise', lambda css, d: [])
        aufrufe = []
        monkeypatch.setattr(
            build_module,
            'pruefe_keine_fremdschriften',
            lambda css, q=None: aufrufe.append((css, q)) or [],
        )

        build_module.build()

        assert len(aufrufe) == 1, f"Pruefung {len(aufrufe)}-mal aufgerufen, erwartet 1"
        assert "url('./assets/fonts/" in aufrufe[0][0], \
            "Die Pruefung bekommt nicht den umgeschriebenen CSS"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
