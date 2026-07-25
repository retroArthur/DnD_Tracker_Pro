/**
 * Unit Tests - Security (XSS Prevention)
 * Tiefe Tests für sanitizeHTML und andere sicherheitsrelevante Funktionen
 */

const { sanitizeHTML, esc } = require('../../utils/testable-utils');

// ============================================================
// XSS PREVENTION - TIEFE TESTS
// ============================================================

describe('Security: sanitizeHTML XSS Prevention', () => {
    // --------------------------------------------------------
    // SCRIPT INJECTION
    // --------------------------------------------------------

    describe('Script Injection', () => {
        test('entfernt einfache script-Tags', () => {
            const dirty = '<script>alert("XSS")</script>';
            expect(sanitizeHTML(dirty)).not.toContain('<script');
            expect(sanitizeHTML(dirty)).not.toContain('alert');
        });

        test('entfernt script-Tags mit Attributen', () => {
            const dirty = '<script type="text/javascript" src="evil.js"></script>';
            expect(sanitizeHTML(dirty)).not.toContain('<script');
        });

        test('entfernt verschachtelte script-Tags', () => {
            const dirty = '<script><script>alert(1)</script></script>';
            expect(sanitizeHTML(dirty)).not.toContain('<script');
        });

        test('entfernt script mit Zeilenumbrüchen', () => {
            const dirty = `<script>
                alert("XSS");
                document.cookie;
            </script>`;
            expect(sanitizeHTML(dirty)).not.toContain('<script');
            expect(sanitizeHTML(dirty)).not.toContain('document.cookie');
        });

        test('entfernt script mit verschiedener Groß-/Kleinschreibung', () => {
            const variations = [
                '<SCRIPT>alert(1)</SCRIPT>',
                '<ScRiPt>alert(1)</ScRiPt>',
                '<sCRIPT>alert(1)</sCRIPT>'
            ];
            variations.forEach(dirty => {
                expect(sanitizeHTML(dirty).toLowerCase()).not.toContain('<script');
            });
        });
    });

    // --------------------------------------------------------
    // EVENT HANDLER INJECTION
    // --------------------------------------------------------

    describe('Event Handler Injection', () => {
        test('entfernt onclick Handler', () => {
            const dirty = '<div onclick="alert(1)">Click</div>';
            const clean = sanitizeHTML(dirty);
            expect(clean).not.toContain('onclick');
            expect(clean).toContain('Click');
        });

        test('entfernt onerror Handler', () => {
            const dirty = '<img src="x" onerror="alert(1)">';
            expect(sanitizeHTML(dirty)).not.toContain('onerror');
        });

        test('entfernt onload Handler', () => {
            const dirty = '<body onload="alert(1)">';
            expect(sanitizeHTML(dirty)).not.toContain('onload');
        });

        test('entfernt onmouseover Handler', () => {
            const dirty = '<div onmouseover="alert(1)">Hover</div>';
            expect(sanitizeHTML(dirty)).not.toContain('onmouseover');
        });

        test('entfernt onfocus Handler', () => {
            const dirty = '<input onfocus="alert(1)">';
            expect(sanitizeHTML(dirty)).not.toContain('onfocus');
        });

        test('entfernt Event-Handler ohne Anführungszeichen', () => {
            const dirty = '<div onclick=alert(1)>Click</div>';
            expect(sanitizeHTML(dirty)).not.toContain('onclick');
        });

        test('entfernt Event-Handler mit einfachen Anführungszeichen', () => {
            const dirty = "<div onclick='alert(1)'>Click</div>";
            expect(sanitizeHTML(dirty)).not.toContain('onclick');
        });

        test('entfernt alle on* Event-Handler', () => {
            const handlers = [
                'onabort',
                'onblur',
                'onchange',
                'ondblclick',
                'ondrag',
                'ondragend',
                'ondragenter',
                'ondragleave',
                'ondragover',
                'ondragstart',
                'ondrop',
                'onerror',
                'onfocus',
                'oninput',
                'onkeydown',
                'onkeypress',
                'onkeyup',
                'onload',
                'onmousedown',
                'onmousemove',
                'onmouseout',
                'onmouseover',
                'onmouseup',
                'onreset',
                'onresize',
                'onscroll',
                'onselect',
                'onsubmit'
            ];
            handlers.forEach(handler => {
                const dirty = `<div ${handler}="alert(1)">Test</div>`;
                expect(sanitizeHTML(dirty)).not.toContain(handler);
            });
        });
    });

    // --------------------------------------------------------
    // JAVASCRIPT PROTOCOL
    // --------------------------------------------------------

    describe('JavaScript Protocol', () => {
        test('entfernt javascript: in href', () => {
            const dirty = '<a href="javascript:alert(1)">Click</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).not.toContain('javascript:');
        });

        test('entfernt javascript: mit Großbuchstaben', () => {
            const variations = [
                '<a href="JAVASCRIPT:alert(1)">Click</a>',
                '<a href="JavaScript:alert(1)">Click</a>',
                '<a href="JaVaScRiPt:alert(1)">Click</a>'
            ];
            variations.forEach(dirty => {
                expect(sanitizeHTML(dirty).toLowerCase()).not.toContain('javascript:');
            });
        });

        test('entfernt javascript: mit Leerzeichen', () => {
            const dirty = '<a href="javascript : alert(1)">Click</a>';
            expect(sanitizeHTML(dirty)).not.toContain('alert');
        });

        test('entfernt vbscript: Protokoll', () => {
            const dirty = '<a href="vbscript:msgbox(1)">Click</a>';
            expect(sanitizeHTML(dirty)).not.toContain('vbscript:');
        });

        test('entfernt data: text/html Protokoll', () => {
            const dirty = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
            expect(sanitizeHTML(dirty)).not.toContain('data:');
        });
    });

    // --------------------------------------------------------
    // GEFÄHRLICHE TAGS
    // --------------------------------------------------------

    describe('Gefährliche Tags', () => {
        test('entfernt iframe-Tags', () => {
            const dirty = '<iframe src="http://evil.com"></iframe>';
            expect(sanitizeHTML(dirty)).not.toContain('<iframe');
        });

        test('entfernt object-Tags', () => {
            const dirty = '<object data="evil.swf"></object>';
            expect(sanitizeHTML(dirty)).not.toContain('<object');
        });

        test('entfernt embed-Tags', () => {
            const dirty = '<embed src="evil.swf">';
            expect(sanitizeHTML(dirty)).not.toContain('<embed');
        });

        test('entfernt form-Tags', () => {
            const dirty = '<form action="http://evil.com"><input></form>';
            expect(sanitizeHTML(dirty)).not.toContain('<form');
        });

        test('entfernt input-Tags', () => {
            const dirty = '<input type="text" value="test">';
            expect(sanitizeHTML(dirty)).not.toContain('<input');
        });

        test('entfernt style-Tags', () => {
            const dirty = '<style>body { background: url("javascript:alert(1)") }</style>';
            expect(sanitizeHTML(dirty)).not.toContain('<style');
        });

        test('entfernt link-Tags', () => {
            const dirty = '<link rel="stylesheet" href="evil.css">';
            expect(sanitizeHTML(dirty)).not.toContain('<link');
        });

        test('entfernt meta-Tags', () => {
            const dirty = '<meta http-equiv="refresh" content="0;url=http://evil.com">';
            expect(sanitizeHTML(dirty)).not.toContain('<meta');
        });

        test('entfernt base-Tags', () => {
            const dirty = '<base href="http://evil.com/">';
            expect(sanitizeHTML(dirty)).not.toContain('<base');
        });

        test('entfernt svg mit Script', () => {
            const dirty = '<svg onload="alert(1)"><circle r="10"></circle></svg>';
            expect(sanitizeHTML(dirty)).not.toContain('<svg');
            expect(sanitizeHTML(dirty)).not.toContain('onload');
        });

        test('entfernt math-Tags', () => {
            const dirty =
                '<math><maction actiontype="statusline#http://evil">Click</maction></math>';
            expect(sanitizeHTML(dirty)).not.toContain('<math');
        });
    });

    // --------------------------------------------------------
    // ERLAUBTE TAGS (WHITELIST)
    // --------------------------------------------------------

    describe('Erlaubte Tags (Whitelist)', () => {
        test('behält b/i/u/s Tags', () => {
            const dirty = '<b>Bold</b><i>Italic</i><u>Underline</u><s>Strike</s>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('<b>');
            expect(clean).toContain('<i>');
            expect(clean).toContain('<u>');
            expect(clean).toContain('<s>');
        });

        test('behält Listen-Tags', () => {
            const dirty = '<ul><li>Item 1</li><li>Item 2</li></ul>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('<ul>');
            expect(clean).toContain('<li>');
        });

        test('behält Überschriften', () => {
            const dirty = '<h1>Titel</h1><h2>Untertitel</h2>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('<h1>');
            expect(clean).toContain('<h2>');
        });

        test('behält Tabellen-Tags', () => {
            const dirty =
                '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('<table>');
            expect(clean).toContain('<th>');
            expect(clean).toContain('<td>');
        });

        test('behält font-Tags mit face/size', () => {
            const dirty = '<font face="Arial" size="3">Text</font>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('<font');
            expect(clean).toContain('face="Arial"');
        });

        test('behält mark-Tags', () => {
            const dirty = '<mark>Highlighted</mark>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('<mark>');
        });

        test('behält sichere Links', () => {
            const dirty = '<a href="https://example.com">Link</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('<a');
            expect(clean).toContain('href="https://example.com"');
        });
    });

    // --------------------------------------------------------
    // ATTRIBUTE FILTERING
    // --------------------------------------------------------

    describe('Attribute Filtering', () => {
        test('entfernt src-Attribut von img', () => {
            const dirty = '<img src="http://evil.com/tracker.gif">';
            // img ist nicht in der Whitelist, wird zu Text
            expect(sanitizeHTML(dirty)).not.toContain('<img');
        });

        test('behält erlaubte style-Properties', () => {
            const dirty = '<span style="color: red; font-size: 14px;">Text</span>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('color');
            expect(clean).toContain('font-size');
        });

        test('entfernt gefährliche style-Properties', () => {
            const dirty = '<span style="color: red; expression(alert(1));">Text</span>';
            const clean = sanitizeHTML(dirty);
            expect(clean).not.toContain('expression');
        });

        test('behält class-Attribut', () => {
            const dirty = '<div class="read-aloud">Text</div>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('class="read-aloud"');
        });

        test('behält title-Attribut', () => {
            const dirty = '<span title="Tooltip">Text</span>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('title="Tooltip"');
        });

        test('behält colspan/rowspan für Tabellen', () => {
            // Vollständige Tabellenstruktur nötig, da DOMParser isolierte <td> nicht korrekt parst
            const dirty = '<table><tr><td colspan="2" rowspan="3">Cell</td></tr></table>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('colspan');
            expect(clean).toContain('rowspan');
        });

        test('validiert colspan/rowspan Werte', () => {
            const dirty = '<td colspan="999" rowspan="-1">Cell</td>';
            const clean = sanitizeHTML(dirty);
            // Ungültige Werte sollten entfernt werden
            expect(clean).not.toContain('colspan="999"');
            expect(clean).not.toContain('rowspan="-1"');
        });
    });

    // --------------------------------------------------------
    // LINK SECURITY
    // --------------------------------------------------------

    describe('Link Security', () => {
        test('erlaubt https:// Links', () => {
            const dirty = '<a href="https://example.com">Link</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('href="https://example.com"');
        });

        test('erlaubt http:// Links', () => {
            const dirty = '<a href="http://example.com">Link</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('href="http://example.com"');
        });

        test('erlaubt relative Links', () => {
            const dirty = '<a href="/page">Link</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('href="/page"');
        });

        test('erlaubt Anker-Links', () => {
            const dirty = '<a href="#section">Link</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('href="#section"');
        });

        test('blockiert file:// Protokoll', () => {
            const dirty = '<a href="file:///etc/passwd">Link</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).not.toContain('file://');
        });

        test('blockiert blob: Protokoll', () => {
            const dirty = '<a href="blob:http://evil.com/file">Link</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).not.toContain('blob:');
        });

        test('fügt rel="noopener noreferrer" hinzu', () => {
            const dirty = '<a href="https://example.com">Link</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('rel="noopener noreferrer"');
        });

        test('fügt target="_blank" hinzu', () => {
            const dirty = '<a href="https://example.com">Link</a>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('target="_blank"');
        });
    });

    // --------------------------------------------------------
    // EDGE CASES
    // --------------------------------------------------------

    describe('Edge Cases', () => {
        test('behandelt leere Strings', () => {
            expect(sanitizeHTML('')).toBe('');
        });

        test('behandelt null', () => {
            expect(sanitizeHTML(null)).toBe('');
        });

        test('behandelt undefined', () => {
            expect(sanitizeHTML(undefined)).toBe('');
        });

        test('behandelt reine Text-Eingaben', () => {
            const text = 'Dies ist reiner Text ohne HTML';
            expect(sanitizeHTML(text)).toBe(text);
        });

        test('behält legitime Sonderzeichen', () => {
            const text = 'Test mit Umlauten: äöüß und €';
            const clean = sanitizeHTML(`<p>${text}</p>`);
            expect(clean).toContain('äöüß');
            expect(clean).toContain('€');
        });

        test('behandelt sehr lange Eingaben', () => {
            const longText = '<p>' + 'A'.repeat(100000) + '</p>';
            const clean = sanitizeHTML(longText);
            expect(clean).toContain('<p>');
        });

        test('behandelt tief verschachtelte Tags', () => {
            const nested = '<div><div><div><div><p>Deep</p></div></div></div></div>';
            const clean = sanitizeHTML(nested);
            expect(clean).toContain('Deep');
        });

        test('behandelt gemischten gefährlichen und sicheren Content', () => {
            const dirty = '<p>Sicher</p><script>alert(1)</script><b>Auch sicher</b>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toContain('<p>Sicher</p>');
            expect(clean).toContain('<b>Auch sicher</b>');
            expect(clean).not.toContain('<script');
        });
    });
});

// ============================================================
// ESC FUNCTION - TIEFE TESTS
// ============================================================

describe('Security: esc() HTML Escaping', () => {
    test('escaped alle kritischen Zeichen', () => {
        expect(esc('<')).toBe('&lt;');
        expect(esc('>')).toBe('&gt;');
        expect(esc('&')).toBe('&amp;');
        expect(esc('"')).toBe('&quot;');
        expect(esc("'")).toBe('&#39;');
    });

    test('escaped XSS-Versuch', () => {
        const xss = '<script>alert("XSS")</script>';
        const escaped = esc(xss);
        expect(escaped).not.toContain('<script>');
        expect(escaped).toContain('&lt;script&gt;');
    });

    test('escaped HTML-Attribute-Injection', () => {
        const injection = '" onclick="alert(1)';
        const escaped = esc(injection);
        expect(escaped).toContain('&quot;');
    });

    test('ist idempotent (mehrfaches Escaping)', () => {
        const text = 'Test';
        expect(esc(text)).toBe(text);
        expect(esc(esc(text))).toBe(text);
    });
});

// ============================================================
// SEC-01/D-14: VEKTOR-KATALOG GEGEN DEN ECHTEN PRODUKTIONS-SANITIZER
// ============================================================
// Die Testblöcke oben laufen gegen utils/testable-utils.js (Test-Zwilling).
// Dieser Block lädt utils/basic.js — den ECHTEN Produktionsquelltext, den die
// Anwendung tatsächlich ausführt — per vm.runInContext (Präzedenz:
// tests/unit/storage-conflict.test.js). Ein Vorab-Test stellt sicher, dass die
// geladene Funktion tatsächlich definiert ist, damit ein späterer Ladefehler
// nicht stillschweigend als bestandener Test durchgeht (RESEARCH Pitfall 4).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Security: sanitizeHTML() gegen den ECHTEN Produktions-Sanitizer (utils/basic.js, vm.runInContext)', () => {
    let realSanitizeHTML;

    beforeAll(() => {
        const context = {
            window: { APP_CONFIG: global.APP_CONFIG },
            document: global.document,
            DOMParser: global.DOMParser,
            Node: global.Node,
            console
        };
        vm.createContext(context);
        const filePath = path.join(__dirname, '../../utils/basic.js');
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        vm.runInContext(sourceCode, context);
        realSanitizeHTML = context.sanitizeHTML;
    });

    test('Vorab-Test: sanitizeHTML wurde aus dem echten Produktionsquelltext geladen und ist definiert', () => {
        expect(realSanitizeHTML).toBeDefined();
        expect(typeof realSanitizeHTML).toBe('function');
    });

    // --------------------------------------------------------
    // PFLICHT-VEKTOREN (D-15, 10-CONTEXT.md)
    // --------------------------------------------------------
    describe('Pflicht-Vektoren (D-15)', () => {
        test('Review-Exploit: Bild mit Fehler-Ereignis-Attribut — Ereignis weg, img-Element weg (nicht in Whitelist)', () => {
            const dirty = '<img src="x" onerror="alert(1)">';
            const clean = realSanitizeHTML(dirty);
            expect(clean).not.toContain('onerror');
            expect(clean).not.toContain('<img');
        });

        test('Ereignis-Attribut ohne Anführungszeichen wird entfernt (zweite Vorbereinigungs-Regex)', () => {
            const dirty = '<div onclick=alert(1)>Klick</div>';
            const clean = realSanitizeHTML(dirty);
            expect(clean).not.toContain('onclick');
            expect(clean).toContain('Klick');
        });

        test('Skript-Element mit Inhalt wird vollständig entfernt', () => {
            const dirty = '<script>alert("XSS");document.cookie;</script>';
            const clean = realSanitizeHTML(dirty);
            expect(clean).not.toContain('<script');
            expect(clean).not.toContain('alert');
        });

        test('Skript-Element in gemischter Groß-/Kleinschreibung wird entfernt', () => {
            const dirty = '<ScRiPt>alert(1)</ScRiPt>';
            const clean = realSanitizeHTML(dirty);
            expect(clean.toLowerCase()).not.toContain('<script');
        });

        test('Adresse mit Skript-Protokoll in einem Verweis-Element: Adresse enthält Protokoll nicht mehr', () => {
            const dirty = '<a href="javascript:alert(1)">Link</a>';
            const clean = realSanitizeHTML(dirty);
            expect(clean).not.toContain('javascript:');
        });

        test('SVG-Element mit Lade-Ereignis-Attribut wird entfernt', () => {
            const dirty = '<svg onload="alert(1)"><circle r="10"></circle></svg>';
            const clean = realSanitizeHTML(dirty);
            expect(clean).not.toContain('<svg');
            expect(clean).not.toContain('onload');
        });

        test('Tabellen-Nutzlast (T-09-01-Stil): Tabelle/Zellen bleiben erhalten, Ereignis-Attribut nicht', () => {
            const dirty =
                '<table><tr><td><img src="x" onerror="alert(1)">Zelleninhalt</td></tr></table>';
            const clean = realSanitizeHTML(dirty);
            expect(clean).toContain('<table');
            expect(clean).toContain('<td');
            expect(clean).not.toContain('onerror');
            expect(clean).not.toContain('<img');
            expect(clean).toContain('Zelleninhalt');
        });
    });

    // --------------------------------------------------------
    // ERHALTUNGS-GEGENPROBE (D-15)
    // --------------------------------------------------------
    describe('Erhaltungs-Gegenprobe', () => {
        test('erlaubte Auszeichnung übersteht den Sanitizer unverändert, Textinhalt bleibt vollständig erhalten', () => {
            const dirty =
                '<b>Fett</b><i>Kursiv</i><ul><li>Listenpunkt</li></ul><table><tr><td>Zelle</td></tr></table><mark>Markiert</mark>';
            const clean = realSanitizeHTML(dirty);
            expect(clean).toContain('<b>Fett</b>');
            expect(clean).toContain('<i>Kursiv</i>');
            expect(clean).toContain('<ul>');
            expect(clean).toContain('<li>Listenpunkt</li>');
            expect(clean).toContain('<table');
            expect(clean).toContain('<td>Zelle</td>');
            expect(clean).toContain('<mark>Markiert</mark>');
        });
    });

    // --------------------------------------------------------
    // RANDFÄLLE FÜR LEERE EINGABEN
    // --------------------------------------------------------
    describe('Randfälle für leere Eingaben', () => {
        test('leere Zeichenkette liefert leere Zeichenkette statt eines Fehlers', () => {
            expect(() => realSanitizeHTML('')).not.toThrow();
            expect(realSanitizeHTML('')).toBe('');
        });

        test('null liefert leere Zeichenkette statt eines Fehlers', () => {
            expect(() => realSanitizeHTML(null)).not.toThrow();
            expect(realSanitizeHTML(null)).toBe('');
        });

        test('undefined liefert leere Zeichenkette statt eines Fehlers', () => {
            expect(() => realSanitizeHTML(undefined)).not.toThrow();
            expect(realSanitizeHTML(undefined)).toBe('');
        });
    });

    // --------------------------------------------------------
    // BEACON-REGRESSION (T-10-30, D-13, Plan 10-07): Stilwert mit fremder
    // Ressourcen-Referenz erzeugt keinen ausgehenden Beacon
    // --------------------------------------------------------
    // Marker-Text "LEAK" im Pfadbestandteil der Angreifer-Adresse: jede
    // Assertion prüft ausschließlich auf diesen Marker, nicht auf
    // Syntaxfragmente wie "url(" — die Kontrolle ist eine Erlaubnisliste
    // pro Deklaration (isSafeStyleValue/allowedStyleFunctions in
    // utils/basic.js), keine Zeichenketten-Suche über den Rohwert.
    // "background" ist die tatsächlich betroffene Eigenschaft: sie steht
    // (im Gegensatz zu "background-image") bereits vor diesem Plan auf der
    // Erlaubnisliste der Stil-Eigenschaften — die Lücke lag ausschließlich
    // darin, dass ihr WERT nie geprüft wurde.
    // Jeder Vektor als Tabellenzelle (<table><tr><td>) formuliert, nicht als
    // freistehendes <td>: der HTML5-Parser verwirft ein <td> außerhalb eines
    // Tabellenkontexts als eigenständiges Element (Foster-Parenting-Regel),
    // wodurch das Stil-Attribut nie beim Sanitizer ankäme — die Nutzlast
    // spiegelt damit den realen Einfügepfad (Tabellenzweig).
    const BEACON_ATTACK_VECTORS = [
        {
            name: 'Ressourcen-Referenz doppelt quotiert',
            html: '<table><tr><td style="background:url(&quot;https://evil.example/LEAK-DQ&quot;)">Zelle</td></tr></table>'
        },
        {
            name: 'Ressourcen-Referenz einfach quotiert',
            html: `<table><tr><td style="background:url('https://evil.example/LEAK-SQ')">Zelle</td></tr></table>`
        },
        {
            name: 'Ressourcen-Referenz unquotiert',
            html: '<table><tr><td style="background:url(https://evil.example/LEAK-UQ)">Zelle</td></tr></table>'
        },
        {
            name: 'Auswertungs-Funktion (expression)',
            html: `<table><tr><td style="width:expression(window.__leak='https://evil.example/LEAK-EXPR')">Zelle</td></tr></table>`
        },
        {
            name: 'At-Regel (@import)',
            html: `<table><tr><td style="background:@import url('https://evil.example/LEAK-IMPORT')">Zelle</td></tr></table>`
        },
        {
            name: 'Bildmengen-Funktion (image-set)',
            html: `<table><tr><td style="background:image-set(url('https://evil.example/LEAK-IMAGESET') 1x)">Zelle</td></tr></table>`
        },
        {
            name: 'Verschleierung per eingeschobenem CSS-Kommentar im Funktionsnamen',
            html: '<table><tr><td style="background:u/**/rl(https://evil.example/LEAK-COMMENT)">Zelle</td></tr></table>'
        },
        {
            name: 'Verschleierung per CSS-Escape-Sequenz im Funktionsnamen',
            html: '<table><tr><td style="background:\\75rl(https://evil.example/LEAK-ESCAPE)">Zelle</td></tr></table>'
        }
    ];

    const BEACON_PRESERVATION_VECTORS = [
        {
            name: 'Rahmen-Deklaration mit Custom-Property-Referenz (exakte Einfügepfad-Form)',
            html: '<table><tr><td style="border:1px solid var(--border)">Zelle</td></tr></table>',
            mustContain: 'var(--border)'
        },
        {
            name: 'Hintergrund-Deklaration mit Custom-Property-Referenz',
            html: '<table><tr><td style="background:var(--bg-elevated)">Zelle</td></tr></table>',
            mustContain: 'var(--bg-elevated)'
        },
        {
            name: 'Farb-Deklaration mit Farbfunktion',
            html: '<table><tr><td style="color:rgb(255, 0, 0)">Zelle</td></tr></table>',
            mustContain: 'rgb(255, 0, 0)'
        },
        {
            name: 'Farb-Deklaration mit Hex-Wert',
            html: '<table><tr><td style="color:#ff0000">Zelle</td></tr></table>',
            mustContain: '#ff0000'
        },
        {
            name: 'Deklaration ohne jede Funktion',
            html: '<table><tr><td style="text-align:center">Zelle</td></tr></table>',
            mustContain: 'text-align'
        }
    ];

    describe('Beacon-Regression (T-10-30, D-13): Stilwert mit fremder Ressourcen-Referenz erzeugt keinen ausgehenden Beacon', () => {
        test.each(BEACON_ATTACK_VECTORS)(
            '$name — Marker LEAK kommt in der Ausgabe nicht vor',
            ({ html }) => {
                const clean = realSanitizeHTML(html);
                expect(clean).not.toContain('LEAK');
            }
        );

        test.each(BEACON_PRESERVATION_VECTORS)('$name — bleibt erhalten', ({ html, mustContain }) => {
            const clean = realSanitizeHTML(html);
            expect(clean).toContain(mustContain);
        });

        test('Teil-Erhaltung: gutartige UND bösartige Deklaration im selben Stil-Attribut — nur die bösartige verschwindet', () => {
            const dirty =
                "<table><tr><td style=\"color:#ff0000;background:url('https://evil.example/LEAK-MIXED')\">Zelle</td></tr></table>";
            const clean = realSanitizeHTML(dirty);
            expect(clean).toContain('#ff0000');
            expect(clean).not.toContain('LEAK-MIXED');
        });
    });

    // --------------------------------------------------------
    // ERLAUBNISLISTEN-WAECHTER (Restrisiko d, T-10-36, Plan 10-07 Task 2)
    // --------------------------------------------------------
    // Struktur-Zaun gegen ein spaeteres, stilles Aufweichen der Tag- bzw.
    // Stil-Eigenschafts-Erlaubnisliste. Dieser Test ist die EINZIGE
    // unabhaengige Schicht: die Speichern-Grenze ruft denselben Sanitizer
    // auf und ist damit KEINE zweite Verteidigungslinie. Eine spaetere
    // Erweiterung der Erlaubnisliste fuer ein unverwandtes Feature wuerde
    // die Sicherheitsgarantie sonst still oeffnen, ohne dass irgendein
    // anderer Test es bemerkt. Der Test ist bewusst BEHAUPTEND, nicht
    // ableitend: er wiederholt die Liste als eigenes Testdatum (liest sie
    // nicht aus der Produktionsliste selbst — die ist function-scoped und
    // ohnehin nicht direkt erreichbar), damit eine Aenderung an der
    // Produktionsliste sichtbar rot wird statt sich selbst zu bestaetigen.
    describe('ERLAUBNISLISTEN-WAECHTER: Struktur-Zaun gegen spaeteres, stilles Aufweichen der Erlaubnislisten', () => {
        const MUST_BE_ALLOWED_TAGS = [
            'b', 'i', 'u', 's', 'strike', 'strong', 'em', 'ul', 'ol', 'li', 'p',
            'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table',
            'thead', 'tbody', 'tr', 'th', 'td', 'mark', 'a', 'font'
        ];
        const MUST_NOT_BE_ALLOWED_TAGS = [
            'img', 'script', 'iframe', 'object', 'embed', 'form', 'input',
            'style', 'link', 'meta', 'base', 'svg'
        ];
        const MUST_NOT_BE_ALLOWED_STYLE_PROPS = ['background-image', 'position', 'behavior'];

        // Tabellen-Kindelemente (thead/tbody/tr/th/td) verlangen einen
        // gueltigen Tabellenkontext — der HTML5-Parser verwirft ein
        // freistehendes <td> außerhalb von <table><tr> als eigenständiges
        // Element (Foster-Parenting-Regel) und sein Textinhalt landet als
        // Rohtext im body, unabhängig vom Sanitizer.
        function wrapInTableContextIfNeeded(tag) {
            if (tag === 'thead' || tag === 'tbody') {
                return `<table><${tag}><tr><td>Inhalt</td></tr></${tag}></table>`;
            }
            if (tag === 'tr') {
                return `<table><tr><td>Inhalt</td></tr></table>`;
            }
            if (tag === 'th' || tag === 'td') {
                return `<table><tr><${tag}>Inhalt</${tag}></tr></table>`;
            }
            return `<${tag}>Inhalt</${tag}>`;
        }

        test.each(MUST_BE_ALLOWED_TAGS)('Element "%s" MUSS erhalten bleiben', tag => {
            const clean = realSanitizeHTML(wrapInTableContextIfNeeded(tag));
            expect(clean.toLowerCase()).toContain(`<${tag}`);
        });

        test.each(MUST_NOT_BE_ALLOWED_TAGS)('Element "%s" DARF NICHT erhalten bleiben', tag => {
            const clean = realSanitizeHTML(`<${tag}>Inhalt</${tag}>`);
            expect(clean.toLowerCase()).not.toContain(`<${tag}`);
        });

        test.each(MUST_NOT_BE_ALLOWED_STYLE_PROPS)(
            'Stil-Eigenschaft "%s" DARF NICHT auf der Erlaubnisliste stehen (Deklaration wird verworfen)',
            prop => {
                const clean = realSanitizeHTML(`<div style="${prop}:test-value">Inhalt</div>`);
                expect(clean).not.toContain(prop);
            }
        );
    });
});
