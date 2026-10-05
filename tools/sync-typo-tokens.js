#!/usr/bin/env node
'use strict';

/**
 * sync-typo-tokens — das EINMALIGE Umstellungswerkzeug der Welle 5
 * (Design-Handoff v3, Befund D-06 "Schriftgroessen").
 *
 * WARUM EIN WERKZEUG UND KEINE HANDARBEIT.
 * Gemessen sind 840 der 853 `font-size`-Deklarationen im Geltungsbereich eine
 * reine Nachschlagearbeit: Wert -> Sprosse, 44 Tabellenzeilen in
 * `tools/typo-map.js`. 809 davon springen um 2 px oder weniger, 151 um exakt
 * 0,00 px (das sind die px-Literale, die schon auf einem Skalenwert liegen —
 * ihr Text aendert sich, ihr Bildpunkt nicht). Das ist die Art Arbeit, die
 * ein Werkzeug fehlerfrei macht und ein Mensch nicht. Der atomare Commit der
 * Umstellung enthaelt dann NUR Werkzeugergebnis, und der Pruefer liest statt
 * 840 geaenderter Deklarationen vier Dinge: die Tabelle, dieses Werkzeug,
 * seinen Waechtertest und den Bericht aus `--report`.
 *
 * WAS DIESES WERKZEUG NICHT IST — die Grenze gehoert in den Kopf, nicht ins
 * Kleingedruckte.
 * Das Vorbild `tools/sync-editor-toolbars.js` BESITZT das Markup, das es
 * schreibt; es kann die Werkzeugleisten vollstaendig neu erzeugen und
 * deshalb pruefen, ob der Bestand "identisch neu erzeugbar" ist. Eine
 * `font-size`-Deklaration steht mitten in handgeschriebenem CSS, umgeben von
 * Zeilen, die dieses Werkzeug nicht besitzt. `--check` kann hier also NICHT
 * "identisch neu erzeugbar" pruefen, sondern nur "kein Wert ausserhalb der
 * Tokenmenge" — und genau das tut die Ratsche W5-R-05 ohnehin, dauerhaft und
 * in der Testsuite. Dieses Werkzeug ist ein EINMALIGES Umstellungswerkzeug
 * mit Bericht; die dauerhafte Wache sind W5-R-05 und W5-R-06. Wer ihm eine
 * Dauerrolle zuschreibt, verspricht eine Pruefung, die es nicht leisten kann.
 *
 * UND NOCH EINE GRENZE, aus demselben Grund benannt: der Vorbild-Generator
 * behauptet in seiner Zeile 18 einen Waechtertest
 * (`tests/unit/editor-toolbar-sync.test.js`), den es nicht gibt — ein
 * `--check`, das niemand fahrt, ist keine Absicherung, sondern eine
 * Behauptung (CLAUDE.md, Phase 15 GATE-04). Darum entsteht der Waechtertest
 * dieses Werkzeugs MIT dem Werkzeug: `tests/unit/typo-map.test.js` faehrt
 * `--check` und `--report` wirklich, prueft, dass `--check` nichts schreibt,
 * und sichert zu, dass die Ratsche die Tabelle IMPORTIERT statt sie
 * nachzubauen.
 *
 * BETRIEBSARTEN:
 *
 *   node tools/sync-typo-tokens.js --check
 *       Zaehlt und schreibt NICHTS. Nennt die Rechnung vollstaendig:
 *       Gesamtzahl im Geltungsbereich, bereits auf der Skala, `inherit`,
 *       namentlich geduldet, offen. Exit 1, solange eine Stelle offen ist,
 *       Exit 0 danach — der Rueckgabewert ist also eine Aussage und nicht
 *       Zierde.
 *
 *   node tools/sync-typo-tokens.js --report [--kategorien]
 *       Schreibt die Delta-Tabelle nach stdout: je Deklaration eine Zeile
 *       "Datei:Zeile | alt px | neu px | Delta | Selektor", nach Betrag des
 *       Deltas sortiert, oben die Stellen ueber 2 px. Das ist die Liste, die
 *       das Abnahmekriterium des Handoffs ("keine Aenderung > 2 px ausser
 *       beabsichtigt") namentlich braucht und die der Handoff nicht liefert.
 *       `--kategorien` haengt die Kandidatenmengen der Entscheidungen E-3
 *       (Ikonen/Avatare) und E-4 (Kleinst-Stellen) an, ausgezaehlt und mit
 *       Fundstellen — damit der Schritt, der darueber urteilt, eine Liste
 *       vor sich hat und keine Suche.
 *       KEINE Ausgabedatei mit Absicht: ein mitcommitteter Bericht waere eine
 *       zweite Quelle, die veraltet, waehrend die Tabelle weiterlebt. Wer ihn
 *       als Datei braucht, leitet um.
 *
 *   node tools/sync-typo-tokens.js [--only=<datei.css>]
 *       SCHREIBT. Ersetzt jede zuordenbare Deklaration durch ihr Token,
 *       `!important` bleibt erhalten. `--only` beschraenkt auf eine Datei —
 *       fuer gestaffelte Rollouts, und weil ein Lauf ueber 18 Dateien, der
 *       zur Haelfte scheitert, schwerer zurueckzudrehen ist als 18 Laeufe.
 *
 * WAS DAS WERKZEUG NIEMALS ANFASST (und warum jeweils):
 *   - `assets/styles/variables.css` — dort wird die Skala DEFINIERT, und dort
 *     stehen die Deklarationen des Mobil-Profils, die nach E-2 bewusst
 *     bleiben: unter 16 px loest ein Telefon beim Antippen eines Eingabefeldes
 *     den Auto-Zoom aus, das Entfernen waere eine Funktionsaenderung.
 *   - `assets/styles/fonts.css` — reine @font-face-Bloecke; ihre
 *     `font-weight`-Zeilen BENENNEN eine Schriftschnittdatei.
 *   - jede Stelle in `AUSNAHMEN` (tools/typo-map.js), mit Begruendung dort.
 *   - jede Mitgliedsregel der Chip- und Markenfamilien der Welle 4. Dort
 *     waere eine Ersetzung ein RUECKSCHRITT: der Vertrag W4-R-06 verbietet
 *     dem Mitglied eine eigene Schriftgroesse und verlangt sie an der Basis.
 *     Findet das Werkzeug dort eine, VERWEIGERT es den Dienst (Exit 2) statt
 *     zu ersetzen — eine Ersetzung saehe wie Fortschritt aus und machte die
 *     Welle 4 rot.
 */

const fs = require('fs');
const path = require('path');

const M = require('./typo-map');

const STYLES = path.join(M.REPO, 'assets', 'styles');
const NICHT_IM_BEREICH = ['variables.css', 'fonts.css'];

/* ===========================================================================
   Der Zerleger
   ===========================================================================

   EIGENE ZERLEGUNG, nicht die der Ratsche, und das ist Absicht in beide
   Richtungen:
     (1) Ein schreibendes Werkzeug braucht die ZEICHENGRENZEN des Wertes, um
         ihn zu ersetzen. Die Zerlegung der Ratsche gibt Werte als
         Zeichenkette zurueck — damit kann man urteilen, aber nicht schreiben.
     (2) Zwei Rechnungen, die nichts voneinander wissen, muessen dieselbe Zahl
         nennen. Taeten beide dasselbe Stueck Code, waere die
         Uebereinstimmung eine Tautologie. Der Waechtertest stellt genau diese
         Gegenrechnung an.

   Klammerzaehlend statt zeilenweise, aus zwei Gruenden, die beide in diesem
   Projekt schon einmal eine Zaehlung verfaelscht haben:
     - Das abschliessende Semikolon der LETZTEN Deklaration eines Blocks ist
       in CSS optional. Wer nur an `;` trennt, verliert genau sie.
     - Ein Selektor (`.btn:hover`) und ein At-Regel-Kopf (`@media (max-width:
       600px)`) tragen ebenfalls einen Doppelpunkt.
   Runde Klammern werden am Stueck uebersprungen, damit ein Semikolon in einer
   `url()` oder einem Verlauf keine Deklaration beendet.
*/

/** Kommentare zeilen- UND zeichentreu leeren: die Maske ist genauso lang wie
 *  das Original, damit jede Zeichengrenze im Original gueltig bleibt. */
function maskiereKommentare(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
}

/**
 * Alle Deklarationen einer Eigenschaft, mit Selektor, At-Regel, Zeile und den
 * Zeichengrenzen des Wertes.
 */
function deklarationen(css, prop) {
    const code = maskiereKommentare(css);
    const out = [];
    const stapel = [];
    // `start` ist der ABSOLUTE Index des ersten Nicht-Leerzeichens seit dem
    // letzten Trennzeichen, -1 solange nur Leerraum kam. Der Rohtext wird
    // NICHT aufgesammelt, sondern am Ende per code.slice(start, ende) geholt.
    // Das ist der Unterschied, auf den es ankommt: ein aufgesammelter Puffer
    // und der Original-Index laufen auseinander, sobald ein maskierter
    // Kommentar oder ein Zeilenumbruch dazwischenliegt — und dann zeigt die
    // Ersetzung mitten in den Wert. Genau das ist beim ersten Lauf passiert
    // (`13px` kam als `px` an, core.css:693).
    let start = -1;
    let startZeile = 1;
    let zeile = 1;

    const abgeben = ende => {
        if (start >= 0 && stapel.length) {
            const roh = code.slice(start, ende);
            const dp = roh.indexOf(':');
            if (dp > 0) {
                const name = roh.slice(0, dp).trim();
                if (name.toLowerCase() === prop && /^(?:--)?[a-zA-Z][\w-]*$/.test(name)) {
                    // Zeichengrenzen des WERTES: hinter dem Doppelpunkt
                    // beginnen, Leerraum ueberspringen, am Ende
                    // zurueckschneiden. `!important` bleibt draussen, damit
                    // die Ersetzung es nicht verschluckt.
                    let a = start + dp + 1;
                    while (a < ende && /\s/.test(code[a])) a++;
                    let b = ende;
                    while (b > a && /\s/.test(code[b - 1])) b--;
                    let wert = code.slice(a, b);
                    let wichtig = '';
                    const wi = wert.search(/!\s*important\s*$/i);
                    if (wi >= 0) {
                        wichtig = wert.slice(wi);
                        wert = wert.slice(0, wi).replace(/\s+$/, '');
                        b = a + wert.length;
                    }
                    out.push({
                        prop,
                        wert: wert.replace(/\s+/g, ' '),
                        wichtig,
                        von: a,
                        bis: b,
                        selektoren: [...stapel].reverse().find(s => !s.startsWith('@')) || '(ohne)',
                        at: stapel.filter(s => s.startsWith('@')).join(' & ') || null,
                        zeile: startZeile
                    });
                }
            }
        }
        start = -1;
    };

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        if (ch === '\n') {
            zeile++;
            continue;
        }
        if (ch === '(') {
            // Klammerpaar am Stueck ueberspringen: ein Semikolon in url()
            // oder einem Verlauf beendet keine Deklaration.
            if (start < 0) {
                start = i;
                startZeile = zeile;
            }
            let k = 1;
            i++;
            while (i < code.length && k > 0) {
                if (code[i] === '(') k++;
                else if (code[i] === ')') k--;
                else if (code[i] === '\n') zeile++;
                i++;
            }
            i--;
            continue;
        }
        if (ch === '{') {
            stapel.push(start < 0 ? '' : code.slice(start, i).trim().replace(/\s+/g, ' '));
            start = -1;
            continue;
        }
        if (ch === '}') {
            abgeben(i);
            stapel.pop();
            continue;
        }
        if (ch === ';') {
            abgeben(i);
            continue;
        }
        if (start < 0 && !/\s/.test(ch)) {
            start = i;
            startZeile = zeile;
        }
    }
    return out;
}

/** Die Dateien im Geltungsbereich, nach Name sortiert (deterministisch). */
function dateien(nur) {
    return fs
        .readdirSync(STYLES)
        .filter(f => f.endsWith('.css') && !NICHT_IM_BEREICH.includes(f))
        .filter(f => !nur || f === nur)
        .sort()
        .map(f => ({ name: f, pfad: path.join(STYLES, f) }));
}

/* ===========================================================================
   Die Einordnung — jede Deklaration bekommt genau EINE Lage
   =========================================================================== */

const ERLAUBT = M.erlaubtRegex();

/**
 * Lagen:
 *   'skala'     — steht schon auf einer Sprosse (nichts zu tun)
 *   'inherit'   — legt keine Groesse fest (nichts zu tun)
 *   'geduldet'  — namentlich in AUSNAHMEN, mit Begruendung
 *   'schutz'    — Mitglied einer Chip-/Markenfamilie: VERWEIGERUNG
 *   'ohnezeile' — Zahlenwert ohne Tabellenzeile: Befund, keine Ersetzung
 *   'offen'     — zuordenbar, wird ersetzt
 */
function einordnen(datei, d) {
    const wert = d.wert;
    const schluessel = M.anker(datei, d.selektoren, 'font-size');
    if (M.AUSNAHMEN[schluessel]) return 'geduldet';
    if (ERLAUBT.test(wert)) return 'skala';
    if (M.OHNE_ZAHLENWERT.test(wert)) {
        // ein var() auf einem Token, das NICHT zur Skala gehoert, und das
        // nicht geduldet ist: ein Befund, der benannt werden muss
        return 'ohnezeile';
    }
    if (M.schutzFamilie(d.selektoren) && !M.istSchutzBasis(d.selektoren)) return 'schutz';
    if (!M.ZUORDNUNG[wert]) return 'ohnezeile';
    return 'offen';
}

/** Alle Deklarationen im Geltungsbereich, eingeordnet. */
function erheben(nur) {
    const skala = M.skalaWerte();
    const alle = [];
    for (const f of dateien(nur)) {
        const css = fs.readFileSync(f.pfad, 'utf8');
        for (const d of deklarationen(css, 'font-size')) {
            const lage = einordnen(f.name, d);
            const ziel = M.ZUORDNUNG[d.wert] || null;
            const alt = M.altPx(d.wert);
            const neu = ziel ? skala[ziel] : null;
            alle.push({
                datei: f.name,
                ...d,
                lage,
                ziel,
                alt,
                neu,
                delta: alt !== null && neu !== null ? +(neu - alt).toFixed(2) : null
            });
        }
    }
    return { skala, alle };
}

function zaehlen(alle) {
    const n = l => alle.filter(d => d.lage === l).length;
    return {
        gesamt: alle.length,
        skala: n('skala'),
        inherit: alle.filter(d => d.lage === 'skala' && d.wert === 'inherit').length,
        geduldet: n('geduldet'),
        schutz: n('schutz'),
        ohnezeile: n('ohnezeile'),
        offen: n('offen')
    };
}

/* ===========================================================================
   --check
   =========================================================================== */

function laufCheck(nur) {
    const { alle } = erheben(nur);
    const z = zaehlen(alle);
    const tokens = z.skala - z.inherit;

    console.log('sync-typo-tokens --check   (es wird NICHTS geschrieben)');
    console.log('Geltungsbereich: ' + dateien(nur).length + ' Dateien in assets/styles');
    console.log('  (ohne variables.css und fonts.css — Begruendung im Kopf dieser Datei)');
    console.log('');
    console.log('  font-size-Deklarationen gesamt      : ' + String(z.gesamt).padStart(4));
    console.log('    davon bereits auf einer Sprosse   : ' + String(tokens).padStart(4));
    console.log('    davon inherit (legt nichts fest)  : ' + String(z.inherit).padStart(4));
    console.log('    davon namentlich geduldet         : ' + String(z.geduldet).padStart(4));
    console.log('    davon ohne Tabellenzeile          : ' + String(z.ohnezeile).padStart(4));
    console.log('    davon in geschuetzter Familie     : ' + String(z.schutz).padStart(4));
    console.log('  ----------------------------------------------');
    console.log('  OFFEN (zuordenbar, noch nicht Token): ' + String(z.offen).padStart(4));
    console.log('');

    if (z.ohnezeile) {
        console.log('Zahlenwerte OHNE Tabellenzeile — jeder braucht eine Zeile in');
        console.log('tools/typo-map.js oder eine begruendete Ausnahme:');
        alle.filter(d => d.lage === 'ohnezeile').forEach(d =>
            console.log(
                '  ' + (d.datei + ':' + d.zeile).padEnd(26) + d.wert.padEnd(30) + d.selektoren
            )
        );
        console.log('');
    }
    if (z.schutz) {
        console.log('VERWEIGERUNG: Schriftgroesse in einer Mitgliedsregel der Chip-/');
        console.log('Markenfamilien (Vertrag W4-R-06). Sie muss ENTFERNT werden, nicht');
        console.log('ersetzt — die Basis traegt die Groesse:');
        alle.filter(d => d.lage === 'schutz').forEach(d =>
            console.log(
                '  ' +
                    (d.datei + ':' + d.zeile).padEnd(26) +
                    d.wert.padEnd(12) +
                    '[' +
                    M.schutzFamilie(d.selektoren) +
                    '] ' +
                    d.selektoren
            )
        );
        console.log('');
    }

    if (z.offen === 0 && z.ohnezeile === 0 && z.schutz === 0) {
        console.log('ERGEBNIS: keine offene Stelle. Jede Schriftgroesse kommt aus der Skala.');
        return 0;
    }
    console.log(
        'ERGEBNIS: ' +
            z.offen +
            ' offene Deklaration(en). Umstellen mit `node tools/sync-typo-tokens.js`.'
    );
    return 1;
}

/* ===========================================================================
   --report
   =========================================================================== */

function laufReport(nur, mitKategorien) {
    const { skala, alle } = erheben(nur);
    const z = zaehlen(alle);
    const mitZahl = alle.filter(d => d.delta !== null);
    const gross = mitZahl.filter(d => Math.abs(d.delta) > 2);
    const klein = mitZahl.filter(d => Math.abs(d.delta) <= 2);
    const null0 = klein.filter(d => d.delta === 0);

    console.log('sync-typo-tokens --report   (es wird NICHTS geschrieben)');
    console.log('');
    console.log('DIE SKALA, gelesen aus assets/styles/variables.css:');
    console.log('  ' + M.SKALA_TOKENS.map(t => `${t}=${skala[t]}px`).join('  '));
    console.log('');
    console.log('ZUR RECHNUNG. Die Spalte "alt" ist der deklarierte Wert bei einer');
    console.log('16-px-Wurzel. Das ist eine ANNAHME und keine Messung: gemessen sitzen');
    console.log('nur 723 der 948 em-Elemente auf einem 16-px-Elternwert, bei 225 ist der');
    console.log('sichtbare Wert ein Produkt (bis Faktor 0,574). Diese Tabelle sortiert und');
    console.log('laesst abhaken; was auf dem Bildschirm geschieht, misst');
    console.log('tools/typo-baseline.js im Browser und stellt es in Bildpunkten gegenueber.');
    console.log('');
    console.log('Deklarationen mit Zahlenwert     : ' + mitZahl.length);
    console.log('  davon Sprung > 2 px            : ' + gross.length + '   <- Urteilsstellen');
    console.log('  davon Sprung <= 2 px           : ' + klein.length);
    console.log('    darunter Sprung exakt 0,00 px: ' + null0.length);
    console.log('');
    console.log('=== STELLEN MIT SPRUNG > 2 px ===');
    console.log(
        '  ' +
            'Delta'.padStart(8) +
            '  ' +
            'alt'.padStart(6) +
            ' -> ' +
            'neu'.padEnd(4) +
            ' ' +
            'Token'.padEnd(13) +
            ' ' +
            'Datei:Zeile'.padEnd(26) +
            'Wert'.padEnd(8) +
            'Selektor'
    );
    zeilen(gross).forEach(l => console.log(l));
    console.log('');
    console.log('=== STELLEN MIT SPRUNG <= 2 px (mechanisch) ===');
    const hist = {};
    klein.forEach(d => {
        const k = Math.abs(d.delta).toFixed(2);
        hist[k] = (hist[k] || 0) + 1;
    });
    Object.keys(hist)
        .sort((a, b) => parseFloat(a) - parseFloat(b))
        .forEach(k => console.log('  Delta ' + k.padStart(5) + ' px : ' + hist[k]));
    console.log('');
    zeilen(klein).forEach(l => console.log(l));

    if (mitKategorien) kategorien(alle);

    console.log('');
    console.log(
        'Lage: ' +
            z.offen +
            ' offen, ' +
            (z.skala - z.inherit) +
            ' schon Token, ' +
            z.inherit +
            ' inherit, ' +
            z.geduldet +
            ' geduldet, ' +
            z.ohnezeile +
            ' ohne Zeile, ' +
            z.schutz +
            ' geschuetzt.'
    );
    return 0;
}

function zeilen(menge) {
    return [...menge]
        .sort(
            (a, b) =>
                Math.abs(b.delta) - Math.abs(a.delta) ||
                a.datei.localeCompare(b.datei) ||
                a.zeile - b.zeile
        )
        .map(
            d =>
                '  ' +
                ((d.delta > 0 ? '+' : '') + d.delta.toFixed(2)).padStart(8) +
                '  ' +
                d.alt.toFixed(2).padStart(6) +
                ' -> ' +
                String(d.neu).padEnd(4) +
                ' ' +
                d.ziel.padEnd(13) +
                ' ' +
                (d.datei + ':' + d.zeile).padEnd(26) +
                d.wert.padEnd(8) +
                (d.lage === 'offen' ? '' : '[' + d.lage + '] ') +
                d.selektoren.slice(0, 110) +
                (d.at ? '   @ ' + d.at : '')
        );
}

/**
 * Die Kandidatenmengen der Entscheidungen E-3 und E-4 — ausgezaehlt und mit
 * Fundstellen, aber NICHT geduldet. Geduldet ist, was mit Begruendung in
 * `AUSNAHMEN` steht; diese Auszaehlung ist die Liste, die der urteilende
 * Schritt vor sich haben soll, damit er nicht suchen muss.
 */
function kategorien(alle) {
    const skala = M.skalaWerte();
    const ikon = alle.filter(d => d.lage === 'offen' && M.istIkon(d.selektoren));
    const kleinstVorher = alle.filter(d => d.alt !== null && d.alt < M.KLEINST_GRENZE);
    const kleinstNachher = alle.filter(
        d => d.ziel && skala[d.ziel] < M.KLEINST_GRENZE && d.lage !== 'geduldet'
    );
    const mobil = alle.filter(d => /^var\(\s*--font-size-/.test(d.wert));

    console.log('');
    console.log('=== KANDIDATENMENGE E-3: Ikonen und Avatar-Platzhalter ===');
    console.log('Merkmal ist der NAME, nicht die Zahl (Begruendung an IKON_MUSTER in');
    console.log('tools/typo-map.js). NOCH NICHT geduldet — Zahl: ' + ikon.length);
    const ikonGross = ikon.filter(d => Math.abs(d.delta) > 2);
    console.log('  davon mit Sprung > 2 px: ' + ikonGross.length);
    ikon.forEach(d =>
        console.log(
            '  ' +
                (d.datei + ':' + d.zeile).padEnd(26) +
                d.wert.padEnd(8) +
                (d.delta > 0 ? '+' : '') +
                String(d.delta).padStart(6) +
                'px  ' +
                d.selektoren.slice(0, 100)
        )
    );

    console.log('');
    console.log('=== KANDIDATENMENGE E-4: Stellen unter ' + M.KLEINST_GRENZE + ' px ===');
    console.log('VOR der Umstellung (deklarierter Wert, 16-px-Wurzel): ' + kleinstVorher.length);
    kleinstVorher
        .sort((a, b) => a.alt - b.alt)
        .forEach(d =>
            console.log(
                '  ' +
                    d.alt.toFixed(2).padStart(6) +
                    'px  ' +
                    (d.datei + ':' + d.zeile).padEnd(26) +
                    d.wert.padEnd(8) +
                    (d.lage === 'offen' ? '' : '[' + d.lage + '] ') +
                    d.selektoren.slice(0, 100)
            )
        );
    console.log('NACH der Umstellung unter der Grenze: ' + kleinstNachher.length);
    console.log('  (Die Skala kennt keine Sprosse unter ' + M.KLEINST_GRENZE + ' px. Was');
    console.log('   nachher noch darunter liegt, liegt dort als benannte Ausnahme oder als');
    console.log('   SVG-Praesentationsattribut im JS — letztere sieht dieses Werkzeug nicht,');
    console.log('   sie sind Gegenstand der dritten Schranke von W5-R-05.)');

    console.log('');
    console.log('=== LESER DER MOBILVERGROESSERUNG (E-2: bleibt) ===');
    console.log('Zahl im Geltungsbereich: ' + mobil.length);
    mobil.forEach(d =>
        console.log(
            '  ' +
                (d.datei + ':' + d.zeile).padEnd(26) +
                d.wert.padEnd(30) +
                (M.AUSNAHMEN[M.anker(d.datei, d.selektoren, 'font-size')]
                    ? '[geduldet] '
                    : '[OFFEN] ') +
                d.selektoren
        )
    );
    console.log('  (Die vier weiteren Leser stehen in variables.css selbst und liegen');
    console.log('   damit ausserhalb des Geltungsbereichs — zusammen die 8 Stellen aus E-2.)');

    console.log('');
    console.log('=== GESCHUETZTE FAMILIEN (Welle 4, Vertrag W4-R-06) ===');
    const basen = alle.filter(d => M.istSchutzBasis(d.selektoren));
    console.log(
        'Chip-Mitglieder: ' +
            M.SCHUTZ_CHIP.length +
            ' Klassen, Marken-Mitglieder: ' +
            M.SCHUTZ_MARKE.length +
            ' Klassen, zusammen ' +
            (M.SCHUTZ_CHIP.length + M.SCHUTZ_MARKE.length) +
            '.'
    );
    basen.forEach(d =>
        console.log(
            '  BASIS ' +
                (d.datei + ':' + d.zeile).padEnd(24) +
                d.wert.padEnd(18) +
                '[' +
                M.istSchutzBasis(d.selektoren) +
                '] ' +
                d.selektoren.slice(0, 80) +
                ' ...'
        )
    );
    console.log(
        '  Eigene Schriftgroesse in einer Mitgliedsregel: ' +
            alle.filter(d => d.lage === 'schutz').length +
            ' (Soll: 0)'
    );
    console.log('  Die 53 Chip- und 33 Markenstellen, die der Plan nennt, sind die von');
    console.log('  Welle 4 bereits auf diese zwei Basisregeln gezogenen Deklarationen. Sie');
    console.log('  sind ERLEDIGT, nicht ausgenommen — darum steht hier eine 0 und keine');
    console.log('  Ausnahmeliste. Was bliebe, waere ein Rueckfall, und den verweigert das');
    console.log('  Werkzeug (Exit 2), statt ihn durch ein Token zu verdecken.');
}

/* ===========================================================================
   Schreiben
   =========================================================================== */

function laufSchreiben(nur) {
    const { alle } = erheben(nur);
    const schutz = alle.filter(d => d.lage === 'schutz');
    if (schutz.length) {
        console.error('[FEHLER] sync-typo-tokens verweigert den Dienst.');
        console.error(
            'In ' + schutz.length + ' Mitgliedsregel(n) der Chip-/Markenfamilien steht eine eigene'
        );
        console.error('Schriftgroesse. Der Vertrag W4-R-06 verbietet sie dort: die Basis traegt');
        console.error('die Groesse. Sie muss ENTFERNT werden, nicht ersetzt — eine Ersetzung');
        console.error('saehe wie Fortschritt aus und machte die Welle 4 rot.');
        schutz.forEach(d =>
            console.error(
                '  ' + d.datei + ':' + d.zeile + '  ' + d.selektoren + ' { ' + d.wert + ' }'
            )
        );
        return 2;
    }

    let geaendert = 0;
    const jeDatei = {};
    for (const f of dateien(nur)) {
        const offen = alle.filter(d => d.datei === f.name && d.lage === 'offen');
        if (!offen.length) continue;
        let css = fs.readFileSync(f.pfad, 'utf8');
        // von hinten nach vorn, damit jede Zeichengrenze gueltig bleibt
        for (const d of [...offen].sort((a, b) => b.von - a.von)) {
            css = css.slice(0, d.von) + `var(${d.ziel})` + css.slice(d.bis);
        }
        fs.writeFileSync(f.pfad, css, 'utf8');
        jeDatei[f.name] = offen.length;
        geaendert += offen.length;
    }

    console.log('sync-typo-tokens: ' + geaendert + ' Deklaration(en) umgestellt.');
    Object.keys(jeDatei)
        .sort()
        .forEach(n => console.log('  ' + n.padEnd(24) + String(jeDatei[n]).padStart(4)));
    const rest = alle.filter(d => d.lage === 'ohnezeile');
    if (rest.length) {
        console.log('');
        console.log('OHNE Tabellenzeile liegen geblieben: ' + rest.length + ' (siehe --check).');
    }
    console.log('');
    console.log('Jetzt neu bauen (PYTHONIOENCODING=utf-8 python build.py) und');
    console.log('`npx jest tests/unit/design-consistency.test.js` fahren.');
    return 0;
}

/* ===========================================================================
   Einstieg
   =========================================================================== */

function main(argv) {
    const nurArg = argv.find(a => a.startsWith('--only='));
    const nur = nurArg ? nurArg.slice('--only='.length) : null;
    if (nur && !fs.existsSync(path.join(STYLES, nur))) {
        console.error(`[FEHLER] --only=${nur}: assets/styles/${nur} existiert nicht.`);
        return 2;
    }
    if (nur && NICHT_IM_BEREICH.includes(nur)) {
        console.error(
            `[FEHLER] --only=${nur}: diese Datei liegt ausserhalb des Geltungsbereichs ` +
                `(Begruendung im Kopf dieser Datei).`
        );
        return 2;
    }
    if (argv.includes('--check')) return laufCheck(nur);
    if (argv.includes('--report')) return laufReport(nur, argv.includes('--kategorien'));
    return laufSchreiben(nur);
}

if (require.main === module) {
    process.exit(main(process.argv.slice(2)));
}

module.exports = { deklarationen, erheben, zaehlen, dateien, main };
