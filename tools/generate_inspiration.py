#!/usr/bin/env python3
"""Erstellt das Offline-Artikelmodul aus dem Katalog und den Markdown-Dateien."""

import argparse
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "inspiration"
OUTPUT = ROOT / "features" / "inspiration" / "inspiration-data.js"
STRING_TOKEN = re.compile(r'"(?:[^"\\]|\\.)*"')
SCRIPT_ESCAPES = str.maketrans({
    "<": r"\u003c",
    "{": r"\u007b",
    "}": r"\u007d",
    "\u2028": r"\u2028",
    "\u2029": r"\u2029",
})


def source_articles(directory):
    """Ordnet jeder Datei ihre lokale Artikelnummer zu."""
    articles = {}
    for path in sorted(directory.glob("*.md")):
        if path.name == "README.md":
            number = 100
        else:
            match = re.fullmatch(r"([0-9]+)-[a-z0-9-]+\.md", path.name)
            if not match:
                raise ValueError(f"{path.name}: Artikelnummer oder Dateiname ungültig")
            number = int(match[1])
        if number <= 0 or number in articles:
            raise ValueError(f"{path.name}: Artikelnummer ungültig oder doppelt")
        articles[number] = path
    return articles


def load_collections():
    catalog = json.loads((SOURCE / "catalog.json").read_text(encoding="utf-8"))
    collection_ids = set()
    article_ids = set()
    collections = []
    for entry in catalog:
        collection_id = entry["id"]
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", collection_id):
            raise ValueError(f"{collection_id}: ungültige Abteilungs-ID")
        if collection_id in collection_ids:
            raise ValueError(f"{collection_id}: Abteilungs-ID doppelt")
        collection_ids.add(collection_id)
        files = source_articles(SOURCE / collection_id)
        groups = entry["groups"]
        numbers = [number for group in groups.values() for number in group]
        if not numbers or set(numbers) != files.keys() or len(numbers) != len(files):
            raise ValueError(f"{collection_id}: Themen müssen jede Artikeldatei genau einmal führen")
        unlisted = set(entry.get("unlisted", []))
        not_searchable = set(entry.get("notSearchable", []))
        if not (unlisted | not_searchable) <= files.keys():
            raise ValueError(f"{collection_id}: unbekannte Artikelnummer in einer Ausnahmeliste")

        articles = []
        for group, numbers in groups.items():
            for number in numbers:
                path = files[number]
                article_id = entry["idOffset"] + number
                if not 0 < article_id <= 2**53 - 1 or article_id in article_ids:
                    raise ValueError(f"{path.name}: globale Artikel-ID ungültig oder doppelt")
                article_ids.add(article_id)
                markdown = path.read_text(encoding="utf-8-sig")
                heading = re.match(r"^# ([^\n]+)", markdown)
                if not heading or not heading[1].strip():
                    raise ValueError(f"{path.name}: Titel in der ersten Zeile fehlt")
                articles.append({
                    "id": article_id,
                    "file": path.name,
                    "title": heading[1].strip(),
                    "group": group,
                    "markdown": markdown,
                    "listed": number not in unlisted,
                    "searchable": number not in not_searchable,
                })
        collections.append({
            "id": collection_id,
            "title": entry["title"],
            "subtitle": entry["subtitle"],
            "articles": articles,
        })
    return collections


def generate_module(collections):
    data = json.dumps(collections, ensure_ascii=False, indent=4)
    # Das HTML-Bündel enthält dieses Modul in einem Script-Tag. Der Build
    # zählt zudem Klammern im Quelltext, auch innerhalb von Zeichenketten.
    data = STRING_TOKEN.sub(lambda token: token[0].translate(SCRIPT_ESCAPES), data)
    return (
        "// [SECTION:INSPIRATION_DATA]\n"
        "// Generiert von tools/generate_inspiration.py aus assets/inspiration/.\n\n"
        f"const INSPIRATION_COLLECTIONS = {data};\n\n"
        "window.INSPIRATION_COLLECTIONS = INSPIRATION_COLLECTIONS;\n"
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    options = parser.parse_args()
    collections = load_collections()
    module = generate_module(collections)
    if options.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != module:
            parser.exit(1, "Inspiration-Modul ist veraltet. Erneut generieren.\n")
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(module, encoding="utf-8", newline="\n")
    article_count = sum(len(collection["articles"]) for collection in collections)
    print(f"Inspiration: {article_count} Artikel in {len(collections)} Abteilungen.")


if __name__ == "__main__":
    main()
