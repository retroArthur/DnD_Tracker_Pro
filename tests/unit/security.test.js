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
