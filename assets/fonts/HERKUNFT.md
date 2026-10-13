# Herkunft der gebündelten Schriftdateien

**Stand 2026-10-13.** Diese Datei existiert, damit der nächste Griff nicht
wieder in den falschen Block geht. Sie ist nachprüfbar, nicht behauptet — jede
Zahl unten ist gemessen, und wie man sie nachmisst, steht am Ende.

Gebündelt werden **sieben** Dateien, **144.608 Bytes**. Eingebunden werden sie
von `assets/styles/fonts.css`, vorgeladen von `sw.js`, neben das Bundle gelegt
von `build.py` (`kopiere_schriftdateien()`).

## Die Falle

Googles CSS-Antwort enthält **mehrere** `@font-face`-Blöcke, einen je
Zeichen-Teilstück, und **`latin` steht ZULETZT**. Gemessen am 2026-10-13:

| Familie         | Blockreihenfolge der css2-Antwort                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Roboto          | cyrillic-ext · cyrillic · greek-ext · greek · math · symbols · vietnamese · latin-ext · **latin** |
| Inter           | cyrillic-ext · cyrillic · greek-ext · greek · vietnamese · latin-ext · **latin**                  |
| Poppins         | **devanagari** · latin-ext · **latin**                                                            |
| Source Sans Pro | cyrillic-ext · cyrillic · greek-ext · greek · vietnamese · latin-ext · **latin**                  |

Wer den ersten Treffer nimmt, bekommt bei drei Familien Kyrillisch und bei
Poppins Devanagari. Genau das ist passiert: **von 2026-06-12 (`1c3245b`) bis
2026-10-13** lagen hier zehn Dateien mit dem falschen Subset. Keine einzige
kannte ein lateinisches `A`. Der Browser lud sie ohne 404, fand keinen Glyphen
und fiel zeichenweise auf Arial zurück — vier Einträge im Schriftmenü des
Editors waren Dekoration. Eine richtige Fassung hat es nie gegeben.

Wer neu lädt: **den ganzen Block lesen und den `/* latin */`-Kommentar
treffen**, nicht den ersten `url(...)`.

## Die sieben Dateien

Geholt am **2026-10-13** von `fonts.gstatic.com`, über
`https://fonts.googleapis.com/css2?family=<Familie>&display=swap` mit
Chrome-User-Agent, jeweils aus dem `/* latin */`-Block.

| Datei                       | Familie         | Gewicht | Art                   | Bytes  | Glyphen |
| --------------------------- | --------------- | ------- | --------------------- | ------ | ------- |
| `roboto-variable.woff2`     | Roboto          | 100–900 | **variabel** (`wght`) | 43.136 | 229     |
| `inter-variable.woff2`      | Inter           | 100–900 | **variabel** (`wght`) | 48.256 | 230     |
| `poppins-400.woff2`         | Poppins         | 400     | statisch              | 7.884  | 217     |
| `poppins-500.woff2`         | Poppins         | 500     | statisch              | 7.748  | 217     |
| `poppins-600.woff2`         | Poppins         | 600     | statisch              | 8.000  | 217     |
| `source-sans-pro-400.woff2` | Source Sans Pro | 400     | statisch              | 14.812 | 231     |
| `source-sans-pro-600.woff2` | Source Sans Pro | 600     | statisch              | 14.772 | 231     |

Roboto und Inter liefert Google heute als **variable** Schrift: alle Gewichte
aus einer Datei, abgerufen mit `:wght@100..900`. Darum trägt `fonts.css` für
sie `font-weight: 100 900` statt mehrerer Regeln — zehn Dateinamen
beizubehalten hätte 139.648 Bytes bitgleiche Duplikate bedeutet. Poppins und
Source Sans Pro sind statisch, eine Datei je Gewicht.

### Quell-URLs

```
roboto-variable.woff2
  css2?family=Roboto:wght@100..900
  https://fonts.gstatic.com/s/roboto/v51/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2
inter-variable.woff2
  css2?family=Inter:wght@100..900
  https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2
poppins-400.woff2
  css2?family=Poppins:wght@400
  https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecg.woff2
poppins-500.woff2
  css2?family=Poppins:wght@500
  https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2
poppins-600.woff2
  css2?family=Poppins:wght@600
  https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2
source-sans-pro-400.woff2
  css2?family=Source+Sans+Pro:wght@400
  https://fonts.gstatic.com/s/sourcesanspro/v24/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7l.woff2
source-sans-pro-600.woff2
  css2?family=Source+Sans+Pro:wght@600
  https://fonts.gstatic.com/s/sourcesanspro/v24/6xKydSBYKcSV-LCoeQqfX1RYOo3i54rwlxdu.woff2
```

**Diese URLs sind nachgeprüft, nicht abgeschrieben:** am 2026-10-13 wurde jede
abgerufen und ihr Inhalt per SHA-256 gegen die Datei hier verglichen. Alle
sieben waren **bitgleich**.

```
1404ca348bd75ef836f4dd8b6f2cc719458642d1237c368296b2fc652dca47dc  roboto-variable.woff2
3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62  inter-variable.woff2
7d93459d86585bfcdbb7e0376056226adb25821ee54b96236fe2123e9560929f  poppins-400.woff2
cd36de204aca2d5fa263a731f7c20009b5e3d754ba1f1e03c33e93a48f3e7446  poppins-500.woff2
f4e80d9dfd374d02989b87a27b5ed4cb78fbb177c27f1478e9a8b0afb7513149  poppins-600.woff2
fb7b366bd65fb747ebc7d6e2af9d8a25b056c27c4551db320fe68799ca43dc91  source-sans-pro-400.woff2
a2fe82406659ad9ab5fc997e99f26dc63614f3f6fc474a1a8a2483e5248b8800  source-sans-pro-600.woff2
```

**Source Sans Pro ist nicht Source Sans 3.** Die Familie ist aus dem
Google-Katalog genommen, der `css2`-Endpunkt liefert sie aber weiter (Pfad
`s/sourcesanspro/v24`). Der Nachfolger `Source+Sans+3` ist eine **andere**
Datei — sein `latin`-Subset bei Gewicht 400 wog am 2026-10-13 15.696 Bytes
gegen die 14.812 hier. Wer `Source+Sans+3` lädt und unter
`source-sans-pro-*.woff2` ablegt, tauscht die Schrift unbemerkt aus.

## `unicode-range` des `latin`-Subsets

Für alle sieben Dateien **identisch**, im Wortlaut der css2-Antwort:

```
U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
U+2212, U+2215, U+FEFF, U+FFFD
```

Das deckt den deutschen Satz vollständig: Umlaute und Eszett liegen in
`U+0000-00FF`, die Typografie (`„ " – — …`) in `U+2000-206F`.

In `fonts.css` steht `unicode-range` **absichtlich nicht**. Sie würde nur den
Download sparen; die zeichenweise Rückfall-Logik des Browsers richtet sich
ohnehin nach der `cmap` der Datei. Weniger Angabe heißt: eine Stelle weniger,
die mit der Datei auseinanderlaufen kann.

## Lizenzen

Alle vier Familien stehen unter der **SIL Open Font License 1.1**. Am
2026-10-13 am Lizenztext selbst nachgeprüft, nicht aus zweiter Hand:

| Familie         | Copyright-Vermerk                                          | Lizenztext geprüft unter                 |
| --------------- | ---------------------------------------------------------- | ---------------------------------------- |
| Roboto          | Copyright 2011 The Roboto Project Authors                  | `google/fonts` → `ofl/roboto/OFL.txt`    |
| Inter           | Copyright 2020 The Inter Project Authors                   | `google/fonts` → `ofl/inter/OFL.txt`     |
| Poppins         | Copyright 2020 The Poppins Project Authors                 | `google/fonts` → `ofl/poppins/OFL.txt`   |
| Source Sans Pro | Copyright 2010–2024 Adobe, mit reserviertem Namen „Source" | `adobe-fonts/source-sans` → `LICENSE.md` |

`ofl/sourcesanspro/` gibt in `google/fonts` **404** — die Familie ist aus dem
Katalog genommen. Der Nachweis kommt darum aus Adobes eigenem Depot, wo die
Schrift herstammt; `ofl/sourcesans3/OFL.txt` (der Nachfolger) existiert und
ist ebenfalls OFL 1.1.

**Offene Pflicht.** OFL 1.1 Bedingung 2 verlangt, dass **jede Kopie** der
Schriftsoftware den Copyright-Vermerk **und den Lizenztext** mitführt. Die
Vermerke stehen oben; der Lizenztext liegt **nicht** im Baum. Weitergegeben
werden die Dateien hier (Depot), in `dist/` und über `sw.js` an jeden Nutzer.
Die Pflicht ist damit nur halb erfüllt. Abhilfe wäre eine `OFL.txt` neben
dieser Datei — bewusst nicht ohne Entscheid angelegt, weil zu klären ist, ob
ein gemeinsamer Lizenztext für alle vier genügt oder je Familie einer
beiliegen soll. Der reservierte Name „Source" betrifft nur Weitergabe
**unter diesem Namen nach Änderung**; hier liegen Googles unveränderte
Subsets.

## Nachprüfen

```bash
node tools/pruefe-schriftdateien.js          # Bericht je Datei
node tools/pruefe-schriftdateien.js --check  # Exit 1 bei Befund
```

Das Werkzeug liest die Dateiliste aus `assets/styles/fonts.css` (nicht aus
einer eigenen Liste), entpackt jedes woff2, liest `cmap` und `fvar` und prüft
gegen den deutschen Zeichensatz. Es meldet außerdem Drift zwischen
`fonts.css`, `sw.js` und diesem Verzeichnis. Erwartet:

```
Ohne deutschen Zeichensatz: 0 von 7
Gewichtsbereich ohne deckende wght-Achse: keiner
Drift sw.js <-> fonts.css <-> Verzeichnis: deckungsgleich
```

Als Ratsche läuft dasselbe in `tests/unit/schriftdateien.test.js`; am
laufenden Browser beweist `tests/e2e/features/schriftdateien.spec.js`, dass
jede Familie messbar anders rendert als ihr Rückfall;
`tests/build/test_build_fonts.py` hält fest, dass der Build die Dateien neben
das Bundle legt und dort keine Waisen stehen lässt.

**`tools/fetch-fonts.py` gibt diesen Stand NICHT her** (Stand 2026-10-13). Das
Skript nennt die zehn abgeschafften Dateinamen, lädt Roboto und Inter als
Einzelgewichte statt als variable Schrift und holt `Source+Sans+3` unter dem
Namen `source-sans-pro-*`. Seine `latin`-Erkennung ist richtig, die Dateiliste
ist überholt. Die sieben Dateien hier stammen **nicht** daraus.
