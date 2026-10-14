/**
 * Die Gruppen der Ansichten — ui/keyboard-group-views.js (TASV, E-2 / Einheit 2)
 *
 * WARUM DIESE TESTS. Die Datei bringt keine Mechanik mit; sie ist eine
 * Liste von Selektoren, Achsen und Beschriftungen, die
 * `KeyboardGroup.registriere()` entgegennimmt. Genau darum kann sie auf
 * zwei Weisen lautlos kaputtgehen:
 *
 *   1. EIN SELEKTOR GREIFT NICHT MEHR. Wird `div#npc-list` umbenannt,
 *      findet `querySelectorAll` nichts, die Gruppe entsteht nicht — und
 *      die Ansicht hat statt einem Halt wieder zwanzig. Das ist keine
 *      Fehlermeldung, nur eine langsamere Tastatur. Der Fall unten prueft
 *      darum JEDEN Behaelterselektor gegen die Vorlagen bzw. die
 *      Renderfunktionen im Quellbaum.
 *   2. EINE ART WIRD ABGEWIESEN. `registriere()` gibt `false` zurueck bei
 *      fehlendem Namen, fehlendem Selektor, unbekannter Achse oder
 *      doppeltem Namen — ohne zu werfen. Eine abgewiesene Art sieht von
 *      aussen aus wie "diese Ansicht hat eben keine Gruppe".
 *
 * Die WIRKUNG (ein Halt je Gruppe, Pfeiltasten darin, nichts
 * unerreichbar) steht nicht hier und kann hier nicht stehen: dafuer
 * braucht es echte Tastendruecke in einem echten Browser. Das ist
 * `tests/e2e/features/tastatur-erreichbarkeit.spec.js` und
 * `tests/e2e/features/tastatur-reichweite.spec.js`. Hier steht die Liste,
 * dort die Wirkung.
 */

const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..', '..');
const MODULE_PATH = 'ui/keyboard-group-views.js';
const SOURCE = fs.readFileSync(path.join(WURZEL, MODULE_PATH), 'utf8');

/**
 * Das Modul EINMAL laden, mit einer Attrappe fuer `KeyboardGroup`, die
 * jeden Aufruf von `registriere()` mitschreibt. Die Umschlag-Funktion
 * ersetzt den `<script>`-Rahmen des gebauten Buendels; die
 * Selbstaufruf-Zeile am Dateiende laeuft mit.
 */
let KeyboardGroupViews;
let ANSICHTSGRUPPEN;
let angemeldet;

beforeAll(() => {
    angemeldet = [];
    const namen = new Set();
    const fenster = global.window;
    fenster.KeyboardGroup = {
        registriere: art => {
            // Dieselben Abweisungsregeln wie im echten Modul — eine Art,
            // die dort durchfaellt, muss hier auch durchfallen.
            if (!art || !art.name || !art.behaelter || !art.glied) return false;
            if (art.achse !== 'horizontal' && art.achse !== 'vertical') return false;
            if (namen.has(art.name)) return false;
            namen.add(art.name);
            angemeldet.push(art);
            return true;
        }
    };
    const umschlag = new Function('window', 'document', 'log', SOURCE);
    umschlag(fenster, global.document, () => {});
    KeyboardGroupViews = fenster.KeyboardGroupViews;
    ANSICHTSGRUPPEN = fenster.ANSICHTSGRUPPEN;
    if (!KeyboardGroupViews)
        throw new Error(`${MODULE_PATH} hat window.KeyboardGroupViews nicht gesetzt`);
});

describe('Ansichtsgruppen — die Anmeldung', () => {
    test('jede Art wird angenommen, keine faellt durch', () => {
        // `registriere()` wirft nicht, es gibt `false` zurueck. Eine
        // abgewiesene Art sieht von aussen aus wie "diese Ansicht hat eben
        // keine Gruppe" — darum wird hier gezaehlt.
        expect(angemeldet.length).toBe(ANSICHTSGRUPPEN.length);
        expect(KeyboardGroupViews.statistik().angemeldet).toBe(ANSICHTSGRUPPEN.length);
    });

    test('ein zweiter Aufruf meldet nichts erneut an', () => {
        expect(KeyboardGroupViews.init()).toBe(0);
    });

    test('ohne KeyboardGroup bleibt die Datei still statt zu werfen', () => {
        const echt = global.window.KeyboardGroup;
        global.window.KeyboardGroup = undefined;
        try {
            expect(KeyboardGroupViews.init()).toBe(0);
        } finally {
            global.window.KeyboardGroup = echt;
        }
    });

    test('die Namen sind eindeutig', () => {
        const namen = ANSICHTSGRUPPEN.map(a => a.name);
        expect(new Set(namen).size).toBe(namen.length);
    });

    test('jede Art hat eine der zwei gemessenen Achsen', () => {
        for (const a of ANSICHTSGRUPPEN) {
            expect(['horizontal', 'vertical']).toContain(a.achse);
        }
    });

    test('jede Art hat eine Beschriftung — sie wird das aria-label der Leiste', () => {
        for (const a of ANSICHTSGRUPPEN) {
            expect(typeof a.beschriftung).toBe('function');
            const text = a.beschriftung([]);
            expect(typeof text).toBe('string');
            expect(text.length).toBeGreaterThan(0);
        }
    });
});

describe('Ansichtsgruppen — die Selektoren treffen den Quellbaum', () => {
    /**
     * Alles, was eine Kennung oder einen Klassennamen im Dokument erzeugen
     * kann: die Vorlagen UND die Renderfunktionen (einige Behaelter werden
     * erst zur Laufzeit gebaut, z. B. `div#fr-list` in
     * `features/fraktionen/fraktionen-render.js`).
     */
    const quellen = () => {
        const dateien = [];
        const sammeln = (verzeichnis, endungen) => {
            for (const eintrag of fs.readdirSync(path.join(WURZEL, verzeichnis), {
                withFileTypes: true
            })) {
                const p = `${verzeichnis}/${eintrag.name}`;
                if (eintrag.isDirectory()) sammeln(p, endungen);
                else if (endungen.some(e => eintrag.name.endsWith(e))) dateien.push(p);
            }
        };
        sammeln('assets/templates', ['.html']);
        sammeln('features', ['.js']);
        sammeln('systems', ['.js']);
        sammeln('ui', ['.js']);
        sammeln('render', ['.js']);
        return dateien.map(p => fs.readFileSync(path.join(WURZEL, p), 'utf8')).join('\n');
    };

    let text;
    beforeAll(() => {
        text = quellen();
    });

    test('jeder Behaelterselektor kommt im Quellbaum vor', () => {
        const fehlend = [];
        for (const a of ANSICHTSGRUPPEN) {
            // `div#npc-list` -> `npc-list`; `.spell-slots-compact` ->
            // `spell-slots-compact`; `[data-tastgruppe="x"]` -> `x`.
            const m = a.behaelter.match(/#([a-z0-9-]+)|^\.([a-z0-9-]+)|="([a-z0-9-]+)"/i);
            const marke = m && (m[1] || m[2] || m[3]);
            if (!marke || !text.includes(marke)) fehlend.push(`${a.name}: ${a.behaelter}`);
        }
        expect(fehlend).toEqual([]);
    });

    test('jeder Gliedselektor kommt im Quellbaum vor', () => {
        const fehlend = [];
        for (const a of ANSICHTSGRUPPEN) {
            const m = a.glied.match(/="([a-z0-9-]+)"|^\.([a-z0-9-]+)/i);
            const marke = m && (m[1] || m[2]);
            if (!marke || !text.includes(marke)) fehlend.push(`${a.name}: ${a.glied}`);
        }
        expect(fehlend).toEqual([]);
    });

    test('der namenlose Behaelter der Auftragsmarken traegt sein data-Attribut', () => {
        // Er stand bis b8a1a5c als `<div style="display:flex; …">` ohne
        // Klasse und ohne id in `features/quests/quests-render.js` und war
        // damit fuer keinen Selektor erreichbar. Faellt das Attribut weg,
        // entstehen aus 20 Halten wieder 40.
        const quelle = fs.readFileSync(
            path.join(WURZEL, 'features/quests/quests-render.js'),
            'utf8'
        );
        expect(quelle).toContain('data-tastgruppe="auftrag-status"');
        const art = ANSICHTSGRUPPEN.find(a => a.name === 'auftragsmarken');
        expect(art.behaelter).toBe('[data-tastgruppe="auftrag-status"]');
    });
});

describe('Ansichtsgruppen — Quelltext-Zusicherungen', () => {
    test('die Datei bringt KEINE Tastaturlogik mit', () => {
        // Sie ist eine Anmeldung. Ein `keydown`, ein `focus()` oder ein
        // `setAttribute('tabindex')` hier waere eine zweite Mechanik neben
        // `ui/keyboard-group.js` — und damit zwei Stellen, an denen der
        // wandernde Tabindex entschieden wird.
        const code = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
        expect(code).not.toMatch(/addEventListener\(\s*'keydown'/);
        expect(code).not.toMatch(/\.focus\(/);
        expect(code).not.toMatch(/setAttribute\(\s*'tabindex'/);
        expect(code).not.toMatch(/preventDefault/);
    });

    test('das Modul steht in loader.js NACH ui/keyboard-group.js', () => {
        // Davor geladen findet der Selbstaufruf `KeyboardGroup` nicht und
        // bleibt still — die Nachruestung liefe dann ohne Gruppen, mit der
        // gemessenen Tabulatorflut.
        const loader = fs.readFileSync(path.join(WURZEL, 'loader.js'), 'utf8');
        const mechanik = loader.indexOf("'ui/keyboard-group.js'");
        const anmeldung = loader.indexOf("'ui/keyboard-group-views.js'");
        expect(mechanik).toBeGreaterThan(-1);
        expect(anmeldung).toBeGreaterThan(mechanik);
    });

    test('die drei Einzelstellen sind ausdruecklich KEINE Gruppe', () => {
        // `switch-campaign` (Daten), `toggle-collapse` (Notizen,
        // Begegnungen) und `toggle-wiki-category` (Wiki) sind je Ansicht
        // genau eine sichtbare Stelle. `role="toolbar"` darauf behauptete
        // eine Leiste, die ein Vorleseprogramm vergeblich mit Pfeiltasten
        // absucht.
        const glieder = ANSICHTSGRUPPEN.map(a => a.glied).join(' ');
        expect(glieder).not.toContain('switch-campaign');
        expect(glieder).not.toContain('toggle-collapse');
        expect(glieder).not.toContain('toggle-wiki-category');
    });
});
