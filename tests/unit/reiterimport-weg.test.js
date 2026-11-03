/**
 * Der Weg des Reiter-Imports bis zum Fenster — Unit-Nachweis (REITERIMPORT, R1/R2)
 *
 * Der Bedienweg selbst (EIN Dateidialog, Fenster nach > 5 s im Dialog, dieselbe Datei zweimal,
 * Telefon, Fokus) steht als E2E in tests/e2e/features/reiterimport-weg.spec.js. Hier stehen die
 * Zusagen, die dort nur mittelbar sichtbar sind, gegen den ECHTEN Quelltext von
 * systems/spellslots/import-export.js (vm-Kontext, Loader-Reihenfolge der benoetigten Module):
 *   - die Sperre: `input` UND `change` derselben Auswahl lesen die Datei EINMAL;
 *   - `value` des Reiterfelds ist nach JEDEM Ende leer (Fenster wie Ablehnung) — sonst ist
 *     dieselbe Datei beim naechsten Mal fuer den Browser keine Aenderung;
 *   - eine leere Auswahl ist still;
 *   - eine erwartete Ablehnung ist deutsch und kein Programmfehler (kein Fehlerlog);
 *   - der Reviver verwirft __proto__/constructor/prototype in jeder Tiefe;
 *   - vor dem Fenster gibt es keine Erfolgsmeldung, die Vorschau nennt den Typ deutsch;
 *   - der Typname nennt nie den internen Schluessel, auch nicht fuer einen Schluessel aus
 *     Object.prototype.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { setImmediate: naechsterTask } = require('timers');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
// Loader-Reihenfolge (loader.js MODULES), nur was die Kette bis zum Fenster braucht
const MODULE = [
    'core/config.js',
    'core/data.js',
    'utils/basic.js',
    'utils/utilities.js',
    'systems/spellslots/import-export.js'
];
const QUELLTEXT = Object.fromEntries(
    MODULE.map(rel => [rel, fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8')])
);

async function ruhe(n = 20) {
    for (let i = 0; i < n; i++) await new Promise(resolve => naechsterTask(resolve));
}

/** Ein vm-Kontext = window, mit beobachtbaren Attrappen fuer Meldung, Fenster und Datei. */
function erzeugeSeite() {
    const seite = { toasts: [], lesevorgaenge: 0, confirms: [], antwort: true };
    const ctx = {
        console,
        document,
        DOMParser,
        Node,
        setTimeout,
        clearTimeout
    };
    ctx.window = ctx;
    ctx.self = ctx;
    vm.createContext(ctx);
    for (const rel of MODULE) vm.runInContext(QUELLTEXT[rel], ctx, { filename: rel });
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.showToast = jest.fn((text, typ) => seite.toasts.push(`${typ || 'success'}: ${text}`));
    ctx.showModal = jest.fn();
    ctx.confirm = jest.fn(text => {
        seite.confirms.push(String(text));
        return seite.antwort;
    });
    ctx.D = { npcs: [{ id: 1, name: 'Volo' }] };
    ctx.FileReader = class {
        readAsText(datei) {
            seite.lesevorgaenge++;
            Promise.resolve().then(() => this.onload({ target: { result: datei.__text } }));
        }
    };
    seite.ctx = ctx;
    return seite;
}

/** Ein Reiterfeld mit gewaehlter Datei, wie es ui/event-delegation.js an importData() gibt. */
function reiterfeld(typ, text, name = `${typ}.json`) {
    return {
        id: `import-${typ}`,
        dataset: { type: typ },
        files: text === null ? [] : [{ name, size: text.length, __text: text }],
        value: text === null ? '' : `C:\\fakepath\\${name}`
    };
}

const NPC_DATEI = JSON.stringify({
    _dataType: 'npcs',
    _campaignName: 'Schwertkueste',
    _exportDate: '2026-10-28T10:00:00.000Z',
    data: [
        { id: 1, name: 'Elminster' },
        { id: 2, name: 'Laeral' }
    ]
});

let vorschau;
beforeEach(() => {
    document.body.innerHTML = '';
    vorschau = document.createElement('div');
    vorschau.id = 'import-info';
    document.body.appendChild(vorschau);
});

describe('REITERIMPORT — der Weg bis zum Fenster (R1, R2)', () => {
    test('W1: input UND change derselben Auswahl — die Datei wird EINMAL gelesen, das Fenster oeffnet EINMAL', async () => {
        const seite = erzeugeSeite();
        const feld = reiterfeld('npcs', NPC_DATEI);
        seite.ctx.importData(feld);
        seite.ctx.importData(feld);
        await ruhe();
        expect(seite.lesevorgaenge).toBe(1);
        expect(seite.ctx.showModal.mock.calls).toEqual([['import-modal']]);
        expect(feld.value).toBe('');
        // ... und danach ist die Sperre wieder offen: dieselbe Datei noch einmal
        seite.ctx.importData(reiterfeld('npcs', NPC_DATEI));
        await ruhe();
        expect(seite.lesevorgaenge).toBe(2);
    });

    test('W2: eine leere Auswahl (Dialog abgebrochen) ist still — nichts gelesen, keine Meldung, kein Fenster', async () => {
        const seite = erzeugeSeite();
        seite.ctx.importData(reiterfeld('npcs', null));
        await ruhe();
        expect(seite.lesevorgaenge).toBe(0);
        expect(seite.toasts).toEqual([]);
        expect(seite.ctx.showModal).not.toHaveBeenCalled();
    });

    test('W3: kaputtes JSON — deutsche Ablehnung ohne Parser-Rohtext, kein Fehlerlog, kein Fenster, `value` leer', async () => {
        const seite = erzeugeSeite();
        const feld = reiterfeld('npcs', '{"_dataType":"npcs","data":[{"id":1,');
        seite.ctx.importData(feld);
        await ruhe();
        expect(seite.toasts).toEqual(['error: ❌ Die Datei ist kein gültiges JSON']);
        expect(seite.ctx.ErrorHandler.log).not.toHaveBeenCalled();
        expect(seite.ctx.showModal).not.toHaveBeenCalled();
        expect(feld.value).toBe('');
    });

    test('W4: der Reviver verwirft __proto__, constructor und prototype in jeder Tiefe', async () => {
        const seite = erzeugeSeite();
        const text =
            '{"_dataType":"npcs","data":[{"id":1,"name":"Brom","__proto__":{"vergiftet":1},' +
            '"relations":[{"targetId":2,"constructor":{"prototype":{"vergiftet":2}}}]}]}';
        const roh = seite.ctx.leseReiterImport(text);
        const eintrag = roh.data[0];
        expect(Object.prototype.hasOwnProperty.call(eintrag, '__proto__')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(eintrag.relations[0], 'constructor')).toBe(
            false
        );
        expect({}.vergiftet).toBeUndefined();
        expect(vm.runInContext('({}).vergiftet', seite.ctx)).toBeUndefined();
    });

    test('W5: vor dem Fenster keine Erfolgsmeldung; die Vorschau nennt Typ und Zahl deutsch, Modus Hinzufuegen', async () => {
        const seite = erzeugeSeite();
        seite.ctx.importData(reiterfeld('npcs', NPC_DATEI));
        await ruhe();
        expect(seite.toasts).toEqual([]);
        expect(seite.ctx.showModal).toHaveBeenCalledWith('import-modal');
        const zeilen = Array.from(vorschau.children).map(z => z.textContent);
        expect(zeilen).toEqual(
            expect.arrayContaining([
                'Typ: NPCs',
                'Einträge: 2',
                'Kampagne: Schwertkueste',
                expect.stringMatching(/^Hinzufügen: 2 Einträge kommen/)
            ])
        );
        expect(zeilen.join('\n')).not.toMatch(/\bnpcs\b/);
    });

    test('W6: ein anderer _dataType fragt mit deutschen Typnamen nach; Ablehnen ist still', async () => {
        const seite = erzeugeSeite();
        seite.antwort = false;
        const feld = reiterfeld('factions', NPC_DATEI.replace('"npcs"', '"locations"'));
        seite.ctx.importData(feld);
        await ruhe();
        expect(seite.confirms).toHaveLength(1);
        expect(seite.confirms[0]).toMatch(/Orte/);
        expect(seite.confirms[0]).toMatch(/Fraktionen/);
        expect(seite.confirms[0]).not.toMatch(/\b(locations|factions)\b/);
        expect(seite.toasts).toEqual([]);
        expect(seite.ctx.showModal).not.toHaveBeenCalled();
        expect(feld.value).toBe('');
    });

    test('W7: der Typname — Einzahl und Mehrzahl, nie der Schluessel, auch nicht fuer "constructor"', () => {
        const seite = erzeugeSeite();
        const name = (typ, n) => seite.ctx.reiterTypName(typ, n);
        expect(name('characters', 1)).toBe('Charakter');
        expect(name('locations', 2)).toBe('Orte');
        expect(name('calendarEvents', 1)).toBe('Ereignis');
        expect(name('constructor', 2)).toBe('Einträge');
        expect(name('toString', 1)).toBe('Eintrag');
    });
});
