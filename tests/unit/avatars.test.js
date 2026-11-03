/**
 * Avatars Tests — WR-01 (Phase 12, Review-Fix)
 *
 * Testet validateAvatarURL() aus systems/avatars.js. Bisher gab es fuer diese
 * Datei ueberhaupt keine Unit-Tests (neue Datei, T-12-REVIEWFIX).
 *
 * Fokus: der Steuerzeichen-Bypass des reinen trim()+startsWith()-Praefixfilters.
 * Browser entfernen Tab-, Zeilenumbruch- und Carriage-Return-Zeichen (und laut
 * WHATWG-URL-Spezifikation generell C0-Steuerzeichen) aus der GESAMTEN URL, nicht
 * nur am Rand, bevor sie das Schema bestimmen. Ein String wie "java\tscript:..."
 * bestand die alte Pruefung, waere vom Browser aber als "javascript:"-URL
 * interpretiert worden.
 *
 * Muster: vm.createContext() analog tests/unit/migration-wizard.test.js
 * (non-ESM-Module in isoliertem vm-Kontext laden). validateAvatarURL() selbst
 * greift auf keine Globals zu (keine $()-, window.*- oder document-Aufrufe),
 * daher genuegt ein minimaler Kontext.
 *
 * AVATAR-DATEI (Nutzerentscheidung 03.11. zu SENKEN Offen (15), docs/bugfixes.md: "Erlauben"):
 * der Bild-Dialog nimmt lokale Bilder wie file:///C:/Bilder/held.png an, Netzwerkpfade bleiben
 * gesperrt — derselbe Pruefkern wie Anzeige und Linkliste (sichereBildquelle()). Vertrag A1:
 * validateAvatarURL(x) ist wahr genau dann, wenn x leer ist ODER sichereBildquelle() den
 * GESPEICHERTEN Wert x.trim() anzeigt UND x kein gefaehrliches Schema (javascript:, vbscript:,
 * data:text/html, auch mit Steuerzeichen) traegt. Gespeichert wird x.trim(): beide Aufrufer
 * trimmen vor dem Aufruf (saveAvatar(), openBstAvatarModal()). Am Rohwert gelesen waere A1
 * nicht erfuellbar — begruendet und gemessen im describe "A1 am gespeicherten Wert" unten.
 * Drei Zusicherungen dieser Datei hielten die alte Sperre von `file:` fest und sind mit der
 * Entscheidung umgedreht (Begruendung je am Fall), nicht abgeschwaecht: die Netzwerkform jedes
 * dieser Faelle bleibt gesperrt und steht daneben.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const AVATARS_PATH = path.join(__dirname, '../../systems/avatars.js');
// sichereBildquelle() fuer validateAvatarURL(): der echte Block aus utils/basic.js (SENKEN R3)
const { ladeDatengrenze } = require('./helpers/datengrenze-block.js');

let validateAvatarURL;
let sichereBildquelle;

beforeAll(() => {
    // vm.createContext() erbt KEINE Host-Globals. Bis AVATAR-DATEI rief validateAvatarURL()
    // `new URL(trimmed)` auf; ohne die echte Node-URL-Klasse warf das einen ReferenceError, den
    // das try/catch der Funktion schluckte, und absolute http(s)-URLs liefen faelschlich ueber
    // den Relativpfad-Zweig. Seither entscheidet sichereBildquelle() allein, ohne `new URL()`;
    // die Klasse bleibt im Kontext, damit ein kuenftiger Aufruf nicht wieder still so scheitert.
    const context = { window: {}, URL };
    vm.createContext(context);
    ladeDatengrenze(context);
    vm.runInContext(fs.readFileSync(AVATARS_PATH, 'utf8'), context);
    validateAvatarURL = context.validateAvatarURL;
    sichereBildquelle = context.sichereBildquelle;
});

describe('validateAvatarURL — Grundverhalten', () => {
    test('leerer/undefinierter Wert ist gueltig (wird entfernt)', () => {
        expect(validateAvatarURL('')).toBe(true);
        expect(validateAvatarURL('   ')).toBe(true);
        expect(validateAvatarURL(null)).toBe(true);
        expect(validateAvatarURL(undefined)).toBe(true);
    });

    test('http/https-URLs sind gueltig', () => {
        expect(validateAvatarURL('https://example.com/avatar.png')).toBe(true);
        expect(validateAvatarURL('http://example.com/avatar.png')).toBe(true);
    });

    test('relative Pfade sind gueltig', () => {
        expect(validateAvatarURL('/images/avatar.png')).toBe(true);
        expect(validateAvatarURL('./avatar.png')).toBe(true);
    });

    test('data:image/*-URLs sind gueltig', () => {
        expect(validateAvatarURL('data:image/png;base64,AAAA')).toBe(true);
    });

    test('bekannte gefaehrliche Protokolle (ohne Steuerzeichen) werden abgelehnt', () => {
        expect(validateAvatarURL('javascript:alert(1)')).toBe(false);
        // AVATAR-DATEI: hier stand `file:///etc/passwd` -> false. Ein lokaler Pfad ist seit der
        // Nutzerentscheidung 03.11. eine zulaessige Bildquelle (s. describe AVATAR-DATEI unten);
        // gefaehrlich am file:-Schema ist der Netzwerkpfad (UNC, Anmeldung beim fremden Rechner).
        expect(validateAvatarURL('file://rechner/etc/passwd')).toBe(false);
        expect(validateAvatarURL('vbscript:msgbox(1)')).toBe(false);
        expect(validateAvatarURL('data:text/html,<script>alert(1)</script>')).toBe(false);
    });
});

/*
 * SENKEN R3 fuer Bildquellen (Gutachten, Sonde D): `//localhost/…` BESTAND die Pruefung
 * (`trimmed.startsWith('/')`), und die App lud das Bild ohne Klick. Unter file:// wird
 * `//host/share/x.png` zu `file://host/share/x.png` — unter Windows ein UNC-Pfad, also eine
 * Verbindung samt Anmeldeversuch zu einem fremden Rechner. Der Browser liest `\` hier wie
 * `/` und streicht Tabulatoren und Zeilenumbrueche. Die Ausgabe prueft dasselbe ueber
 * sichereBildquelle() (utils/basic.js, Vertrag in tests/unit/datengrenze.test.js).
 */
describe('validateAvatarURL — SENKEN: kein protokoll-relativer Anfang', () => {
    test.each([
        '//host/share/avatar.png',
        '//localhost/C:/avatar.png',
        '\\\\host\\share\\avatar.png',
        '/\\host/share/avatar.png',
        '\\/host/share/avatar.png',
        '  //host/avatar.png',
        '/\t/host/avatar.png'
    ])('%j wird abgelehnt', url => {
        expect(validateAvatarURL(url)).toBe(false);
    });

    test('ein Pfad ab der Wurzel bleibt gueltig', () => {
        expect(validateAvatarURL('/images/avatar.png')).toBe(true);
    });
});

/*
 * SENKEN Nachbesserung (16): Speichern und Anzeige widersprachen sich. validateAvatarURL()
 * pruefte nur einen rohen Anfang aus zwei `/` oder `\` und speicherte Werte, die die Anzeige
 * (sichereBildquelle(), Nachbesserung (15)) sperrt: einen relativen Pfad mit kodiertem doppeltem
 * Trenner (`/%5C%5Chost/x.png` laedt Firefox als `\\host\x.png`) und einen relativen Wert, der
 * mit `?` oder `#` beginnt. Das Bild-Modal zeigte in der Vorschau das Fehlerzeichen und
 * speicherte trotzdem, die Karte zeigte danach den Platzhalter. Jetzt speichert es nur, was
 * sichereBildquelle() anzeigt. Die Ablehnung von `file:` in der Eingabe blieb damals (Offen
 * (15), eine eigene Nutzerentscheidung) — am 03.11. entschieden: lokale Dateien erlaubt
 * (AVATAR-DATEI, unten).
 */
describe('validateAvatarURL — SENKEN (16): speichert nur, was angezeigt wird', () => {
    test.each([
        '/%5C%5Chost/share/avatar.png',
        '/%5c%5chost/avatar.png',
        '/%5C/host/avatar.png',
        '/./%5C%5Chost/avatar.png',
        '/x/../%5C%5Chost/avatar.png',
        '/%2e%2e/%5C%5Chost/avatar.png',
        '/%2F%2Fhost/avatar.png',
        '/%5C%5Chost/avatar.png?v=1',
        'x/..//host/avatar.png',
        '?v=1',
        '#avatar'
    ])('%j wird abgelehnt (die Anzeige sperrt ihn)', url => {
        expect(sichereBildquelle(url)).toBe('');
        expect(validateAvatarURL(url)).toBe(false);
    });

    test.each([
        'https://example.com/avatar.png',
        '/images/avatar.png',
        './avatar.png',
        '../bilder/avatar.png',
        'bilder/avatar.png?v=1',
        'data:image/png;base64,AAAA'
    ])('%j bleibt gueltig und wird angezeigt', url => {
        expect(validateAvatarURL(url)).toBe(true);
        expect(sichereBildquelle(url)).toBe(url);
    });

    // AVATAR-DATEI: hier stand "die Eingabe lehnt ihn weiter ab (Offen (15))" mit
    // validateAvatarURL(...) === false. Offen (15) ist am 03.11. entschieden ("Erlauben").
    // Daneben seine Netzwerkformen: Host, localhost, Trenner am Pfadanfang (roh und kodiert).
    test('ein lokaler Dateipfad wird angezeigt und angenommen (AVATAR-DATEI, Offen (15) entschieden)', () => {
        expect(sichereBildquelle('file:///C:/Bilder/held.png')).toBe('file:///C:/Bilder/held.png');
        expect(validateAvatarURL('file:///C:/Bilder/held.png')).toBe(true);
        for (const netz of [
            'file://rechner/C:/Bilder/held.png',
            'file://localhost/C:/Bilder/held.png',
            'file:////rechner/C:/Bilder/held.png',
            'file:///%5C%5Crechner/C:/Bilder/held.png'
        ]) {
            expect(sichereBildquelle(netz)).toBe('');
            expect(validateAvatarURL(netz)).toBe(false);
        }
    });
});

describe('validateAvatarURL — WR-01: Steuerzeichen-Bypass', () => {
    test('eingebettetes Tab-Zeichen in "javascript:" wird erkannt und abgelehnt', () => {
        expect(validateAvatarURL('java\tscript:alert(1)')).toBe(false);
    });

    test('eingebetteter Zeilenumbruch in "javascript:" wird erkannt und abgelehnt', () => {
        expect(validateAvatarURL('jav\nascript:alert(1)')).toBe(false);
    });

    test('eingebettetes Carriage-Return in "javascript:" wird erkannt und abgelehnt', () => {
        expect(validateAvatarURL('jav\rascript:alert(1)')).toBe(false);
    });

    test('mehrere eingebettete Steuerzeichen ueber das gesamte Protokoll verteilt', () => {
        expect(validateAvatarURL('j\ta\nv\ra\tscript:alert(1)')).toBe(false);
    });

    test('eingebettetes Steuerzeichen in "vbscript:" wird erkannt und abgelehnt', () => {
        expect(validateAvatarURL('vb\tscript:msgbox(1)')).toBe(false);
    });

    // AVATAR-DATEI: hier stand `fi\tle:///etc/passwd` -> false. Der Browser streicht den
    // Tabulator und liest eine LOKALE Datei; die zeigt sichereBildquelle() seit SENKEN (14) an,
    // und die Eingabe nimmt sie seit der Nutzerentscheidung 03.11. an (Fall im describe
    // AVATAR-DATEI). Gesperrt bleibt der Netzwerkpfad mit demselben Trick:
    test('eingebettetes Steuerzeichen in einem file:-Netzwerkpfad wird erkannt und abgelehnt', () => {
        expect(validateAvatarURL('fi\tle://rechner/etc/passwd')).toBe(false);
        expect(validateAvatarURL('fi\tle:////rechner/share/x.png')).toBe(false);
        expect(validateAvatarURL('fi\nle://localhost/C:/x.png')).toBe(false);
    });

    test('eingebettetes Leerzeichen in "javascript:" wird ebenfalls erkannt (ueber Tab/CR/LF hinaus)', () => {
        expect(validateAvatarURL('java script:alert(1)')).toBe(false);
    });

    test('gueltige http-URL mit harmlosem eingebettetem Leerraum in der Query bleibt durch die generelle Pruefung erfasst', () => {
        // Kein Sicherheitsanspruch hier — nur Beleg, dass der neue Filter legitime
        // http/https-URLs ohne gefaehrliches Praefix nicht faelschlich als
        // "javascript:"/"file:"/"vbscript:"/"data:text/html" einstuft.
        expect(validateAvatarURL('https://example.com/a b.png')).toBe(true);
    });

    // Hinweis zur Testbarkeit: fuer alle obigen Beispiele (javascript:/file:-Netzwerkpfad/
    // vbscript:/data:text/html mit eingebetteten Steuerzeichen) liefert
    // validateAvatarURL() SOWOHL vor als auch nach dem WR-01-Fix `false` —
    // `new URL(...)` folgt (wie Browser) ebenfalls der WHATWG-Spezifikation und
    // entfernt Tab/Zeilenumbruch VOR dem Parsen, wodurch der nachgelagerte
    // "nur http:/https: erlaubt"-Whitelist-Check zufaellig bereits greift (das
    // ist exakt die im REVIEW.md dokumentierte "aktuell nicht ausnutzbar,
    // aber das Versprechen des Blocklist-Filters stimmt nicht"-Situation).
    // Der End-zu-Ende-Rueckgabewert allein kann den Fix daher NICHT von der
    // ungefixten Fassung unterscheiden. Der folgende Quelltext-Beleg (Muster:
    // full-export.test.js "Quelltext-Beleg") prueft deshalb direkt, dass die
    // Steuerzeichen-Entfernung VOR der expliziten dangerousProtocols-Pruefung
    // im Quelltext vorhanden ist — er schlaegt auf der ungefixten Datei fehl
    // und besteht nur mit dem WR-01-Fix.
    test('Quelltext-Beleg: Steuerzeichen werden vor der expliziten Protokollpruefung aus der GESAMTEN URL entfernt (WR-01)', () => {
        const src = fs.readFileSync(AVATARS_PATH, 'utf8');
        const idxProtocolCheck = src.indexOf('dangerousProtocols.some(');
        expect(idxProtocolCheck).toBeGreaterThan(-1);

        // Es muss VOR der Protokollpruefung ein .replace() geben, das C0-
        // Steuerzeichen (\x00-\x1F), DEL (\x7F) und Leerraum ENTFERNT — nicht
        // nur an den Raendern wie trim(), sondern ueber die gesamte URL verteilt.
        const idxStrip = src.search(/\.replace\(\s*\/\[[^\]]*\\x00[^\]]*\][^)]*,\s*['"]{2}\s*\)/);
        expect(idxStrip).toBeGreaterThan(-1);
        expect(idxStrip).toBeLessThan(idxProtocolCheck);
    });
});

// ============================================================
// AVATAR-DATEI — lokale Bilder im Bild-Dialog (Vertrag A1)
// ============================================================
/*
 * BEFUND am Stand dd399a32: validateAvatarURL() fuehrte `file:` in dangerousProtocols und liess
 * bei absoluten URLs nur http:/https: zu. Der Bild-Dialog (saveAvatar) und der Bestiar-Editor
 * (bestiary-editor.js, validateAvatarUrlSafe) lehnten darum `file:///C:/Bilder/held.png` ab,
 * obwohl die Anzeige (sichereBildquelle(), SENKEN (14)) genau dieses Bild zeigt und die Vorschau
 * im Dialog es schon geladen hatte. Nutzerentscheidung 03.11. zu SENKEN Offen (15): erlauben,
 * Netzwerkpfade bleiben gesperrt, derselbe Pruefkern.
 *
 * VERTRAG A1: validateAvatarURL(x) === (x leer || sichereBildquelle(x.trim()) !== '' && kein
 * gefaehrliches Schema) — x.trim() ist der Wert, den die Aufrufer speichern (Kopf der Datei und
 * describe "A1 am gespeicherten Wert"). "Gefaehrlich" sind javascript:, vbscript:,
 * data:text/html, gelesen wie heute (WR-01): Steuer- und Leerzeichen UEBERALL gestrichen,
 * Gross/Klein egal. Die zweite Bedingung ist nicht ueberfluessig: sichereBildquelle() liest
 * `java script:…` und `jav\vascript:…` als relativen Pfad (Leerzeichen und vertikaler Tab
 * gehoeren nicht zum Schema) und zeigt sie an.
 *
 * Die Bildfaelle des Datengrenzen-Vertrags (BILD_ERLAUBT, BILD_VERBOTEN, LINK_VERBOTEN) werden
 * aus tests/unit/datengrenze.test.js gelesen, nicht abgeschrieben: eine neue Sperrform dort gilt
 * damit sofort auch fuer die Eingabe.
 */

/**
 * Die Listen LINK_VERBOTEN bis BILD_ERLAUBT aus tests/unit/datengrenze.test.js — als Text
 * ausgeschnitten und in einem eigenen vm-Kontext ausgewertet (die Datei ist eine Suite und
 * laesst sich nicht require()n). Der Ausschnitt besteht nur aus Array-Literalen und Spreads
 * untereinander; fehlt eine Marke, wirft das hier laut, statt still weniger zu pruefen.
 * @returns {{LINK_VERBOTEN: string[], BILD_VERBOTEN: string[], BILD_ERLAUBT: string[]}}
 */
function datengrenzeBildfaelle() {
    const text = fs
        .readFileSync(path.join(__dirname, 'datengrenze.test.js'), 'utf8')
        .replace(/\r\n/g, '\n');
    const start = text.indexOf('const LINK_VERBOTEN = [');
    const bild = start < 0 ? -1 : text.indexOf('const BILD_ERLAUBT = [', start);
    const ende = bild < 0 ? -1 : text.indexOf('\n];', bild);
    if (start < 0 || bild < 0 || ende < 0) {
        throw new Error(
            'LINK_VERBOTEN … BILD_ERLAUBT in tests/unit/datengrenze.test.js nicht gefunden'
        );
    }
    const listen = vm.runInNewContext(
        `${text.slice(start, ende + 3)}\n({ LINK_VERBOTEN, BILD_VERBOTEN, BILD_ERLAUBT });`
    );
    // In dieses Realm kopieren (Arrays aus dem vm-Kontext haben ein fremdes Array.prototype)
    return {
        LINK_VERBOTEN: Array.from(listen.LINK_VERBOTEN),
        BILD_VERBOTEN: Array.from(listen.BILD_VERBOTEN),
        BILD_ERLAUBT: Array.from(listen.BILD_ERLAUBT)
    };
}
const VERTRAG = datengrenzeBildfaelle();

// Lokale Bilder, wie der Nutzer sie unter file:// ablegt — NEU angenommen (A1)
const LOKAL_ERLAUBT = [
    'file:///C:/Bilder/held.png',
    'file:///C:/Users/a%20b/x.png',
    'file:///home/x/held.png',
    'FILE:///C:/x.png',
    'file:///D:/Karten/Burg%20Nord/portrait.webp',
    ' file:///C:/Bilder/held.png',
    // der Browser streicht den Tabulator: fuer ihn dieselbe lokale Datei (wie die Anzeige)
    'fi\tle:///C:/Bilder/held.png',
    // vorher als "gefaehrliches Protokoll" gefuehrt (s. Grundverhalten) — ein lokaler Pfad
    'file:///etc/passwd'
];
// Bisher schon angenommen — bleibt (Kontrolle, gruen vor und nach dem Fix)
const BISHER_ERLAUBT = [
    'https://example.com/avatar.png',
    'http://example.com/avatar.png',
    'HTTPS://Example.com/A.png',
    'https://example.com/a b.png',
    'data:image/png;base64,AAAA',
    'DATA:image/svg+xml,%3Csvg%3E',
    '/images/avatar.png',
    './avatar.png',
    '../bilder/avatar.png',
    'bilder/avatar.png?v=1',
    'icons/held.png'
];
// Randfall (A1 "genau dann"): ein relativer Pfad mit `:` HINTER dem ersten Trenner. Fuer den
// Browser kein Schema (`/` gehoert nicht dazu), sichereBildquelle() zeigt ihn an; heute lehnt
// ihn der catch-Zweig ab (`new URL()` wirft, dann `!trimmed.includes(':')`).
const RAND_ERLAUBT = ['bilder/a:b.png', 'karten/nord:sued.png'];
// Netzwerkpfade (A1) — gesperrt, wie sichereBildquelle() sie sperrt
const NETZ_GESPERRT = [
    'file://host/share/held.png',
    'file://localhost/C:/held.png',
    'FILE://LOCALHOST/C:/held.png',
    'file:////host/share/held.png',
    'file:///%5C%5Chost/share/held.png',
    'file:///%5c%5chost/held.png',
    'file:///\\\\host\\share\\held.png',
    'file:///home/../..//host/held.png',
    'file:\\\\host\\share\\held.png',
    'fi\tle://host/share/held.png',
    ' file://host/held.png',
    '//host/share/held.png',
    ' //host/held.png',
    '\\\\host\\share\\held.png',
    '/%5C%5Chost/share/held.png',
    '/x/../%5C%5Chost/held.png',
    'x/..//host/held.png',
    '//neben.invalid/x.png',
    '/%5C%5Cneben.invalid/x.png',
    '?v=1',
    '#avatar'
];
// Gefaehrliche Schemata, auch mit Steuerzeichen (A1)
const SCHEMA_GESPERRT = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    '\u0000javascript:alert(1)',
    'java\tscript:alert(1)',
    'jav\nascript:alert(1)',
    'j\ta\nv\ra\tscript:alert(1)',
    // diese beiden zeigt sichereBildquelle() als relativen Pfad an — die Schemapruefung sperrt sie
    'java script:alert(1)',
    'jav\u000bascript:alert(1)',
    'vbscript:msgbox(1)',
    'vb\tscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'da\nta:text/html,<script>alert(1)</script>',
    'DATA:text/html;base64,PHNjcmlwdD4=',
    'javascript:alert(1)//file:///C:/x.png'
];
// Sonst gesperrt: kein lokaler file:///-Pfad, ein anderes Schema, ein Laufwerk ohne file:///
const SONST_GESPERRT = [
    'file:///',
    'file:/C:/held.png',
    'file:C:/held.png',
    'C:/Bilder/held.png',
    'C:\\Bilder\\held.png',
    'blob:file:///x',
    'ftp://example.com/x.png',
    'mailto:dm@example.com'
];

/** Leer im Sinne von A1 (wird entfernt). */
const leer = x => x === null || x === undefined || String(x).trim() === '';
/**
 * Gefaehrliches Schema im Sinne von A1, gelesen wie heute (WR-01): Steuerzeichen U+0000 bis
 * U+0020, DEL und Leerraum ueberall gestrichen, Gross/Klein egal. Ohne Steuerzeichen-Regex
 * (no-control-regex), ueber die Zeichencodes.
 */
function gefaehrlichesSchema(x) {
    const gelesen = Array.from(String(x))
        .filter(z => z.charCodeAt(0) > 0x20 && z.charCodeAt(0) !== 0x7f && !/\s/.test(z))
        .join('')
        .toLowerCase();
    return ['javascript:', 'vbscript:', 'data:text/html'].some(p => gelesen.startsWith(p));
}
/** Der Wert, den die Aufrufer speichern: saveAvatar() und openBstAvatarModal() trimmen. */
const gespeichert = x => String(x).trim();
/** Was A1 fuer x verlangt — am gespeicherten Wert (describe "A1 am gespeicherten Wert"). */
const erwartet = x =>
    leer(x) || (sichereBildquelle(gespeichert(x)) !== '' && !gefaehrlichesSchema(x));
/** Dieselbe Erwartung am Rohwert: die woertliche Lesung, nur zum Vergleich (s. dort). */
const erwartetRoh = x => leer(x) || (sichereBildquelle(x) !== '' && !gefaehrlichesSchema(x));

const ALLE_ERLAUBT = [
    '',
    '   ',
    ...LOKAL_ERLAUBT,
    ...BISHER_ERLAUBT,
    ...RAND_ERLAUBT,
    ...VERTRAG.BILD_ERLAUBT
];
const ALLE_GESPERRT = [
    ...NETZ_GESPERRT,
    ...SCHEMA_GESPERRT,
    ...SONST_GESPERRT,
    ...VERTRAG.BILD_VERBOTEN,
    ...VERTRAG.LINK_VERBOTEN
];

// Leerraum, den JS-trim() am Anfang streicht und der Browser nicht: NBSP, BOM, ideographisches
// Leerzeichen, Zeilentrenner, Ogham-Leerzeichen. wieBrowserGelesen() (utils/basic.js) streicht
// wie der Browser nur Zeichen bis U+0020 und Tabulator/Zeilenumbruch.
const UNICODE_LEERRAUM = ['\u00a0', '\ufeff', '\u3000', '\u2028', '\u1680'];
const UNICODE_ERLAUBT = UNICODE_LEERRAUM.flatMap(z => [
    z,
    `${z}file:///C:/Bilder/held.png`,
    `${z}https://example.org/held.png`,
    `${z}data:image/png;base64,AAAA`,
    `${z}bilder/held.png`
]);
const UNICODE_GESPERRT = UNICODE_LEERRAUM.flatMap(z => [
    `${z}file://host/share/held.png`,
    `${z}file:////host/share/held.png`,
    `${z}file:///%5C%5Chost/share/held.png`,
    `${z}file:192.0.2.1/s/x.png`,
    `${z}//host/held.png`,
    `${z}/%5C%5Chost/held.png`,
    `${z}javascript:alert(1)`
]);

describe('validateAvatarURL — AVATAR-DATEI: lokale Bilder angenommen, Netzwerkpfade gesperrt (A1)', () => {
    test('die Bildfaelle des Datengrenzen-Vertrags sind gelesen (nicht leer, mit lokalen und Netzwerkpfaden)', () => {
        expect(VERTRAG.BILD_ERLAUBT).toContain('file:///C:/Bilder/held.png');
        expect(VERTRAG.BILD_VERBOTEN).toContain('file://localhost/x');
        expect(VERTRAG.BILD_VERBOTEN).toContain('/%5C%5Crechner/x.png');
        expect(VERTRAG.LINK_VERBOTEN).toContain('java\tscript:window.__xss=1');
    });

    test.each(LOKAL_ERLAUBT)('lokale Datei %j wird angezeigt UND angenommen', url => {
        expect(sichereBildquelle(url)).toBe(url);
        expect(validateAvatarURL(url)).toBe(true);
    });

    test.each(BISHER_ERLAUBT)('%j bleibt angenommen (Kontrolle)', url => {
        expect(validateAvatarURL(url)).toBe(true);
    });

    test.each(RAND_ERLAUBT)(
        'Randfall %j: die Anzeige zeigt ihn, also nimmt die Eingabe ihn an ("genau dann")',
        url => {
            expect(sichereBildquelle(url)).toBe(url);
            expect(validateAvatarURL(url)).toBe(true);
        }
    );

    test.each(VERTRAG.BILD_ERLAUBT)(
        '%j (BILD_ERLAUBT, datengrenze.test.js) wird angenommen — die Anzeige zeigt ihn',
        url => {
            expect(validateAvatarURL(url)).toBe(true);
        }
    );

    test.each(NETZ_GESPERRT)('Netzwerkpfad %j bleibt gesperrt', url => {
        expect(sichereBildquelle(url)).toBe('');
        expect(validateAvatarURL(url)).toBe(false);
    });

    test.each(SCHEMA_GESPERRT)('gefaehrliches Schema %j bleibt gesperrt', url => {
        expect(validateAvatarURL(url)).toBe(false);
    });

    test.each(SONST_GESPERRT)('%j bleibt gesperrt (kein lokaler Pfad, fremdes Schema)', url => {
        expect(sichereBildquelle(url)).toBe('');
        expect(validateAvatarURL(url)).toBe(false);
    });

    test.each(VERTRAG.BILD_VERBOTEN)(
        '%j (BILD_VERBOTEN, datengrenze.test.js) bleibt gesperrt',
        url => {
            expect(validateAvatarURL(url)).toBe(false);
        }
    );

    test.each(VERTRAG.LINK_VERBOTEN)(
        '%j (LINK_VERBOTEN, datengrenze.test.js: Schema mit Steuerzeichen) bleibt gesperrt',
        url => {
            expect(validateAvatarURL(url)).toBe(false);
        }
    );

    // Nicht-Vakuitaet der Eigenschaft: ihre Erwartung trennt die Listen wirklich. Sonst koennte
    // ein falsch gebautes erwartet() mit einer falsch gebauten Eingabe uebereinstimmen.
    test('Nicht-Vakuitaet: die Erwartung nach A1 ist fuer jede Erlaubnis wahr, fuer jede Sperre falsch', () => {
        expect([...ALLE_ERLAUBT, ...UNICODE_ERLAUBT].filter(x => !erwartet(x))).toEqual([]);
        expect([...ALLE_GESPERRT, ...UNICODE_GESPERRT].filter(x => erwartet(x))).toEqual([]);
        // die Schemapruefung traegt: ohne sie stuende `java script:` auf der Erlaubnisseite
        expect(sichereBildquelle('java script:alert(1)')).not.toBe('');
    });

    test.each([...ALLE_ERLAUBT, ...ALLE_GESPERRT, ...UNICODE_ERLAUBT, ...UNICODE_GESPERRT])(
        'Eigenschaft A1 fuer %j: angenommen genau dann, wenn leer oder der gespeicherte Wert angezeigt wird und kein gefaehrliches Schema',
        url => {
            expect(validateAvatarURL(url)).toBe(erwartet(url));
        }
    );
});

/*
 * A1 AM GESPEICHERTEN WERT (Pruefbefund nach bd06445d, kann). Beide Aufrufer trimmen vor dem
 * Aufruf und speichern den getrimmten Wert (saveAvatar() in systems/avatars.js,
 * openBstAvatarModal() im Bestiar-Editor). JS-trim() streicht am Anfang mehr als der Browser
 * (UNICODE_LEERRAUM). Fuer solche Werte gehen "sichereBildquelle(x)" und
 * "sichereBildquelle(x.trim())" auseinander, und nur die zweite Lesung haelt "gespeichert wird,
 * was die Anzeige zeigt" (SENKEN (16)) und A4 zugleich:
 *   - `\u00a0https://example.org/held.png` zeigt sichereBildquelle() roh NICHT (ein relativer
 *     Pfad mit `//`). Gespeichert wird `https://…`, und das zeigt die Karte; dd399a32 nahm den
 *     Wert schon an. Am Rohwert geprueft, lehnte der Dialog ihn ab — eine Verhaltensaenderung
 *     gegen A4, ohne Schutz, denn gespeichert wird der getrimmte Wert.
 *   - `\u00a0file:192.0.2.1/s/x.png` zeigt sichereBildquelle() roh (ein relativer Pfad ohne
 *     Trennerpaar). Gespeichert wuerde `file:192.0.2.1/s/x.png`, und das sperrt die Anzeige —
 *     am Rohwert geprueft, speicherte der Dialog, was die Karte dann als Platzhalter zeigt.
 * Bis zu diesem Befund behauptete die Eigenschaft oben die Rohlesung, aber keine Liste enthielt
 * einen solchen Wert, darum war sie gruen. Mit UNICODE_ERLAUBT/UNICODE_GESPERRT und der
 * Rohlesung waren an bd06445d 15 Faelle der Eigenschaft rot (gemessen: je Leerzeichen die lokale
 * Datei und https angenommen, `file:192.0.2.1/…` gesperrt); die Rohlesung ist nicht erfuellbar,
 * ohne A4 oder SENKEN (16) zu brechen. Gegenprobe: prueft validateAvatarURL() den Rohwert
 * (`sichereBildquelle(url)`), ist diese Datei in 31 Faellen rot, die Fassung davor in keinem.
 * Sicherheitsfolge keine: angenommen wird nur, was als gespeicherter Wert angezeigt wird
 * (letzter Fall).
 */
describe('validateAvatarURL — A1 am gespeicherten (getrimmten) Wert', () => {
    test('die beiden Lesungen gehen bei Unicode-Leerraum am Anfang auseinander (die Faelle tragen)', () => {
        for (const z of UNICODE_LEERRAUM) {
            expect(sichereBildquelle(`${z}https://example.org/held.png`)).toBe('');
            expect(erwartetRoh(`${z}https://example.org/held.png`)).toBe(false);
            expect(erwartet(`${z}https://example.org/held.png`)).toBe(true);
            expect(sichereBildquelle(`${z}file:192.0.2.1/s/x.png`)).not.toBe('');
            expect(erwartetRoh(`${z}file:192.0.2.1/s/x.png`)).toBe(true);
            expect(erwartet(`${z}file:192.0.2.1/s/x.png`)).toBe(false);
        }
    });

    test('ohne solchen Leerraum sind beide Lesungen gleich — keine bisherige Erwartung geaendert', () => {
        const abweichend = [...ALLE_ERLAUBT, ...ALLE_GESPERRT].filter(
            x => erwartet(x) !== erwartetRoh(x)
        );
        expect(abweichend).toEqual([]);
    });

    test.each(UNICODE_ERLAUBT)('%j wird angenommen', url => {
        expect(validateAvatarURL(url)).toBe(true);
    });

    test.each(UNICODE_GESPERRT)('%j bleibt gesperrt', url => {
        expect(validateAvatarURL(url)).toBe(false);
    });

    test('angenommen heisst: der gespeicherte Wert wird angezeigt — ueber alle Listen', () => {
        const alle = [...ALLE_ERLAUBT, ...ALLE_GESPERRT, ...UNICODE_ERLAUBT, ...UNICODE_GESPERRT];
        const nichtAngezeigt = alle.filter(
            x =>
                !leer(x) &&
                validateAvatarURL(x) &&
                sichereBildquelle(gespeichert(x)) !== gespeichert(x)
        );
        expect(nichtAngezeigt).toEqual([]);
    });
});

// ============================================================
// AVATAR-DATEI A3 — die Vorschau im Charakterformular, ueber dieselben Tabellen
// ============================================================
/*
 * Pruefbefund nach bd06445d (soll): kein Unit-Test rief updateAvatarPreview()
 * (features/party/party-crud.js) auf, und Fall (d) von tests/e2e/features/bild-lokal.spec.js
 * blieb gruen mit einer halben Vorschau `/^(?:https?:\/\/|file:\/\/\/)/i` statt
 * sichereBildquelle(): sie zeigte `file:////host/…` und `file:///%5C%5Chost/…` als Bild (unter
 * Windows UNC) und data:image/ sowie relative Pfade nicht. A3: ein Bild genau dann, wenn
 * sichereBildquelle() den getrimmten Wert anzeigt — getrimmt wie saveCharacter() speichert —,
 * sonst der Platzhalter "?"; die Quelle als DOM-Eigenschaft, kein Element aus dem Wert (R1/R5).
 * Gefahren ueber ALLE Werte der Tabellen oben. Das Modul laeuft echt, im vm-Kontext mit dem
 * jsdom-Dokument der Suite und dem echten Datengrenzen-Block; jsdom laedt keine Bilder.
 */
describe('updateAvatarPreview — A3: die Vorschau im Charakterformular zeigt, was die Karte zeigt', () => {
    const PARTY_CRUD_PATH = path.join(__dirname, '../../features/party/party-crud.js');
    // Zeichen, die in HTML etwas bedeuten: die Quelle steht als Eigenschaft, kein Element entsteht
    const HTML_ZEICHEN = ['bilder/a&b.png', 'bilder/"><b id="x">x</b>.png'];
    const ALLE = [
        ...ALLE_ERLAUBT,
        ...ALLE_GESPERRT,
        ...UNICODE_ERLAUBT,
        ...UNICODE_GESPERRT,
        ...HTML_ZEICHEN
    ];
    let updateAvatarPreview;
    let vorschau;

    beforeAll(() => {
        const context = { window: {}, document, URL };
        vm.createContext(context);
        ladeDatengrenze(context);
        context.$ = id => document.getElementById(id);
        vm.runInContext(fs.readFileSync(PARTY_CRUD_PATH, 'utf8'), context);
        updateAvatarPreview = context.updateAvatarPreview;
    });

    beforeEach(() => {
        document.body.innerHTML = '<div id="cf-avatar-preview"></div>';
        vorschau = document.getElementById('cf-avatar-preview');
    });

    test('die Faelle tragen: Werte mit Bild, ohne Bild, und jede der vier Arten mit Bild', () => {
        const mitBild = ALLE.filter(x => sichereBildquelle(gespeichert(x)) !== '');
        expect(mitBild.length).toBeGreaterThan(20);
        expect(ALLE.length - mitBild.length).toBeGreaterThan(20);
        for (const art of [/^file:\/\/\//i, /^https?:/i, /^data:image\//i, /^[.\w]/]) {
            expect(mitBild.some(x => art.test(gespeichert(x)))).toBe(true);
        }
        expect(typeof updateAvatarPreview).toBe('function');
    });

    test.each(ALLE)(
        'Vorschau fuer %j: Bild genau dann, wenn sichereBildquelle() den getrimmten Wert anzeigt',
        url => {
            updateAvatarPreview(url);
            const quelle = gespeichert(url);
            const bilder = vorschau.querySelectorAll('img');
            if (sichereBildquelle(quelle) !== '') {
                expect(bilder.length).toBe(1);
                expect(bilder[0].getAttribute('src')).toBe(quelle);
                expect(vorschau.children.length).toBe(1);
            } else {
                expect(bilder.length).toBe(0);
                expect(vorschau.innerHTML).toBe('<span class="cf-avatar-placeholder">?</span>');
            }
        }
    );
});
