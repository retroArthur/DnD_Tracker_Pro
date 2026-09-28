/**
 * Design-Konsistenz — Wellen 1 bis 3
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
        //
        // DIE LETZTE ZUSICHERUNG IST AB 2026-09-28 ABSICHTLICH ROT, bis Welle 1
        // Schritt 6 core.css erreicht. NICHT auf var(--bg-dark) zurueckdrehen.
        //
        // Vorher verlangte sie hier wortwoertlich `color: var(--bg-dark)` und hat
        // damit genau den Fehler eingefroren, den sie finden sollte: in Light ist
        // --bg-dark HELL (#f5f5f5), die Primaeraktion war also hell auf hell.
        // Gemessen 2,98:1 in Light und 2,55:1 in Sepia — an dem Knopf, der in
        // jeder Ansicht oben rechts steht. Die Tinte auf einer gefuellten
        // Akzentflaeche gehoert nicht aus der Flaechenpalette, sondern aus
        // --on-<rolle>; hier --on-gold.
        //
        // Der Rotlauf ist die Reihenfolge, die Arbeitsregel 5 verlangt: die
        // Zusicherung wird VOR der Aenderung angepasst, nicht waehrend des
        // Rotlaufs entschaerft. Gruen macht sie Schritt 6, der core.css von
        // `color: var(--bg-dark)` auf `color: var(--on-gold)` umstellt (eine von
        // 86 gleichartigen Stellen). Die zweite Zusicherung dieses describe-Blocks
        // (kein gruener "+ Neu"-Knopf) ist von Welle 1 nicht betroffen.
        const base = cssCode.match(/\n\s*\.btn-primary\s*\{([^{}]*)\}/);
        expect(base).not.toBeNull();
        expect(base[1]).toMatch(/background:\s*var\(--gold\)/);
        expect(base[1]).toMatch(/color:\s*var\(--on-gold\)/);
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


// ==================================================================
// Welle 3 — Skalen
// ==================================================================

/**
 * Alle Deklarationen einer Eigenschaft im CSS (ohne variables.css, ohne
 * fonts.css). fonts.css bleibt aussen vor, weil dort ausschliesslich
 * @font-face-Bloecke stehen (inter-500, poppins-500 etc.) — eine spaetere
 * font-weight-Ratsche (D-42, zurueckgestellt bis TYPO-07 ausgefuehrt wird)
 * wuerde sonst @font-face-Deklarationen mitzaehlen. Vorarbeit, keine
 * Freigabe: die Ratsche selbst wird hier NICHT geschrieben.
 */
function declarationsOf(prop, { includeVariables = false } = {}) {
    const scope = includeVariables
        ? cssCode
        : withoutComments(
              cssFiles
                  .filter(f => f.name !== 'variables.css' && f.name !== 'fonts.css')
                  .map(f => f.content)
                  .join('\n')
          );
    return [...scope.matchAll(new RegExp(`${prop}\\s*:([^;{}]*)`, 'g'))].map(m => m[1].trim());
}

describe('F-05 — zwei Schrift-Quellen plus eine bewusste dritte', () => {
    test('jede font-family kommt aus einem Token oder ist inherit', () => {
        // fonts.css bleibt aussen vor: dort stehen die @font-face-Bloecke, die
        // die Familien ueberhaupt erst definieren.
        const scope = withoutComments(
            cssFiles
                .filter(f => f.name !== 'variables.css' && f.name !== 'fonts.css')
                .map(f => f.content)
                .join('\n')
        );
        const decls = [...scope.matchAll(/font-family\s*:([^;{}]*)/g)].map(m => m[1].trim());
        expect(decls.length).toBeGreaterThan(20);
        const fremd = decls.filter(d => !/^var\(--font-(ui|mono|serif)\)$|^inherit$/.test(d));
        expect(fremd).toEqual([]);
    });

    test('die drei Tokens sind definiert', () => {
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        ['--font-ui', '--font-mono', '--font-serif'].forEach(t => {
            expect(vars).toContain(`${t}:`);
        });
    });

    test('keine Komponente erzwingt mehr eine eigene UI-Schrift', () => {
        // .section-toolbar tat das und ueberschrieb damit in JEDER Leiste die
        // Vererbung. Nur body darf die UI-Schrift setzen.
        const scope = withoutComments(
            cssFiles
                .filter(f => f.name !== 'variables.css' && f.name !== 'fonts.css')
                .map(f => f.content)
                .join('\n')
        );
        const uiDecls = (scope.match(/font-family:\s*var\(--font-ui\)/g) || []).length;
        expect(uiDecls).toBe(1);
    });
});

describe('F-06 — drei Radien', () => {
    test('border-radius nur aus der Skala, 50%, 999px oder 0', () => {
        const decls = declarationsOf('border(?:-[a-z]+)?-radius');
        expect(decls.length).toBeGreaterThan(100);
        const fremd = [];
        decls.forEach(d => {
            d.split(/[\s/]+/)
                .filter(Boolean)
                .forEach(tok => {
                    if (
                        !/^var\(--radius-(sm|md|lg)\)$|^0$|^50%$|^999px$|^inherit$|^!important$/.test(
                            tok
                        )
                    ) {
                        fremd.push(tok);
                    }
                });
        });
        expect([...new Set(fremd)]).toEqual([]);
    });

    test('das alte --radius (10px) ist verschwunden, damit kein vierter danebensteht', () => {
        expect(cssCode).not.toMatch(/--radius:\s/);
        expect(cssCode).not.toContain('var(--radius)');
    });
});

describe('F-19 — Stapel-Leiter', () => {
    // Die Reihenfolge ist am gebauten Buendel nachgemessen worden:
    // 100 -> 300 -> 600 -> 1000 -> 2000 -> 3000 -> 4000.
    const TIERS = [
        '--z-sticky',
        '--z-dropdown',
        '--z-panel',
        '--z-modal',
        '--z-floating',
        '--z-tooltip',
        '--z-toast'
    ];

    test('die Stufen sind definiert und aufsteigend', () => {
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        const werte = TIERS.map(t => {
            const m = vars.match(new RegExp(`${t}:\\s*(\\d+)`));
            expect(m).not.toBeNull();
            return parseInt(m[1], 10);
        });
        expect(werte).toEqual([...werte].sort((a, b) => a - b));
        expect(new Set(werte).size).toBe(werte.length);
    });

    test('kein globaler z-index mehr als nackte Zahl', () => {
        // Ausgenommen sind die lokalen Ebenen der Kartenansicht und zwei
        // komponenteninterne Stapel: sie ordnen Elemente INNERHALB einer
        // Komponente und gehoeren nicht in die globale Leiter. Alles ueber 20
        // waere dagegen ein globaler Wert.
        const roh = [...cssCode.matchAll(/z-index:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
        const global = roh.filter(v => v > 20);
        expect(global).toEqual([]);
    });

    test('KERNBELEG: schwebende Editor-Werkzeuge liegen ueber Overlays', () => {
        // Der Editor liegt IN einem Overlay. Waere seine Blase nicht hoeher
        // eingestuft, verschwaende sie darunter — genau das passiert, wenn man
        // z-index-Werte nur nach Zahlengroesse zusammenschiebt.
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        const val = t => parseInt(vars.match(new RegExp(`${t}:\\s*(\\d+)`))[1], 10);
        expect(val('--z-floating')).toBeGreaterThan(val('--z-modal'));
        // Den REGELBLOCK lesen, nicht einen Zeichenabstand: ein Fenster von
        // n Zeichen faellt, sobald der Block waechst — der Beleg haette dann
        // nichts mit der Schichtung zu tun (passiert bei der Zusammenfuehrung
        // der Dubletten, F-18).
        const blockVon = sel => {
            const escaped = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`(?:^|\\}|\\*/)\\s*${escaped}\\s*\\{([^{}]*)\\}`, 'm');
            const m = cssCode.match(re);
            return m ? m[1] : null;
        };
        ['.floating-toolbar', '.editor-block-handle'].forEach(sel => {
            const body = blockVon(sel);
            expect(body).not.toBeNull();
            expect(body).toMatch(/z-index:\s*var\(--z-floating\)/);
        });
    });
});


describe('F-03 — eine Einheit', () => {
    test('keine rem-Werte mehr ausserhalb der Schriftdefinitionen', () => {
        // Das Welt-Modul rechnete in rem, der Rest der App in px — gleich
        // gemeinte Abstaende liefen beim Zoomen auseinander.
        const scope = withoutComments(
            cssFiles.filter(f => f.name !== 'fonts.css').map(f => f.content).join('\n')
        );
        const rems = scope.match(/\d*\.?\d+rem/g) || [];
        expect(rems).toEqual([]);
    });

    test('keine toten Fallbacks mehr an den Abstands-Tokens', () => {
        // var(--space-md, 1rem) behauptete 16px, waehrend das Token 12px ist.
        // Seit F-01 ist es definiert, der Fallback also unerreichbar — und
        // widerspraechlich.
        const mit = cssCode.match(/var\(--space-[a-z]+\s*,[^)]*\)/g) || [];
        expect(mit).toEqual([]);
    });
});

describe('F-12 — drei Breakpoint-Grenzen', () => {
    test('hoechstens vier verschiedene Grenzen in allen Media Queries', () => {
        const conds = cssCode.match(/@media[^{]*/g) || [];
        const grenzen = new Set();
        conds.forEach(c => {
            for (const m of c.matchAll(/(?:max|min)-width:\s*(\d+)px/g)) {
                // min-Grenzen sind die Partner der max-Grenzen (601/901/1201)
                grenzen.add(String(Math.round(parseInt(m[1], 10) / 100) * 100));
            }
        });
        expect(grenzen.size).toBeLessThanOrEqual(4);
        expect([...grenzen].sort()).toEqual(['1200', '600', '900']);
    });

    test('die Grenzen sind genau 600, 900 und 1200 (bzw. 601/901/1201)', () => {
        const conds = cssCode.match(/@media[^{]*/g) || [];
        const erlaubt = new Set(['600', '900', '1200', '601', '901', '1201']);
        const fremd = [];
        conds.forEach(c => {
            for (const m of c.matchAll(/(?:max|min)-width:\s*(\d+)px/g)) {
                if (!erlaubt.has(m[1])) fremd.push(m[1]);
            }
        });
        expect([...new Set(fremd)]).toEqual([]);
    });
});


describe('F-04 — keine Hex-Literale ausserhalb des Token-Blocks', () => {
    const komponentenCss = () =>
        withoutComments(
            cssFiles
                .filter(f => f.name !== 'variables.css' && f.name !== 'fonts.css')
                .map(f => f.content)
                .join('\n')
        );

    test('kein einziges Hex-Literal mehr im Komponenten-CSS', () => {
        // Ausgangswert: 240 Vorkommen in 100 verschiedenen Werten. Fuenf
        // verschiedene Gruens standen fuer dieselbe Aussage "Erfolg", vier
        // Grautoene fuer "gedaempft" — und Themes griffen an keiner davon.
        const treffer = komponentenCss().match(/#[0-9a-fA-F]{3,8}\b/g) || [];
        expect(treffer).toEqual([]);
    });

    test('die bedeutungstragenden Skalen sind Tokens, keine Zuordnung auf die Palette', () => {
        // Elf Schadensarten, sechs Attribute, zwanzig Warenkategorien und
        // fuenf Wissensgebiete brauchen Unterscheidbarkeit — dafuer hat die
        // Palette nicht genug Toene. Sie stehen als eigene Tokens in :root.
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        ['--dmg-fire', '--dmg-acid', '--dmg-poison', '--attr-str', '--attr-cha',
         '--cat-magic', '--know-arcana'].forEach(t => expect(vars).toContain(`${t}:`));
    });

    test('KERNBELEG: beide Schadensarten-Saetze zeigen auf dieselben Tokens', () => {
        // Vor F-04 fuehrte die App ZWEI Schadensarten-Farbsaetze, die in fuenf
        // von elf Typen abwichen — und bei acid/poison waren die Farben
        // zwischen Schnellreferenz und DM Screen VERTAUSCHT. Dieselbe
        // Schadensart hatte je nach Bildschirm eine andere Farbe.
        const css = komponentenCss();
        ['fire', 'cold', 'acid', 'poison', 'necrotic', 'radiant', 'force'].forEach(typ => {
            expect(css).toMatch(new RegExp(`\\.qref-dmg\\.${typ}[^}]*var\\(--dmg-${typ}\\)`));
            expect(css).toMatch(new RegExp(`\\.dms-dmg-item\\.${typ}[^}]*var\\(--dmg-${typ}\\)`));
        });
    });

    test('die Attributfarben stehen nur noch an EINER Stelle', () => {
        // Sie waren doppelt gefuehrt (.dms-attr-item und .dms-save-attr) — wer
        // STR umfaerbte, hatte danach zwei verschiedene Rots.
        const css = komponentenCss();
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(a => {
            expect(css).toMatch(new RegExp(`\\.dms-attr-item\\.${a}[^}]*var\\(--attr-${a}\\)`));
            expect(css).toMatch(new RegExp(`\\.dms-save-attr\\.${a}[^}]*var\\(--attr-${a}\\)`));
        });
    });

    test('die Vorlese-Papierpalette bleibt themenunabhaengig', () => {
        // Sie auf die UI-Palette zu mappen haette den Zweck zerstoert: der
        // Kasten soll wie Papier aussehen, egal welches Theme die App traegt.
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        ['parchment', 'crimson', 'violet', 'sage', 'sky', 'slate'].forEach(v => {
            ['from', 'to', 'rule', 'ink'].forEach(teil => {
                expect(vars).toContain(`--ra-${v}-${teil}:`);
            });
        });
        // und sie stehen NICHT als var(--purple) o.ae. da, sondern als eigene Werte
        expect(vars).toMatch(/--ra-violet-rule:\s*#/);
    });

    test('keine toten Farb-Fallbacks mehr an var()-Aufrufen', () => {
        const mit = komponentenCss().match(/var\(--[a-z-]+,\s*#[0-9a-fA-F]{3,8}\)/g) || [];
        expect(mit).toEqual([]);
    });
});


describe('F-15 / F-16 — Filter und Bestiar-Details', () => {
    const markup = () => tplFiles.map(f => f.content).join('\n');

    test('F-15a: kein Inline-Stil mehr am Bestiar-Titel', () => {
        // Die Klasse .section-toolbar-title setzt Gold und Gewicht bereits;
        // der Inline-Stil war eine Dublette mit abweichendem Gewicht (700
        // statt 600).
        expect(markup()).not.toMatch(/section-toolbar-title"\s+style=/);
    });

    test('F-15b: jedes Suchfeld traegt die Lupe im Platzhalter', () => {
        const ohne = [];
        for (const m of markup().matchAll(/class="toolbar-search"[^>]*placeholder="([^"]*)"/g)) {
            if (!m[1].includes('\u{1F50D}') && !m[1].includes('&#x1F50D;')) ohne.push(m[1]);
        }
        expect(ohne).toEqual([]);
    });

    test('F-16: kein view-eigener Filter-Stil mehr', () => {
        // Vorher vier Bedienungen mit vier Aussehen. Die view-eigenen Klassen
        // sind entfallen; geblieben sind .filter-chip (Kategorien),
        // .toolbar-select (viele Optionen) und .filter-toggle (Ja/Nein).
        ['bestiary-filter-label', 'bestiary-filter-select', 'bestiary-filter-chip',
         'filter-checkbox'].forEach(c => {
            expect(cssCode).not.toContain(`.${c}`);
            expect(markup()).not.toContain(`class="${c}"`);
        });
    });

    test('F-16: die drei geteilten Bausteine sind definiert', () => {
        ['toolbar-select', 'toolbar-filter-label', 'filter-toggle', 'filter-chip'].forEach(c => {
            expect(cssCode).toMatch(new RegExp(`\\.${c}\\s*[,{:]`));
        });
    });

    test('F-16: der boolesche Filter bleibt per Tastatur erreichbar', () => {
        // Der Bestiar-Bestand hatte display:none auf der Checkbox. Das nimmt
        // sie aus der Tab-Reihenfolge — am gebauten Buendel nachgemessen war
        // focus() wirkungslos, das aktive Element blieb BODY. Die Chip-Gestalt
        // traegt der Rahmen, nicht das Verstecken des Bedienelements.
        const regel = cssCode.match(/\.filter-toggle input\[type='checkbox'\]\s*\{([^}]*)\}/);
        expect(regel).not.toBeNull();
        expect(regel[1]).not.toMatch(/display:\s*none/);
    });

    test('F-16: keine :has(input:checked)-Einfaerbung am booleschen Filter', () => {
        // Sie sieht richtig aus und ist falsch: Chromium wertet :has() beim
        // UMSCHALTEN nicht neu aus, nur beim ersten Aufbau. Am gebauten
        // Buendel nachgemessen — der Quest-Filter "Aktive" startet angehakt;
        // nach dem Abwaehlen blieb der Chip golden und behauptete "an",
        // waehrend der Filter aus war. Den Zustand traegt das native
        // Kaestchen, das seit F-16 sichtbar ist.
        expect(cssCode).not.toMatch(/\.filter-toggle:has\(input:checked\)/);
    });

    test('F-16: JEDES Select in einer Werkzeugleiste traegt .toolbar-select', () => {
        // Drei Selects hatten gar keine Klasse und fielen auf den
        // Browser-Standard zurueck.
        const ohne = [];
        for (const m of markup().matchAll(/<select\s+([^>]*)>/g)) {
            const attrs = m[1];
            if (!/id="(?:party-class|shop-type|link|bestiary)-filter/.test(attrs)) continue;
            if (!attrs.includes('toolbar-select')) ohne.push(attrs.slice(0, 60));
        }
        expect(ohne).toEqual([]);
    });
});


describe('F-17 — drei Leerzustaende statt siebzehn', () => {
    // Die App braucht drei, nicht einen: eine LISTE ohne Eintraege will Symbol,
    // Titel, Text und eine Aktion; ein DETAIL-PANEL ohne Auswahl will Symbol
    // und eine Zeile; eine KACHEL will eine Zeile. Sie mit Gewalt in ein
    // Muster zu pressen haette der Liste ihre Aktion oder der Kachel ihre
    // Groesse genommen.
    const DETAIL = ['loc-detail-empty', 'npc-detail-empty', 'loot-detail-empty',
                    'enc-detail-empty', 'bestiary-detail-empty'];
    const HINT = ['bestiary-empty-results', 'cp-empty', 'dash-empty', 'dash-party-empty',
                  'calc-fav-empty', 'calc-results-empty', 'calc-list-empty',
                  'backup-browser-empty', 'condition-ref-empty', 'wp-empty-state',
                  'tl-empty-state', 'rs-empty-state', 'fr-empty-state', 'cart-empty',
                  'shop-items-empty', 'rt-preview-empty', 'char-empty', 'dms-widget-empty'];

    test('die drei Basisklassen sind definiert', () => {
        ['empty-state', 'detail-empty', 'empty-hint'].forEach(c => {
            expect(cssCode).toMatch(new RegExp(`\\.${c}\\s*[,{]`));
        });
    });

    test('alle fuenf Detail-Leerzustaende haengen an derselben Regel', () => {
        const treffer = ruleBodiesFor('detail-empty').find(r => r.body.includes('justify-content'));
        expect(treffer).toBeDefined();
        DETAIL.forEach(c => expect(treffer.selectors).toContain(`.${c}`));
    });

    test('alle Hinweis-Leerzustaende haengen an derselben Regel', () => {
        const treffer = ruleBodiesFor('empty-hint').find(r => r.body.includes('text-align'));
        expect(treffer).toBeDefined();
        HINT.forEach(c => expect(treffer.selectors).toContain(`.${c}`));
    });

    test('keine view-eigene Leerzustands-Regel mehr', () => {
        // Vorher: acht verschiedene Innenabstaende fuer dieselbe Sache, und
        // .fr-empty-state sogar zweimal definiert.
        // "Eigene Regel" heisst: die Klasse ist die EINZIGE des Blocks. Als
        // letzter Eintrag einer geteilten Selektorliste steht sie zu Recht da —
        // ein naiver Zeilentreffer haelt beides faelschlich fuer dasselbe.
        const eigene = [];
        [...DETAIL, ...HINT].forEach(c => {
            const re = new RegExp(`(?:^|\\}|\\*/)\\s*\\.${c}\\s*\\{`, 'g');
            const n = (cssCode.match(re) || []).length;
            if (n > 0) eigene.push(`${c} (${n}x)`);
        });
        expect(eigene).toEqual([]);
    });

    test('renderEmptyState() bleibt der Weg fuer Listen', () => {
        const helpers = fs.readFileSync(path.join(REPO, 'render/helpers.js'), 'utf8');
        expect(helpers).toContain('function renderEmptyState');
        expect(helpers).toContain('class="empty-state"');
    });
});


describe('F-18 — Dubletten und !important (Ratsche)', () => {
    /**
     * Zerlegt CSS in Regelbloecke MIT ihrem @-Kontext. Kommentare vor einem
     * Selektor werden abgeschnitten — ohne das wird aus "/* Mobile *\/ @media
     * (...)" ein vermeintlicher Selektor, dessen "Body" verschachtelte Regeln
     * sind.
     */
    function bloecke(css) {
        const out = [];
        let i = 0;
        const stack = [];
        while (i < css.length) {
            if (css.startsWith('/*', i)) {
                const j = css.indexOf('*/', i);
                i = j === -1 ? css.length : j + 2;
                continue;
            }
            if (css[i] === '}') {
                stack.pop();
                i++;
                continue;
            }
            const rest = css.slice(i);
            const m = /^[^{}]*\{/.exec(rest);
            if (!m) {
                i++;
                continue;
            }
            const kopf = m[0]
                .slice(0, -1)
                .replace(/\/\*[\s\S]*?\*\//g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (kopf.startsWith('@') || !kopf) {
                stack.push(kopf);
                i += m[0].length;
                continue;
            }
            let tiefe = 1;
            let j = i + m[0].length;
            while (j < css.length && tiefe) {
                if (css[j] === '{') tiefe++;
                else if (css[j] === '}') tiefe--;
                j++;
            }
            out.push({ ctx: stack.join(' | ') || '(top)', sel: kopf });
            i = j;
        }
        return out;
    }

    // Stand nach der Zusammenfuehrung, am 2026-09-07 erhoben. Diese Zahlen
    // duerfen nur SINKEN.
    //
    // Dubletten: 0. Alle 63 abweichenden sind zusammengefuehrt — der spaetere
    // Block bleibt (er gewann ohnehin jede widersprechende Eigenschaft), die
    // Eigenschaften, die nur der fruehere setzte, wandern hinein. Dass das
    // folgenlos ist, wurde nicht behauptet, sondern gemessen: 65 Selektoren mit
    // 423 berechneten Eigenschaftswerten vorher und nachher im Browser
    // verglichen, alle identisch.
    //
    // !important: 105 statt 132. Entfernt sind die 27, bei denen eine
    // Komponentenregel sich mit Gewalt gegen eine Basisklasse durchsetzte —
    // ebenfalls einzeln nachgemessen. Die verbliebenen 105 sind BEGRUENDET
    // und sollen bleiben:
    //   65  .spell-desc * (party.css) — schlaegt Inline-Stile, die der
    //       Rich-Text-Editor in gespeicherte Inhalte schreibt. Genau der Fall,
    //       fuer den !important gedacht ist.
    //   21  Vollbild-Positionierung des Encounter-Rechners in Media Queries
    //   12  .rich-editor strong/em/u/strike und die mobile Werkzeug-Blase
    //    3  die data-tb-Leiter der Editorleiste
    //    3  prefers-reduced-motion
    //    1  .shop-card.expanded .shop-body — schlaegt ein per JS gesetztes
    //       Inline-display
    const DUBLETTEN_MAX = 0;
    const IMPORTANT_MAX = 105;

    test('die Zahl echter Dubletten steigt nicht wieder', () => {
        const gruppen = new Map();
        cssFiles.forEach(f => {
            if (f.name === 'fonts.css') return;
            bloecke(f.content).forEach(({ ctx, sel }) => {
                if (/^(?:\d+%|from|to)$/.test(sel)) return;
                if (/:root|\[data-theme|\[data-layout/.test(sel)) return;
                const key = `${ctx}||${sel}`;
                gruppen.set(key, (gruppen.get(key) || 0) + 1);
            });
        });
        const dubletten = [...gruppen.values()].filter(n => n > 1).length;
        expect(dubletten).toBeLessThanOrEqual(DUBLETTEN_MAX);
    });

    test('die Zahl der !important steigt nicht wieder', () => {
        const n = (cssCode.match(/!important/g) || []).length;
        expect(n).toBeLessThanOrEqual(IMPORTANT_MAX);
    });

    test('Token-Bloecke bleiben getrennt — ihre Reihenfolge IST die Aussage', () => {
        // :root und die [data-theme]-Bloecke duerfen nie zusammengefuehrt
        // werden: der Aliasblock steht bewusst NACH den Themes, damit er per
        // Vererbung dem jeweils aktiven Theme folgt.
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        const rootBloecke = (vars.match(/^\s*:root[^{]*\{/gm) || []).length;
        expect(rootBloecke).toBeGreaterThan(1);
    });
});


describe('F-19 — Inline-Stile (Ratsche)', () => {
    // Stand nach der Umstellung, am 2026-09-07 erhoben. Diese Zahl darf nur
    // SINKEN. Sie ist bewusst nicht 0:
    //   25 x display:none  — 102 JS-Stellen schalten style.display; eine
    //                        Klasse daraus zu machen hiesse, jede anzufassen
    //   36 x Farbfeld      — die Marker-Swatches der Editorleiste zeigen ihre
    //                        eigene Farbe und stehen im eingefrorenen Testnetz
    //   Rest               — Einzelfaelle; ein Stil, der genau einmal vorkommt,
    //                        ist in einer Klasse nicht besser aufgehoben
    // Gesenkt am 2026-09-09 (Plan 15-07, Task 3): 257 -> 256. Die geloeschte
    // PWA-Install-Banner-Markup-Zeile (`style="display:none;"`) trug genau
    // EIN style="-Vorkommen; mit ihrer Loeschung (D-22) sinkt der neue
    // gemessene Ausgangswert um eins. Eine weitere Senkung um eins wird in
    // Phase 19 erwartet (D-51) — jede Senkung nennt ihren eigenen gemessenen
    // Ausgangswert.
    const INLINE_MAX = 256;

    test('die Zahl der Inline-Stile im Markup steigt nicht wieder', () => {
        const n = tplFiles.reduce(
            (sum, f) => sum + (f.content.match(/style="/g) || []).length,
            0
        );
        expect(n).toBeLessThanOrEqual(INLINE_MAX);
    });

    test('die benannten Klassen sind definiert', () => {
        ['u-pad-sm', 'u-m-0', 'u-mb-md', 'u-flex-1', 'form-hint', 'meta-text',
         'modal-sm', 'modal-md', 'modal-lg'].forEach(c => {
            expect(cssCode).toMatch(new RegExp(`\\.${c}\\s*[,{]`));
        });
    });
});


describe('F-20 — Bewegungsunterdrueckung (Ratsche)', () => {
    // Erhoben am 2026-09-09. Diese Zahl darf nur SINKEN. Zaehlart: Zahl der
    // Dateien unter assets/styles/, deren kommentarfreier Inhalt die At-Rule
    // fuer reduzierte Bewegung (`prefers-reduced-motion`) mindestens einmal
    // enthaelt — erhoben mit readAll()/withoutComments(), nicht mit einem
    // grep-Aequivalent. Nach der Zusammenfuehrung bleibt genau EIN globaler
    // Block, weil die drei Komponentenbloecke (command-palette.css,
    // migration.css, pwa.css) wirkungsseitig redundant zur globalen
    // *-Regel mit !important sind und der pwa-Block ueberdies schon vorher
    // inert war (Spezifitaet 0-1-0 gegen .pwa-update-banner[style*="flex"]
    // mit 0-2-0). Messblock: siehe Messblock 3 in
    // .planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md.
    const REDUCED_MOTION_BLOCKS_MAX = 1;

    const reducedMotionFiles = () =>
        cssFiles.filter(f => withoutComments(f.content).includes('prefers-reduced-motion'));

    test('die Zahl der Dateien mit einem prefers-reduced-motion-Block steigt nicht wieder', () => {
        expect(reducedMotionFiles().length).toBeLessThanOrEqual(REDUCED_MOTION_BLOCKS_MAX);
    });

    test('der verbliebene Block steht in core.css', () => {
        const names = reducedMotionFiles().map(f => f.name);
        expect(names).toEqual(['core.css']);
    });
});


describe('F-21 — DM-Screen-Widget-Klassen ohne Regel (Ratsche)', () => {
    // Erhoben am 2026-09-09, NACH dem Umbau von Gelaende/Fertigkeiten/
    // Wissensgebiete (Plan 15-04). Diese Zahl darf nur SINKEN. Zaehlart:
    // Klassennamen mit dem Widget-Praefix `dms-`, die in einem class-Attribut
    // des Quellbaums (JS-Renderer unter features/systems/ui/core/render/utils
    // via sourceJs(), sowie assets/templates via tplFiles) vorkommen, und fuer
    // die es im kommentarfreien CSS (assets/styles) keinen Selektor gibt.
    // Der Filter auf class-Attribute ist zwingend: ohne ihn liefert dieselbe
    // Suche 24 statt 7, weil data-action-Werte und Element-IDs mit demselben
    // Praefix mitgezaehlt wuerden.
    //
    // Restbestand, namentlich (7): dms-dc-mini, dms-econ-icon, dms-econ-val,
    // dms-economy-header, dms-ritual-item, dms-ritual-list, dms-save-desc.
    //
    // Abweichung von der urspruenglich erwarteten Deferred-Liste (9 statt 7):
    // dms-know-skill und dms-know-types sind NICHT mehr im Restbestand, weil
    // dieser Plan D-10 folgt (alle drei Referenzwidgets werden repariert,
    // nicht zwei) und das Wissensgebiete-Widget mit einschliesst.
    //
    // Messblock: siehe Messblock 4 in
    // .planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md.
    const WIDGET_PREFIX = 'dms-';
    const DMS_UNSTYLED_MAX = 7;

    function classAttrTokens() {
        const files = [...sourceJs(), ...tplFiles];
        const tokens = new Set();
        files.forEach(f => {
            for (const m of f.content.matchAll(/class=(["'])([\s\S]*?)\1/g)) {
                const value = m[2].replace(/\$\{[^}]*\}/g, ' ');
                for (const t of value.matchAll(new RegExp(`\\b${WIDGET_PREFIX}[\\w-]+`, 'g'))) {
                    tokens.add(t[0]);
                }
            }
        });
        return tokens;
    }

    function hasSelector(cls) {
        const re = new RegExp(`\\.${cls}(?![\\w-])`);
        return re.test(cssCode);
    }

    function unstyledDmsClasses() {
        return [...classAttrTokens()].filter(c => !hasSelector(c));
    }

    test('die Zahl regelfreier dms-Klassen aus class-Attributen steigt nicht wieder', () => {
        expect(unstyledDmsClasses().length).toBeLessThanOrEqual(DMS_UNSTYLED_MAX);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 1 — Vorlauf B: die zwei Farb-Ratschen
   ===========================================================================
   Beide Ratschen urteilen ueber den BERECHNETEN Farbwert, nicht ueber den
   Deklarationstext. Das ist der Unterschied zum uebrigen Netz dieser Datei:
   F-01 bis F-21 pruefen, DASS ein Token benutzt wird; R-01 und R-02 pruefen,
   WAS dabei herauskommt. Der Rechner dahinter ist
   tests/unit/helpers/wcag-contrast.js; er hat seinen eigenen Test
   (tests/unit/wcag-contrast-helper.test.js, 24 Faelle) und einen Selbsttest
   gegen die kanonischen Referenzwerte #777777/#fff = 4,48 und
   #767676/#fff = 4,54, der bei jedem require() laeuft.

   Er benutzt dieselbe Deklarations-Regex wie F-01 Test 1 (nur Zeilenanfang).
   Das ist Absicht: urteilten die beiden Tests ueber verschiedene Tokenmengen,
   waere die Differenz genau der Bereich, in dem ein Fehler unbemerkt bleibt.
   =========================================================================== */

const WCAG = require('./helpers/wcag-contrast.js');

/**
 * Die Tokens der :root-Schichten von variables.css — alles, was NICHT in einem
 * der vier Theme-Bloecke steht.
 *
 * WARUM DIESE SCHICHT UEBER DEM THEME-BLOCK LIEGT, und nicht darunter:
 * `:root` und `[data-theme="light"]` haben dieselbe Spezifitaet (0,1,0). Bei
 * Gleichstand entscheidet die Quellreihenfolge, und der Aliasblock steht
 * bewusst NACH allen vier Theme-Bloecken (F-01 Test 2 friert genau das ein).
 * Ein Token, das in BEIDEN steht, nimmt also den Aliaswert an — der
 * themenabhaengige Wert ist dann toter Buchstabe.
 *
 * Folge fuer Welle 1 Schritt 4: wer --attr-* und --coin-* in die Theme-Bloecke
 * schreibt, MUSS die Aliaszeile entfernen. Sonst sieht der Quelltext richtig
 * aus und die Farbe aendert sich nicht. R-02 meldet diesen Fall namentlich.
 */
function aliasSchicht() {
    let rest = cssFiles.find(f => f.name === 'variables.css').content;
    WCAG.THEMES.forEach(t => {
        rest = rest.replace(WCAG.blockRegexFor(t), '\n');
    });
    const out = {};
    // Letzter Treffer gewinnt — das ist die Kaskade.
    for (const m of rest.matchAll(WCAG.DECL_RE)) out[m[1]] = m[2].trim();
    return out;
}

describe('R-01 — Theme-Symmetrie (Ratsche)', () => {
    // DIESE RATSCHE IST BEI IHRER GEBURT GRUEN, und das ist kein Versehen.
    // Gemessen am 2026-09-28 (HEAD ca85d1b): alle vier Bloecke fuehren
    // identisch dieselben 21 Schluessel, die Differenzmenge ist in beiden
    // Richtungen leer. Es gab also KEINEN Rotlauf — wer einen sucht, sucht
    // umsonst.
    //
    // Ihre Aufgabe ist eine andere: gruen zu BLEIBEN, waehrend Welle 1
    // Schritt 4 je Block rund 31 Eintraege ergaenzt. Der Fehler, gegen den sie
    // steht, ist der wahrscheinlichste dieser ganzen Welle — ein Token in drei
    // von vier Bloecken. Im vierten Theme faellt es dann auf einen geerbten
    // oder fehlenden Wert zurueck, lautlos, und nur dort.
    test('die vier Theme-Bloecke fuehren genau dieselben Tokens', () => {
        const pals = WCAG.palettes();
        const mengen = {};
        WCAG.THEMES.forEach(t => {
            mengen[t] = new Set(Object.keys(pals[t]));
        });
        const abweichungen = [];
        WCAG.THEMES.forEach(a => {
            WCAG.THEMES.forEach(b => {
                if (a === b) return;
                [...mengen[a]]
                    .filter(k => !mengen[b].has(k))
                    .forEach(k => abweichungen.push(`${k}: in ${a}, fehlt in ${b}`));
            });
        });
        expect([...new Set(abweichungen)].sort()).toEqual([]);
    });
});

describe('R-02 — Tinte erreicht ihre Schwelle auf der TATSAECHLICHEN Flaeche (Ratsche)', () => {
    /* -----------------------------------------------------------------------
       VIER TEILFORMELN, und bei jeder ist die FLAECHENMENGE der eigentliche
       Inhalt. Eine Kontrastpruefung gegen zu wenige Flaechen ist schlimmer als
       keine: sie ist gruen und behauptet damit etwas Falsches.

       Entscheidung D-2 (2026-09-28): massgeblich ist das MINIMUM ueber alle
       tatsaechlichen Traegerflaechen, nicht --bg-card allein. --bg-hover ist
       dabei NICHT optional — fuenf Regeln setzen Akzenttext ausdruecklich
       darauf (core.css .header-action-btn:hover, .session-timer-btn:hover,
       .btn-icon:hover; dmscreen.css .export-dropdown-item:hover; npcs.css
       .loc-link:hover), und es ist in jedem Theme die schlechteste Flaeche.
       Gegen die drei Flaechen ohne --bg-hover waere diese Ratsche ueber
       16 von 18 zu schwachen Textwerten gruen.

       WAS DIESE RATSCHE BEWUSST NICHT PRUEFT — Entscheidung D-4 (2026-09-28):
       die 108 Stellen, an denen Akzenttext auf einer 20-%-TOENUNG DERSELBEN
       Rolle sitzt (Prototyp core.css:579-586: `.color-<rolle> { background:
       rgba(<Tripel>,0.2); color: var(--<rolle>) }`), plus die eine
       color-mix-Variante. Auf dieser Flaeche haelt heute kein einziger Wert
       4,5 (gemessen Light 2,82-3,50 · Sepia 3,01-4,23 · Dark red 3,29 ·
       Contrast blue 3,32). Sie bleiben in WELLE 1 unangetastet, weil Tinte und
       Toenungsstaerke rechnerisch nicht unabhaengig sind: eine hier gesetzte
       Tinte muesste in Welle 2 erneut geaendert werden. WELLE 2 erweitert
       R-02 um die Toenungsflaeche und entscheidet Staerke und Tinte in einem
       Zug — der Rechner kann das schon (resolveOver() loest color-mix und
       rgba-Alpha ueber einer gegebenen Flaeche auf). Bis dahin ist diese
       Luecke hier benannt und damit keine stille Freigabe.

       DASS DIESE RATSCHE JETZT ROT IST, ist der Zweck von Schritt 2: keines
       der geforderten Tokens existiert. Gruen wird sie mit Schritt 4
       (Tokendefinition), nicht vorher. Die Meldung nennt die fehlenden Tokens
       namentlich, damit sie als Arbeitsliste taugt.
       ----------------------------------------------------------------------- */

    /** Die zehn Akzentrollen. Die Tabelle des Handoffs fuehrt nur neun; die
     *  zehnte ist --gold-dim, und ihre Aufnahme ist BEGRUENDET ANDERS als dort
     *  behauptet — nachgemessen am 2026-09-28:
     *
     *  Die Planung sagt, `color: var(--gold-dim)` stehe 7x. Das ist ein
     *  Zaehlartefakt: alle sieben Treffer sind `border-color: var(--gold-dim)`
     *  (core.css:524/1906, dmscreen.css:909, encounters.css:911/965/1088/1306),
     *  die der ungeschuetzte grep als "color:" mitliest. Gegengeprueft mit
     *  `grep -rnE "(^|[^-a-zA-Z])color[[:space:]]*:[[:space:]]*var\(--gold-dim"
     *  assets/styles/*.css` -> KEIN Treffer. --gold-dim ist im ganzen
     *  Stylesheet-Baum nie eine Textfarbe.
     *
     *  Sie bleibt trotzdem in beiden Teilformeln, und zwar wegen Teilformel 1:
     *  --gold-dim ist eine gefuellte FLAECHE (core.css:524 .btn-gold:hover,
     *  spells.css:630 .editor-btn.format-active), also wird --on-gold-dim
     *  wirklich gebraucht. Waere die Rolle nur dort und nicht in Teilformel 2,
     *  haetten die beiden Formeln verschiedene Rollenmengen — genau die Art
     *  Asymmetrie, gegen die R-01 eine Zeile weiter oben steht. Der Preis ist
     *  ein heute ungenutztes --gold-dim-text je Theme; nachgerechnet
     *  erfuellbar (Dark #b29946 4,54 · Light #7c5d12 4,51 · Sepia #6b3410 7,19
     *  · Contrast #ccac00 5,70). Zum Vergleich: die ROLLE --gold-dim selbst
     *  wuerde als Text min4 3,78 (Dark) bzw. 3,74 (Light) erreichen. */
    const ROLLEN = [
        '--gold',
        '--gold-dim',
        '--green',
        '--red',
        '--cyan',
        '--yellow',
        '--orange',
        '--blue',
        '--purple',
        '--pink'
    ];

    const ATTRIBUTE = [
        '--attr-str',
        '--attr-dex',
        '--attr-con',
        '--attr-int',
        '--attr-wis',
        '--attr-cha'
    ];

    /** MUENZEN — Ausnahmeliste zu Teilformel 3, Entscheidung D-5 (2026-09-28).
     *  Sie werden NICHT als Textfarbe geprueft, weil sie keine mehr sind: die
     *  vier Metalle werden zur FLAECHE mit passender Tinte (--on-coin-*).
     *  Grund: das Abdunkeln auf 4,5:1 zerstoert ihren einzigen Zweck —
     *  --coin-gm #ffd700 braeuchte in Light 49 % Abdunklung auf #826e00, die
     *  Goldmuenze waere olivbraun; --coin-sm #c0c0c0 wuerde #6f6f6f. Geprueft
     *  wird stattdessen die Tinte AUF dem Metall, wie bei den Akzentrollen.
     *  Wer in Schritt 12 stattdessen die dokumentierte Ausnahme
     *  "Materialidentitaet" waehlt (D-5 nennt sie als Alternative), muss DIESE
     *  Liste anpassen — und nicht die Ratsche rot stehen lassen. */
    const MUENZEN = ['--coin-pm', '--coin-gm', '--coin-sm', '--coin-km'];

    const TEXT_FLAECHEN = ['--bg-card', '--bg-dark', '--bg-elevated', '--bg-hover'];
    /** Attributkuerzel liegen auf zwei Flaechen, nicht auf einer: .cf-coin-label
     *  und .dms-attr-item/.dms-save-item auf --bg-dark (party.css:1075), aber
     *  .attr-str..cha in dashboard.css:1278-1282 auf .qref-row mit --bg-card. */
    const ATTR_FLAECHEN = ['--bg-dark', '--bg-card'];
    /** Eingabefelder. Eigene Zaehlung am 2026-09-28, regelweise ueber das
     *  kommentarfreie CSS (Selektor enthaelt input|select|textarea UND die
     *  Regel setzt background/background-color auf ein var(--bg-*)):
     *  24x --bg-card, 18x --bg-dark, 6x --bg-elevated. Die Planung nennt
     *  20/14/5 — die Zaehlart dort ist nicht angegeben, und die Differenz
     *  aendert nichts: entscheidend ist die MENGE der drei Flaechen, nicht ihre
     *  Haeufigkeit. --bg-dark allein zu pruefen reicht nicht, denn gegen
     *  --bg-elevated faellt der vorgeschlagene Dark-Wert durch (D-8).
     *  Ein Rahmen grenzt ausserdem immer an zwei Farben, innen die Fuellung und
     *  aussen die Karte; WCAG 1.4.11 will fuer beide 3:1. */
    const RAHMEN_FLAECHEN = ['--bg-dark', '--bg-card', '--bg-elevated'];

    const TEXT_SCHWELLE = 4.5;
    const RAHMEN_SCHWELLE = 3;

    test('vier Teilformeln in allen vier Themes', () => {
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];
        const fehlt = new Map();
        const doppelt = new Map();

        const merke = (karte, token, theme) => {
            if (!karte.has(token)) karte.set(token, new Set());
            karte.get(token).add(theme);
        };

        WCAG.THEMES.forEach(theme => {
            // Effektive Palette: Aliasschicht UEBER dem Theme-Block (Kaskade).
            const p = { ...pals[theme], ...alias };
            Object.keys(alias).forEach(k => {
                if (k in pals[theme] && alias[k] !== pals[theme][k]) merke(doppelt, k, theme);
            });

            const wert = token => (token in p ? WCAG.resolve(p[token], p) : null);

            /** Teilformel 1 und der Muenz-Ersatz: Tinte AUF einer gefuellten
             *  Flaeche derselben Rolle. Heutiger Ausgangswert: dort steht
             *  `color: var(--bg-dark)` oder `color: white`. Eigene regelweise
             *  Zaehlung am 2026-09-28 (Regel setzt background auf ein volles
             *  var(--<rolle>) UND eine der beiden Tinten): 86x --bg-dark
             *  (gold 41 · green 19 · cyan 12 · orange 4 · red 4 · yellow 3 ·
             *  gold-dim 1 · purple 1 · pink 1) und 38x white (red 24 ·
             *  purple 11 · blue 2 · green 1; die Planung zaehlt hier 39, eine
             *  Regel faellt je nach Zaehlart heraus). Mit diesen zwei
             *  Systemtinten ist die schlechteste Zelle Light --yellow 2,94; der
             *  schlechteste TATSAECHLICH benutzte Fall ist weisse Schrift auf
             *  Dark --green = 1,74. */
            const aufFlaeche = (tinte, flaeche) => {
                const tw = wert(tinte);
                const fw = wert(flaeche);
                if (!tw) return merke(fehlt, tinte, theme);
                if (!fw) return merke(fehlt, flaeche, theme);
                const r = WCAG.ratio2(tw, fw);
                if (r < TEXT_SCHWELLE) {
                    befunde.push(
                        `(1) ${theme} ${tinte} ${tw} auf ${flaeche} ${fw}: ${r} < ${TEXT_SCHWELLE}`
                    );
                }
                return undefined;
            };
            // --gold -> --on-gold, --coin-gm -> --on-coin-gm (EIN fuehrender
            // Bindestrich wird durch das Praefix ersetzt, nicht verdoppelt).
            const tinteZu = rolle => `--on${rolle.slice(1)}`;
            ROLLEN.forEach(r => aufFlaeche(tinteZu(r), r));
            MUENZEN.forEach(m => aufFlaeche(tinteZu(m), m));

            /** Teilformel 2: Akzent als Textfarbe auf NEUTRALER Theme-Flaeche.
             *  Heutiger Ausgangswert (die Rolle steht dort unveraendert als
             *  Text): 24 der 40 Zellen unter 4,5, schlechteste Flaeche immer
             *  --bg-hover. Light alle zehn (2,16-4,20) · Sepia acht (2,30-3,36)
             *  · Contrast vier (3,16-4,03) · Dark zwei. Der schwerste Einzelfall
             *  ist Dark --red mit 3,36 — und das ist keine Randstelle: --red
             *  steht 68x als echte Textfarbe im Standardtheme (eigene Zaehlung
             *  am 2026-09-28, grep mit Praefixschutz gegen `-color:`; ohne
             *  diesen Schutz zaehlt derselbe Ausdruck 96, die Planung nennt
             *  69). */
            ROLLEN.forEach(rolle => {
                const token = `${rolle}-text`;
                const m = WCAG.minRatioOverSurfaces(token, TEXT_FLAECHEN, p);
                if (m.min === null) {
                    m.missing.forEach(x => merke(fehlt, x, theme));
                    return;
                }
                if (m.min < TEXT_SCHWELLE) {
                    befunde.push(
                        `(2) ${theme} ${token} ${wert(token)}: min4 ${m.min} < ${TEXT_SCHWELLE} ` +
                            `(schlechteste Flaeche ${m.worst})`
                    );
                }
            });

            /** Teilformel 3: Attributkuerzel als Textfarbe. Heutiger
             *  Ausgangswert: Dark --attr-wis 4,40 (verfehlt knapp, deshalb
             *  korrigiert D-5 auch Dark); Light alle sechs 1,97-4,43; Sepia
             *  alle sechs 1,71-3,68; Contrast alle sechs >= 4,72 (halten).
             *  NEBENBEFUND, hier notiert weil hier geurteilt wird:
             *  --attr-con hat in der Schnellreferenz gar keine Regel
             *  (dashboard.css:1278-1282 faerbt nur str/dex/int/wis/cha, KON
             *  erbt die Zeilenfarbe), und die sechs .dms-save-attr-Regeln sind
             *  zur Laufzeit tot (dmscreen-widgets-reference.js:56-76 setzt die
             *  Attributklasse nicht). Fuer diese sieben Stellen ist keine
             *  Sichtpruefung moeglich — die Ratsche urteilt trotzdem. Die
             *  Tokennamen sind ausserdem eingefroren: design-consistency.
             *  test.js:679-687 verlangt wortwoertlich `var(--attr-<a>)`, ein
             *  umbenanntes Token matcht das Regex nicht mehr. */
            ATTRIBUTE.forEach(token => {
                const m = WCAG.minRatioOverSurfaces(token, ATTR_FLAECHEN, p);
                if (m.min === null) {
                    m.missing.forEach(x => merke(fehlt, x, theme));
                    return;
                }
                if (m.min < TEXT_SCHWELLE) {
                    befunde.push(
                        `(3) ${theme} ${token} ${wert(token)}: min2 ${m.min} < ${TEXT_SCHWELLE} ` +
                            `(schlechteste Flaeche ${m.worst})`
                    );
                }
            });

            /** Teilformel 4: Eingaberahmen, Schwelle 3 (WCAG 1.4.11, kein
             *  Text). Heutiger Ausgangswert: --border-input existiert nicht,
             *  die Felder tragen --border — min3 Dark 1,35 · Light 1,31 ·
             *  Sepia 1,53 · Contrast 2,13, also in JEDEM Theme unter 3.
             *  Entscheidung D-8: Dark wird #7c7c7c und nicht #6b6b6b — der
             *  kleinere Wert ergibt gegen --bg-elevated nur 2,88, und dort
             *  sitzen 5 Eingabefelder. Das ANWENDEN auf die Felder ist
             *  Welle 6; Welle 1 definiert nur das Token. */
            const m4 = WCAG.minRatioOverSurfaces('--border-input', RAHMEN_FLAECHEN, p);
            if (m4.min === null) m4.missing.forEach(x => merke(fehlt, x, theme));
            else if (m4.min < RAHMEN_SCHWELLE) {
                befunde.push(
                    `(4) ${theme} --border-input ${wert('--border-input')}: ` +
                        `min3 ${m4.min} < ${RAHMEN_SCHWELLE} (schlechteste Flaeche ${m4.worst})`
                );
            }
        });

        const themenliste = karte =>
            [...karte.keys()]
                .sort()
                .map(t => `${t} (${WCAG.THEMES.filter(x => karte.get(t).has(x)).join('/')})`);

        themenliste(fehlt).forEach(z => befunde.push(`FEHLT: ${z}`));
        themenliste(doppelt).forEach(z =>
            befunde.push(
                `DOPPELT DEFINIERT, der Aliaswert gewinnt und der Theme-Wert ist tot: ${z}`
            )
        );

        expect(befunde.sort()).toEqual([]);
    });
});
