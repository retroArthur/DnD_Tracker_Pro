'use strict';

/**
 * pruefe-schriftdateien — Messwerkzeug fuer die gebuendelten woff2 (SCHR)
 *
 * Beantwortet zwei Fragen, die beide kein Netzwerk-Log und kein
 * Konsolenfehler beantwortet:
 *
 *  1. Traegt jede in `assets/styles/fonts.css` eingebundene Schriftdatei
 *     ueberhaupt die Zeichen, die diese deutsche App darstellen muss? Eine
 *     woff2 ohne lateinische Glyphen laedt ohne 404, der Browser findet
 *     darin kein `A` und faellt zeichenweise auf den Rueckfall (`Arial`)
 *     zurueck. Nur ein Blick in die cmap zeigt das.
 *  2. Kann jede Datei das Gewicht halten, das fonts.css fuer sie erklaert?
 *     `font-weight: 100 900` auf einer Datei ohne `wght`-Achse laesst den
 *     Browser Fettschrift synthetisch nachtaeuschen — wieder ohne Fehler,
 *     ohne 404 und ohne fehlende Glyphe. Nur ein Blick in die fvar-Tabelle
 *     zeigt das.
 *
 * Formvorbild: `tools/css-usage-report.js` (strikter Modus, nur
 * Node-Standardmodule, benannte Pfadkonstanten, alle Kernfunktionen einzeln
 * exportiert, Direktaufruf-Zweig am Ende, `--check` fuer den Exit-Code).
 *
 * KEINE EIGENE DATEILISTE. Die Liste der geprueften Dateien wird aus den
 * `src: url(...)`-Angaben in fonts.css gelesen, nie als Literal gefuehrt.
 * Grund: ein Waechter, der seine eigene Liste mitbringt, uebersieht die
 * elfte Datei. Genau diese Schwaeche stand in der Mobil-Runde ("Kein
 * Waechter nimmt eine 25. Ansicht automatisch auf; die Reiterliste steht als
 * Literal in der Probe").
 *
 * Kein fontTools, kein Python-`brotli` im Baum — Node bringt
 * `zlib.brotliDecompressSync` mit, das genuegt fuer woff2.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const REPO_ROOT = path.resolve(__dirname, '..');
const FONTS_CSS = path.join(REPO_ROOT, 'assets/styles/fonts.css');
const SERVICE_WORKER = path.join(REPO_ROOT, 'sw.js');

// ----------------------------------------------------------------------
// Der deutsche Zeichensatz — EINMAL definiert, benannt, begruendet.
//
// Zusammensetzung und Begruendung je Gruppe:
//   1. A-Z, a-z, 0-9 — ohne Alphabet und Ziffern stellt die App nichts dar.
//      Das ist der Kern der Probe; alles andere ist Zugabe.
//   2. Leerzeichen und die Satz-/Rechenzeichen der deutschen Tastatur. Sie
//      stehen in jedem Formular, jeder Wuerfelformel ("2d6+3") und jedem
//      Statblock.
//   3. AEOEUE/aeoeue/ss (U+00C4 U+00D6 U+00DC U+00E4 U+00F6 U+00FC U+00DF) —
//      die Umlaute und das Eszett. Die Oberflaeche ist durchgaengig deutsch;
//      im Quellbaum gemessen: 'ss' 358 Treffer, 'AE' 58.
//   4. Die Typografie, die der Quellbaum wirklich fuehrt (gemessen mit
//      `grep -ro` ueber core/ utils/ systems/ features/ ui/ render/ assets/):
//      U+201E 17 Treffer, U+201C 7, U+2013 19, U+2014 1792, U+2026 32.
//   5. U+20AC (Euro) als Waehrungszeichen-Waechter. ACHTUNG, abweichend von
//      den uebrigen: im Quellbaum **0 Treffer** gemessen — die App rechnet in
//      Gold, nicht in Euro. Das Zeichen bleibt trotzdem in der Probe, weil es
//      Teil von Googles `latin`-Subset ist (U+20AC steht dort ausdruecklich
//      drin) und sein Fehlen daher ein zuverlaessiges Kennzeichen eines
//      falsch geholten Subsets ist, nicht einer legitim schmalen Schrift.
//
// Bewusst NICHT enthalten: U+2212 (echtes Minus, im Baum 12 Treffer, davon 1
// in den Templates). Es ist der kosmetische Ersatz fuer '-', das in Gruppe 2
// bereits geprueft wird; seine Aufnahme wuerde das heutige Urteil nicht
// aendern und nur die Gefahr eines Fehlalarms bei einer legitim schmalen
// Ersatzschrift erhoehen.
// ----------------------------------------------------------------------
const DEUTSCHER_ZEICHENSATZ = Object.freeze([
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    ...'abcdefghijklmnopqrstuvwxyz',
    ...'0123456789',
    ...' .,;:!?()[]{}+-*/=<>%&#"\'',
    ...'ÄÖÜäöüß',
    ...'„“–—…',
    '€'
]);

const DEUTSCHE_CODEPUNKTE = Object.freeze(DEUTSCHER_ZEICHENSATZ.map(c => c.codePointAt(0)));

// ----------------------------------------------------------------------
// Unicode-Bloecke fuer die Diagnoseausgabe. Sie dienen NICHT dem Urteil
// (das faellt allein ueber DEUTSCHE_CODEPUNKTE), sondern beantworten die
// Anschlussfrage "wenn kein Latein drin ist — was dann?". Genau diese
// Blockzahlen nagelt die Ratsche fest, damit ein kaputter Parser (der
// ueberall Null meldet) auffaellt statt gruen durchzulaufen.
// ----------------------------------------------------------------------
const UNICODE_BLOECKE = Object.freeze([
    ['Basic Latin', 0x20, 0x7e],
    ['Latin-1 Supplement', 0xa0, 0xff],
    ['Latin Extended-A', 0x100, 0x17f],
    ['Latin Extended-B', 0x180, 0x24f],
    ['IPA/Modifier', 0x250, 0x2ff],
    ['Greek', 0x370, 0x3ff],
    ['Cyrillic', 0x400, 0x4ff],
    ['Armenian', 0x530, 0x58f],
    ['Hebrew', 0x590, 0x5ff],
    ['Arabic', 0x600, 0x6ff],
    ['Devanagari', 0x900, 0x97f],
    ['Bengali', 0x980, 0x9ff],
    ['Thai', 0xe00, 0xe7f],
    ['Latin Extended Additional', 0x1e00, 0x1eff],
    ['Punctuation', 0x2000, 0x206f],
    ['Superscripts', 0x2070, 0x209f],
    ['Currency', 0x20a0, 0x20bf],
    ['Letterlike/Arrows', 0x2100, 0x21ff],
    ['Math Operators', 0x2200, 0x22ff],
    ['Symbols', 0x2300, 0x27bf]
]);

// ----------------------------------------------------------------------
// woff2-Tabellen-Tags nach Index (WOFF2 § 5.2, "Known Table Tags"). Die
// Reihenfolge ist normativ; Index 63 bedeutet "eigener 4-Byte-Tag folgt".
// ----------------------------------------------------------------------
const BEKANNTE_TAGS = Object.freeze([
    'cmap',
    'head',
    'hhea',
    'hmtx',
    'maxp',
    'name',
    'OS/2',
    'post',
    'cvt ',
    'fpgm',
    'glyf',
    'loca',
    'prep',
    'CFF ',
    'VORG',
    'EBDT',
    'EBLC',
    'gasp',
    'hdmx',
    'kern',
    'LTSH',
    'PCLT',
    'VDMX',
    'vhea',
    'vmtx',
    'BASE',
    'GDEF',
    'GPOS',
    'GSUB',
    'EBSC',
    'JSTF',
    'MATH',
    'CBDT',
    'CBLC',
    'COLR',
    'CPAL',
    'SVG ',
    'sbix',
    'acnt',
    'avar',
    'bdat',
    'bloc',
    'bsln',
    'cvar',
    'fdsc',
    'feat',
    'fmtx',
    'fvar',
    'gvar',
    'hsty',
    'just',
    'lcar',
    'mort',
    'morx',
    'opbd',
    'prop',
    'trak',
    'Zapf',
    'Silf',
    'Glat',
    'Gloc',
    'Feat',
    'Sill'
]);

const WOFF2_SIGNATUR = 'wOF2';
const TTC_FLAVOR = 'ttcf';
const EIGENER_TAG_INDEX = 63;
const WOFF2_KOPF_LAENGE = 48;

// ----------------------------------------------------------------------
// fonts.css lesen — jede src: url(...) wird zu einem Pruefauftrag.
// ----------------------------------------------------------------------

/**
 * Entfernt /* ... *\/-Kommentare, damit eine auskommentierte @font-face-Regel
 * nicht als lebende Einbindung gezaehlt wird.
 * @param {string} css
 * @returns {string}
 */
function ohneKommentare(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Liest alle Schrift-Einbindungen aus fonts.css.
 * @param {string} [cssPfad=FONTS_CSS]
 * @returns {Array<{url: string, datei: string, vorhanden: boolean}>}
 */
function leseSchriftQuellen(cssPfad = FONTS_CSS) {
    const css = ohneKommentare(fs.readFileSync(cssPfad, 'utf8'));
    const cssVerzeichnis = path.dirname(cssPfad);
    const quellen = [];
    const gesehen = new Set();

    // src: kann mehrere durch Komma getrennte url()/local() fuehren — darum
    // wird jede url() im src-Wert geerntet, nicht nur die erste.
    const srcRegex = /src\s*:\s*([^;}]+)/gi;
    let srcTreffer;
    while ((srcTreffer = srcRegex.exec(css)) !== null) {
        const urlRegex = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
        let urlTreffer;
        while ((urlTreffer = urlRegex.exec(srcTreffer[1])) !== null) {
            const url = urlTreffer[2].trim();
            if (gesehen.has(url)) continue;
            gesehen.add(url);
            const datei = path.resolve(cssVerzeichnis, url);
            quellen.push({ url, datei, vorhanden: fs.existsSync(datei) });
        }
    }
    return quellen;
}

// ----------------------------------------------------------------------
// `font-weight` einer @font-face-Regel ist entweder ein Einzelgewicht oder
// ein BEREICH aus zwei Zahlen (CSS Fonts 4, `font-weight: 100 900`). Der
// Bereich ist eine Zusicherung UEBER DEN DATEIINHALT: nur eine variable
// Schrift mit `wght`-Achse kann ihn einhalten. Darum wird er hier gelesen,
// nicht nur die url().
//
// Die Schluesselwoerter sind erlaubt und normativ festgelegt; `normal` und
// `bold` sind die einzigen, die in einer @font-face-Regel vorkommen duerfen
// (`bolder`/`lighter` sind dort ungueltig, weil sie relativ sind).
// ----------------------------------------------------------------------
const GEWICHT_WORTE = Object.freeze({ normal: 400, bold: 700 });

/**
 * Loest eine `font-weight`-Angabe in [von, bis] auf.
 *
 * Fehlt die Angabe, gilt die CSS-Vorgabe `normal` (400) — das ist ein
 * gueltiges Einzelgewicht, kein Fehler. Eine Angabe, die der Leser NICHT
 * versteht, ergibt bewusst NaN und nicht etwa 400: sie wuerde sonst still
 * als "kein Bereich" gelten und die Achsenpruefung umgehen.
 * @param {string|null|undefined} roh
 * @returns {[number, number]}
 */
function leseGewichtsbereich(roh) {
    if (roh === null || roh === undefined || roh.trim() === '') return [400, 400];
    const teile = roh
        .trim()
        .split(/\s+/)
        .map(t => {
            const wort = GEWICHT_WORTE[t.toLowerCase()];
            if (wort !== undefined) return wort;
            return t !== '' && Number.isFinite(Number(t)) ? Number(t) : NaN;
        });
    if (teile.length === 1) return [teile[0], teile[0]];
    return [teile[0], teile[teile.length - 1]];
}

/**
 * Liest die @font-face-Bloecke aus fonts.css — Familie, Gewichtsangabe und
 * Dateien je Block.
 *
 * Gegenueber `leseSchriftQuellen()` (das nur url()s erntet, dedupliziert
 * und ueber Blockgrenzen hinweg) behaelt dies die ZUORDNUNG: welche
 * CSS-Angabe steht auf welcher Datei. Nur so ist pruefbar, ob ein
 * `font-weight: 100 900` auf einer Datei steht, die das auch kann.
 *
 * KEINE EIGENE DATEILISTE, wie im Kopf dieser Datei begruendet: die Namen
 * stammen aus den url()-Angaben, nicht aus einem Literal.
 * @param {string} [cssPfad=FONTS_CSS]
 * @returns {Array<{familie: string|null, gewichtRoh: string|null, gewichtVon: number,
 *   gewichtBis: number, istBereich: boolean, urls: string[], dateien: string[],
 *   dateinamen: string[]}>}
 */
function leseSchriftFaces(cssPfad = FONTS_CSS) {
    const css = ohneKommentare(fs.readFileSync(cssPfad, 'utf8'));
    const cssVerzeichnis = path.dirname(cssPfad);
    const faces = [];

    const blockRegex = /@font-face\s*\{([^}]*)\}/gi;
    let block;
    while ((block = blockRegex.exec(css)) !== null) {
        const inhalt = block[1];
        const familie = (inhalt.match(/font-family\s*:\s*(['"]?)([^;'"]+)\1/i) || [])[2];
        const gewichtRoh = (inhalt.match(/font-weight\s*:\s*([^;]+)/i) || [])[1];
        const [von, bis] = leseGewichtsbereich(gewichtRoh);

        const urls = [];
        const urlRegex = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
        let urlTreffer;
        while ((urlTreffer = urlRegex.exec(inhalt)) !== null) urls.push(urlTreffer[2].trim());

        faces.push({
            familie: familie ? familie.trim() : null,
            gewichtRoh: gewichtRoh ? gewichtRoh.trim() : null,
            gewichtVon: von,
            gewichtBis: bis,
            istBereich: von !== bis,
            urls,
            dateien: urls.map(u => path.resolve(cssVerzeichnis, u)),
            dateinamen: urls.map(u => path.basename(u))
        });
    }
    return faces;
}

/**
 * Liest die im Service Worker vorgecachten Schriftpfade (Drift-Waechter).
 * @param {string} [swPfad=SERVICE_WORKER]
 * @returns {string[]} Dateinamen ohne Pfad, z. B. '<familie>-<gewicht>.woff2'
 */
function leseServiceWorkerSchriften(swPfad = SERVICE_WORKER) {
    const quelle = fs.readFileSync(swPfad, 'utf8');
    const treffer = quelle.match(/['"][^'"]*\/fonts\/[^'"]+\.woff2['"]/gi) || [];
    return treffer.map(t => t.slice(1, -1).split('/').pop());
}

/**
 * Liest die woff2 im Verzeichnis — das ANDERE Ende der Zusicherung (B-07).
 *
 * WARUM DAS NOETIG IST. Diese Datei liest ihre Dateiliste aus fonts.css, der
 * Kopierschritt in build.py aus dem Verzeichnis ("Keine Dateiliste",
 * ausdruecklich so gewollt, weil eine eigene Liste die elfte Datei
 * uebersieht). Beide Enden waren dadurch verschieden: eine woff2, die im
 * Verzeichnis liegt und keine @font-face-Regel hat, wurde von niemandem
 * geprueft und von build.py veroeffentlicht. Gemessen: eine Kopie als
 * 'elfte-400.woff2' liess 60 von 60 Jest-Faellen gruen und wurde als
 * elfte Datei nach dist/assets/fonts/ kopiert.
 *
 * DIE VERZEICHNISSE KOMMEN AUS DEN url()-PFADEN, nicht aus einem Literal:
 * damit bleibt Teil 6 der Ratsche gueltig ("die Dateiliste stammt aus
 * fonts.css, nicht aus einem Literal") und ein verschobenes
 * Schriftverzeichnis wird mitgezogen, statt diese Pruefung leerlaufen zu
 * lassen.
 *
 * @param {Array<{datei: string}>} quellen Ergebnis von leseSchriftQuellen().
 * @returns {{verzeichnisse: string[], namen: string[]}}
 */
function leseVerzeichnisSchriften(quellen) {
    const verzeichnisse = [...new Set(quellen.map(q => path.dirname(q.datei)))].sort();
    const namen = [];
    for (const verzeichnis of verzeichnisse) {
        if (!fs.existsSync(verzeichnis)) continue;
        for (const name of fs.readdirSync(verzeichnis)) {
            if (/\.woff2$/i.test(name) && fs.statSync(path.join(verzeichnis, name)).isFile()) {
                namen.push(name);
            }
        }
    }
    return { verzeichnisse, namen: namen.sort() };
}

// ----------------------------------------------------------------------
// woff2-Parser
// ----------------------------------------------------------------------

/**
 * Liest eine UIntBase128-Zahl (WOFF2 § 4.1).
 *
 * Rechnet absichtlich mit `* 128` statt `<< 7`: JS-Bitoperationen sind
 * 32-Bit-vorzeichenbehaftet, und eine fuenfbytige Zahl belegt 35 Bit —
 * `<<` kippt dort ins Negative. Der Prototyp dieses Parsers hatte genau
 * diesen Fehler.
 *
 * Prueft zusaetzlich die beiden normativen Verbote: keine fuehrende Null
 * (erstes Byte darf nicht 0x80 sein) und hoechstens fuenf Bytes.
 * @param {Buffer} buf
 * @param {{p: number}} pos
 * @returns {number}
 */
function leseUIntBase128(buf, pos) {
    let wert = 0;
    for (let i = 0; i < 5; i++) {
        if (pos.p >= buf.length) throw new Error('UIntBase128 laeuft ueber das Dateiende');
        const b = buf[pos.p++];
        if (i === 0 && b === 0x80) throw new Error('UIntBase128 mit fuehrender Null');
        wert = wert * 128 + (b & 0x7f);
        if ((b & 0x80) === 0) {
            if (wert > 0xffffffff) throw new Error('UIntBase128 groesser als UInt32');
            return wert;
        }
    }
    throw new Error('UIntBase128 laenger als 5 Byte');
}

/**
 * Oeffnet eine woff2-Datei: Kopf pruefen, Tabellenverzeichnis lesen,
 * Brotli-Block entpacken, Tabellengrenzen bestimmen.
 *
 * Zwei Format-Annahmen, beide am Bestand belegt (siehe Bericht):
 *  - Transformiert ist eine Tabelle bei `glyf`/`loca`, wenn die
 *    Transform-Version != 3 ist, bei allen anderen Tabellen, wenn sie != 0
 *    ist (WOFF2 § 4.1: Version 0 ist der Null-Transform ausser bei
 *    glyf/loca). Nur dann steht ein `transformLength`-Feld im Verzeichnis.
 *  - Die Tabellen liegen im entpackten Strom ohne Polsterung in
 *    Verzeichnisreihenfolge hintereinander (WOFF2 § 4.2). Belegt: fuer alle
 *    zehn Dateien ist die Summe der Verzeichnislaengen exakt die Laenge des
 *    entpackten Stroms (geprueft von `pruefeDatei` ueber `laengenStimmen`).
 * @param {Buffer} buf
 * @returns {{numTables: number, verzeichnis: Array, tabellen: Object, font: Buffer, laengenStimmen: boolean}}
 */
function parseWoff2(buf) {
    if (buf.length < WOFF2_KOPF_LAENGE) throw new Error('Datei kuerzer als der woff2-Kopf');
    if (buf.toString('latin1', 0, 4) !== WOFF2_SIGNATUR) {
        throw new Error(
            `keine woff2-Signatur (gelesen: ${JSON.stringify(buf.toString('latin1', 0, 4))})`
        );
    }
    if (buf.toString('latin1', 4, 8) === TTC_FLAVOR) {
        // Nach dem Tabellenverzeichnis folgt dann eine CollectionDirectory;
        // der Parser unten wuerde den Brotli-Block an der falschen Stelle
        // suchen. Lieber ein klarer Fehler als eine stille Fehlmessung.
        throw new Error('woff2-Collection (ttcf) wird nicht unterstuetzt');
    }
    const angegebeneLaenge = buf.readUInt32BE(8);
    if (angegebeneLaenge !== buf.length) {
        throw new Error(`Kopf meldet ${angegebeneLaenge} Byte, Datei hat ${buf.length}`);
    }

    const numTables = buf.readUInt16BE(12);
    if (numTables === 0) throw new Error('numTables ist 0');
    const totalCompressed = buf.readUInt32BE(20);

    const pos = { p: WOFF2_KOPF_LAENGE };
    const verzeichnis = [];
    for (let i = 0; i < numTables; i++) {
        if (pos.p >= buf.length) throw new Error('Tabellenverzeichnis laeuft ueber das Dateiende');
        const flags = buf[pos.p++];
        const index = flags & 0x3f;
        let tag;
        if (index === EIGENER_TAG_INDEX) {
            tag = buf.toString('latin1', pos.p, pos.p + 4);
            pos.p += 4;
        } else {
            tag = BEKANNTE_TAGS[index];
            if (tag === undefined) throw new Error(`unbekannter Tabellen-Index ${index}`);
        }
        const origLength = leseUIntBase128(buf, pos);
        const transformVersion = (flags >> 6) & 0x03;
        const transformiert =
            tag === 'glyf' || tag === 'loca' ? transformVersion !== 3 : transformVersion !== 0;
        const transformLength = transformiert ? leseUIntBase128(buf, pos) : null;
        verzeichnis.push({ tag, origLength, transformLength, transformVersion });
    }

    const brotliStart = pos.p;
    if (brotliStart + totalCompressed > buf.length) {
        throw new Error('komprimierter Block reicht ueber das Dateiende');
    }
    const font = zlib.brotliDecompressSync(buf.slice(brotliStart, brotliStart + totalCompressed));

    let offset = 0;
    const tabellen = {};
    for (const t of verzeichnis) {
        const laenge = t.transformLength !== null ? t.transformLength : t.origLength;
        tabellen[t.tag] = { offset, laenge };
        offset += laenge;
    }

    return { numTables, verzeichnis, tabellen, font, laengenStimmen: offset === font.length };
}

// ----------------------------------------------------------------------
// cmap
// ----------------------------------------------------------------------

/**
 * Loest eine cmap-Untertabelle in Codepunkte auf, die auf eine ECHTE Glyphe
 * zeigen (Glyph-ID != 0).
 *
 * Die Glyph-ID-Aufloesung ist kein Zierrat: eine Format-4-Gruppe darf ihren
 * ganzen Bereich per `idDelta`/`idRangeOffset` auf Glyphe 0 (.notdef)
 * abbilden. Wer nur die Bereichsgrenzen `startCode`/`endCode` liest, zaehlt
 * solche Codepunkte als abgedeckt und meldet eine Schrift als vollstaendig,
 * die das Zeichen in Wahrheit nicht hat. Der Prototyp dieses Parsers hatte
 * genau diese Schwaeche. (Nebeneffekt: die normative Schlussgruppe
 * 0xFFFF->0xFFFF faellt von selbst heraus, weil sie auf Glyphe 0 zeigt.)
 * @param {Buffer} font
 * @param {number} sub Offset der Untertabelle
 * @returns {{format: number, codepunkte: number[], unterstuetzt: boolean}}
 */
function leseCmapUntertabelle(font, sub) {
    const format = font.readUInt16BE(sub);
    const codepunkte = [];

    if (format === 0) {
        for (let c = 0; c < 256; c++) {
            if (sub + 6 + c >= font.length) break;
            if (font[sub + 6 + c] !== 0) codepunkte.push(c);
        }
        return { format, codepunkte, unterstuetzt: true };
    }

    if (format === 4) {
        const segX2 = font.readUInt16BE(sub + 6);
        const segmente = segX2 / 2;
        const endeOffset = sub + 14;
        const startOffset = endeOffset + segX2 + 2;
        const deltaOffset = startOffset + segX2;
        const rangeOffset = deltaOffset + segX2;
        for (let s = 0; s < segmente; s++) {
            if (rangeOffset + s * 2 + 1 >= font.length) break;
            const ende = font.readUInt16BE(endeOffset + s * 2);
            const start = font.readUInt16BE(startOffset + s * 2);
            const delta = font.readInt16BE(deltaOffset + s * 2);
            const ro = font.readUInt16BE(rangeOffset + s * 2);
            for (let c = start; c <= ende && c <= 0xffff; c++) {
                let gid;
                if (ro === 0) {
                    gid = (c + delta) & 0xffff;
                } else {
                    const gi = rangeOffset + s * 2 + ro + (c - start) * 2;
                    if (gi + 1 >= font.length) continue;
                    gid = font.readUInt16BE(gi);
                    if (gid !== 0) gid = (gid + delta) & 0xffff;
                }
                if (gid !== 0) codepunkte.push(c);
            }
        }
        return { format, codepunkte, unterstuetzt: true };
    }

    if (format === 6) {
        const ersterCode = font.readUInt16BE(sub + 6);
        const anzahl = font.readUInt16BE(sub + 8);
        for (let i = 0; i < anzahl; i++) {
            const gi = sub + 10 + i * 2;
            if (gi + 1 >= font.length) break;
            if (font.readUInt16BE(gi) !== 0) codepunkte.push(ersterCode + i);
        }
        return { format, codepunkte, unterstuetzt: true };
    }

    if (format === 12) {
        const gruppen = font.readUInt32BE(sub + 12);
        for (let g = 0; g < gruppen; g++) {
            const go = sub + 16 + g * 12;
            if (go + 11 >= font.length) break;
            const start = font.readUInt32BE(go);
            const ende = font.readUInt32BE(go + 4);
            const startGid = font.readUInt32BE(go + 8);
            for (let c = start; c <= ende && c <= 0x10ffff; c++) {
                if (startGid + (c - start) !== 0) codepunkte.push(c);
            }
        }
        return { format, codepunkte, unterstuetzt: true };
    }

    // Nicht stillschweigend als "leer" durchlassen — ein leeres Ergebnis
    // waere von "Schrift traegt nichts" nicht zu unterscheiden.
    return { format, codepunkte: [], unterstuetzt: false };
}

/**
 * Vereinigt ALLE Unicode-faehigen Untertabellen der cmap.
 *
 * Bewusst eine Vereinigung statt einer Auswahl "der besten" Untertabelle:
 * verteilt eine Schrift ihre Abdeckung auf eine Format-4-BMP- und eine
 * Format-12-Volltabelle, verliert jede Auswahl einen Teil davon.
 * @param {Buffer} font
 * @param {number} offset Offset der cmap-Tabelle
 * @returns {{codepunkte: Set<number>, formate: number[], nichtUnterstuetzt: number[], untertabellen: number}}
 */
function leseCmap(font, offset) {
    const anzahl = font.readUInt16BE(offset + 2);
    const codepunkte = new Set();
    const formate = new Set();
    const nichtUnterstuetzt = new Set();
    let untertabellen = 0;

    for (let i = 0; i < anzahl; i++) {
        const rec = offset + 4 + i * 8;
        if (rec + 7 >= font.length) break;
        const platform = font.readUInt16BE(rec);
        const encoding = font.readUInt16BE(rec + 2);
        const sub = offset + font.readUInt32BE(rec + 4);
        if (sub + 1 >= font.length) continue;

        // Unicode-faehig: Plattform 0 (Unicode) ganz, Plattform 3 (Windows)
        // in den Unicode-Kodierungen 1 (BMP) und 10 (voll).
        const unicodeFaehig =
            platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
        if (!unicodeFaehig) continue;

        untertabellen++;
        const ergebnis = leseCmapUntertabelle(font, sub);
        formate.add(ergebnis.format);
        if (!ergebnis.unterstuetzt) nichtUnterstuetzt.add(ergebnis.format);
        for (const c of ergebnis.codepunkte) codepunkte.add(c);
    }

    return {
        codepunkte,
        formate: [...formate].sort((a, b) => a - b),
        nichtUnterstuetzt: [...nichtUnterstuetzt].sort((a, b) => a - b),
        untertabellen
    };
}

// ----------------------------------------------------------------------
// fvar — die Variationsachsen einer variablen Schrift.
//
// WARUM DAS HIER STEHT. fonts.css erklaert fuer Roboto und Inter
// `font-weight: 100 900`. Das ist eine Zusicherung ueber den DATEIINHALT:
// nur eine Datei mit `wght`-Achse liefert dort echte Schnitte. Steht der
// Bereich auf einer statischen Datei, taeuscht der Browser Fettschrift
// synthetisch nach — ohne 404, ohne Konsolenfehler, ohne fehlende Glyphe.
// Dieselbe unsichtbare Fehlerklasse wie das falsche cmap-Subset, nur eine
// Ebene tiefer, und nur an der fvar-Tabelle zu sehen.
// ----------------------------------------------------------------------
const FVAR_KOPF_LAENGE = 16;
const FVAR_ACHSENSATZ_LAENGE = 20;

/**
 * Liest ein 16.16-Festkommawort (OpenType `Fixed`).
 *
 * Bewusst `readInt32BE` / 65536 und keine Bitschieberei: der Wert ist
 * vorzeichenbehaftet (Achsen wie `slnt` haben negative Minima).
 * @param {Buffer} buf
 * @param {number} offset
 * @returns {number}
 */
function leseFixed1616(buf, offset) {
    return buf.readInt32BE(offset) / 65536;
}

/**
 * Liest die Variationsachsen aus der fvar-Tabelle.
 *
 * Wirft bei allem, was nicht sicher zu lesen ist, statt eine leere
 * Achsenliste zu liefern — eine leere Liste waere von einer echten
 * statischen Schrift nicht zu unterscheiden (dasselbe Argument wie bei
 * `leseCmapUntertabelle`, die unbekannte Formate nicht als "leer"
 * durchlaesst).
 * @param {Buffer} font Entpackter Schriftstrom
 * @param {number} offset Offset der fvar-Tabelle
 * @param {number} [laenge] Laenge der fvar-Tabelle, fuer die Grenzpruefung
 * @returns {{major: number, minor: number, achsen: Array<{tag: string, min: number,
 *   standard: number, max: number}>, instanzen: number}}
 */
function leseFvar(font, offset, laenge) {
    const ende = laenge === undefined ? font.length : Math.min(offset + laenge, font.length);
    if (offset + FVAR_KOPF_LAENGE > ende) {
        throw new Error('fvar-Kopf reicht ueber das Tabellenende');
    }

    const major = font.readUInt16BE(offset);
    const minor = font.readUInt16BE(offset + 2);
    if (major !== 1) throw new Error(`fvar-Version ${major}.${minor} wird nicht unterstuetzt`);

    const achsenOffset = font.readUInt16BE(offset + 4);
    const achsenZahl = font.readUInt16BE(offset + 8);
    const achsenGroesse = font.readUInt16BE(offset + 10);
    const instanzen = font.readUInt16BE(offset + 12);

    // Die Satzgroesse ist normativ mindestens 20; ein kuenftiges Format darf
    // sie VERGROESSERN, darum wird mit `achsenGroesse` geschritten und nicht
    // mit der Konstanten. Kleiner als 20 heisst: nicht lesbar.
    if (achsenGroesse < FVAR_ACHSENSATZ_LAENGE) {
        throw new Error(`fvar-Achsensatz ist ${achsenGroesse} Byte, erwartet mindestens 20`);
    }

    const achsen = [];
    for (let i = 0; i < achsenZahl; i++) {
        const a = offset + achsenOffset + i * achsenGroesse;
        if (a + FVAR_ACHSENSATZ_LAENGE > ende) {
            throw new Error(`fvar-Achsensatz ${i} reicht ueber das Tabellenende`);
        }
        achsen.push({
            tag: font.toString('latin1', a, a + 4),
            min: leseFixed1616(font, a + 4),
            standard: leseFixed1616(font, a + 8),
            max: leseFixed1616(font, a + 12)
        });
    }

    return { major, minor, achsen, instanzen };
}

// ----------------------------------------------------------------------
// Pruefung
// ----------------------------------------------------------------------

/**
 * Zaehlt die belegten Codepunkte je Unicode-Block.
 * @param {Set<number>} codepunkte
 * @returns {Array<{name: string, anzahl: number}>}
 */
function zaehleBloecke(codepunkte) {
    const ergebnis = [];
    for (const [name, von, bis] of UNICODE_BLOECKE) {
        let anzahl = 0;
        for (const c of codepunkte) {
            if (c >= von && c <= bis) anzahl++;
        }
        if (anzahl > 0) ergebnis.push({ name, anzahl });
    }
    return ergebnis;
}

/**
 * Prueft eine einzelne Schriftdatei.
 * @param {{url: string, datei: string, vorhanden: boolean}} quelle
 * @returns {object}
 */
function pruefeDatei(quelle) {
    const name = path.basename(quelle.datei);
    const basis = { name, url: quelle.url, datei: quelle.datei, vorhanden: quelle.vorhanden };

    if (!quelle.vorhanden) {
        return { ...basis, fehler: 'Datei fehlt', traegtDeutsch: false };
    }

    let woff2;
    try {
        woff2 = parseWoff2(fs.readFileSync(quelle.datei));
    } catch (e) {
        return { ...basis, fehler: `woff2 unlesbar: ${e.message}`, traegtDeutsch: false };
    }

    const cmapTabelle = woff2.tabellen['cmap'];
    if (!cmapTabelle) {
        return { ...basis, fehler: 'keine cmap-Tabelle', traegtDeutsch: false, woff2 };
    }

    const cmap = leseCmap(woff2.font, cmapTabelle.offset);
    const fehlend = DEUTSCHE_CODEPUNKTE.filter(c => !cmap.codepunkte.has(c));

    // Die Achsen stehen bewusst NICHT unter `fehler`: eine Datei ohne
    // fvar-Tabelle ist voellig in Ordnung (statische Schrift), und eine
    // unlesbare fvar-Tabelle ist ein eigener Befund, der die cmap-Aussage
    // nicht entwertet. `achsenFehler` trennt beide Faelle — ohne diese
    // Trennung waere "unlesbar" von "statisch" nicht zu unterscheiden.
    const fvarTabelle = woff2.tabellen['fvar'];
    let achsen = [];
    let achsenFehler = null;
    if (fvarTabelle) {
        try {
            achsen = leseFvar(woff2.font, fvarTabelle.offset, fvarTabelle.laenge).achsen;
        } catch (e) {
            achsenFehler = `fvar unlesbar: ${e.message}`;
        }
    }

    return {
        ...basis,
        fehler: null,
        numTables: woff2.numTables,
        laengenStimmen: woff2.laengenStimmen,
        hatFvar: Boolean(fvarTabelle),
        achsen,
        achsenFehler,
        glyphen: cmap.codepunkte.size,
        // Die GELESENEN Codepunkte, aufsteigend. Nicht Deko, sondern die
        // Grundlage, aus der ein Aufrufer `fehlend` nachrechnen kann: ohne sie
        // war das Urteil dieser Funktion von aussen nicht pruefbar, und eine
        // auf "traegt nichts" festgenagelte Fehlliste blieb in der
        // Jest-Ratsche unsichtbar (alle 60 Faelle gruen). Der Probetext-
        // Waechter in tests/e2e/features/schriftdateien.spec.js braucht sie
        // ausserdem VOLL: er muss auch getragene Zeichen AUSSERHALB des
        // deutschen Satzes sehen (U+00A0, in allen zehn Dateien).
        codepunkte: [...cmap.codepunkte].sort((a, b) => a - b),
        formate: cmap.formate,
        nichtUnterstuetzteFormate: cmap.nichtUnterstuetzt,
        untertabellen: cmap.untertabellen,
        bloecke: zaehleBloecke(cmap.codepunkte),
        fehlend,
        fehlendeZeichen: fehlend.map(c => String.fromCodePoint(c)),
        traegtDeutsch: fehlend.length === 0
    };
}

/**
 * Prueft alle in fonts.css eingebundenen Schriften.
 * @param {object} [opts]
 * @param {string} [opts.cssPfad]
 * @param {string} [opts.swPfad]
 * @returns {object}
 */
function pruefeAlle(opts = {}) {
    const cssPfad = opts.cssPfad || FONTS_CSS;
    const swPfad = opts.swPfad || SERVICE_WORKER;
    const quellen = leseSchriftQuellen(cssPfad);
    const dateien = quellen.map(pruefeDatei);

    const cssNamen = quellen.map(q => path.basename(q.datei));
    const swNamen = leseServiceWorkerSchriften(swPfad);
    const nurInCss = cssNamen.filter(n => !swNamen.includes(n));
    const nurInSw = swNamen.filter(n => !cssNamen.includes(n));
    const verzeichnis = leseVerzeichnisSchriften(quellen);
    const nurImVerzeichnis = verzeichnis.namen.filter(n => !cssNamen.includes(n));

    // Paarung CSS-Angabe <-> Dateifaehigkeit. Ein `font-weight: 100 900` auf
    // einer Datei ohne deckende `wght`-Achse laesst den Browser Fettschrift
    // nachtaeuschen — unsichtbar fuer jede andere Pruefung hier.
    const nachName = new Map(dateien.map(d => [d.name, d]));
    const achsenVerstoesse = [];
    for (const face of leseSchriftFaces(cssPfad)) {
        for (const name of face.dateinamen) {
            const datei = nachName.get(name);
            if (!datei || datei.fehler) continue;
            if (datei.achsenFehler) {
                achsenVerstoesse.push(`${name}: ${datei.achsenFehler}`);
                continue;
            }
            if (!face.istBereich) continue;
            const wght = (datei.achsen || []).find(a => a.tag === 'wght');
            if (!wght) {
                achsenVerstoesse.push(
                    `${name}: fonts.css erklaert fuer ${face.familie} den Gewichtsbereich ` +
                        `${face.gewichtVon}..${face.gewichtBis}, die Datei hat keine wght-Achse`
                );
            } else if (wght.min > face.gewichtVon || wght.max < face.gewichtBis) {
                achsenVerstoesse.push(
                    `${name}: wght-Achse ${wght.min}..${wght.max} deckt den erklaerten ` +
                        `Bereich ${face.gewichtVon}..${face.gewichtBis} nicht`
                );
            }
        }
    }

    return {
        geprueft: dateien.length,
        dateien,
        achsenVerstoesse,
        fehlendeDateien: dateien.filter(d => !d.vorhanden).map(d => d.url),
        unlesbar: dateien.filter(d => d.fehler).map(d => ({ name: d.name, fehler: d.fehler })),
        ohneDeutsch: dateien.filter(d => !d.traegtDeutsch).map(d => d.name),
        drift: {
            cssNamen,
            swNamen,
            nurInCss,
            nurInSw,
            // Das dritte Ende (B-07): was wirklich auf der Platte liegt.
            // `deckungsgleich` nimmt es MIT auf — eine Datei ohne
            // @font-face-Regel wird von build.py veroeffentlicht und war
            // bisher von keiner Seite sichtbar.
            verzeichnisse: verzeichnis.verzeichnisse,
            verzeichnisNamen: verzeichnis.namen,
            nurImVerzeichnis,
            deckungsgleich:
                nurInCss.length === 0 && nurInSw.length === 0 && nurImVerzeichnis.length === 0
        }
    };
}

// ----------------------------------------------------------------------
// Ausgabe
// ----------------------------------------------------------------------

/**
 * Formatiert einen Codepunkt fuer die Konsole.
 * @param {number} c
 * @returns {string}
 */
function zeigeCodepunkt(c) {
    const zeichen = String.fromCodePoint(c);
    if (c > 0x20 && c < 0x7f) return `'${zeichen}'`;
    return `U+${c.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * Erzeugt die Konsolentabelle.
 * @param {object} ergebnis Rueckgabe von pruefeAlle()
 * @returns {string}
 */
function renderBericht(ergebnis) {
    const zeilen = [];
    zeilen.push('');
    zeilen.push(`Schriftdateien aus assets/styles/fonts.css: ${ergebnis.geprueft}`);
    zeilen.push(`Deutscher Zeichensatz: ${DEUTSCHE_CODEPUNKTE.length} Zeichen`);
    zeilen.push('');

    let nr = 0;
    for (const d of ergebnis.dateien) {
        nr++;
        if (d.fehler) {
            zeilen.push(`${String(nr).padStart(2)}. ${d.name.padEnd(28)} FEHLER: ${d.fehler}`);
            continue;
        }
        const urteil = d.traegtDeutsch ? 'OK' : `FEHLT ${d.fehlend.length}`;
        zeilen.push(
            `${String(nr).padStart(2)}. ${d.name.padEnd(28)} ` +
                `Glyphen=${String(d.glyphen).padStart(5)} ` +
                `cmap-Format=${d.formate.join('+') || '-'} ` +
                `Tabellen=${String(d.numTables).padStart(2)} ` +
                `${urteil}`
        );
        zeilen.push(
            `${' '.repeat(32)}Bloecke: ${d.bloecke.map(b => `${b.name}:${b.anzahl}`).join(', ') || '(keine)'}`
        );
        zeilen.push(
            `${' '.repeat(32)}Achsen: ${
                d.achsenFehler
                    ? `FEHLER: ${d.achsenFehler}`
                    : d.hatFvar
                      ? d.achsen.map(a => `${a.tag} ${a.min}..${a.max}`).join(', ')
                      : '(statisch, keine fvar)'
            }`
        );
        if (!d.traegtDeutsch) {
            zeilen.push(`${' '.repeat(32)}Fehlend: ${d.fehlend.map(zeigeCodepunkt).join(' ')}`);
        }
    }

    zeilen.push('');
    zeilen.push(
        // Die Beschriftung nennt alle drei Enden, die `deckungsgleich`
        // zusammenfasst — sonst behauptet die Zeile weniger, als sie prueft.
        `Drift sw.js <-> fonts.css <-> Verzeichnis: ${
            ergebnis.drift.deckungsgleich
                ? 'deckungsgleich'
                : `ABWEICHUNG — nur in CSS: [${ergebnis.drift.nurInCss.join(', ')}], nur in sw.js: [${ergebnis.drift.nurInSw.join(', ')}], nur im Verzeichnis: [${ergebnis.drift.nurImVerzeichnis.join(', ')}]`
        }`
    );
    zeilen.push(
        `Ohne deutschen Zeichensatz: ${ergebnis.ohneDeutsch.length} von ${ergebnis.geprueft}` +
            (ergebnis.ohneDeutsch.length ? ` (${ergebnis.ohneDeutsch.join(', ')})` : '')
    );
    zeilen.push(
        `Gewichtsbereich ohne deckende wght-Achse: ${
            ergebnis.achsenVerstoesse.length === 0
                ? 'keiner'
                : `${ergebnis.achsenVerstoesse.length}\n  - ${ergebnis.achsenVerstoesse.join('\n  - ')}`
        }`
    );
    zeilen.push('');
    return zeilen.join('\n');
}

module.exports = {
    REPO_ROOT,
    FONTS_CSS,
    SERVICE_WORKER,
    DEUTSCHER_ZEICHENSATZ,
    DEUTSCHE_CODEPUNKTE,
    UNICODE_BLOECKE,
    BEKANNTE_TAGS,
    GEWICHT_WORTE,
    ohneKommentare,
    leseGewichtsbereich,
    leseSchriftQuellen,
    leseSchriftFaces,
    leseServiceWorkerSchriften,
    leseVerzeichnisSchriften,
    leseUIntBase128,
    parseWoff2,
    leseCmapUntertabelle,
    leseCmap,
    leseFixed1616,
    leseFvar,
    zaehleBloecke,
    pruefeDatei,
    pruefeAlle,
    zeigeCodepunkt,
    renderBericht
};

// ----------------------------------------------------------------------
// Direktaufruf-Zweig. `--json` gibt das Rohergebnis aus, `--check` beendet
// den Prozess mit 1, sobald eine Datei den deutschen Satz nicht traegt und
// nicht per `--ausnahme=<name>` freigestellt ist.
// ----------------------------------------------------------------------
if (require.main === module) {
    const args = process.argv.slice(2);
    const willJson = args.includes('--json');
    const willCheck = args.includes('--check');
    const ausnahmen = args
        .filter(a => a.startsWith('--ausnahme='))
        .map(a => a.slice('--ausnahme='.length));

    const ergebnis = pruefeAlle();

    if (willJson) {
        console.log(JSON.stringify(ergebnis, null, 2));
    } else {
        console.log(renderBericht(ergebnis));
    }

    if (willCheck) {
        const verstoesse = [
            ...ergebnis.fehlendeDateien.map(u => `fehlende Datei: ${u}`),
            ...ergebnis.unlesbar.map(u => `${u.name}: ${u.fehler}`),
            ...ergebnis.ohneDeutsch
                .filter(n => !ausnahmen.includes(n))
                .map(n => `${n}: traegt den deutschen Zeichensatz nicht`),
            // Bewusst NICHT per --ausnahme freistellbar: anders als ein
            // falsches Subset ist das ein reiner Verdrahtungsfehler zwischen
            // fonts.css und der Datei, fuer den es keinen legitimen
            // Uebergangszustand gibt.
            ...ergebnis.achsenVerstoesse
        ];
        if (!ergebnis.drift.deckungsgleich) {
            verstoesse.push(
                `Drift sw.js <-> fonts.css <-> Verzeichnis: nur in CSS [${ergebnis.drift.nurInCss.join(', ')}], nur in sw.js [${ergebnis.drift.nurInSw.join(', ')}], nur im Verzeichnis [${ergebnis.drift.nurImVerzeichnis.join(', ')}]`
            );
        }
        if (verstoesse.length > 0) {
            console.error(
                `[pruefe-schriftdateien --check] ${verstoesse.length} Verstoss/Verstoesse:`
            );
            for (const v of verstoesse) console.error(`  - ${v}`);
            process.exit(1);
        }
        console.error(
            '[pruefe-schriftdateien --check] OK — alle Schriften tragen den deutschen ' +
                'Zeichensatz, und jeder Gewichtsbereich steht auf einer Datei mit deckender ' +
                'wght-Achse.'
        );
    }
}
