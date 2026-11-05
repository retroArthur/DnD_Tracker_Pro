/**
 * Versions-Konsistenz — die App sagt ueberall dieselbe Version
 *
 * DER BEFUND, aus dem diese Datei entstand. Der Impressum-Dialog
 * (`assets/templates/modals-tools.html`, `#about-modal`) nannte
 * "Version 2.4.0", waehrend `core/config.js` (`APP_CONFIG.VERSION`) und
 * `package.json` beide `2.6.1` fuehrten — zwei Nebenversionen zu alt, an dem
 * EINEN Ort der App, an dem ein Nutzer die Version nachsieht. Gemessen:
 *
 *   grep -n "Version 2.4.0" assets/templates/modals-tools.html  ->  590
 *   grep -n "VERSION:"       core/config.js                     ->  8: '2.6.1'
 *   grep -n '"version"'      package.json                       ->  3: "2.6.1"
 *
 * Die Zahl stand festgeschrieben in der Vorlage und las `APP_CONFIG.VERSION`
 * nicht. Der Weg zu diesem Dialog existiert auf dem Telefon erst seit dem
 * Punkte-Menue (MKOPF) — das Erste, was ein Spielleiter dort liest, war
 * falsch, und jede Fehlermeldung, die er von der Anzeige abschreibt, benennt
 * den falschen Stand.
 *
 * WARUM EINE EIGENE DATEI UND KEINE ZEILE IN docs-consistency.test.js. Dort
 * ist der Pruefgegenstand die DOKUMENTATION (CLAUDE.md, docs/bugfixes.md).
 * Hier ist er der QUELLCODE: drei Orte, die dieselbe Zahl fuehren muessen.
 *
 * WARUM DREI ORTE UND NICHT ZWEI. Die Vorlage traegt die Zahl als
 * RUECKFALLWERT (sichtbar, falls das Setzen beim Oeffnen je ausfaellt), die
 * Laufzeit setzt sie aus `APP_CONFIG.VERSION`, und `package.json` ist der
 * Stand, den ein Veroeffentlichungswerkzeug liest. Faellt einer der drei aus
 * dem Tritt, ist genau die Frage "welchen Stand habe ich eigentlich?"
 * wieder unbeantwortbar.
 *
 * Die Gegenprobe am BEDIENTEN Dialog (oeffnen, dann lesen) liegt in
 * `tests/e2e/features/mobil-kopfmenue.spec.js`, Fall (8).
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const CONFIG_PATH = path.join(REPO, 'core', 'config.js');
const PAKET_PATH = path.join(REPO, 'package.json');
const VORLAGE_PATH = path.join(REPO, 'assets', 'templates', 'modals-tools.html');
const AKTION_PATH = path.join(REPO, 'ui', 'actions', 'system-actions.js');

const configInhalt = fs.readFileSync(CONFIG_PATH, 'utf8');
const vorlageInhalt = fs.readFileSync(VORLAGE_PATH, 'utf8');
const aktionInhalt = fs.readFileSync(AKTION_PATH, 'utf8');
const paket = JSON.parse(fs.readFileSync(PAKET_PATH, 'utf8'));

/** `VERSION: '2.6.1'` aus core/config.js. */
function configVersion() {
    const t = configInhalt.match(/VERSION:\s*'([^']+)'/);
    return t ? t[1] : null;
}

/** Jede Versionsangabe der Form "Version X.Y.Z" im Impressum-Abschnitt. */
function vorlageVersionen() {
    const abschnitt = vorlageInhalt.match(/id="about-modal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    const text = abschnitt ? abschnitt[0] : vorlageInhalt;
    return Array.from(text.matchAll(/Version\s+(\d+\.\d+\.\d+)/g)).map(m => m[1]);
}

describe('VER-01: die drei Orte fuehren dieselbe Version', () => {
    test('core/config.js nennt eine Version der Form X.Y.Z', () => {
        expect(configVersion()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('package.json nennt dieselbe Version wie APP_CONFIG.VERSION', () => {
        expect(paket.version).toBe(configVersion());
    });

    test('der Impressum-Dialog nennt genau eine Version, und zwar dieselbe', () => {
        const gefunden = vorlageVersionen();
        expect(gefunden).toEqual([configVersion()]);
    });
});

describe('VER-02: die Anzeige wird zur Laufzeit aus APP_CONFIG gesetzt', () => {
    // WARUM DAS GEPRUEFT WIRD. Ein gleichgezogener Rueckfallwert in der
    // Vorlage allein waere die naechste Drift: er muesste bei jeder
    // Versionsanhebung von Hand mitgezogen werden, und genau das ist zweimal
    // ausgeblieben. Der Traeger (`#about-version`) und das Setzen beim Oeffnen
    // sind darum Teil der Zusicherung.
    test('die Vorlage traegt den Knoten #about-version', () => {
        expect(vorlageInhalt).toMatch(/id="about-version"/);
    });

    test('der Aktionszweig schreibt APP_CONFIG.VERSION in diesen Knoten', () => {
        const zweig = aktionInhalt.match(/show-about-modal[\s\S]{0,1200}/);
        expect(zweig).not.toBeNull();
        expect(zweig[0]).toMatch(/about-version/);
        expect(zweig[0]).toMatch(/APP_CONFIG[\s\S]{0,40}VERSION/);
    });
});
