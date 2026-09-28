/**
 * WCAG-2.1-Kontrastrechner fuer das Design-Testnetz
 * (Design-Handoff v3, Welle 1, Schritt 1)
 *
 * WARUM DIESE DATEI EXISTIERT: im ganzen Repository gab es keine
 * Kontrastfunktion. `grep -rn "contrastRatio\|relativeLuminance\|luminance"
 * tests/ tools/` war leer. Jede Kontrastzahl, die in einem Befund, einem
 * Handoff oder einer Ratsche steht, war damit unbelegt — sie stammte aus einem
 * Wegwerfskript, das niemand nachrechnen konnte. Die Ratsche R-02
 * (design-consistency.test.js) prueft den BERECHNETEN Endwert und nicht mehr
 * nur den Deklarationstext; ohne diesen Helfer gibt es sie nicht.
 *
 * DER SELBSTTEST IST DER KERN, nicht Beiwerk. Eine Kontrastfunktion mit
 * falscher Gamma-Schwelle oder vertauschten Kanalgewichten liefert
 * plausibel aussehende Zahlen, die um 2-8 % daneben liegen — genau in der
 * Groessenordnung, in der die Entscheidung "4,48 oder 4,52" faellt. Deshalb
 * laeuft bei JEDEM require() eine Probe gegen die beiden kanonischen
 * Referenzwerte der WCAG-Literatur (#777777 auf Weiss = 4,48 · #767676 auf
 * Weiss = 4,54 — das ist das Graupaar, an dem sich die 4,5-Schwelle
 * entscheidet) und wirft bei Abweichung. Stimmen die beiden, stimmt die
 * Formel.
 *
 * WO DER SELBSTTEST SICHTBAR WIRD: `npx jest tests/unit/wcag-contrast-helper.test.js`.
 * Diese Datei ist NICHT mit `node` allein aufrufbar — package.json fuehrt
 * "type": "module", jede .js unter tests/ laeuft deshalb nur durch die
 * babel-jest-Umsetzung (gilt fuer alle drei Helfer in diesem Ordner, nicht nur
 * fuer diesen). Der Bericht liegt darum in einer Testdatei, und die
 * gemessenen Zahlen stehen in den TESTNAMEN: bei jedem Lauf druckt jest
 * "ratio('#777777','#ffffff') = 4.48" wortwoertlich. Das ist mehr als ein
 * Skriptaufruf leisten wuerde — es laeuft in der CI mit.
 *
 * Rechenweg (WCAG 2.1, Referenz .planning/HANDOFF-V2-CHECKLISTE-T1.md §T-1):
 *   cs = c/255;  c' = cs/12.92 falls cs <= 0,03928, sonst ((cs+0,055)/1,055)^2,4
 *   L  = 0,2126*R' + 0,7152*G' + 0,0722*B'
 *   Verhaeltnis = (Lmax + 0,05) / (Lmin + 0,05)
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..', '..');
const VARIABLES_CSS = path.join(REPO, 'assets', 'styles', 'variables.css');

/** Die vier Theme-Bloecke von variables.css, in Kaskadenreihenfolge. */
const THEMES = ['dark', 'light', 'sepia', 'contrast'];

/**
 * Die 21 Tokens, die JEDER Theme-Block heute fuehrt (gemessen am 2026-09-28,
 * HEAD ca85d1b: dark=21 light=21 sepia=21 contrast=21).
 *
 * Sie dienen als Plausibilitaetsprobe des Block-Parsers: greift die Regex die
 * schliessende Klammer falsch — der Fall, der eintritt, wenn jemand
 * variables.css umformatiert —, fehlt mindestens einer dieser Namen und der
 * Parser scheitert HART, statt stillschweigend ueber einer halben Palette zu
 * urteilen.
 *
 * ABWEICHUNG VON DER SCHRITTANWEISUNG, bewusst: geprueft wird nicht "genau 21
 * Schluessel", sondern "diese 21 Schluessel sind da". Welle 1 Schritt 4
 * ergaenzt je Block 31 Eintraege; eine Gleichheitsprobe auf 21 waere eine
 * Zeitbombe, die genau dann losgeht, wenn der naechste Schritt richtig
 * arbeitet. Gegen den Parser-Fehler, um den es geht, schuetzt die
 * Teilmengenprobe genauso.
 */
const BASELINE_TOKENS = [
    '--bg-dark',
    '--bg-card',
    '--bg-elevated',
    '--bg-hover',
    '--gold',
    '--gold-dim',
    '--cyan',
    '--green',
    '--red',
    '--yellow',
    '--purple',
    '--blue',
    '--orange',
    '--pink',
    '--text',
    '--text-dim',
    '--border',
    '--shadow',
    '--gold-rgb',
    '--green-rgb',
    '--red-rgb'
];

/** Die vier neutralen Theme-Flaechen, gegen die Akzenttext gerechnet wird. */
const NEUTRAL_SURFACES = ['--bg-card', '--bg-dark', '--bg-elevated', '--bg-hover'];

// ---------------------------------------------------------------------------
// (a) Relativluminanz und Kontrastverhaeltnis
// ---------------------------------------------------------------------------

/** '#abc' und '#aabbcc' -> [r,g,b] in 0..255. Wirft bei allem anderen. */
function hexToRgb(hex) {
    const h = String(hex).trim().replace(/^#/, '');
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) {
        throw new Error(`wcag-contrast: kein Hex-Farbwert: ${JSON.stringify(hex)}`);
    }
    const full =
        h.length === 3
            ? h
                  .split('')
                  .map(c => c + c)
                  .join('')
            : h;
    return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
}

/** [r,g,b] -> '#rrggbb'. Rundet und klemmt, damit Mischungen Hex bleiben. */
function rgbToHex(rgb) {
    return (
        '#' +
        rgb
            .map(c =>
                Math.max(0, Math.min(255, Math.round(c)))
                    .toString(16)
                    .padStart(2, '0')
            )
            .join('')
    );
}

/** WCAG-2.1-Relativluminanz eines Hex-Farbwerts. */
function relLuminance(hex) {
    const v = hexToRgb(hex)
        .map(c => c / 255)
        .map(cs => (cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

/** Kontrastverhaeltnis zweier Hex-Farbwerte, immer >= 1. */
function ratio(a, b) {
    const la = relLuminance(a);
    const lb = relLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Auf zwei Dezimalen, so wie Befunde und Ratschen es notieren. */
function ratio2(a, b) {
    return Number(ratio(a, b).toFixed(2));
}

// ---------------------------------------------------------------------------
// (b) Parser fuer die vier Theme-Bloecke von variables.css
// ---------------------------------------------------------------------------

/**
 * Deklarationen NUR am Zeilenanfang.
 *
 * Diese Regex ist absichtlich dieselbe wie in F-01 Test 1
 * (design-consistency.test.js: /^\s*(--[\w-]+)\s*:/gm). Wuerde R-02 einen
 * anderen Parser benutzen, urteilten die zwei Tests ueber verschiedene
 * Tokenmengen — und die Differenz waere genau die Menge, in der ein Fehler
 * unbemerkt bleibt.
 */
const DECL_RE = /^\s*(--[\w-]+)\s*:\s*([^;]+);/gm;

function blockRegexFor(theme) {
    return theme === 'dark'
        ? /:root,\s*\[data-theme="dark"\]\s*\{([\s\S]*?)\n\s*\}/
        : new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{([\\s\\S]*?)\\n\\s*\\}`);
}

let variablesCache = null;

function readVariablesCss() {
    if (variablesCache === null) variablesCache = fs.readFileSync(VARIABLES_CSS, 'utf8');
    return variablesCache;
}

/** Nur fuer Tests, die variables.css waehrend eines Laufs veraendern. */
function clearCache() {
    variablesCache = null;
}

/**
 * Die Tokens EINES Theme-Blocks als { '--name': 'rohwert' }.
 * Scheitert hart, wenn der Block fehlt oder die Basis-Tokens nicht vollstaendig
 * darin liegen (siehe BASELINE_TOKENS).
 */
function palette(theme, cssText) {
    const css = cssText === undefined ? readVariablesCss() : cssText;
    const body = css.match(blockRegexFor(theme));
    if (!body) {
        throw new Error(
            `wcag-contrast: Theme-Block "${theme}" nicht gefunden in ${VARIABLES_CSS}. ` +
                'Wurde variables.css umformatiert? Dann greift die Block-Regex die schliessende ' +
                'Klammer falsch und JEDE Kontrastzahl dieses Laufs waere unbelegt.'
        );
    }
    const out = {};
    for (const m of body[1].matchAll(DECL_RE)) out[m[1]] = m[2].trim();
    const fehlend = BASELINE_TOKENS.filter(t => !(t in out));
    if (fehlend.length) {
        throw new Error(
            `wcag-contrast: Theme-Block "${theme}" liefert ${Object.keys(out).length} Tokens, ` +
                `aber diese Basis-Tokens fehlen: ${fehlend.join(', ')}. ` +
                'Der Block-Parser greift danach, nicht die Palette.'
        );
    }
    return out;
}

/** Alle vier Bloecke auf einmal: { dark: {...}, light: {...}, ... }. */
function palettes(cssText) {
    const out = {};
    THEMES.forEach(t => {
        out[t] = palette(t, cssText);
    });
    return out;
}

// ---------------------------------------------------------------------------
// (c) var()-Aufloesung INNERHALB eines Blocks
// ---------------------------------------------------------------------------

/** CSS-Farbnamen, die im Komponenten-CSS dieses Projekts vorkommen. */
const NAMED_COLORS = {
    white: '#ffffff',
    black: '#000000',
    transparent: null
};

const MAX_VAR_DEPTH = 10;

/**
 * Loest einen Deklarationswert zu '#rrggbb' auf.
 *
 * Kann: Hex (3/6), white/black, rgb()/rgba() mit voller Deckkraft,
 * var(--x) und var(--x, ersatz) — beides NUR gegen Tokens DESSELBEN Blocks.
 * Das ist die Aufloesung, die CSS zur Laufzeit ebenfalls macht: ein
 * Theme-Block liest seine eigenen Nachbarn (heute z. B. --attr-str: var(--red)).
 *
 * Halbdurchsichtige Werte (rgba mit Alpha, color-mix ... transparent) haben
 * ALLEIN keine Farbe — sie brauchen eine Traegerflaeche. Dafuer resolveOver().
 * Gibt null zurueck, statt zu raten. Wer raet, setzt eine Tinte auf eine
 * Flaeche, die es nicht gibt.
 */
function resolve(value, pal, depth) {
    const d = depth || 0;
    if (value === null || value === undefined) return null;
    const v = String(value).trim();
    if (d > MAX_VAR_DEPTH) {
        throw new Error(`wcag-contrast: var()-Kette zu tief (Zyklus?) bei: ${v}`);
    }
    if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
    const lower = v.toLowerCase();
    if (lower in NAMED_COLORS) return NAMED_COLORS[lower];

    const varMatch = v.match(/^var\(\s*(--[\w-]+)\s*(?:,([\s\S]*))?\)$/);
    if (varMatch) {
        const name = varMatch[1];
        if (pal && name in pal) return resolve(pal[name], pal, d + 1);
        if (varMatch[2] !== undefined) return resolve(varMatch[2], pal, d + 1);
        return null;
    }

    const rgbMatch = v.match(/^rgba?\(\s*([^)]+)\)$/i);
    if (rgbMatch) {
        const parts = rgbMatch[1].split(/[,/]/).map(s => s.trim());
        if (parts.length >= 3) {
            const alpha = parts.length > 3 ? parseFloat(parts[3]) : 1;
            if (!(alpha >= 1)) return null; // halbdurchsichtig -> braucht Flaeche
            return rgbToHex(parts.slice(0, 3).map(Number));
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// (d) Halbdurchsichtige Werte ueber einer gegebenen Flaeche
// ---------------------------------------------------------------------------

/**
 * Kanalweises Mischen: Anteil p von `hex` ueber `surface`.
 * p = 0,2 bedeutet "20 % Farbe, 80 % Flaeche".
 */
function mixOver(hex, p, surfaceHex) {
    const a = hexToRgb(hex);
    const b = hexToRgb(surfaceHex);
    return rgbToHex([0, 1, 2].map(i => p * a[i] + (1 - p) * b[i]));
}

/**
 * Wie resolve(), loest zusaetzlich die halbdurchsichtigen Formen ueber einer
 * bekannten Traegerflaeche auf:
 *   color-mix(in srgb, X p%, transparent)  ->  p*X + (1-p)*Flaeche
 *   rgba(r, g, b, a)                       ->  a*Farbe + (1-a)*Flaeche
 *
 * Gebraucht ab Welle 2 fuer die 108 Toenungsstellen, schon jetzt fuer
 * dice.css:371 und dmscreen.css:1728-1732, wo die color-mix-Variante bereits
 * im Baum steht.
 */
function resolveOver(value, pal, surfaceHex) {
    const direct = resolve(value, pal);
    if (direct) return direct;
    if (!surfaceHex) return null;
    const v = String(value === null || value === undefined ? '' : value).trim();

    const mix = v.match(
        /^color-mix\(\s*in\s+srgb\s*,\s*([\s\S]+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i
    );
    if (mix) {
        const base = resolve(mix[1], pal);
        if (!base) return null;
        return mixOver(base, parseFloat(mix[2]) / 100, surfaceHex);
    }

    const rgba = v.match(/^rgba?\(\s*([^)]+)\)$/i);
    if (rgba) {
        const parts = rgba[1].split(/[,/]/).map(s => s.trim());
        if (parts.length > 3) {
            const alpha = parseFloat(parts[3]);
            if (alpha >= 0 && alpha < 1) {
                return mixOver(rgbToHex(parts.slice(0, 3).map(Number)), alpha, surfaceHex);
            }
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Bequemlichkeit fuer die Ratschen
// ---------------------------------------------------------------------------

/**
 * Das SCHLECHTESTE Verhaeltnis einer Tinte ueber mehreren Flaechen.
 * Entscheidung D-2: massgeblich ist das Minimum ueber alle tatsaechlichen
 * Traegerflaechen, nicht --bg-card allein.
 *
 * -> { min, worst, values } oder { min: null, missing: [...] }, wenn ein
 *    beteiligter Wert nicht aufloesbar ist.
 */
function minRatioOverSurfaces(inkToken, surfaceTokens, pal) {
    const ink = resolve(pal[inkToken], pal);
    if (!ink) return { min: null, missing: [inkToken] };
    const missing = [];
    const values = {};
    let min = Infinity;
    let worst = null;
    surfaceTokens.forEach(s => {
        const flaeche = resolve(pal[s], pal);
        if (!flaeche) {
            missing.push(s);
            return;
        }
        const r = ratio(ink, flaeche);
        values[s] = Number(r.toFixed(2));
        if (r < min) {
            min = r;
            worst = s;
        }
    });
    if (missing.length) return { min: null, missing };
    return { min: Number(min.toFixed(2)), worst, values };
}

// ---------------------------------------------------------------------------
// Selbsttest — laeuft bei jedem require()
// ---------------------------------------------------------------------------

/**
 * Die beiden kanonischen Referenzwerte. #777777 auf Weiss verfehlt 4,5 knapp
 * (4,48), #767676 haelt es knapp (4,54) — genau das Paar, das eine falsche
 * Gamma-Schwelle oder vertauschte Kanalgewichte verraet.
 */
const SELFTEST_CASES = [
    { a: '#777777', b: '#ffffff', soll: '4.48' },
    { a: '#767676', b: '#ffffff', soll: '4.54' }
];

function selfTest() {
    const ergebnisse = SELFTEST_CASES.map(c => ({
        ...c,
        ist: ratio(c.a, c.b).toFixed(2)
    }));
    const fehler = ergebnisse.filter(e => e.ist !== e.soll);
    if (fehler.length) {
        throw new Error(
            'wcag-contrast: SELBSTTEST FEHLGESCHLAGEN — die Kontrastformel ist falsch, ' +
                'jede Zahl dieses Laufs waere unbelegt. ' +
                fehler.map(e => `ratio(${e.a}, ${e.b}) = ${e.ist}, erwartet ${e.soll}`).join(' · ')
        );
    }
    return ergebnisse;
}

selfTest();

module.exports = {
    THEMES,
    BASELINE_TOKENS,
    NEUTRAL_SURFACES,
    VARIABLES_CSS,
    DECL_RE,
    hexToRgb,
    rgbToHex,
    relLuminance,
    ratio,
    ratio2,
    palette,
    palettes,
    blockRegexFor,
    clearCache,
    resolve,
    resolveOver,
    mixOver,
    minRatioOverSurfaces,
    selfTest,
    SELFTEST_CASES
};
