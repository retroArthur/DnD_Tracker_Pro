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

module.exports = {
    REPO,
    SKALA_TOKENS,
    ZUORDNUNG,
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
