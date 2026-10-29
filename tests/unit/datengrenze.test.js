/**
 * Datengrenze und sichere Attributwerte — Vertrag der Hilfen R2/R3/R4
 * (Vertrag SENKEN, docs/bugfixes.md)
 *
 * DER BEFUND. Ueber den Kampagnen-Import liefen eingeschleuste Scripte aus 29
 * Text- und 49 Zahlen-/Verweisfeldern (Wert als Text statt Zahl, z. B.
 * `characters.hpCurrent`, `quests.giverId`, `quests.links[].id`). Gemessen in
 * genau den 49 Feldern, die FELDER unten auffuehrt. Dieselbe Messung fand
 * weitere Zahlen-/Verweisfelder, die als Text in D stehen blieben, ohne dass
 * ihre Ansicht geoeffnet wurde - darunter Felder mit benannter Senke
 * (`characters.proficiencyBonus` im Wuerfel-Reiter, `npcs.locationId` in der
 * Telefon-Suche, `initiative.round` im DM-Screen, `links[].id` jeder
 * Sammlung in den Verknuepfungen). Sie stehen in FELDER_BEKANNT; ohne sie
 * waere eine Grenzfunktion gruen, die genau die 49 gemessenen Pfade kennt
 * und den Rest roh durchlaesst. Jedes dieser Felder schreibt die App selbst
 * als Zahl (parseInt/parseFloat/nextId in der jeweiligen Speicherfunktion).
 * `sanitizeImportedItem()` bereinigt nur 15 HTML-Felder auf oberster Ebene;
 * Backup-Wiederherstellung,
 * Datei-Backup, Migrations-Assistent, der Start (`load()`) und der zweite Tab
 * bereinigen gar nicht. `normalizeCampaignData()` entfernt verbotene Schluessel
 * nur auf dem Import-Weg, der Startpfad von `load()` fuehrt
 * `Object.assign(D, parsed.p)` ohne jeden Filter aus. Werte aus Daten landen
 * ausserdem roh in `class`, `style` und `href`.
 *
 * DIE VIER HILFEN (utils/basic.js; Paritaetskopie in utils/testable-utils.js):
 *
 *   R3 `sichererLink(url)` -> `url` oder `''`. Nur `http:`, `https:`,
 *      `mailto:`. Ein Browser entfernt vor dem Schema fuehrende Leer- und
 *      Steuerzeichen und IM Schema Tabulator und Zeilenumbruch, und er
 *      ignoriert Gross/Klein — `"\tjava\nScRiPt:..."` ist fuer ihn
 *      `javascript:`. Deshalb pruefen diese Faelle eine Erlaubnisliste, keine
 *      Sperrliste. Ein erlaubter Link kommt unveraendert zurueck (nicht
 *      "repariert"), alles andere als Leertext — "sonst kein Link".
 *   R2 `sichereFarbe(wert, ersatz)`: nur `#rgb`/`#rrggbb`, sonst der feste
 *      Ersatz (der darf auch `var(--gold)` sein — er kommt aus dem Code).
 *   R2 `sichereKlasse(wert, erlaubteWerte, ersatz)`: nur ein Wert aus der
 *      Erlaubnisliste, sonst der Ersatz. `__proto__`, `constructor`,
 *      `toString` sind keine erlaubten Werte, auch wenn eine Pruefung per
 *      Objekt-Nachschlagen sie "findet".
 *   R4 `bereinigeDatengrenze(daten)` -> die bereinigten Daten (dasselbe
 *      Objekt oder eine Kopie, beides erlaubt). Zwingt die bekannten Zahlen-
 *      und Verweisfelder auf Zahl (`"12"` -> 12; alte Exporte mit Zahlen als
 *      Text werden UMGEWANDELT, nicht verworfen), verwirft dort Markup
 *      (Feld entfernt, `null` oder ein Zahl-Standard — nur kein Text), und
 *      entfernt `__proto__`/`constructor`/`prototype` in jeder Tiefe. Sie
 *      ist KEIN Sanitizer: Texte, Wuerfelformeln mit `<`/`>`, Namen mit
 *      `&`, `<`, `"`, Umlaute, Emojis und Rich-Text bleiben byte-gleich (R5 —
 *      sanitizeHTML auf alle Felder zerstoerte Wuerfelformeln, und die
 *      Ausgabe kodiert ohnehin, R1). Der Typzwang haengt an Sammlung UND
 *      Feld, nicht am Feldnamen allein: `shops[].items[].weight` ist Text
 *      ("1,5 kg"), `loot[].weight` eine Zahl; `soundboard.scenes[].id`
 *      ("scene_1") und die Widget-IDs des DM-Screens sind Text, die IDs der
 *      Sammlungen Zahlen; `characters[].speed` ist Text ("7.5m"), obwohl das
 *      alte IO_SCHEMA dort `number` behauptet. Eine Grenzfunktion, die jedes
 *      `weight`/`id`/`speed` zur Zahl zwingt, loescht solche Werte — die
 *      R5-Faelle unten halten sie fest.
 *
 * WARUM BEIDE KOPIEN. utils/basic.js wird wie in sanitizer-parity.test.js in
 * eine vm-Sandbox geladen (das Produktionsmodul hat keinen Export). Die
 * Paritaetskopie wird ueber `require` geladen, nicht ueber vm: jest.config.cjs
 * haelt fuer utils/testable-utils.js eine Coverage-Schwelle (branches 89),
 * und `npm run test:coverage` laeuft in der CI. Neue Zweige, die nur in einer
 * vm-Sandbox laufen, saehe Istanbul nicht — die Schwelle fiele. Die Kopie muss
 * die vier Hilfen deshalb auch in `module.exports` fuehren.
 *
 * DATEN IM RICHTIGEN REALM. Die Testdaten fuer die vm-Kopie entstehen per
 * `JSON.parse` IN der Sandbox, wie in der App: ein Objekt aus dem Jest-Realm
 * haette ein fremdes `Object.prototype`, und eine korrekte Implementierung
 * mit `instanceof`/Prototyp-Vergleich wuerde hier faelschlich rot.
 *
 * DIE NUTZLASTEN sind nur Zeichenketten; nichts davon wird ausgefuehrt. Wo
 * sie Code enthalten, setzt er hoechstens ein Fenster-Flag (`window.__xss`).
 *
 * VERDRAHTUNG. Eine richtige Grenzfunktion, die nur der Kampagnen-Import
 * aufruft, liesse Backup, Datei-Backup, Migration und den Start offen — genau
 * die Wege, auf denen heute gar nichts bereinigt. Der letzte Block prueft
 * deshalb im Aufrufgraph ueber loader.js MODULES, dass JEDER der fuenf
 * Eingaenge des Vertrags (`importDataGlobal`, `restoreBackup`,
 * `restoreFromFileBackup`, `importFullExport`, `load` — der zweite Tab und der
 * Kampagnenwechsel laufen ueber `load`) die Funktion erreicht, direkt oder
 * ueber eine Hilfe, und ihr ERGEBNIS verwendet: der Vertrag erlaubt eine
 * Kopie, ein verworfener Rueckgabewert bereinigte dann nichts. Die Eingaenge
 * stehen dort nur als Funktionsnamen, nicht als Modulpfade (Abdeckungsregel
 * in module-test-coverage.test.js). Das ersetzt nicht den E2E-Waechter; es
 * meldet den halben Fix nur frueher und mit Namen.
 *
 * HEUTE ROT: keine der vier Hilfen existiert (Stand main 020e258).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const acorn = require('acorn');
const { extractModulesFromLoader } = require('../../tools/generate-eslint-globals.js');

const HILFEN = ['sichererLink', 'sichereFarbe', 'sichereKlasse', 'bereinigeDatengrenze'];

// ============================================================
// LADEN — beide Kopien, je mit eigenem Realm fuer die Testdaten
// ============================================================

function ladeProduktion() {
    const context = {
        window: { APP_CONFIG: global.APP_CONFIG },
        document: global.document,
        DOMParser: global.DOMParser,
        Node: global.Node,
        console,
        module: { exports: {} }
    };
    vm.createContext(context);
    const quelle = fs.readFileSync(path.join(__dirname, '../../utils/basic.js'), 'utf8');
    vm.runInContext(quelle, context);
    const hilfe = name => {
        // Funktionsdeklaration (am Kontext), window-Export oder const-Bindung.
        if (typeof context[name] === 'function') return context[name];
        if (context.window && typeof context.window[name] === 'function')
            return context.window[name];
        return vm.runInContext(`typeof ${name} === 'function' ? ${name} : undefined`, context);
    };
    return {
        hilfe,
        daten: json => vm.runInContext(`JSON.parse(${JSON.stringify(json)})`, context),
        prototyp: () => vm.runInContext('Object.prototype', context)
    };
}

function ladeParitaetskopie() {
    const exporte = require('../../utils/testable-utils.js');
    return {
        hilfe: name => (typeof exporte[name] === 'function' ? exporte[name] : undefined),
        daten: json => JSON.parse(json),
        prototyp: () => Object.prototype
    };
}

const QUELLEN = [
    ['utils/basic.js', ladeProduktion],
    ['utils/testable-utils.js', ladeParitaetskopie]
];

const geladen = new Map();
function quelle(name) {
    if (!geladen.has(name)) geladen.set(name, QUELLEN.find(([n]) => n === name)[1]());
    return geladen.get(name);
}
/** Liefert die Hilfe oder wirft mit klarer Meldung (heute: sie fehlt). */
function brauche(quellName, hilfsName) {
    const fn = quelle(quellName).hilfe(hilfsName);
    if (typeof fn !== 'function') {
        throw new Error(
            `${hilfsName}() fehlt in ${quellName} — Vertrag SENKEN R2/R3/R4 ` +
                '(bei der Paritaetskopie: auch in module.exports).'
        );
    }
    return fn;
}

// ============================================================
// R3 — sichererLink
// ============================================================
const LINK_VERBOTEN = [
    'javascript:window.__xss=1',
    'JaVaScRiPt:window.__xss=1',
    'JAVASCRIPT:window.__xss=1',
    ' javascript:window.__xss=1',
    '\tjavascript:window.__xss=1',
    '\njavascript:window.__xss=1',
    '\u0000javascript:window.__xss=1',
    '\u001fjavascript:window.__xss=1',
    'java\tscript:window.__xss=1',
    'java\nscript:window.__xss=1',
    'data:text/html,<script>window.__xss=1</script>',
    'DATA:text/html;base64,PHNjcmlwdD53aW5kb3cuX194c3M9MTwvc2NyaXB0Pg==',
    'vbscript:window.__xss=1',
    'VBScript:window.__xss=1',
    // erlaubtes Schema nur IRGENDWO im Text - faengt eine unverankerte Pruefung
    'javascript:window.__xss=1//https://example.com/',
    'javascript://https://example.com/%0awindow.__xss=1',
    'data:text/html,mailto:x<script>window.__xss=1</script>'
];
const LINK_ERLAUBT = [
    'http://example.com/',
    'https://example.com/pfad?a=1&b=2#anker',
    'HTTPS://Example.com/Seite',
    'mailto:dm@example.com',
    'MAILTO:dm@example.com'
];
const KEIN_TEXT = [null, undefined, 42, true, {}, []];

// ============================================================
// R2 — sichereFarbe / sichereKlasse
// ============================================================
const FARBE_ERLAUBT = ['#abc', '#aabbcc', '#A1B2C3', '#000', '#ffffff', '#d4af37'];
const FARBE_VERBOTEN = [
    'red;background:url(x)',
    '"><img src=x onerror="window.__xss=1">',
    '#abc;background:url(x)',
    '#aabbcc"',
    '#abc" onmouseover="window.__xss=1',
    '#aabbcc;}</style><img src=x onerror=window.__xss=1>',
    'url(javascript:window.__xss=1)',
    'expression(window.__xss=1)',
    ''
];
const KLASSEN = ['friendly', 'neutral', 'hostile'];
const KLASSE_VERBOTEN = [
    'hostile" onmouseover="window.__xss=1',
    'friendly hostile',
    'hostile x',
    '<img src=x onerror=window.__xss=1>',
    '',
    '__proto__',
    'constructor',
    'toString',
    'hasOwnProperty',
    'valueOf',
    'length'
];
/** Nicht eindeutig geregelt — nur: Ergebnis ist ein erlaubter Wert oder der Ersatz. */
const KLASSE_GRENZFAELLE = ['Hostile', ' hostile', 'hostile ', ['hostile'], 0, null, undefined, {}];

// ============================================================
// R4 — bereinigeDatengrenze
// ============================================================

/**
 * Die 49 Zahlen- und Verweisfelder, in denen der Kampagnen-Import ein Script
 * ausfuehrte (gemessen, Stand 020e258), plus `npcs[].relations[].targetId`,
 * das der Vertrag ausdruecklich nennt. Je Feld: ein legitimer Wert aus einem
 * alten Export (Text) und die Zahl, zu der er werden muss.
 */
const FELDER = [
    ['characters[0].armorClass', '15', 15],
    ['characters[0].attributes.str', '14', 14],
    ['characters[0].attributes.dex', '12', 12],
    ['characters[0].attributes.con', '13', 13],
    ['characters[0].attributes.int', '10', 10],
    ['characters[0].attributes.wis', '8', 8],
    ['characters[0].attributes.cha', '16', 16],
    ['characters[0].currency.pm', '1', 1],
    ['characters[0].currency.gm', '120', 120],
    ['characters[0].currency.em', '3', 3],
    ['characters[0].currency.sm', '45', 45],
    ['characters[0].currency.km', '7', 7],
    ['characters[0].hpCurrent', '12', 12],
    ['characters[0].hpMax', '20', 20],
    ['characters[0].tempHp', '5', 5],
    ['characters[0].initiative', '2', 2],
    ['characters[0].level', '3', 3],
    ['characters[0].passivePerception', '13', 13],
    ['encounters[0].ac', '13', 13],
    ['encounters[0].hp', '27', 27],
    ['encounters[0].init', '1', 1],
    ['encounters[0].perception', '11', 11],
    ['encounters[0].str', '15', 15],
    ['encounters[0].dex', '14', 14],
    ['encounters[0].con', '12', 12],
    ['encounters[0].int', '6', 6],
    ['encounters[0].wis', '10', 10],
    ['encounters[0].cha', '7', 7],
    ['factions[0].ruf', '-2', -2],
    ['initiative.combatants[0].currentHp', '9', 9],
    ['initiative.combatants[0].maxHp', '11', 11],
    ['initiative.combatants[0].initiative', '17', 17],
    ['initiative.combatants[0].effects[0].id', '4', 4],
    ['initiative.combatants[0].effects[0].duration', '3', 3],
    ['initiative.combatants[1].currentHp', '30', 30],
    ['initiative.combatants[1].maxHp', '30', 30],
    ['initiative.combatants[1].initiative', '8', 8],
    ['loot[0].quantity', '2', 2],
    ['loot[0].weight', '1.5', 1.5],
    ['quests[0].giverId', '4', 4],
    ['quests[0].locationId', '5', 5],
    ['quests[0].targetId', '6', 6],
    ['quests[0].links[0].id', '3', 3],
    ['npcs[0].relations[0].targetId', '7', 7],
    ['randomTables[0].entries[0].weight', '2', 2],
    ['randomTables[0].entries[1].weight', '1', 1],
    ['sessionNotes[0].number', '5', 5],
    ['shops[0].items[0].quantity', '3', 3],
    ['shops[0].items[1].quantity', '10', 10],
    ['spells[0].level', '3', 3]
];

/**
 * Weitere Zahlen- und Verweisfelder: dieselbe Messung (Import) fand sie als Text
 * in D, ohne dass eine Ansicht sie ausgab. Jedes schreibt die App als Zahl;
 * die Quelle steht dahinter.
 */
const FELDER_BEKANNT = [
    // Verweise — auch verschachtelt in JEDER Sammlung (Vertrag R4)
    ['npcs[0].links[0].id', '1', 1], // Verknuepfungen: data-id
    ['locations[0].links[0].id', '2', 2],
    ['factions[0].links[0].id', '3', 3],
    ['npcs[0].locationId', '13', 13], // Telefon-Suche: data-loc
    ['npcs[0].factionId', '4', 4], // npc-crud: parseInt
    ['quests[0].rewardItems[0].id', '7', 7], // quests-crud: parseInt
    ['factions[0].sitzOrtId', '13', 13],
    ['shops[0].npcId', '2', 2], // shops-core: parseInt
    ['shops[0].locationId', '13', 13],
    ['wiki[0].parentId', '14', 14], // wiki-crud: parseInt
    ['sessionNotes[0].arcId', '1', 1], // sessions: parseInt
    ['sessionPreps[0].offeneFaeden[0].quelleId', '8', 8], // parseEntityId
    // Entitaets-IDs: der Import nummeriert neu, load() und Backup nicht
    ['characters[0].id', '1', 1],
    ['npcs[0].id', '2', 2],
    ['encounters[0].id', '3', 3],
    ['quests[0].id', '8', 8],
    ['shops[0].id', '11', 11],
    ['initiative.combatants[0].id', '5', 5],
    // Zahlen mit benannter Senke
    ['characters[0].proficiencyBonus', '3', 3], // Wuerfel: mod/modStr per Verkettung
    ['initiative.round', '2', 2], // DM-Screen: Initiative-Widget
    ['initiative.currentTurn', '1', 1],
    ['initiative.combatants[0].ac', '18', 18],
    ['initiative.combatants[0].initBonus', '1', 1],
    // weitere Zahlen aus den Speicherfunktionen
    ['characters[0].weight', '80', 80], // party-crud: parseInt
    ['characters[0].height', '140', 140],
    ['quests[0].rewardGold', '250', 250],
    ['loot[0].value', '12.5', 12.5], // initiative-loot: parseFloat
    ['sessionPreps[0].sessionNr', '3', 3],
    ['bestiary[0].ac', '13', 13], // bestiary-crud: parseInt
    ['bestiary[0].hp', '30', 30],
    ['bestiary[0].xp', '450', 450],
    ['bestiary[0].legendaryActionsPerRound', '1', 1],
    ['calendar.day', '3', 3], // timeline-crud
    ['calendar.month', '2', 2],
    ['calendar.year', '1492', 1492]
];
const ALLE_FELDER = [...FELDER, ...FELDER_BEKANNT];

const MARKUP = '<img src=x onerror="window.__xss=1">';

/** Grundgeruest einer Kampagne, in das die Felder geschrieben werden. */
function geruest() {
    return {
        characters: [
            {
                id: 1,
                name: 'Ölfrieda „Grünbart“ 🐉 & <Söhne> "Zwerg"',
                notes: 'Wirf 2d6+3 >= 10, bei <5 ein Patzer',
                speed: '7.5m',
                hitDice: '5W10',
                attributes: {},
                currency: {}
            }
        ],
        npcs: [
            {
                id: 2,
                name: 'Café-Wirt 🍺 <Ü&Ö>',
                description: '<p><b>fett</b> &amp; <i>kursiv</i></p>',
                relations: [{ targetType: 'npcs', status: 'friendly', note: 'Bruder & "Rivale"' }],
                links: [{ type: 'quests' }]
            }
        ],
        locations: [{ id: 13, name: 'Hafen', links: [{ type: 'npcs' }] }],
        encounters: [{ id: 3, name: 'Goblins', cr: '1/2', notes: '1d4 < 3: Flucht' }],
        factions: [{ id: 4, name: 'Diebesgilde', links: [{ type: 'npcs' }] }],
        initiative: {
            combatants: [
                { id: 5, name: 'Ork', effects: [{ name: 'Vergiftet' }] },
                { id: 6, name: 'Elf' }
            ],
            currentTurn: 0,
            round: 1
        },
        loot: [{ id: 7, name: 'Heiltrank' }],
        quests: [
            {
                id: 8,
                title: 'Die „Krone“ & das <Schwert>',
                links: [{ type: 'npcs' }],
                rewardItems: [{ name: 'Flammenschwert' }]
            }
        ],
        randomTables: [
            {
                id: 9,
                name: 'Wald',
                entries: [{ text: '1d4 < 3: Wölfe' }, { text: '2d6 >= 7: Händler' }]
            }
        ],
        sessionNotes: [{ id: 10, title: 'Sitzung' }],
        shops: [
            {
                id: 11,
                name: 'Krämer',
                items: [
                    { name: 'Seil', weight: '1,5 kg', cost: '1 GM' },
                    { name: 'Fackel', weight: '0,5 kg', cost: '15 KM' }
                ]
            }
        ],
        spells: [{ id: 12, name: 'Feuerball', damage: '8d6' }],
        wiki: [{ id: 14, title: 'Lore' }],
        sessionPreps: [{ id: 15, offeneFaeden: [{ text: 'Fracht', quelleTyp: 'quest' }] }],
        bestiary: [{ id: 16, name: 'Sumpfschrat', hpFormula: '4W8+12', speed: { walk: '9 m' } }],
        bestiaryFavorites: ['custom:16', 'goblin'],
        calendar: { events: [] },
        soundboard: { scenes: [{ id: 'scene_1', name: 'Taverne', tracks: [] }] },
        dmScreenLayout: { widgets: [{ id: 'party-stats', type: 'party', visible: true }] }
    };
}

function zerlege(pfad) {
    const teile = [];
    for (const stueck of pfad.split('.')) {
        const m = stueck.match(/^([^[]+)((?:\[\d+\])*)$/);
        teile.push(m[1]);
        for (const idx of m[2].match(/\d+/g) || []) teile.push(Number(idx));
    }
    return teile;
}
function setze(obj, pfad, wert) {
    const teile = zerlege(pfad);
    let o = obj;
    for (let i = 0; i < teile.length - 1; i++) o = o[teile[i]];
    o[teile[teile.length - 1]] = wert;
}
function lies(obj, pfad) {
    let o = obj;
    for (const t of zerlege(pfad)) {
        if (o === null || o === undefined) return undefined;
        o = o[t];
    }
    return o;
}
/** Kampagne als JSON-Text; `belegung` setzt jedes Feld aus FELDER. */
function kampagneAlsJson(belegung) {
    const k = geruest();
    if (belegung) for (const [pfad, alt, zahl] of ALLE_FELDER) setze(k, pfad, belegung(alt, zahl));
    return JSON.stringify(k);
}
/** Ergebnis in den Jest-Realm holen (fuer Vergleiche ohne Realm-Unterschiede). */
function klar(wert) {
    return JSON.parse(JSON.stringify(wert));
}

const ergebnisCache = new Map();
function bereinigt(quellName, art, belegung) {
    const schluessel = `${quellName}|${art}`;
    if (!ergebnisCache.has(schluessel)) {
        const fn = brauche(quellName, 'bereinigeDatengrenze');
        const daten = quelle(quellName).daten(kampagneAlsJson(belegung));
        const erg = fn(daten);
        ergebnisCache.set(schluessel, { daten, erg });
    }
    return ergebnisCache.get(schluessel);
}

// Verbotene Schluessel — als JSON-Text, damit "__proto__" ein EIGENES Feld wird
// (genau so kommt es aus JSON.parse einer Importdatei).
const GIFT_JSON = `{
  "__proto__": { "__r4Verseucht": "oben" },
  "prototype": { "__r4Verseucht": "prototype" },
  "characters": [ {
      "id": 1, "name": "Ada",
      "__proto__": { "__r4Verseucht": "charakter", "hpCurrent": "<img src=x>" },
      "constructor": { "prototype": { "__r4Verseucht": "konstruktor" } },
      "attributes": { "str": 10, "__proto__": { "__r4Verseucht": "attribute" } }
  } ],
  "quests": [ { "id": 2, "title": "Q", "links": [ { "type": "npcs", "id": 3,
      "__proto__": { "__r4Verseucht": "link" } } ] } ],
  "loot": [ { "id": 4, "name": "L", "prototype": { "__r4Verseucht": "loot" } } ],
  "wiki": [ { "id": 5, "title": "W", "meta": { "tief": { "tiefer": {
      "__proto__": { "__r4Verseucht": "tief" }, "behalten": "ja" } } } } ]
}`;
const GIFT_ORTE = [
    ['', '__proto__'],
    ['', 'prototype'],
    ['characters[0]', '__proto__'],
    ['characters[0]', 'constructor'],
    ['characters[0].attributes', '__proto__'],
    ['quests[0].links[0]', '__proto__'],
    ['loot[0]', 'prototype'],
    ['wiki[0].meta.tief.tiefer', '__proto__']
];

// ============================================================
// TESTS
// ============================================================
describe.each(QUELLEN.map(([n]) => [n]))('Vertrag SENKEN — Hilfen in %s', quellName => {
    afterAll(() => {
        // Falls eine Implementierung den Prototyp doch verseucht: nicht in
        // andere Tests durchsickern lassen.
        for (const proto of [
            Object.prototype,
            geladen.has(quellName) && quelle(quellName).prototyp()
        ]) {
            if (proto) delete proto.__r4Verseucht;
        }
    });

    test('alle vier Hilfen sind vorhanden', () => {
        const fehlend = HILFEN.filter(h => typeof quelle(quellName).hilfe(h) !== 'function');
        expect(fehlend).toEqual([]);
    });

    describe('R3 sichererLink(url) -> url oder ""', () => {
        test.each(LINK_VERBOTEN.map(u => [JSON.stringify(u), u]))('kein Link: %s', (_n, url) => {
            expect(brauche(quellName, 'sichererLink')(url)).toBe('');
        });
        test.each(LINK_ERLAUBT.map(u => [u]))('bleibt unveraendert: %s', url => {
            expect(brauche(quellName, 'sichererLink')(url)).toBe(url);
        });
        test.each(KEIN_TEXT.map(w => [JSON.stringify(w) ?? 'undefined', w]))(
            'kein Text -> "": %s',
            (_n, wert) => {
                expect(brauche(quellName, 'sichererLink')(wert)).toBe('');
            }
        );
        test('leerer Text -> ""', () => {
            expect(brauche(quellName, 'sichererLink')('')).toBe('');
        });
    });

    describe('R2 sichereFarbe(wert, ersatz) — nur #rgb/#rrggbb', () => {
        const ERSATZ = '#d4af37';
        test.each(FARBE_ERLAUBT.map(f => [f]))('bleibt: %s', farbe => {
            expect(brauche(quellName, 'sichereFarbe')(farbe, ERSATZ)).toBe(farbe);
        });
        test.each(FARBE_VERBOTEN.map(f => [JSON.stringify(f), f]))(
            'Ersatz statt %s',
            (_n, farbe) => {
                expect(brauche(quellName, 'sichereFarbe')(farbe, ERSATZ)).toBe(ERSATZ);
            }
        );
        test.each(KEIN_TEXT.map(w => [JSON.stringify(w) ?? 'undefined', w]))(
            'kein Text -> Ersatz: %s',
            (_n, wert) => {
                expect(brauche(quellName, 'sichereFarbe')(wert, ERSATZ)).toBe(ERSATZ);
            }
        );
        test('der Ersatz kommt unveraendert zurueck, auch wenn er keine Hex-Farbe ist', () => {
            expect(brauche(quellName, 'sichereFarbe')('red;x:y', 'var(--gold)')).toBe(
                'var(--gold)'
            );
        });
        test('fuehrende/folgende Leerzeichen: Ersatz oder die getrimmte Farbe, nie der Rohwert', () => {
            const fn = brauche(quellName, 'sichereFarbe');
            expect([ERSATZ, '#abc']).toContain(fn(' #abc', ERSATZ));
            expect([ERSATZ, '#abc']).toContain(fn('#abc\n', ERSATZ));
        });
    });

    describe('R2 sichereKlasse(wert, erlaubteWerte, ersatz) — nur aus der Erlaubnisliste', () => {
        const ERSATZ = 'neutral';
        test.each(KLASSEN.map(k => [k]))('bleibt: %s', klasse => {
            expect(brauche(quellName, 'sichereKlasse')(klasse, KLASSEN, ERSATZ)).toBe(klasse);
        });
        test.each(KLASSE_VERBOTEN.map(k => [JSON.stringify(k), k]))(
            'Ersatz statt %s',
            (_n, klasse) => {
                expect(brauche(quellName, 'sichereKlasse')(klasse, KLASSEN, ERSATZ)).toBe(ERSATZ);
            }
        );
        test.each(KLASSE_GRENZFAELLE.map(k => [JSON.stringify(k) ?? 'undefined', k]))(
            'Grenzfall %s -> ein erlaubter Wert oder der Ersatz',
            (_n, wert) => {
                expect([...KLASSEN, ERSATZ]).toContain(
                    brauche(quellName, 'sichereKlasse')(wert, KLASSEN, ERSATZ)
                );
            }
        );
        test('der Ersatz kommt unveraendert zurueck, auch wenn er nicht in der Liste steht', () => {
            expect(brauche(quellName, 'sichereKlasse')('boese" x="y', KLASSEN, '')).toBe('');
        });
    });

    describe('R4 bereinigeDatengrenze(daten) — Typzwang, verbotene Schluessel, sonst unveraendert', () => {
        test('liefert die bereinigten Daten zurueck', () => {
            const { erg } = bereinigt(quellName, 'alt', alt => alt);
            expect(erg).toBeTruthy();
            expect(typeof erg).toBe('object');
        });

        test.each(ALLE_FELDER)(
            'Zahl als Text aus altem Export: %s %j -> Zahl',
            (pfad, _alt, zahl) => {
                const { erg } = bereinigt(quellName, 'alt', alt => alt);
                expect(lies(erg, pfad)).toBe(zahl);
            }
        );

        test.each(ALLE_FELDER)(
            'Markup im Zahl-/Verweisfeld %s wird verworfen (kein Text)',
            pfad => {
                const { erg } = bereinigt(quellName, 'markup', () => MARKUP);
                const wert = lies(erg, pfad);
                const ok =
                    wert === undefined ||
                    wert === null ||
                    (typeof wert === 'number' && Number.isFinite(wert));
                expect({ pfad, wert, ok }).toEqual({ pfad, wert, ok: true });
            }
        );

        test('Verweise in links[]/relations[]: kein Eintrag behaelt eine Text-ID', () => {
            const { erg } = bereinigt(quellName, 'markup', () => MARKUP);
            const links = ['quests', 'npcs', 'locations', 'factions'].flatMap(s =>
                (lies(erg, `${s}[0].links`) || []).map(l => l && l.id)
            );
            const relationen = (lies(erg, 'npcs[0].relations') || []).map(r => r && r.targetId);
            expect([...links, ...relationen].filter(v => typeof v === 'string')).toEqual([]);
        });

        test('schon richtig getypte, legitime Daten kommen unveraendert heraus (R5)', () => {
            const { erg } = bereinigt(quellName, 'zahl', (_alt, zahl) => zahl);
            const erwartet = JSON.parse(kampagneAlsJson((_alt, zahl) => zahl));
            expect(klar(erg)).toEqual(erwartet);
        });

        test('Texte bleiben byte-gleich: Wuerfelformeln mit < und >, & < " Umlaute Emojis, Rich-Text, CR "1/2"', () => {
            const { erg } = bereinigt(quellName, 'alt', alt => alt);
            expect(lies(erg, 'characters[0].name')).toBe(
                'Ölfrieda „Grünbart“ 🐉 & <Söhne> "Zwerg"'
            );
            expect(lies(erg, 'characters[0].notes')).toBe('Wirf 2d6+3 >= 10, bei <5 ein Patzer');
            expect(lies(erg, 'npcs[0].name')).toBe('Café-Wirt 🍺 <Ü&Ö>');
            expect(lies(erg, 'npcs[0].description')).toBe('<p><b>fett</b> &amp; <i>kursiv</i></p>');
            expect(lies(erg, 'npcs[0].relations[0].note')).toBe('Bruder & "Rivale"');
            expect(lies(erg, 'encounters[0].cr')).toBe('1/2');
            expect(lies(erg, 'encounters[0].notes')).toBe('1d4 < 3: Flucht');
            expect(lies(erg, 'quests[0].title')).toBe('Die „Krone“ & das <Schwert>');
            expect(lies(erg, 'randomTables[0].entries[0].text')).toBe('1d4 < 3: Wölfe');
            expect(lies(erg, 'randomTables[0].entries[1].text')).toBe('2d6 >= 7: Händler');
            expect(lies(erg, 'spells[0].damage')).toBe('8d6');
            expect(lies(erg, 'quests[0].links[0].type')).toBe('npcs');
        });

        test('Textfelder mit dem Namen eines Zahlenfelds bleiben Text (R5, Typzwang je Sammlung)', () => {
            const { erg } = bereinigt(quellName, 'alt', alt => alt);
            const soll = {
                'shops[0].items[0].weight': '1,5 kg',
                'shops[0].items[1].weight': '0,5 kg',
                'shops[0].items[1].cost': '15 KM',
                'characters[0].speed': '7.5m',
                'characters[0].hitDice': '5W10',
                'bestiary[0].hpFormula': '4W8+12',
                'bestiary[0].speed.walk': '9 m',
                'bestiaryFavorites[0]': 'custom:16',
                'soundboard.scenes[0].id': 'scene_1',
                'dmScreenLayout.widgets[0].id': 'party-stats'
            };
            const ist = Object.fromEntries(Object.keys(soll).map(p => [p, lies(erg, p)]));
            expect(ist).toEqual(soll);
        });

        test('legitime Sonderwerte bleiben: 0, negative Zahl, null (unbegrenzter Bestand)', () => {
            const fn = brauche(quellName, 'bereinigeDatengrenze');
            const k = geruest();
            k.characters[0].hpCurrent = 0;
            k.characters[0].tempHp = 0;
            k.factions[0].ruf = -3;
            k.shops[0].items[0].quantity = null;
            const erg = fn(quelle(quellName).daten(JSON.stringify(k)));
            expect(lies(erg, 'characters[0].hpCurrent')).toBe(0);
            expect(lies(erg, 'characters[0].tempHp')).toBe(0);
            expect(lies(erg, 'factions[0].ruf')).toBe(-3);
            expect(lies(erg, 'shops[0].items[0].quantity')).toBeNull();
        });

        test('unbekannte Felder und Sammlungen bleiben erhalten', () => {
            const fn = brauche(quellName, 'bereinigeDatengrenze');
            const k = geruest();
            k.characters[0].eigeneNotiz = 'bleibt <da>';
            k.zukunftsSammlung = [{ id: 1, wert: 'x' }];
            const erg = klar(fn(quelle(quellName).daten(JSON.stringify(k))));
            expect(erg.characters[0].eigeneNotiz).toBe('bleibt <da>');
            expect(erg.zukunftsSammlung).toEqual([{ id: 1, wert: 'x' }]);
            expect(erg.characters).toHaveLength(1);
            expect(erg.initiative.combatants).toHaveLength(2);
        });

        test('zweimal angewandt aendert nichts mehr (load() laeuft wiederholt)', () => {
            const fn = brauche(quellName, 'bereinigeDatengrenze');
            const einmal = klar(fn(quelle(quellName).daten(kampagneAlsJson(alt => alt))));
            const zweimal = klar(fn(quelle(quellName).daten(JSON.stringify(einmal))));
            expect(zweimal).toEqual(einmal);
        });

        test('leeres Objekt: kein Wurf, ein Objekt zurueck', () => {
            const fn = brauche(quellName, 'bereinigeDatengrenze');
            const erg = fn(quelle(quellName).daten('{}'));
            expect(erg).toBeTruthy();
            expect(typeof erg).toBe('object');
        });

        describe('verbotene Schluessel __proto__/constructor/prototype in jeder Tiefe', () => {
            let erg;
            let proto;
            beforeAll(() => {
                const fn = brauche(quellName, 'bereinigeDatengrenze');
                proto = quelle(quellName).prototyp();
                erg = fn(quelle(quellName).daten(GIFT_JSON));
            });

            test.each(GIFT_ORTE)('%s: kein eigenes Feld %s mehr', (ort, schluessel) => {
                const obj = ort ? lies(erg, ort) : erg;
                expect(obj).toBeTruthy();
                expect(Object.prototype.hasOwnProperty.call(obj, schluessel)).toBe(false);
            });

            test.each(GIFT_ORTE)('%s: nichts Verseuchtes ueber die Prototypkette (%s)', ort => {
                const obj = ort ? lies(erg, ort) : erg;
                expect('__r4Verseucht' in obj).toBe(false);
            });

            test('Object.prototype im Realm der Daten ist unberuehrt', () => {
                expect(Object.prototype.hasOwnProperty.call(proto, '__r4Verseucht')).toBe(false);
            });

            test('die legitimen Nachbarn bleiben stehen', () => {
                expect(lies(erg, 'characters[0].name')).toBe('Ada');
                expect(lies(erg, 'characters[0].attributes.str')).toBe(10);
                expect(lies(erg, 'quests[0].links[0].id')).toBe(3);
                expect(lies(erg, 'quests[0].links[0].type')).toBe('npcs');
                expect(lies(erg, 'wiki[0].meta.tief.tiefer.behalten')).toBe('ja');
            });

            test('ein __proto__-Feld schiebt keinen Text in ein Zahlenfeld', () => {
                // Das verseuchte __proto__ des Charakters traegt hpCurrent: "<img src=x>".
                // Wird es per Zuweisung kopiert, erbt der Charakter diesen Text.
                expect(typeof lies(erg, 'characters[0].hpCurrent')).not.toBe('string');
            });
        });
    });
});

// ============================================================
// R4 — Grenzfaelle: Nicht-Text, Zahlenlisten, Gestalt
// ============================================================
// Nachgetragen mit der Umsetzung (SENKEN, Datengrenze). Die Faelle oben belegen jedes
// Feld mit Text; diese hier belegen, was die Umsetzung mit allem ANDEREN tut, das in einer
// Importdatei stehen kann — und sie halten die Coverage-Schwelle der Paritaetskopie
// (jest.config.cjs, branches 89), weil jeder Zweig der Grenze hier einmal laeuft.
//   - Eine Liste in einem Zahlenfeld ist kein harmloser Wert: `${['<img …>']}` ergibt im
//     Template genau ihren Text. Objekt und Liste fallen deshalb weg wie Markup.
//   - Wahrheitswert, '' und null tragen kein Markup und bleiben (R5: nichts Legitimes
//     aendern, was keine Gefahr ist).
//   - Zahlenlisten (Zauberplaetze, Mitglieder-IDs, Wiki-Verlauf) behalten ihre Positionen:
//     spellSlotsUsed[i] haengt am Grad. Ein unbrauchbarer Eintrag wird null, keine Luecke.
//   - Was keine Liste/kein Objekt ist, wo eine Liste/ein Objekt hingehoert, wird
//     uebersprungen statt zu werfen — die Grenze laeuft bei jedem Start (load()).
describe.each(QUELLEN.map(([n]) => [n]))('R4 Grenzfaelle der Datengrenze — %s', quellName => {
    const lauf = k =>
        klar(
            brauche(quellName, 'bereinigeDatengrenze')(quelle(quellName).daten(JSON.stringify(k)))
        );

    test('Objekt und Liste in einem Zahlenfeld fallen weg (eine Liste wird im Template zu ihrem Text)', () => {
        const k = geruest();
        k.characters[0].hpCurrent = [MARKUP];
        k.characters[0].hpMax = { wert: MARKUP };
        k.quests[0].links[0].id = [3];
        const erg = lauf(k);
        expect(lies(erg, 'characters[0].hpCurrent')).toBeUndefined();
        expect(lies(erg, 'characters[0].hpMax')).toBeUndefined();
        expect(lies(erg, 'quests[0].links[0].id')).toBeUndefined();
    });

    test('Wahrheitswert, leerer Text und null bleiben; Zahlformen aus Text werden Zahl', () => {
        const k = geruest();
        k.characters[0].level = true;
        k.characters[0].xp = '';
        k.npcs[0].locationId = null;
        k.characters[0].hpCurrent = ' 12 ';
        k.loot[0].weight = '1,5';
        k.factions[0].ruf = '+3';
        const erg = lauf(k);
        expect(lies(erg, 'characters[0].level')).toBe(true);
        expect(lies(erg, 'characters[0].xp')).toBe('');
        expect(lies(erg, 'npcs[0].locationId')).toBeNull();
        expect(lies(erg, 'characters[0].hpCurrent')).toBe(12);
        expect(lies(erg, 'loot[0].weight')).toBe(1.5);
        expect(lies(erg, 'factions[0].ruf')).toBe(3);
    });

    test('Zahlenlisten: Text wird Zahl, Unbrauchbares wird null, die Positionen bleiben', () => {
        const k = geruest();
        k.characters[0].spellSlotsUsed = ['1', MARKUP, 0, [2], { x: 1 }, null];
        k.factions[0].mitgliederNpcIds = [2, '13'];
        k.wikiRecentlyViewed = ['14', MARKUP];
        const erg = lauf(k);
        expect(lies(erg, 'characters[0].spellSlotsUsed')).toEqual([1, null, 0, null, null, null]);
        expect(lies(erg, 'factions[0].mitgliederNpcIds')).toEqual([2, 13]);
        expect(erg.wikiRecentlyViewed).toEqual([14, null]);
    });

    test('Inventar eines Helden: Altformat (Zahl) bleibt, {id, quantity} wird Zahl, Markup faellt', () => {
        const k = geruest();
        k.characters[0].items = [3, { id: '7', quantity: '2' }, { id: MARKUP, quantity: 1 }];
        k.characters[0].spells = ['12', MARKUP, 4];
        const erg = lauf(k);
        expect(lies(erg, 'characters[0].items')).toEqual([
            3,
            { id: 7, quantity: 2 },
            { quantity: 1 }
        ]);
        expect(lies(erg, 'characters[0].spells')).toEqual([12, null, 4]);
    });

    test('Zahlenliste, die keine Liste ist: Text/Objekt wird leere Liste, null bleibt', () => {
        const k = geruest();
        k.factions[0].mitgliederNpcIds = MARKUP;
        k.characters[0].spellSlotsMax = { 0: '4' };
        k.wikiRecentlyViewed = null;
        const erg = lauf(k);
        expect(lies(erg, 'factions[0].mitgliederNpcIds')).toEqual([]);
        expect(lies(erg, 'characters[0].spellSlotsMax')).toEqual([]);
        expect(erg.wikiRecentlyViewed).toBeNull();
    });

    test('falsche Gestalt wirft nicht: Sammlung als Text, Eintrag als Text, Liste als Objekt', () => {
        const k = geruest();
        k.characters.push(MARKUP, null, 7);
        k.characters[0].attributes = MARKUP;
        k.quests[0].links = { 0: { id: MARKUP } };
        k.npcs = MARKUP;
        k.initiative.combatants[0].effects = MARKUP;
        const erg = lauf(k);
        expect(erg.characters.slice(1)).toEqual([MARKUP, null, 7]);
        expect(lies(erg, 'characters[0].attributes')).toBe(MARKUP);
        expect(erg.npcs).toBe(MARKUP);
        // Kein Typzwang durch eine Liste, die keine ist — das ist Formsache, nicht R4
        expect(lies(erg, 'quests[0].links')).toEqual({ 0: { id: MARKUP } });
    });

    test('dasselbe Objekt an zwei Stellen wird einmal bereinigt, verbotene Schluessel in Listen', () => {
        const fn = brauche(quellName, 'bereinigeDatengrenze');
        const daten = quelle(quellName).daten(
            '{"characters":[{"id":"1","__proto__":{"x":1}}],"liste":[[{"prototype":{"y":2}}]]}'
        );
        daten.zweitesMal = daten.characters[0];
        const erg = fn(daten);
        expect(erg.zweitesMal).toBe(erg.characters[0]);
        expect(erg.characters[0].id).toBe(1);
        expect(Object.prototype.hasOwnProperty.call(erg.characters[0], '__proto__')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(erg.liste[0][0], 'prototype')).toBe(false);
    });

    test.each([[null], [undefined], ['Text'], [42]])(
        'kein Objekt (%p): unveraendert zurueck',
        wert => {
            expect(brauche(quellName, 'bereinigeDatengrenze')(wert)).toBe(wert);
        }
    );
});

// ============================================================
// R4 VERDRAHTUNG — jeder Eingang erreicht bereinigeDatengrenze()
// ============================================================
const EINGAENGE = [
    'importDataGlobal',
    'restoreBackup',
    'restoreFromFileBackup',
    'importFullExport',
    'load'
];
const GRENZE = 'bereinigeDatengrenze';

/**
 * Aufrufgraph ueber loader.js MODULES: Name einer Modulfunktion -> Namen aller
 * Funktionen, die ihr Rumpf aufruft (auch in Rueckrufen darin; `f()`,
 * `window.f()`, `f?.()`). Ein Aufruf der Grenze, dessen Ergebnis als
 * Anweisung verworfen wird, zaehlt als `<GRENZE>:verworfen`.
 */
function aufrufgraph() {
    const repo = path.resolve(__dirname, '..', '..');
    const module = extractModulesFromLoader(fs.readFileSync(path.join(repo, 'loader.js'), 'utf8'));
    const graph = new Map();
    for (const rel of module) {
        const ast = acorn.parse(fs.readFileSync(path.join(repo, rel), 'utf8'), {
            ecmaVersion: 'latest',
            sourceType: 'script',
            allowReturnOutsideFunction: true,
            allowHashBang: true
        });
        for (const st of ast.body) {
            let name = null;
            let rumpf = null;
            if (st.type === 'FunctionDeclaration' && st.id) {
                name = st.id.name;
                rumpf = st;
            } else if (st.type === 'VariableDeclaration') {
                const d = st.declarations.find(
                    x => x.id.type === 'Identifier' && x.init && /Function/.test(x.init.type)
                );
                if (d) {
                    name = d.id.name;
                    rumpf = d.init;
                }
            }
            if (!name) continue;
            const ziele = new Set();
            (function lauf(n, vater) {
                if (!n || typeof n.type !== 'string') return;
                if (n.type === 'CallExpression') {
                    let c = n.callee;
                    if (
                        c.type === 'MemberExpression' &&
                        !c.computed &&
                        c.object.type === 'Identifier' &&
                        c.object.name === 'window'
                    ) {
                        c = c.property;
                    }
                    if (c.type === 'Identifier') {
                        const verworfen =
                            c.name === GRENZE && vater && vater.type === 'ExpressionStatement';
                        ziele.add(verworfen ? `${GRENZE}:verworfen` : c.name);
                    }
                }
                for (const k of Object.keys(n)) {
                    if (k === 'loc') continue;
                    const v = n[k];
                    if (Array.isArray(v)) v.forEach(x => lauf(x, n));
                    else if (v && typeof v.type === 'string') lauf(v, n);
                }
            })(rumpf, null);
            graph.set(name, ziele);
        }
    }
    return graph;
}

describe('R4 Verdrahtung — jeder Eingang erreicht bereinigeDatengrenze() und verwendet ihr Ergebnis', () => {
    let graph;
    beforeAll(() => {
        graph = aufrufgraph();
    });

    test('alle Eingaenge des Vertrags gibt es im Quellbaum (sonst prueft dieser Block nichts)', () => {
        expect(EINGAENGE.filter(e => !graph.has(e))).toEqual([]);
    });

    test.each(EINGAENGE)('%s erreicht bereinigeDatengrenze()', eingang => {
        const gesehen = new Set([eingang]);
        const offen = [eingang];
        let verworfen = false;
        while (offen.length) {
            for (const z of graph.get(offen.shift()) || []) {
                if (z === `${GRENZE}:verworfen`) verworfen = true;
                if (!gesehen.has(z)) {
                    gesehen.add(z);
                    if (graph.has(z)) offen.push(z);
                }
            }
        }
        const erreicht = gesehen.has(GRENZE);
        expect({
            eingang,
            erreicht,
            hinweis: !erreicht && verworfen ? 'nur mit verworfenem Ergebnis aufgerufen' : ''
        }).toEqual({ eingang, erreicht: true, hinweis: '' });
    });
});
