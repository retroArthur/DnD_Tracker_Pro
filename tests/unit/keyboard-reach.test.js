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

    test('eine Vorbereitungsansicht ist seit E-2 im Umfang', () => {
        // Hier stand bis b8a1a5c das Gegenteil ("eine Ansicht AUSSERHALB der
        // fuenf Kampfansichten bleibt unberuehrt", E-1) — mit der Bemerkung
        // "Wer den Umfang erweitert, aendert diesen Fall mit, und genau das
        // soll er muessen." Genau das ist passiert. `#f-ausserhalb` liegt in
        // `view-spells`, einer der 19 Vorbereitungsansichten, in denen
        // gemessen 255 sichtbare Stellen unerreichbar waren.
        expect(attr('f-ausserhalb')).toEqual({ ti: '0', rolle: 'button' });
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

    test('der Umfang kennt KEINE Ansichtsliste mehr (E-2)', () => {
        // Bis b8a1a5c stand hier die Gegenprobe: ein `Set KAMPF_ANSICHTEN`
        // mit genau fuenf Kennungen. Es ist nicht erweitert, sondern
        // ENTFERNT worden — ein Set, das alle 24 enthaelt, ist eine Luege im
        // Namen, und eine Liste, die jede Ansicht fuehren muss, faellt
        // lautlos zurueck, sobald jemand die 25. vergisst.
        //
        // Dieser Fall bewacht die Entscheidung von der Quelltextseite: im
        // Code (ohne Kommentare) darf `_imUmfang()` keine Ansicht mehr
        // ansehen. Der Kopfkommentar der Datei zitiert die entfernten zwei
        // Zeilen absichtlich weiter, darum werden Kommentare vorher
        // herausgenommen.
        const code = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
        expect(code).not.toMatch(/KAMPF_ANSICHTEN/);
        expect(code).not.toMatch(/closest\(\s*'\.view'\s*\)/);
        // Und die drei inhaltlichen Ausnahmen muessen stehen bleiben.
        expect(code).toMatch(/NATIV_FOKUSSIERBAR/);
        expect(code).toMatch(/KEINE_TASTATURZIELE/);
        expect(code).toMatch(/aria-hidden/);
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

describe('Kehrschleife — wer die Leertaste beansprucht', () => {
    // WAS HIER GEPRUEFT WIRD. Die Kehrschleife macht rund 430 Stellen
    // fokussierbar, die vorher keinen Fokus annehmen konnten. Damit fallen
    // sie alle unter die Leertasten-Schranke aus T-A — und der gewohnte
    // Griff des Spielleiters (Mausklick auf den Initiative-Wert, korrigieren,
    // Leertaste = naechster Zug) war gebrochen. `nurMausfokus()` nimmt genau
    // die Lage "versorgt UND per Zeiger fokussiert" wieder heraus.
    //
    // Die WIRKUNG davon — "der Zug geht nach dem Mausklick um genau 1
    // weiter" — steht in `tests/e2e/features/tastatur-erreichbarkeit.spec.js`,
    // Abschnitt (m); sie braucht einen echten Browser. Hier stehen die
    // Regeln der Mitschrift.

    beforeEach(() => {
        dokumentAufbauen();
        KeyboardReach.aktualisieren();
        // Jeder Fall faengt ohne Fokus an — sonst traegt der Stempel des
        // vorigen Falls in diesen hinein.
        document.getElementById('f-div').blur();
        document.body.focus();
    });

    /**
     * Ereignis aus dem Fenster DIESES Dokuments. `MouseEvent` und
     * `KeyboardEvent` stehen in der ESLint-Globals-Liste fuer `tests/**`
     * nicht (`no-undef` ist dort `error`, und das Lint-Gate in
     * `tests/unit/lint-gate.test.js` laesst 0 Fehler zu) — ueber
     * `document.defaultView` kommt derselbe Konstruktor, und zwar aus genau
     * dem Bereich, in den das Ereignis zugestellt wird.
     * @param {'MouseEvent'|'KeyboardEvent'} art
     * @param {string} typ
     * @param {Record<string, any>} [eigenschaften]
     */
    const ereignis = (art, typ, eigenschaften = {}) =>
        new document.defaultView[art](typ, { bubbles: true, ...eigenschaften });

    /** @param {string} id */
    const perZeigerFokussieren = id => {
        const el = document.getElementById(id);
        // Die Reihenfolge des Browsers: pointerdown, DANN der Fokus.
        el.dispatchEvent(ereignis('MouseEvent', 'pointerdown'));
        el.focus();
        return el;
    };

    /** @param {string} id */
    const perTastaturFokussieren = id => {
        const el = document.getElementById(id);
        // Die Reihenfolge des Browsers: keydown (Tab), DANN der Fokus.
        document.dispatchEvent(ereignis('KeyboardEvent', 'keydown', { key: 'Tab' }));
        el.focus();
        return el;
    };

    test('die Mitschrift haengt ueberhaupt (sonst prueft der Rest nichts)', () => {
        expect(KeyboardReach.statistik().aktiv).toBe(true);
        expect(perZeigerFokussieren('f-div')).toBe(document.activeElement);
    });

    test('istVersorgt() kennt genau die nachgeruesteten Stellen', () => {
        expect(KeyboardReach.istVersorgt(document.getElementById('f-div'))).toBe(true);
        expect(KeyboardReach.istVersorgt(document.getElementById('f-span'))).toBe(true);
        // Ein nativer Knopf wird nicht versorgt — und genau daran haengt,
        // dass ihm die Leertaste nicht weggenommen wird (T-A bleibt stehen).
        expect(KeyboardReach.istVersorgt(document.getElementById('f-button'))).toBe(false);
        // Eine Stelle, die ihr tabindex im Quelltext traegt, auch nicht.
        expect(KeyboardReach.istVersorgt(document.getElementById('f-null'))).toBe(false);
        expect(KeyboardReach.istVersorgt(null)).toBe(false);
    });

    test('per Zeiger fokussiert: das versorgte Element beansprucht die Leertaste NICHT', () => {
        const el = perZeigerFokussieren('f-div');
        expect(KeyboardReach.nurMausfokus(el)).toBe(true);
    });

    test('per Tastatur fokussiert: es beansprucht sie doch', () => {
        const el = perTastaturFokussieren('f-div');
        expect(KeyboardReach.nurMausfokus(el)).toBe(false);
    });

    test('derselbe Knoten, zweimal erreicht: der Stempel wird ueberschrieben', () => {
        // Der Fall, der eine Mitschrift mit Gedaechtnis (`WeakSet`) falsch
        // machen wuerde: wer eine Stelle anklickt, woanders hin tabuliert und
        // dann zurueck, hat sie per TASTATUR erreicht.
        const el = perZeigerFokussieren('f-div');
        expect(KeyboardReach.nurMausfokus(el)).toBe(true);
        perTastaturFokussieren('f-span');
        perTastaturFokussieren('f-div');
        expect(KeyboardReach.nurMausfokus(el)).toBe(false);
    });

    test('ein nativer Knopf per Zeiger: die Leertaste bleibt seine Bedienung', () => {
        // Die Einschlagsgrenze der Korrektur, als Fall. Die Lage ist dort
        // dieselbe (Mausfokus), aber der Knopf ist nicht versorgt — und auf
        // ihm war die Leertaste schon vor der Kehrschleife eine Bedienung.
        const el = perZeigerFokussieren('f-button');
        expect(KeyboardReach.nurMausfokus(el)).toBe(false);
    });

    test('versorgt, aber gar nicht fokussiert: kein Anspruch und kein Flaechenbrand', () => {
        perTastaturFokussieren('f-span');
        const andere = document.getElementById('f-div');
        expect(KeyboardReach.nurMausfokus(andere)).toBe(false);
    });

    test('die Herkunft des Fokus wird NICHT ueber :focus-visible erfragt', () => {
        // Das ist die eine Stelle, an der das Naheliegende nicht
        // funktioniert, und darum steht sie als Fall da. Gemessen am
        // gebauten Buendel, Lauscher am `window` in der Capture-Phase: nach
        // einem echten Mausklick meldet Chromium `:focus-visible` FALSE —
        // aber IM `keydown` schon TRUE, also bevor irgendeine Schranke sie
        // lesen kann. Wer die Mitschrift gegen die Pseudoklasse tauscht,
        // bekommt lautlos den alten Fehler zurueck.
        expect(SOURCE).not.toMatch(/matches\(\s*['"]:focus-visible/);
        // Und der Stempel faellt beim `focusin`, nicht beim Tastendruck.
        const mitschrift = SOURCE.slice(SOURCE.indexOf('_fokusMitschrift()'));
        expect(mitschrift).toMatch(/addEventListener\(\s*\n?\s*'focusin'/);
        expect(mitschrift).toMatch(/_zeigerFokus = this\._zeigerAnschlag \? ev\.target : null/);
    });
});
