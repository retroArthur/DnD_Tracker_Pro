/**
 * Design-Konsistenz — Wellen 1 und 2 (F-01, F-02, F-07, F-09..F-11, F-13, F-14)
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


// ==================================================================
// Welle 2 — Kontrakte
// ==================================================================

/** Deklarationen eines Regelblocks, dessen Selektorliste `sel` enthaelt. */
function ruleBodiesFor(sel) {
    const bodies = [];
    const re = new RegExp(`(^|\\})([^{}]*\\.${sel}\\s*[,{][^{}]*)\\{([^{}]*)\\}`, 'g');
    for (const m of cssCode.matchAll(re)) bodies.push({ selectors: m[2], body: m[3] });
    return bodies;
}

describe('F-02 — eine Listenzeile, eine Karte', () => {
    const LIST_CLASSES = ['loc-item', 'npc-item', 'loot-item', 'enc-item', 'bestiary-list-item'];
    const CARD_CLASSES = ['wp-card', 'fr-card', 'tl-event-card'];

    test('alle fuenf Listenzeilen haengen an derselben Basisregel', () => {
        const base = ruleBodiesFor('list-item').find(r => r.body.includes('border-radius'));
        expect(base).toBeDefined();
        LIST_CLASSES.forEach(c => expect(base.selectors).toContain(`.${c}`));
    });

    test('keine eigene Flaechen-Deklaration mehr in den View-Dateien', () => {
        // Die Werte, die vorher fuenfmal ausgeschrieben standen. Taucht einer
        // davon wieder in einem eigenen Block auf, ist die Basis umgangen.
        LIST_CLASSES.forEach(c => {
            ruleBodiesFor(c).forEach(r => {
                if (r.selectors.includes('.list-item')) return; // die Basis selbst
                if (!new RegExp(`\\.${c}\\s*[,{]`).test(r.selectors)) return;
                expect(r.body).not.toMatch(/background:\s*var\(--bg-card\)/);
            });
        });
    });

    test('die drei Karten haengen an .card-surface', () => {
        const base = ruleBodiesFor('card-surface').find(r => r.body.includes('border-radius'));
        expect(base).toBeDefined();
        CARD_CLASSES.forEach(c => expect(base.selectors).toContain(`.${c}`));
    });
});

describe('F-11 — ein Master-Detail-Layout', () => {
    const LAYOUTS = [
        'loc-layout',
        'npc-layout',
        'loot-layout',
        'enc-layout',
        'bestiary-layout',
        'fr-layout'
    ];

    test('alle sechs Layouts haengen an derselben Basisregel', () => {
        const base = ruleBodiesFor('master-detail').find(r => r.body.includes('grid-template-columns'));
        expect(base).toBeDefined();
        LAYOUTS.forEach(c => expect(base.selectors).toContain(`.${c}`));
    });

    test('EINE Breakpoint-Kette: kein View setzt grid-template-columns allein', () => {
        // Vorher sechs verschiedene Ketten (825 -> 1fr @900 bis
        // 825 -> 600 @1400 -> 400 @1200 -> 1fr @900). Beim Verkleinern sprang
        // jeder Reiter woanders um.
        const solo = [];
        LAYOUTS.forEach(c => {
            ruleBodiesFor(c).forEach(r => {
                if (r.selectors.includes('.master-detail')) return;
                if (r.selectors.includes('[data-layout=')) return; // Mobil-Profil, gewollt
                if (/grid-template-columns/.test(r.body)) solo.push(`${r.selectors.trim()}`);
            });
        });
        expect(solo).toEqual([]);
    });

    test('die Detail-Panels teilen eine Basis, .enc-detail eingeschlossen', () => {
        const base = ruleBodiesFor('detail-panel').find(r => r.body.includes('position: sticky'));
        expect(base).toBeDefined();
        // .enc-detail fehlten vorher genau die vier Sticky-Deklarationen — sein
        // Detail scrollte mit der Liste weg.
        ['loc-detail', 'npc-detail', 'loot-detail', 'enc-detail', 'bestiary-detail'].forEach(c =>
            expect(base.selectors).toContain(`.${c}`)
        );
    });
});

describe('F-14 — eine Primaerfarbe fuer "Neu anlegen"', () => {
    test('.btn-primary ist eine echte Variante, nicht nur white-space', () => {
        // Vorher gab es KEINE Basisregel, nur zusammengesetzte Selektoren
        // (.section-toolbar-actions .btn-primary, .btn.btn-primary.migration-btn-next).
        // Buttons mit der Klasse sahen aus wie ein gewoehnlicher .btn.
        const base = cssCode.match(/\n\s*\.btn-primary\s*\{([^{}]*)\}/);
        expect(base).not.toBeNull();
        expect(base[1]).toMatch(/background:\s*var\(--gold\)/);
        expect(base[1]).toMatch(/color:\s*var\(--bg-dark\)/);
    });

    test('kein "+ Neu"-Knopf in einer Werkzeugleiste ist mehr gruen', () => {
        const offenders = [];
        tplFiles.forEach(f => {
            for (const m of f.content.matchAll(
                /<button[^>]*class="([^"]*btn-success[^"]*)"[^>]*>\s*\+\s*([^<]{0,30})/g
            )) {
                // Bestaetigende Aktionen in Dialogen duerfen gruen bleiben —
                // erkennbar daran, dass sie NICHT in einer section-toolbar stehen.
                const before = f.content.slice(0, m.index);
                const lastToolbar = before.lastIndexOf('section-toolbar-actions');
                const lastClose = before.lastIndexOf('</div>');
                if (lastToolbar > lastClose) offenders.push(`${f.name}: + ${m[2].trim()}`);
            }
        });
        expect(offenders).toEqual([]);
    });
});


/** Alle JS-Quelldateien des Projekts (ohne Werkzeuge und Tests). */
function sourceJs() {
    const out = [];
    const walk = dir => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) walk(full);
            else if (e.name.endsWith('.js')) out.push({ name: full, content: fs.readFileSync(full, 'utf8') });
        }
    };
    ['features', 'systems', 'ui', 'core', 'render', 'utils'].forEach(d => {
        const abs = path.join(REPO, d);
        if (fs.existsSync(abs)) walk(abs);
    });
    return out;
}

describe('F-10 — ein Zaehler-Schema', () => {
    // data-view-Werte der Navigation, die einen Listenzaehler tragen.
    const COUNTED_VIEWS = [
        'party', 'npcs', 'locations', 'quests', 'loot', 'spells', 'notes',
        'encounter', 'wiki', 'links', 'shops', 'bestiary',
        'sessionprep', 'kalender', 'fraktionen'
    ];

    test('jeder Zaehler heisst <view>-count', () => {
        const markup = tplFiles.map(f => f.content).join('\n');
        const ids = [...markup.matchAll(/class="section-toolbar-count"[^>]*id="([\w-]+)"/g)].map(m => m[1]);
        expect(ids.length).toBeGreaterThan(10);
        const falsch = ids.filter(id => !/^[a-z]+-count$/.test(id));
        expect(falsch).toEqual([]);
        // Der alte -io-count-Bestand ist restlos weg.
        expect(markup).not.toContain('-io-count');
    });

    test('jede gezaehlte Ansicht hat ihr Zaehler-Element', () => {
        const markup = tplFiles.map(f => f.content).join('\n');
        const fehlend = COUNTED_VIEWS.filter(v => !markup.includes(`id="${v}-count"`));
        expect(fehlend).toEqual([]);
    });

    test('setViewCount() ist die einzige Schreibstelle', () => {
        // Vorher schrieben ein Dutzend Stellen direkt per textContent.
        const offenders = [];
        sourceJs().forEach(f => {
            if (f.name.endsWith('helpers.js')) return; // die Definition selbst
            for (const m of f.content.matchAll(/['"]([a-z]+)-count['"]/g)) {
                if (COUNTED_VIEWS.includes(m[1])) {
                    offenders.push(`${path.basename(f.name)}: ${m[1]}-count`);
                }
            }
        });
        expect(offenders).toEqual([]);
    });
});

describe('F-09 — Suche und Import/Export im Welt-Modul', () => {
    const welt = () => tplFiles.find(f => f.name === 'view-welt.html').content;

    test('die drei Listen-Ansichten haben ein Suchfeld mit data-render', () => {
        const m = welt();
        [
            ['sessionprep-search', 'renderSessionPrepList'],
            ['kalender-search', 'renderTimeline'],
            ['fraktionen-search', 'renderFraktionen']
        ].forEach(([id, render]) => {
            expect(m).toContain(`id="${id}"`);
            expect(m).toMatch(new RegExp(`id="${id}"[^>]*data-render="${render}"`));
        });
    });

    test('die drei Listen-Ansichten haben Export UND Import', () => {
        const m = welt();
        ['sessionPreps', 'calendarEvents', 'factions'].forEach(type => {
            expect(m).toContain(`data-action="export-data" data-value="${type}"`);
            expect(m).toContain(`data-type="${type}"`);
        });
    });

    test('Reise bleibt bewusst ohne Zaehler, Suche und IO — mit Begruendung im Markup', () => {
        // Reise ist ein Rechner ohne gespeicherte Eintraege (Modul
        // reise-crud im Ordner features/reise). Ein Zaehler von nichts waere
        // schlechter als keiner. Faellt dieser Test, weil jemand Reise doch
        // eine Datenliste gegeben hat, gehoert der Kontrakt nachgezogen.
        //
        // Der Pfad steht hier BEWUSST nicht vollstaendig: das
        // Modul-Abdeckungs-Gate erkennt Abdeckung an der Zeichenkette des
        // Pfads in einer Testdatei. Ein blosser Erklaerkommentar wuerde das
        // Modul faelschlich als getestet ausweisen — erschlichene Abdeckung.
        const m = welt();
        const abschnitt = m.slice(m.indexOf('id="view-reise"'), m.indexOf('id="view-fraktionen"'));
        expect(abschnitt).not.toContain('section-toolbar-count');
        expect(abschnitt).not.toContain('toolbar-search');
        expect(abschnitt).toContain('Rechner, keine Liste');
    });

    test('jeder neue Import-Typ hat ein IO_SCHEMA und steht in der HTML-Feldliste', () => {
        const src = fs.readFileSync(path.join(REPO, 'systems/spellslots/import-export.js'), 'utf8');
        ['sessionPreps', 'factions', 'calendarEvents'].forEach(type => {
            expect(src).toMatch(new RegExp(`\\n    ${type}: \\{`));
        });
    });
});


describe('F-08 — Werkzeugleisten-Kontrakt', () => {
    // Vorher gab es DREI Kopfzeilen-Muster: volle Leiste (12 Ansichten),
    // Kurzfassung (4), gar keine (8). Beim Reiterwechsel verlor man den festen
    // Ankerpunkt links oben.
    const TOOL_VIEWS = [
        'dashboard',
        'initiative',
        'dice',
        'timers',
        'dmscreen',
        'soundboard',
        'dicestats',
        'data'
    ];

    function viewBody(id) {
        const markup = tplFiles.map(f => f.content).join('\n');
        const start = markup.indexOf(`<section id="view-${id}"`);
        expect(start).toBeGreaterThan(-1);
        const next = markup.indexOf('<section id="view-', start + 1);
        return markup.slice(start, next === -1 ? undefined : next);
    }

    test('JEDE Ansicht hat eine .section-toolbar mit Titel', () => {
        const markup = tplFiles.map(f => f.content).join('\n');
        const ids = [...markup.matchAll(/<section id="view-([\w-]+)"/g)].map(m => m[1]);
        expect(ids.length).toBeGreaterThan(20);
        const ohne = ids.filter(id => {
            const body = viewBody(id);
            return !body.includes('section-toolbar-title');
        });
        expect(ohne).toEqual([]);
    });

    test('die acht Werkzeug-Ansichten tragen die Standard-Leiste, keine eigene', () => {
        TOOL_VIEWS.forEach(id => {
            const body = viewBody(id);
            expect(body).toContain('class="section-toolbar"');
            expect(body).toContain('section-toolbar-identity');
        });
    });

    test('der DM Screen hat seine eigene Kopfzeile aufgegeben', () => {
        const markup = tplFiles.map(f => f.content).join('\n');
        expect(markup).not.toContain('dmscreen-header');
        expect(markup).not.toContain('dmscreen-title');
        // und die dazugehoerigen Regeln sind mit entfallen
        expect(cssCode).not.toContain('.dmscreen-header');
        expect(cssCode).not.toContain('.dmscreen-title');
    });

    test('die Schnellleiste des DM Screens steht UNTER der Kopfzeile', () => {
        const body = viewBody('dmscreen');
        expect(body.indexOf('section-toolbar')).toBeLessThan(body.indexOf('dms-quick-bar'));
    });
});
