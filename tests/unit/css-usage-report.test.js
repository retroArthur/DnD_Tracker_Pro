/**
 * css-usage-report — Zaehlart-Pinning (Plan 15-06, Task 1)
 *
 * Diese Tests fahren AUSSCHLIESSLICH gegen kleine, hier selbst definierte
 * Zeichenketten-Vorlagen, nie gegen den echten Baum — sie pinnen die Zaehlart
 * des Werkzeugs, nicht den Tagesstand des Repos (siehe PLAN.md Task 1
 * <action>). Der echte Baum wird ausschliesslich in
 * `tools/css-usage-report.js`s eigenem Direktaufruf und in Plan 15-06 Task 3
 * gemessen.
 */

const fs = require('fs');
const path = require('path');

const {
    COMMENT_RE,
    withoutComments,
    collectCssClasses,
    collectLiveTokens,
    LIVE_PREFIXES,
    DEAD_EXCEPTIONS,
    analyze,
    renderTable
} = require('../../tools/css-usage-report.js');

describe('css-usage-report — Grundexporte', () => {
    test('LIVE_PREFIXES hat genau fuenf eingefrorene Eintraege', () => {
        expect(LIVE_PREFIXES).toEqual(['color-', 'condition-', 'editor-toolbar-', 'rel-btn-', 'tag-']);
    });

    test('DEAD_EXCEPTIONS ist eine Liste datierter, begruendeter Eintraege (leer waere ebenfalls gueltig)', () => {
        // Vor der Pflicht-Fehlalarm-Pruefung (Task 3) leer; danach traegt sie
        // jeden gefundenen Fehlalarm mit Datum und Begruendung — beide
        // Zustaende sind fuer diesen Testfall gueltig, geprueft wird nur die
        // FORM je Eintrag (D-50-Kommentarformat, uebertragen auf Code).
        DEAD_EXCEPTIONS.forEach(entry => {
            expect(typeof entry.class).toBe('string');
            expect(entry.class.length).toBeGreaterThan(0);
            expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(typeof entry.reason).toBe('string');
            expect(entry.reason.length).toBeGreaterThan(0);
        });
    });

    test('COMMENT_RE erscheint woertlich auch in tests/unit/design-consistency.test.js (eine Zaehlart, keine zweite)', () => {
        const consistencySrc = fs.readFileSync(path.join(__dirname, 'design-consistency.test.js'), 'utf8');
        expect(consistencySrc).toContain(COMMENT_RE.toString());
    });

    test('withoutComments() entfernt Blockkommentare vollstaendig', () => {
        const css = '.a { color: red; } /* .b { color: blue; } */ .c { color: green; }';
        const result = withoutComments(css);
        expect(result).not.toContain('.b');
        expect(result).toContain('.a');
        expect(result).toContain('.c');
    });
});

describe('css-usage-report — Stufe 1: Wort-Token statt Teilstring', () => {
    test('".btn-primary" haelt ".btn" NICHT lebendig (Teiltreffer in beide Richtungen zaehlt nicht)', () => {
        const cssFiles = [{ name: 'a.css', content: '.btn { color: red; } .btn-primary { color: gold; }' }];
        const templateFiles = [{ name: 'a.html', content: '<button class="btn-primary">Go</button>' }];
        const result = analyze({ cssFiles, templateFiles, jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        // .btn-primary ist per Wort-Token benutzt -> lebt
        expect(file.deadClasses).not.toContain('btn-primary');
        // .btn ist NUR als Teilstring von "btn-primary" vorhanden -> tot
        expect(file.deadClasses).toContain('btn');
    });

    test('".btn" haelt ".btn-primary" NICHT lebendig (umgekehrte Richtung)', () => {
        const cssFiles = [{ name: 'a.css', content: '.btn-primary { color: gold; }' }];
        const templateFiles = [{ name: 'a.html', content: '<button class="btn">Go</button>' }];
        const result = analyze({ cssFiles, templateFiles, jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).toContain('btn-primary');
    });
});

describe('css-usage-report — Klassen-Kontext ist Pflicht', () => {
    test('ein Aktionsname/eine Element-Kennung mit demselben Wortlaut macht eine Klasse NICHT lebend', () => {
        const cssFiles = [{ name: 'a.css', content: '.foo { color: red; }' }];
        const templateFiles = [
            {
                name: 'a.html',
                content: '<button id="foo" data-action="foo" data-value="foo">X</button>'
            }
        ];
        const result = analyze({ cssFiles, templateFiles, jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        // "foo" kommt nur als id/data-action/data-value vor, nie in einem
        // class=/className=/classList.*-Kontext -> muss tot bleiben
        expect(file.deadClasses).toContain('foo');
    });

    test('class="..." in einem JS-Template-Literal zaehlt als Klassen-Kontext', () => {
        const cssFiles = [{ name: 'a.css', content: '.slot-pip { color: gold; } .slot-pip.filled { color: green; }' }];
        const jsFiles = [
            {
                name: 'render.js',
                content:
                    "html += `<span class=\"slot-pip ${isAvailable ? 'filled' : ''}\" data-id=\"${id}\"></span>`;"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('slot-pip');
    });

    test('classList.add()/className= zaehlen als Klassen-Kontext', () => {
        const cssFiles = [
            { name: 'a.css', content: '.dice-hero-result { color: gold; } .dice-hero-result.crit { color: green; }' }
        ];
        const jsFiles = [
            {
                name: 'dice.js',
                content:
                    "heroResult.className = 'dice-hero-result'; heroResult.classList.add('crit');"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).toEqual([]);
    });
});

describe('css-usage-report — Stufe 2: eingefrorene Praefixe, nur aus Klassen-Kontexten', () => {
    test('ein Praefix rettet ALLE Klassen mit diesem Praefix, sobald es in einem class-Kontext belegt ist', () => {
        const cssFiles = [{ name: 'a.css', content: '.tag-blau { color: blue; } .tag-rot { color: red; }' }];
        const templateFiles = [
            { name: 'a.html', content: '<span class="tag-${farbe}">X</span>' }
        ];
        const result = analyze({ cssFiles, templateFiles, jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        // "tag-" ist als Praefix belegt (das ${farbe} wird vor dem Vergleich
        // entfernt, das reine Praefix "tag-" bleibt als Token nicht stehen —
        // die Praefixregel selbst greift ueber classAttrTokens-Test unten).
        expect(file.deadClasses).toEqual([]);
    });

    test('ein NICHT eingefrorener Praefix rettet nichts', () => {
        const cssFiles = [{ name: 'a.css', content: '.custom-foo { color: red; }' }];
        const templateFiles = [{ name: 'a.html', content: '<span class="custom-${x}">X</span>' }];
        const result = analyze({ cssFiles, templateFiles, jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).toContain('custom-foo');
    });
});

describe('css-usage-report — Stufe 3: Anker-Regel fuer Verbundselektoren', () => {
    test('ein Verbundselektor stirbt nur, wenn ALLE seine Klassen tot sind', () => {
        const cssFiles = [
            {
                name: 'a.css',
                content: '.live { color: red; } .dead { color: blue; } .live.dead { color: green; }'
            }
        ];
        const templateFiles = [{ name: 'a.html', content: '<div class="live">X</div>' }];
        const result = analyze({ cssFiles, templateFiles, jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        const compound = file.deadRuleBlocks.find(r => r.selectors.includes('.live.dead'));
        // .live ist lebendig -> der Verbundselektor .live.dead ist NICHT
        // vollstaendig tot, obwohl .dead fuer sich genommen tot ist.
        expect(compound).toBeUndefined();
        const deadAlone = file.deadRuleBlocks.find(r => r.selectors.trim() === '.dead');
        expect(deadAlone).toBeDefined();
    });

    test('ein Selektor ganz ohne Klasse landet NIE in der Totenliste, sondern getrennt als nicht beurteilbar', () => {
        const cssFiles = [
            { name: 'a.css', content: '#map-container { display: none; } .dead-one { color: red; }' }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadRuleBlocks.some(r => r.selectors.includes('#map-container'))).toBe(false);
        expect(file.notJudgeable.some(r => r.selectors.includes('#map-container'))).toBe(true);
        expect(file.deadRuleBlocks.some(r => r.selectors.trim() === '.dead-one')).toBe(true);
    });
});

describe('css-usage-report — Kommentarentfernung vor jeder Zaehlung', () => {
    test('eine nur im Kommentar erwaehnte Klasse zaehlt nicht als eigene Regel, und ein toter Selektor im Kommentar landet nicht in der Totenliste', () => {
        const cssFiles = [
            {
                name: 'a.css',
                content: '/* .ghost { color: red; } */\n.real { color: blue; }'
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadRuleBlocks.some(r => r.selectors.includes('.ghost'))).toBe(false);
        expect(file.deadClasses).not.toContain('ghost');
        expect(file.deadClasses).toContain('real');
    });
});

describe('css-usage-report — String-Konkatenation statt Template-Literal (Rule-1-Fund, Task 3)', () => {
    test('eine per "+"-Konkatenation gebaute class="..."-Zuweisung wird trotz abweichendem Anfuehrungstyp erkannt', () => {
        // Muster aus features/initiative-mob.js: die HTML-Anfuehrung ist ",
        // die umschliessende JS-Zeichenkette nutzt aber ' — ein naiver Scan
        // bis zur naechsten " liefe an der echten Klassen-Grenze vorbei.
        const cssFiles = [{ name: 'a.css', content: '.init-mob-mode-btn { color: red; }' }];
        const jsFiles = [
            {
                name: 'initiative-mob.js',
                content:
                    "html += '<button class=\"init-mob-mode-btn' + (!isDmgRegel ? ' active' : '') + '\"' + '>X</button>';"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('init-mob-mode-btn');
    });

    test('${...}-Interpolation innerhalb einer doppelt zitierten class="..." bricht den Scan nicht vorzeitig ab, auch wenn sie einfache Anfuehrungszeichen enthaelt', () => {
        const cssFiles = [{ name: 'a.css', content: '.slot-pip { color: gold; }' }];
        const jsFiles = [
            {
                name: 'render.js',
                content: "html += `<span class=\"slot-pip ${isAvailable ? 'filled' : ''}\"></span>`;"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('slot-pip');
    });
});

describe('css-usage-report — @keyframes-Namen sind keine Klassenselektoren', () => {
    test('ein @keyframes-Name mit dms-Praefix wird nicht als toter/lebender Klassenselektor gezaehlt', () => {
        const cssFiles = [
            {
                name: 'a.css',
                content:
                    '@keyframes dms-live-pulse { 0% { opacity: 1; } 100% { opacity: 0; } }\n.dms-untouched { color: red; }'
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('dms-live-pulse');
        expect(file.deadClasses).toContain('dms-untouched');
    });
});

describe('css-usage-report — vier Basisgroessen (DEAD-03)', () => {
    test('rgba/rgb-Zahlentripel, em, box-shadow und transition: all werden gesamt UND innerhalb toter Regeln gezaehlt', () => {
        const cssFiles = [
            {
                name: 'a.css',
                content:
                    '.dead { color: rgba(0, 0, 0, 0.5); font-size: 1.2em; box-shadow: 0 0 4px black; transition: all 0.2s; }\n' +
                    '.live { color: rgba(255, 255, 255, 1); }'
            }
        ];
        const templateFiles = [{ name: 'a.html', content: '<div class="live">X</div>' }];
        const result = analyze({ cssFiles, templateFiles, jsFiles: [] });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.totals.rgba).toBe(2);
        expect(file.deadTotals.rgba).toBe(1);
        expect(file.totals.em).toBe(1);
        expect(file.deadTotals.em).toBe(1);
        expect(file.totals.boxShadow).toBe(1);
        expect(file.deadTotals.boxShadow).toBe(1);
        expect(file.totals.transitionAll).toBe(1);
        expect(file.deadTotals.transitionAll).toBe(1);
    });
});

describe('css-usage-report — Determinismus', () => {
    const fixture = {
        cssFiles: [
            { name: 'b.css', content: '.zeta { color: red; } .alpha { color: blue; }' },
            { name: 'a.css', content: '.only-dead { color: green; }' }
        ],
        templateFiles: [{ name: 't.html', content: '<div class="alpha">X</div>' }],
        jsFiles: []
    };

    test('zwei Laeufe auf denselben Eingaben liefern byte-gleiche Ausgabe (renderTable und JSON)', () => {
        const r1 = analyze(fixture);
        const r2 = analyze(fixture);
        expect(JSON.stringify(r1)).toEqual(JSON.stringify(r2));
        expect(renderTable(r1)).toEqual(renderTable(r2));
    });

    test('Dateien sind nach Dateiname aufsteigend sortiert, Klassen darin nach Klassenname aufsteigend', () => {
        const result = analyze(fixture);
        const names = result.files.map(f => f.name);
        expect(names).toEqual([...names].sort());
        const bFile = result.files.find(f => f.name === 'b.css');
        expect(bFile.deadClasses).toEqual([...bFile.deadClasses].sort());
    });
});

describe('css-usage-report — nicht klassenbasiert beurteilbare Bloecke sind global sichtbar', () => {
    test('notJudgeableCount zaehlt ueber alle Dateien', () => {
        const cssFiles = [
            { name: 'a.css', content: '#only-id { color: red; }' },
            { name: 'b.css', content: 'body { margin: 0; }' }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles: [] });
        expect(result.notJudgeableCount).toBe(2);
    });
});

describe('css-usage-report — renderTable() und JSON-Form', () => {
    test('renderTable() listet jede Datei, auch mit null toten Klassen', () => {
        const cssFiles = [
            { name: 'has-dead.css', content: '.dead { color: red; }' },
            { name: 'all-live.css', content: '.live { color: blue; }' }
        ];
        const templateFiles = [{ name: 't.html', content: '<div class="live">X</div>' }];
        const result = analyze({ cssFiles, templateFiles, jsFiles: [] });
        const table = renderTable(result);
        expect(table).toContain('has-dead.css');
        expect(table).toContain('all-live.css');
    });

    test('das Ergebnisobjekt ist JSON-serialisierbar mit files und totals', () => {
        const result = analyze({ cssFiles: [{ name: 'a.css', content: '.x{color:red;}' }], templateFiles: [], jsFiles: [] });
        const json = JSON.parse(JSON.stringify(result));
        expect(Array.isArray(json.files)).toBe(true);
        expect(json.totals).toBeDefined();
    });
});

describe('css-usage-report — CR-01/WR-01: die bewiesene Blindstelle (Plan 15-09, Task 1)', () => {
    test('CR-01a: eine Zuweisung an die Klassenlisten-Eigenschaft mit einer Ternary rechts vom Gleichheitszeichen haelt BEIDE Zweige lebendig', () => {
        // Reale Form aus dom-builder.js (im ui/-Verzeichnis), Zeile 393 —
        // `container.className = options.viewMode === 'list' ? 'list-view-container' : 'npc-grid';`
        const cssFiles = [
            {
                name: 'a.css',
                content: '.alpha { color: red; } .beta { color: blue; } .dead-control { color: green; }'
            }
        ];
        const jsFiles = [
            { name: 'a.js', content: "container.className = bedingung ? 'alpha' : 'beta';" }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('alpha');
        expect(file.deadClasses).not.toContain('beta');
        expect(file.deadClasses).toContain('dead-control');
    });

    test('CR-01b: ein Objektschluessel "containerClass:" mit einer Ternary haelt BEIDE Zweige lebendig', () => {
        // Reale Form aus safe-render.js (im ui/-Verzeichnis), Zeile 360 —
        // `containerClass: options.viewMode === 'list' ? 'list-view-container' : 'npc-grid',`
        const cssFiles = [
            {
                name: 'a.css',
                content: '.alpha { color: red; } .beta { color: blue; } .dead-control { color: green; }'
            }
        ];
        const jsFiles = [
            {
                name: 'a.js',
                content: "renderListFast(container, items, render, { containerClass: bedingung ? 'alpha' : 'beta' });"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('alpha');
        expect(file.deadClasses).not.toContain('beta');
        expect(file.deadClasses).toContain('dead-control');
    });

    test('CR-01c: ein Objektschluessel "className:" mit einem einfachen Literal haelt die Klasse lebendig', () => {
        const cssFiles = [
            { name: 'a.css', content: '.alpha { color: red; } .dead-control { color: green; }' }
        ];
        const jsFiles = [
            { name: 'a.js', content: "renderCard(container, { className: 'alpha' });" }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('alpha');
        expect(file.deadClasses).toContain('dead-control');
    });

    test('WR-01: ein geklammerter Funktionsaufruf VOR dem Klassenliteral in classList.toggle() darf das Literal nicht verschlucken', () => {
        const cssFiles = [
            { name: 'a.css', content: '.alpha { color: red; } .dead-control { color: green; }' }
        ];
        const jsFiles = [
            { name: 'a.js', content: "el.classList.toggle(berechneName(x), 'alpha');" }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('alpha');
        expect(file.deadClasses).toContain('dead-control');
    });
});

describe('css-usage-report — CR-03a: Interpolationsinhalt wird geerntet statt verworfen (Plan 15-11, Task 1)', () => {
    test('CR-03a: eine ${...}-Interpolation mit einer Ternary aus zwei Zeichenketten-Literalen in einem class="..."-Attribut haelt BEIDE Literale lebendig', () => {
        // Reale Form aus features/shops/shops-core.js:596 —
        // `<div class="si-item ${isAvailable ? '' : 'si-unavailable'}">` — hier
        // mit zwei nicht-leeren Zweigen nachgebildet, um zu zeigen, dass BEIDE
        // Literale einer Ternary erkannt werden, nicht nur eines.
        const cssFiles = [
            {
                name: 'a.css',
                content:
                    '.si-available { color: green; } .si-unavailable { color: red; } .istVerfuegbar { color: pink; } .dead-control { color: blue; }'
            }
        ];
        const jsFiles = [
            {
                name: 'a.js',
                content:
                    "html += `<div class=\"si-item ${istVerfuegbar ? 'si-available' : 'si-unavailable'}\">`;"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        // Beide Ternary-Zweige (Zeichenketten-Literale) sind lebendig.
        expect(file.deadClasses).not.toContain('si-available');
        expect(file.deadClasses).not.toContain('si-unavailable');
        // CR-03a-Gegenrichtung: der Bezeichner der Bedingung wird NICHT zum
        // Token — nur Zeichenketten-Literale zaehlen, kein Ausdruckstext.
        expect(file.deadClasses).toContain('istVerfuegbar');
        // CR-03a-Kontrollklasse: eine nirgends zugewiesene Klasse bleibt tot.
        expect(file.deadClasses).toContain('dead-control');
    });
});

describe('css-usage-report — CR-02: Umbruchschranke ersetzt durch harte Zeichen-Obergrenze (Plan 15-11, Task 2)', () => {
    test('CR-02a: eine ueber zwei Zeilen umbrochene .className-Zuweisung mit Basisliteral und zwei geklammerten Ternaries haelt alle drei Zeichenketten-Literale lebendig', () => {
        // Reale Form aus features/dice/dice-core.js:379-381 — Gleichheitszeichen
        // am Zeilenende, Ausdruck (Basisliteral + zwei geklammerte Ternaries)
        // in der Folgezeile.
        const cssFiles = [
            {
                name: 'a.css',
                content:
                    '.dice-result-main { color: red; } .dice-crit { color: gold; } .dice-fail { color: grey; } .dead-control { color: blue; }'
            }
        ];
        const jsFiles = [
            {
                name: 'a.js',
                content:
                    "main.className =\n    'dice-result-main' + (isCrit ? ' dice-crit' : '') + (isFail ? ' dice-fail' : '');"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('dice-result-main');
        expect(file.deadClasses).not.toContain('dice-crit');
        expect(file.deadClasses).not.toContain('dice-fail');
        expect(file.deadClasses).toContain('dead-control');
    });

    test('CR-02b: ein "containerClass:"-Objektschluessel mit einer ueber die Folgezeile umbrochenen Ternary haelt beide Zweige lebendig', () => {
        // Reale Form aus ui/safe-render.js:360 — hier bewusst mit dem Wert in
        // der Folgezeile, um den Umbruchfall zu belegen (im echten Baum steht
        // die Zeile heute nur zufaellig einzeilig).
        const cssFiles = [
            { name: 'a.css', content: '.gamma { color: red; } .delta { color: blue; } .dead-control { color: green; }' }
        ];
        const jsFiles = [
            {
                name: 'a.js',
                content:
                    "renderListFast(container, items, render, {\n    containerClass:\n        bedingung ? 'gamma' : 'delta'\n});"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('gamma');
        expect(file.deadClasses).not.toContain('delta');
        expect(file.deadClasses).toContain('dead-control');
    });

    test('CR-02c: ein Klassen-Kontext ohne Terminator sammelt keine Token aus weit entferntem Dateitext ein, weil der Scan an MAX_SEGMENT_SCAN_CHARS endet', () => {
        // Der Wegfall der Umbruchschranke (CR-02a/b) darf keine unbegrenzte
        // Leseweite eroeffnen: ohne Terminator bis zum Dateiende muesste die
        // konstante Obergrenze den Scan beenden, bevor er weit entfernten,
        // unbeteiligten Dateitext (hier eine Kontrollklasse in einem
        // console.log()-Aufruf) als Token einsammelt.
        const filler = 'x'.repeat(2200);
        const cssFiles = [
            {
                name: 'a.css',
                content:
                    '.alpha { color: red; } .beta { color: blue; } .nicht-eine-klasse-weit-entfernt { color: green; }'
            }
        ];
        const jsFiles = [
            {
                name: 'a.js',
                content:
                    "el.className = 'alpha' + (cond ? ' beta' : '')\n" +
                    filler +
                    "\nconsole.log('nicht-eine-klasse-weit-entfernt');\n"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('alpha');
        expect(file.deadClasses).not.toContain('beta');
        expect(file.deadClasses).toContain('nicht-eine-klasse-weit-entfernt');
    });
});

describe('css-usage-report — CR-03b/c: vierte Kontextregel fuer die Zwischenvariablen-Form (Plan 15-11, Task 3)', () => {
    test('CR-03b: ein per var-Ternary deklarierter Bezeichner, der innerhalb derselben Anweisung wie ein class="..."-Vorkommen konkateniert wird, haelt beide Literale lebendig', () => {
        // Reale Form aus features/fraktionen/fraktionen-render.js: eine
        // Deklaration mit var, rechts ein Ternary aus zwei Klassenliteralen,
        // danach eine Anweisung, die ein class="..."-Attribut oeffnet und den
        // Bezeichner per Konkatenation einsetzt.
        const cssFiles = [
            {
                name: 'a.css',
                content:
                    '.fr-hist-plus { color: green; } .fr-hist-minus { color: red; } .dead-control { color: blue; }'
            }
        ];
        const jsFiles = [
            {
                name: 'a.js',
                content:
                    "var deltaClass = delta >= 0 ? 'fr-hist-plus' : 'fr-hist-minus';\n" +
                    "html += '<span class=\"fr-hist-delta ' + deltaClass + '\">' + esc(deltaStr) + '</span>';"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).not.toContain('fr-hist-plus');
        expect(file.deadClasses).not.toContain('fr-hist-minus');
        expect(file.deadClasses).toContain('dead-control');
    });

    test('CR-03c (Praezisions-Gegenprobe): derselbe per var-Ternary deklarierte Bezeichner bleibt tot, wenn er in KEINER Anweisung mit einem class="..."-Vorkommen konkateniert wird', () => {
        // Ohne diesen Fall waere die vierte Regel eine Pauschalfreigabe fuer
        // jede Ternary-Variable im Baum, unabhaengig davon, ob sie je mit
        // einem class="..."-Vorkommen zusammentrifft.
        const cssFiles = [
            {
                name: 'a.css',
                content: '.fr-hist-plus { color: green; } .fr-hist-minus { color: red; } .dead-control { color: blue; }'
            }
        ];
        const jsFiles = [
            {
                name: 'a.js',
                content: "var deltaClass = delta >= 0 ? 'fr-hist-plus' : 'fr-hist-minus';\nconsole.log(deltaClass);"
            }
        ];
        const result = analyze({ cssFiles, templateFiles: [], jsFiles });
        const file = result.files.find(f => f.name === 'a.css');
        expect(file.deadClasses).toContain('fr-hist-plus');
        expect(file.deadClasses).toContain('fr-hist-minus');
        expect(file.deadClasses).toContain('dead-control');
    });
});
