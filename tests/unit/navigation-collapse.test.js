/**
 * `toggleCollapse()` und der Vertrag mit dem Markup — ABN
 *
 * ANLASS, und er ist ein gemessener Fehler und keine Vorsichtsmassnahme. Die
 * Vorbedingungs-Sonde von `tests/e2e/features/tastenhilfe.spec.js` (18) suchte
 * `.collapsible.open` — eine Klasse, die der Baum NULL MAL fuehrt. Zwei der
 * fuenf zugesagten Ansichten wurden damit nicht gemessen, und der Fall blieb
 * gruen, weil seine Zusicherung eine Untergrenze war. Die Vorrunde hatte
 * dieselbe Falle schon einmal gesehen und als Lehre notiert ("`toggleCollapse()`
 * schaltet `open` an einem ANDEREN Element als dem, das `data-action` traegt") —
 * die Lehre stand in der Akte, und die Sonde war trotzdem falsch.
 *
 * WARUM EINE LEHRE IN PROSA DAFUER NICHT GENUEGT: niemand liest sie beim
 * Schreiben eines Selektors. Diese Datei macht den Vertrag messbar, und zwar in
 * beide Richtungen:
 *
 *   (1) LAUFZEIT — `toggleCollapse(id)` schaltet `open` an `$(id)` und NICHT am
 *       Kopf, der das `data-action` traegt. Gefahren wird das echte Modul in
 *       einer `vm`-Sandbox gegen echtes jsdom-Markup, nicht eine Nachbildung.
 *   (2) MARKUP — jedes `data-action="toggle-collapse"` in den Vorlagen zeigt auf
 *       eine vorhandene ID, und das Ziel traegt `collapsible-content`. Dazu die
 *       Umkehrung, die die Sonde haette rot gemacht: die blosse Klasse
 *       `collapsible` kommt in den Vorlagen NICHT vor, ein Selektor
 *       `.collapsible…` kann also nie treffen.
 *
 * `systems/spellslots/navigation.js` stand bis hierher auf der Ausnahmeliste
 * des Abdeckungs-Gates (`tests/unit/module-test-coverage.test.js`). Mit dieser
 * Datei faellt der Eintrag — nicht weil der Pfad irgendwo erwaehnt wird,
 * sondern weil das Modul gefahren wird.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MODULE_REL = path.join('systems', 'spellslots', 'navigation.js');
const MODULE_PATH = path.join(REPO_ROOT, MODULE_REL);
const TEMPLATES_DIR = path.join(REPO_ROOT, 'assets', 'templates');

const SOURCE = fs.readFileSync(MODULE_PATH, 'utf8');

/**
 * Laedt das Modul in eine Sandbox, deren `document` das jsdom dieses Tests
 * ist. Die Abhaengigkeiten, die `toggleCollapse()` wirklich braucht, sind
 * genau zwei: `$` und `document`. `window.renderStoryArcSelects` wird nur
 * fuer `session-form` gerufen und bleibt darum ein Doppel.
 */
function ladeModul() {
    const renderStoryArcSelects = jest.fn();
    const context = {
        document,
        $: id => document.getElementById(id),
        window: { renderStoryArcSelects },
        console
    };
    vm.createContext(context);
    vm.runInContext(SOURCE, context);
    return { context, renderStoryArcSelects };
}

/** Das Markup eines Aufklappfeldes, wie die Vorlagen es fuehren. */
function baueAufklappfeld(id) {
    document.body.innerHTML = `
        <div class="card">
            <div class="collapsible-header" data-action="toggle-collapse" data-value="${id}">
                <span>Titel</span><span id="${id}-icon">▼</span>
            </div>
            <div id="${id}" class="collapsible-content"></div>
        </div>`;
    return {
        kopf: document.querySelector('.collapsible-header'),
        inhalt: document.getElementById(id),
        ikon: document.getElementById(`${id}-icon`)
    };
}

describe('toggleCollapse() — Laufzeit', () => {
    test('schaltet `open` am INHALT und nicht am Kopf mit dem data-action', () => {
        const { kopf, inhalt } = baueAufklappfeld('char-form');
        const { context } = ladeModul();

        // Vorbedingung: nichts ist offen, und der Kopf traegt das data-action.
        expect(inhalt.classList.contains('open')).toBe(false);
        expect(kopf.getAttribute('data-action')).toBe('toggle-collapse');

        context.toggleCollapse('char-form');

        // DER EIGENTLICHE SATZ DIESER DATEI: das `open` landet am Inhalt.
        expect(inhalt.classList.contains('open')).toBe(true);
        expect(kopf.classList.contains('open')).toBe(false);

        // Und damit: der Selektor, den die kaputte Sonde benutzte, trifft nicht.
        expect(document.querySelectorAll('.collapsible.open').length).toBe(0);
        expect(document.querySelectorAll('.collapsible-content.open').length).toBe(1);
    });

    test('ist ein Umschalter und fuehrt das Ikon mit', () => {
        const { inhalt, ikon } = baueAufklappfeld('enc-form');
        const { context } = ladeModul();

        expect(ikon.textContent).toBe('▼');
        context.toggleCollapse('enc-form');
        expect(inhalt.classList.contains('open')).toBe(true);
        expect(ikon.textContent).toBe('▲');
        context.toggleCollapse('enc-form');
        expect(inhalt.classList.contains('open')).toBe(false);
        expect(ikon.textContent).toBe('▼');
    });

    test('eine unbekannte ID wirft nicht und veraendert nichts', () => {
        const { inhalt } = baueAufklappfeld('char-form');
        const { context } = ladeModul();

        expect(() => context.toggleCollapse('gibt-es-nicht')).not.toThrow();
        expect(inhalt.classList.contains('open')).toBe(false);
    });

    test('nur `session-form` zieht die Story-Arc-Auswahl nach', () => {
        baueAufklappfeld('char-form');
        const a = ladeModul();
        a.context.toggleCollapse('char-form');
        expect(a.renderStoryArcSelects).not.toHaveBeenCalled();

        baueAufklappfeld('session-form');
        const b = ladeModul();
        b.context.toggleCollapse('session-form');
        expect(b.renderStoryArcSelects).toHaveBeenCalledTimes(1);
        // Beim Zuklappen NICHT noch einmal.
        b.context.toggleCollapse('session-form');
        expect(b.renderStoryArcSelects).toHaveBeenCalledTimes(1);
    });
});

describe('toggleCollapse() — Vertrag mit den Vorlagen', () => {
    const vorlagen = fs
        .readdirSync(TEMPLATES_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => ({ name: f, inhalt: fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8') }));
    const alles = vorlagen.map(v => v.inhalt).join('\n');

    test('jedes data-action="toggle-collapse" zeigt auf eine ID mit .collapsible-content', () => {
        const ziele = [
            ...alles.matchAll(/data-action="toggle-collapse"\s+data-value="([^"]+)"/g)
        ].map(m => m[1]);
        // BASE-01/empty: ohne Fundstelle misst der Fall nichts.
        expect(ziele.length).toBeGreaterThanOrEqual(3);

        const falsch = [];
        for (const id of ziele) {
            const treffer = alles.match(new RegExp(`<div id="${id}"\\s+class="([^"]*)"`));
            if (!treffer) {
                falsch.push(`${id}: kein <div id="${id}" class="…"> in den Vorlagen`);
            } else if (!treffer[1].split(/\s+/).includes('collapsible-content')) {
                falsch.push(`${id}: traegt "${treffer[1]}" statt collapsible-content`);
            }
        }
        expect(falsch).toEqual([]);
    });

    test('die blosse Klasse `collapsible` kommt in keiner Vorlage vor', () => {
        // DIE UMKEHRUNG, und sie ist der Grund fuer diese Datei: ein Selektor
        // `.collapsible.open` kann nie treffen. Wer die Klasse einfuehrt, muss
        // diesen Fall anfassen und stolpert dabei ueber die Doppeldeutigkeit.
        const treffer = [];
        for (const v of vorlagen) {
            for (const m of v.inhalt.matchAll(/class="([^"]*)"/g)) {
                if (m[1].split(/\s+/).includes('collapsible')) {
                    treffer.push(`${v.name}: class="${m[1]}"`);
                }
            }
        }
        expect(treffer).toEqual([]);
    });
});
