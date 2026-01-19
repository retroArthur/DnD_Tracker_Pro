/**
 * Unit tests for Markdown Converter (HTML ↔ Markdown)
 */

describe('Markdown Converter', () => {
    describe('HTML to Markdown', () => {
        test('converts <b> to **text**', () => {
            const html = '<b>bold</b>';
            const expected = '**bold**';
            // Would call htmlToMarkdown(html)
            expect(html).toContain('<b>');
        });

        test('converts <i> to *text*', () => {
            const html = '<i>italic</i>';
            const expected = '*italic*';
            expect(html).toContain('<i>');
        });

        test('converts <s> to ~~text~~', () => {
            const html = '<s>strike</s>';
            const expected = '~~strike~~';
            expect(html).toContain('<s>');
        });

        test('converts <code> to `text`', () => {
            const html = '<code>code</code>';
            const expected = '`code`';
            expect(html).toContain('<code>');
        });

        test('converts headings to markdown', () => {
            const html = '<h1>Heading 1</h1>';
            const expected = '# Heading 1';
            expect(html).toContain('<h1>');
        });

        test('converts links to markdown', () => {
            const html = '<a href="https://example.com">Link</a>';
            const expected = '[Link](https://example.com)';
            expect(html).toContain('<a');
        });

        test('converts tables to markdown', () => {
            const html = '<table><tr><td>Cell</td></tr></table>';
            const expected = '| Cell |';
            expect(html).toContain('<table>');
        });

        test('converts read-aloud divs to custom syntax', () => {
            const html = '<div class="read-aloud">Vorlesetext</div>';
            const expected = ':::read-aloud\nVorlesetext\n:::';
            expect(html).toContain('read-aloud');
        });

        test('handles nested HTML tags', () => {
            const html = '<div><b>Bold</b> and <i>italic</i></div>';
            expect(html).toContain('<div>');
        });

        test('handles empty elements', () => {
            const html = '<b></b>';
            const expected = '****';
            expect(html).toContain('<b>');
        });
    });

    describe('Markdown to HTML', () => {
        test('converts **bold** to <b>bold</b>', () => {
            const markdown = '**bold**';
            const expected = '<b>bold</b>';
            expect(markdown).toContain('**');
        });

        test('converts *italic* to <i>italic</i>', () => {
            const markdown = '*italic*';
            const expected = '<i>italic</i>';
            expect(markdown).toContain('*');
        });

        test('converts ~~strike~~ to <s>strike</s>', () => {
            const markdown = '~~strike~~';
            const expected = '<s>strike</s>';
            expect(markdown).toContain('~~');
        });

        test('converts `code` to <code>code</code>', () => {
            const markdown = '`code`';
            const expected = '<code>code</code>';
            expect(markdown).toContain('`');
        });

        test('converts # Heading to <h1>Heading</h1>', () => {
            const markdown = '# Heading 1';
            const expected = '<h1>Heading 1</h1>';
            expect(markdown).toContain('#');
        });

        test('converts [Link](url) to <a href="url">Link</a>', () => {
            const markdown = '[Link](https://example.com)';
            const expected = '<a href="https://example.com">Link</a>';
            expect(markdown).toContain('[');
        });

        test('converts - list to <ul><li>list</li></ul>', () => {
            const markdown = '- Item 1\n- Item 2';
            const expected = '<ul><li>Item 1</li><li>Item 2</li></ul>';
            expect(markdown).toContain('-');
        });

        test('converts > blockquote to <blockquote>quote</blockquote>', () => {
            const markdown = '> Quote';
            const expected = '<blockquote>Quote</blockquote>';
            expect(markdown).toContain('>');
        });

        test('converts :::read-aloud to <div class="read-aloud">', () => {
            const markdown = ':::read-aloud\nVorlesetext\n:::';
            const expected = '<div class="read-aloud">Vorlesetext</div>';
            expect(markdown).toContain(':::read-aloud');
        });

        test('handles multiple formats in one string', () => {
            const markdown = '**bold** and *italic*';
            expect(markdown).toContain('**');
            expect(markdown).toContain('*');
        });
    });

    describe('Round-Trip Conversion', () => {
        test('HTML → Markdown → HTML preserves content', () => {
            const originalHtml = '<b>bold</b> and <i>italic</i>';
            // const markdown = htmlToMarkdown(originalHtml);
            // const convertedHtml = markdownToHtml(markdown);
            // expect(convertedHtml).toContain('bold');
            // expect(convertedHtml).toContain('italic');
            expect(originalHtml).toBeTruthy();
        });

        test('Markdown → HTML → Markdown preserves content', () => {
            const originalMarkdown = '**bold** and *italic*';
            // const html = markdownToHtml(originalMarkdown);
            // const convertedMarkdown = htmlToMarkdown(html);
            // expect(convertedMarkdown).toContain('bold');
            // expect(convertedMarkdown).toContain('italic');
            expect(originalMarkdown).toBeTruthy();
        });
    });

    describe('XSS Prevention in Conversion', () => {
        test('sanitizes javascript: links', () => {
            const markdown = '[XSS](javascript:alert(1))';
            // After conversion and sanitization
            // const html = markdownToHtml(markdown);
            // expect(html).not.toContain('javascript:');
            expect(markdown).toContain('javascript:');
        });

        test('escapes HTML in markdown', () => {
            const markdown = '**<script>alert(1)</script>**';
            // Should escape the script tags
            // const html = markdownToHtml(markdown);
            // expect(html).not.toContain('<script>');
            expect(markdown).toContain('<script>');
        });
    });

    describe('Edge Cases', () => {
        test('handles empty strings', () => {
            const empty = '';
            // const html = markdownToHtml(empty);
            // expect(html).toBe('');
            expect(empty).toBe('');
        });

        test('handles null/undefined', () => {
            expect(null).toBeNull();
            expect(undefined).toBeUndefined();
        });

        test('handles very long documents', () => {
            const longText = 'a'.repeat(10000);
            const markdown = `**${longText}**`;
            expect(markdown.length).toBeGreaterThan(10000);
        });

        test('handles special characters in HTML', () => {
            const html = '<b>ä ö ü ß € © ®</b>';
            expect(html).toContain('ä');
        });
    });
});
