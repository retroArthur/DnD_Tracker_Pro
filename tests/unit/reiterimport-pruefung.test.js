/**
 * Pruefung und Feldtreue des Reiter-Imports — Unit-Nachweis (REITERIMPORT, R3/R4/R6)
 *
 * Die Bedienwege stehen als E2E in tests/e2e/features/reiterimport-pruefung.spec.js (R3, R6,
 * R9) und tests/e2e/features/reiterimport-daten.spec.js (R4, R8). Hier stehen die Zusagen
 * dahinter gegen den ECHTEN Quelltext von systems/spellslots/import-export.js (vm-Kontext,
 * Loader-Reihenfolge der benoetigten Module, wie tests/unit/reiterimport-weg.test.js):
 *   - R3: Kampagnen- und Umzugsdatei werden beim Namen genannt; jeder Eintrag braucht sein
 *     Namensfeld als nicht-leeren Text; die Zahlenfelder sind GENAU die der Datengrenze
 *     (was sie still verwerfen wuerde, lehnt die Pruefung laut ab, eine Zahl als Text geht
 *     durch); die Textfelder nehmen keine Zahl; keine Meldung traegt einen Laufzeittext.
 *   - R6: Ersetzen nimmt nur positive ganze, eindeutige IDs — die Vorschau nennt den Grund,
 *     executeImport() lehnt ab, bevor es irgendetwas schreibt; Hinzufuegen geht weiter.
 *   - R4: der Export traegt den ganzen Eintrag und die Formatkennung; der Import reicht ihn
 *     ganz durch (nur HTML-Felder bereinigt); eine alte Datei ohne Kennung warnt und verliert
 *     die erfundenen Felder des alten Schemas, ohne dass sie abgebildet werden.
 * Nutzlasten sind harmlose Kanarien (Projektregel): `<img src="kanarie-<id>.png" data-kanarie>`.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { setImmediate: naechsterTask } = require('timers');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
// Loader-Reihenfolge (loader.js MODULES), nur was Kette, Fenster und Schreiben brauchen
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

/** Rohtexte der Laufzeit, die in keiner Meldung stehen duerfen. */
const ROHTEXT =
    /\bundefined\b|\bNaN\b|\[object Object\]|TypeError|SyntaxError|is not a function|Cannot (read|set)/;

async function ruhe(n = 20) {
    for (let i = 0; i < n; i++) await new Promise(resolve => naechsterTask(resolve));
}

/** Ein vm-Kontext = window, mit beobachtbaren Attrappen fuer Meldung, Fenster, Schreiben. */
function erzeugeSeite(D) {
    const seite = { toasts: [], antwort: true, downloads: [] };
    const ctx = { console, document, DOMParser, Node, setTimeout, clearTimeout };
    ctx.window = ctx;
    ctx.self = ctx;
    vm.createContext(ctx);
    for (const rel of MODULE) vm.runInContext(QUELLTEXT[rel], ctx, { filename: rel });
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.showToast = jest.fn((text, typ) => seite.toasts.push(`${typ || 'success'}: ${text}`));
    ctx.showModal = jest.fn();
    ctx.hideModal = jest.fn();
    ctx.confirm = jest.fn(() => seite.antwort);
    ctx.saveUndoState = jest.fn();
    ctx.save = jest.fn();
    ctx.renderAll = jest.fn();
    ctx.setViewCount = jest.fn();
    ctx.createAutoBackup = jest.fn(() => Promise.resolve('ok'));
    ctx.reportSafetyBackup = jest.fn();
    ctx.validateAndRepairNextId = jest.fn();
    let zaehler = 100;
    ctx.nextId = jest.fn(() => ++zaehler);
    ctx.getCampaignIndex = () => ({ active: ctx.APP_CONFIG.STORAGE_KEY, campaigns: [] });
    ctx.Blob = class {
        constructor(teile) {
            this.text = teile.join('');
        }
    };
    ctx.URL = {
        createObjectURL: blob => {
            seite.downloads.push(blob.text);
            return 'blob:probe';
        },
        revokeObjectURL: () => {}
    };
    ctx.D = D || { npcs: [{ id: 1, name: 'Volo' }] };
    ctx.FileReader = class {
        readAsText(datei) {
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
        files: [{ name, size: text.length, __text: text }],
        value: `C:\\fakepath\\${name}`
    };
}

/** Eine Reiter-Datei im Format des Exports. */
function datei(typ, data, kopf = {}) {
    return JSON.stringify({
        _format: 'dnd-tracker/reiter-export@2',
        _exportDate: '2026-11-01T10:00:00.000Z',
        _campaignName: 'Probe',
        _version: '2.6.1',
        _dataType: typ,
        ...kopf,
        data
    });
}

/** Waehlt die Datei im Reiter `typ` und wartet, bis die Kette durch ist. */
async function waehle(seite, typ, text) {
    seite.ctx.importData(reiterfeld(typ, text));
    await ruhe();
}

/** Die vorbereitete Datei im Modulzustand (das Fenster haelt sie). */
function vorbereitet(seite) {
    return vm.runInContext('_reiterImport', seite.ctx);
}

function vorschauZeilen() {
    return Array.from(document.getElementById('import-info').children).map(z => z.textContent);
}

/** Setzt den Modus wie das Optionsfeld im Fenster. */
function modus(seite, wert) {
    document.querySelector(`input[name="import-mode"][value="${wert}"]`).checked = true;
    seite.ctx.renderImportVorschau();
}

/** Plain-Kopie eines Objekts aus dem vm-Kontext (andere Prototypen als die des Tests). */
function plain(x) {
    return JSON.parse(JSON.stringify(x));
}

beforeEach(() => {
    document.body.innerHTML =
        '<div id="import-info"></div>' +
        '<input type="radio" name="import-mode" value="merge" checked>' +
        '<input type="radio" name="import-mode" value="replace">';
});

/** Erwartet eine Ablehnung VOR dem Fenster: genau eine deutsche Fehlermeldung, die `thema`
 *  trifft, kein Laufzeittext, kein Fehlerlog, kein Fenster, nichts vorbereitet. */
async function abgelehnt(typ, text, thema, D) {
    const seite = erzeugeSeite(D);
    const vorher = JSON.stringify(seite.ctx.D);
    await waehle(seite, typ, text);
    expect(seite.toasts).toHaveLength(1);
    expect(seite.toasts[0]).toMatch(/^error: ❌ /);
    expect(seite.toasts[0]).toMatch(thema);
    expect(seite.toasts[0]).not.toMatch(ROHTEXT);
    expect(seite.ctx.ErrorHandler.log).not.toHaveBeenCalled();
    expect(seite.ctx.showModal).not.toHaveBeenCalled();
    expect(vorbereitet(seite)).toBeNull();
    expect(JSON.stringify(seite.ctx.D)).toBe(vorher);
    return seite.toasts[0];
}

/** Erwartet, dass die Datei im Fenster ankommt; liefert die vorbereitete Datei. */
async function angenommen(typ, text, D) {
    const seite = erzeugeSeite(D);
    await waehle(seite, typ, text);
    expect(seite.toasts).toEqual([]);
    expect(seite.ctx.showModal).toHaveBeenCalledWith('import-modal');
    return { seite, bereit: vorbereitet(seite) };
}

describe('REITERIMPORT R3 — die Datei wird vor dem Fenster geprueft', () => {
    test('P1: eine Kampagnen-Datei wird als solche genannt, mit dem Weg ueber "💾 Daten"', async () => {
        const meldung = await abgelehnt(
            'npcs',
            JSON.stringify({ _campaignName: 'Gruenwald', npcs: [{ id: 1, name: 'A' }] }),
            /Kampagnen-Datei/
        );
        expect(meldung).toMatch(/💾 Daten/);
        // Kalender-Ereignisse liegen verschachtelt — auch daran erkannt
        await abgelehnt('npcs', JSON.stringify({ calendar: { events: [] } }), /Kampagnen-Datei/);
    });

    test('P2: ein Umzugs- oder Audio-Export wird beim Namen genannt', async () => {
        await abgelehnt(
            'npcs',
            JSON.stringify({ _exportType: 'umzug', npcs: [] }),
            /Umzugs-Assistenten/
        );
    });

    test('P3: eine fremde JSON-Datei ohne "data" bleibt "Ungültiges Format"', async () => {
        await abgelehnt('npcs', JSON.stringify({ eintraege: [] }), /Ungültiges Format/);
    });

    test.each([
        ['npcs', { id: 1, name: null }, /Eintrag 1 der Datei: der Name \(Feld „name“\)/],
        ['npcs', { id: 1, name: 42 }, /der Name \(Feld „name“\)/],
        ['npcs', { id: 1, name: '' }, /der Name \(Feld „name“\)/],
        ['npcs', { id: 1, name: '   ' }, /der Name \(Feld „name“\)/],
        ['npcs', { id: 1, race: 'Ork' }, /der Name \(Feld „name“\)/],
        ['quests', { id: 1, title: null }, /der Titel \(Feld „title“\)/],
        ['wiki', { id: 1, title: 7 }, /der Titel \(Feld „title“\)/],
        ['links', { id: 1, title: { a: 1 }, url: 'https://x.org' }, /der Titel \(Feld „title“\)/],
        ['calendarEvents', { id: 1, datum: { tag: 1, monat: 1, jahr: 1 } }, /„titel“/],
        ['factions', { id: 1, name: [] }, /der Name \(Feld „name“\)/]
    ])('P4: %s ohne gueltiges Namensfeld %j wird abgelehnt', async (typ, eintrag, thema) => {
        await abgelehnt(
            typ,
            datei(typ, [{ id: 9, name: 'Gut', title: 'Gut', titel: 'Gut' }, eintrag]),
            /Eintrag 2 der Datei/
        );
        await abgelehnt(typ, datei(typ, [eintrag]), thema);
    });

    test('P5: ein Session-Prep hat kein Namensfeld und kommt ohne an', async () => {
        const { bereit } = await angenommen(
            'sessionPreps',
            datei('sessionPreps', [{ id: 1, sessionNr: 3, strongStart: '<p>Feuer</p>' }])
        );
        expect(bereit.items).toHaveLength(1);
    });

    test.each([
        [
            'characters',
            { id: 1, name: 'Zaeh', hpMax: 'viel' },
            /„hpMax“ muss eine Zahl sein, die Datei enthält den Text „viel“/
        ],
        ['loot', { id: 1, name: 'Stapel', quantity: 'viele' }, /„quantity“ muss eine Zahl sein/],
        [
            'characters',
            { id: 1, name: 'A', attributes: { str: 'stark' } },
            /„attributes\.str“ muss eine Zahl sein/
        ],
        [
            'characters',
            { id: 1, name: 'A', spells: [1, 'Feuerball'] },
            /„spells“ darf nur Zahlen enthalten, an Stelle 2/
        ],
        [
            'factions',
            { id: 1, name: 'G', mitgliederNpcIds: 'drei' },
            /„mitgliederNpcIds“ muss eine Liste von Zahlen sein/
        ],
        [
            'calendarEvents',
            { id: 1, titel: 'T', datum: { tag: 'drei' } },
            /„datum\.tag“ muss eine Zahl sein/
        ],
        [
            'npcs',
            { id: 1, name: 'A', relations: [{ targetId: 2 }, { targetId: 'Vela' }] },
            /„relations\[2\]\.targetId“ muss eine Zahl sein/
        ],
        [
            'quests',
            { id: 1, title: 'Q', rewardGold: { gm: 5 } },
            /„rewardGold“ muss eine Zahl sein, die Datei enthält ein Objekt/
        ],
        ['characters', { id: 1, name: 'A', weight: '6.500' }, /„weight“ muss eine Zahl sein/],
        ['characters', { id: 1, name: 'A', weight: '80 kg' }, /„weight“ muss eine Zahl sein/],
        // Pruefer, Runde 2 (Sonde p1, gemessen): die Datengrenze kennt `filterId` nicht, und
        // parseEntityId([1]) ergibt 1 — die Karte zeigte nach dem Hinzufuegen den Filter der
        // Ziel-Kampagne mit dieser ID. Jeder Feldverweis des Katalogs muss eine ID sein koennen.
        [
            'npcs',
            { id: 1, name: 'A', filterId: [1] },
            /„filterId“ muss eine Zahl sein, die Datei enthält eine Liste/
        ],
        [
            'locations',
            { id: 1, name: 'A', filterId: { id: 2 } },
            /„filterId“ muss eine Zahl sein, die Datei enthält ein Objekt/
        ],
        ['npcs', { id: 1, name: 'A', filterId: 'Kapitel 1' }, /„filterId“ muss eine Zahl sein/]
    ])('P6: %s mit Text statt Zahl %j wird abgelehnt', async (typ, eintrag, thema) => {
        await abgelehnt(typ, datei(typ, [eintrag]), thema);
    });

    test('P7: eine Zahl als Text ("12", "1,5") geht durch und kommt als Zahl an — wie an der Datengrenze', async () => {
        const { bereit } = await angenommen(
            'characters',
            datei('characters', [{ id: 1, name: 'A', hpMax: '12', weight: '1,5', level: null }])
        );
        expect(plain(bereit.items[0])).toEqual({
            id: 1,
            name: 'A',
            hpMax: 12,
            weight: 1.5,
            level: null
        });
    });

    test.each([
        [
            'characters',
            { id: 1, name: 'Tempo', speed: 30 },
            /„speed“ muss Text sein, die Datei enthält die Zahl 30/
        ],
        ['spells', { id: 1, name: 'Z', school: 3 }, /„school“ muss Text sein/],
        [
            'wiki',
            { id: 1, title: 'W', content: { p: 1 } },
            /„content“ muss Text sein, die Datei enthält ein Objekt/
        ],
        ['npcs', { id: 1, name: 'N', description: 5 }, /„description“ muss Text sein/],
        [
            'encounters',
            { id: 1, name: 'E', traits: ['a'] },
            /„traits“ muss Text sein, die Datei enthält eine Liste/
        ],
        // Pruefer, Runde 2 (Sonden p11/p18, gemessen): ein einziger solcher Eintrag legte die
        // ganze NPC- bzw. Encounter-Liste dauerhaft lahm ("Anzeigefehler (npc.race ||
        // "").toLowerCase is not a function", auch nach dem Neuladen), die Link- und die
        // Zaubersuche warfen; die Suche der Truhe ebenso (eigene Nachmessung mit der Suche
        // jedes Reiters, Sonde p11c)
        [
            'npcs',
            { id: 1, name: 'N', race: 42 },
            /„race“ muss Text sein, die Datei enthält die Zahl 42/
        ],
        [
            'npcs',
            { id: 1, name: 'N', race: ['Elf'] },
            /„race“ muss Text sein, die Datei enthält eine Liste/
        ],
        ['encounters', { id: 1, name: 'E', creatureType: 7 }, /„creatureType“ muss Text sein/],
        ['encounters', { id: 1, name: 'E', race: 7 }, /„race“ muss Text sein/],
        ['links', { id: 1, title: 'L', url: 42 }, /„url“ muss Text sein/],
        ['spells', { id: 1, name: 'Z', material: 42 }, /„material“ muss Text sein/],
        ['spells', { id: 1, name: 'Z', note: 42 }, /„note“ muss Text sein/],
        ['loot', { id: 1, name: 'G', description: 42 }, /„description“ muss Text sein/],
        ['loot', { id: 1, name: 'G', special: ['x'] }, /„special“ muss Text sein/],
        ['loot', { id: 1, name: 'G', property: { a: 1 } }, /„property“ muss Text sein/]
    ])('P8: %s mit Zahl statt Text %j wird abgelehnt', async (typ, eintrag, thema) => {
        await abgelehnt(typ, datei(typ, [eintrag]), thema);
    });

    test('P9: ein fehlendes oder leeres Textfeld ist kein Fehler', async () => {
        const { bereit } = await angenommen(
            'characters',
            datei('characters', [{ id: 1, name: 'A', speed: null, notes: '' }])
        );
        expect(bereit.items).toHaveLength(1);
    });

    test('P10: die Eintraege werden gegen den Typ geprueft, in den importiert wird — erst NACH der Rueckfrage', async () => {
        const seite = erzeugeSeite();
        seite.antwort = false;
        // eine Orte-Datei mit einem Eintrag, den der Fraktionen-Reiter ablehnen wuerde
        await waehle(seite, 'factions', datei('locations', [{ id: 1, name: null }]));
        expect(seite.ctx.confirm).toHaveBeenCalledTimes(1);
        expect(seite.toasts).toEqual([]);
        const zwei = erzeugeSeite();
        zwei.antwort = true;
        await waehle(zwei, 'factions', datei('locations', [{ id: 1, name: null }]));
        expect(zwei.toasts).toEqual([
            expect.stringMatching(/^error: ❌ Eintrag 1 der Datei: der Name/)
        ]);
    });
});

// Befund der Pruefer (Runde 1, Sonden p3/p11, gemessen): die Form von Listen- und Objektfeldern
// prueft niemand. EINE Quest mit `tags: "eilig"` kam "✅ … importiert (hinzugefügt)" an, und der
// ganze Quest-Reiter zeigte danach nur "⚠️ Anzeigefehler tags.map is not a function" — auch
// nach dem Neuladen, ohne Strg+Z (Hinzufuegen legt keine Sicherheitskopie an). Dieselbe
// Fehlerklasse wie "name null legt die NPC-Liste lahm" (R3), nur ueber andere Felder. Die Felder
// hier sind die, an denen eine eigene Formprobe (je Typ, Feld und Form: Liste, Detail,
// Bearbeiten, Dashboard, Suche) einen Wurf gemessen hat; der Katalog ist REITER_FORMFELDER.
describe('REITERIMPORT R3 — Listen- und Objektfelder haben die Form, die die App liest', () => {
    test.each([
        [
            'quests',
            { tags: 'eilig' },
            /„tags“ muss eine Liste sein, die Datei enthält den Text „eilig“/
        ],
        ['quests', { tags: [null] }, /„tags“ darf keine leeren Einträge haben, an Stelle 1/],
        ['quests', { links: 'x' }, /„links“ muss eine Liste sein/],
        [
            'quests',
            { rewardItems: [{ id: 1, name: 'Schwert' }, null] },
            /„rewardItems“ muss eine Liste von Objekten sein, an Stelle 2 enthält die Datei nichts/
        ],
        [
            'characters',
            { items: { a: 1 } },
            /„items“ muss eine Liste sein, die Datei enthält ein Objekt/
        ],
        [
            'characters',
            { items: [1, null] },
            /„items“ darf keine leeren Einträge haben, an Stelle 2/
        ],
        ['characters', { conditions: 'vergiftet' }, /„conditions“ muss eine Liste sein/],
        [
            'characters',
            { attacks: [{ name: 'Axt' }, 'Dolch'] },
            /„attacks“ muss eine Liste von Objekten sein, an Stelle 2 enthält die Datei den Text „Dolch“/
        ],
        ['characters', { resistances: 'Feuer' }, /„resistances“ muss eine Liste sein/],
        [
            'characters',
            { immunities: 5 },
            /„immunities“ muss eine Liste sein, die Datei enthält die Zahl 5/
        ],
        [
            'characters',
            { languages: { a: 1 } },
            /„languages“ muss eine Liste oder ein Text sein, die Datei enthält ein Objekt/
        ],
        ['npcs', { tags: 'adel' }, /„tags“ muss eine Liste sein/],
        ['npcs', { links: [null] }, /„links“ muss eine Liste von Objekten sein/],
        ['npcs', { relations: [null] }, /„relations“ muss eine Liste von Objekten sein/],
        ['npcs', { triggers: 'x' }, /„triggers“ muss eine Liste sein/],
        ['npcs', { dialogs: [null] }, /„dialogs“ muss eine Liste von Objekten sein/],
        ['npcs', { quests: 'Fracht' }, /„quests“ muss eine Liste sein/],
        ['npcs', { info: 5 }, /„info“ muss eine Liste sein/],
        ['npcs', { relationships: { a: 1 } }, /„relationships“ muss eine Liste sein/],
        ['locations', { tags: [null] }, /„tags“ darf keine leeren Einträge haben/],
        ['locations', { links: 'x' }, /„links“ muss eine Liste sein/],
        ['encounters', { resistances: 'feuer' }, /„resistances“ muss eine Liste sein/],
        ['encounters', { conditionImmunities: 5 }, /„conditionImmunities“ muss eine Liste sein/],
        ['encounters', { languages: 5 }, /„languages“ muss eine Liste oder ein Text sein/],
        ['encounters', { monsters: [null] }, /„monsters“ muss eine Liste von Objekten sein/],
        ['loot', { tags: 5 }, /„tags“ muss eine Liste sein/],
        ['spells', { spellClasses: 'Magier' }, /„spellClasses“ muss eine Liste sein/],
        ['wiki', { tags: 'welt' }, /„tags“ muss eine Liste sein/],
        ['sessionPreps', { szenen: 'x' }, /„szenen“ muss eine Liste sein/],
        [
            'sessionPreps',
            { offeneFaeden: [null] },
            /„offeneFaeden“ muss eine Liste von Objekten sein/
        ],
        [
            'factions',
            { rufHistorie: {} },
            /„rufHistorie“ muss eine Liste sein, die Datei enthält ein Objekt/
        ],
        ['factions', { rufHistorie: [null] }, /„rufHistorie“ muss eine Liste von Objekten sein/]
    ])('L1: %s mit %j wird vor dem Fenster abgelehnt', async (typ, feld, thema) => {
        const name = { quests: 'title', wiki: 'title', sessionPreps: null }[typ];
        const eintrag = { id: 1, ...(name === null ? {} : { [name || 'name']: 'Probe' }), ...feld };
        const meldung = await abgelehnt(typ, datei(typ, [eintrag]), thema);
        expect(meldung).toMatch(/Eintrag 1 der Datei: /);
    });

    test('L2: jede Form, die die App selbst schreibt, geht durch — auch leer, null oder fehlend', async () => {
        const faelle = {
            characters: {
                id: 1,
                name: 'Thorin',
                items: [1, { id: 2, quantity: 3 }],
                conditions: [{ type: 'poisoned', duration: 2 }],
                attacks: [{ name: 'Axt', attackBonus: 6, damage: '1d8+3' }],
                resistances: ['poison'],
                immunities: [],
                languages: 'Gemeinsprache, Zwergisch',
                tags: [{ name: 'tank', color: '#a855f7' }],
                links: [{ type: 'npcs', id: 1 }],
                relationships: ['Bruder', { targetType: 'npc', targetId: 1 }]
            },
            npcs: {
                id: 1,
                name: 'Alrik',
                quests: ['Fracht'],
                info: [],
                relationships: ['Bruder von Vela'],
                triggers: [{ condition: 'Gold', reveal: 'gierig', triggered: false }],
                dialogs: [{ title: 'Gruss', text: 'Hallo', used: true }],
                relations: [{ targetId: 0, targetType: 'party', status: 'neutral' }],
                tags: null,
                links: []
            },
            encounters: {
                id: 1,
                name: 'Goblin',
                languages: ['common', 'goblin'],
                monsters: [{ name: 'Goblin', count: 2, encounterId: null }],
                resistances: [],
                tags: []
            },
            loot: { id: 1, name: 'Trank', tags: ['attunement', 'selten'] },
            wiki: { id: 1, title: 'Welt', tags: ['welt'] },
            spells: { id: 1, name: 'Feuerball', spellClasses: ['Magier'] },
            sessionPreps: {
                id: 1,
                szenen: [{ id: 1, titel: 'Hafen' }],
                offeneFaeden: [{ text: 'frei', quelleId: null, quelleTyp: 'manual' }]
            },
            factions: { id: 1, name: 'Gilde', rufHistorie: [{ datum: 1, delta: 2, grund: '' }] },
            quests: { id: 1, title: 'Fracht', rewardItems: [], tags: [], links: [] }
        };
        for (const [typ, eintrag] of Object.entries(faelle)) {
            const { bereit } = await angenommen(typ, datei(typ, [eintrag]));
            expect(bereit.items).toHaveLength(1);
        }
        // Ein Encounter mit Sprachen als Text (alte Daten, encounters-crud.js liest beides)
        await angenommen(
            'encounters',
            datei('encounters', [{ id: 1, name: 'E', languages: 'common' }])
        );
    });
});

describe('REITERIMPORT R6 — Ersetzen nur mit gueltigen, eindeutigen IDs', () => {
    test.each([
        [[{ id: 5 }, { id: 5 }], /die ID 5 kommt in der Datei doppelt vor \(Einträge 1 und 2\)/],
        [[{ id: 'abc' }], /Eintrag 1 der Datei hat die ungültige ID „abc“/],
        [[{ id: 1 }, { id: -1 }], /Eintrag 2 der Datei hat die ungültige ID -1/],
        [[{ id: 2.5 }], /die ungültige ID 2\.5/],
        [[{ name: 'ohne' }], /Eintrag 1 der Datei hat keine ID/],
        [[{ id: true }], /die ungültige ID true/],
        [[{ id: { a: 1 } }], /hat statt einer ID ein Objekt/],
        [[{ id: '7' }, { id: 7 }], /die ID 7 kommt in der Datei doppelt vor/],
        // Pruefer, Runde 1 (gemessen): sicher und positiv, aber ueber ENTITY_ID_MAX — die App
        // haelt sie fuer ungueltig (isValidEntityId()), der naechste Kampagnen-Rundlauf vergab
        // dem Eintrag eine neue ID und liess die Verweise darauf stehen
        [
            [{ id: 2e15 }],
            /Eintrag 1 der Datei hat die ID 2000000000000000 — eine ID darf höchstens 1\.000\.000\.000\.000\.000 sein/
        ],
        [
            [{ id: 1 }, { id: '1000000000000001' }],
            /Eintrag 2 der Datei hat die ID 1000000000000001/
        ],
        // Pruefer, Runde 1 (gemessen): ein Objekt mit eigenem toString/valueOf liess die Meldung
        // selbst werfen ("Cannot convert object to primitive value") — allgemeine Meldung und
        // Eintrag im Fehlerlog statt der deutschen Ablehnung
        [[{ id: { toString: 1 } }], /hat statt einer ID ein Objekt/],
        [[{ id: { valueOf: 'x', toString: 'y' } }], /hat statt einer ID ein Objekt/]
    ])('I1: %j — deutsch, nennt die ID, kein Laufzeittext', (eintraege, thema) => {
        const seite = erzeugeSeite();
        const fehler = seite.ctx.reiterIdFehler(eintraege);
        expect(fehler).toMatch(thema);
        expect(fehler).toMatch(/\bID\b/);
        expect(fehler).not.toMatch(ROHTEXT);
    });

    test('I2: positive ganze IDs, auch als Zahltext, sind in Ordnung — bis zur Obergrenze der App', () => {
        const seite = erzeugeSeite();
        expect(seite.ctx.reiterIdFehler([{ id: 1 }, { id: '2' }, { id: 300 }])).toBeNull();
        // ENTITY_ID_MAX selbst ist eine gueltige GESPEICHERTE ID (utils/utilities.js)
        expect(seite.ctx.reiterIdFehler([{ id: 1e15 }, { id: 1700000000000 }])).toBeNull();
    });

    test('I7: eine ID als Objekt mit toString — das Fenster geht auf, ohne Fehlerlog; Ersetzen lehnt deutsch ab', async () => {
        const { seite, bereit } = await angenommen(
            'npcs',
            '{"_format":"dnd-tracker/reiter-export@2","_dataType":"npcs","data":' +
                '[{"id":{"toString":1},"name":"Objekt-ID"}]}'
        );
        expect(seite.ctx.ErrorHandler.log).not.toHaveBeenCalled();
        expect(bereit.idFehler).toMatch(/hat statt einer ID ein Objekt/);
        modus(seite, 'replace');
        seite.ctx.executeImport('npcs');
        expect(seite.toasts).toEqual([
            expect.stringMatching(/^error: ❌ Ersetzen nicht möglich: /)
        ]);
        // "Hinzufügen" vergibt eine neue ID und geht weiter
        modus(seite, 'merge');
        seite.ctx.executeImport('npcs');
        expect(plain(seite.ctx.D.npcs).map(n => n.name)).toEqual(['Volo', 'Objekt-ID']);
    });

    test('I3: das Fenster geht auf; "Ersetzen" nennt den Grund und schreibt nichts, "Hinzufügen" schreibt', async () => {
        const D = { npcs: [{ id: 1, name: 'Volo' }] };
        const { seite, bereit } = await angenommen(
            'npcs',
            datei('npcs', [
                { id: 5, name: 'Doppel A' },
                { id: 5, name: 'Doppel B' }
            ]),
            D
        );
        expect(bereit.idFehler).toMatch(/die ID 5 kommt in der Datei doppelt vor/);
        // Hinzufuegen: die Vorschau warnt nicht vor den IDs
        expect(vorschauZeilen().join('\n')).not.toMatch(/doppelt/);
        modus(seite, 'replace');
        expect(vorschauZeilen()).toContain(`⚠️ ${bereit.idFehler}`);
        expect(vorschauZeilen().join('\n')).not.toMatch(/werden durch die Datei ersetzt/);

        seite.ctx.executeImport('npcs');
        expect(seite.toasts).toEqual([`error: ❌ ${bereit.idFehler}`]);
        expect(plain(seite.ctx.D.npcs)).toEqual([{ id: 1, name: 'Volo' }]);
        expect(seite.ctx.saveUndoState).not.toHaveBeenCalled();
        expect(seite.ctx.createAutoBackup).not.toHaveBeenCalled();
        expect(seite.ctx.save).not.toHaveBeenCalled();
        expect(seite.ctx.hideModal).not.toHaveBeenCalled();

        // dieselbe Datei, "Hinzufügen": neue IDs, geschrieben
        modus(seite, 'merge');
        seite.ctx.executeImport('npcs');
        expect(seite.ctx.D.npcs.map(n => n.name)).toEqual(['Volo', 'Doppel A', 'Doppel B']);
        expect(seite.ctx.D.npcs.map(n => n.id)).toEqual([1, 101, 102]);
        expect(seite.ctx.saveUndoState).toHaveBeenCalledTimes(1);
        expect(seite.toasts[1]).toBe('success: ✅ 2 NPCs importiert (hinzugefügt)');
    });

    test('I4: die ID "abc" wird VOR der Datengrenze gesehen (die Grenze loescht sie)', async () => {
        const { seite, bereit } = await angenommen(
            'npcs',
            datei('npcs', [{ id: 'abc', name: 'Text-ID' }])
        );
        expect(bereit.idFehler).toMatch(/„abc“/);
        expect(Object.prototype.hasOwnProperty.call(bereit.items[0], 'id')).toBe(false);
        modus(seite, 'replace');
        seite.ctx.executeImport('npcs');
        expect(seite.toasts[0]).toMatch(/^error: ❌ Ersetzen nicht möglich: .*„abc“/);
    });

    test('I5: gueltige IDs — Ersetzen schreibt, mit Undo-Punkt und Sicherheitskopie', async () => {
        const D = { npcs: [{ id: 1, name: 'Volo' }] };
        const { seite, bereit } = await angenommen(
            'npcs',
            datei('npcs', [
                { id: 3, name: 'C' },
                { id: '4', name: 'D' }
            ]),
            D
        );
        expect(bereit.idFehler).toBeNull();
        modus(seite, 'replace');
        expect(vorschauZeilen()).toContain(
            'Ersetzen: 1 vorhandener Eintrag wird durch die Datei ersetzt; vorher wird eine Sicherheitskopie angelegt'
        );
        seite.ctx.executeImport('npcs');
        expect(plain(seite.ctx.D.npcs)).toEqual([
            { id: 3, name: 'C' },
            { id: 4, name: 'D' }
        ]);
        expect(seite.ctx.saveUndoState).toHaveBeenCalledTimes(1);
        expect(seite.ctx.createAutoBackup).toHaveBeenCalledWith({ reason: 'safety' });
        expect(seite.toasts).toEqual(['success: ✅ 2 NPCs importiert (ersetzt)']);
    });

    test('I6: eine Vorbereitung ohne Urteil (aelterer Aufrufer) wird an den Eintraegen geprueft', () => {
        const seite = erzeugeSeite({ npcs: [] });
        seite.ctx.showImportModal('npcs', {
            dataType: 'npcs',
            items: [
                { id: 2, name: 'X' },
                { id: 2, name: 'Y' }
            ],
            kampagne: 'Test',
            exportDatum: 'unbekannt',
            hinweise: []
        });
        modus(seite, 'replace');
        seite.ctx.executeImport('npcs');
        expect(seite.toasts).toEqual([
            expect.stringMatching(/die ID 2 kommt in der Datei doppelt vor/)
        ]);
        expect(seite.ctx.D.npcs).toEqual([]);
    });
});

describe('REITERIMPORT R4 — der ganze Eintrag hin und zurueck', () => {
    const HELD = {
        id: 1,
        name: 'Thorin',
        characterClass: 'Kämpfer',
        background: 'Soldat (Sold < 15 GM & Bonus=2)',
        attributes: { str: 16, dex: 12, con: 15, int: 10, wis: 11, cha: 8 },
        armorClass: 18,
        tempHp: 5,
        speed: '9m|30ft.',
        currency: { gm: 120 },
        attacks: [{ name: 'Axt', attackBonus: '+6', damage: '1d8+3' }],
        notes: '<p>Notizen</p>',
        avatar: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        tags: [{ name: 'tank', color: '#a855f7' }],
        eigenesFeld: { tief: [1, 'zwei'] }
    };

    function exportiere(seite, typ) {
        // jsdom navigiert nicht: der Klick auf den Download-Link wird nur abgefangen
        const ankerTyp = Object.getPrototypeOf(document.createElement('a'));
        const klick = jest.spyOn(ankerTyp, 'click').mockImplementation(() => {});
        try {
            seite.ctx.exportData(typ);
        } finally {
            klick.mockRestore();
        }
        return seite.downloads.length ? JSON.parse(seite.downloads.pop()) : null;
    }

    test('E1: der Export traegt jeden Eintrag ganz und die Formatkennung; die Meldung nennt den Typ deutsch', () => {
        const seite = erzeugeSeite({ characters: [HELD] });
        const dateiInhalt = exportiere(seite, 'characters');
        expect(dateiInhalt._format).toBe(vm.runInContext('REITER_EXPORT_FORMAT', seite.ctx));
        expect(dateiInhalt._dataType).toBe('characters');
        expect(dateiInhalt.data).toEqual([HELD]);
        expect(seite.toasts).toEqual(['success: 📁 1 Charakter exportiert']);
    });

    test('E2: ohne Eintraege meldet der Export den deutschen Typnamen', () => {
        const seite = erzeugeSeite({ calendar: { events: [] } });
        expect(exportiere(seite, 'calendarEvents')).toBeNull();
        expect(seite.toasts).toEqual(['warning: Keine Ereignisse zum Exportieren vorhanden']);
    });

    test('E3: Export -> Import: der Eintrag kommt tief gleich an, keine Warnung', async () => {
        const quelle = erzeugeSeite({ characters: [HELD] });
        const text = JSON.stringify(exportiere(quelle, 'characters'));
        const { bereit } = await angenommen('characters', text, { characters: [] });
        expect(plain(bereit.items)).toEqual([HELD]);
        expect(bereit.hinweise).toEqual([]);
        expect(vorschauZeilen().join('\n')).not.toMatch(/Formatkennung|Ältere/);
    });

    test('E4: nur die HTML-Felder werden bereinigt — Klartext mit < & = bleibt, wie er ist', async () => {
        const held = {
            ...HELD,
            notes: '<p>gut</p><img src="kanarie-u.notes.png" data-kanarie="u.notes">'
        };
        const { bereit } = await angenommen('characters', datei('characters', [held]));
        const item = plain(bereit.items[0]);
        expect(item.notes).toBe('<p>gut</p>');
        expect(item.background).toBe(HELD.background);
        expect({ ...item, notes: HELD.notes }).toEqual(HELD);
    });

    test('E5: alte Datei ohne Formatkennung — Warnung, die erfundenen Felder werden verworfen, nichts abgebildet', async () => {
        const alt = {
            id: 1,
            name: 'Brom',
            class: 'Paladin',
            hpTemp: 4,
            ac: 17,
            str: 18,
            dex: 9,
            con: 16,
            int: 8,
            wis: 12,
            cha: 15,
            avatarUrl: 'https://example.org/brom.png',
            speed: '9m|30ft.',
            notes: '<p>Brom</p>'
        };
        const text = JSON.stringify({ _dataType: 'characters', _campaignName: 'Alt', data: [alt] });
        const { bereit } = await angenommen('characters', text, { characters: [] });
        expect(plain(bereit.items)).toEqual([
            { id: 1, name: 'Brom', speed: '9m|30ft.', notes: '<p>Brom</p>' }
        ]);
        const warnung = bereit.hinweise.find(h => h.warnung);
        expect(warnung.text).toMatch(/^⚠️ Ältere Exportdatei ohne Formatkennung/);
        expect(warnung.text).toMatch(/class, ac, hpTemp, str, dex, con, int, wis, cha, avatarUrl/);
        expect(vorschauZeilen()).toContain(warnung.text);
    });

    test('E6: ein alter Wiki-Export ohne erfundene Felder warnt trotzdem — die Warnung haengt an der Kennung', async () => {
        const eintrag = { id: 1, title: 'Chronik', content: '<p>Archiv</p>', parentId: null };
        const text = JSON.stringify({ _dataType: 'wiki', data: [eintrag] });
        const { bereit } = await angenommen('wiki', text, { wiki: [] });
        expect(plain(bereit.items)).toEqual([eintrag]);
        expect(bereit.hinweise).toEqual([
            {
                text: expect.stringMatching(/^⚠️ Ältere Exportdatei ohne Formatkennung/),
                warnung: true
            }
        ]);
        expect(bereit.hinweise[0].text).not.toMatch(/Nicht übernommen/);
    });

    test('E7: die erfundenen Felder gelten nur fuer alte Dateien — ein ganzer Eintrag mit `ac` behaelt ihn', async () => {
        const { bereit } = await angenommen(
            'encounters',
            datei('encounters', [{ id: 1, name: 'Goblin', ac: 15, str: 8 }])
        );
        expect(plain(bereit.items)).toEqual([{ id: 1, name: 'Goblin', ac: 15, str: 8 }]);
    });

    test('E8: eine fremde Formatkennung warnt eigens', async () => {
        const { bereit } = await angenommen(
            'npcs',
            datei('npcs', [{ id: 1, name: 'N' }], { _format: 'anderes-format@9' })
        );
        expect(bereit.hinweise).toEqual([
            { text: expect.stringMatching(/^⚠️ Unbekannte Formatkennung/), warnung: true }
        ]);
    });
});

describe('REITERIMPORT — der neue Eingang erreicht die Datengrenze (SENKEN R4)', () => {
    // Die Verdrahtung (importData -> bereinigeDatengrenze, Ergebnis verwendet) prueft
    // tests/unit/datengrenze.test.js im Aufrufgraph. Hier die Wirkung am echten Weg: was die
    // Grenze an jedem anderen Eingang tut, tut sie auch hier — auch in einer verschachtelten
    // Sammlung (Kalender-Ereignisse liegen unter calendar.events).
    test('G1: toString/valueOf fallen weg, ein Objekt in category/type wird leer, in jeder Tiefe', async () => {
        const { bereit } = await angenommen(
            'quests',
            datei('quests', [
                {
                    id: 1,
                    title: 'Q',
                    toString: 'x',
                    type: { a: 1 },
                    tags: [{ name: 't', color: '#ffffff', valueOf: 2 }]
                }
            ])
        );
        expect(plain(bereit.items)).toEqual([
            { id: 1, title: 'Q', type: '', tags: [{ name: 't', color: '#ffffff' }] }
        ]);
    });

    test('G2: Kalender-Ereignisse: Zahltext im Datum wird Zahl, die Grenze greift unter calendar.events', async () => {
        const { bereit } = await angenommen(
            'calendarEvents',
            datei('calendarEvents', [
                { id: '3', titel: 'T', datum: { tag: '4', monat: 2, jahr: '1492' }, valueOf: 1 }
            ])
        );
        expect(plain(bereit.items)).toEqual([
            { id: 3, titel: 'T', datum: { tag: 4, monat: 2, jahr: 1492 } }
        ]);
    });
});
