"""Prüft die Verbindung zwischen den Markdown-Quellen und dem Offline-Modul."""

from contextlib import redirect_stderr
import io
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from tools import generate_inspiration as generator


class TestInspirationData(TestCase):
    def test_module_matches_catalog_and_markdown(self):
        expected = generator.generate_module(generator.load_collections())
        self.assertTrue(
            generator.OUTPUT.read_text(encoding="utf-8") == expected,
            "Inspiration-Modul ist veraltet. python tools/generate_inspiration.py ausführen.",
        )

    def test_check_rejects_stale_module_without_overwriting(self):
        with TemporaryDirectory() as directory:
            output = Path(directory) / "inspiration-data.js"
            stale = "// Veraltetes Modul\n"
            output.write_text(stale, encoding="utf-8")

            errors = io.StringIO()
            with (
                patch.object(generator, "OUTPUT", output),
                patch.object(sys, "argv", ["generate_inspiration.py", "--check"]),
                redirect_stderr(errors),
                self.assertRaises(SystemExit) as result,
            ):
                generator.main()

            self.assertEqual(result.exception.code, 1)
            self.assertIn("veraltet", errors.getvalue())
            self.assertEqual(output.read_text(encoding="utf-8"), stale)
