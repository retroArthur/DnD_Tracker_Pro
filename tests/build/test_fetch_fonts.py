#!/usr/bin/env python3
"""
TDD-Tests: tools/fetch-fonts.py holt GENAU die Schriften, die fonts.css nennt.

WARUM DIESE DATEI EXISTIERT. Von 2026-06-12 bis 2026-10-13 lagen in
assets/fonts/ zehn Dateien mit dem FALSCHEN Subset — Inter, Roboto und Source
Sans trugen Kyrillisch, Poppins trug Devanagari. Fuenf der zehn trugen ein
grosses 'A' (Inter, Source Sans Pro), keine einzige ein kleines 'a', einen
Umlaut oder ein Eszett. Der Austausch in `b0ada5b` hat sie durch sieben richtige ersetzt.

tools/fetch-fonts.py fuehrte danach WEITER die zehn alten Dateinamen. Es ist
die einzige ausfuehrbare Stelle im Baum, die den kaputten Stand
wiederherstellen kann, und es tut dabei zwei Dinge gleichzeitig (Gegenpruefung
Runde 4, Befunde 6 und 12):

  1. Es legt fuenf Dateien mit abgeschafften Namen daneben
     (roboto-400/700, inter-400/500/600). Nachgemessen lief der Build damit
     GRUEN und veroeffentlichte zwoelf Schriften; die Haertung
     `pruefe_keine_fremdschriften()` in build.py (Befund 6) deckelt das jetzt,
     aber sie raeumt nicht auf und sie verhindert den Griff nicht.
  2. Es holt `Source+Sans+3` und legt es unter dem Pro-Namen ab. Gemessen ist
     das ein echter Austausch und keine Umbenennung:
         Source+Sans+3     15.696 B   Pfad sourcesans3/v20
         Source+Sans+Pro   14.812 B   Pfad sourcesanspro/v24
     Der zweite Wert ist der der Datei im Baum.

DIE REGEL, die diese Datei festhaelt: fonts.css ist die einzige Liste. Was
fetch-fonts.py holt, muss ihr genau entsprechen — keine Datei zu viel, keine zu
wenig. Dieselbe Regel wie fuer Module, Templates und CSS (CLAUDE.md Gotcha 1,
ARCH-01) und wie fuer die Dateiliste von tools/pruefe-schriftdateien.js.

GEPRUEFT OHNE NETZ. Kein Fall hier laedt etwas herunter. Die sieben URLs sind
einmal von Hand gegen die Dateien im Baum gemessen worden — alle sieben
Antworten bitgleich zur lokalen Datei:
    roboto-variable       43.136 B  sha256 1404ca348bd75ef8  /s/roboto/
    inter-variable        48.256 B  sha256 3100e775e8616cd2  /s/inter/
    poppins-400            7.884 B  sha256 7d93459d86585bfc  /s/poppins/
    poppins-500            7.748 B  sha256 cd36de204aca2d5f  /s/poppins/
    poppins-600            8.000 B  sha256 f4e80d9dfd374d02  /s/poppins/
    source-sans-pro-400   14.812 B  sha256 fb7b366bd65fb747  /s/sourcesanspro/
    source-sans-pro-600   14.772 B  sha256 a2fe82406659ad9a  /s/sourcesanspro/
Die Zahlen stehen auch in assets/fonts/HERKUNFT.md. Ein Netzfall hier waere
eine Probe auf Googles Auslieferung, nicht auf dieses Werkzeug — und wuerde die
Suite bei jedem Subset-Wechsel bei Google rot stellen.
"""

import importlib.util
import re
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).parent.parent.parent
WERKZEUG = REPO / 'tools' / 'fetch-fonts.py'
FONTS_CSS = REPO / 'assets' / 'styles' / 'fonts.css'
QUELL_SCHRIFTEN = REPO / 'assets' / 'fonts'

# Dieselbe Zahl und dieselbe Begruendung wie in test_build_fonts.py
# (SCHRIFTDATEIEN_SOLL), tests/unit/schriftdateien.test.js und
# tests/e2e/features/schriftdateien.spec.js (FACES_SOLL).
SCHRIFTDATEIEN_SOLL = 7

# Die zehn Namen, die der Austausch abgeschafft hat. Fuenf davon fuehrte
# fetch-fonts.py weiter; die drei Poppins- und zwei Source-Sans-Namen sind
# geblieben und stehen darum NICHT hier.
ABGESCHAFFTE_NAMEN = (
    'roboto-400.woff2',
    'roboto-700.woff2',
    'inter-400.woff2',
    'inter-500.woff2',
    'inter-600.woff2',
)


def _lade_werkzeug():
    """tools/fetch-fonts.py als Modul. Der Bindestrich im Namen macht es per
    `import` unerreichbar, darum ueber den Dateipfad."""
    spec = importlib.util.spec_from_file_location('fetch_fonts_werkzeug', WERKZEUG)
    modul = importlib.util.module_from_spec(spec)
    sys.modules['fetch_fonts_werkzeug'] = modul
    spec.loader.exec_module(modul)
    return modul


def _css_namen():
    """Die Dateinamen, die fonts.css per url() einbindet — sortiert."""
    css = FONTS_CSS.read_text(encoding='utf-8')
    return sorted(set(re.findall(r"url\(\s*['\"]?\.\./fonts/([^'\")]+)['\"]?\s*\)", css)))


class TestDerPlanEntsprichtFontsCss:
    """Was das Werkzeug holen will, ist genau das, was fonts.css einbindet."""

    def test_fonts_css_nennt_die_erwartete_zahl(self):
        """Gegenprobe gegen Leerlauf: greift der Regex oben nicht, waere jede
        Liste unten trivial gleich einer leeren Liste."""
        namen = _css_namen()
        assert len(namen) == SCHRIFTDATEIEN_SOLL, (
            f"{len(namen)} url()-Namen in fonts.css, erwartet {SCHRIFTDATEIEN_SOLL}: {namen}"
        )
        vorhanden = sorted(p.name for p in QUELL_SCHRIFTEN.iterdir() if p.suffix == '.woff2')
        assert namen == vorhanden, (
            f"fonts.css nennt {namen}, im Verzeichnis liegen {vorhanden}"
        )

    def test_der_plan_nennt_genau_die_dateien_aus_fonts_css(self):
        """Der Kern. `SCHRIFT_PLAN` ist die Liste (lokaler Name, CSS-URL), die
        das Werkzeug abarbeitet; sie darf von fonts.css nicht abweichen."""
        werkzeug = _lade_werkzeug()
        geplant = sorted(name for name, _ in werkzeug.SCHRIFT_PLAN)
        assert geplant == _css_namen(), (
            f"fetch-fonts.py will {geplant} holen, fonts.css bindet "
            f"{_css_namen()} ein. Solange die beiden auseinanderlaufen, legt ein "
            f"Lauf des Werkzeugs Dateien in den Baum, die niemand anfordert — "
            f"genau der Zustand, der von 2026-06-12 bis 2026-10-13 bestand."
        )

    def test_kein_abgeschaffter_name_kommt_im_plan_vor(self):
        """Namentlich, nicht nur ueber die Mengengleichheit darueber. Der Fall
        benennt in der Meldung, WAS zurueckgekommen ist."""
        werkzeug = _lade_werkzeug()
        text = WERKZEUG.read_text(encoding='utf-8')
        geplant = {name for name, _ in werkzeug.SCHRIFT_PLAN}
        zurueck = sorted(n for n in ABGESCHAFFTE_NAMEN if n in geplant)
        assert zurueck == [], f"abgeschaffte Dateinamen im Plan: {zurueck}"
        # Und auch nicht als Rueckstand im Quelltext, wo ihn der naechste
        # Leser fuer den Ist-Zustand halten koennte. Kommentare, die den
        # Vorfall ERKLAEREN, duerfen sie nennen — darum nur die
        # Zuweisungsform `'<name>'` als Zeichenkette im Plan.
        for n in ABGESCHAFFTE_NAMEN:
            assert f"('{n}'" not in text, f"{n} steht noch als Plan-Eintrag im Quelltext"

    def test_source_sans_wird_nicht_gegen_source_sans_3_getauscht(self):
        """Die Familie im Namen ist die Familie in der URL. `Source+Sans+3` ist
        eine ANDERE Schrift (15.696 B, /s/sourcesans3/) als Source Sans Pro
        (14.812 B, /s/sourcesanspro/) — sie unter dem Pro-Namen abzulegen
        tauscht die Schrift unbemerkt aus."""
        werkzeug = _lade_werkzeug()
        for name, url in werkzeug.SCHRIFT_PLAN:
            if not name.startswith('source-sans-pro'):
                continue
            assert 'Source+Sans+3' not in url, (
                f"{name} wird von {url} geholt — das ist Source Sans 3, nicht "
                f"Source Sans Pro."
            )
            assert 'Source+Sans+Pro' in url, f"{name} nennt keine Pro-Familie: {url}"

    def test_die_variablen_familien_fordern_eine_achse(self):
        """Roboto und Inter kommen als EINE variable Datei. Eine URL mit
        `wght@400` liefert dafuer eine statische Instanz — dieselbe Falle, nur
        eine Ebene tiefer: die Datei waere da, die Achse nicht, und
        `font-weight: 100 900` in fonts.css waere eine Luege (das prueft
        tests/unit/schriftdateien.test.js Teil 8)."""
        werkzeug = _lade_werkzeug()
        variabel = [(n, u) for n, u in werkzeug.SCHRIFT_PLAN if 'variable' in n]
        # Gegenprobe gegen Leerlauf: es gibt ueberhaupt variable Eintraege.
        assert len(variabel) == 2, f"erwartet 2 variable Eintraege, gefunden {variabel}"
        for name, url in variabel:
            assert 'wght@100..900' in url, (
                f"{name} wird von {url} geholt — ohne Achsenbereich "
                f"(`wght@100..900`) liefert Google eine statische Instanz."
            )


class TestDasWerkzeugLaedtNichtGegenEinenFremdenPlan:
    """Die Ratsche im Werkzeug selbst, nicht nur in dieser Datei.

    Ein Test faengt den Drift beim naechsten Lauf der Suite. Das Werkzeug wird
    aber von Hand gefahren, und zwar genau dann, wenn Schriften fehlen — also
    moeglicherweise lange vor dem naechsten Testlauf. Es muss sich darum
    SELBST gegen fonts.css pruefen, VOR dem ersten Download.
    """

    def test_der_waechter_ist_gruen_beim_echten_bestand(self):
        werkzeug = _lade_werkzeug()
        assert werkzeug.pruefe_plan_gegen_fonts_css() == []

    def test_der_waechter_meldet_eine_abweichung_und_beendet(self, tmp_path, monkeypatch):
        werkzeug = _lade_werkzeug()
        fremd = tmp_path / 'fonts.css'
        fremd.write_text(
            "@font-face{src:url('../fonts/nur-diese-eine.woff2') format('woff2')}",
            encoding='utf-8',
        )
        monkeypatch.setattr(werkzeug, 'FONTS_CSS', str(fremd))

        with pytest.raises(SystemExit) as abbruch:
            werkzeug.pruefe_plan_gegen_fonts_css(streng=True)
        assert abbruch.value.code == 1

    def test_download_fonts_prueft_zuerst(self, monkeypatch):
        """Verdrahtung: der Waechter wird gerufen, und zwar bevor irgendetwas
        geladen wird. Ohne diesen Fall koennte er richtig sein und nie
        laufen."""
        werkzeug = _lade_werkzeug()
        folge = []
        monkeypatch.setattr(
            werkzeug,
            'pruefe_plan_gegen_fonts_css',
            lambda streng=True: folge.append('geprueft') or [],
        )

        def _kein_netz(*a, **k):
            folge.append('geladen')
            raise AssertionError('Dieser Fall darf nichts laden')

        monkeypatch.setattr(werkzeug, 'fetch_url', _kein_netz)
        # --dry-run laedt von sich aus nichts; der Waechter muss trotzdem laufen.
        werkzeug.download_fonts(dry_run=True)

        assert folge == ['geprueft'], f"Reihenfolge/Aufrufe: {folge}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
