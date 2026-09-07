/**
 * Design-Konsistenz — Welle 1 (F-01, F-07, F-13)
 *
 * Warum diese Tests statt einer abgehakten Liste: alle drei Befunde sind
 * LAUTLOS. Ein `var(--surface)` ohne Definition liefert keine Fehlermeldung,
 * sondern eine transparente Flaeche; eine Section hinter `</main>` sieht im
 * Markup korrekt aus und verliert nur ihren Innenabstand; eine benutzte, aber
 * nicht definierte Button-Klasse faellt still auf die Basis-Optik zurueck.
 * Keiner der drei Fehler bricht einen bestehenden Test — genau deshalb waren
 * sie ueberhaupt so lange da.
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');

function readAll(globDir, ext) {
    const dir = path.join(REPO, globDir);
    return fs
        .readdirSync(dir)
        .filter(f => f.endsWith(ext))
        .map(f => ({ name: f, content: fs.readFileSync(path.join(dir, f), 'utf8') }));
}

const cssFiles = readAll('assets/styles', '.css');
const cssAll = cssFiles.map(f => f.content).join('\n');

/**
 * CSS ohne Kommentare. Notwendig, weil erklaerende Kommentare die Selektoren
 * nennen, um die es geht — ein blosses toContain() zaehlt den Erklaertext als
 * Verstoss.
 */
function withoutComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}
const cssCode = withoutComments(cssAll);
const tplFiles = readAll('assets/templates', '.html');

describe('F-01 — Custom Properties', () => {
    // Diese drei werden zur Laufzeit per element.style.setProperty gesetzt und
    // haben im CSS bewusst keine Definition.
    const RUNTIME_TOKENS = new Set(['--hp-pct', '--map-zoom', '--migration-hint-height']);

    test('kein var(--x) ohne Definition, Fallback oder Laufzeitquelle', () => {
        const defined = new Set(cssAll.match(/^\s*(--[\w-]+)\s*:/gm)?.map(m => m.trim().replace(/\s*:$/, '')) || []);
        const undefinedNames = new Set();
        for (const m of cssAll.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) {
            if (!defined.has(m[1]) && !RUNTIME_TOKENS.has(m[1])) undefinedNames.add(m[1]);
        }
        expect([...undefinedNames].sort()).toEqual([]);
    });

    test('Aliasblock steht NACH allen Theme-Bloecken, sonst greift die Vererbung nicht', () => {
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        const lastTheme = vars.lastIndexOf('[data-theme=');
        const alias = vars.indexOf('--surface: var(--bg-card)');
        expect(alias).toBeGreaterThan(-1);
        expect(alias).toBeGreaterThan(lastTheme);
    });

    test('rgba()-Kanaele sind in JEDEM Theme definiert, nicht nur im Dark-Block', () => {
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        for (const theme of ['dark', 'light', 'sepia', 'contrast']) {
            const re =
                theme === 'dark'
                    ? /:root,\s*\[data-theme="dark"\]\s*\{([\s\S]*?)\n\s*\}/
                    : new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{([\\s\\S]*?)\\n\\s*\\}`);
            const body = vars.match(re);
            expect(body).not.toBeNull();
            ['--gold-rgb', '--green-rgb', '--red-rgb'].forEach(t => {
                expect(body[1]).toContain(t);
            });
        }
    });

    test('F-01b: keine abweichenden Fallbacks mehr an den rgba()-Kanaelen', () => {
        // Vorher standen dort DREI verschiedene Goldtoene, einer davon
        // (180,140,60) nur als Fallback — sichtbar, solange das Token fehlte.
        const withFallback = cssAll.match(/var\(--(?:gold|green|red)-rgb\s*,[^)]*\)/g) || [];
        expect(withFallback).toEqual([]);
    });
});

describe('F-07 — alle Views im Container', () => {
    // build.py liest die Template-Reihenfolge aus loader.js (ARCH-01). Der Test
    // baut den Body genauso zusammen und prueft ihn, statt dist/ vorauszusetzen.
    function buildBody() {
        const loader = fs.readFileSync(path.join(REPO, 'loader.js'), 'utf8');
        const block = loader.match(/const TEMPLATES = \[([\s\S]*?)\];/);
        expect(block).not.toBeNull();
        const order = [...block[1].matchAll(/'([^']+\.html)'/g)].map(m => m[1]);
        expect(order.length).toBeGreaterThan(5);
        return order.map(rel => fs.readFileSync(path.join(REPO, rel), 'utf8')).join('\n');
    }

    test('keine <section class="view"> hinter </main>', () => {
        const body = buildBody();
        const close = body.indexOf('</main>');
        expect(close).toBeGreaterThan(-1);
        const late = [...body.matchAll(/<section id="(view-[\w-]+)"/g)]
            .filter(m => m.index > close)
            .map(m => m[1]);
        expect(late).toEqual([]);
    });

    test('die vier Welt-Views sind dabei und liegen im Container', () => {
        const body = buildBody();
        const close = body.indexOf('</main>');
        ['view-sessionprep', 'view-kalender', 'view-reise', 'view-fraktionen'].forEach(id => {
            const at = body.indexOf(`<section id="${id}"`);
            expect(at).toBeGreaterThan(-1);
            expect(at).toBeLessThan(close);
        });
    });

    test('F-07b: keine Kompensations-Paddings mehr an den Welt-Containern', () => {
        // Der Innenabstand kommt jetzt von .main-content. Blieben die Regeln
        // stehen, saesse er doppelt.
        ['wp', 'tl', 'rs', 'fr'].forEach(prefix => {
            expect(cssCode).not.toContain(`.${prefix}-view-content`);
        });
    });
});

describe('F-13 — Button-Varianten', () => {
    /** Klassen aus class="…"-Attributen UND aus JS-Klassenzeichenketten. */
    function usedButtonClasses() {
        const found = new Set();
        const harvest = text => {
            for (const m of text.matchAll(/class=["'`]([^"'`]*)["'`]/g)) {
                m[1].split(/\s+/).forEach(c => {
                    if (/^btn-[a-z][\w-]*$/.test(c)) found.add(c);
                });
            }
        };
        tplFiles.forEach(f => harvest(f.content));
        const walk = dir => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) walk(full);
                else if (e.name.endsWith('.js')) harvest(fs.readFileSync(full, 'utf8'));
            }
        };
        ['features', 'systems', 'ui', 'core'].forEach(d => walk(path.join(REPO, d)));
        return [...found].sort();
    }

    test('jede im Markup benutzte btn-*-Klasse hat eine CSS-Regel', () => {
        const used = usedButtonClasses();
        // Gegenprobe: die Erhebung hat ueberhaupt etwas gefunden.
        expect(used.length).toBeGreaterThan(4);
        const missing = used.filter(c => !new RegExp(`\\.${c}\\b`).test(cssCode));
        expect(missing).toEqual([]);
    });

    test('die fuenf nachgetragenen Varianten sind definiert', () => {
        ['btn-secondary', 'btn-warning', 'btn-icon', 'btn-xs', 'btn-text'].forEach(c => {
            expect(cssCode).toMatch(new RegExp(`\\.${c}\\s*[,{]`));
        });
    });

    test('Buttons haben einen sichtbaren Fokusring', () => {
        expect(cssCode).toMatch(/\.btn:focus-visible\s*\{[^}]*outline:/);
    });
});
