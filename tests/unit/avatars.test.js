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
    // validateAvatarURL() ruft `new URL(trimmed)` auf — vm.createContext()
    // erbt KEINE Host-Globals, daher muss die echte Node-URL-Klasse explizit
    // durchgereicht werden (sonst wirft new URL() ReferenceError, wird vom
    // try/catch der Funktion geschluckt, und alle absoluten http/https-URLs
    // wuerden faelschlich ueber den relative-Pfad-Fallback laufen).
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
        expect(validateAvatarURL('file:///etc/passwd')).toBe(false);
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
 * sichereBildquelle() anzeigt. Die Ablehnung von `file:` in der Eingabe bleibt (Offen (15),
 * eine eigene Nutzerentscheidung).
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

    test('ein lokaler Dateipfad wird angezeigt, die Eingabe lehnt ihn weiter ab (Offen (15))', () => {
        expect(sichereBildquelle('file:///C:/Bilder/held.png')).toBe('file:///C:/Bilder/held.png');
        expect(validateAvatarURL('file:///C:/Bilder/held.png')).toBe(false);
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

    test('eingebettetes Steuerzeichen in "file:" wird erkannt und abgelehnt', () => {
        expect(validateAvatarURL('fi\tle:///etc/passwd')).toBe(false);
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

    // Hinweis zur Testbarkeit: fuer alle obigen Beispiele (javascript:/file:/
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
