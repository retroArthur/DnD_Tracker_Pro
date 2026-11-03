/**
 * AVATAR-VORSCHAU — R2, R3 und R4 an den Funktionen selbst (features/party/party-crud.js)
 *
 * Die Bedienwege stehen in tests/e2e/features/avatar-vorschau.spec.js (Befund, Ursache und
 * Vertrag im Kopf dort). Diese Datei haelt fest, was von aussen nicht zu sehen ist:
 *
 *   R3  cancelCharEdit() fuehrt die Vorschau NACH der Rueckkehr von clearFormFields() aus dem
 *       Feld nach, nicht in dessen try-Block (customHandlers). clearFormFields()
 *       (utils/form-helpers.js) faengt jeden Fehler eines Handlers und meldet ihn nur bei
 *       DEBUG_MODE; ein Aufruf hinter einem werfenden Handler fiele still weg. Am Bildschirm
 *       wirft heute keiner — darum hier, mit einem Handler, der wirft (U1).
 *   R4  Direkt aufrufen, kein synthetisches input-/change-Ereignis und kein dispatchEvent am
 *       Feld. Am Bildschirm faengt (W5) nur das change (BESTIAR-KLICK verschluckt es beim schon
 *       zugestellten Wert); ein synthetisches input waere dort unsichtbar. Hier gibt es keinen
 *       Ereignis-Verteiler: ein Fix ueber ein Ereignis aendert die Vorschau nicht, und jedes
 *       Ereignis am Feld wird gezaehlt (U2, U3).
 *   R2  editChar() fuehrt die Vorschau direkt nach der Feldzuweisung nach (U3).
 *
 * Gemessen am Kopf 543706c6: U1, U2 und U3 rot (die Vorschau bleibt, wie sie war), U0 gruen.
 * Gegenproben an Kopien von party-crud.js (nicht eingecheckt; Namen wie in der E2E-Datei):
 *   fix  R2 + R3 wie im Vertrag                                   alle vier gruen
 *   m1   nur editChar()                                           U1, U2 rot
 *   m2   nur cancelCharEdit()                                     U3 rot
 *   m4   dispatchEvent(change) am Feld statt des Aufrufs          U1, U2, U3 rot
 *   m5   der Aufruf IN customHandlers (hinter dem Leeren der      U1 rot — am Bildschirm
 *        Angriffe), sonst wie fix                                 zwoelf von zwoelf gruen
 *   m6   dispatchEvent(input) am Feld statt des Aufrufs           U1, U2, U3 rot — am
 *                                                                 Bildschirm zwoelf gruen
 *   m7/m8  Vorschau aus ch.avatar (am Anfang bzw. an der Stelle   alle vier gruen; m7 faengt
 *        von R2), plus R3                                         (W9) der E2E-Datei
 *
 * Das Modul laeuft echt: vm-Kontext mit dem jsdom-Dokument der Suite, der echten Vorlage
 * assets/templates/view-party.html, dem echten Datengrenzen-Block (sichereBildquelle()) und
 * der echten clearFormFields(). Attrappen nur fuer, was nicht zur Vorschau gehoert
 * (EntityLookup, sanitizeHTML, getProfBonus, esc). jsdom laedt keine Bilder: gemessen wird
 * das <img> und seine Quelle, nicht das Laden (das misst die E2E-Datei).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ladeDatengrenze } = require('./helpers/datengrenze-block.js');

const WURZEL = path.join(__dirname, '..', '..');
const PARTY_CRUD = path.join(WURZEL, 'features', 'party', 'party-crud.js');
const FORM_HELPERS = path.join(WURZEL, 'utils', 'form-helpers.js');
const VORLAGE = path.join(WURZEL, 'assets', 'templates', 'view-party.html');

const DATA_BILD =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const LOKALES_BILD = 'file:///C:/Bilder/held.png';
const PLATZHALTER = '<span class="cf-avatar-placeholder">?</span>';

/** Zwei Helden, `speed` als Text (die Altdaten-Frage ist R7, ein eigener Vorgang). */
function held(id, name, avatar) {
    return {
        id,
        name,
        level: 1,
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        speed: '9m|30ft.',
        languages: [],
        spellSlots: {},
        currency: {},
        notes: '',
        attacks: [],
        avatar
    };
}
const HELDEN = new Map([
    [1, held(1, 'Aria', DATA_BILD)],
    [2, held(2, 'Bram', '')]
]);

let ctx;
const vorlage = fs.readFileSync(VORLAGE, 'utf8');

beforeAll(() => {
    // Event/InputEvent aus jsdom: ein Fix ueber ein Ereignis soll hier LAUFEN (und gezaehlt
    // werden), nicht an einem ReferenceError scheitern.
    ctx = { window: {}, document, URL, Event, InputEvent: window.InputEvent };
    vm.createContext(ctx);
    ladeDatengrenze(ctx);
    ctx.$ = id => document.getElementById(id);
    ctx.esc = s => String(s);
    ctx.sanitizeHTML = s => (s == null ? '' : String(s));
    ctx.getProfBonus = stufe => 2 + Math.floor((Math.max(1, stufe) - 1) / 4);
    ctx.EntityLookup = { character: id => HELDEN.get(Number(id)) || null };
    vm.runInContext(fs.readFileSync(FORM_HELPERS, 'utf8'), ctx, {
        filename: 'utils/form-helpers.js'
    });
    vm.runInContext(fs.readFileSync(PARTY_CRUD, 'utf8'), ctx, {
        filename: 'features/party/party-crud.js'
    });
});

/** @type {{ input: number, change: number }} */
let ereignisse;
/** @type {Function} */
let echtesUpdateSpeedDisplay;

beforeEach(() => {
    document.body.innerHTML = vorlage;
    ereignisse = { input: 0, change: 0 };
    feld().addEventListener('input', () => ereignisse.input++);
    feld().addEventListener('change', () => ereignisse.change++);
    echtesUpdateSpeedDisplay = ctx.updateSpeedDisplay;
});

afterEach(() => {
    ctx.updateSpeedDisplay = echtesUpdateSpeedDisplay;
});

function feld() {
    return /** @type {HTMLInputElement} */ (document.getElementById('char-avatar'));
}
function vorschau() {
    return /** @type {HTMLElement} */ (document.getElementById('cf-avatar-preview'));
}
/** Was die Vorschau zeigt: die Quelle des einen <img>, oder '?' beim Platzhalter. */
function zeigt() {
    const bilder = vorschau().querySelectorAll('img');
    if (bilder.length === 0 && vorschau().innerHTML.trim() === PLATZHALTER) return '?';
    if (bilder.length === 1 && vorschau().children.length === 1) {
        return bilder[0].getAttribute('src');
    }
    return `unklar: ${vorschau().innerHTML}`;
}

/** So steht es nach dem Tippen: das Feld traegt den Wert, der Verteiler hat die Vorschau
 *  nachgefuehrt ('update-avatar-preview' ruft updateAvatarPreview(ctx.target.value)). */
function getippt(wert) {
    feld().value = wert;
    ctx.updateAvatarPreview(wert);
}

describe('AVATAR-VORSCHAU — die Vorschau folgt dem Feld beim Laden und Leeren, ohne Ereignis', () => {
    test('(U0) die Werkbank traegt: Vorlage mit Platzhalter, ein getipptes Bild steht in der Vorschau', () => {
        expect(typeof ctx.editChar).toBe('function');
        expect(typeof ctx.cancelCharEdit).toBe('function');
        expect(zeigt()).toBe('?');
        getippt(LOKALES_BILD);
        expect(zeigt()).toBe(LOKALES_BILD);
        expect(ereignisse).toEqual({ input: 0, change: 0 });
    });

    test('(U1) R3: wirft ein frueherer Leeren-Handler, fuehrt cancelCharEdit() die Vorschau trotzdem nach', () => {
        getippt(LOKALES_BILD);
        // Der ERSTE Handler in customHandlers wirft — alles dahinter faellt im try-Block weg.
        ctx.updateSpeedDisplay = () => {
            throw new Error('Probe: ein frueherer Leeren-Handler wirft');
        };
        expect(() => ctx.cancelCharEdit()).not.toThrow();
        expect(feld().value).toBe('');
        expect(zeigt()).toBe('?');
    });

    test('(U2) R3/R4: cancelCharEdit() leert Feld und Vorschau, direkt — ohne Ereignis am Feld', () => {
        getippt(LOKALES_BILD);
        ctx.cancelCharEdit();
        expect(feld().value).toBe('');
        expect(zeigt()).toBe('?');
        expect(ereignisse).toEqual({ input: 0, change: 0 });
    });

    test('(U3) R2/R4: editChar() zeigt das Bild des geladenen Helden bzw. "?" — direkt, ohne Ereignis am Feld', () => {
        getippt(LOKALES_BILD);
        ctx.editChar(1);
        expect(feld().value).toBe(DATA_BILD);
        expect(zeigt()).toBe(DATA_BILD);
        ctx.editChar(2);
        expect(feld().value).toBe('');
        expect(zeigt()).toBe('?');
        expect(ereignisse).toEqual({ input: 0, change: 0 });
    });
});
