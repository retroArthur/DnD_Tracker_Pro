/**
 * EntityLookup liest immer frisch — Vertrag RUECKSPRUNG, Regel R1 (docs/bugfixes.md)
 *
 * BEFUND (gemessen am Buendel, Stand 785cdeb). `EntityLookup` in render/helpers.js
 * hat einen abschaltbaren Zwischenspeicher. Ist er eingeschaltet, legt get() jedes
 * Ergebnis unter "<Sammlung>-<id>" ab — auch einen Fehltreffer (null) — und gibt es
 * beim naechsten Aufruf zurueck, ohne in D nachzusehen. Beim Schreiben wird er nie
 * ungueltig. Eingeschaltet bleibt er nach renderInit() mit 0 Kaempfern (also nach
 * jedem Laden ohne laufenden Kampf), nach renderDMScreen() ohne Grid-Widgets, nach
 * jedem Fehler in einer der acht Darstellungsfunktionen, die ihn ein- und
 * ausschalten, und nach Party-Aktionen, die renderInit() rufen (Lange Rast,
 * HP-Rechner, Zustand setzen). Die Folge fuer den Nutzer: Wiki, Links, Zauber,
 * Sitzungsnotizen und Truhe laden beim zweiten Bearbeiten (Stift) nach einem
 * Speichern den ALTEN Stand ins Formular, und das naechste Speichern schreibt ihn
 * zurueck — in D, im Speicher und nach dem Neuladen; vier der fuenf melden dabei
 * "aktualisiert". Der Wiki-Pin pinnt nach einem Bearbeiten das verwaiste Objekt, D
 * bleibt ungepinnt. Heldenkarte, Wiki-Schnellzugriff, Brotkrumen, Loesch-Rueckfragen
 * und der Markdown-Export des Zaubers zeigen alte Namen und geloeschte Eintraege.
 *
 * URSACHE. Die fuenf Speicherpfade (saveWikiEntry, saveLink, saveSpell, saveSession,
 * saveLoot) ERSETZEN das Objekt im Array — `D.wiki[idx] = { ...D.wiki[idx], ...entry }` —
 * und die Loeschpfade filtern das Array neu. Die abgelegte Referenz zeigt danach auf
 * ein Objekt, das nicht mehr in D steht. Wer es ins Formular laedt, speichert es
 * zurueck; wer hineinschreibt (toggleWikiPin), schreibt ins Leere. enableCache()
 * leert die Ablage nicht einmal, ein spaeteres Darstellungsfenster sieht also auch
 * Eintraege von vorher.
 *
 * REGEL R1 — Lesen ist immer frisch. Jede Lesestelle ueber EntityLookup liefert das
 * Objekt, das im Moment des Aufrufs in D steht: nach Ersetzen das neue, nach Loeschen
 * null, nach Anlegen das angelegte — gleich, welche Ansicht, Aktion oder welcher
 * Fehler vorausging. Geprueft wird mit toBe (dieselbe Referenz), nicht mit toEqual:
 * toggleWikiPin schreibt in das gelieferte Objekt, und nur die Referenz aus D traegt
 * eine solche Aenderung in den Speicher.
 *
 * WARUM DER SCHALTER NUR BEDIENT WIRD, WENN ES IHN GIBT. Freigegeben ist, den
 * Zwischenspeicher abzuschaffen; ein zweiter Schritt entfernt enableCache() und
 * clearCache() samt ihrer Aufrufe. Jeder R1-Fall versetzt EntityLookup deshalb in den
 * Zustand, in dem es heute nach dem Laden ohne Kampf steht — enableCache(), aber nur,
 * wenn die Methode existiert — und liest nie `_cache` oder `_cacheEnabled`. Der
 * Vertrag haengt am Verhalten, nicht an den Innereien. Ein Fix, der nur die Aufrufer
 * diszipliniert (clearCache() im finally aller acht Darstellungsfunktionen), laesst
 * diese Datei absichtlich rot: der Fehler sitzt im Leser, und jede kuenftige
 * Einschaltstelle ohne finally risse das Leck wieder auf (Fixvergleich im Vertrag).
 * Die Kehrseite des "nur, wenn es ihn gibt": derselbe Fix mit UMBENANNTEM Schalter
 * (beginBatch()/endBatch() statt enableCache()/clearCache()) oder mit einem
 * Kennzeichen, das die Darstellungsfunktionen direkt setzen, liesse jeden R1-Fall
 * gruen — zustandNachDemLaden() kennt den neuen Schalter nicht und prueft den Leser
 * im ausgeschalteten Zustand (am Mutanten nachgemessen: 25 von 25 gruen). Das schliesst
 * W2: der Quellbaum darf EntityLookup nur ueber Leser bedienen, die ein R1-Fall dieser
 * Datei deckt, und ueber den einen bekannten Schalter.
 *
 * DIE BEQUEMLICHKEITSMETHODEN. Je ein Fall fuer die fuenf, ueber die der gemessene
 * Datenverlust laeuft: wiki() (editWikiEntry, toggleWikiPin), link() (editLink),
 * spell() (editSpell), sessionNote() (editSession), lootItem() (showLootModal,
 * showLootDetail). Ersetzt und geloescht wird jeweils so, wie der Speicher- bzw.
 * Loeschpfad es tut, mit dem Namensfeld, das die Sammlung wirklich traegt (Wiki und
 * Links: title; Zauber, Sitzungsnotizen, Truhe: name). Zwischen Ersetzen und Lesen
 * steht bewusst KEIN save(): saveLoot() ruft showLootDetail() vor window.save(), und
 * save() ist entprellt — ein Fix, der die Ablage erst beim Speichern leert, kaeme zu
 * spaet (Fixvergleich im Vertrag).
 *
 * DIE UEBRIGEN SIEBEN (R1-9). character(), npc(), location(), quest(), encounter(),
 * shop() und filter() gelten heute nur als geschuetzt, weil ihre eigenen
 * Darstellungsfunktionen die Ablage leeren — solange die nicht werfen und keine
 * Party-Aktion folgt. Ihre Speicherpfade ersetzen genauso an derselben Stelle. Ohne
 * diese Faelle machte ein Fix diese Datei gruen, der nur die fuenf
 * Datenverlust-Sammlungen an der Ablage vorbeischleust und den Rest weiter veralten
 * laesst (am Mutanten nachgemessen).
 *
 * KONTROLLEN, heute und nach dem Fix gruen: ohne eingeschalteten Schalter ist get()
 * schon heute frisch; eine Aenderung AM Objekt (dieselbe Referenz, wie bei
 * toggleQuestStatus) ist auch mit Schalter sichtbar; findByName() liest nie aus der
 * Ablage; ungueltige IDs und fehlende Sammlungen liefern null. Waechter W1 haelt die
 * Tabelle dieser Datei gegen das Modul: jede Methode liest die genannte Sammlung —
 * sonst pruefte ein Fall eine Sammlung, die der Datenverlust-Pfad gar nicht liest.
 * Waechter W2 liest die Module aus loader.js und laesst an EntityLookup nur die
 * gedeckten Leser und enableCache()/clearCache() zu; ein neuer Leser braucht hier
 * einen R1-Fall, ein neuer Schalter muss in zustandNachDemLaden().
 *
 * Werkbank: ein vm-Kontext, der zugleich `window` ist, mit den ECHTEN Quelldateien in
 * Loader-Reihenfolge (wie tests/unit/next-id.test.js). Frischer Kontext je Fall — die
 * Ablage ist Modulzustand und darf nicht von einem Fall in den naechsten reichen.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { extractModulesFromLoader } = require('../../tools/generate-eslint-globals.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
// Loader-Reihenfolge (loader.js MODULES). core/data.js legt window.D an,
// render/helpers.js braucht parseEntityId() aus utils/utilities.js.
const MODULE = [
    'core/config.js',
    'core/data.js',
    'utils/basic.js',
    'utils/utilities.js',
    'render/helpers.js'
];
const SKRIPTE = MODULE.map(
    rel => new vm.Script(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'), { filename: rel })
);

/**
 * Frischer vm-Kontext mit den echten Modulen; der Kontext ist zugleich `window`.
 * @returns {Object} der Kontext (ctx.D, ctx.EntityLookup)
 */
function ladeKontext() {
    const ctx = { setTimeout, clearTimeout };
    ctx.window = ctx;
    ctx.document = {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    };
    ctx.ErrorHandler = { log: jest.fn() };
    ctx.debugLogAdd = jest.fn();
    vm.createContext(ctx);
    for (const skript of SKRIPTE) skript.runInContext(ctx);
    // render/helpers.js bringt ein echtes ErrorHandler-Objekt mit Konsolen-Senke mit —
    // durch den stummen Stub ersetzen (wie tests/unit/next-id.test.js).
    ctx.ErrorHandler = { log: jest.fn() };
    return ctx;
}

/**
 * Versetzt EntityLookup in den Zustand, in dem es heute nach dem Laden ohne Kampf
 * steht (renderInit() mit 0 Kaempfern schaltet ein und nicht wieder aus). Nur, wenn
 * es den Schalter gibt — der Fix darf ihn entfernen (siehe Kopf).
 * @param {Object} lookup - ctx.EntityLookup
 */
function zustandNachDemLaden(lookup) {
    if (typeof lookup.enableCache === 'function') lookup.enableCache();
}

/**
 * Die fuenf Bequemlichkeitsmethoden, ueber die der gemessene Datenverlust laeuft.
 * Namen wie im Modul; `leser` nennt die Funktionen, die ueber sie laden bzw. anzeigen.
 */
const DATENVERLUST_PFADE = [
    {
        methode: 'wiki',
        sammlung: 'wiki',
        feld: 'title',
        alt: 'Waterdeep',
        leser: 'editWikiEntry, toggleWikiPin'
    },
    { methode: 'link', sammlung: 'links', feld: 'title', alt: 'Weltkarte', leser: 'editLink' },
    { methode: 'spell', sammlung: 'spells', feld: 'name', alt: 'Feuerball', leser: 'editSpell' },
    {
        methode: 'sessionNote',
        sammlung: 'sessionNotes',
        feld: 'name',
        alt: 'Der Anfang',
        leser: 'editSession'
    },
    {
        methode: 'lootItem',
        sammlung: 'loot',
        feld: 'name',
        alt: 'Heiltrank',
        leser: 'showLootModal, showLootDetail'
    }
];

/**
 * Saat fuer einen Datenverlust-Pfad: zwei Eintraege, der erste traegt den alten Namen.
 * @param {Object} fall - Eintrag aus DATENVERLUST_PFADE
 * @returns {Object[]}
 */
function saatFuer(fall) {
    return [
        { id: 1, [fall.feld]: fall.alt },
        { id: 2, [fall.feld]: 'Zweiter Eintrag' }
    ];
}

/**
 * Die uebrigen sieben Bequemlichkeitsmethoden (R1-9, siehe Kopf). `speicherpfad`
 * nennt die Funktion, die an derselben Stelle ersetzt; Filter haben keinen Weg zum
 * Umbenennen (nur Anlegen und Loeschen) — dort haelt der Fall die Zusage der
 * Schnittstelle.
 */
const UEBRIGE_LESER = [
    {
        methode: 'character',
        sammlung: 'characters',
        feld: 'name',
        alt: 'Thorin',
        speicherpfad: 'saveCharacter'
    },
    { methode: 'npc', sammlung: 'npcs', feld: 'name', alt: 'Elminster', speicherpfad: 'saveNPC' },
    {
        methode: 'location',
        sammlung: 'locations',
        feld: 'name',
        alt: 'Tiefwasser',
        speicherpfad: 'saveLocation'
    },
    {
        methode: 'quest',
        sammlung: 'quests',
        feld: 'title',
        alt: 'Die verlorene Mine',
        speicherpfad: 'saveQuest'
    },
    {
        methode: 'encounter',
        sammlung: 'encounters',
        feld: 'name',
        alt: 'Goblin-Hinterhalt',
        speicherpfad: 'saveEncounter'
    },
    { methode: 'shop', sammlung: 'shops', feld: 'name', alt: 'Schmiede', speicherpfad: 'saveShop' },
    { methode: 'filter', sammlung: 'filters', feld: 'name', alt: 'Stadt', speicherpfad: '—' }
];

/**
 * Die Leser, die ein Fall dieser Datei deckt: get() ueber R1-1 bis R1-3 und R1-6,
 * getName() ueber R1-4, exists() ueber R1-5, findByName() ueber K3, die
 * Bequemlichkeitsmethoden ueber R1-7/R1-8 bzw. R1-9. W2 laesst im Quellbaum nur diese
 * zu (und SCHALTER).
 */
const GEDECKTE_LESER = [
    'get',
    'getName',
    'exists',
    'findByName',
    ...DATENVERLUST_PFADE.map(f => f.methode),
    ...UEBRIGE_LESER.map(f => f.methode)
];

/** Der Schalter, den zustandNachDemLaden() bedient, und sein Gegenstueck. */
const SCHALTER = ['enableCache', 'clearCache'];

describe('R1 — Lesen ist immer frisch (Vertrag RUECKSPRUNG)', () => {
    let ctx;
    let lookup;
    beforeEach(() => {
        ctx = ladeKontext();
        lookup = ctx.EntityLookup;
    });

    test('R1-1: nach Ersetzen an derselben Stelle liefert get() das neue Objekt', () => {
        ctx.D.wiki = [
            { id: 1, title: 'Waterdeep' },
            { id: 2, title: 'Baldurs Tor' }
        ];
        zustandNachDemLaden(lookup);
        // Erstes Bearbeiten: der Ladepfad liest den Eintrag (die ID kommt aus dem DOM
        // als Zeichenkette). Saat-Pruefung.
        expect(lookup.get('wiki', '1')).toBe(ctx.D.wiki[0]);

        // Speichern ersetzt das Objekt an derselben Stelle, wie saveWikiEntry().
        ctx.D.wiki[0] = { ...ctx.D.wiki[0], title: 'Waterdeep NEU' };

        // Zweites Bearbeiten.
        const nachher = lookup.get('wiki', '1');
        expect(nachher?.title).toBe('Waterdeep NEU');
        expect(nachher).toBe(ctx.D.wiki[0]);
    });

    test('R1-2: nach Loeschen liefert get() null', () => {
        ctx.D.spells = [
            { id: 1, name: 'Feuerball' },
            { id: 2, name: 'Magisches Geschoss' }
        ];
        zustandNachDemLaden(lookup);
        expect(lookup.get('spells', 1)).toBe(ctx.D.spells[0]);

        // Loeschen filtert das Array neu, wie deleteSpell().
        ctx.D.spells = ctx.D.spells.filter(s => s.id !== 1);

        expect(lookup.get('spells', 1)).toBeNull();
    });

    test('R1-3: nach einem Fehltreffer (null) und anschliessendem Anlegen liefert get() das angelegte', () => {
        ctx.D.links = [];
        zustandNachDemLaden(lookup);
        expect(lookup.get('links', 7)).toBeNull();

        ctx.D.links.push({ id: 7, title: 'Weltkarte' });

        expect(lookup.get('links', 7)).toBe(ctx.D.links[0]);
    });

    test('R1-4: getName() nennt nach dem Umbenennen den neuen Namen', () => {
        ctx.D.spells = [{ id: 1, name: 'Feuerball' }];
        zustandNachDemLaden(lookup);
        expect(lookup.getName('spells', 1)).toBe('Feuerball');

        ctx.D.spells[0] = { ...ctx.D.spells[0], name: 'Feuerball NEU' };

        expect(lookup.getName('spells', 1)).toBe('Feuerball NEU');
    });

    test('R1-5: exists() verneint nach dem Loeschen', () => {
        ctx.D.wiki = [{ id: 1, title: 'Waterdeep' }];
        zustandNachDemLaden(lookup);
        expect(lookup.exists('wiki', 1)).toBe(true);

        ctx.D.wiki = ctx.D.wiki.filter(e => e.id !== 1);

        expect(lookup.exists('wiki', 1)).toBe(false);
    });

    test('R1-6: nach Austausch der ganzen Sammlung per Object.assign(D, …) (so ersetzen Strg+Z und Import) liefert get() das Objekt des neuen Bestands', () => {
        ctx.D.wiki = [{ id: 1, title: 'Waterdeep NEU' }];
        zustandNachDemLaden(lookup);
        expect(lookup.get('wiki', 1)?.title).toBe('Waterdeep NEU');

        // Rueckgaengig und Import setzen die Sammlungen per Object.assign neu. Kein
        // gemessener Nutzerweg: in der App folgt renderAll(), und dessen renderParty()
        // leert die Ablage. Der Fall haelt die Zusage der Schnittstelle (R1: gleich,
        // welche Aktion vorausging).
        Object.assign(ctx.D, { wiki: [{ id: 1, title: 'Waterdeep' }] });

        const nachher = lookup.get('wiki', 1);
        expect(nachher?.title).toBe('Waterdeep');
        expect(nachher).toBe(ctx.D.wiki[0]);
    });

    test.each(DATENVERLUST_PFADE)(
        'R1-7: $methode() liefert nach dem Speichern das neue Objekt (Ladepfad $leser)',
        fall => {
            ctx.D[fall.sammlung] = saatFuer(fall);
            zustandNachDemLaden(lookup);
            // Erstes Bearbeiten.
            expect(lookup[fall.methode]('1')).toBe(ctx.D[fall.sammlung][0]);

            // Speichern ersetzt das Objekt an derselben Stelle.
            const neu = `${fall.alt} NEU`;
            ctx.D[fall.sammlung][0] = { ...ctx.D[fall.sammlung][0], [fall.feld]: neu };

            // Zweites Bearbeiten: das Formular muss den neuen Stand laden. Bewusst kein
            // save() dazwischen (siehe Kopf: showLootDetail() liest vor dem Speichern).
            const nachher = lookup[fall.methode]('1');
            expect(nachher?.[fall.feld]).toBe(neu);
            expect(nachher).toBe(ctx.D[fall.sammlung][0]);
        }
    );

    test.each(DATENVERLUST_PFADE)('R1-8: $methode() liefert nach dem Loeschen null', fall => {
        ctx.D[fall.sammlung] = saatFuer(fall);
        zustandNachDemLaden(lookup);
        expect(lookup[fall.methode]('1')).toBe(ctx.D[fall.sammlung][0]);

        ctx.D[fall.sammlung] = ctx.D[fall.sammlung].filter(e => e.id !== 1);

        expect(lookup[fall.methode]('1')).toBeNull();
    });

    test.each(UEBRIGE_LESER)(
        'R1-9: $methode() liefert nach dem Ersetzen das neue Objekt und nach dem Loeschen null (Speicherpfad $speicherpfad)',
        fall => {
            ctx.D[fall.sammlung] = saatFuer(fall);
            zustandNachDemLaden(lookup);
            expect(lookup[fall.methode]('1')).toBe(ctx.D[fall.sammlung][0]);

            const neu = `${fall.alt} NEU`;
            ctx.D[fall.sammlung][0] = { ...ctx.D[fall.sammlung][0], [fall.feld]: neu };
            const nachher = lookup[fall.methode]('1');
            expect(nachher?.[fall.feld]).toBe(neu);
            expect(nachher).toBe(ctx.D[fall.sammlung][0]);

            ctx.D[fall.sammlung] = ctx.D[fall.sammlung].filter(e => e.id !== 1);
            expect(lookup[fall.methode]('1')).toBeNull();
        }
    );
});

describe('R1 — Kontrollen und Waechter (heute und nach dem Fix gruen)', () => {
    let ctx;
    let lookup;
    beforeEach(() => {
        ctx = ladeKontext();
        lookup = ctx.EntityLookup;
    });

    test('K1 (Kontrolle): ohne eingeschalteten Schalter ist get() schon heute frisch', () => {
        ctx.D.wiki = [{ id: 1, title: 'Waterdeep' }];
        ctx.D.links = [];
        ctx.D.spells = [{ id: 1, name: 'Feuerball' }];
        expect(lookup.get('wiki', 1)).toBe(ctx.D.wiki[0]);
        expect(lookup.get('links', 7)).toBeNull();
        expect(lookup.get('spells', 1)).toBe(ctx.D.spells[0]);

        ctx.D.wiki[0] = { ...ctx.D.wiki[0], title: 'Waterdeep NEU' };
        ctx.D.links.push({ id: 7, title: 'Weltkarte' });
        ctx.D.spells = [];

        expect(lookup.get('wiki', 1)).toBe(ctx.D.wiki[0]);
        expect(lookup.get('links', 7)).toBe(ctx.D.links[0]);
        expect(lookup.get('spells', 1)).toBeNull();
    });

    test('K2 (Kontrolle): eine Aenderung AM Objekt ist auch im Zustand nach dem Laden sichtbar', () => {
        ctx.D.quests = [{ id: 1, title: 'Die verlorene Mine', completed: false }];
        zustandNachDemLaden(lookup);
        expect(lookup.quest(1)).toBe(ctx.D.quests[0]);

        // Dieselbe Referenz wird veraendert, wie in toggleQuestStatus().
        ctx.D.quests[0].completed = true;

        expect(lookup.quest(1).completed).toBe(true);
        expect(lookup.quest(1)).toBe(ctx.D.quests[0]);
    });

    test('K3 (Kontrolle): findByName() liest nie aus der Ablage', () => {
        ctx.D.spells = [{ id: 1, name: 'Feuerball' }];
        zustandNachDemLaden(lookup);
        expect(lookup.findByName('spells', 'feuerball')).toBe(ctx.D.spells[0]);
        expect(lookup.spell(1)).toBe(ctx.D.spells[0]);

        ctx.D.spells[0] = { ...ctx.D.spells[0], name: 'Feuerball NEU' };

        expect(lookup.findByName('spells', 'Feuerball NEU')).toBe(ctx.D.spells[0]);
        expect(lookup.findByName('spells', 'Feuerball')).toBeNull();
    });

    test('K4 (Kontrolle): ungueltige IDs und fehlende Sammlungen liefern null, ohne zu werfen', () => {
        ctx.D.wiki = [{ id: 1, title: 'Waterdeep' }];
        zustandNachDemLaden(lookup);
        expect(lookup.get('wiki', 'abc')).toBeNull();
        expect(lookup.get('wiki', null)).toBeNull();
        expect(lookup.get('wiki', undefined)).toBeNull();
        expect(lookup.get('gibt-es-nicht', 1)).toBeNull();
        expect(lookup.getName('wiki', 99)).toBe('—');
        expect(lookup.exists('wiki', 99)).toBe(false);
    });

    test.each(DATENVERLUST_PFADE)('W1 (Waechter): $methode() liest D.$sammlung', fall => {
        expect(typeof lookup[fall.methode]).toBe('function');
        const eintrag = { id: 3, [fall.feld]: fall.alt };
        ctx.D[fall.sammlung] = [eintrag];
        expect(lookup[fall.methode](3)).toBe(eintrag);
    });

    test('W2 (Waechter): der Quellbaum bedient EntityLookup nur ueber gedeckte Leser und den bekannten Schalter', () => {
        const module = extractModulesFromLoader(
            fs.readFileSync(path.join(REPO_ROOT, 'loader.js'), 'utf8')
        );
        expect(module).toContain('render/helpers.js');
        const gesehen = new Set();
        const fremd = [];
        for (const rel of module) {
            const quelle = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
            // Glied ohne fuehrendes `$`: der Debug-Selbsttest baut den Namen in einer
            // Vorlage zusammen (`EntityLookup.${method}()`), das ist kein Aufruf.
            for (const [, glied] of quelle.matchAll(
                /\bEntityLookup\s*\??\.\s*([A-Za-z_][\w$]*)/g
            )) {
                gesehen.add(glied);
                if (!GEDECKTE_LESER.includes(glied) && !SCHALTER.includes(glied)) {
                    fremd.push(`${rel}: EntityLookup.${glied}`);
                }
            }
        }
        // Nicht leer: der Scan findet wenigstens die Leser, die render/helpers.js selbst ruft.
        expect(gesehen.size).toBeGreaterThan(0);
        expect(fremd).toEqual([]);
    });
});
