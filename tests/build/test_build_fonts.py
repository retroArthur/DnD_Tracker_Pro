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


def _woff2_namen(verzeichnis):
    """Die woff2-Dateinamen eines Verzeichnisses, sortiert."""
    if not verzeichnis.is_dir():
        return []
    return sorted(p.name for p in verzeichnis.iterdir() if p.suffix == '.woff2')


class TestSchriftenNebenDasBundle:
    """build.py schuldet die Dateien, auf die es die url()-Pfade umschreibt."""

    def test_quellverzeichnis_fuehrt_ueberhaupt_schriften(self):
        """Gegenprobe gegen Leerlauf: ohne Quelldateien sagt alles Folgende
        nichts, weil 'alle kopiert' bei null Dateien trivial wahr ist."""
        namen = _woff2_namen(QUELL_SCHRIFTEN)
        assert len(namen) >= 10, (
            f"assets/fonts/ fuehrt nur {len(namen)} woff2 — erwartet mindestens 10. "
            f"Ohne Quelldateien prueft diese Datei nichts."
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

        build_module.build(production=True)

        assert len(kopien) == 1, f"Kopierschritt {len(kopien)}-mal aufgerufen, erwartet 1"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
