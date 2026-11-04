/**
 * SPRACHEN-FREI — setCharLanguages() liest jede Form, normalisiert und zeigt freie Sprachen
 * (features/party/party-crud.js)
 *
 * Die Bedienwege stehen in tests/e2e/features/sprachen-frei.spec.js (Befund, Ursache und
 * Vertrag im Kopf dort). Diese Datei haelt fest, was am Bildschirm nicht oder nur ueber Umwege
 * zu sehen ist — an den Funktionen selbst:
 *
 *   U0  Die Werkbank traegt: 19 feste Haekchen der echten Vorlage, das ECHTE datenText().
 *   U1  R1–R6: die Normalisierungstabelle von W3 und W7 (und einige Formen mehr) gegen die
 *       erzeugten freien und die gesetzten festen Haekchen — Reihenfolge eingeschlossen (freie
 *       OBEN in der Reihenfolge des ersten Vorkommens, dann die 19 der Vorlage), dazu das
 *       versteckte select (= was 💾 speichert) und die Ausloeser-Anzeige. Das Modul wird
 *       geladen, BEVOR die Vorlage im Dokument steht: wer die festen Werte beim Laden des
 *       Moduls liest statt zur Aufrufzeit (gegen R3), sieht hier keine.
 *   U2  R8: setCharLanguages(A), dann setCharLanguages(B) direkt → keine Spur von A (19
 *       Eintraege, kein [data-frei]); A zweimal → jedes freie Haekchen einmal. Am Bildschirm
 *       nicht zu sehen, solange editChar() vorab cancelCharEdit() ruft (CHAR-HALBLADEN R4):
 *       das ist der einzige Waechter gegen m1 "freie nur in clear entfernt".
 *   U3  R8: clearCharLanguages() entfernt alle [data-frei], nichts gesetzt.
 *   U4  R5: ein freier Eintrag ist label.cf-lang-item > input[type=checkbox] + span, value und
 *       textContent woertlich, kein Element aus dem Markup; data-action
 *       "update-char-languages", gesetzt.
 *   U5  R1: kein Wurf fuer 7, true, false, 0, {}, ['x',[1],null], undefined, null.
 *   U6  R9: nach setCharLanguages() traegt #cf-languages-wrapper kein `open`.
 *
 * Gemessen am Basisstand 5d28d85f: 44 Faelle, 29 rot, 15 gruen. Rot: U1 in 23 von 30 Zeilen
 * (gruen die sieben, die die Basis schon richtig liest: Jon, der Text der festen Liste, der
 * Text mit NBSP um das Komma — ein Text wird getrimmt, eine Liste nicht —, null, undefined,
 * '' und []), U2 "dieselbe Liste zweimal" (es entsteht kein freies Haekchen), U4, U5 bei 7,
 * true und {} (`languages.split is not a function`) und U6. Gruen: U0, U2 "A, dann B" und U3
 * — am Basisstand gibt es keine freien Eintraege, die stehen bleiben koennten; sie waechtern
 * gegen m1 bzw. ein Leeren ohne Entfernen —, U5 bei false, 0, ['x',[1],null], undefined und
 * null. An der Fix-Skizze (R1–R10 woertlich, Kopie ausserhalb des Repos) 44 von 44 gruen;
 * an den Mutanten: m1 nur U2 "A, dann B"; m2 U1 Kai; m3 U1 Lia und U4; m4 U1 Cora, GEBÄRDEN,
 * Eik und "erstes Vorkommen"; m5 19 rot (jede Zeile mit freien Eintraegen, U2 zweimal); m6 U1
 * Tex und Zed; m7 U1 Ole und Sam; m8 U1 Uwe, Hal und ['x',[1],null] (dazu held-laden HL1
 * languages als Objekt); m9 U6. Einzelheiten im Katalogeintrag SPRACHEN-FREI
 * (docs/bugfixes.md).
 *
 * Das Modul laeuft echt wie in tests/unit/avatar-vorschau.test.js: vm-Kontext mit dem
 * jsdom-Dokument der Suite, der echten Vorlage assets/templates/view-party.html, dem echten
 * Datengrenzen-Block und dem ECHTEN datenText() aus utils/basic.js
 * (tests/unit/helpers/datengrenze-block.js, ladeDatenText()), dazu die echte
 * utils/form-helpers.js. Attrappen nur fuer, was nicht zu den Sprachen gehoert (EntityLookup,
 * esc, sanitizeHTML, getProfBonus).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ladeDatengrenze, ladeDatenText } = require('./helpers/datengrenze-block.js');

const WURZEL = path.join(__dirname, '..', '..');
const PARTY_CRUD = path.join(WURZEL, 'features', 'party', 'party-crud.js');
const FORM_HELPERS = path.join(WURZEL, 'utils', 'form-helpers.js');
const VORLAGE = path.join(WURZEL, 'assets', 'templates', 'view-party.html');

/** Geschuetztes Leerzeichen (U+00A0), als Code sichtbar. */
const NBSP = String.fromCharCode(0xa0);
/** Kombinierendes Trema (U+0308): 'a' + TREMA ist NFD-ä. */
const TREMA = String.fromCharCode(0x308);
/** 'Gebärden' in NFC (ä = U+00E4), wie die Vorlage es traegt. */
const GEBAERDEN_NFC = 'Geb' + String.fromCharCode(0xe4) + 'rden';
const LANG_MIT_KOMMAS =
    'Telepathie auf 36 m, nur mit Kreaturen, die mindestens eine Sprache verstehen und sehen';
const LIA = ['<b>Fett</b>', 'Kauder"welsch', "O'Brien"];
const LEER_ANZEIGE = 'Sprachen wählen...';

/** Die 19 Werte der Vorlage, in ihrer Reihenfolge. */
const FEST = [
    'Gemein',
    'Zwergisch',
    'Elfisch',
    'Riese',
    'Gnomisch',
    'Goblin',
    'Halbling',
    'Orkisch',
    'Druidisch',
    'Diebessprache',
    'Drakonisch',
    'Tiefensprache',
    'Infernal',
    'Sylvan',
    'Unterreich',
    'Abyssisch',
    'Celestisch',
    GEBAERDEN_NFC,
    'Primordial'
];

/** @type {any} */
let ctx;
const vorlage = fs.readFileSync(VORLAGE, 'utf8');

beforeAll(() => {
    ctx = { window: {}, document, URL, Event, InputEvent: window.InputEvent };
    vm.createContext(ctx);
    ladeDatengrenze(ctx);
    ladeDatenText(ctx);
    ctx.$ = (/** @type {string} */ id) => document.getElementById(id);
    ctx.esc = (/** @type {any} */ s) => String(s);
    ctx.sanitizeHTML = (/** @type {any} */ s) => (s == null ? '' : String(s));
    ctx.getProfBonus = (/** @type {number} */ stufe) =>
        2 + Math.floor((Math.max(1, stufe) - 1) / 4);
    ctx.EntityLookup = { character: () => null };
    // Das Dokument ist hier noch LEER: die festen Werte muessen zur Aufrufzeit gelesen werden
    // (R3), nicht beim Laden des Moduls.
    document.body.innerHTML = '';
    vm.runInContext(fs.readFileSync(FORM_HELPERS, 'utf8'), ctx, {
        filename: 'utils/form-helpers.js'
    });
    vm.runInContext(fs.readFileSync(PARTY_CRUD, 'utf8'), ctx, {
        filename: 'features/party/party-crud.js'
    });
});

beforeEach(() => {
    document.body.innerHTML = vorlage;
});

/** @returns {HTMLElement} */
function dropdown() {
    return /** @type {HTMLElement} */ (document.getElementById('cf-lang-dropdown'));
}

/** Das Menue, wie es steht. */
function stand() {
    const eintraege = [...dropdown().querySelectorAll('input[type="checkbox"]')].map(el => {
        const cb = /** @type {HTMLInputElement} */ (el);
        const label = cb.closest('.cf-lang-item');
        return {
            wert: cb.value,
            text: label ? label.textContent : null,
            an: cb.checked,
            frei: !!cb.closest('#cf-lang-dropdown [data-frei]'),
            markiert: !!label && label.classList.contains('selected')
        };
    });
    const select = /** @type {HTMLSelectElement} */ (document.getElementById('char-languages'));
    return {
        eintraege,
        freiMarken: dropdown().querySelectorAll('[data-frei]').length,
        anzeige: (document.getElementById('cf-lang-display')?.textContent || '').trim(),
        auswahl: [...select.options].filter(o => o.selected).map(o => o.value),
        offen: !!document.getElementById('cf-languages-wrapper')?.classList.contains('open')
    };
}

/** Die Logik von updateCharLanguages() (R5 laesst sie unveraendert). @param {string[]} a */
function anzeigeZu(a) {
    if (a.length === 0) return LEER_ANZEIGE;
    if (a.length <= 3) return a.join(', ');
    return `${a.slice(0, 2).join(', ')} +${a.length - 2}`;
}

/**
 * Ein Menue, das genau diese freien (oben, gesetzt) und festen (gesetzt) Haekchen traegt.
 * @param {ReturnType<typeof stand>} s @param {string[]} frei @param {string[]} fest
 */
function erwarteMenue(s, frei, fest) {
    expect({
        werte: s.eintraege.map(e => e.wert),
        freie: s.eintraege.filter(e => e.frei).map(e => `${e.an ? '[x]' : '[ ]'} ${e.wert}`),
        festGesetzt: s.eintraege.filter(e => !e.frei && e.an).map(e => e.wert),
        uneinig: s.eintraege.filter(e => e.markiert !== e.an || e.text !== e.wert).map(e => e.wert),
        auswahl: s.auswahl,
        anzeige: s.anzeige
    }).toEqual({
        werte: [...frei, ...FEST],
        freie: frei.map(w => `[x] ${w}`),
        festGesetzt: fest,
        uneinig: [],
        auswahl: [...frei, ...fest],
        anzeige: anzeigeZu([...frei, ...fest])
    });
}

describe('SPRACHEN-FREI — setCharLanguages() an der Funktion', () => {
    test('(U0) die Werkbank traegt: 19 feste Haekchen der Vorlage, das echte datenText()', () => {
        expect(typeof ctx.setCharLanguages).toBe('function');
        expect(typeof ctx.clearCharLanguages).toBe('function');
        expect(typeof ctx.datenText).toBe('function');
        expect([ctx.datenText(42), ctx.datenText(true), ctx.datenText(0)]).toEqual([
            '42',
            'true',
            '0'
        ]);
        expect([ctx.datenText({ x: 1 }), ctx.datenText(['a']), ctx.datenText(null)]).toEqual([
            '',
            '',
            ''
        ]);
        expect(stand().eintraege.map(e => e.wert)).toEqual(FEST);
        expect(stand().freiMarken).toBe(0);
    });

    /**
     * Eingabe, die freien Eintraege (oben, in dieser Reihenfolge), die gesetzten festen.
     * @type {Array<[string, any, string[], string[]]>}
     */
    const TABELLE = [
        [
            'Bram: eine freie Sprache',
            ['Zwergisch', 'Kauderwelsch'],
            ['Kauderwelsch'],
            ['Zwergisch']
        ],
        [
            'Cora: Gross-/Kleinschreibung (R3)',
            ['zwergisch', 'ELFISCH'],
            [],
            ['Zwergisch', 'Elfisch']
        ],
        [
            'Dorn: Leerraum und NBSP am Rand (R2)',
            [' Elfisch ', 'Gemein' + NBSP],
            [],
            ['Gemein', 'Elfisch']
        ],
        ['Kai: NFD (R2)', ['Geba' + TREMA + 'rden'], [], [GEBAERDEN_NFC]],
        [
            'GEBÄRDEN in Grossbuchstaben (toLocaleLowerCase de)',
            ['GEB' + String.fromCharCode(0xc4) + 'RDEN'],
            [],
            [GEBAERDEN_NFC]
        ],
        [
            'Eik: Dubletten (R4)',
            ['Gemein', 'Gemein', 'Kauderwelsch', 'kauderwelsch'],
            ['Kauderwelsch'],
            ['Gemein']
        ],
        [
            'erstes Vorkommen gewinnt samt Schreibweise (R4)',
            ['KAUDERWELSCH', 'Kauderwelsch'],
            ['KAUDERWELSCH'],
            []
        ],
        [
            'Fenn: Text mit leerem Eintrag (R1)',
            'Gemein, Kauderwelsch, , Elfisch',
            ['Kauderwelsch'],
            ['Gemein', 'Elfisch']
        ],
        [
            'Text mit NBSP um das Komma (R2)',
            'Gemein' + NBSP + ',' + NBSP + 'Elfisch',
            [],
            ['Gemein', 'Elfisch']
        ],
        ['Text der festen Liste (Kontrolle)', 'Gemein, Zwergisch', [], ['Gemein', 'Zwergisch']],
        ['Gus: keine Uebersetzung (R3)', ['Common', 'Dwarvish'], ['Common', 'Dwarvish'], []],
        [
            'Synonyme bleiben frei (R3)',
            ['Gebärdensprache', 'Sylvan (Fey)', 'Riesisch'],
            ['Gebärdensprache', 'Sylvan (Fey)', 'Riesisch'],
            []
        ],
        [
            'Tex: Listenelement mit Komma nicht zerlegt (R1)',
            ['Gemein, Elfisch'],
            ['Gemein, Elfisch'],
            []
        ],
        [
            'Yan: Zeilenumbruch im Text wird Leerzeichen (R2)',
            'Gemein\nElfisch',
            ['Gemein Elfisch'],
            []
        ],
        ['Xan: Semikolon nicht zerlegt (R1)', 'Gemein; Elfisch', ['Gemein; Elfisch'], []],
        [
            'Leerraumfolge innen wird ein Leerzeichen (R2)',
            ['Sumpf' + NBSP + ' \t sprache'],
            ['Sumpf sprache'],
            []
        ],
        [
            'Zed: vier freie oben, Gemein fest (R5, R6)',
            ['Gemein', LANG_MIT_KOMMAS, 'Kauderwelsch', 'Sumpfsprache', 'Altelfisch'],
            [LANG_MIT_KOMMAS, 'Kauderwelsch', 'Sumpfsprache', 'Altelfisch'],
            ['Gemein']
        ],
        [
            'Jon: nur feste Werte (Kontrolle)',
            ['Elfisch', 'Gemein', 'Zwergisch', 'Riese'],
            [],
            ['Gemein', 'Zwergisch', 'Elfisch', 'Riese']
        ],
        ['Lia: Markup und Anfuehrungszeichen woertlich (R5)', LIA, LIA, []],
        ['Pia: 7 (R1)', 7, ['7'], []],
        ['Vic: true (R1)', true, ['true'], []],
        ['Ole: false, kein Kurzschluss (R1)', false, ['false'], []],
        ['Sam: 0, kein Kurzschluss (R1)', 0, ['0'], []],
        ['Uwe: Objekt faellt weg (R1)', { 0: 'Gemein', 1: 'Elfisch' }, [], []],
        [
            'Hal: gemischte Liste — datenText je Element (R1)',
            ['Gemein', 42, null, '', { x: 1 }, ['Elfisch'], true],
            ['42', 'true'],
            ['Gemein']
        ],
        ["['x', [1], null] (R1)", ['x', [1], null], ['x'], []],
        ['null (Kontrolle)', null, [], []],
        ['undefined (Kontrolle)', undefined, [], []],
        ["'' (Kontrolle)", '', [], []],
        ['[] (Kontrolle)', [], [], []]
    ];
    test.each(TABELLE)('(U1) %s', (_titel, eingabe, frei, fest) => {
        expect(() => ctx.setCharLanguages(eingabe)).not.toThrow();
        erwarteMenue(stand(), frei, fest);
    });

    test('(U2) R8: setCharLanguages(A), dann setCharLanguages(B) direkt — keine Spur von A', () => {
        ctx.setCharLanguages(['Zwergisch', 'Kauderwelsch', 'Sumpfsprache']);
        // auch ein abgewaehlter freier Eintrag von A darf nicht stehen bleiben (R7 → R8)
        const frei = /** @type {HTMLInputElement|null} */ (
            dropdown().querySelector('[data-frei] input, input[data-frei]')
        );
        if (frei) frei.checked = false;
        ctx.setCharLanguages(['Gemein', 'Elfisch']);
        const s = stand();
        expect(s.freiMarken).toBe(0);
        erwarteMenue(s, [], ['Gemein', 'Elfisch']);
    });

    test('(U2) R8: dieselbe Liste zweimal — jedes freie Haekchen genau einmal', () => {
        ctx.setCharLanguages(['Zwergisch', 'Kauderwelsch', 'Sumpfsprache']);
        ctx.setCharLanguages(['Zwergisch', 'Kauderwelsch', 'Sumpfsprache']);
        erwarteMenue(stand(), ['Kauderwelsch', 'Sumpfsprache'], ['Zwergisch']);
    });

    test('(U3) R8: clearCharLanguages() entfernt alle freien Eintraege, nichts gesetzt', () => {
        ctx.setCharLanguages(['Kauderwelsch', 'Gemein', 'Sumpfsprache']);
        ctx.clearCharLanguages();
        const s = stand();
        expect(s.freiMarken).toBe(0);
        erwarteMenue(s, [], []);
    });

    test('(U4) R5: ein freier Eintrag ist label > input + span, Wert und Text woertlich, kein Element aus dem Markup', () => {
        ctx.setCharLanguages(LIA);
        const labels = [...dropdown().querySelectorAll('.cf-lang-item')].filter(
            l => !!l.querySelector('input')?.closest('#cf-lang-dropdown [data-frei]')
        );
        expect(
            labels.map(l => {
                const input = /** @type {HTMLInputElement} */ (l.querySelector('input'));
                const span = l.querySelector('span');
                return {
                    tag: l.tagName,
                    kinder: [...l.children].map(k => k.tagName),
                    typ: input.type,
                    aktion: input.getAttribute('data-action'),
                    an: input.checked,
                    wert: input.value,
                    text: span?.textContent,
                    elementeImText: span?.childElementCount
                };
            })
        ).toEqual(
            LIA.map(w => ({
                tag: 'LABEL',
                kinder: ['INPUT', 'SPAN'],
                typ: 'checkbox',
                aktion: 'update-char-languages',
                an: true,
                wert: w,
                text: w,
                elementeImText: 0
            }))
        );
        expect(dropdown().querySelectorAll('b').length).toBe(0);
    });

    test.each([
        ['7', 7],
        ['true', true],
        ['false', false],
        ['0', 0],
        ['{}', {}],
        ["['x', [1], null]", ['x', [1], null]],
        ['undefined', undefined],
        ['null', null]
    ])('(U5) R1: kein Wurf fuer %s — auch nicht beim Leeren danach', (_titel, wert) => {
        expect(() => ctx.setCharLanguages(wert)).not.toThrow();
        expect(() => ctx.clearCharLanguages()).not.toThrow();
        expect(stand().eintraege.map(e => e.wert)).toEqual(FEST);
    });

    test('(U6) R9: setCharLanguages() schliesst das Sprachmenue', () => {
        const huelle = /** @type {HTMLElement} */ (document.getElementById('cf-languages-wrapper'));
        huelle.classList.add('open');
        ctx.setCharLanguages(['Gemein', 'Kauderwelsch']);
        expect(stand().offen).toBe(false);
    });
});
