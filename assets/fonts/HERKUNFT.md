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
2026-10-13** lagen hier zehn Dateien mit dem falschen Subset. **Fuenf der zehn
trugen ein grosses `A`** (Inter dreimal, Source Sans Pro zweimal); ein kleines
`a`, einen Umlaut oder ein Eszett trug **keine einzige**, und Roboto und Poppins
kannten auch das `A` nicht (gemessen an `git show 4e0d810:assets/fonts/*`).
Der Browser lud sie ohne 404, fand keinen Glyphen
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

Die Vermerke stehen **in den Dateien selbst** (OpenType `name`-Tabelle,
name-ID 0) und sind von dort gelesen, nicht abgeschrieben:

| Familie         | Copyright-Vermerk der Datei                                                      |
| --------------- | -------------------------------------------------------------------------------- |
| Roboto          | Copyright 2011 The Roboto Project Authors (github.com/googlefonts/roboto-classic) |
| Inter           | Copyright **2016** The Inter Project Authors (github.com/rsms/inter)             |
| Poppins         | Copyright 2020 The Poppins Project Authors (github.com/itfoundry/Poppins)        |
| Source Sans Pro | © 2010 - **2018** Adobe Systems Incorporated, with Reserved Font Name ‚Source'   |

**Zwei Jahreszahlen standen hier falsch** und sind korrigiert: Inter mit 2020
statt 2016 und Adobe mit 2010–2024 statt 2010–2018. Die Abweichung ist echt und
liegt upstream — `google/fonts` → `ofl/inter/OFL.txt` nennt tatsächlich 2020,
während die ausgelieferte Datei 2016 trägt. Maßgeblich ist hier die **Datei**,
weil genau sie weitergegeben wird.

`ofl/sourcesanspro/` gibt in `google/fonts` **404** — die Familie ist aus dem
Katalog genommen. Der Nachweis kommt darum aus Adobes eigenem Depot, wo die
Schrift herstammt; `ofl/sourcesans3/OFL.txt` (der Nachfolger) existiert und
ist ebenfalls OFL 1.1.

**Die Pflicht ist erfüllt.** OFL 1.1 Bedingung 2 verlangt, dass **jede Kopie**
der Schriftsoftware den Copyright-Vermerk **und den Lizenztext** mitführt.
Beides liegt jetzt in **`OFL.txt`** neben dieser Datei.

Der offene Entscheid — ein gemeinsamer Lizenztext oder einer je Familie — ist
durch eine Messung entschieden worden: die drei Fassungen in `google/fonts`
(`ofl/roboto`, `ofl/inter`, `ofl/poppins`) sind nach ihrer Kopfzeile
**bitgleich bis auf genau eine Zeile**, nämlich die Adresse der Lizenz selbst
(`https://openfontlicense.org` gegen `http[s]://scripts.sil.org/OFL`). Es ist
dieselbe Lizenz; nur die Vermerke unterscheiden sich, und die stehen alle vier
vollständig in `OFL.txt`. Übernommen ist die Fassung aus `ofl/roboto`, weil sie
die heute gültige Adresse nennt.

**Und sie reist mit.** `build.py` kopierte bis hierher nur Dateien mit einer
Schriftendung — `dist/assets/fonts/` trug die sieben Schriften ohne ihre
Lizenz, obwohl der Job `deploy` genau dieses Verzeichnis veröffentlicht und
`sw.js` es beim Nutzer ausspielt. `SCHRIFT_PFLICHTDATEIEN` in `build.py` nimmt
`OFL.txt` jetzt mit, und ihr **Fehlen beendet den Build** (gemessen: Exit 1
ohne die Datei, Exit 0 mit ihr). `HERKUNFT.md` bleibt dagegen absichtlich im
Quellbaum: sie ist Entwicklerdokumentation, wird von nichts verlinkt und hätte
neben dem Bündel nur Ladezeit gekostet.

Der reservierte Name „Source" betrifft nur Weitergabe **unter diesem Namen
nach Änderung**; hier liegen Googles unveränderte Subsets.

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

**`tools/fetch-fonts.py` gibt diesen Stand jetzt her** (Stand 2026-10-14). Bis
dahin nicht: das Skript nannte die zehn abgeschafften Dateinamen, lud Roboto
und Inter als Einzelgewichte statt als variable Schrift und holte
`Source+Sans+3` unter dem Namen `source-sans-pro-*`. Die sieben Dateien hier
stammen **nicht** daraus, sondern aus dem Austausch vom 2026-10-13.

Repariert in Gegenprüfungsrunde 4 (Befunde 6 und 12):

- `SCHRIFT_PLAN` nennt die sieben aktuellen Dateien mit den URLs oben —
  Roboto und Inter mit `wght@100..900`, Source Sans Pro als
  `Source+Sans+Pro`.
- `pruefe_plan_gegen_fonts_css()` vergleicht den Plan **vor dem ersten
  Download** in beide Richtungen mit den `url()`-Angaben in `fonts.css` und
  bricht bei Abweichung ab. `fonts.css` ist also auch dort die einzige Liste.
- Der Rückfall „nimm den ersten `woff2`-Treffer" ist entfernt — er hätte bei
  einem Formatwechsel bei Google schweigend das kyrillische Subset geholt.
- Nachgemessen, nicht behauptet: `roboto-variable.woff2` gelöscht,
  `python tools/fetch-fonts.py` geholt → 43.136 Bytes,
  `sha256 1404ca348bd75ef8…`, **bitgleich** zum Git-Objekt.
- Ratsche: `tests/build/test_fetch_fonts.py` (8 Fälle, lädt nichts).

Und `build.py` lässt eine Schriftdatei, die kein `@font-face` nennt, nicht
mehr durch: `pruefe_keine_fremdschriften()` bricht den Build ab, bevor etwas
geschrieben wird. Vorher lief ein Baum mit zwölf Schriftdateien grün durch
(zwei Erfolgsmeldungen, Exit 0) und der Job `deploy` veröffentlichte alle
zwölf.

## Die Dateien gegen das Git-Objekt prüfen

```bash
# Die sieben woff2 sind BINÄR — der rohe sha256sum IST der Objekt-Hash:
for f in assets/fonts/*.woff2; do
  r=$(sha256sum "$f" | cut -d' ' -f1)
  g=$(git cat-file blob HEAD:"$f" | sha256sum | cut -d' ' -f1)
  [ "$r" = "$g" ] && echo "BITGLEICH $f" || echo "ABWEICHUNG $f"
done
```

Das funktioniert, und es ist erwähnenswert, weil im Projekt mehrfach das
Gegenteil behauptet wurde: „`sha256sum` gegen das Git-Objekt geht hier nicht,
`core.autocrlf=true` macht den Datei-Hash systematisch ungleich dem
Blob-Hash." Das gilt für **Text**, nicht für diese Dateien — Git markiert
`woff2` als binär und wandelt dort keine Zeilenenden. Gemessen im Arbeitsbaum:

| Datei                            | Art   | roher `sha256sum` == Objekt-Hash | nach `tr -d '\r'` |
| -------------------------------- | ----- | -------------------------------- | ----------------- |
| `roboto-variable.woff2`          | binär | **ja**                           | nein              |
| `tools/pruefe-schriftdateien.js` | Text  | nein                             | **ja**            |

Für Textdateien ist der richtige Nachweis darum `git hash-object <pfad>` gegen
`git rev-parse :<pfad>` — beide normalisieren — und nicht `sha256sum`. Wer die
pauschale Fassung der Korrektur liest, hält für die sieben Dateien hier einen
gültigen Nachweisweg für unmöglich und weicht auf `git hash-object` aus, das
die Bytes des Arbeitsbaums gerade **nicht** prüft.
