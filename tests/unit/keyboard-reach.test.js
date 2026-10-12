/**
 * Kehrschleife — ui/keyboard-reach.js (TAST, T-C / Schritt 4)
 *
 * WARUM DIESE TESTS. Die Schleife setzt `tabindex="0"` und `role="button"`
 * ZUR LAUFZEIT (Orchestrator-Entscheidung O-3), nicht im Quelltext. Das
 * heisst: ein `grep tabindex` im Quellbaum zeigt die 219 nachgeruesteten
 * Stellen NICHT, und ihre Regeln stehen an genau einer Stelle. Wer sie dort
 * verschiebt, verschiebt sie fuer alle 219 — und zwar lautlos. Diese Datei
 * ist der Gegenhalt: sie prueft jede Regel einzeln, an einem Dokument, das
 * jeden Fall genau einmal enthaelt.
 *
 * Die Reichweite selbst — "nach der Nachruestung ist in den fuenf
 * Kampfansichten nichts mehr unerreichbar" — ist hier NICHT geprueft und
 * kann hier nicht geprueft werden: dafuer braucht es echte Tabulatorspruenge
 * in einem echten Browser. Das steht in
 * `tests/e2e/features/tastatur-erreichbarkeit.spec.js`. Hier stehen die
 * Regeln, dort die Wirkung.
 */

const fs = require('fs');
const path = require('path');

const MODULE_PATH = 'ui/keyboard-reach.js';
const SOURCE = fs.readFileSync(path.join(__dirname, '..', '..', MODULE_PATH), 'utf8');

/**
 * Das Modul EINMAL laden, gegen das ECHTE jsdom-Dokument. Die Umschlag-
 * Funktion ersetzt den `<script>`-Rahmen des gebauten Buendels: die
 * Modulkonstanten bleiben `const`, die Selbstaufruf-Zeile am Dateiende
 * laeuft mit, und `document` ist das Dokument dieses Tests — kein Attrappen-
 * DOM. Das ist hier Pflicht und nicht Bequemlichkeit: die Regeln der
 * Schleife haengen an `matches()`, `closest()` und an einem Selektor mit
 * `:not([tabindex])`. Eine Attrappe wuerde genau die Teile nachbilden, um
 * die es geht, und damit nichts pruefen.
 *
 * Ein zweiter Lauf im selben Bereich waere ein `SyntaxError` — darum
 * genau einmal in `beforeAll`.
 */
let KeyboardReach;

beforeAll(() => {
    const fensterAttrappe = global.window;
    const umschlag = new Function(
        'window',
        'document',
        'log',
        'ErrorHandler',
        'MutationObserver',
        'requestAnimationFrame',
        'setTimeout',
        SOURCE
    );
    umschlag(
        fensterAttrappe,
        global.document,
        () => {},
        { log: jest.fn() },
        global.MutationObserver,
        global.requestAnimationFrame,
        global.setTimeout
    );
    KeyboardReach = fensterAttrappe.KeyboardReach;
    if (!KeyboardReach) throw new Error(`${MODULE_PATH} hat window.KeyboardReach nicht gesetzt`);
});

/**
 * Ein Dokument, das jeden Fall genau einmal enthaelt: zwei Ansichten im
 * Umfang, eine ausserhalb, und die globale Schale ohne `.view`-Vorfahren.
 */
function dokumentAufbauen() {
    document.body.innerHTML = `
        <section id="view-initiative" class="view active">
            <div id="f-div" data-action="edit-init-value">14</div>
            <span id="f-span" data-action="toggle-init-slot-stop"></span>
            <label id="f-label" data-action="toggle-selected"><input type="checkbox" /></label>
            <button id="f-button" data-action="next-turn">Naechster Zug</button>
            <select id="f-select" data-action="set-enc-filter"></select>
            <a id="f-link" href="#x" data-action="navigate-entity">Ork 1</a>
            <textarea id="f-textarea" data-action="save-note"></textarea>
            <div id="f-blende" data-action="backdrop-close"></div>
            <div id="f-minus-eins" data-action="edit-char" tabindex="-1"></div>
            <div id="f-null" data-action="edit-char" tabindex="0"></div>
            <div id="f-fremde-rolle" data-action="edit-char" role="link"></div>
            <div id="f-aria" data-action="edit-char" aria-hidden="true"></div>
            <div id="f-ohne-aktion">kein Bedienelement</div>
        </section>
        <section id="view-spells" class="view">
            <div id="f-ausserhalb" data-action="edit-spell">ausserhalb des Umfangs</div>
        </section>
        <div id="globale-schale">
            <div id="f-global" data-action="toggle-quick-ref">Schnell-Referenz</div>
        </div>
    `;
}

/** @param {string} id */
function attr(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Testknoten "${id}" fehlt`);
    return { ti: el.getAttribute('tabindex'), rolle: el.getAttribute('role') };
}

describe('Kehrschleife — was sie setzt', () => {
    beforeEach(() => {
        dokumentAufbauen();
        KeyboardReach.aktualisieren();
    });

    test('ein div bekommt beide Attribute', () => {
        expect(attr('f-div')).toEqual({ ti: '0', rolle: 'button' });
    });

    test('ein span bekommt beide Attribute', () => {
        expect(attr('f-span')).toEqual({ ti: '0', rolle: 'button' });
    });

    test('eine Marke bekommt tabindex, aber KEINE role', () => {
        // `role="button"` auf einem `<label>` ueberschreibt den
        // Marken-Charakter. Gemessen an den 38 `label.char-resistance-chip`:
        // die Marke traegt OHNE role genauso — Leertaste -> 1 synthetischer
        // Klick, `.selected` false -> true, `checked` bleibt false,
        // identisch zum Mausklick (O-6).
        expect(attr('f-label')).toEqual({ ti: '0', rolle: null });
    });

    test('die globale Schale ausserhalb aller .view ist im Umfang', () => {
        // Ohne diesen Zweig bliebe `div.qref-fab` in allen 24 Ansichten
        // unerreichbar — auch in den fuenf, um die es hier geht.
        expect(attr('f-global')).toEqual({ ti: '0', rolle: 'button' });
    });
});

describe('Kehrschleife — was sie in Ruhe laesst', () => {
    beforeEach(() => {
        dokumentAufbauen();
        KeyboardReach.aktualisieren();
    });

    test.each([
        ['f-button', 'ein echter <button>'],
        ['f-select', 'ein <select>'],
        ['f-link', 'ein <a href>'],
        ['f-textarea', 'ein <textarea>']
    ])('%s (%s) bleibt unberuehrt', id => {
        // Diese Elemente sind schon erreichbar (gemessen: 0 von 1314 nativen
        // Bedienelementen sind in den 24 Ansichten unerreichbar), und
        // `role="button"` waere auf einem `<select>` sachlich falsch.
        expect(attr(id)).toEqual({ ti: null, rolle: null });
    });

    test('eine Blende (backdrop-close) bleibt ohne tabindex', () => {
        // Eine Blende faengt einen Klick NEBEN den Inhalt; auf der Tastatur
        // ist das Gegenstueck Escape. Gemessen: ohne diese Ausnahme erzeugt
        // `div#shortuts-overlay` — nur ueber `opacity: 0` versteckt — einen
        // Phantomhalt in 23 von 24 Ansichten.
        expect(attr('f-blende')).toEqual({ ti: null, rolle: null });
    });

    test('ein vorhandenes tabindex="-1" wird nicht ueberschrieben', () => {
        expect(attr('f-minus-eins')).toEqual({ ti: '-1', rolle: null });
    });

    test('ein vorhandenes tabindex="0" bekommt auch keine role nachgereicht', () => {
        // Wer `tabindex` im Quelltext setzt, hat sich um die Stelle gekuemmert
        // (die zwei Ablagezonen des Umzugs-Assistenten tun genau das).
        expect(attr('f-null')).toEqual({ ti: '0', rolle: null });
    });

    test('eine vorhandene, fremde role bleibt stehen', () => {
        expect(attr('f-fremde-rolle')).toEqual({ ti: '0', rolle: 'link' });
    });

    test('aria-hidden="true" und ein Tastaturhalt sind ein Widerspruch', () => {
        expect(attr('f-aria')).toEqual({ ti: null, rolle: null });
    });

    test('ein Element ohne data-action wird nicht angefasst', () => {
        expect(attr('f-ohne-aktion')).toEqual({ ti: null, rolle: null });
    });

    test('eine Ansicht AUSSERHALB der fuenf Kampfansichten bleibt unberuehrt (E-1)', () => {
        // Die uebrigen 19 Ansichten sind benannte Restschuld, nicht Teil
        // dieses Pakets. Wer den Umfang erweitert, aendert diesen Fall mit —
        // und genau das soll er muessen.
        expect(attr('f-ausserhalb')).toEqual({ ti: null, rolle: null });
    });
});

describe('Kehrschleife — Durchlauf und Buchfuehrung', () => {
    test('ein zweiter Durchlauf ohne Aenderung ruestet nichts nach', () => {
        dokumentAufbauen();
        const erst = KeyboardReach.aktualisieren();
        const zweit = KeyboardReach.aktualisieren();
        expect(erst).toBeGreaterThan(0);
        expect(zweit).toBe(0);
        // Das ist nicht nur Hygiene: `[data-action]:not([tabindex])` ist der
        // Grund, warum die Schleife im Dauerbetrieb nichts kostet (gemessen
        // 0,50 ms Median ueber 1803 Knoten, gegen 3,40 ms fuer renderParty()).
        expect(KeyboardReach.statistik().offen).toBe(0);
    });

    test('ein innerHTML-Ersatz macht die Arbeit zunichte — und der naechste Durchlauf holt sie nachher', () => {
        dokumentAufbauen();
        KeyboardReach.aktualisieren();
        expect(attr('f-div').ti).toBe('0');

        // Genau das, was 149 globale render*-Funktionen tun.
        document.getElementById('view-initiative').innerHTML =
            '<div id="f-neu" data-action="edit-init-value">9</div>';
        expect(attr('f-neu').ti).toBeNull();

        expect(KeyboardReach.aktualisieren()).toBe(1);
        expect(attr('f-neu')).toEqual({ ti: '0', rolle: 'button' });
    });

    test('ein Fehler im Durchlauf haelt die App nicht an', () => {
        // Die Schleife laeuft im Beobachter und im Post-Save-Haken — auf
        // Pfaden, die beide weiterlaufen muessen.
        const echt = document.querySelectorAll;
        document.querySelectorAll = () => {
            throw new Error('Probe');
        };
        try {
            expect(() => KeyboardReach.aktualisieren()).not.toThrow();
        } finally {
            document.querySelectorAll = echt;
        }
    });
});

describe('Kehrschleife — Quelltext-Zusicherungen', () => {
    test('der Beobachter wacht NUR ueber childList, nicht ueber Attribute', () => {
        // Mit `attributes: true` weckt jedes setAttribute dieser Schleife den
        // Beobachter erneut — eine Rueckkopplung, die bei einem Fehler im
        // Filter nicht terminiert. Ein innerHTML-Ersatz (der Pfad, der hier
        // zaehlt) ist immer auch eine childList-Aenderung.
        const aufruf = SOURCE.match(/\.observe\([^)]*\)/);
        if (!aufruf) throw new Error('Kein observe()-Aufruf in ' + MODULE_PATH);
        expect(aufruf[0]).toContain('childList');
        expect(aufruf[0]).not.toContain('attributes');
        expect(aufruf[0]).toContain('subtree');
    });

    test('der Umfang ist genau die fuenf Kampfansichten aus E-1', () => {
        const block = SOURCE.match(/KAMPF_ANSICHTEN = new Set\(\[([^\]]*)\]\)/);
        if (!block) throw new Error('KAMPF_ANSICHTEN nicht in ' + MODULE_PATH + ' gefunden');
        const kennungen = block[1]
            .split(',')
            .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean)
            .sort();
        expect(kennungen).toEqual([
            'view-dashboard',
            'view-dice',
            'view-dmscreen',
            'view-initiative',
            'view-party'
        ]);
    });

    test('die Rohauswahl schliesst vorhandene tabindex-Attribute aus', () => {
        expect(SOURCE).toMatch(/ROHAUSWAHL = '\[data-action\]:not\(\[tabindex\]\)'/);
    });

    test('die Schleife schreibt keinen Stil und bewegt keinen Fokus', () => {
        // Sie darf kein Pixel aendern (das ist die Grundlage von O-1 und der
        // Grund, warum der Stil-Sollstand ohne Ausnahme gruen bleibt) und
        // keinen Fokus setzen (das waere ein Griff in die Bedienung).
        const code = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
        expect(code).not.toMatch(/\.style\./);
        expect(code).not.toMatch(/classList/);
        expect(code).not.toMatch(/\.focus\(/);
        expect(code).not.toMatch(/\.execCommand\s*\(/);
        // Gesetzt werden GENAU zwei Attribute, und sonst keins.
        const gesetzt = [...code.matchAll(/setAttribute\(\s*'([^']+)'/g)].map(m => m[1]).sort();
        expect(gesetzt).toEqual(['role', 'tabindex']);
    });
});
