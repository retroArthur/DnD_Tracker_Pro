'use strict';

/**
 * typo-map — die Zuordnungstabelle der Welle 5 (Design-Handoff v3, Befund
 * D-06 "Schriftgroessen") und die EINZIGE Quelle fuer alles, was zwei Leser
 * hat.
 *
 * WARUM DIESE DATEI UEBERHAUPT EXISTIERT UND NICHT ZWEI LISTEN.
 * Die Umstellung hat zwei Leser: das Umstellungswerkzeug
 * `tools/sync-typo-tokens.js`, das die Deklarationen ersetzt, und die Ratsche
 * W5-R-05 in `tests/unit/design-consistency.test.js`, die ueber das Ergebnis
 * urteilt. Stuende die Tabelle in beiden, liefen sie auseinander — dieses
 * Projekt hat die Lehre schon einmal bezahlt: `build.py` trug eine
 * handkopierte Modulliste neben der in `loader.js`, bis ARCH-01 sie auf EINE
 * Liste je Anlagenart zusammenzog. Deshalb steht hier, was beide brauchen,
 * und beide `require`n es. Der Waechtertest `tests/unit/typo-map.test.js`
 * sichert ausdruecklich zu, dass die Ratsche die Liste IMPORTIERT und nicht
 * nachbaut.
 *
 * WAS DIESE DATEI NICHT IST: sie ist keine Dauersynchronisation.
 * Das Vorbild `tools/sync-editor-toolbars.js` BESITZT das Markup, das es
 * schreibt — es kann die Werkzeugleisten jederzeit vollstaendig neu erzeugen
 * und deshalb pruefen, ob der Bestand "identisch neu erzeugbar" ist. Eine
 * `font-size`-Deklaration steht dagegen mitten in handgeschriebenem CSS,
 * umgeben von Zeilen, die das Werkzeug nicht besitzt und niemals erzeugen
 * koennte. Darum kann `--check` hier NICHT "identisch neu erzeugbar" pruefen,
 * sondern nur "kein Wert ausserhalb der Tokenmenge" — und genau das tut die
 * Ratsche W5-R-05 ohnehin, dauerhaft und in der Testsuite. Das Werkzeug ist
 * ein EINMALIGES Umstellungswerkzeug mit Bericht; die dauerhafte Wache sind
 * W5-R-05 und W5-R-06. Wer dem Werkzeug eine Dauerrolle zuschreibt,
 * verspricht eine Pruefung, die es nicht leisten kann.
 *
 * UND WARUM SIE AUCH DIE MESSWERTE TRAEGT (Abschnitt 7, seit der
 * Nachbesserung vom 2026-10-06). Die Zuordnungstabelle allein konnte eine
 * Frage nicht beantworten, die sie stellen muss: wie gross ist eine
 * Deklaration WIRKLICH? Ein `em`-Wert ist eine Rechnung, kein Wert, und
 * `altPx()` loest sie mit einer 16-px-Wurzel auf — fuer 55 gemessene Kanten
 * falsch. Darum stehen hier jetzt auch `KETTEN`, `EM_EINS` und
 * `UEBERSCHRIFTEN_GEMESSEN`: Messungen aus dem Browser, in derselben Datei
 * wie die Zuordnung, weil beide Leser beides brauchen. `zielFuer()`
 * (Abschnitt 9) ist die EINZIGE Stelle, die aus Tabelle, Sonderzuordnung und
 * Ausnahmen ein Ziel macht.
 *
 * WARUM DIE WERTE DER SKALA HIER NICHT STEHEN.
 * `skalaWerte()` liest sie aus `assets/styles/variables.css`. Eine zweite
 * Zahlenliste waere genau der Rueckfall, den der Absatz oben beschreibt —
 * und sie waere die schlimmere Sorte, weil ein abweichender Wert hier den
 * Delta-Bericht still verfaelschen wuerde, ohne irgendeinen Test zu bewegen.
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');

/* ===========================================================================
   1. DIE SKALA — acht Sprossen
   =========================================================================== */

/**
 * Die Tokennamen der Schrift-Skala (Handoff Paragraph 3.7), in aufsteigender
 * Groesse. Diese Liste ist AUS `tests/unit/design-consistency.test.js`
 * HIERHER VERLEGT (nicht kopiert): die Ratsche W5-R-05 hielt sie im Vorlauf,
 * weil diese Datei damals noch nicht existierte, und ihr Kommentar an der
 * Fundstelle sagte den Umzug an. Es gab also nie zwei Listen.
 */
const SKALA_TOKENS = [
    '--text-xs',
    '--text-sm',
    '--text-md',
    '--text-lg',
    '--text-xl',
    '--text-2xl',
    '--text-3xl',
    '--text-hero'
];

/** Kurzname -> Tokenname. `xs` ist bequemer zu tippen als `--text-xs`, und
 *  die Zuordnungstabelle unten wird dadurch in einem Blick lesbar. */
function token(kurz) {
    return `--text-${kurz}`;
}

/**
 * Die Bildpunktwerte der acht Sprossen, GELESEN aus
 * `assets/styles/variables.css`. Wirft, wenn eine Sprosse dort fehlt — ein
 * Delta-Bericht gegen eine halb definierte Skala waere schlimmer als keiner,
 * weil er Zahlen nennt, die niemand nachrechnet.
 */
function skalaWerte() {
    const css = fs.readFileSync(path.join(REPO, 'assets', 'styles', 'variables.css'), 'utf8');
    const ohneKommentare = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const werte = {};
    for (const name of SKALA_TOKENS) {
        const m = ohneKommentare.match(new RegExp(`${name}\\s*:\\s*([0-9.]+)px\\s*;`));
        if (!m) {
            throw new Error(
                `typo-map: ${name} ist in assets/styles/variables.css nicht als px-Wert ` +
                    `definiert. Die Skala muss dort vollstaendig stehen, bevor eine ` +
                    `Zuordnung gerechnet werden kann.`
            );
        }
        werte[name] = parseFloat(m[1]);
    }
    return werte;
}

/* ===========================================================================
   2. DIE ZUORDNUNGSTABELLE — 44 Zeilen, ein Wert je Zeile
   =========================================================================== */

/**
 * Deklarierter Wert -> Zielsprosse. 44 Zeilen: 28 em-Werte und 16
 * px-Literale. Gemessen am 2026-10-06 gegen den Zweig design-welle-4 deckt
 * sie ALLE im Geltungsbereich vorkommenden Zahlenwerte ab; der Waechtertest
 * `tests/unit/typo-map.test.js` sichert das als Zahl zu ("kein Wert ohne
 * Zeile"), nicht als Behauptung.
 *
 * HERKUNFT JEDER ZEILE. 19 Zeilen stehen so im Handoff (Paragraph 3.7); die
 * uebrigen 25 fehlten dort, und ohne sie waere ein Fuenftel der em-Werte
 * (109 von 603 Deklarationen) unversorgt geblieben oder frei Hand zugeordnet
 * worden. Die Regel fuer die Ergaenzung ist EINE und ueberall dieselbe: die
 * naechste Sprosse der Skala. Sie ist nachrechenbar, und `--report` nennt je
 * Zeile den Sprung in Bildpunkten, damit jede Zuordnung bestreitbar bleibt.
 *
 * ZWEI HANDOFF-ZEILEN FEHLEN HIER MIT ABSICHT: `26px -> --text-2xl` und
 * `34px -> --text-3xl`. Beide haben NULL Quellstellen (gemessen; die beiden
 * Werte kommen im Geltungsbereich nicht vor). Eine Tabellenzeile, die nichts
 * trifft, ist keine Zuordnung, sondern eine Behauptung ueber einen Bestand,
 * den es nicht gibt — und sie haette die Zeilenzahl von 44 auf 46 getrieben,
 * ohne eine einzige Deklaration zu versorgen. Kommt der Wert je vor, meldet
 * ihn `--check` als "ohne Zeile", und dann wird die Zeile mit ihrem Befund
 * nachgetragen.
 *
 * `1em` UND `1.0em` STEHEN BEIDE DRIN. Der Handoff nennt nur `1em`; im
 * Quellbaum kommen beide Schreibweisen vor. Ein wortgenauer Abgleich lief an
 * `1.0em` vorbei, und eine Normalisierung ueber `parseFloat` waere der
 * falsche Weg: dann traefe die Tabelle auch `1.000000001em` und waere nicht
 * mehr eine Liste, die man lesen kann.
 */
const ZUORDNUNG = {
    // --- em: die kleinen Sprossen ---
    '0.6em': token('xs'), //   9,60 px bei 16er Wurzel  -> 11 px
    '0.65em': token('xs'), // 10,40 px                  -> 11 px
    '0.7em': token('xs'), //  11,20 px                  -> 11 px
    '0.72em': token('xs'), // 11,52 px                  -> 11 px
    '0.75em': token('xs'), // 12,00 px                  -> 11 px
    '0.78em': token('sm'), // 12,48 px                  -> 12 px
    '0.8em': token('sm'), //  12,80 px                  -> 12 px
    '0.82em': token('sm'), // 13,12 px                  -> 12 px
    '0.85em': token('sm'), // 13,60 px                  -> 12 px
    '0.88em': token('md'), // 14,08 px                  -> 14 px
    '0.9em': token('md'), //  14,40 px                  -> 14 px
    '0.95em': token('md'), // 15,20 px                  -> 14 px
    '1em': token('md'), //    16,00 px                  -> 14 px
    '1.0em': token('md'), //  16,00 px                  -> 14 px
    '1.05em': token('lg'), // 16,80 px                  -> 16 px
    '1.1em': token('lg'), //  17,60 px                  -> 16 px
    // --- em: die grossen Sprossen ---
    '1.2em': token('xl'), //  19,20 px                  -> 20 px
    '1.25em': token('xl'), // 20,00 px                  -> 20 px
    '1.3em': token('xl'), //  20,80 px                  -> 20 px
    '1.4em': token('xl'), //  22,40 px                  -> 20 px
    '1.5em': token('2xl'), // 24,00 px                  -> 26 px
    '1.8em': token('2xl'), // 28,80 px                  -> 26 px
    '2em': token('3xl'), //   32,00 px                  -> 34 px
    '2.5em': token('3xl'), // 40,00 px                  -> 34 px
    '3em': token('3xl'), //   48,00 px                  -> 34 px
    '3.5em': token('hero'), // 56,00 px                 -> 72 px
    '4em': token('hero'), //  64,00 px                  -> 72 px
    '5em': token('hero'), //  80,00 px                  -> 72 px

    // --- px-Literale. 151 der 237 liegen schon auf einem Skalenwert: ihr
    //     TEXT aendert sich, ihr Bildpunkt nicht. Das ist der beste Beleg
    //     dafuer, dass das Werkzeug benennt und nicht rechnet.
    '8px': token('xs'), //   -> 11 px  (+3)
    '9px': token('xs'), //   -> 11 px  (+2)
    '10px': token('xs'), //  -> 11 px  (+1)
    '11px': token('xs'), //  -> 11 px  (Delta 0)
    '12px': token('sm'), //  -> 12 px  (Delta 0)
    '13px': token('sm'), //  -> 12 px  (-1)
    '14px': token('md'), //  -> 14 px  (Delta 0)
    '15px': token('md'), //  -> 14 px  (-1)
    '16px': token('lg'), //  -> 16 px  (Delta 0)
    '17px': token('lg'), //  -> 16 px  (-1)
    '18px': token('xl'), //  -> 20 px  (+2)
    '19px': token('xl'), //  -> 20 px  (+1)
    '20px': token('xl'), //  -> 20 px  (Delta 0)
    '22px': token('xl'), //  -> 20 px  (-2)
    '24px': token('2xl'), // -> 26 px  (+2)
    '32px': token('3xl') //  -> 34 px  (+2)
};

/* ===========================================================================
   3. WAS OHNE ZUORDNUNG BLEIBT — und warum
   =========================================================================== */

/**
 * Werte, die KEINE Groesse festlegen und deshalb keine Zuordnung brauchen.
 * `inherit` nimmt eine ueberschreibende Regel zurueck (7 Fundstellen, alle in
 * Werkzeugleisten: `.x-toolbar button|input|select|.btn`), `var(...)` steht
 * entweder schon auf einem Skalentoken oder auf einem Mobil-Profil-Token und
 * ist in beiden Faellen Gegenstand der Ausnahmeliste, nicht der Tabelle.
 */
const OHNE_ZAHLENWERT = /^(?:inherit|var\()/;

/**
 * Die Ausnahmen der Ratsche W5-R-05, Schluessel `datei||selektoren||prop` —
 * zeilenfrei, weil jeder Kommentar-Commit eine Zeilennummer verschiebt (die
 * Lehre steht im Block R-06 der Ratschendatei).
 *
 * HIERHER VERLEGT aus `tests/unit/design-consistency.test.js`, wo sie im
 * Vorlauf als `FONT_SIZE_GEDULDET` stand. Die Ratsche liest sie jetzt von
 * hier, damit es auch fuer die Ausnahmen genau eine Liste gibt — eine
 * Ausnahme, die das Werkzeug nicht kennt, waere die gefaehrlichere Haelfte
 * des Drift-Problems: die Ratsche wuerde sie dulden, das Werkzeug sie
 * ueberschreiben.
 *
 * DIE LISTE IST NICHT DER ORT, AN DEM EINE UNBEQUEME STELLE VERSCHWINDET:
 * die VERWESUNGSPROBE in W5-R-05 verlangt, dass jeder Eintrag auch wirklich
 * eine Deklaration trifft.
 *
 * SECHS WEITERE EINTRAEGE KOMMEN WEITER UNTEN HINZU, in Abschnitt 7: die
 * Ueberschriftenregeln des Reichtext-Inhalts. Ihre Schluessel werden aus
 * `REICHTEXT_BEHAELTER` GEBAUT, und diese Liste steht dort, weil auch die
 * Messung sie braucht — sie hier ein zweites Mal auszuschreiben waere genau
 * die Dopplung, gegen die diese Datei angelegt ist.
 *
 * UEBERGABE AN DIE FOLGESCHRITTE. Dies ist der Ausgangsbestand des Vorlaufs:
 * die fuenf Stellen, deren Verbleib bereits entschieden ist. Die namentlichen
 * Ausnahmen der Entscheidungen E-3 (Ikonen und Avatar-Platzhalter) und E-4
 * (die benannten Kleinst-Stellen) kommen mit dem Schritt hinzu, der sie
 * BEURTEILT — nicht hier. `--report --kategorien` nennt ihre Kandidatenmenge
 * vollstaendig und mit Zahl, damit der urteilende Schritt eine Liste vor sich
 * hat und keine Suche; aber geduldet ist erst, was mit Begruendung in dieser
 * Liste steht.
 */
const AUSNAHMEN = {
    'dashboard.css||.slot-pip||font-size':
        '8px. KEINE Schrift: ein Kreis von 18x18 px mit border-radius 50% ' +
        'und ohne Textinhalt (dashboard.css:311). Gemessen 4 Elemente, alle ' +
        'ohne eigenen Textknoten. Auf 11 px zu heben aendert nichts ' +
        'Sichtbares, erzeugt aber vier Treffer im Stil-Sollstand ohne ' +
        'Nutzen — und wer die Stelle als "Schrift unter 11 px" zaehlt, ' +
        'rechnet die Zielquote falsch.',
    'command-palette.css||.cp-result-label||font-size':
        'var(--font-size-base, 14px). Komponentenleser der ' +
        'MOBILVERGROESSERUNG, die bewusst stehenbleibt: im Mobil-Profil ' +
        'wird --font-size-base 16 px, im Desktop-Profil 14 px. Ein ' +
        'Skalentoken an dieser Stelle naehme der Palette genau diese ' +
        'Vergroesserung. Der px-Rueckfall ist der Wert fuer den Fall, dass ' +
        'das Profil-Token fehlt.',
    'file-backup.css||.backup-entry-name||font-size':
        'var(--font-size-base, 14px). Dieselbe Begruendung wie ' +
        '.cp-result-label: Leser der Mobilvergroesserung.',
    'pwa.css||.pwa-install-btn||font-size':
        'var(--font-size-small, 12px). Leser der Mobilvergroesserung: ' +
        '12 px im Desktop-Profil, 14 px im Mobil-Profil.',
    'pwa.css||.pwa-update-banner||font-size':
        'var(--font-size-small, 12px). Dieselbe Begruendung wie ' + '.pwa-install-btn.'
};

/**
 * Ausnahmen fuer SVG-Praesentationsattribute (`font-size="7"`), Schluessel
 * `datei:zeile` — hier AUSNAHMSWEISE mit Zeile, weil ein SVG-Attribut in
 * einer Zeichenkette keinen Selektor hat, an dem es haengen koennte.
 *
 * Bewusst LEER, nicht abwesend (Muster der EXEC_COMMAND_ALLOWLIST in
 * `editor-floating.spec.js`): die Entscheidung ueber die 21 Beschriftungen
 * der Wuerfelstatistik faellt nach E-4 in einem eigenen Schritt. Verlegt aus
 * der Ratsche, aus demselben Grund wie AUSNAHMEN.
 */
const SVG_GEDULDET = {};

/**
 * Namentlich ausgenommene QUELLDATEIEN. `features/shops/shop-export.js`
 * erzeugt ein eigenstaendiges Druckdokument mit pt-Einheiten (Handoff
 * Paragraph 7) und gehoert nicht zur Bildschirm-Typografie. Die DATEI wird
 * ausgenommen, nicht eine Zahl — sonst sinkt eine Schranke bei der naechsten
 * Aenderung dort von selbst und niemand merkt, dass eine Ausnahme
 * stillschweigend gewachsen ist. 17 der JS-Schriftgroessen und 1 `bold`
 * liegen dort.
 */
const AUSGENOMMENE_DATEIEN = ['features/shops/shop-export.js'];

/* ===========================================================================
   4. DIE SCHUTZLISTE — wo eine Ersetzung ein RUECKSCHRITT waere
   =========================================================================== */

/**
 * Die Chip- und Markenfamilien der Welle 4.
 *
 * WARUM SIE EINE EIGENE KATEGORIE SIND UND KEINE AUSNAHME. Ihr Vertrag
 * (Ratsche W4-R-06, Regex MASS_TEXTFORM in
 * `tests/unit/design-consistency.test.js`) verlangt an der BASIS woertlich
 * `font-size: var(--text-sm)` bzw. `var(--text-xs)` und VERBIETET jedem
 * Mitgliedsselektor eine eigene `font-size`- oder `font-weight`-Deklaration.
 * Die Basen stehen also bereits richtig, und die Mitglieder tragen heute
 * gemessen NULL eigene Schriftgroessen.
 *
 * Die Gefahr ist deshalb nicht, dass hier etwas liegen bleibt, sondern dass
 * ein Werkzeug hier etwas HINEINSCHREIBT. Wer eine spaeter hinzugekommene
 * `font-size` in einem Mitgliedsselektor durch ein Token ERSETZT statt sie zu
 * ENTFERNEN, macht die Welle 4 rot — an einer Stelle, die wie ein Fortschritt
 * aussieht. Darum verweigert das Umstellungswerkzeug den Dienst, wenn es in
 * einem Mitgliedsselektor eine Schriftgroesse findet, statt sie zu ersetzen.
 */
const SCHUTZ_CHIP = [
    'chip',
    'filter-chip',
    'npc-filter-chip',
    'loc-filter-chip',
    'enc-filter-chip',
    'loot-filter-chip',
    'dice-chip',
    'shop-cat-badge',
    'filter-toggle',
    'loc-npc-chip',
    'cf-chip',
    'ds-rate-chip',
    'link-chip',
    'loot-tag-chip',
    'timer-preset-chip',
    'timer-preset-btn',
    'char-resistance-chip',
    'dice-formula-chip'
];

const SCHUTZ_MARKE = [
    'badge',
    'section-toolbar-count',
    'npc-badge',
    'difficulty-badge',
    'bestiary-badge',
    'cart-badge',
    'dms-live-badge',
    'tag',
    'loc-item-tag'
];

/**
 * Die zwei Basisregeln, die den Vertrag der Welle 4 tragen. Das Werkzeug
 * erkennt sie daran, dass ihr Selektor ALLE Mitglieder der Familie nennt, und
 * laesst sie unberuehrt: sie stehen schon auf einem Skalentoken.
 */
const SCHUTZ_BASIS_WERTE = {
    chip: token('sm'),
    marke: token('xs')
};

/* ===========================================================================
   5. DIE KANDIDATENMENGEN — benannt, gezaehlt, noch nicht geduldet
   =========================================================================== */

/**
 * Selektor-Muster der Ikonen- und Avatar-Stellen (Entscheidung E-3: "die
 * Welle fasst nur Text an").
 *
 * WARUM MUSTER UND KEINE AUFZAEHLUNG. Die Menge ist ueber die Groesse NICHT
 * zu bestimmen — gemessen tragen nur 21 Deklarationen einen Wert ab 32 px,
 * und sechs davon sind gar keine Ikonen (`.dice-hero-result`,
 * `.dice-result-main`, `.fdp-number`, `.timer-hero-time`, `.ld-split-amount`,
 * `.rest-type-btn.active` sind Zahlen und Text). Umgekehrt sind
 * `.loc-mini-avatar` (0.6em) und `.npc-item-avatar` (1.4em) Ikonen und liegen
 * weit darunter. Das Merkmal ist der NAME, nicht die Zahl.
 *
 * WAS DIESE LISTE AUSDRUECKLICH NICHT TUT: sie duldet nichts. Sie benennt
 * eine Kandidatenmenge, die `--report --kategorien` auszaehlt, damit der
 * Schritt, der ueber E-3 urteilt, eine vollstaendige Liste vor sich hat statt
 * einer Suche. Geduldet ist erst, was mit Begruendung in AUSNAHMEN steht.
 *
 * `-empty` STEHT HIER NICHT, und das ist der lehrreiche Teil. Ein erster
 * Entwurf hatte `/-empty\b/` und `/\bempty-state\b/` darin und zaehlte 91
 * Kandidaten statt der erwarteten rund 66 — hereingezogen hatte er
 * `.enc-empty-title`, `.enc-empty-desc`, `.detail-empty-text`,
 * `.generator-empty p`, `.sb-empty-hint`, `.tl-empty-hint`,
 * `.fr-historie-empty` und ein Dutzend weitere: lauter FLIESSTEXT in
 * Leerzustands-Kaesten. Genau den fasst die Welle an (E-3: "die Welle fasst
 * nur Text an"). Die Muster muessen also das Ikon treffen und nicht seine
 * Umgebung; `.x-empty-icon` und `.empty-state-icon` fallen ohnehin unter
 * `-icon`. Dass die Zahl nach dem Schaerfen auf die erwartete Groesse faellt,
 * ist die Probe darauf, dass die Muster das Gemeinte treffen.
 */
const IKON_MUSTER = [/-icon\b/, /\bicon-/, /-avatar\b/, /\bavatar-/, /-symbol\b/, /-placeholder\b/];

/** Die Untergrenze fuer alles, was man liest (Entscheidung E-4). In
 *  Bildpunkten, und bewusst keine Sprosse der Skala: `--text-xs` steht heute
 *  auf 11 px, aber die Grenze gilt auch, wenn die Sprosse einmal wandert. */
const KLEINST_GRENZE = 11;

/* ===========================================================================
   6. Helfer, die BEIDE Leser brauchen
   =========================================================================== */

/** Schluessel einer Ausnahme: Datei, Selektor, Eigenschaft. KEINE Zeile. */
function anker(datei, selektoren, prop) {
    return `${datei}||${selektoren}||${prop}`;
}

/** Was eine Schriftgroesse sein DARF: ein Skalentoken oder `inherit`. */
function erlaubtRegex() {
    return new RegExp(`^var\\(\\s*(?:${SKALA_TOKENS.join('|')})\\s*\\)$|^inherit$`);
}

/** Ein Wert mit der Einheit `em`. Der Vorsatz schliesst `rem` aus: andere
 *  Einheit, anderer Befund, und F-03 urteilt darueber. */
function emRegex() {
    return /(?:^|[\d.\s(])[\d.]+\s*em\b/;
}

/** Trifft der Selektor ein Mitglied einer geschuetzten Familie? Gibt den
 *  Familiennamen zurueck oder null. */
function schutzFamilie(selektoren) {
    const klassen = [...selektoren.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
    if (klassen.some(k => SCHUTZ_CHIP.includes(k))) return 'chip';
    if (klassen.some(k => SCHUTZ_MARKE.includes(k))) return 'marke';
    return null;
}

/** Ist dieser Selektor die BASISREGEL einer geschuetzten Familie, also die
 *  Regel, die alle Mitglieder der Familie nennt? */
function istSchutzBasis(selektoren) {
    const klassen = new Set([...selektoren.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(m => m[1]));
    if (SCHUTZ_CHIP.every(k => klassen.has(k))) return 'chip';
    if (SCHUTZ_MARKE.every(k => klassen.has(k))) return 'marke';
    return null;
}

/** Trifft der Selektor ein Ikon oder einen Avatar-Platzhalter? */
function istIkon(selektoren) {
    return IKON_MUSTER.some(re => re.test(selektoren));
}

/** Der deklarierte Wert in Bildpunkten, bei einer 16-px-Wurzel gerechnet.
 *  `null`, wenn der Wert keine Zahl ist.
 *
 *  DIE 16-PX-WURZEL IST EINE ANNAHME, und sie muss beim Namen genannt werden:
 *  gemessen sitzen nur 723 der 948 em-Elemente auf einem 16-px-Elternwert.
 *  Bei den anderen 225 ist der sichtbare Wert ein Produkt (Bezugsgroessen
 *  14 px 78x, 13,6 px 36x, 13,3333 px 28x ...), und der tatsaechliche Sprung
 *  weicht vom hier gerechneten ab — bis Faktor 0,574. Diese Rechnung ist
 *  deshalb eine QUELLSEITIGE Schaetzung zum Sortieren und Abhaken; was
 *  wirklich auf dem Bildschirm passiert, misst `tools/typo-baseline.js` im
 *  Browser und stellt es in Bildpunkten gegenueber. */
function altPx(wert) {
    const m = wert.match(/^([0-9.]+)\s*(em|px)$/);
    if (!m) return null;
    const zahl = parseFloat(m[1]);
    return m[2] === 'em' ? zahl * 16 : zahl;
}

/* ===========================================================================
   7. DIE GEMESSENEN BESTAENDE — wogegen die Zuordnung geurteilt wird
   ===========================================================================

   WARUM DIESER ABSCHNITT EXISTIERT. `altPx()` oben rechnet mit einer
   16-px-Wurzel und nennt die Annahme beim Namen. Was dort NICHT stand, war
   ihre FOLGE in Zahlen — und die ist der eigentliche Befund: wo ein em-Wert
   auf einem Elternwert ungleich 16 px sitzt, ist der sichtbare Wert ein
   PRODUKT, und eine Tabelle, die beide Glieder einzeln ersetzt, zerreisst die
   Kette. Gemessen trifft das 55 Kanten; bei 15 von ihnen liegt der wirkliche
   Sprung ueber 2 px oder die Ordnung Eltern/Kind kippt — ein Kind wuerde
   groesser als sein Elternelement. Keine dieser 15 stand in der 31er-Liste
   von `--report`, weil diese Liste denselben 16-px-Fehler rechnet, gegen den
   sie schuetzen soll. Die Uebereinstimmung mit der Vorab-Vermessung war auf
   dieser Annahme eine Tautologie: beide Rechnungen teilen sie.

   DIE BESTAENDE HIER SIND MESSUNG, KEINE ENTSCHEIDUNG. Sie sagen, was der
   Browser zeigt; was daraus folgt, steht in `SONDERZUORDNUNG` und
   `AUSNAHMEN` und ist dort je Eintrag begruendet. Die Trennung ist Absicht:
   eine Messung darf man nachmessen, eine Entscheidung muss man bestreiten
   koennen, und beides im selben Satz macht keins von beidem pruefbar.

   WIE GEMESSEN WURDE. Gebautes Buendel (`dist/dnd-tracker-bundled.html`),
   gefuellte Kampagne (`seedPopulatedSession` — eine leere verbirgt 88 % der
   Stellen), alle 24 Ansichten besucht, zwei Laeufe: dark-1440 (layout
   desktop) und dark-375 (layout mobile). Je Element wird die EIGENTUEMER-
   Deklaration bestimmt (der Selektor trifft UND der berechnete Wert ist mit
   der Deklaration vereinbar: `px` woertlich, `em` als Elternwert mal Faktor)
   und dann die naechste Vorfahrenkante gebildet. Die Eigentuemerprobe ist der
   Teil, auf den es ankommt: ein `querySelectorAll('.btn')` trifft auch
   Elemente, an denen eine spezifischere Regel gewinnt, und ein erster Entwurf
   dieser Messung schrieb deren Werte der `.btn`-Deklaration zu und meldete
   `.btn` mit 17,6 px. Beide Laeufe nennen fuer jede Kante denselben Messwert
   (0 Abweichungen) — darum steht hier eine Zahl je Kante und nicht zwei.
*/

/** Der Selektor der Formularfelder einer Formulargruppe. Eigener Name, weil
 *  er in zwei Ketten als Kind vorkommt und die Zeile sonst dreimal umbricht. */
const FORM_FELDER_ANKER =
    'core.css||.form-group input, .form-group select, .form-group textarea||13px';

/** Der Sammelselektor aller Leerzustands-Hinweise (19 Klassen, 300 Zeichen).
 *  Als Elternteil genau einer Kette; ausgeschrieben waere die Zeile
 *  unlesbar und der Umbruch eine Fehlerquelle. */
const LEERZUSTAND_ANKER =
    'core.css||.empty-hint, .bestiary-empty-results, .cp-empty, .dash-empty, ' +
    '.dash-party-empty, .calc-fav-empty, .calc-results-empty, .calc-list-empty, ' +
    '.backup-browser-empty, .condition-ref-empty, .wp-empty-state, .tl-empty-state, ' +
    '.rs-empty-state, .fr-empty-state, .cart-empty, .shop-items-empty, ' +
    '.rt-preview-empty, .char-empty, .dms-widget-empty||0.9em';

/**
 * Die gemessenen Verschachtelungsketten: 35 Elternteile, 55 Kanten, 319
 * Elemente. Nur Ketten mit Elternwert UNGLEICH 16 px stehen hier — bei einem
 * 16-px-Elternteil ist die Annahme von `altPx()` richtig und es gibt nichts
 * nachzumessen.
 *
 * Form: je Elternteil `{ eltern, elternPx, kinder: [[kindAnker, kindPx,
 * elemente, textknoten], ...] }`. Der Anker ist `datei||selektoren||wert` —
 * MIT dem Wert, anders als bei `AUSNAHMEN`: zwei Regeln koennen in derselben
 * Datei denselben Selektor tragen (`.section-toolbar-title` steht in
 * editors.css zweimal, mit `1em` und mit `0.9em`), und ein Schluessel, der
 * beide trifft, stellte die falsche von ihnen um.
 *
 * DIE LISTE IST EIN BESTAND, KEINE SCHRANKE. Sie darf wachsen, wenn eine neue
 * Kette entsteht. Was sie leistet, leistet die Zusicherung in
 * `tests/unit/typo-map.test.js`: keine Kante kippt die Ordnung. Wird eine
 * Kette aufgeloest, verschwindet ihr Eintrag — und die Verwesungsprobe im
 * Waechter verlangt, dass jeder Anker hier wirklich eine Deklaration trifft.
 *
 * DIE GRENZE DER ERHEBUNG, und sie ist kein Randfall. Die Liste kennt nur
 * Kanten, deren KIND in der Ruhelage der gefuellten Kampagne im DOM steht.
 * Vom Nutzer geschriebener Reichtext-Inhalt faellt grundsaetzlich heraus:
 * `seedPopulatedSession` erzeugt keinen Eintrag mit `h1`..`h6`, also kennt
 * diese Liste keine einzige Kante von einem der acht Reichtext-Behaelter zu
 * einer Ueberschrift darin — auch dann nicht, wenn die Kante gefaehrlich
 * ist. Gemessen war sie es: `.spell-desc` (0.85em) haette nach der Tabelle
 * 12 px getragen und damit `h6` auf 10,80 px gezogen, unter die
 * E-4-Untergrenze, ohne dass eine der sechs Ueberschriftendeklarationen
 * angefasst worden waere. Zur Gegenprobe steht die sehr aehnliche, aber im
 * DOM sichtbare Kante `.bst-save-item` -> `.bst-save-val` sehr wohl hier.
 * WER DORT EINE KETTE BRAUCHT, MISST SIE EIGENS mit einem eingehaengten
 * Probekoerper, so wie `UEBERSCHRIFTEN_GEMESSEN` entstanden ist, und traegt
 * das Ergebnis dort und nicht hier ein.
 */
const KETTEN = [
    {
        eltern: 'editors.css||.section-toolbar||14px',
        elternPx: 14,
        kinder: [
            ['editors.css||.section-toolbar-title||0.9em', 12.6, 24, 24],
            ['editors.css||.section-toolbar-title||1em', 14, 24, 24],
            ['dmscreen.css||.dms-config-icon||1em', 14, 21, 21],
            ['dmscreen.css||.dms-config-name||0.85em', 11.9, 21, 21],
            ['editors.css||.section-toolbar-filters select||0.85em', 11.9, 7, 0],
            ['core.css||.toolbar-filter-label||0.85em', 11.9, 2, 2],
            ['dmscreen.css||.dms-config-header||0.85em', 11.9, 2, 1],
            ['dmscreen.css||.dms-config-hint||0.75em', 10.5, 1, 1]
        ]
    },
    {
        eltern: 'core.css||.form-group label||13px',
        elternPx: 13,
        kinder: [
            [FORM_FELDER_ANKER, 13, 19, 0],
            ['encounters.css||.enc-lang-item span||0.9em', 11.7, 17, 17],
            ['core.css||.meta-text||11px', 11, 3, 3],
            ['core.css||.u-text-sm||0.85em', 11.05, 1, 1]
        ]
    },
    {
        eltern: 'dmscreen.css||.shortcut-row||0.85em',
        elternPx: 13.6,
        kinder: [['dmscreen.css||.shortcut-key||0.85em', 11.56, 33, 33]]
    },
    {
        eltern: 'core.css||.char-attr-pill||0.7em',
        elternPx: 11.2,
        kinder: [
            ['core.css||.char-attr-pill-mod||0.95em', 10.64, 6, 6],
            ['core.css||.char-attr-pill-name||0.9em', 10.08, 6, 6],
            ['core.css||.char-attr-pill-val||1.1em', 12.32, 6, 6]
        ]
    },
    {
        eltern: 'party.css||.cf-skill-row||0.82em',
        elternPx: 13.12,
        kinder: [['party.css||.cf-skill-exp-label||0.7em', 9.18, 18, 18]]
    },
    {
        eltern: 'dashboard.css||.qref-action-item||0.85em',
        elternPx: 13.6,
        kinder: [
            ['dashboard.css||.qref-action-desc||0.85em', 11.56, 8, 8],
            ['dashboard.css||.qref-action-name||0.85em', 11.56, 8, 8]
        ]
    },
    {
        eltern: 'dashboard.css||.qref-item||0.85em',
        elternPx: 13.6,
        kinder: [['dashboard.css||.qref-value||0.95em', 12.92, 13, 13]]
    },
    {
        eltern: 'spells.css||.spell-classes-grid label||0.8em',
        elternPx: 12.8,
        kinder: [[FORM_FELDER_ANKER, 13, 13, 0]]
    },
    {
        eltern: 'dashboard.css||.qref-condition||0.8em',
        elternPx: 12.8,
        kinder: [['dashboard.css||.qref-apply-btn||0.8em', 10.24, 12, 12]]
    },
    {
        eltern: 'bestiary.css||.bst-save-item||0.85em',
        elternPx: 13.6,
        kinder: [['bestiary.css||.bst-save-val||0.85em', 11.56, 6, 0]]
    },
    {
        eltern: 'spells.css||.floating-toolbar .editor-btn||14px',
        elternPx: 14,
        kinder: [['spells.css||.floating-toolbar .kbd-hint||8px', 8, 5, 5]]
    },
    {
        eltern: 'dashboard.css||.qref-tab||0.75em',
        elternPx: 12,
        kinder: [['dashboard.css||.qref-tab-icon||1.1em', 13.2, 4, 4]]
    },
    {
        eltern: 'editors.css||.editor-toolbar .editor-btn-text||12px',
        elternPx: 12,
        kinder: [['editors.css||.editor-toolbar .tb-caret||9px', 9, 4, 4]]
    },
    {
        eltern: 'editors.css||.editor-toolbar .editor-btn||14px',
        elternPx: 14,
        kinder: [['editors.css||.editor-toolbar .tb-caret||9px', 9, 4, 4]]
    },
    {
        eltern: 'loot.css||.si-details||0.85em',
        elternPx: 13.6,
        kinder: [
            ['loot.css||.si-avail-toggle||0.9em', 12.24, 2, 0],
            ['core.css||.btn-sm||11px', 11, 1, 1]
        ]
    },
    {
        eltern: 'initiative.css||.init-mob-dmg-inputs||0.75em',
        elternPx: 12,
        kinder: [['initiative.css||.init-mob-dmg-inputs input||0.9em', 10.8, 2, 0]]
    },
    {
        eltern: 'npcs.css||.npc-section-title||0.75em',
        elternPx: 12,
        kinder: [['npcs.css||.npc-section-btn||1em', 12, 2, 2]]
    },
    {
        eltern: 'core.css||.assign-spell-count-label||0.85em',
        elternPx: 13.6,
        kinder: [['core.css||.assign-spell-count-badge||0.85em', 11.56, 1, 1]]
    },
    {
        eltern: 'party.css||.wiki-form-header||1.1em',
        elternPx: 17.6,
        kinder: [['core.css||.btn-sm||11px', 11, 1, 1]]
    },
    {
        eltern: 'welt.css||.tl-kalender-header||18px',
        elternPx: 18,
        kinder: [
            ['core.css||.btn-sm||11px', 11, 1, 1],
            ['welt.css||.tl-kalender-datum||18px', 18, 1, 0]
        ]
    },
    {
        eltern: 'dmscreen.css||.shortcuts-title||1.3em',
        elternPx: 20.8,
        kinder: [['core.css||.btn-sm||11px', 11, 1, 1]]
    },
    {
        eltern: 'core.css||.char-card-name||0.95em',
        elternPx: 15.2,
        kinder: [
            ['core.css||.char-card-name .drag-handle||0.8em', 12.16, 1, 1],
            ['party.css||.char-inspiration-toggle||1em', 15.2, 1, 1]
        ]
    },
    {
        eltern: 'dmscreen.css||.dms-stat-row||0.9em',
        elternPx: 14.4,
        kinder: [
            ['dmscreen.css||.dms-hp-text||0.75em', 10.8, 1, 1],
            ['dmscreen.css||.dms-stat-char||0.85em', 12.24, 1, 1]
        ]
    },
    {
        eltern: 'dmscreen.css||.dms-init-header||0.85em',
        elternPx: 13.6,
        kinder: [['dmscreen.css||.dms-init-count||0.9em', 12.24, 1, 1]]
    },
    {
        eltern: 'dmscreen.css||.dms-init-entry||0.85em',
        elternPx: 13.6,
        kinder: [
            ['dmscreen.css||.dms-init-marker||0.9em', 12.24, 1, 1],
            ['dmscreen.css||.dms-init-value||0.9em', 12.24, 1, 1]
        ]
    },
    {
        eltern: 'dmscreen.css||.dms-quick-btn||0.85em',
        elternPx: 13.6,
        kinder: [
            ['dmscreen.css||.dms-quick-icon||1em', 13.6, 1, 1],
            ['dmscreen.css||.dms-quick-label||0.8em', 10.88, 1, 1]
        ]
    },
    {
        eltern: 'initiative.css||.init-ac||0.9em',
        elternPx: 14.4,
        kinder: [['initiative.css||.init-ac-icon||0.85em', 12.24, 1, 1]]
    },
    {
        eltern: 'initiative.css||.xp-dist-party-info||14px',
        elternPx: 14,
        kinder: [['initiative.css||.xp-dist-icon||18px', 18, 1, 1]]
    },
    {
        eltern: 'loot.css||.cart-total-row||1.2em',
        elternPx: 19.2,
        kinder: [['loot.css||.cart-total-gold||0.8em', 15.36, 1, 1]]
    },
    {
        eltern: 'loot.css||.si-cost||0.9em',
        elternPx: 14.4,
        kinder: [['loot.css||.si-cart-btn||0.8em', 11.52, 1, 1]]
    },
    {
        eltern: 'npcs.css||.npc-detail-subtitle||0.9em',
        elternPx: 14.4,
        kinder: [['npcs.css||.npc-detail-role||0.9em', 12.96, 1, 1]]
    },
    {
        eltern: 'party.css||.cf-combat-label||0.7em',
        elternPx: 11.2,
        kinder: [['party.css||.cf-combat-stat .cf-speed-ft||0.85em', 9.52, 1, 1]]
    },
    {
        eltern: 'welt.css||.fr-card-ruf||14px',
        elternPx: 14,
        kinder: [
            ['welt.css||.fr-ruf-badge||14px', 14, 1, 1],
            ['welt.css||.fr-ruf-value||13px', 13, 1, 1]
        ]
    },
    {
        eltern: LEERZUSTAND_ANKER,
        elternPx: 14.4,
        kinder: [['welt.css||.tl-empty-hint||14px', 14, 1, 1]]
    },
    {
        eltern: 'welt.css||.tl-kalender-datum||18px',
        elternPx: 18,
        kinder: [['welt.css||.tl-jahreszeit-badge||14px', 14, 1, 1]]
    }
];

/**
 * Die acht Behaelter des Reichtext-Inhalts, in der Reihenfolge, in der sie im
 * Selektor der Ueberschriftenregeln stehen (party.css).
 */
const REICHTEXT_BEHAELTER = [
    '.quest-details',
    '.char-notes-content',
    '.loot-item-desc',
    '.location-description',
    '.npc-list-desc',
    '.wiki-detail-body',
    '.encounter-content',
    '.spell-desc'
];

/** Die deklarierten Werte der sechs Ueberschriftenstufen, h1 bis h6. */
const UEBERSCHRIFTEN_WERTE = ['1.3em', '1.2em', '1.1em', '1.0em', '0.95em', '0.9em'];

/**
 * Der Anker der Ueberschriftenregel der Stufe `n` (1..6), GEBAUT statt
 * abgeschrieben: der Selektor ist 230 Zeichen lang und sechsmal fast
 * derselbe. Sechs abgeschriebene Zeichenketten waeren sechs Gelegenheiten
 * fuer einen Tippfehler, den niemand sieht. Die Verwesungsprobe im Waechter
 * verlangt, dass jeder gebaute Anker wirklich eine Deklaration trifft — damit
 * ist die Konstruktion belegt und nicht geglaubt.
 */
function ueberschriftAnker(n) {
    const sel = REICHTEXT_BEHAELTER.map(b => `${b} h${n}`).join(', ');
    return `party.css||${sel}||${UEBERSCHRIFTEN_WERTE[n - 1]}`;
}

/**
 * DIE SECHS UEBERSCHRIFTENREGELN BLEIBEN IN `em` — namentlich geduldet.
 *
 * WARUM NICHT AUF SPROSSEN. Die sechs Regeln sind KEINE sechs Groessen,
 * sondern EIN Verhaeltnis: 1.3 / 1.2 / 1.1 / 1.0 / 0.95 / 0.9 mal der Groesse
 * ihres Behaelters. Und der Behaelter ist gemessen nicht einer, sondern drei —
 * 13,6 px (.spell-desc), 14,4 px (.char-notes-content) und 16 px (die
 * uebrigen sechs). Eine feste Sprosse kann nicht gleichzeitig ueber einem
 * 13,6-px- und unter einem 16-px-Fliesstext liegen; sie wuerde in einem der
 * Behaelter immer falsch sitzen. Die Tabelle fuehrt genau dorthin: `xl / xl /
 * lg / md / md / md` = 20 / 20 / 16 / 14 / 14 / 14 px — drei Stufen statt
 * sechs, h1 = h2, h4 = h5 = h6, und in den sechs 16-px-Behaeltern sind h4 bis
 * h6 mit 14 px KLEINER als der Fliesstext, den sie ueberschreiben.
 *
 * SECHS SPROSSEN STATT DREI WAEREN AUCH KEINE LOESUNG: die Skala hat unter
 * `xl` (20) nur `lg` (16), `md` (14), `sm` (12) und `xs` (11). Sechs streng
 * fallende Werte waeren 20 / 16 / 14 / 12 / 11 / ... — bei h5 ist die Skala
 * zu Ende, und h4 laege mit 12 px wieder unter dem 16-px-Fliesstext. Das ist
 * keine Zuordnungsfrage, sondern eine Eigenschaft einer achtsprossigen Skala
 * gegenueber einer sechsstufigen Hierarchie in drei Bezugsgroessen.
 *
 * WAS DAS KOSTET, und es muss benannt werden: sechs Deklarationen bleiben in
 * `em`. Die Schranke 2 von W5-R-05 zaehlt em-Deklarationen OHNE Ruecksicht
 * auf diese Ausnahmeliste; ihr Zielwert ist damit 6 und nicht 0, und das
 * steht dort jetzt auch so. Eine Schranke, die 0 verspricht und 6 erreichen
 * kann, wird beim ersten roten Lauf gesenkt statt erfuellt.
 *
 * WAS DAS RISIKO BEGRENZT: diese sechs Regeln gelten NUR fuer vom Nutzer
 * geschriebenen Reichtext-Inhalt in acht benannten Behaeltern, nicht fuer die
 * Oberflaeche. Sie sind der einzige Ort der App, an dem eine sechsstufige
 * Hierarchie ueberhaupt vorkommt.
 */
for (let n = 1; n <= 6; n++) {
    const sel = REICHTEXT_BEHAELTER.map(b => `${b} h${n}`).join(', ');
    AUSNAHMEN[anker('party.css', sel, 'font-size')] =
        `${UEBERSCHRIFTEN_WERTE[n - 1]} !important, Ueberschrift h${n} des ` +
        'Reichtext-Inhalts in acht Behaeltern. Die sechs Regeln sind EIN ' +
        'Verhaeltnis zum Behaelter und keine sechs Groessen; der Behaelter ist ' +
        'gemessen 13,6 / 14,4 oder 16 px. Feste Sprossen lassen von sechs ' +
        'Stufen drei uebrig (20/20/16/14/14/14) und machen h4 bis h6 kleiner ' +
        'als den Fliesstext, den sie ueberschreiben. Volle Begruendung am ' +
        'Kopf dieser Schleife in tools/typo-map.js, Abschnitt 7.';
}

/**
 * Alle 27 Deklarationen mit dem Wert `1em` oder `1.0em`, mit ihrem GEMESSENEN
 * Bildpunktwert, dem Elementnamen und der Zahl der Fundstellen.
 *
 * WARUM GERADE `1em` EINE EIGENE LISTE BRAUCHT. `1em` legt keine Groesse
 * fest, sondern UEBERNIMMT die des Elternelements. Am Wurzelwert sind das
 * 16 px — und 16 px ist die Schwelle, unter der ein Telefon beim Antippen
 * eines Eingabefeldes den Auto-Zoom ausloest. Die Tabelle bildet `1em` auf
 * `--text-md` (14 px) ab; fuer fuenf gemessene Eingabefelder ist das genau
 * der Fall, zu dessen Verhinderung E-2 getroffen wurde ("unter 16 px loest
 * ein Telefon beim Antippen den Auto-Zoom aus, das ist nach Arbeitsregel 10
 * eine Funktionsaenderung"). Die Ausnahmeliste der Entscheidung schuetzt nur
 * die vier `var(--font-size-*)`-Leser; die `1em`-Leser, die ueber die Wurzel
 * ebenfalls bei 16 px landen, kamen darin nicht vor — und ueber ihren
 * Selektor sind sie nicht zu finden: `.dice-formula` und `.dice-multi` nennen
 * ihr Eingabefeld nicht. Darum ist diese Liste GEMESSEN und nicht hergeleitet.
 *
 * Form: `[anker, gemessenPx, element, fundstellen, davonSichtbar]`.
 * `gemessenPx === null` heisst "in der Ruhelage nicht im DOM" und traegt
 * seinen Grund in `EM_EINS_UNGEMESSEN` — keine dieser neun Stellen ist ein
 * `input`, `select` oder `textarea`, aber das ist eine Beobachtung und keine
 * Herleitung, und deshalb steht sie als offene Messschuld da und nicht als
 * stille Null.
 *
 * DIE LISTE IST VOLLSTAENDIG UND WIRD ALS SOLCHE GEPRUEFT: der Waechter
 * vergleicht sie mit allen `1em`/`1.0em`-Deklarationen im Geltungsbereich.
 * Eine neue kann also nicht unbeurteilt hineinwachsen.
 */
const EM_EINS = [
    ['core.css||.card-title||1em', 16, 'span,div', 7, 0],
    ['core.css||.avatar-placeholder.avatar-sm||1em', null, null, 0, 0],
    ['core.css||.quest-reward-item-tag .remove-btn||1em', null, null, 0, 0],
    ['dashboard.css||.qref-btn||1em', 16, 'button', 2, 0],
    ['dashboard.css||.qref-conv-input||1em', 16, 'input', 2, 0],
    ['dice.css||.dice-multi||1em', 16, 'input', 1, 0],
    ['dice.css||.dice-formula||1em', 16, 'input', 1, 0],
    ['dice.css||.dice-history-clear||1em', 16, 'button', 1, 0],
    ['dice.css||.fdp-title||1em', 16, 'span', 1, 0],
    ['dice.css||.fdp-roll-btn||1em', 16, 'button', 1, 0],
    ['dmscreen.css||.dms-attr-abbr||1em', null, null, 0, 0],
    ['dmscreen.css||.dms-dmg-icon||1em', null, null, 0, 0],
    ['dmscreen.css||.dms-config-icon||1em', 14, 'span', 21, 0],
    ['dmscreen.css||.dms-profile-icon||1em', null, null, 0, 0],
    ['dmscreen.css||.dms-quick-icon||1em', 13.6, 'span', 1, 0],
    ['editors.css||.section-toolbar-title||1em', 14, 'span', 24, 1],
    ['initiative.css||.concentration-badge .conc-icon||1em', null, null, 0, 0],
    ['initiative.css||.aoe-damage-input input||1em', 16, 'input', 1, 0],
    ['initiative.css||.aoe-apply-btn||1em', null, null, 0, 0],
    ['npcs.css||.npc-section-btn||1em', 12, 'button', 2, 0],
    [ueberschriftAnker(4), null, null, 0, 0],
    ['party.css||.wiki-tree-cat-icon||1em', null, null, 0, 0],
    ['party.css||.cf-panel-title||1em', 16, 'span', 3, 0],
    ['party.css||.cf-attr-card .cf-attr-mod||1em', 16, 'span', 6, 0],
    ['party.css||.condition-ref-search input||1em', 16, 'input', 1, 0],
    ['party.css||.char-inspiration-toggle||1em', 15.2, 'button', 1, 0],
    ['tools.css||.timer-hero-name||1em', 16, 'div', 1, 0]
];

/** Warum neun der 27 `1em`-Stellen keinen Messwert tragen. Eine offene
 *  Messschuld mit Grund ist nachvollziehbar; eine 0 an derselben Stelle waere
 *  eine Behauptung. */
const EM_EINS_UNGEMESSEN = {
    'core.css||.avatar-placeholder.avatar-sm||1em':
        'Avatar-Platzhalter in der Groesse sm — in der Ruhelage der gefuellten ' +
        'Kampagne kommt die sm-Variante nicht vor.',
    'core.css||.quest-reward-item-tag .remove-btn||1em':
        'Loeschknopf einer Belohnungsmarke; entsteht erst, wenn im Quest-Formular ' +
        'eine Belohnung eingetragen ist.',
    'dmscreen.css||.dms-attr-abbr||1em':
        'Attribut-Widget des DM-Schirms; nur im Profil "Referenz" eingeschaltet.',
    'dmscreen.css||.dms-dmg-icon||1em':
        'Schadensarten-Widget des DM-Schirms; nur im Profil "Referenz" eingeschaltet.',
    'dmscreen.css||.dms-profile-icon||1em':
        'Profilwaehler des DM-Schirms; entsteht erst beim Oeffnen der Konfiguration.',
    'initiative.css||.concentration-badge .conc-icon||1em':
        'Konzentrationsmarke; entsteht erst, wenn ein Kaempfer Konzentration traegt.',
    'initiative.css||.aoe-apply-btn||1em':
        'Knopf im Flaechenschaden-Dialog. Der Dialog selbst wurde geoeffnet und ' +
        'gemessen (darum traegt `.aoe-damage-input input` einen Wert); dieser ' +
        'Knopf entsteht erst nach der Zielauswahl.',
    [ueberschriftAnker(4)]:
        'Ueberschrift h4 im Reichtext-Inhalt. Sie entsteht nur, wenn der Nutzer ' +
        'eine schreibt; seedPopulatedSession erzeugt keinen Eintrag mit ' +
        'Ueberschriften. Eigens gemessen in UEBERSCHRIFTEN_GEMESSEN.',
    'party.css||.wiki-tree-cat-icon||1em':
        'Kategorie-Ikon im Wiki-Baum; die Kategorien sind seit v2.6.0 ' +
        'eingeklappt (CLAUDE.md, "Wiki Categories Collapsed").'
};

/**
 * Die GEMESSENE Ueberschriften-Hierarchie je Behaelter:
 * `[behaelter, behaelterPx, absatzPx, [h1..h6]]`.
 *
 * WARUM DIESE MESSUNG EXTRA ERHOBEN WERDEN MUSSTE. Keiner der acht Behaelter
 * steht in der Grundlinien-Erhebung: `seedPopulatedSession` erzeugt keinen
 * Wiki-Eintrag mit Ueberschriften, also kennt `typo-baseline.js --diff` diese
 * Stellen nicht und kann ueber sie auch nichts melden. Und die 2-px-Schwelle
 * waere hier ohnehin blind — die Einzelspruenge liegen zwischen -0,4 und
 * -2,0 px, der Schaden ist der VERLUST DER UNTERSCHIEDE und nicht die Groesse
 * eines einzelnen Sprungs. Gemessen mit einem eingehaengten Probekoerper
 * (`h1`..`h6` plus Absatz) in jedem der acht Behaelter, beide Laeufe gleich.
 *
 * WAS SIE ZEIGT: sechs streng fallende Stufen, und der Behaelter traegt
 * 13,6 / 14,4 oder 16 px — die Stufen sind also ein VIELFACHES des
 * Behaelters und keine festen Groessen. Genau daran scheitert eine Zuordnung
 * auf feste Sprossen: `1.3em / 1.2em / 1.1em / 1.0em / 0.95em / 0.9em` landet
 * auf `xl / xl / lg / md / md / md` = 20 / 20 / 16 / 14 / 14 / 14 px, also
 * drei Stufen statt sechs, und im 16-px-Behaelter sind h4 bis h6 mit 14 px
 * KLEINER als der Fliesstext, den sie ueberschreiben.
 */
const UEBERSCHRIFTEN_GEMESSEN = [
    ['.quest-details', 16, 16, [20.8, 19.2, 17.6, 16, 15.2, 14.4]],
    ['.char-notes-content', 14.4, 14.4, [18.72, 17.28, 15.84, 14.4, 13.68, 12.96]],
    ['.loot-item-desc', 16, 16, [20.8, 19.2, 17.6, 16, 15.2, 14.4]],
    ['.location-description', 16, 16, [20.8, 19.2, 17.6, 16, 15.2, 14.4]],
    ['.npc-list-desc', 16, 16, [20.8, 19.2, 17.6, 16, 15.2, 14.4]],
    ['.wiki-detail-body', 16, 16, [20.8, 19.2, 17.6, 16, 15.2, 14.4]],
    ['.encounter-content', 16, 16, [20.8, 19.2, 17.6, 16, 15.2, 14.4]],
    ['.spell-desc', 13.6, 13.6, [17.68, 16.32, 14.96, 13.6, 12.92, 12.24]]
];

/* ===========================================================================
   8. DIE SONDERZUORDNUNGEN — begruendete Abweichungen von der Tabelle
   =========================================================================== */

/**
 * Deklarationen, deren Ziel NICHT aus `ZUORDNUNG` kommt. Schluessel
 * `datei||selektoren||wert` (siehe `kettenAnker()`), Wert
 * `{ ziel, grund, warum, ...Messwerte }`.
 *
 * EINUNDZWANZIG EINTRAEGE IN DREI GRUENDEN, und jeder nennt seinen Messwert.
 *
 * GRUND `kette` — 15 Stellen. Das Ziel kommt aus dem GEMESSENEN Wert und
 * nicht aus dem deklarierten. Die Regel ist EINE und ueberall dieselbe,
 * damit die Zeilen nachrechenbar bleiben und nicht nach Gefuehl gesetzt
 * sind:
 *   (1) Den gemessenen Wert auf ganze Bildpunkte runden und durch die
 *       px-Zeilen DERSELBEN Tabelle schicken. Nicht "naechste Sprosse" —
 *       die Tabelle rundet an ihren Bucketgrenzen bewusst anders (12,0 px
 *       aus `0.75em` geht nach 11, das px-Literal `12px` nach 12), und eine
 *       zweite Rundungsregel waere eine zweite Tabelle.
 *   (2) An der Ordnung zum Elternziel kappen: war das Kind gemessen KLEINER
 *       als sein Elternteil, darf es nicht groesser werden; war es groesser,
 *       nicht kleiner; war es gleich, bleibt es gleich.
 * Geurteilt wird ueber die ORDNUNG und nicht ueber die Strenge: zwei
 * Messwerte im Abstand von 1,4 px landen auf einer achtsprossigen Skala zu
 * Recht auf derselben Sprosse. Was nicht passieren darf, ist eine UMKEHRUNG.
 *
 * GRUND `formular-e2` — 5 Stellen. `1em` auf einem Eingabefeld ist gemessen
 * 16,00 px, und 16 px ist die Schwelle, unter der ein Telefon beim Antippen
 * den Auto-Zoom ausloest. Die Tabellenzeile `1em -> --text-md` zoege sie auf
 * 14 px — nach Arbeitsregel 10 eine Funktionsaenderung, und genau der Fall,
 * zu dessen Verhinderung E-2 getroffen wurde. `--text-lg` = 16 px ist die
 * treue Zuordnung: Delta 0,00 px auf dem Bildschirm, in beiden Profilen.
 * EINE AUSNAHME WAERE HIER DAS SCHLECHTERE MITTEL — sie liesse den em-Wert
 * stehen und damit eine Stelle, die bei jeder Aenderung ihres Behaelters
 * wieder unter 16 px rutschen kann.
 *
 * GRUND `kette-reichtext` — 1 Stelle, und er ist NICHT `kette`. Bei `kette`
 * weicht der GEMESSENE Wert der Stelle von der 16-px-Annahme ab, und das
 * Ziel kommt aus der Messung. Hier stimmt die Annahme: `.spell-desc` sitzt
 * unter einem 16-px-Elternteil, 0.85 x 16 = 13,6 px ist gemessen genau der
 * deklarierte Wert. Abgewichen wird wegen der KINDER — der sechs geduldeten
 * em-Ueberschriften aus Abschnitt 7, die sich mit dem Behaelter mitbewegen,
 * ohne dass eine ihrer Deklarationen angefasst wuerde. Die Kante steht nicht
 * in `KETTEN` und kann dort nicht stehen: die Liste ist aus dem DOM erhoben,
 * und in der Ruhelage enthaelt kein Reichtext-Inhalt eine Ueberschrift
 * (Begruendung am Kopf von `KETTEN`). Ein Eintrag mit `grund: 'kette'` haette
 * also eine Herkunft behauptet, die er nicht hat.
 */
const SONDERZUORDNUNG = {
    // --- Grund `kette`: Ziel aus dem gemessenen Wert ---------------------
    'core.css||.char-attr-pill-name||0.9em': {
        ziel: token('xs'),
        grund: 'kette',
        gemessenPx: 10.08,
        elternPx: 11.2,
        warum:
            'Elternteil .char-attr-pill traegt 0.7em = 11,2 px, nicht 16 px. ' +
            'Die Tabelle gaebe --text-md (14 px) und machte das Kind um 27 % ' +
            'GROESSER als die Grundgroesse seines Behaelters (vorher 10 % ' +
            'kleiner); die Pillenbox waechst dadurch um 28,6 %. Gerundet 10 px ' +
            '-> px-Zeile 10px -> --text-xs (11 px), Sprung +0,92 px.'
    },
    'core.css||.char-attr-pill-val||1.1em': {
        ziel: token('sm'),
        grund: 'kette',
        gemessenPx: 12.32,
        elternPx: 11.2,
        warum:
            'Dieselbe Kette, andere Richtung: dieses Kind war gemessen ' +
            'GROESSER als sein Elternteil (12,32 gegen 11,2 px) und darf das ' +
            'bleiben. Die Tabelle gaebe --text-lg (16 px), ein Sprung von ' +
            '+3,68 px. Gerundet 12 px -> --text-sm (12 px), Sprung -0,32 px.'
    },
    'core.css||.char-attr-pill-mod||0.95em': {
        ziel: token('xs'),
        grund: 'kette',
        gemessenPx: 10.64,
        elternPx: 11.2,
        warum:
            'Dieselbe Kette wie .char-attr-pill-name. Tabelle --text-md ' +
            '(+3,36 px); gerundet 11 px -> --text-xs (11 px), Sprung +0,36 px.'
    },
    'dashboard.css||.qref-value||0.95em': {
        ziel: token('sm'),
        grund: 'kette',
        gemessenPx: 12.92,
        elternPx: 13.6,
        warum:
            'Elternteil .qref-item traegt 0.85em = 13,6 px -> --text-sm ' +
            '(12 px). Die Tabelle gaebe dem Kind --text-md (14 px) und damit ' +
            'MEHR als dem Elternteil, obwohl es gemessen kleiner ist. ' +
            'Gerundet 13 px -> --text-sm (12 px), Sprung -0,92 px.'
    },
    'dashboard.css||.qref-tab-icon||1.1em': {
        ziel: token('sm'),
        grund: 'kette',
        gemessenPx: 13.2,
        elternPx: 12,
        warum:
            'Elternteil .qref-tab traegt 0.75em = 12 px -> --text-xs (11 px). ' +
            'Tabelle --text-lg (16 px), Sprung +2,80 px. Gerundet 13 px -> ' +
            '--text-sm (12 px), Sprung -1,20 px, und weiterhin groesser als ' +
            'das Elternziel — die Reiterschrift bleibt kleiner als ihr Ikon.'
    },
    'dmscreen.css||.dms-init-count||0.9em': {
        ziel: token('sm'),
        grund: 'kette',
        gemessenPx: 12.24,
        elternPx: 13.6,
        warum:
            'Elternteil .dms-init-header 0.85em = 13,6 px -> --text-sm. ' +
            'Tabelle --text-md waere groesser als das Elternziel. Gerundet ' +
            '12 px -> --text-sm (12 px), Sprung -0,24 px.'
    },
    'dmscreen.css||.dms-init-marker||0.9em': {
        ziel: token('sm'),
        grund: 'kette',
        gemessenPx: 12.24,
        elternPx: 13.6,
        warum: 'Wie .dms-init-count, Elternteil .dms-init-entry. Sprung -0,24 px.'
    },
    'dmscreen.css||.dms-init-value||0.9em': {
        ziel: token('sm'),
        grund: 'kette',
        gemessenPx: 12.24,
        elternPx: 13.6,
        warum: 'Wie .dms-init-marker, dasselbe Elternteil. Sprung -0,24 px.'
    },
    'dmscreen.css||.dms-quick-icon||1em': {
        ziel: token('sm'),
        grund: 'kette',
        gemessenPx: 13.6,
        elternPx: 13.6,
        warum:
            '`1em` heisst hier "genau so gross wie der Knopf": gemessen 13,6 ' +
            'gegen 13,6 px. Das Elternteil .dms-quick-btn geht auf --text-sm, ' +
            'also muss das Ikon mit — die Tabelle gaebe --text-md und machte ' +
            'das Ikon groesser als seinen eigenen Knopf. Sprung -1,60 px.'
    },
    'encounters.css||.enc-lang-item span||0.9em': {
        ziel: token('sm'),
        grund: 'kette',
        gemessenPx: 11.7,
        elternPx: 13,
        warum:
            'Elternteil ist das px-Literal .form-group label 13px -> ' +
            '--text-sm. Die 17 Sprachmarken messen 11,7 px; die Tabelle gaebe ' +
            '--text-md (14 px), Sprung +2,30 px und groesser als das ' +
            'Elternziel. Gerundet 12 px -> --text-sm, Sprung +0,30 px.'
    },
    'initiative.css||.init-mob-dmg-inputs input||0.9em': {
        ziel: token('xs'),
        grund: 'kette',
        gemessenPx: 10.8,
        elternPx: 12,
        warum:
            'Elternteil .init-mob-dmg-inputs 0.75em = 12 px -> --text-xs. ' +
            'Tabelle --text-md (14 px), Sprung +3,20 px. Gerundet 11 px -> ' +
            '--text-xs (11 px), Sprung +0,20 px. KEIN E-2-Fall: das Feld ' +
            'liegt mit 10,8 px schon heute unter 16 px, der Auto-Zoom greift ' +
            'dort also ohnehin — das ist ein eigener Befund und nicht dieser.'
    },
    'loot.css||.si-avail-toggle||0.9em': {
        ziel: token('sm'),
        grund: 'kette',
        gemessenPx: 12.24,
        elternPx: 13.6,
        warum:
            'Elternteil .si-details 0.85em = 13,6 px -> --text-sm. Tabelle ' +
            '--text-md waere groesser als das Elternziel. Sprung -0,24 px.'
    },
    'loot.css||.cart-total-gold||0.8em': {
        ziel: token('md'),
        grund: 'kette',
        gemessenPx: 15.36,
        elternPx: 19.2,
        warum:
            'Die einzige Kette mit einem GROSSEN Elternteil: .cart-total-row ' +
            'traegt 1.2em = 19,2 px, das Kind misst 15,36 px. Die Tabelle ' +
            'rechnet 0.8em gegen 16 px und gaebe --text-sm (12 px) — ein ' +
            'Sprung von -3,36 px an der Summenzeile des Warenkorbs. Gerundet ' +
            '15 px -> px-Zeile 15px -> --text-md (14 px), Sprung -1,36 px.'
    },
    'npcs.css||.npc-section-btn||1em': {
        ziel: token('xs'),
        grund: 'kette',
        gemessenPx: 12,
        elternPx: 12,
        warum:
            '`1em` heisst hier "genau so gross wie die Abschnittsueberschrift": ' +
            'gemessen 12 gegen 12 px. Das Elternteil .npc-section-title geht ' +
            'auf --text-xs, also muss der Knopf mit. Tabelle --text-md, ' +
            'Sprung +2,00 px und groesser als die Ueberschrift, in der er ' +
            'sitzt. Sprung -1,00 px.'
    },
    'party.css||.cf-combat-stat .cf-speed-ft||0.85em': {
        ziel: token('xs'),
        grund: 'kette',
        gemessenPx: 9.52,
        elternPx: 11.2,
        warum:
            'Elternteil .cf-combat-label 0.7em = 11,2 px -> --text-xs. Die ' +
            'Tabelle gaebe --text-sm (12 px), Sprung +2,48 px und groesser ' +
            'als das Elternziel. Gerundet 10 px -> --text-xs (11 px), Sprung ' +
            '+1,48 px — gleichzeitig die Hebung ueber die Untergrenze (E-4), ' +
            'denn 9,52 px ist Fliesstext unter 11 px.'
    },

    // --- Grund `formular-e2`: 16 px ist eine Funktionsgrenze -------------
    'dashboard.css||.qref-conv-input||1em': {
        ziel: token('lg'),
        grund: 'formular-e2',
        gemessenPx: 16,
        elternPx: 16,
        warum:
            'Eingabefeld der Maßumrechnung, gemessen 16,00 px in BEIDEN ' +
            'Profilen. --text-lg = 16 px, Delta 0,00 px. Die Tabellenzeile ' +
            '`1em -> --text-md` zoege es auf 14 px und loeste damit auf dem ' +
            'Telefon den Auto-Zoom aus (E-2).'
    },
    'dice.css||.dice-multi||1em': {
        ziel: token('lg'),
        grund: 'formular-e2',
        gemessenPx: 16,
        elternPx: 16,
        warum:
            'Wurfanzahl-Feld des Wuerflers, gemessen 16,00 px. Wie ' +
            '.qref-conv-input: --text-lg haelt den Wert und die E-2-Zusage.'
    },
    'dice.css||.dice-formula||1em': {
        ziel: token('lg'),
        grund: 'formular-e2',
        gemessenPx: 16,
        elternPx: 16,
        warum:
            'Formelfeld des Wuerflers, gemessen 16,00 px. --text-lg haelt ' +
            'zusaetzlich die Rechnung im Kommentar daneben gueltig: die ' +
            'Sollbreite 160 px ist dort aus "4d6kh3+2d8+5 ist in ' +
            'var(--font-mono) bei 1em 130 px breit" abgeleitet. Bei 14 px ' +
            'stimmte diese Begruendung nicht mehr und die Zauberzahl haette ' +
            'mitgezogen werden muessen; bei 16 px bleibt sie, wie sie ist.'
    },
    'initiative.css||.aoe-damage-input input||1em': {
        ziel: token('lg'),
        grund: 'formular-e2',
        gemessenPx: 16,
        elternPx: 16,
        warum:
            'Schadensformel im Flaechenschaden-Dialog. Eigens gemessen, indem ' +
            'der Dialog geoeffnet wurde (in der Ruhelage steht er nicht im ' +
            'DOM): 16,00 px in beiden Profilen.'
    },
    'party.css||.condition-ref-search input||1em': {
        ziel: token('lg'),
        grund: 'formular-e2',
        gemessenPx: 16,
        elternPx: 16,
        warum:
            'Suchfeld der Zustands-Schnellreferenz. Ebenfalls nach Oeffnen ' +
            'des Dialogs gemessen: 16,00 px in beiden Profilen.'
    },

    // --- Grund `kette-reichtext`: Ziel aus den geduldeten em-Kindern ------
    'spells.css||.spell-desc||0.85em': {
        ziel: token('md'),
        grund: 'kette-reichtext',
        gemessenPx: 13.6,
        elternPx: 16,
        warum:
            'Behaelter des Zauberblatts und einer der acht Reichtext-' +
            'Behaelter. Die Tabellenzeile 0.85em -> --text-sm gaebe 12 px; ' +
            'die sechs geduldeten em-Ueberschriften (Abschnitt 7) bewegen ' +
            'sich mit ihm, und 0.9 x 12 = 10,80 px schickt h6 unter die ' +
            'E-4-Untergrenze von 11 px, h1 auf 15,60 gegen gemessene 17,68 ' +
            '(-2,08 px, ueber der Abnahmeschwelle). Beide Stufen sind ' +
            'sichtbar und tragen einen Textknoten. --text-md kommt aus der ' +
            'Rundungsregel von `kette`: gemessen 13,6 -> gerundet 14 -> ' +
            'px-Zeile 14px -> --text-md. Dann h6 = 12,6 und h1 = 18,2 px, ' +
            'alle sechs Stufen ueber 11 px und innerhalb 2 px der Messung, ' +
            'und der Behaelter selbst springt +0,40 statt -1,60 px. Die ' +
            'einzige Alternative waere, .spell-desc h6 namentlich aus E-4 ' +
            'auszunehmen — eine 10,8-px-Ueberschrift im Zauberblatt ist ' +
            'aber lesbarer Text, und genau dafuer gilt die Untergrenze; die ' +
            '25 benannten Kleinst-Ausnahmen sind SVG-Beschriftungen und ' +
            'textlose Punkte, nicht Ueberschriften.'
    }
};

/** Die Gruende, die eine Sonderzuordnung tragen darf. Eine geschlossene
 *  Menge, damit nicht bei jeder unbequemen Stelle ein neuer Grund erfunden
 *  wird — wer einen vierten braucht, traegt ihn hier ein und begruendet ihn.
 *  Dass jeder Eintrag einen Grund AUS dieser Menge traegt, prueft der
 *  Waechter; ohne diese Pruefung waere die Geschlossenheit eine Bitte. */
const SONDER_GRUENDE = ['kette', 'formular-e2', 'kette-reichtext'];

/* ===========================================================================
   9. DIE EINE STELLE, DIE EIN ZIEL BESTIMMT
   =========================================================================== */

/** Schluessel einer Sonderzuordnung: Datei, Selektor, deklarierter WERT.
 *  MIT dem Wert, anders als `anker()` — Begruendung an `KETTEN`. */
function kettenAnker(datei, selektoren, wert) {
    return `${datei}||${selektoren}||${wert}`;
}

/**
 * Das Ziel einer Deklaration: Tokenname oder `null`.
 *
 * DIES IST DIE EINZIGE STELLE, DIE EIN ZIEL BESTIMMT. Das Umstellungswerkzeug
 * und der Waechter rufen sie beide. `ZUORDNUNG` direkt nachzuschlagen umgeht
 * die Sonderzuordnungen — und das war genau der Fehler, den Abschnitt 7
 * beschreibt: eine Tabelle, die nur den DEKLARIERTEN Wert kennt, ersetzt
 * beide Glieder einer Kette einzeln und zerreisst sie.
 *
 * Reihenfolge, und jede Stufe hat ihren Grund:
 *   1. `AUSNAHMEN` — namentlich geduldet, es wird NICHTS ersetzt (`null`).
 *   2. `SONDERZUORDNUNG` — eine begruendete Abweichung von der Tabelle.
 *   3. `ZUORDNUNG` — die Tabelle, der gewoehnliche Fall.
 */
function zielFuer(datei, selektoren, wert) {
    if (AUSNAHMEN[anker(datei, selektoren, 'font-size')]) return null;
    const sonder = SONDERZUORDNUNG[kettenAnker(datei, selektoren, wert)];
    if (sonder) return sonder.ziel;
    return ZUORDNUNG[wert] || null;
}

module.exports = {
    REPO,
    SKALA_TOKENS,
    ZUORDNUNG,
    SONDERZUORDNUNG,
    SONDER_GRUENDE,
    KETTEN,
    EM_EINS,
    EM_EINS_UNGEMESSEN,
    REICHTEXT_BEHAELTER,
    UEBERSCHRIFTEN_WERTE,
    UEBERSCHRIFTEN_GEMESSEN,
    FORM_FELDER_ANKER,
    LEERZUSTAND_ANKER,
    ueberschriftAnker,
    kettenAnker,
    zielFuer,
    OHNE_ZAHLENWERT,
    AUSNAHMEN,
    SVG_GEDULDET,
    AUSGENOMMENE_DATEIEN,
    SCHUTZ_CHIP,
    SCHUTZ_MARKE,
    SCHUTZ_BASIS_WERTE,
    IKON_MUSTER,
    KLEINST_GRENZE,
    skalaWerte,
    token,
    anker,
    erlaubtRegex,
    emRegex,
    schutzFamilie,
    istSchutzBasis,
    istIkon,
    altPx
};
