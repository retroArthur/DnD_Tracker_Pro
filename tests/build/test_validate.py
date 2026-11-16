import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import validate


def test_validate_current_modular_project(capsys):
    assert validate.main() == 0
    assert "Fehlgeschlagen:" not in capsys.readouterr().out


@pytest.mark.parametrize(
    "missing_file",
    [None, "features/example/detail.js", "assets/templates/view.html", "assets/styles/view.css"],
)
def test_validate_checks_declared_files_without_bundle(tmp_path, monkeypatch, capsys, missing_file):
    files = {
        "index.html": '<body><div id="app-root"></div><script src="loader.js"></script></body>',
        "loader.js": """const MODULES = ['core/init.js', 'features/example/detail.js'];
async function loadModules() {
    const TEMPLATES = ['assets/templates/view.html'];
    await init();
}
document.addEventListener('DOMContentLoaded', loadModules);
""",
        "core/init.js": "// Called after the loader inserts the <body> fragments.\nfunction init() {}",
        "features/example/detail.js": "function detail() {}",
        "assets/body.html": "<!-- Templates are loaded by loader.js. -->",
        "assets/templates/view.html": "<section>Testansicht</section>",
        "assets/styles.css": "@import url('styles/view.css');",
        "assets/styles/view.css": "section { display: block; }",
    }
    for relative_path, content in files.items():
        if relative_path != missing_file:
            path = tmp_path / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
    monkeypatch.setattr(validate, "SOURCE_DIR", str(tmp_path))

    exit_code = validate.main()
    output = capsys.readouterr().out

    assert "Übersprungen: 1" in output
    if missing_file is None:
        assert exit_code == 0
        assert "Fehlgeschlagen:" not in output
    else:
        assert exit_code == 1
        assert missing_file in output
        assert "Fehlgeschlagen: 1" in output
