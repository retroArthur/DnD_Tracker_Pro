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
 *   (3) BEARBEITEN-REST (ABBRUCH) — beim AUFklappen eines Klappformulars mit
 *       gesetzter Bearbeiten-ID wird zuerst dessen Leeren-Funktion gerufen,
 *       und das Formular steht danach OFFEN (die Leeren-Funktionen klappen
 *       selbst zu); Zuklappen und ein Entwurf ohne ID leeren nie.
 *       `showNewCollapsibleForm()` (Taste n, Befehlspalette) tut bei offenem
 *       Formular nichts. Und jede aufgeschobene Referenz der Tabelle
 *       `KLAPPFORMULAR_BEARBEITEN` nennt eine Funktion, die ein geladenes
 *       Modul deklariert — eine Umbenennung waere sonst ein stilles No-op.
 *   (4) DATUM DER NOTIZ (ABBRUCH, R6) — `switchView('notes')` schlaegt heute
 *       nur fuer ein leeres Datum ohne Bearbeiten vor; das Datum einer
 *       bearbeiteten Notiz und ein getipptes Entwurfsdatum bleiben.
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
 * fuer `session-form` gerufen und bleibt darum ein Doppel. `globale` legt
 * weitere Bezeichner in die Sandbox — die Leeren-Funktionen der Klappformulare
 * (`cancelCharEdit`, `cancelEncEdit`, `cancelSessionEdit`), die im Lader aus
 * Feature-Modulen kommen.
 */
function ladeModul(globale = {}) {
    const renderStoryArcSelects = jest.fn();
    const context = {
        document,
        $: id => document.getElementById(id),
        window: { renderStoryArcSelects },
        console,
        ...globale
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

/**
 * Ein Klappformular mit Bearbeiten-ID-Feld und einem Namensfeld darin, wie
 * die Vorlagen es fuehren (`view-party.html`, `view-encounters.html`).
 */
function baueKlappformular(id, idFeld, idWert, offen = false) {
    const teile = baueAufklappfeld(id);
    teile.inhalt.innerHTML = `
        <input type="hidden" id="${idFeld}" value="${idWert}">
        <input type="text" id="formular-name" value="Aria">`;
    if (offen) {
        teile.inhalt.classList.add('open');
        teile.ikon.textContent = '▲';
    }
    return teile;
}

/** Ein Doppel der Leeren-Funktion, das tut, was cancelCharEdit(),
 *  cancelEncEdit() und cancelSessionEdit() tun: leeren UND zuklappen. */
function leerenDoppel(id, idFeld) {
    return jest.fn(() => {
        document.getElementById(idFeld).value = '';
        document.getElementById('formular-name').value = '';
        document.getElementById(id).classList.remove('open');
        document.getElementById(`${id}-icon`).textContent = '▼';
    });
}

const KLAPPFORMULARE = [
    ['char-form', 'edit-char-id', 'cancelCharEdit'],
    ['enc-form', 'edit-enc-id', 'cancelEncEdit'],
    ['session-form', 'edit-session-id', 'cancelSessionEdit']
];

describe('toggleCollapse() — Bearbeiten-Rest beim Aufklappen (ABBRUCH)', () => {
    test.each(KLAPPFORMULARE)(
        '%s: Aufklappen mit gesetzter %s leert ueber %s und steht danach OFFEN',
        (id, idFeld, leerenName) => {
            const { inhalt, ikon } = baueKlappformular(id, idFeld, '1');
            const leeren = leerenDoppel(id, idFeld);
            const { context } = ladeModul({ [leerenName]: leeren });

            context.toggleCollapse(id);

            expect(leeren).toHaveBeenCalledTimes(1);
            // Die Leeren-Funktion klappt selbst zu — am Ende muss es trotzdem
            // offen sein, sonst braeuchte der Nutzer einen zweiten Klick.
            expect(inhalt.classList.contains('open')).toBe(true);
            expect(ikon.textContent).toBe('▲');
            expect(document.getElementById(idFeld).value).toBe('');
            expect(document.getElementById('formular-name').value).toBe('');
        }
    );

    test.each(KLAPPFORMULARE)(
        '%s: ein Entwurf ohne %s bleibt beim Aufklappen stehen (R2)',
        (id, idFeld, leerenName) => {
            const { inhalt } = baueKlappformular(id, idFeld, '');
            const leeren = leerenDoppel(id, idFeld);
            const { context } = ladeModul({ [leerenName]: leeren });

            context.toggleCollapse(id);

            expect(leeren).not.toHaveBeenCalled();
            expect(inhalt.classList.contains('open')).toBe(true);
            expect(document.getElementById('formular-name').value).toBe('Aria');
        }
    );

    test.each(KLAPPFORMULARE)(
        '%s: Zuklappen leert nie, auch nicht mit gesetzter %s',
        (id, idFeld, leerenName) => {
            const { inhalt, ikon } = baueKlappformular(id, idFeld, '1', true);
            const leeren = leerenDoppel(id, idFeld);
            const { context } = ladeModul({ [leerenName]: leeren });

            context.toggleCollapse(id);

            expect(leeren).not.toHaveBeenCalled();
            expect(inhalt.classList.contains('open')).toBe(false);
            expect(ikon.textContent).toBe('▼');
            expect(document.getElementById(idFeld).value).toBe('1');
        }
    );

    test('ohne geladenes Feature-Modul wirft die aufgeschobene Referenz nicht durch', () => {
        // Im Einzeltest (und wuerde ein Modul fehlen) ist `cancelCharEdit`
        // kein Bezeichner: die Referenz wirft einen ReferenceError, der
        // gefangen wird — das Formular klappt trotzdem auf.
        const { inhalt } = baueKlappformular('char-form', 'edit-char-id', '1');
        const { context } = ladeModul();

        expect(() => context.toggleCollapse('char-form')).not.toThrow();
        expect(inhalt.classList.contains('open')).toBe(true);
    });
});

describe('showNewCollapsibleForm() — Taste n und Befehlspalette (R3)', () => {
    test.each(KLAPPFORMULARE)(
        '%s: zu → klappt auf und verwirft dabei den Bearbeiten-Rest',
        (id, idFeld, leerenName) => {
            const { inhalt } = baueKlappformular(id, idFeld, '1');
            const leeren = leerenDoppel(id, idFeld);
            const { context } = ladeModul({ [leerenName]: leeren });

            context.showNewCollapsibleForm(id);

            expect(leeren).toHaveBeenCalledTimes(1);
            expect(inhalt.classList.contains('open')).toBe(true);
            expect(document.getElementById(idFeld).value).toBe('');
        }
    );

    test.each([
        ['ein offenes ✏️', '1'],
        ['ein offener Entwurf', '']
    ])('%s bleibt offen und unveraendert', (_was, idWert) => {
        // DER SATZ VON R3: vorher riefen Taste n und Palette toggleCollapse()
        // und klappten das offene Formular mitten in der Eingabe zu.
        const { inhalt, ikon } = baueKlappformular('char-form', 'edit-char-id', idWert, true);
        const leeren = leerenDoppel('char-form', 'edit-char-id');
        const { context } = ladeModul({ cancelCharEdit: leeren });

        context.showNewCollapsibleForm('char-form');

        expect(leeren).not.toHaveBeenCalled();
        expect(inhalt.classList.contains('open')).toBe(true);
        expect(ikon.textContent).toBe('▲');
        expect(document.getElementById('edit-char-id').value).toBe(idWert);
        expect(document.getElementById('formular-name').value).toBe('Aria');
    });

    test('eine unbekannte ID wirft nicht', () => {
        baueAufklappfeld('char-form');
        const { context } = ladeModul();
        expect(() => context.showNewCollapsibleForm('gibt-es-nicht')).not.toThrow();
    });
});

describe("switchView('notes') — das Datum der Notiz (ABBRUCH, R6)", () => {
    /** Datumsfeld und Bearbeiten-ID, wie `view-resources.html` sie fuehrt. */
    function baueNotizformular(idWert, datum) {
        document.body.innerHTML = `
            <div id="view-notes" class="view"></div>
            <div id="session-form" class="collapsible-content">
                <input type="hidden" id="edit-session-id" value="${idWert}">
                <input type="date" id="session-date" value="${datum}">
            </div>`;
        return document.getElementById('session-date');
    }
    const heute = () => new Date().toISOString().split('T')[0];

    test('ein leeres Datum ohne Bearbeiten bekommt heute vorgeschlagen', () => {
        const datum = baueNotizformular('', '');
        ladeModul().context.switchView('notes');
        expect(datum.value).toBe(heute());
    });

    test('das Datum einer bearbeiteten Notiz bleibt stehen', () => {
        // DER BEFUND: ✏️ S1 (2026-01-10) → Reiter Wiki → Notizen → 💾 schrieb
        // das heutige Datum in S1.
        const datum = baueNotizformular('1', '2026-01-10');
        ladeModul().context.switchView('notes');
        expect(datum.value).toBe('2026-01-10');
    });

    test('ein getipptes Entwurfsdatum bleibt stehen', () => {
        const datum = baueNotizformular('', '2026-03-01');
        ladeModul().context.switchView('notes');
        expect(datum.value).toBe('2026-03-01');
    });

    test('andere Ansichten fassen das Datum nicht an', () => {
        const datum = baueNotizformular('', '');
        ladeModul().context.switchView('wiki');
        expect(datum.value).toBe('');
    });
});

describe('KLAPPFORMULAR_BEARBEITEN — Vertrag mit Quelltext und Vorlagen (MAINT-02)', () => {
    // Top-Level-`const` liegt nicht am Globalobjekt der Sandbox, ist aber fuer
    // ein weiteres Skript im selben Kontext sichtbar. Fehlt die Tabelle, soll
    // der erste Fall rot werden und nicht die ganze Datei beim Sammeln werfen.
    const { context } = ladeModul();
    let tabelle = [];
    try {
        tabelle = vm.runInContext(
            `Object.entries(KLAPPFORMULAR_BEARBEITEN).map(([formular, e]) => ({
                formular,
                bearbeitenId: e.bearbeitenId,
                leeren: String(e.leeren)
            }))`,
            context
        );
    } catch {
        // siehe oben
    }

    const loader = fs.readFileSync(path.join(REPO_ROOT, 'loader.js'), 'utf8');
    const moduldateien = [
        ...(loader.match(/const MODULES = \[([\s\S]*?)\n\];/) || ['', ''])[1].matchAll(
            /'([^']+\.js)'/g
        )
    ].map(m => m[1]);
    const vorlagen = fs
        .readdirSync(TEMPLATES_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8'));

    test('die Tabelle nennt mindestens Charakter-, Encounter- und Notizformular', () => {
        expect(tabelle.map(e => e.formular)).toEqual(
            expect.arrayContaining(['char-form', 'enc-form', 'session-form'])
        );
        expect(moduldateien.length).toBeGreaterThan(0);
    });

    test.each(tabelle.map(e => [e.formular, e]))(
        '%s: die Leeren-Funktion ist deklariert, das ID-Feld steht im Formular',
        (formular, e) => {
            const name = (e.leeren.match(/=>\s*([A-Za-z_$][\w$]*)/) || [])[1];
            expect(name).toBeTruthy();
            const deklariert = moduldateien.filter(rel => {
                const voll = path.join(REPO_ROOT, rel);
                return (
                    fs.existsSync(voll) &&
                    new RegExp(`^function ${name}\\(`, 'm').test(fs.readFileSync(voll, 'utf8'))
                );
            });
            expect(deklariert.length).toBeGreaterThan(0);

            // Das ID-Feld steht in derselben Vorlage wie das Klappformular.
            const vorlage = vorlagen.find(v => v.includes(`<div id="${formular}"`));
            expect(vorlage).toBeDefined();
            expect(vorlage).toContain(`id="${e.bearbeitenId}"`);
        }
    );
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
