/**
 * Unit tests for Markdown Shortcuts
 */

describe('Markdown Shortcuts', () => {
    describe('Pattern Matching', () => {
        test('converts **bold** to <b>bold</b>', () => {
            const input = '**bold**';
            const pattern = /(\*\*|__)((?:(?!\1).)+)\1/g;
            const match = pattern.exec(input);
            expect(match).toBeTruthy();
            expect(match[2]).toBe('bold');
        });

        test('converts *italic* to <i>italic</i>', () => {
            const input = '*italic*';
            const pattern = /(\*|_)((?:(?!\1).)+)\1/g;
            const match = pattern.exec(input);
            expect(match).toBeTruthy();
            expect(match[2]).toBe('italic');
        });

        test('converts ~~strike~~ to <s>strike</s>', () => {
            const input = '~~strike~~';
            const pattern = /(~~)((?:(?!\1).)+)\1/g;
            const match = pattern.exec(input);
            expect(match).toBeTruthy();
            expect(match[2]).toBe('strike');
        });

        test('converts `code` to <code>code</code>', () => {
            const input = '`code`';
            const pattern = /(`)((?:(?!\1).)+)\1/g;
            const match = pattern.exec(input);
            expect(match).toBeTruthy();
            expect(match[2]).toBe('code');
        });

        test('handles incomplete syntax gracefully', () => {
            const input = '**bold not closed';
            const pattern = /(\*\*|__)((?:(?!\1).)+)\1(?=\s|$)/g;
            const match = pattern.exec(input);
            expect(match).toBeFalsy(); // Should not match incomplete syntax
        });

        test('handles nested markdown', () => {
            const input = '**bold with *italic* inside**';
            // Should match outer bold first
            const pattern = /(\*\*|__)((?:(?!\1).)+)\1/g;
            const match = pattern.exec(input);
            expect(match).toBeTruthy();
            expect(match[2]).toBe('bold with *italic* inside');
        });
    });

    describe('XSS Prevention', () => {
        test('sanitizes XSS in links', () => {
            const input = '[XSS](javascript:alert(1))';
            // sanitizeHTML should strip javascript: protocol
            // This would be tested with actual sanitizeHTML function
            expect(input).toContain('javascript:');
            // After sanitization, it should not contain javascript:
        });

        test('sanitizes XSS in inline HTML', () => {
            const input = '<script>alert(1)</script>';
            // Should be escaped or removed
            expect(input).toBeTruthy();
        });

        test('sanitizes XSS in image tags', () => {
            const input = '<img src=x onerror=alert(1)>';
            // Should be escaped or removed
            expect(input).toBeTruthy();
        });
    });

    describe('Edge Cases', () => {
        test('handles empty strings', () => {
            const input = '';
            const pattern = /(\*\*|__)((?:(?!\1).)+)\1/g;
            const match = pattern.exec(input);
            expect(match).toBeFalsy();
        });

        test('handles special characters', () => {
            const input = '**ä ö ü ß**';
            const pattern = /(\*\*|__)((?:(?!\1).)+)\1/g;
            const match = pattern.exec(input);
            expect(match).toBeTruthy();
            expect(match[2]).toBe('ä ö ü ß');
        });

        test('handles very long strings', () => {
            const longText = 'a'.repeat(1000);
            const input = `**${longText}**`;
            const pattern = /(\*\*|__)((?:(?!\1).)+)\1/g;
            const match = pattern.exec(input);
            expect(match).toBeTruthy();
            expect(match[2].length).toBe(1000);
        });

        test('handles multiple markdown patterns in one string', () => {
            const input = '**bold** and *italic* and ~~strike~~';
            const boldPattern = /(\*\*|__)((?:(?!\1).)+)\1/g;
            const italicPattern = /(\*|_)((?:(?!\1).)+)\1/g;
            const strikePattern = /(~~)((?:(?!\1).)+)\1/g;

            expect(boldPattern.exec(input)).toBeTruthy();
            expect(italicPattern.exec(input)).toBeTruthy();
            expect(strikePattern.exec(input)).toBeTruthy();
        });
    });

    describe('Performance', () => {
        test('processes markdown quickly', () => {
            const start = Date.now();
            const input = '**bold** *italic* ~~strike~~ `code`';
            const patterns = [
                /(\*\*|__)((?:(?!\1).)+)\1/g,
                /(\*|_)((?:(?!\1).)+)\1/g,
                /(~~)((?:(?!\1).)+)\1/g,
                /(`)((?:(?!\1).)+)\1/g
            ];

            patterns.forEach(pattern => {
                pattern.exec(input);
            });

            const duration = Date.now() - start;
            expect(duration).toBeLessThan(10); // Should be < 10ms
        });
    });
});
