/**
 * CHAR-HALBLADEN — editChar() laedt total und atomar (features/party/party-crud.js)
 *
 * Die Bedienwege stehen in tests/e2e/features/held-altdaten.spec.js (Befund, Ursache und
 * Vertrag im Kopf dort). Diese Datei haelt fest, was am Bildschirm nicht zu erzwingen ist:
 *
 *   HL1  R1/R2: 12 Felder x 7 Formen (Zahl, Text, Liste, Objekt, null, fehlend, true) nach
 *        editChar(Aria): editChar(Xaver') wirft nicht, das Formular ist offen, die
 *        Bearbeiten-ID ist 2, jedes Steuerelement ausserhalb des Altfelds traegt den Wert des
 *        Kontroll-Xaver, im Altfeld steht nach R5 der Leerwert (speed, resistances,
 *        immunities, attacks) bzw. kein Wert von Aria (alle anderen).
 *        languages ist die Ausnahme (Abgrenzung mit SPRACHEN-FREI): den Leser baut erst
 *        SPRACHEN-FREI, setCharLanguages() darf bei 42/{x:1}/true weiter werfen. Gesichert
 *        ist nur "kein Halbladen, nichts von Aria": ENTWEDER offen und geladen wie oben, ODER
 *        (der catch-Zweig, R3) leer und zu, mit genau einer Fehlermeldung. Welches von beiden,
 *        legt diese Datei nicht fest.
 *   HL2  R3: ein unerwarteter Fehler beim Laden — eingeschleust frueh (updateAttrMod), mittig
 *        (setCharLanguages), spaet (buildAttackRowHTML) — verlaesst editChar() nicht, und
 *        danach ist das Formular leer und zu: keine Bearbeiten-ID, kein Wert von Aria, kein
 *        Teilwert von Xaver; genau eine Meldung showToast(…, 'error') und genau ein Eintrag
 *        ueber ErrorHandler.log. Am Bildschirm wirft mit gueltigen Daten nichts — darum hier.
 *        **"Frueh" weicht bewusst vom Vertrag ab:** der Vertrag (WAECHTER, HL2) schleust ein
 *        "updateAttrMod wirft immer"; hier wirft es nur fuer jeden Wert ausser der Vorgabe 10.
 *        Unter der Vertragsinjektion halten R3 und E5 NICHT, gemessen (Unit und am Bildschirm,
 *        CHAR-HALBLADEN Offen (4) in docs/bugfixes.md): ID '', Formular zu, genau eine
 *        Meldung — aber char-dex/con/int/wis/cha tragen Arias 14/12/18/13/15 und alle sechs
 *        -mod-Anzeigen Arias Modifikatoren (11 Werte von Aria). Ursache: BEIDE
 *        cancelCharEdit()-Aufrufe (vorab und im catch) setzen die Attribute ueber
 *        resetAttributes(…, updateAttrMod) (utils/form-helpers.js) zurueck, und
 *        resetAttributes() faengt den Wurf beim ersten Attribut still und laesst die uebrigen
 *        fuenf stehen; die -mod-Anzeigen schreibt nur updateAttrMod(). Das ist ein Mangel des
 *        Leerens, nicht von editChar(); R9 laesst cancelCharEdit() unveraendert, und auch ein
 *        robustes resetAttributes() liesse die sechs Anzeigen stehen. Eigener Vorgang.
 *   HL3  E3: speed als Zahl (App-Altform 30) waehlt die Option mit data-ft gleich der Zahl,
 *        sonst '9m|30ft.' — 30, 25, 40, 35, 0.
 *   HL4  R6: Laden schreibt nie nach D — Aria und Xaver' sind nach editChar(1), editChar(2)
 *        bytegleich (toStrictEqual gegen einen JSON-Abzug), fuer die ganze Matrix aus HL1 und
 *        die ausdruecklichen R6-Formen (wie HA8 der Spec). Ob editChar() wirft, urteilt HL1.
 *   HL5  R5: resistances/immunities als Text laden wie bisher per Teilstring
 *        (String.includes): 'Gift' markiert Gift, 'Gift, Säure (halbiert)' Gift und Säure usw.
 *        Am Bildschirm nur ueber Strg+K erreichbar (renderParty wirft bei Text, E6) — darum
 *        hier.
 *   HL6  R5: speed als Liste waehlt '9m|30ft.', auch wenn ihr Text eine Option traefe
 *        (['12m'], ['8m|25ft.'], ['12m|40ft.']; HL1 saet nur ['abc']).
 *   HL7  E5: zwei Ladefehler kurz hintereinander melden sich beide — mit dem ECHTEN
 *        ErrorHandler aus render/helpers.js, dessen showError() jede Meldung binnen 2 s nach
 *        der vorigen verschluckt (der Grund, aus dem E5 showToast verlangt). Die Attrappe der
 *        uebrigen Faelle kennt nur log().
 *   HL8  R4, die Schutzwirkung: ein Steuerelement, das editChar() nicht laedt
 *        (setCharLanguages() als No-op, "vergessen"), traegt danach den Leerwert, nichts von
 *        Aria.
 *
 * Gemessen am Basisstand 0f63c0be: HL1 17 rot (genau die 17 werfenden Kombinationen: speed
 * als Zahl, Liste, Objekt, true; resistances, immunities, languages je als Zahl, Objekt,
 * true; attacks als Zahl, Text, Objekt, true — der Wurf verlaesst editChar()), HL2 3 rot,
 * HL3 4 rot (0 ist falsch und war schon gruen); HL0 gruen. HL4–HL8 kamen nach dem Fix auf
 * Befunde der Pruefung hinzu; am Basisstand sind HL4 und HL5 gruen (die Basis schreibt nicht
 * nach D und las Text schon so), HL6 3 rot (die Liste warf), HL7 und HL8 rot. Gegenproben an
 * Kopien von party-crud.js (nicht eingecheckt; Namen wie in der Spec, die Varianten aendern
 * setCharLanguages() nicht):
 *
 *   fix  totale Leser, Leeren vorab, catch → cancelCharEdit(), ID zuletzt     alles gruen
 *        (ebenso mit der Bedingung `typeof languages === 'string'` in setCharLanguages(),
 *        also wenn SPRACHEN-FREI die Sprachen offen laedt)
 *   m1   nur Leeren vorab                                         HL1 17, HL2 3, HL3 4 rot
 *   m2   nur totale Leser (kein catch)                            HL1 languages x3, HL2 3 rot
 *   m3   ohne catch                                               HL1 languages x3, HL2 3 rot
 *   m4   ID zuerst, mit catch                                     gruen — keine Regel
 *   m5   Avatar ueber datenText (im Harness nicht geladen)        87 rot, auch avatar-vorschau U3
 *   m6   ohne Leeren vorab                                        HL8 rot (dazu HA9 der Spec)
 *   m7   catch ohne cancelCharEdit()                              HL1 languages x3, HL2 3 rot
 *   m8   speed als Zahl immer '9m|30ft.' (E3 "immer die Vorgabe") HL3 25 und 40 rot
 *   m9   Avatar wie heute (`ch.avatar || ''`)                     gruen — das haelt HA7 der Spec
 *   m12  catch meldet ueber ErrorHandler.showError()              HL7 rot (dazu HL1 x3, HL2 3:
 *                                                                 die Attrappe kennt kein
 *                                                                 showError)
 *   m13  resistances/immunities nur als Liste, Text ohne Chips    HL5 4 rot
 *   m14  vorab nur das Sprachmenue schliessen statt
 *        cancelCharEdit()                                         HL8 rot
 *   m17  speed, das keine Zahl ist, per String()                  HL6 3 rot
 *   m23  Laden schreibt speed zurueck (`ch.speed = speedVal`)     HL4 6 rot (speed ausser Text)
 *   m24  Laden schreibt avatar zurueck (`ch.avatar = ''`)         HL4 6 rot (avatar ausser Text)
 *
 * Das Modul laeuft echt wie in tests/unit/avatar-vorschau.test.js: vm-Kontext mit dem
 * jsdom-Dokument der Suite, der echten Vorlage assets/templates/view-party.html, dem echten
 * Datengrenzen-Block (sichereBildquelle() fuer die Vorschau) und der echten clearFormFields().
 * Attrappen nur fuer EntityLookup, esc, sanitizeHTML, getProfBonus, showToast und
 * ErrorHandler — die beiden letzten zaehlen, unter ihrem globalen Namen UND unter window;
 * HL7 setzt dafuer den echten ErrorHandler aus render/helpers.js ein (eigener vm-Kontext).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ladeDatengrenze } = require('./helpers/datengrenze-block.js');

const WURZEL = path.join(__dirname, '..', '..');
const PARTY_CRUD = path.join(WURZEL, 'features', 'party', 'party-crud.js');
const FORM_HELPERS = path.join(WURZEL, 'utils', 'form-helpers.js');
const RENDER_HELPERS = path.join(WURZEL, 'render', 'helpers.js');
const VORLAGE = path.join(WURZEL, 'assets', 'templates', 'view-party.html');

const BILD_A =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGM4IScHRwzEcQCxYxBBO0tjggAAAABJRU5ErkJggg==';
const BILD_X =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAIAAABvrngfAAAAEUlEQVR4nGOQkzuBhhhoKwQADRIkkRAX1DgAAAAASUVORK5CYII=';

/** @param {number[]} maxe */
function plaetze(maxe) {
    /** @type {Record<number, {max: number, current: number}>} */
    const s = {};
    for (let i = 0; i <= 9; i++) s[i] = { max: maxe[i] || 0, current: maxe[i] || 0 };
    return s;
}

/** Aria: vollstaendig; jeder Wert weicht von Xaver UND vom Leerwert des Formulars ab. */
const ARIA = {
    id: 1,
    name: 'Aria',
    playerName: 'Anna',
    characterClass: 'Magier',
    subclass: 'Bannmagie',
    race: 'Elf',
    level: 5,
    background: 'Weise',
    alignment: 'NG',
    weight: 60,
    height: 170,
    attributes: { str: 8, dex: 14, con: 12, int: 18, wis: 13, cha: 15 },
    saveProficiencies: { int: true, wis: true },
    hpCurrent: 22,
    hpMax: 27,
    tempHp: 3,
    armorClass: 12,
    initiative: 2,
    speed: '12m|40ft.',
    hitDice: '5d6',
    passivePerception: 11,
    inspiration: true,
    skillProficiencies: { arcana: true, history: true },
    skillExpertise: { arcana: true },
    attacks: [{ name: 'Dolch', attackBonus: 4, damage: '1d4+2', damageType: 'Stich' }],
    resistances: ['Feuer'],
    immunities: ['Blitz'],
    languages: ['Elfisch', 'Drakonisch'],
    spellSlots: plaetze([3, 4, 3, 2]),
    currency: { pm: 1, gm: 50, em: 3, sm: 7, km: 9 },
    notes: '<p>Aria-Notiz</p>',
    avatar: BILD_A
};

/** Xaver: legitim, in jedem von editChar() gelesenen Feld anders als Aria. */
const XAVER = {
    id: 2,
    name: 'Xaver',
    playerName: 'Xenia',
    characterClass: 'Kämpfer',
    subclass: 'Champion',
    race: 'Zwerg',
    level: 3,
    background: 'Soldat',
    alignment: 'LN',
    weight: 80,
    height: 140,
    attributes: { str: 16, dex: 12, con: 15, int: 9, wis: 11, cha: 8 },
    saveProficiencies: { str: true, con: true },
    hpCurrent: 28,
    hpMax: 31,
    tempHp: 4,
    armorClass: 18,
    initiative: 1,
    speed: '8m|25ft.',
    hitDice: '3d10',
    passivePerception: 13,
    inspiration: false,
    skillProficiencies: { athletics: true, perception: true },
    skillExpertise: { athletics: true },
    attacks: [{ name: 'Streitaxt', attackBonus: 5, damage: '1d8+3', damageType: 'Hieb' }],
    resistances: ['Gift'],
    immunities: ['Kälte'],
    languages: ['Gemein', 'Zwergisch'],
    spellSlots: plaetze([0, 2]),
    currency: { pm: 2, gm: 12, em: 4, sm: 30, km: 5 },
    notes: '<p>Xaver-Notiz</p>',
    avatar: BILD_X
};

/** Markiert ein Feld, das FEHLEN soll. */
const FEHLT = Symbol('fehlt');

/**
 * Xaver mit EINER Abweichung.
 * @param {string} feld
 * @param {any} wert - FEHLT entfernt das Feld
 */
function xaverMit(feld, wert) {
    /** @type {Record<string, any>} */
    const x = JSON.parse(JSON.stringify(XAVER));
    if (wert === FEHLT) delete x[feld];
    else x[feld] = wert;
    return x;
}

/** Die sieben Formen der Messung. */
const FORMEN = [
    ['Zahl', 42],
    ['Text', 'abc'],
    ['Liste', ['abc']],
    ['Objekt', { x: 1 }],
    ['null', null],
    ['fehlend', FEHLT],
    ['true', true]
];

/** Die Felder, deren Form editChar() liest (die Kritik: "12 Felder"). */
const FELDER = [
    'speed',
    'resistances',
    'immunities',
    'languages',
    'attacks',
    'avatar',
    'notes',
    'spellSlots',
    'currency',
    'attributes',
    'skillProficiencies',
    'saveProficiencies'
];

/** Die Felder, deren Leser R5 festlegt: dort steht bei jeder nicht darstellbaren Form der
 *  Leerwert des Formulars (speed '9m|30ft.', keine Chips, keine Angriffszeile). Fuer eine
 *  Liste in `attacks` gilt "wie heute" (eine Zeile je Eintrag) — dort nur: nichts von Aria. */
const R5_LEERWERT = new Set(['speed', 'resistances', 'immunities', 'attacks']);

/**
 * Gehoert ein Schluessel aus formularStand() zu diesem Datenfeld?
 * @param {string} feld
 * @param {string} k
 */
function gehoertZu(feld, k) {
    switch (feld) {
        case 'speed':
            return k === 'char-speed' || k === 'char-speed-ft';
        case 'resistances':
            return k.startsWith('char-resistances:');
        case 'immunities':
            return k.startsWith('char-immunities:');
        case 'languages':
            return (
                k.startsWith('cf-lang-dropdown:') ||
                k === 'char-languages' ||
                k === 'cf-lang-display'
            );
        case 'attacks':
            return k === 'angriffe';
        case 'avatar':
            return k === 'char-avatar' || k === 'cf-avatar-preview';
        case 'notes':
            return k === 'char-notes';
        case 'spellSlots':
            return k.startsWith('char-slot-');
        case 'currency':
            return ['char-pm', 'char-gm', 'char-em', 'char-sm', 'char-km'].includes(k);
        case 'attributes':
            return /^char-(str|dex|con|int|wis|cha)(-mod)?$/.test(k);
        case 'skillProficiencies':
            return k.startsWith('char-skill-') && !k.startsWith('char-skill-exp-');
        case 'saveProficiencies':
            return k.startsWith('char-save-');
        default:
            throw new Error(`gehoertZu: unbekanntes Feld ${feld}`);
    }
}

/**
 * Das Charakterformular, wie es steht: JEDES Steuerelement in #char-form (auch eines, das es
 * heute noch nicht gibt), dazu die Anzeigen (Modifikatoren, Fuss, Sprachen, Vorschau), die
 * Angriffszeilen und ob das Formular offen ist.
 * @returns {Record<string, any>}
 */
function formularStand() {
    const form = /** @type {HTMLElement} */ (document.getElementById('char-form'));
    /** @type {Record<string, any>} */
    const r = {};
    r.offen = form.classList.contains('open');
    r['char-form-icon'] = document.getElementById('char-form-icon')?.textContent ?? null;
    let ohneId = 0;
    for (const el of form.querySelectorAll('input, select, textarea, [contenteditable]')) {
        if (el.closest('#cf-attacks-container')) continue;
        const e = /** @type {HTMLInputElement} */ (el);
        const gruppe = e.closest('#char-resistances, #char-immunities, #cf-lang-dropdown');
        const k =
            gruppe && e.type === 'checkbox'
                ? `${gruppe.id}:${e.value}`
                : e.id || `ohne-id-${ohneId++}`;
        if (e.getAttribute('contenteditable') === 'true') {
            r[k] = e.innerHTML;
        } else if (e.type === 'checkbox' || e.type === 'radio') {
            const traeger = e.closest('.cf-chip, .cf-lang-item');
            r[k] = traeger
                ? `${e.checked}|${traeger.classList.contains('selected') ? 'markiert' : 'unmarkiert'}`
                : e.checked;
        } else if (e.tagName === 'SELECT' && /** @type {any} */ (e).multiple) {
            r[k] = [.../** @type {any} */ (e).options]
                .map(o => (o.selected ? o.value : `(${o.value})`))
                .join(',');
        } else {
            r[k] = e.value;
        }
    }
    for (const el of form.querySelectorAll('[id$="-mod"], #char-speed-ft, #cf-lang-display')) {
        r[el.id] = (el.textContent || '').trim();
    }
    const vorschau = /** @type {HTMLElement} */ (document.getElementById('cf-avatar-preview'));
    const bild = vorschau.querySelector('img');
    r['cf-avatar-preview'] = bild
        ? `Bild ${bild.getAttribute('src')}`
        : `Text ${(vorschau.textContent || '').trim()}`;
    r.angriffe = [...form.querySelectorAll('#cf-attacks-container .cf-attack-row')]
        .map(z =>
            [...z.querySelectorAll('input')]
                .map(i => /** @type {HTMLInputElement} */ (i).value)
                .join('/')
        )
        .join(' | ');
    return r;
}

/**
 * Schluessel, die einen Wert von Aria tragen: gleich Arias Stand, aber weder gleich dem
 * Kontroll-Xaver noch dem Leerwert (der koennte auch aus einem Leeren stammen).
 * @param {Record<string, any>} z
 */
function arienWerte(z) {
    return Object.keys(z).filter(
        k =>
            z[k] === STAND.aria[k] &&
            STAND.aria[k] !== STAND.kontrolle[k] &&
            STAND.aria[k] !== STAND.leer[k]
    );
}

/** Arias Sprachen, wo immer sie im Formular stehen (Haken, verborgene Liste, Anzeige). */
function arienSprachen(/** @type {Record<string, any>} */ z) {
    return ARIA.languages.filter(
        l =>
            String(z[`cf-lang-dropdown:${l}`]).startsWith('true') ||
            String(z['char-languages']).split(',').includes(l) ||
            String(z['cf-lang-display']).includes(l)
    );
}

/** @type {any} */
let ctx;
const vorlage = fs.readFileSync(VORLAGE, 'utf8');
/** @type {Map<number, any>} */
const HELDEN = new Map();
/** @type {Array<[string, string|undefined]>} */
const meldungen = [];
/** @type {Array<[string, unknown]>} */
const protokoll = [];
/** Arias Stand, der Kontroll-Xaver und das leere Formular — gemessen mit dem Modul selbst. */
const STAND =
    /** @type {{ aria: Record<string, any>, kontrolle: Record<string, any>, leer: Record<string, any> }} */ ({});

/** @type {Record<string, Function>} */
let echt;

beforeAll(() => {
    ctx = { window: {}, document, URL, Event, InputEvent: window.InputEvent };
    vm.createContext(ctx);
    ladeDatengrenze(ctx);
    ctx.$ = (/** @type {string} */ id) => document.getElementById(id);
    ctx.esc = (/** @type {any} */ s) => String(s);
    ctx.sanitizeHTML = (/** @type {any} */ s) => (s == null ? '' : String(s));
    ctx.getProfBonus = (/** @type {number} */ stufe) =>
        2 + Math.floor((Math.max(1, stufe) - 1) / 4);
    ctx.EntityLookup = { character: (/** @type {any} */ id) => HELDEN.get(Number(id)) || null };
    ctx.showToast = (/** @type {string} */ text, /** @type {string|undefined} */ typ) => {
        meldungen.push([text, typ]);
    };
    ctx.ErrorHandler = {
        log: (/** @type {string} */ fn, /** @type {unknown} */ fehler) => {
            protokoll.push([fn, fehler]);
        }
    };
    ctx.window.showToast = ctx.showToast;
    ctx.window.ErrorHandler = ctx.ErrorHandler;
    vm.runInContext(fs.readFileSync(FORM_HELPERS, 'utf8'), ctx, {
        filename: 'utils/form-helpers.js'
    });
    vm.runInContext(fs.readFileSync(PARTY_CRUD, 'utf8'), ctx, {
        filename: 'features/party/party-crud.js'
    });
    echt = {
        updateAttrMod: ctx.updateAttrMod,
        updateSpeedDisplay: ctx.updateSpeedDisplay,
        updateProficiencyBonus: ctx.updateProficiencyBonus,
        setCharLanguages: ctx.setCharLanguages,
        buildAttackRowHTML: ctx.buildAttackRowHTML
    };

    // Die drei Bezugsstaende. Gueltige Daten werfen auch am Basisstand nicht.
    document.body.innerHTML = vorlage;
    ctx.cancelCharEdit();
    STAND.leer = formularStand();
    document.body.innerHTML = vorlage;
    HELDEN.set(1, ARIA);
    HELDEN.set(2, XAVER);
    ctx.editChar(1);
    STAND.aria = formularStand();
    ctx.editChar(2);
    STAND.kontrolle = formularStand();
});

beforeEach(() => {
    document.body.innerHTML = vorlage;
    HELDEN.clear();
    HELDEN.set(1, ARIA);
    HELDEN.set(2, XAVER);
    meldungen.length = 0;
    protokoll.length = 0;
});

afterEach(() => {
    Object.assign(ctx, echt);
    delete ctx.window.APP_CONFIG;
});

const fehlerMeldungen = () => meldungen.filter(([, typ]) => typ === 'error');

describe('CHAR-HALBLADEN — editChar() laedt total und atomar', () => {
    test('(HL0) die Werkbank traegt: Aria und der Kontroll-Xaver laden offen und vollstaendig, leer ist leer', () => {
        expect(STAND.leer.offen).toBe(false);
        expect(STAND.leer['edit-char-id']).toBe('');
        expect(STAND.aria['edit-char-id']).toBe('1');
        expect(STAND.aria['char-name']).toBe('Aria');
        expect(STAND.kontrolle.offen).toBe(true);
        expect(STAND.kontrolle['edit-char-id']).toBe('2');
        expect(STAND.kontrolle['char-name']).toBe('Xaver');
        expect(STAND.kontrolle['char-speed']).toBe('8m|25ft.');
        expect(STAND.kontrolle['char-resistances:Gift']).toBe('true|markiert');
        expect(STAND.kontrolle['cf-lang-dropdown:Zwergisch']).toBe('true|markiert');
        expect(STAND.kontrolle.angriffe).toBe('Streitaxt/5/1d8+3/Hieb');
        expect(STAND.kontrolle['cf-avatar-preview']).toBe(`Bild ${BILD_X}`);
        // Jedes Feld der Matrix hat Steuerelemente, und Aria unterscheidet sich darin vom
        // Kontroll-Xaver — sonst saehe "kein Wert von Aria" nichts.
        for (const feld of FELDER) {
            const ks = Object.keys(STAND.kontrolle).filter(k => gehoertZu(feld, k));
            expect({ feld, anzahl: ks.length > 0 }).toEqual({ feld, anzahl: true });
            expect({
                feld,
                unterscheidbar: ks.some(
                    k => STAND.aria[k] !== STAND.kontrolle[k] && STAND.aria[k] !== STAND.leer[k]
                )
            }).toEqual({ feld, unterscheidbar: true });
        }
        expect(meldungen).toEqual([]);
        expect(protokoll).toEqual([]);
    });

    describe('(HL1) R1/R2: 12 Felder x 7 Formen nach editChar(Aria)', () => {
        for (const feld of FELDER) {
            test.each(FORMEN)(`(HL1) ${feld} als %s`, (_name, wert) => {
                HELDEN.set(2, xaverMit(feld, wert));
                ctx.editChar(1);
                meldungen.length = 0;
                protokoll.length = 0;
                expect(() => ctx.editChar(2)).not.toThrow();
                const z = formularStand();

                if (feld === 'languages' && !z.offen) {
                    // Der catch-Zweig (R3): leer und zu, genau eine sichtbare Meldung.
                    expect(z).toEqual(STAND.leer);
                    expect(fehlerMeldungen()).toHaveLength(1);
                    expect(protokoll).toHaveLength(1);
                    return;
                }

                expect({ id: z['edit-char-id'], offen: z.offen }).toEqual({ id: '2', offen: true });
                const ausserhalb = Object.keys(STAND.kontrolle).filter(k => !gehoertZu(feld, k));
                /** @type {Record<string, any>} */
                const ist = {};
                /** @type {Record<string, any>} */
                const soll = {};
                for (const k of ausserhalb) {
                    ist[k] = z[k];
                    soll[k] = STAND.kontrolle[k];
                }
                expect(ist).toEqual(soll);
                expect(arienWerte(z)).toEqual([]);
                if (feld === 'languages') expect(arienSprachen(z)).toEqual([]);
                if (R5_LEERWERT.has(feld) && !(feld === 'attacks' && Array.isArray(wert))) {
                    /** @type {Record<string, any>} */
                    const altIst = {};
                    /** @type {Record<string, any>} */
                    const altSoll = {};
                    for (const k of Object.keys(STAND.leer).filter(k => gehoertZu(feld, k))) {
                        altIst[k] = z[k];
                        altSoll[k] = STAND.leer[k];
                    }
                    expect(altIst).toEqual(altSoll);
                }
                expect(fehlerMeldungen()).toEqual([]);
                if (feld !== 'languages') expect(protokoll).toEqual([]);
            });
        }
    });

    describe('(HL2) R3: ein unerwarteter Fehler beim Laden hinterlaesst ein leeres, geschlossenes Formular', () => {
        /**
         * Ein Anzeige-Helfer, der IMMER wirft — auch beim Leeren, denn cancelCharEdit() ruft
         * dieselben Helfer wie das Laden (CHAR-HALBLADEN Offen (4)). Fuer updateAttrMod ist
         * das die Injektion des Vertrags (WAECHTER, HL2 "frueh").
         * @param {string} name
         */
        const wirftImmer = name => () => {
            ctx[name] = () => {
                throw new Error(`Probe: ${name} wirft immer`);
            };
        };
        /** @type {Array<[string, () => void]>} */
        const STELLEN = [
            ['frueh (updateAttrMod wirft immer)', wirftImmer('updateAttrMod')],
            ['beim Tempo (updateSpeedDisplay wirft immer)', wirftImmer('updateSpeedDisplay')],
            [
                'beim Uebungsbonus (updateProficiencyBonus wirft immer)',
                wirftImmer('updateProficiencyBonus')
            ],
            [
                'mittig (setCharLanguages)',
                () => {
                    ctx.setCharLanguages = () => {
                        throw new Error('Probe: setCharLanguages wirft');
                    };
                }
            ],
            [
                'spaet (buildAttackRowHTML)',
                () => {
                    ctx.buildAttackRowHTML = () => {
                        throw new Error('Probe: buildAttackRowHTML wirft');
                    };
                }
            ]
        ];
        test.each(STELLEN)('(HL2) Fehler %s', (_ort, einschleusen) => {
            ctx.editChar(1);
            expect(formularStand()['edit-char-id']).toBe('1');
            meldungen.length = 0;
            protokoll.length = 0;
            einschleusen();
            expect(() => ctx.editChar(2)).not.toThrow();
            const z = formularStand();
            expect({ id: z['edit-char-id'], offen: z.offen }).toEqual({ id: '', offen: false });
            expect(arienWerte(z)).toEqual([]);
            // Leer heisst: kein Teilwert von Xaver und nichts von Aria, in JEDEM Steuerelement
            // und in jeder Anzeige (Modifikatoren, Fuss, Uebungsbonus).
            expect(z).toEqual(STAND.leer);
            expect(fehlerMeldungen()).toHaveLength(1);
            // Genau ein Eintrag, der von editChar() (R3). Ein Wurf eines Helfers beim Leeren
            // steht nur unter DEBUG_MODE im Fehlerlog (Fall unten), wie jeder in form-helpers.js.
            expect(protokoll.map(([fn]) => fn)).toEqual(['editChar']);
        });

        // Das Leeren selbst, ohne editChar(): der Abbrechen-Knopf und verwirfBearbeitenRest()
        // rufen cancelCharEdit() direkt. Ein Helfer, der wirft, laesst keinen Wert und keine
        // Anzeige von Aria stehen, und der Wurf geht ins Fehlerlog (unter DEBUG_MODE).
        test.each(['updateAttrMod', 'updateSpeedDisplay', 'updateProficiencyBonus'])(
            '(HL2) das Leeren selbst: %s wirft immer — cancelCharEdit() nach editChar(Aria) laesst nichts von Aria stehen, der Wurf steht unter DEBUG_MODE im Fehlerlog',
            name => {
                ctx.editChar(1);
                expect(formularStand()['edit-char-id']).toBe('1');
                meldungen.length = 0;
                protokoll.length = 0;
                const probe = new Error(`Probe: ${name} wirft immer`);
                ctx[name] = () => {
                    throw probe;
                };
                ctx.window.APP_CONFIG = { DEBUG_MODE: true };
                expect(() => ctx.cancelCharEdit()).not.toThrow();
                const z = formularStand();
                expect(arienWerte(z)).toEqual([]);
                expect(z).toEqual(STAND.leer);
                expect(protokoll.some(([, fehler]) => fehler === probe)).toBe(true);
                expect(meldungen).toEqual([]);
            }
        );
    });

    describe('(HL3) E3: speed als Zahl waehlt die Option mit data-ft gleich der Zahl, sonst 9m|30ft.', () => {
        test.each([
            [30, '9m|30ft.'],
            [25, '8m|25ft.'],
            [40, '12m|40ft.'],
            [35, '9m|30ft.'],
            [0, '9m|30ft.']
        ])('(HL3) speed %s -> %s', (zahl, soll) => {
            HELDEN.set(2, xaverMit('speed', zahl));
            ctx.editChar(1);
            expect(() => ctx.editChar(2)).not.toThrow();
            const z = formularStand();
            expect({ id: z['edit-char-id'], offen: z.offen, speed: z['char-speed'] }).toEqual({
                id: '2',
                offen: true,
                speed: soll
            });
        });
    });

    describe('(HL4) R6: Laden schreibt nie nach D', () => {
        /** Die ausdruecklichen R6-Formen (wie HA8 der Spec), dazu die ganze Matrix aus HL1. */
        /** @type {Array<[string, string, any]>} */
        const LEGITIM = [
            ['speed', "'9m'", '9m'],
            ['speed', "'12m|40ft.'", '12m|40ft.'],
            ['languages', "Text 'Gemein, Zwergisch'", 'Gemein, Zwergisch'],
            ['languages', "['Gemein', 'Kauderwelsch']", ['Gemein', 'Kauderwelsch']],
            [
                'attacks',
                "attackBonus '+5'",
                [{ name: 'Streitaxt', attackBonus: '+5', damage: '1d8+3', damageType: 'Hieb' }]
            ],
            ['level', "'7'", '7'],
            ['avatar', "relativer Pfad 'bilder/xaver.png'", 'bilder/xaver.png'],
            ['avatar', 'NBSP vor dem Bild', ' ' + BILD_X],
            ['notes', 'Zahl 42', 42],
            ['playerName', 'Objekt {x:1}', { x: 1 }]
        ];
        /** @type {Array<[string, string, any]>} */
        const FAELLE = [
            ...FELDER.flatMap(feld =>
                FORMEN.map(
                    ([name, wert]) => /** @type {[string, string, any]} */ ([feld, name, wert])
                )
            ),
            ...LEGITIM
        ];
        test.each(FAELLE)('(HL4) %s als %s', (feld, _name, wert) => {
            const xaver = xaverMit(feld, wert);
            HELDEN.set(2, xaver);
            // Bytegleich: ein JSON-Abzug vorher; toStrictEqual sieht auch einen hinzugefuegten
            // Schluessel mit undefined.
            const vorher = JSON.parse(JSON.stringify({ aria: HELDEN.get(1), xaver }));
            // Nur R6: ob editChar() wirft, urteilt HL1 (hier wie der Verteiler: geschluckt).
            for (const id of [1, 2]) {
                try {
                    ctx.editChar(id);
                } catch {
                    // HL1
                }
            }
            expect({ aria: HELDEN.get(1), xaver: HELDEN.get(2) }).toStrictEqual(vorher);
        });
    });

    describe('(HL5) R5: resistances und immunities als Text laden wie bisher, per Teilstring', () => {
        test.each([
            ['resistances', 'Gift', ['Gift']],
            ['resistances', 'Gift, Säure (halbiert)', ['Gift', 'Säure']],
            ['immunities', 'Kälte', ['Kälte']],
            ['immunities', 'Donner und Psychisch', ['Donner', 'Psychisch']]
        ])('(HL5) %s als Text %j markiert %j', (feld, text, markiert) => {
            HELDEN.set(2, xaverMit(feld, text));
            ctx.editChar(1);
            expect(() => ctx.editChar(2)).not.toThrow();
            const z = formularStand();
            expect({ id: z['edit-char-id'], offen: z.offen }).toEqual({ id: '2', offen: true });
            const gruppe = `char-${feld}:`;
            const chips = Object.keys(z).filter(k => k.startsWith(gruppe));
            expect(chips.length).toBeGreaterThan(0);
            /** @type {Record<string, any>} */
            const ist = {};
            /** @type {Record<string, any>} */
            const soll = {};
            for (const k of chips) {
                ist[k] = z[k];
                soll[k] = markiert.includes(k.slice(gruppe.length))
                    ? 'true|markiert'
                    : 'false|unmarkiert';
            }
            expect(ist).toEqual(soll);
            const ausserhalb = Object.keys(STAND.kontrolle).filter(k => !gehoertZu(feld, k));
            /** @type {Record<string, any>} */
            const istRest = {};
            /** @type {Record<string, any>} */
            const sollRest = {};
            for (const k of ausserhalb) {
                istRest[k] = z[k];
                sollRest[k] = STAND.kontrolle[k];
            }
            expect(istRest).toEqual(sollRest);
            expect(meldungen).toEqual([]);
            expect(protokoll).toEqual([]);
        });
    });

    describe('(HL6) R5: speed als Liste waehlt die Vorgabe — auch wenn ihr Text eine Option traefe', () => {
        test.each([[['12m']], [['8m|25ft.']], [['12m|40ft.']]])('(HL6) speed %j', liste => {
            HELDEN.set(2, xaverMit('speed', liste));
            ctx.editChar(1);
            expect(() => ctx.editChar(2)).not.toThrow();
            const z = formularStand();
            expect({
                id: z['edit-char-id'],
                offen: z.offen,
                speed: z['char-speed'],
                fuss: z['char-speed-ft']
            }).toEqual({
                id: '2',
                offen: true,
                speed: STAND.leer['char-speed'],
                fuss: STAND.leer['char-speed-ft']
            });
            expect(STAND.leer['char-speed']).toBe('9m|30ft.');
            expect(meldungen).toEqual([]);
            expect(protokoll).toEqual([]);
        });
    });

    describe('(HL7) E5: jeder Ladefehler meldet sich sichtbar — auch zwei kurz hintereinander', () => {
        test('(HL7) zwei Ladefehler binnen 2 s: zwei Meldungen (der echte ErrorHandler.showError entprellt)', () => {
            // Der echte ErrorHandler aus render/helpers.js, in einem eigenen Kontext: showError()
            // verschluckt jede Meldung binnen 2 s nach der vorigen — der Grund fuer E5.
            /** @type {any} */
            const ehKtx = { window: {}, document };
            vm.createContext(ehKtx);
            vm.runInContext(fs.readFileSync(RENDER_HELPERS, 'utf8'), ehKtx, {
                filename: 'render/helpers.js'
            });
            const echterEH = ehKtx.window.ErrorHandler;
            echterEH._consoleLog = false;
            ehKtx.showToast = ctx.showToast;
            const attrappe = ctx.ErrorHandler;
            ctx.ErrorHandler = echterEH;
            ctx.window.ErrorHandler = echterEH;
            try {
                ctx.buildAttackRowHTML = () => {
                    throw new Error('Probe: buildAttackRowHTML wirft');
                };
                expect(() => ctx.editChar(1)).not.toThrow();
                expect(() => ctx.editChar(2)).not.toThrow();
                expect(formularStand()).toEqual(STAND.leer);
                expect(
                    echterEH
                        .getRecentErrors(10)
                        .filter((/** @type {any} */ e) => e.fn === 'editChar')
                ).toHaveLength(2);
                expect(fehlerMeldungen()).toHaveLength(2);
            } finally {
                ctx.ErrorHandler = attrappe;
                ctx.window.ErrorHandler = attrappe;
            }
        });
    });

    describe('(HL8) R4: ein Steuerelement, das editChar() nicht laedt, erbt nichts vom vorigen Helden', () => {
        test('(HL8) setCharLanguages() laedt nichts ("vergessen"): keine Sprache von Aria', () => {
            ctx.editChar(1);
            expect(arienSprachen(formularStand())).toEqual(ARIA.languages);
            ctx.setCharLanguages = () => {};
            expect(() => ctx.editChar(2)).not.toThrow();
            const z = formularStand();
            expect({ id: z['edit-char-id'], offen: z.offen }).toEqual({ id: '2', offen: true });
            expect(arienSprachen(z)).toEqual([]);
            expect(arienWerte(z)).toEqual([]);
            /** @type {Record<string, any>} */
            const ist = {};
            /** @type {Record<string, any>} */
            const soll = {};
            for (const k of Object.keys(STAND.leer).filter(k => gehoertZu('languages', k))) {
                ist[k] = z[k];
                soll[k] = STAND.leer[k];
            }
            expect(ist).toEqual(soll);
        });
    });
});
