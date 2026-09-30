/**
 * Unit — Kampfprotokoll-Ringpuffer (U5)
 *
 * Prueft den Vertrag von `features/combat-log/combat-log-core.js` ohne DOM:
 * Deckel, Reihenfolge, Kategorien, Persistenz-Rundreise — und die eine
 * Strukturzusicherung, die dieses Modul erst vertretbar macht: der Puffer ist
 * eine MODULVARIABLE und liegt NICHT in `window.D`. `pushUndo()` serialisiert
 * bei jeder destruktiven Aktion das ganze `D` (systems/undo.js); ein
 * wachsendes Protokoll dort verteuerte jeden Undo-Schritt. Vorbild fuer die
 * Modulvariable: `diceHistory` im Wuerfel-Kernmodul (features/dice/).
 *
 * DER PFAD DIESES VORBILDS STEHT HIER ABSICHTLICH NICHT VOLLSTAENDIG. Das
 * Abdeckungs-Gate (tests/unit/module-test-coverage.test.js) sucht
 * loader.js-relative Modulpfade WOERTLICH in allen Dateien unter tests/ — eine
 * blosse Erwaehnung im Erklaertext haette das Wuerfel-Kernmodul aus seiner
 * datierten Ausnahme geholt und damit still aus dem Gate genommen, ohne dass
 * ein einziger Test es anfasst. Genau diese Unterscheidung (Kommentar ist
 * keine Abdeckung) hielt der Eintrag vom 2026-09-28 in derselben Datei fest.
 *
 * Ladeidiom wie tests/unit/initiative-mob.test.js: vm.runInContext gegen einen
 * selbstgebauten Kontext, keine ESM-Einbindung (die App ist Non-ESM).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..', '..');
// Die loader.js-relativen Pfade stehen in AUSFUEHRBAREM Code, nicht nur im
// Erklaertext: das Abdeckungs-Gate (tests/unit/module-test-coverage.test.js)
// sucht sie woertlich, und ein Kommentar ist dort laut eigenem Eintrag
// ausdruecklich KEINE Abdeckung.
const KERN_REL = 'features/combat-log/combat-log-core.js';
const FENSTER_REL = 'features/combat-log/combat-log-render.js';
const MODUL = path.join(REPO, ...KERN_REL.split('/'));
const FENSTER = path.join(REPO, ...FENSTER_REL.split('/'));

/**
 * Baut einen frischen Kontext mit einem localStorage-Doppel und laedt das Modul.
 * @param {Record<string, string>} [vorbelegung] - Startinhalt des Speicherdoppels
 */
function ladeModul(vorbelegung = {}) {
    const speicher = { ...vorbelegung };
    const localStorage = {
        getItem: k => (Object.prototype.hasOwnProperty.call(speicher, k) ? speicher[k] : null),
        setItem: (k, v) => {
            speicher[k] = String(v);
        },
        removeItem: k => {
            delete speicher[k];
        }
    };
    const context = {
        console,
        Math,
        Date,
        JSON,
        setTimeout,
        clearTimeout,
        localStorage
    };
    context.window = context;
    context.globalThis = context;
    vm.createContext(context);
    const code = fs.readFileSync(MODUL, 'utf8');
    vm.runInContext(code, context);
    return { ctx: context, speicher };
}

/**
 * Laedt das Fenster-Modul gegen ein DOM-Doppel und gibt Kontext plus die
 * geschriebene Liste zurueck. Absichtlich KEIN jsdom: das Modul braucht genau
 * vier Dinge ($, document.querySelectorAll, esc, getCombatLog), und ein Doppel
 * macht sichtbar, welche das sind.
 * @param {Array<object>} eintraege - was getCombatLog() liefern soll
 */
function ladeFenster(eintraege) {
    const knoten = {
        liste: { innerHTML: '' },
        anzahl: { textContent: '' },
        panel: { classList: { contains: () => true, toggle: () => true } }
    };
    const context = {
        console,
        Math,
        Date,
        JSON,
        setTimeout,
        clearTimeout,
        $: id =>
            ({
                'kampflog-liste': knoten.liste,
                'kampflog-anzahl': knoten.anzahl,
                'kampflog-panel': knoten.panel
            })[id] || null,
        document: { querySelectorAll: () => [] },
        // Derselbe Ersatz wie in utils/basic.js esc(): die fuenf HTML-kritischen Zeichen.
        esc: s =>
            String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;'),
        confirm: () => true
    };
    context.window = context;
    context.globalThis = context;
    context.getCombatLog = () => eintraege;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(FENSTER, 'utf8'), context);
    return { ctx: context, knoten };
}

describe('Kampfprotokoll: Modul ist vorhanden und exportiert seinen Vertrag', () => {
    test('features/combat-log/combat-log-core.js existiert', () => {
        expect(fs.existsSync(MODUL)).toBe(true);
    });

    test('features/combat-log/combat-log-render.js existiert', () => {
        expect(fs.existsSync(FENSTER)).toBe(true);
    });

    test('exportiert pushCombatLog, getCombatLog, clearCombatLog und den Deckel', () => {
        const { ctx } = ladeModul();
        expect(typeof ctx.window.pushCombatLog).toBe('function');
        expect(typeof ctx.window.getCombatLog).toBe('function');
        expect(typeof ctx.window.clearCombatLog).toBe('function');
        expect(typeof ctx.window.KPLOG_DECKEL).toBe('number');
    });
});

describe('Kampfprotokoll: Ringpuffer', () => {
    test('neueste Meldung steht vorn', () => {
        const { ctx } = ladeModul();
        ctx.window.pushCombatLog('erste', 'info');
        ctx.window.pushCombatLog('zweite', 'info');
        const log = ctx.window.getCombatLog();
        expect(log.length).toBe(2);
        expect(log[0].text).toBe('zweite');
        expect(log[1].text).toBe('erste');
    });

    test('der Deckel verdraengt das Aelteste', () => {
        const { ctx } = ladeModul();
        const deckel = ctx.window.KPLOG_DECKEL;
        for (let i = 1; i <= deckel + 7; i++) ctx.window.pushCombatLog('Nr ' + i, 'info');
        const log = ctx.window.getCombatLog();
        expect(log.length).toBe(deckel);
        expect(log[0].text).toBe('Nr ' + (deckel + 7));
        expect(log.some(e => e.text === 'Nr 1')).toBe(false);
    });

    test('jeder Eintrag traegt Zeitstempel, Typ und laufende Nummer', () => {
        const { ctx } = ladeModul();
        const e = ctx.window.pushCombatLog('Goblin: 7 Schaden', 'info', 'kampf');
        expect(typeof e.zeit).toBe('number');
        expect(e.typ).toBe('info');
        expect(e.kategorie).toBe('kampf');
        expect(typeof e.nr).toBe('number');
    });

    test('getCombatLog() gibt eine Kopie — der Aufrufer kann den Puffer nicht umschreiben', () => {
        const { ctx } = ladeModul();
        ctx.window.pushCombatLog('unversehrt', 'info');
        const log = ctx.window.getCombatLog();
        log.length = 0;
        log.push({ text: 'untergeschoben' });
        expect(ctx.window.getCombatLog().length).toBe(1);
        expect(ctx.window.getCombatLog()[0].text).toBe('unversehrt');
    });

    test('clearCombatLog() leert Puffer UND Speicher', () => {
        const { ctx, speicher } = ladeModul();
        ctx.window.pushCombatLog('weg damit', 'info');
        ctx.window.schreibeKampfprotokoll();
        expect(Object.keys(speicher).length).toBeGreaterThan(0);
        ctx.window.clearCombatLog();
        expect(ctx.window.getCombatLog().length).toBe(0);
        const rest = Object.values(speicher).join('');
        expect(rest).not.toContain('weg damit');
    });
});

describe('Kampfprotokoll: Kategorien', () => {
    test('ohne Angabe gilt die Standardkategorie, nicht "kampf"', () => {
        const { ctx } = ladeModul();
        const e = ctx.window.pushCombatLog('Truhe gespeichert', 'success');
        expect(e.kategorie).toBe('system');
        expect(ctx.window.getCombatLog('kampf').length).toBe(0);
    });

    test('getCombatLog("kampf") filtert, getCombatLog() filtert nicht', () => {
        const { ctx } = ladeModul();
        ctx.window.pushCombatLog('Truhe gespeichert', 'success');
        ctx.window.pushCombatLog('Goblin: 7 Schaden', 'info', 'kampf');
        ctx.window.pushCombatLog('Ork: 12 Schaden', 'info', 'kampf');
        expect(ctx.window.getCombatLog().length).toBe(3);
        expect(ctx.window.getCombatLog('kampf').length).toBe(2);
        expect(ctx.window.getCombatLog('alles').length).toBe(3);
    });

    test('eine unbekannte Kategorie faellt auf den Standard zurueck', () => {
        const { ctx } = ladeModul();
        const e = ctx.window.pushCombatLog('Text', 'info', 'erfunden');
        expect(e.kategorie).toBe('system');
    });
});

describe('Kampfprotokoll: Persistenz', () => {
    test('Rundreise: geschriebener Stand wird beim Laden wiedergefunden', () => {
        const erste = ladeModul();
        erste.ctx.window.pushCombatLog('Vor dem Neustart: 14 Schaden', 'info', 'kampf');
        erste.ctx.window.schreibeKampfprotokoll();

        const zweite = ladeModul(erste.speicher);
        const log = zweite.ctx.window.getCombatLog();
        expect(log.length).toBe(1);
        expect(log[0].text).toBe('Vor dem Neustart: 14 Schaden');
        expect(log[0].kategorie).toBe('kampf');
    });

    test('ein kaputter Speicherinhalt fuehrt zu einem leeren Protokoll, nicht zu einem Absturz', () => {
        const schluessel = ladeModul().ctx.window.kpLogSpeicherSchluessel();
        const { ctx } = ladeModul({ [schluessel]: '{kein json' });
        expect(ctx.window.getCombatLog()).toEqual([]);
    });

    test('der Speicherstand wird beim Laden auf den Deckel gekuerzt', () => {
        const schluessel = ladeModul().ctx.window.kpLogSpeicherSchluessel();
        const deckel = ladeModul().ctx.window.KPLOG_DECKEL;
        const zuViel = [];
        for (let i = 0; i < deckel + 40; i++) {
            zuViel.push({ nr: i, text: 'alt ' + i, typ: 'info', kategorie: 'system', zeit: i });
        }
        const { ctx } = ladeModul({ [schluessel]: JSON.stringify(zuViel) });
        expect(ctx.window.getCombatLog().length).toBe(deckel);
    });
});

describe('Kampfprotokoll: das Fenster', () => {
    test('eine leere Liste ergibt einen Hinweis, keine leere Flaeche', () => {
        const { ctx, knoten } = ladeFenster([]);
        ctx.window.renderCombatLog();
        expect(knoten.liste.innerHTML).toContain('kplog-leer');
        expect(knoten.anzahl.textContent).toBe('0');
    });

    test('jeder Eintrag wird als kplog-entry mit Typklasse und Kategorie gezeichnet', () => {
        const { ctx, knoten } = ladeFenster([
            { nr: 2, text: 'Ork: 12 Schaden', typ: 'error', kategorie: 'kampf', zeit: 1 },
            { nr: 1, text: 'Truhe gespeichert', typ: 'success', kategorie: 'system', zeit: 1 }
        ]);
        ctx.window.renderCombatLog();
        const html = knoten.liste.innerHTML;
        expect((html.match(/class="kplog-entry /g) || []).length).toBe(2);
        expect(html).toContain('kplog-entry error');
        expect(html).toContain('data-kategorie="kampf"');
        expect(html).toContain('kplog-marke');
        expect(knoten.anzahl.textContent).toBe('2');
    });

    test('Meldungstexte werden escaped — sie enthalten Namen aus Nutzereingaben', () => {
        const { ctx, knoten } = ladeFenster([
            {
                nr: 1,
                text: '<img src=x onerror=alert(1)>: 7 Schaden',
                typ: 'info',
                kategorie: 'kampf',
                zeit: 1
            }
        ]);
        ctx.window.renderCombatLog();
        expect(knoten.liste.innerHTML).not.toContain('<img');
        expect(knoten.liste.innerHTML).toContain('&lt;img');
    });

    test('der Filter waehlt zwischen alles und kampf und faellt auf alles zurueck', () => {
        const { ctx } = ladeFenster([]);
        const gesehen = [];
        ctx.getCombatLog = k => {
            gesehen.push(k);
            return [];
        };
        ctx.window.setCombatLogFilter('kampf');
        ctx.window.setCombatLogFilter('unsinn');
        expect(gesehen).toEqual(['kampf', 'alles']);
    });
});

describe('Doppelblase: #toast wird nicht mehr erzeugt', () => {
    const UTILS = path.join(REPO, 'utils', 'utilities.js');

    test('utils/utilities.js legt keinen #toast-Knoten mehr an', () => {
        const quelle = fs.readFileSync(UTILS, 'utf8');
        const treffer = quelle.match(/\.id\s*=\s*['"]toast['"]/g) || [];
        expect(treffer).toEqual([]);
    });

    test('utils/utilities.js traegt keine Inline-Stilzeichenkette fuer den Alt-Toast mehr', () => {
        const quelle = fs.readFileSync(UTILS, 'utf8');
        expect(quelle).not.toContain('position:fixed;top:20px;left:50%');
    });

    test('showToast() nimmt eine Kategorie als dritten Parameter an', () => {
        const quelle = fs.readFileSync(UTILS, 'utf8');
        // Der dritte Parameter heisst nicht mehr nur `duration`: er nimmt entweder eine
        // Zahl (Altweg) oder ein Objekt mit `kategorie` an.
        expect(quelle).toMatch(/kategorie/);
    });
});

describe('Kampfprotokoll: liegt NICHT in D', () => {
    test('der Puffer ist keine Eigenschaft von window.D', () => {
        const { ctx } = ladeModul();
        ctx.window.D = {};
        ctx.window.pushCombatLog('Goblin: 7 Schaden', 'info', 'kampf');
        expect(Object.keys(ctx.window.D)).toEqual([]);
        expect(JSON.stringify(ctx.window.D)).toBe('{}');
    });

    test('der Quelltext schreibt an keiner Stelle in D', () => {
        const quelle = fs.readFileSync(MODUL, 'utf8');
        // Zuweisungen der Form `D.xyz =` / `window.D.xyz =` waeren genau der Fehler,
        // den dieser Test verhindert.
        const treffer = quelle.match(/(?:window\s*\.\s*)?\bD\s*\.\s*\w+\s*=[^=]/g) || [];
        expect(treffer).toEqual([]);
    });
});
