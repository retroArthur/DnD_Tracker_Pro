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

       WAS SCHRITT 9 (WELLE 1, 2026-09-28) DARAUS GEMACHT HAT — und was nicht.
       214 Deklarationen sind von `var(--<rolle>)` auf `var(--<rolle>-text)`
       gewechselt, AUSSCHLIESSLICH solche, deren Traegerflaeche nachweislich
       eine der vier neutralen ist. Der Nachweis ist gemessen, nicht
       geschlossen: fuer die 309 Stellen ohne neutrale Flaeche in der eigenen
       Regel wurde am gebauten Buendel der naechste DECKENDE Vorfahr bestimmt
       (alle halbdurchsichtigen Schichten zusammengesetzt), in Dark UND Light,
       und nur bei Uebereinstimmung beider Themes umgestellt. 126 Stellen
       blieben deshalb unveraendert — 45 mit einer nachweislich ANDEREN Flaeche
       (Dialogflaeche rgba(26,26,26,0.95), Verlaeufe, Akzentflaechen) und 81,
       deren Element in keinem erreichbaren Zustand gerendert wird. Sie stehen
       namentlich in .planning/HANDOFF-V3-OFFENE-PUNKTE.md unter W1-D-01.
       Warum nicht geraten wurde: die -text-Werte sind fuer HELLE Flaechen
       gerechnet und auf der Dialogflaeche messbar SCHLECHTER als die Rolle
       selbst (an party.css .cf-skill-exp-label gemessen: 3,23 -> 2,68 in
       Light). Eine falsch geratene Flaeche ist schlimmer als eine
       unveraenderte Stelle.

       Die Zahl der Toenungsstellen ist die Kontrollzahl dafuer, dass Schritt 9
       keine davon mitgenommen hat: die Kategorie `ROLE | rgba-Literal` stand
       vor und nach dem Schritt auf 111 (red 22 · gold 19 · green 16 ·
       orange 12 · cyan 10 · blue 10 · yellow 8 · purple 8 · pink 5 ·
       orange-dim 1). Die Planung nennt 108; woher die Differenz von drei
       kommt, ist NICHT geklaert und fuer Welle 1 auch nicht wichtig —
       massgeblich ist, dass die Zahl sich waehrend des Schritts nicht bewegt
       hat.

       WIE WEIT DIESE KONTROLLZAHL TRAEGT, praezisiert nach der Pruefung W1-D
       Runde 1: sie zaehlt REGELWEISE und verbindet `color` und `background`
       nur INNERHALB derselben Regel. Eine Toenung, die in der ELTERNregel
       steht — `loot.css .loot-tag-chip:has(input:checked) { background:
       rgba(212,175,55,0.2) }` ueber `.loot-tag-chip input:checked + span
       { color: … }` — ist fuer sie unsichtbar; die Zahl bewegt sich also
       auch dann nicht, wenn eine solche Stelle mitgenommen wird. Sie belegt
       "keine Toenungsstelle mit eigener Flaeche wurde angefasst", nicht
       "keine Toenungsstelle wurde angefasst". Die eine bekannte Stelle
       dieser Bauart ist als Vorziehung in W1-D-02 gefuehrt.

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
     *  --gold-dim ist eine gefuellte FLAECHE (core.css:524 .btn-gold:hover),
     *  also wird --on-gold-dim wirklich gebraucht. Die frueher hier als
     *  zweiter Beleg genannte Stelle `spells.css .editor-btn.format-active`
     *  ist entfallen: sie hat nie gemalt (editors.css:69 gewinnt mit (0,3,0)),
     *  und die Regel ist in der Nachbesserung zu Schritt 10 entfernt worden.
     *  core.css:524 allein traegt die Aussage.
     *  Waere die Rolle nur dort und nicht in Teilformel 2,
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
    /** Attributkuerzel liegen auf DREI Flaechen. Die frueher hier stehende
     *  Zweierliste war doppelt falsch, beides am 2026-09-28 nachgesehen:
     *
     *  (a) --bg-hover FEHLTE. `.attr-str`..`.attr-cha` sind direkte Kinder von
     *      `.qref-row` (modals-editors.html:370-376), und dashboard.css fuehrt
     *      BEIDE Zustaende: `.qref-row { background: var(--bg-card) }` (:1257)
     *      und `.qref-row:hover { background: var(--bg-hover) }` (:1267). Der
     *      Hover-Zustand ist beim Lesen einer Zeile nicht die Ausnahme, sondern
     *      der Normalfall. Ohne diese Flaeche war die Teilformel gruen, waehrend
     *      10 der 12 Light-/Sepia-Zellen dort unter 4,5 lagen (3,66-4,21) —
     *      genau die Auslassung, gegen die D-2 eine Teilformel weiter oben
     *      geschrieben ist.
     *  (b) `.cf-coin-label` gehoerte nie hierher: party.css:1494-1498 faerbt es
     *      mit --coin-pm/-gm/-sm/-km und --green, nie mit einem --attr-*. Die
     *      Traeger auf --bg-dark sind `.dms-attr-item` (dmscreen.css:1613) und
     *      `.dms-save-item` (dmscreen.css:1676).
     *
     *  --bg-elevated bleibt BEWUSST draussen, anders als bei den Rollen: kein
     *  Attributkuerzel erreicht diese Flaeche. Die tragenden Behaelter setzen
     *  ihren eigenen deckenden Hintergrund (--bg-card/--bg-hover bzw.
     *  --bg-dark), damit ist der Hintergrund ihrer Eltern gleichgueltig. Eine
     *  Flaeche mitzupruefen, die es nicht gibt, waere keine schaerfere Ratsche,
     *  sondern eine unbelegte. Die vierte denkbare Flaeche — die 20-%-Toenung
     *  derselben Rolle in `.dms-skill-header` (dmscreen.css:1728-1732) — ist
     *  durch D-4 ausdruecklich erst Welle 2. */
    const ATTR_FLAECHEN = ['--bg-dark', '--bg-card', '--bg-hover'];

    /** BENANNTE AUSNAHME zu Teilformel 3 — nur fuer --bg-hover, nur fuer die
     *  Zellen, die Entscheidung D-5 ausdruecklich eingefroren hat
     *  ("Dark/Contrast behalten ihre Werte, ausser --attr-wis").
     *
     *  Diese acht Zellen halten auf --bg-dark und --bg-card (4,52-5,95), aber
     *  nicht auf --bg-hover (#333 in beiden Themes). Sie ANZUHEBEN hiesse, eine
     *  Nutzerentscheidung zu ueberschreiben; sie STILL zu lassen hiesse, die
     *  Ratsche wieder etwas Falsches behaupten zu lassen. Also stehen sie hier
     *  namentlich mit ihrem gemessenen Wert, und der Eintrag ist selbst eine
     *  Ratsche: er meldet, wenn eine Zelle sich VERSCHLECHTERT, wenn sie auf
     *  einer der beiden anderen Flaechen faellt, und wenn sie die Schwelle
     *  inzwischen haelt und der Eintrag damit nur noch Altlast waere.
     *  Light/Sepia stehen NICHT hier: dort erlaubt D-5 das Abdunkeln
     *  ("nur so weit wie noetig"), und noetig ist es auf --bg-hover. */
    const ATTR_HOVER_AUSNAHME = {
        dark: { '--attr-str': 3.36, '--attr-int': 3.44, '--attr-wis': 3.28, '--attr-cha': 3.58 },
        contrast: { '--attr-str': 3.16, '--attr-int': 3.44, '--attr-wis': 3.28, '--attr-cha': 3.58 }
    };
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

            /** Teilformel 3: Attributkuerzel als Textfarbe. Ausgangswert VOR
             *  Welle 1, noch auf der alten Zweierbasis gemessen und deshalb hier
             *  als das gekennzeichnet, was er ist — ein historischer Stand:
             *  Dark --attr-wis 4,40 (verfehlt knapp, deshalb korrigiert D-5 auch
             *  Dark); Light alle sechs 1,97-4,43; Sepia alle sechs 1,71-3,68;
             *  Contrast alle sechs >= 4,72. Geurteilt wird jetzt ueber drei
             *  Flaechen (siehe ATTR_FLAECHEN); --bg-hover ist in jedem Theme die
             *  schlechteste.
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
                const eingetragen = (ATTR_HOVER_AUSNAHME[theme] || {})[token];
                if (eingetragen === undefined) {
                    if (m.min < TEXT_SCHWELLE) {
                        befunde.push(
                            `(3) ${theme} ${token} ${wert(token)}: min3 ${m.min} < ` +
                                `${TEXT_SCHWELLE} (schlechteste Flaeche ${m.worst})`
                        );
                    }
                    return;
                }
                // Eingetragene Ausnahme: sie deckt AUSSCHLIESSLICH --bg-hover,
                // und auch dort nur den eingetragenen Stand.
                const hover = m.values['--bg-hover'];
                const ohneHover = Math.min(
                    ...ATTR_FLAECHEN.filter(f => f !== '--bg-hover').map(f => m.values[f])
                );
                if (ohneHover < TEXT_SCHWELLE) {
                    befunde.push(
                        `(3) ${theme} ${token} ${wert(token)}: min2 ohne --bg-hover ` +
                            `${ohneHover} < ${TEXT_SCHWELLE} — die Ausnahme deckt nur --bg-hover`
                    );
                }
                if (hover < eingetragen) {
                    befunde.push(
                        `(3) ${theme} ${token} ${wert(token)}: auf --bg-hover ${hover}, ` +
                            `eingetragen war ${eingetragen} — die benannte Ausnahme ` +
                            `verschlechtert sich`
                    );
                }
                if (hover >= TEXT_SCHWELLE) {
                    befunde.push(
                        `(3) ${theme} ${token} ${wert(token)}: haelt auf --bg-hover jetzt ` +
                            `${hover} — Eintrag aus ATTR_HOVER_AUSNAHME entfernen`
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

    /** ZWEITE RATSCHE dieses Blocks. Sie urteilt nicht ueber Farbe, sondern
     *  ueber AKTENLAGE — und sie existiert, weil die Ausnahme eine Stufe
     *  weiter oben sonst genau das waere, was sie von sich weist: eine stille
     *  Freigabe.
     *
     *  Die Lage, nachgerechnet am 2026-09-28: ATTR_HOVER_AUSNAHME beruft sich
     *  auf Entscheidung D-5 ("Dark/Contrast behalten ihre Werte"). D-5 wurde
     *  aber auf der alten ZWEI-Flaechen-Messung getroffen; dort zeigen
     *  dieselben acht Zellen 4,52-5,95 und damit ueberhaupt kein Problem. Erst
     *  die dritte, wirklich erreichbare Flaeche --bg-hover (.qref-row:hover,
     *  dashboard.css:1267) bringt sie auf 3,16-3,58. Diese Zahlen lagen der
     *  Entscheidung nie vor. Eine Ausnahme, die sich auf eine Entscheidung
     *  beruft, die ihre eigene Tatsachengrundlage nicht kannte, darf nicht
     *  ausschliesslich im Kommentar einer Testdatei stehen — dort sieht sie
     *  niemand, der die Entscheidung revidieren koennte.
     *
     *  Die Ratsche geht rot, wenn das Dokument fehlt, wenn eine eingetragene
     *  Zelle dort nicht namentlich mit ihrem gemessenen Wert steht, wenn die
     *  beiden Stellen auseinanderlaufen, oder wenn dort eine Zeile zurueck-
     *  bleibt, deren Zelle es nicht mehr gibt. */
    const OFFENE_PUNKTE = '.planning/HANDOFF-V3-OFFENE-PUNKTE.md';

    test('jede Zelle aus ATTR_HOVER_AUSNAHME ist im offenen Punkt gefuehrt', () => {
        const datei = path.join(REPO, ...OFFENE_PUNKTE.split('/'));

        expect(
            fs.existsSync(datei)
                ? []
                : [
                      `${OFFENE_PUNKTE} fehlt — die eingefrorenen Zellen waeren nur im ` +
                          `Kommentar dieser Testdatei gefuehrt und damit fuer niemanden ` +
                          `sichtbar, der Entscheidung D-5 revidieren koennte`
                  ]
        ).toEqual([]);

        // Erwartete Tabellenzeile: | dark | --attr-str | #ef4444 | 3,36 | ...
        const zeile =
            /^\s*\|\s*(dark|contrast|light|sepia)\s*\|\s*(--attr-[a-z]{3})\s*\|[^|]*\|\s*(\d+,\d{2})\s*\|/gm;
        const gefuehrt = new Map();
        for (const m of fs.readFileSync(datei, 'utf8').matchAll(zeile)) {
            gefuehrt.set(`${m[1]} ${m[2]}`, Number(m[3].replace(',', '.')));
        }

        const befunde = [];
        Object.keys(ATTR_HOVER_AUSNAHME).forEach(theme => {
            Object.keys(ATTR_HOVER_AUSNAHME[theme]).forEach(token => {
                const schluessel = `${theme} ${token}`;
                const soll = ATTR_HOVER_AUSNAHME[theme][token];
                if (!gefuehrt.has(schluessel)) {
                    befunde.push(
                        `${schluessel} (auf --bg-hover ${soll}) steht in ` +
                            `ATTR_HOVER_AUSNAHME, aber in keiner Zeile von ${OFFENE_PUNKTE}`
                    );
                    return;
                }
                if (gefuehrt.get(schluessel) !== soll) {
                    befunde.push(
                        `${schluessel}: Ausnahmeliste sagt ${soll}, ${OFFENE_PUNKTE} sagt ` +
                            `${gefuehrt.get(schluessel)} — die beiden Stellen laufen auseinander`
                    );
                }
                gefuehrt.delete(schluessel);
            });
        });

        [...gefuehrt.keys()]
            .sort()
            .forEach(k =>
                befunde.push(
                    `${k} steht in ${OFFENE_PUNKTE}, aber nicht mehr in ATTR_HOVER_AUSNAHME — ` +
                        `die Zeile ist Altlast und gehoert entfernt`
                )
            );

        expect(befunde.sort()).toEqual([]);
    });
});

/* Gemeinsame Werkzeuge der beiden Stellen-Ratschen R-03 und R-04. */
/**
 * Zerlegt eine CSS-Datei regelweise, MIT Zeilennummer und Rumpf.
 * Verwandt mit bloecke() im F-18-Block, aber nicht dieselbe Funktion: dort
 * genuegt der Selektor, hier wird der Rumpf gebraucht. Kommentare werden
 * durch gleich lange Leerzeichen ersetzt statt entfernt, damit die
 * gemeldete Zeilennummer die der Datei bleibt — eine Ratsche, deren
 * Fundstelle man erst suchen muss, kostet mehr als sie einbringt.
 */
function regelnMitRumpf(css) {
    const maskiert = css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
    const out = [];
    let i = 0;
    while (i < maskiert.length) {
        if (maskiert[i] === '}') {
            i++;
            continue;
        }
        const m = /^[^{}]*\{/.exec(maskiert.slice(i));
        if (!m) {
            i++;
            continue;
        }
        const kopf = m[0].slice(0, -1).replace(/\s+/g, ' ').trim();
        if (kopf.startsWith('@') || !kopf) {
            i += m[0].length; // @media & Co.: hineinlaufen, nicht ueberspringen
            continue;
        }
        let tiefe = 1;
        let j = i + m[0].length;
        while (j < maskiert.length && tiefe) {
            if (maskiert[j] === '{') tiefe++;
            else if (maskiert[j] === '}') tiefe--;
            j++;
        }
        out.push({
            zeile: maskiert.slice(0, i + m[0].length).split('\n').length,
            sel: kopf,
            rumpf: maskiert.slice(i + m[0].length, j - 1)
        });
        i = j;
    }
    return out;
}

/** Erste Deklaration einer Eigenschaft im Rumpf. Der Praefixschutz
 *  `(^|[;{\s])` ist nicht Kosmetik: ohne ihn liest `border-color:` als
 *  `color:` mit und `background-image:` als `background:`. Genau dieses
 *  Zaehlartefakt hat in der Planung zu Handoff v3 sieben angebliche
 *  `color: var(--gold-dim)` erzeugt, die alle `border-color` waren. */
const deklaration = (rumpf, prop) => {
    const m = rumpf.match(new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;}]+)`));
    return m ? m[1].trim() : null;
};

/** Benannte Ausnahme von R-03, modulweit, weil die Aktenlage-Ratsche im
 *  R-04-Block beide Listen gemeinsam gegen den offenen Punkt prueft. */
const ZUSTAND_AUSNAHME = {
    'encounters.css .calc-action-btn.primary:hover': 4.31
};

/* ===========================================================================
   Design-Handoff v3, Welle 1 — R-03: die Tinte gilt je ZUSTAND, nicht je Regel
   ===========================================================================
   Diese Ratsche schliesst die Luecke, durch die Welle 1 einen Blocker und zwei
   major-Befunde erzeugt hat (Pruefung W1-C, Runde 1).

   DER FEHLER, GEGEN DEN SIE STEHT, hat eine sehr genaue Form. Eine Basisregel
   setzt Flaeche UND Tinte:

       .loc-add-btn        { background: var(--green); color: var(--on-green); }

   Die zugehoerige Zustandsregel wechselt NUR die Flaeche:

       .loc-add-btn:hover  { background: var(--green-dim); }

   Damit wandert eine Tinte, die fuer --green gerechnet wurde, auf --green-dim —
   eine ANDERE Farbe. Gemessen ist das kein Randfall: die Umstellung von
   `color: var(--bg-dark)` auf `color: var(--on-green)` liess dieselben vier
   Knoepfe in Light von 6,60 auf 2,63 und in Sepia von 5,58 auf 2,69 fallen,
   also um den Faktor 2,5 bzw. 2,1 — und zwar auf "+ NPC", "+ Ort", "+ Beute"
   und jedem globalen .btn-success.

   WARUM R-02 DAS NICHT SIEHT: R-02 urteilt ueber TOKENWERTE (haelt --on-gold
   auf --gold?), nicht ueber Verwendungsstellen. Die Tokenpaare waren waehrend
   der ganzen Regression einwandfrei. Beide Ratschen zusammen sind erst die
   Aussage "die Tinte stimmt" — einzeln behauptet jede nur die Haelfte davon.

   SIE IST BEI DER GEBURT ROT, mit sieben Zeilen, und das ist ihr Zweck.
   =========================================================================== */
describe('R-03 — geerbte Tinte auf gewechselter Flaeche (Ratsche)', () => {
    /** Die Zustaende, die eine Flaeche wechseln koennen. */
    const ZUSTAND = /(:hover|:focus-visible|:focus|:active|\.active|\.selected)\b/;

    /** BENANNTE AUSNAHMEN — dieselbe Bauart wie ATTR_HOVER_AUSNAHME eine
     *  Ratsche weiter oben: der eingetragene Wert ist der GEMESSENE Stand, und
     *  der Eintrag meldet sowohl eine Verschlechterung als auch den Fall, dass
     *  er nur noch Altlast ist.
     *
     *  .calc-action-btn.primary:hover ist KEIN Schaden dieser Welle, und das
     *  ist nachgemessen und nicht behauptet: die Flaeche --green-hover trug
     *  vorher var(--bg-dark) und erreichte dark/light/sepia/contrast
     *  8,06 · 4,02 · 3,41 · 10,93 (min 3,41), jetzt mit var(--on-green)
     *  7,83 · 4,31 · 4,40 · 9,82 (min 4,31). Jedes Theme, das unter der
     *  Schwelle liegt, liegt HOEHER als vorher; die Welle hat die Stelle
     *  verbessert, nur nicht bis 4,5. Sie hier anzuheben hiesse, eine Farbe
     *  ausserhalb des Auftrags zu aendern (ein --on-green-hover mit #000000
     *  erreichte min 4,79) — das gehoert entschieden, nicht nebenbei getan.
     *  Gefuehrt in .planning/HANDOFF-V3-OFFENE-PUNKTE.md, W1-C-01; die
     *  Aktenlage-Ratsche dazu steht im R-04-Block, weil sie beide Listen
     *  gemeinsam prueft. */

    const SCHWELLE = 4.5;

    /** Alle Regeln aller Komponentendateien in Kaskadenreihenfolge.
     *  variables.css und fonts.css tragen keine Komponentenregeln. */
    function komponentenRegeln() {
        const alle = [];
        cssFiles.forEach(f => {
            if (f.name === 'variables.css' || f.name === 'fonts.css') return;
            regelnMitRumpf(f.content).forEach(r => alle.push({ ...r, datei: f.name }));
        });
        return alle;
    }

    const teile = sel => sel.split(',').map(s => s.trim());

    /** Zustandsregel -> geerbte Tinte. Liefert die Paare, ueber die geurteilt
     *  wird; von beiden Tests benutzt, damit Urteil und Gegenprobe dieselbe
     *  Menge sehen. */
    function zustandsPaare(alle) {
        const paare = [];
        const gesehen = new Set();
        alle.forEach(regel => {
            const flaeche = deklaration(regel.rumpf, 'background(?:-color)?');
            if (!flaeche || !/^var\(--[\w-]+\)$/.test(flaeche)) return;
            if (deklaration(regel.rumpf, 'color')) return; // setzt eigene Tinte
            teile(regel.sel).forEach(s => {
                if (!ZUSTAND.test(s)) return;
                const stamm = s.replace(ZUSTAND, '').trim();
                if (!stamm) return;
                // Die ZULETZT deklarierte Tinte des Stamms. "Zuletzt" ist die
                // Kaskade: bei gleicher Spezifitaet gewinnt die spaetere Regel.
                let basis = null;
                alle.forEach(b => {
                    const tinte = deklaration(b.rumpf, 'color');
                    if (!tinte || !/^var\(--on-[\w-]+\)$/.test(tinte)) return;
                    if (teile(b.sel).includes(stamm)) basis = { ...b, tinte };
                });
                if (!basis) return;
                const schluessel = `${regel.datei} ${s}`;
                if (gesehen.has(schluessel)) return;
                gesehen.add(schluessel);
                paare.push({ schluessel, regel, sel: s, flaeche, basis });
            });
        });
        return paare;
    }

    test('jede Zustandsregel haelt 4,5 mit der Tinte, die sie tatsaechlich erbt', () => {
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const paletten = {};
        WCAG.THEMES.forEach(t => {
            paletten[t] = { ...pals[t], ...alias };
        });

        const befunde = [];
        zustandsPaare(komponentenRegeln()).forEach(({ schluessel, regel, sel, flaeche, basis }) => {
            const werte = {};
            let fehlt = null;
            WCAG.THEMES.forEach(theme => {
                const p = paletten[theme];
                const tinte = WCAG.resolve(basis.tinte, p);
                const grund = WCAG.resolve(flaeche, p);
                if (!tinte || !grund) {
                    fehlt = fehlt || `${theme}: ${!tinte ? basis.tinte : flaeche}`;
                    return;
                }
                werte[theme] = WCAG.ratio2(tinte, grund);
            });
            if (fehlt) {
                befunde.push(
                    `${schluessel}:${regel.zeile} — nicht aufloesbar (${fehlt}). Eine Flaeche, ` +
                        `die der Rechner nicht kennt, darf nicht als gruen gelten`
                );
                return;
            }

            const min = Math.min(...WCAG.THEMES.map(t => werte[t]));
            const zahlen = WCAG.THEMES.map(t => `${t} ${werte[t]}`).join(' · ');
            const eingetragen = ZUSTAND_AUSNAHME[schluessel];

            if (eingetragen === undefined) {
                if (min < SCHWELLE) {
                    befunde.push(
                        `${schluessel}:${regel.zeile} erbt ${basis.tinte} von "${basis.sel}" ` +
                            `(${basis.datei}:${basis.zeile}) und traegt sie auf ${flaeche}: ` +
                            `min ${min} < ${SCHWELLE} (${zahlen})`
                    );
                }
                return;
            }
            if (min < eingetragen) {
                befunde.push(
                    `${schluessel}: eingetragen war min ${eingetragen}, gemessen ${min} ` +
                        `(${zahlen}) — die benannte Ausnahme verschlechtert sich`
                );
            }
            if (min >= SCHWELLE) {
                befunde.push(
                    `${schluessel}: haelt jetzt min ${min} — Eintrag aus ZUSTAND_AUSNAHME ` +
                        `und aus HANDOFF-V3-OFFENE-PUNKTE.md entfernen`
                );
            }
        });

        expect(befunde.sort()).toEqual([]);
    });

    /** Gegenprobe, dass der Scanner ueberhaupt etwas sieht. Ohne sie waere ein
     *  Selektor-Regex, der nichts mehr trifft, von einer bestandenen Pruefung
     *  nicht zu unterscheiden — die Ratsche waere gruen und leer.
     *
     *  Sie prueft den MECHANISMUS an einem festen Beispiel und nicht an
     *  Selektoren aus dem Baum. Das ist Absicht: jede Stelle, die man hier
     *  namentlich verlangte, verschwindet genau dann aus der Paarmenge, wenn
     *  sie repariert wird (sie setzt dann eine eigene Tinte) — die Gegenprobe
     *  wuerde also ausgerechnet durch das Beheben eines Befundes rot. Der
     *  feste Fall bleibt gueltig, solange der Scanner funktioniert. */
    test('der Scanner erkennt Zustandspaare und laesst eigene Tinte in Ruhe', () => {
        const probe = [
            '.a { background: var(--green); color: var(--on-green); }',
            '.a:hover { background: var(--green-dim); }', // Paar: erbt die Tinte
            '.b { background: var(--gold); color: var(--on-gold); }',
            '.b:hover { background: var(--gold-dim); color: var(--on-gold-dim); }', // eigene Tinte
            '.c:hover { background: var(--red); }', // keine Basis mit --on-*
            '.d { background: var(--blue); color: var(--bg-dark); }',
            '.d:hover { background: var(--cyan); }', // Basis ohne --on-*-Tinte
            '@media (max-width: 600px) { .e { background: var(--pink);',
            '    color: var(--on-pink); } .e:hover { background: var(--red-dim); } }'
        ].join('\n');
        const regeln = regelnMitRumpf(probe).map(r => ({ ...r, datei: 'probe.css' }));
        const gefunden = zustandsPaare(regeln).map(p => `${p.sel} -> ${p.flaeche}`);
        expect(gefunden.sort()).toEqual([
            '.a:hover -> var(--green-dim)',
            '.e:hover -> var(--red-dim)' // auch in einer Media Query
        ]);

        // Und der Baum selbst ist nicht leer. Am 2026-09-28 waren es 16 Paare
        // vor den Korrekturen dieser Runde, 12 danach. Die Zahl darf wachsen
        // (neue Knoepfe) und schrumpfen (eigene Tinte gesetzt).
        expect(zustandsPaare(komponentenRegeln()).length).toBeGreaterThanOrEqual(5);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 1 — R-04: die Ruheflaechen, Stelle fuer Stelle
   ===========================================================================
   Befund der Pruefung W1-C, Runde 1: von den 143 Deklarationen, die Welle 1
   auf `color: var(--on-<rolle>)` umgestellt hat, war GENAU EINE von einer
   Ratsche gedeckt (.btn-primary, F-14 Test 1). Per Mutation belegt: drei echte
   Stellen zurueckgedreht — core.css .nav-tab.active, core.css .btn-gold,
   welt.css .fr-ruf-btn-plus, letzteres der als schwerster ausgewiesene Fall
   mit 1,74 in Dark — und die ganze Datei blieb gruen. "Abgenommen" war fuer
   142 Stellen eine Momentaufnahme, kein Zustand.

   R-04 ist die fehlende Aussage. Sie ergaenzt die beiden anderen so:
     R-02  Tokenwerte      — haelt --on-gold auf --gold?
     R-03  Zustandsregeln  — erbt eine :hover-Regel eine fremde Tinte?
     R-04  Ruheregeln      — haelt JEDE Regel, die Flaeche UND Tinte selbst
                             setzt, auf ihrer eigenen Flaeche 4,5?
   Erst zusammen sagen sie "die Tinte stimmt".

   SIE IST BEI DER GEBURT GRUEN, und das ist kein Versehen — R-01 ist
   ausdruecklich ebenso angelegt. Ihre Aufgabe ist, gruen zu BLEIBEN: 146 der
   156 geurteilten Regeln halten, die zehn uebrigen stehen namentlich mit
   ihrem gemessenen Wert in RUHE_AUSNAHME und sind dort an
   .planning/HANDOFF-V3-OFFENE-PUNKTE.md gebunden.

   WAS DIE ZEHN AUSNAHMEN VERBINDET: keine einzige stammt aus Welle 1. Alle
   zehn sind an base 0894408a wortgleich vorhanden (`git show
   0894408a:assets/styles/<datei>`), es sind also vorgefundene Schwaechen und
   keine erzeugten. Vier davon — `color: var(--bg)` auf `var(--gold)` — sind
   dieselbe Fehlerart, die Welle 1 sonst ueberall behoben hat; sie blieben
   stehen, weil die Suche auf `var(--bg-dark)` lief und `--bg` ein Alias
   darauf ist (variables.css:486). Sie hier stillschweigend mitzuaendern waere
   ausserhalb des Auftrags; sie NICHT zu fuehren hiesse, die Ratsche etwas
   Falsches behaupten zu lassen.

   IHRE BENANNTE GRENZE, belegt in der Pruefung W1-D Runde 1: R-04 urteilt
   REGELWEISE. Sie liest Flaeche und Tinte EINER Regel und kennt die Kaskade
   nicht. Zwei Folgen, die man wissen muss, bevor man ihr Gruen als Aussage
   ueber den Schirm liest:
     (1) Eine Regel, die eine spaetere oder staerkere Regel ueberschreibt,
         wird trotzdem beurteilt — und faellt als gruen durch, obwohl sie nie
         malt. So kam `spells.css .editor-btn.format-active` durch.
     (2) Eine Regel, die NUR die Tinte setzt und deren Flaeche aus einer
         anderen Regel kommt, faellt ganz aus dem Raster (`ruheRegeln()`
         verlangt Flaeche UND Tinte in derselben Regel, und eine Flaeche als
         rgba-Literal faellt ohnehin heraus). So blieben die sechs
         `.shop-cat-badge`-Kategorieregeln unsichtbar, waehrend sie die
         Voreinstellung jedes Ladens auf 1,00 druckten.
   Beides deckt seit der Nachbesserung R-05 ab, und zwar fuer eine benannte
   Liste von Elementzustaenden. R-04 bleibt die Flaechenprobe; sie wird durch
   R-05 ergaenzt, nicht ersetzt.
   =========================================================================== */
describe('R-04 — jede Regel haelt 4,5 auf ihrer EIGENEN Flaeche (Ratsche)', () => {
    /** Neutrale Traegerflaechen. Sie sind nicht gemeint: auf ihnen urteilt
     *  R-02 Teilformel 2 ueber die Textrollen. Gemeint sind die FARBflaechen —
     *  Akzentrollen, Muenzen, Schadensarten, und was sonst noch als
     *  Vollton-Hintergrund auftaucht. Die Abgrenzung laeuft ueber die
     *  Namenspraefixe und nicht ueber eine Liste, damit eine neue Rolle
     *  automatisch mitgeprueft wird statt lautlos durchzufallen. */
    const NEUTRAL = /^--(bg|surface|border)(-|$)/;

    /** BENANNTE AUSNAHMEN, gemessen am 2026-09-28 — Bauart wie
     *  ATTR_HOVER_AUSNAHME und ZUSTAND_AUSNAHME: der Wert ist das gemessene
     *  Minimum ueber die vier Themes, und der Eintrag meldet sowohl eine
     *  Verschlechterung als auch den Fall, dass er nur noch Altlast ist.
     *
     *  Von den drei Gruppen, mit denen diese Liste geboren wurde, ist nach
     *  Schritt 10 (Welle 1, W1-D) nur noch EINE uebrig:
     *
     *  (a) Akzent auf Akzent — ERLEDIGT in Schritt 10, aber nur an EINER der
     *      beiden Stellen, anders als hier bis zur Pruefung W1-D Runde 1
     *      stand. `dashboard.css .wiki-link:hover` (1,29) traegt jetzt das
     *      Tintentoken seiner eigenen Flaechenrolle und haelt 5,05 im
     *      schlechtesten Theme. `spells.css .editor-btn.format-active` (1,39)
     *      dagegen hat nie gemalt: `editors.css:69 .editor-toolbar
     *      .editor-btn.format-active` (0,3,0) gewinnt beide Eigenschaften,
     *      und `format-active` sitzt ausschliesslich auf Knoepfen unterhalb
     *      von `[data-toolbar-for]`, die allesamt `editor-toolbar` tragen.
     *      Die Regel ist deshalb entfernt worden; die erreichbare Stelle in
     *      editors.css ist eine 18-%-Toenung derselben Rolle (gemessen
     *      light 2,41), faellt unter D-4 und ist als W1-D-02 gefuehrt. R-05
     *      bewacht sie mit ihrem gemessenen Wert.
     *  (b) `var(--bg)` auf `var(--gold)` — ERLEDIGT in Schritt 10, alle vier
     *      Stellen auf var(--on-gold) (2,98 -> 5,80 in Light, dem einzigen
     *      Theme unter der Schwelle). WIRKSAM wurde das allerdings erst mit
     *      der Nachbesserung: an `loot.css .shop-cat-badge.active` haben bis
     *      dahin die sechs Kategorieregeln gleicher Spezifitaet die Tinte
     *      zurueckgeholt (gemessen 1,00 bis 2,85, also SCHLECHTER als der
     *      gestrichene Ausnahmewert). Seit die Kategorien vor `.active`
     *      stehen, stimmen Regel und Schirm ueberein.
     *  (c) weisse Schrift auf der Schadensartenskala — vier Stellen, OFFEN.
     *      Die Begruendung steht seit Welle 1 ausfuehrlich in dashboard.css
     *      ueber .qref-dmg: die Skala muss als GANZES neu gerechnet werden
     *      (13 Typen, sonst verschiebt sich ihre Ordnung). --dmg-physical
     *      haelt mit weiss bereits 5,17 und steht deshalb nicht hier. */
    const RUHE_AUSNAHME = {
        'dashboard.css .qref-dmg.psychic': 3.53,
        'dashboard.css .qref-dmg.cold': 3.68,
        'dashboard.css .qref-dmg.fire': 3.76,
        'dashboard.css .qref-dmg.thunder': 4.23
    };

    const SCHWELLE = 4.5;

    /** Die Regeln, ueber die geurteilt wird. Ausgelagert, damit Urteil und
     *  Gegenprobe dieselbe Menge sehen. */
    function ruheRegeln() {
        const out = [];
        cssFiles.forEach(f => {
            if (f.name === 'variables.css' || f.name === 'fonts.css') return;
            regelnMitRumpf(f.content).forEach(r => {
                const flaeche = deklaration(r.rumpf, 'background(?:-color)?');
                const tinte = deklaration(r.rumpf, 'color');
                if (!flaeche || !tinte) return;
                const m = flaeche.match(/^var\((--[\w-]+)\)$/);
                if (!m || NEUTRAL.test(m[1])) return;
                out.push({ ...r, datei: f.name, flaeche, tinte });
            });
        });
        return out;
    }

    test('keine Regel setzt eine Tinte, die auf ihrer eigenen Flaeche durchfaellt', () => {
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];
        const offen = new Set(Object.keys(RUHE_AUSNAHME));

        ruheRegeln().forEach(regel => {
            const schluessel = `${regel.datei} ${regel.sel}`;
            const werte = {};
            let fehlt = null;
            WCAG.THEMES.forEach(theme => {
                const p = { ...pals[theme], ...alias };
                const tinte = WCAG.resolve(regel.tinte, p);
                const grund = WCAG.resolve(regel.flaeche, p);
                if (!tinte || !grund) {
                    fehlt = fehlt || `${theme}: ${!tinte ? regel.tinte : regel.flaeche}`;
                    return;
                }
                werte[theme] = WCAG.ratio2(tinte, grund);
            });
            if (fehlt) {
                befunde.push(
                    `${schluessel}:${regel.zeile} — nicht aufloesbar (${fehlt}). Was der ` +
                        `Rechner nicht kennt, darf nicht als gruen gelten`
                );
                return;
            }

            const min = Math.min(...WCAG.THEMES.map(t => werte[t]));
            const zahlen = WCAG.THEMES.map(t => `${t} ${werte[t]}`).join(' · ');
            const eingetragen = RUHE_AUSNAHME[schluessel];
            offen.delete(schluessel);

            if (eingetragen === undefined) {
                if (min < SCHWELLE) {
                    befunde.push(
                        `${schluessel}:${regel.zeile} setzt ${regel.tinte} auf ` +
                            `${regel.flaeche}: min ${min} < ${SCHWELLE} (${zahlen})`
                    );
                }
                return;
            }
            if (min < eingetragen) {
                befunde.push(
                    `${schluessel}: eingetragen war min ${eingetragen}, gemessen ${min} ` +
                        `(${zahlen}) — die benannte Ausnahme verschlechtert sich`
                );
            }
            if (min >= SCHWELLE) {
                befunde.push(
                    `${schluessel}: haelt jetzt min ${min} — Eintrag aus RUHE_AUSNAHME und ` +
                        `aus HANDOFF-V3-OFFENE-PUNKTE.md entfernen`
                );
            }
        });

        [...offen]
            .sort()
            .forEach(k =>
                befunde.push(
                    `${k} steht in RUHE_AUSNAHME, aber es gibt keine solche Regel mehr — ` +
                        `der Eintrag ist Altlast und gehoert entfernt`
                )
            );

        expect(befunde.sort()).toEqual([]);
    });

    /** KERNBELEG gegen die Momentaufnahme: die Ratsche muss die 143 Stellen
     *  wirklich SEHEN, sonst ist sie gruen und leer. Gezaehlt wird, wie viele
     *  der geurteilten Regeln ihre Tinte aus einem --on-*-Token beziehen; das
     *  ist genau die Menge, deren Ruecknahme Runde 1 per Mutation unbemerkt
     *  durchbekommen hat. Am 2026-09-28: 136 von 156. */
    test('die --on-*-Deklarationen der Welle stehen wirklich unter Aufsicht', () => {
        const geurteilt = ruheRegeln();
        const mitOn = geurteilt.filter(r => /^var\(--on-[\w-]+\)$/.test(r.tinte));
        expect(geurteilt.length).toBeGreaterThanOrEqual(120);
        expect(mitOn.length).toBeGreaterThanOrEqual(120);
        // Und die drei Stellen, mit denen Runde 1 die Luecke belegt hat, sind
        // namentlich dabei. Anders als bei R-03 koennen sie hier nicht durch
        // eine Korrektur verschwinden: sie setzen Flaeche UND Tinte, also
        // bleiben sie in der Menge, solange es sie gibt.
        const schluessel = geurteilt.map(r => `${r.datei} ${r.sel}`);
        expect(schluessel).toEqual(
            expect.arrayContaining([
                'core.css .nav-tab.active',
                'core.css .btn-gold',
                'welt.css .fr-ruf-btn-plus'
            ])
        );
    });

    /** Die Aktenlage-Ratsche, wie sie R-02 fuer ATTR_HOVER_AUSNAHME schon
     *  fuehrt: eine Ausnahme, die nur im Kommentar einer Testdatei steht,
     *  sieht niemand, der sie aufloesen koennte. Sie prueft BEIDE Listen —
     *  die von R-03 und die von R-04 — gegen dieselbe Tabelle, und in beide
     *  Richtungen: eine fehlende Zeile ist ein Befund, eine ueberzaehlige
     *  ebenso. */
    test('jede benannte Ausnahme aus R-03 und R-04 ist im offenen Punkt gefuehrt', () => {
        const datei = path.join(REPO, '.planning', 'HANDOFF-V3-OFFENE-PUNKTE.md');
        expect(fs.existsSync(datei)).toBe(true);
        const text = fs.readFileSync(datei, 'utf8');

        // Erwartete Tabellenzeile: | `dashboard.css` | `.wiki-link:hover` | … | 1,29 |
        const zeilenRe =
            /^\s*\|\s*`([\w.-]+\.css)`\s*\|\s*`([^`]+)`\s*\|[^|]*\|\s*(\d+,\d{2})\s*\|/gm;
        const gefuehrt = new Map();
        for (const m of text.matchAll(zeilenRe)) {
            gefuehrt.set(`${m[1]} ${m[2]}`, Number(m[3].replace(',', '.')));
        }

        const erwartet = { ...ZUSTAND_AUSNAHME, ...RUHE_AUSNAHME };
        const befunde = [];
        Object.keys(erwartet).forEach(k => {
            if (!gefuehrt.has(k)) {
                befunde.push(
                    `${k} (min ${erwartet[k]}) steht in einer Ausnahmeliste, aber in keiner ` +
                        `Zeile von .planning/HANDOFF-V3-OFFENE-PUNKTE.md`
                );
                return;
            }
            if (gefuehrt.get(k) !== erwartet[k]) {
                befunde.push(
                    `${k}: Ausnahmeliste sagt ${erwartet[k]}, der offene Punkt sagt ` +
                        `${gefuehrt.get(k)} — die beiden Stellen laufen auseinander`
                );
            }
            gefuehrt.delete(k);
        });
        [...gefuehrt.keys()]
            .sort()
            .forEach(k =>
                befunde.push(
                    `${k} steht im offenen Punkt, aber in keiner Ausnahmeliste — die Zeile ` +
                        `ist Altlast und gehoert entfernt`
                )
            );

        expect(befunde.sort()).toEqual([]);
    });
});
/* ===========================================================================
   Design-Handoff v3, Welle 1 — R-05: die Kaskade entscheidet, nicht die Regel
   ===========================================================================
   R-02, R-03 und R-04 urteilen REGELWEISE. Sie nehmen eine Regel, lesen ihre
   Flaeche und ihre Tinte und rechnen. Genau dort sitzt ihre Blindstelle: eine
   Deklaration, die eine andere Regel ueberschreibt, malt nie — und die drei
   Ratschen melden trotzdem gruen, weil sie die zweite Regel gar nicht kennen.

   ZWEI BELEGTE FAELLE haben diese Luecke in Schritt 10 ausgenutzt (Pruefung
   W1-D, Runde 1):

   (1) `spells.css .editor-btn.format-active` (0,2,0) wurde auf
       `var(--on-gold-dim)` umgestellt und als erledigt verbucht. Sie kommt nie
       zum Zug: `editors.css .editor-toolbar .editor-btn.format-active` (0,3,0)
       gewinnt BEIDE Eigenschaften, und die Klasse `format-active` wird
       ausschliesslich in `rich-text-toolbars.js:309` (Ordner ui/editors) auf
       Knoepfen unterhalb von `[data-toolbar-for]` gesetzt — jedes dieser
       Elemente traegt zugleich `editor-toolbar` (22 statische Leisten in den
       Vorlagen, plus `editor-toolbar-build.js:405` im selben Ordner). Es gibt
       keinen Zustand, in dem die schwaechere Regel gilt.

       Die beiden Modulpfade stehen hier absichtlich OHNE ihren Ordner in
       einem Stueck: das Abdeckungs-Gate (tests/unit/module-test-coverage.test.js)
       zaehlt einen loader.js-Pfad, der woertlich in einer Testdatei vorkommt,
       als abgedeckt. Eine Erwaehnung im Erklaertext ist aber kein Test — sie
       wuerde ein ungetestetes Modul lautlos aus dem Gate nehmen.

   (2) `loot.css .shop-cat-badge.active` setzt Flaeche UND Tinte, aber zwoelf
       Zeilen SPAETER standen die sechs Kategorieregeln mit derselben
       Spezifitaet und setzten `color` erneut. Jede Marke traegt immer beide
       Klassen (`features/shops/shops-core.js:427` und :438), die
       Voreinstellung jedes Ladens ist `shop-cat-badge all active` — also Gold
       auf Gold, gemessen 1,00 in allen vier Themes, waehrend Ratsche und
       Kommentar 5,80 behaupteten.

   WAS DIESE RATSCHE TUT: sie modelliert die Kaskade fuer eine benannte Liste
   von ELEMENTZUSTAENDEN (Klassenmenge plus Vorfahrklassen), bestimmt je
   Eigenschaft die wirklich gewinnende Deklaration — Spezifitaet, bei
   Gleichstand Quellreihenfolge entlang des @import-Hubs — und rechnet den
   Kontrast auf DEM Ergebnis. Zusaetzlich meldet sie jede Regel, deren
   saemtliche Farbdeklarationen von STRIKT hoeherer Spezifitaet geschlagen
   werden: die ist wirkungslos und gehoert entfernt, nicht korrigiert.

   WARUM NUR EINE BENANNTE LISTE und keine vollstaendige Kaskade: eine
   allgemeine Kaskadenaufloesung braucht das DOM. Die Liste hier ist die Menge
   der Zustaende, an denen der Fehler belegt aufgetreten ist; sie waechst mit
   jedem weiteren Befund und ist damit eine Ratsche, keine Vollpruefung.
   =========================================================================== */
describe("R-05 — die Kaskade entscheidet, nicht die Regel (Ratsche)", () => {
  /** Kaskadenreihenfolge der Dateien = Reihenfolge des @import-Hubs. */
  const HUB = fs.readFileSync(path.join(REPO, "assets", "styles.css"), "utf8");
  const DATEI_RANG = new Map();
  [...HUB.matchAll(/@import\s+url\(['"]styles\/([\w-]+\.css)['"]\)/g)].forEach(
    (m, i) => DATEI_RANG.set(m[1], i),
  );

  /** Regeln samt Angabe, ob sie in einem @-Block (z. B. @media) liegen. */
  function regelnMitKontext(text) {
    const s = text.replace(/\/\*[\s\S]*?\*\//g, (m) =>
      m.replace(/[^\n]/g, " "),
    );
    const out = [];
    const stapel = [];
    let buf = "";
    let zeile = 1;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "\n") zeile++;
      if (ch === "{") {
        const kopf = buf.replace(/\s+/g, " ").trim();
        stapel.push({ kopf, at: kopf.startsWith("@"), zeile, ab: i + 1 });
        buf = "";
        continue;
      }
      if (ch === "}") {
        const oben = stapel.pop();
        if (oben && !oben.at) {
          out.push({
            sel: oben.kopf,
            zeile: oben.zeile,
            rumpf: s.slice(oben.ab, i),
            imAt: stapel.some((x) => x.at),
          });
        }
        buf = "";
        continue;
      }
      buf += ch;
    }
    return out;
  }

  /**
   * Trifft eine Selektor-Alternative den beschriebenen Elementzustand?
   *
   * Bewusst eng: nur Klassenselektoren und Nachfahren-Kombinatoren. Alles
   * andere (Element, ID, Pseudoklasse, `>`/`+`/`~`, Attribut) gilt als
   * NICHT-Treffer — die Zustaende dieser Liste sind Ruhezustaende ohne
   * Pseudoklasse. Eine zu grosszuegige Uebereinstimmung waere schlimmer als
   * gar keine: sie rechnete eine Tinte auf eine Flaeche, die nie zusammen
   * auftreten.
   */
  function trifft(alternative, klassen, vorfahren) {
    if (/[>+~[\]#]|::/.test(alternative)) return false;
    const teile = alternative.trim().split(/\s+/);
    if (!teile.length) return false;
    const alleKlassen = (t) => {
      const tok = t.match(/\.[-\w]+/g) || [];
      return tok.length && tok.join("") === t
        ? tok.map((x) => x.slice(1))
        : null;
    };
    const letzte = alleKlassen(teile[teile.length - 1]);
    if (!letzte || !letzte.every((k) => klassen.includes(k))) return false;
    const erlaubt = [...klassen, ...vorfahren];
    return teile.slice(0, -1).every((t) => {
      const k = alleKlassen(t);
      return k && k.every((x) => erlaubt.includes(x));
    });
  }

  /** Spezifitaet reicht hier als Klassenzahl: die Liste kennt nur Klassen. */
  const spezifitaet = (alternative) =>
    (alternative.match(/\.[-\w]+/g) || []).length;

  /** Die gewinnende Deklaration einer Eigenschaft fuer einen Zustand. */
  function gewinner(kandidaten, prop) {
    let best = null;
    kandidaten.forEach((k) => {
      const wert = deklaration(k.rumpf, prop);
      if (!wert) return;
      const besser =
        !best ||
        k.spez > best.spez ||
        (k.spez === best.spez &&
          (DATEI_RANG.get(k.datei) > DATEI_RANG.get(best.datei) ||
            (k.datei === best.datei && k.zeile > best.zeile)));
      if (besser) best = { ...k, wert };
    });
    return best;
  }

  function kandidatenFuer(zustand) {
    const out = [];
    cssFiles.forEach((f) => {
      if (!zustand.dateien.includes(f.name)) return;
      regelnMitKontext(f.content).forEach((r) => {
        if (r.imAt) return;
        const treffer = r.sel
          .split(",")
          .map((s) => s.trim())
          .filter((s) => trifft(s, zustand.klassen, zustand.vorfahren));
        if (!treffer.length) return;
        out.push({
          datei: f.name,
          zeile: r.zeile,
          sel: r.sel,
          rumpf: r.rumpf,
          alternativen: treffer,
          spez: Math.max(...treffer.map(spezifitaet)),
        });
      });
    });
    return out;
  }

  /**
   * Die benannte Liste.
   *
   * `marke` ist die Klasse, die den Zustand VOM RUHEZUSTAND unterscheidet.
   * Sie wird fuer die zweite Probe gebraucht: nur eine Regel, die die Marke
   * selbst fuehrt, gilt ausschliesslich in diesem Zustand — bei ihr und nur
   * bei ihr folgt aus "hier geschlagen" auch "ueberall geschlagen". `.shop-cat-badge`
   * und `.shop-cat-badge.weapon` verlieren hier ebenfalls, malen aber die
   * RUHENDE Marke; sie sind nicht wirkungslos, sondern gehoeren zu einem
   * anderen Zustand.
   *
   * `ausnahme` traegt das gemessene Minimum einer Stelle, die bewusst offen
   * bleibt — hier die 18-%-Toenung derselben Rolle unter der
   * Nutzerentscheidung D-4 (Toenungsstaerke und Tinte entscheidet Welle 2
   * zusammen). Gefuehrt in .planning/HANDOFF-V3-OFFENE-PUNKTE.md, W1-D-02.
   */
  const ZUSTAENDE = [
    ...["all", "weapon", "armor", "item", "service", "misc"].map((kat) => ({
      name: `Ladenmarke .${kat} im aktiven Filter`,
      dateien: ["loot.css"],
      klassen: ["shop-cat-badge", kat, "active"],
      vorfahren: ["shop-category-tabs", "shop-body", "shop-card"],
      marke: "active",
    })),
    {
      name: "Werkzeugleisten-Knopf im aktiven Format",
      dateien: ["editors.css", "spells.css"],
      klassen: ["editor-btn", "format-active"],
      vorfahren: ["editor-toolbar", "toolbar-group"],
      marke: "format-active",
      /* rgba(212,175,55,0.18) ueber --bg-elevated, gemessen am
               2026-09-28: dark 5,06 · light 2,41 · sepia 5,28 · contrast 7,94. */
      ausnahme: 2.41,
      flaecheUeber: "var(--bg-elevated)",
    },
  ];

  const SCHWELLE = 4.5;

  test("die Tinte, die am Ende gewinnt, haelt 4,5 auf der Flaeche, die am Ende gewinnt", () => {
    const pals = WCAG.palettes();
    const alias = aliasSchicht();
    const befunde = [];

    ZUSTAENDE.forEach((z) => {
      const kand = kandidatenFuer(z);
      const tinte = gewinner(kand, "color");
      const flaeche = gewinner(kand, "background(?:-color)?");
      if (!tinte || !flaeche) {
        befunde.push(
          `${z.name}: keine gewinnende ${!tinte ? "Tinte" : "Flaeche"} gefunden — ` +
            `der Zustand ist falsch beschrieben, nicht heil`,
        );
        return;
      }
      const werte = {};
      WCAG.THEMES.forEach((t) => {
        const p = { ...pals[t], ...alias };
        const vg = WCAG.resolve(tinte.wert, p);
        let bg = WCAG.resolve(flaeche.wert, p);
        if (bg === null && z.flaecheUeber) {
          bg = WCAG.resolveOver(
            flaeche.wert,
            p,
            WCAG.resolve(z.flaecheUeber, p),
          );
        }
        werte[t] = vg && bg ? WCAG.ratio2(vg, bg) : null;
      });
      if (WCAG.THEMES.some((t) => werte[t] === null)) {
        befunde.push(
          `${z.name}: ${tinte.wert} auf ${flaeche.wert} ist nicht aufloesbar — ` +
            `was der Rechner nicht kennt, darf nicht als gruen gelten`,
        );
        return;
      }
      const min = Math.min(...WCAG.THEMES.map((t) => werte[t]));
      const zahlen = WCAG.THEMES.map((t) => `${t} ${werte[t]}`).join(" · ");
      const quelle =
        `Tinte ${tinte.datei}:${tinte.zeile} (${tinte.sel}) · ` +
        `Flaeche ${flaeche.datei}:${flaeche.zeile} (${flaeche.sel})`;
      if (z.ausnahme !== undefined) {
        if (min !== z.ausnahme) {
          befunde.push(
            `${z.name}: benannte Ausnahme sagt ${z.ausnahme}, gemessen ${min} ` +
              `(${zahlen}). ${quelle}`,
          );
        }
        return;
      }
      if (min < SCHWELLE) {
        befunde.push(
          `${z.name}: ${min} < ${SCHWELLE} (${zahlen}). ${quelle}. Die Kaskade ` +
            `verwirft, was die Regel behauptet`,
        );
      }
    });

    expect(befunde.sort()).toEqual([]);
  });

  test("keine Farbregel ist durch strikt hoehere Spezifitaet wirkungslos", () => {
    const befunde = [];
    ZUSTAENDE.forEach((z) => {
      const kand = kandidatenFuer(z);
      const maxSpez = Math.max(...kand.map((k) => k.spez));
      kand.forEach((k) => {
        // Nur Regeln, die die Zustandsmarke selbst fuehren: nur bei
        // ihnen heisst "in diesem Zustand geschlagen" auch "nie wirksam".
        if (!k.alternativen.some((a) => a.includes(`.${z.marke}`))) return;
        const props = ["color", "background(?:-color)?"].filter((p) =>
          deklaration(k.rumpf, p),
        );
        if (!props.length || k.spez >= maxSpez) return;
        const geschlagen = props.every((p) => {
          const g = gewinner(kand, p);
          return g && g.spez > k.spez;
        });
        if (geschlagen) {
          befunde.push(
            `${k.datei}:${k.zeile} (${k.sel}) malt im Zustand "${z.name}" nie — ` +
              `jede ihrer Farbdeklarationen verliert gegen strikt hoehere ` +
              `Spezifitaet. Eine wirkungslose Regel gehoert entfernt, nicht ` +
              `korrigiert`,
          );
        }
      });
    });
    expect([...new Set(befunde)].sort()).toEqual([]);
  });
});

/* ===========================================================================
   Design-Handoff v3, Welle 1 — R-06: die Zeilenanker der Aktenlage
   ===========================================================================
   Die Aktenlage-Ratsche im R-04-Block prueft SELEKTOR-Schluessel. Die Tabellen
   von W1-D-01 fuehren aber `datei.css:ZEILE` — und genau diese Zeilen sind in
   Schritt 10 um die Zahl der eingefuegten Kommentarzeilen verrutscht: 34 der
   128 Anker zeigten danach auf `font-weight`, auf eine Leerzeile oder auf eine
   schliessende Klammer (Pruefung W1-D, Runde 1).

   Das ist dieselbe Fehlerart, wegen der die Auftragslage die Anker des
   Handoffs v3 fuer unbrauchbar erklaert hat. Ein Aktenstueck, das die naechste
   Welle vom Neu-Herleiten befreien soll, darf sie nicht kosten. Diese Ratsche
   faellt bei JEDEM weiteren Kommentar-Commit, der eine gefuehrte Stelle
   verschiebt, ohne die Tabelle nachzuziehen.
   =========================================================================== */
describe("R-06 — jeder Zeilenanker der Aktenlage trifft seine Deklaration (Ratsche)", () => {
  const DOK = path.join(REPO, ".planning", "HANDOFF-V3-OFFENE-PUNKTE.md");

  /** Alle `color: var(--x)`-Deklarationen einer CSS-Datei mit Zeile und
   *  Selektor. Zeichenweise, damit einzeilige Regeln
   *  (`.a { margin: 0; color: var(--gold); }`) genauso erfasst werden. */
  function farbstellen(datei) {
    const text = cssFiles.find((f) => f.name === datei);
    if (!text) return null;
    const zeilen = text.content.split(/\r?\n/);
    const out = [];
    const stapel = [];
    let selBuf = "";
    for (let i = 0; i < zeilen.length; i++) {
      let buf = "";
      const roh = zeilen[i];
      for (let c = 0; c < roh.length; c++) {
        const ch = roh[c];
        if (ch === "{") {
          stapel.push(
            (selBuf + buf)
              .replace(/\/\*[\s\S]*?\*\//g, "")
              .replace(/\s+/g, " ")
              .trim(),
          );
          selBuf = "";
          buf = "";
        } else if (ch === "}") {
          stapel.pop();
          selBuf = "";
          buf = "";
        } else if (ch === ";") {
          const m = buf.trim().match(/^color\s*:\s*var\(\s*(--[\w-]+)\s*\)$/);
          if (m && stapel.length) {
            out.push({
              zeile: i + 1,
              sel: stapel[stapel.length - 1],
              rolle: m[1],
            });
          }
          buf = "";
        } else buf += ch;
      }
      selBuf += buf + " ";
      if (!stapel.length && /^\s*$/.test(roh)) selBuf = "";
    }
    return out;
  }

  /** Die gefuehrten Stellen: Tabellenzeilen der Gruppen A-D und der
   *  Codeblock der Gruppe E. */
  function gefuehrteStellen(text) {
    const out = [];
    let inE = false;
    let aktDatei = null;
    text.split(/\r?\n/).forEach((l) => {
      const t = l.match(
        /^\|\s*`([\w-]+\.css):(\d+)`\s*\|\s*`([^`]+)`\s*\|\s*`(--[\w-]+)`\s*\|/,
      );
      if (t) {
        out.push({ datei: t[1], zeile: Number(t[2]), sel: t[3], rolle: t[4] });
        return;
      }
      if (/^### Gruppe E/.test(l)) {
        inE = true;
        return;
      }
      if (/^### /.test(l)) inE = false;
      if (!inE) return;
      const d = l.match(/^([\w-]+\.css)\s*$/);
      if (d) {
        aktDatei = d[1];
        return;
      }
      const e = l.match(/^\s+(\d+)\s+(\S.*?)\s*$/);
      if (e && aktDatei) {
        out.push({
          datei: aktDatei,
          zeile: Number(e[1]),
          sel: e[2],
          rolle: null,
        });
      }
    });
    return out;
  }

  test("die gefuehrten Stellen von W1-D-01 zeigen auf eine passende Farbdeklaration", () => {
    expect(fs.existsSync(DOK)).toBe(true);
    const stellen = gefuehrteStellen(fs.readFileSync(DOK, "utf8"));
    /* Plausibilitaetsprobe: faellt die Zerlegung auseinander, waere die
       Ratsche gruen und leer.
       DIESE ZAHL DARF NUR SINKEN, und nur zusammen mit einer wirklich
       erledigten Stelle. Geboren am 2026-09-28 mit 128. Seit Schritt 11
       derselben Welle sind es 126: `.bestiary-statblock-name` und
       `.bestiary-statblock-section-heading` sind aus der Liste heraus,
       weil ihr "Verlauf" gar kein Theme-Verlauf war, sondern die
       themenunabhaengige Pergamentpalette — eine `-text`-Rolle konnten
       sie deshalb nie bekommen. Sie tragen jetzt --parchment-ink-red
       (10,98 / 9,29 statt 2,58-3,92) und stehen unter R-07. Wer die Zahl
       senkt, OHNE dass eine Stelle erledigt ist, nimmt der Ratsche
       lautlos Stellen weg. */
    expect(stellen.length).toBe(126);

    const befunde = [];
    stellen.forEach((s) => {
      const idx = farbstellen(s.datei);
      if (!idx) {
        befunde.push(`${s.datei}: Datei gibt es nicht (mehr)`);
        return;
      }
      const treffer = idx.find((x) => x.zeile === s.zeile);
      if (!treffer) {
        befunde.push(
          `${s.datei}:${s.zeile} (${s.sel}) — dort steht keine ` +
            `color-var-Deklaration mehr`,
        );
        return;
      }
      const teile = treffer.sel.split(",").map((x) => x.trim());
      if (treffer.sel !== s.sel && !teile.includes(s.sel)) {
        befunde.push(
          `${s.datei}:${s.zeile} — gefuehrt als ${s.sel}, dort steht ${treffer.sel}`,
        );
        return;
      }
      if (s.rolle && treffer.rolle !== s.rolle) {
        befunde.push(
          `${s.datei}:${s.zeile} (${s.sel}) — gefuehrt als ${s.rolle}, dort ` +
            `steht ${treffer.rolle}`,
        );
      }
    });
    expect(befunde.sort()).toEqual([]);
  });
});

/* ===========================================================================
   Design-Handoff v3, Welle 1 — R-07: das Statblock-Pergament traegt keine
   Theme-Farbe
   ===========================================================================
   Der Bestiarium-Statblock liegt NICHT auf einer Theme-Flaeche. Er liegt auf
   der Vorlese-Papierpalette: `features/bestiary/bestiary-render.js:300` baut
   `<div class="bestiary-statblock read-aloud parchment">`, und
   `party.css .read-aloud.parchment` faerbt das mit einem Verlauf aus
   --ra-parchment-from (#f5e6c8) nach --ra-parchment-to (#e8d4a8). Diese beiden
   Toene stehen im Aliasblock und sind in ALLEN vier Themes dieselben — das ist
   Absicht und von einem eigenen Test ("die Vorlese-Papierpalette bleibt
   themenunabhaengig") bewacht.

   DER FEHLER, GEGEN DEN DIESE RATSCHE STEHT, ist die Kombination aus beidem:
   eine Tinte, die dem Theme folgt, auf einer Flaeche, die es nicht tut. Genau
   das stand hier bis zum 2026-09-28: `color: var(--red)` auf dem Pergament,
   gemessen (eigener Lauf mit diesem Rechner, beide Verlaufsenden)

       dark 3,05 / 2,58 · light 3,92 / 3,31 · sepia 3,75 / 3,17 · contrast 3,24 / 2,74

   — also in keinem einzigen Theme 4,5, und am hellen Ende nie ueber 3,92. Der
   Wert schwankt ausserdem mit einer Einstellung, die auf die Flaeche keinerlei
   Wirkung hat; wer --red fuer ein Theme aufhellt, verschlechtert den Statblock,
   ohne es zu merken.

   WARUM KEINE DER DREI IM HANDOFF VORGESCHLAGENEN ERSATZTINTEN GENOMMEN WURDE:
   --parchment-ink #5c2d0a ist Braun, --parchment-ink-dark #2c1810 fast Schwarz,
   --ra-parchment-rule #8b4513 Sattelbraun. Der Kommentar ueber
   `.bestiary-statblock-name` sagt seit jeher "classic 5e red", und §7 des
   Auftrags schuetzt genau diese Gestaltungsabsicht. Statt sie zu loeschen,
   traegt der Statblock jetzt eine EIGENE, themenunabhaengige Pergamenttinte:
   --parchment-ink-red #58180d, gemessen 10,98 gegen --ra-parchment-from und
   9,29 gegen --ra-parchment-to, in allen vier Themes identisch.

   WAS SIE PRUEFT, in drei Stufen, damit sie nicht an einer verschobenen
   Voraussetzung vorbeigruent:
     (1) die Flaeche ist noch die, von der die Zahlen handeln — das Markup
         setzt `read-aloud parchment` und die Regel dazu faerbt mit BEIDEN
         Verlaufstokens;
     (2) jede Tinte im Statblock loest in allen vier Themes auf DENSELBEN Wert
         auf (Themenunabhaengigkeit);
     (3) sie haelt 4,5 (Text) bzw. 3 (Linien) auf beiden Verlaufsenden.

   SIE IST BEI IHRER GEBURT ROT, mit zwei Stellen: `.bestiary-statblock-name`
   und `.bestiary-statblock-section-heading` (deren border-bottom mitgezaehlt).
   Gruen wird sie mit Schritt 11.

   NICHT GEMEINT ist `.bestiary-statblock-subline` mit ihrem
   `rgba(44, 24, 16, 0.7)`. Das ist zwar das einzige rgba-Literal im ganzen
   Baum, das als Textfarbe steht, aber es ist themenunabhaengig UND es haelt:
   ueber dem jeweiligen Verlaufsende zusammengesetzt ergibt es #685647 bzw.
   #64503e und damit 5,66 und 5,22. Literal -> Token ist Welle-2-Arbeit, kein
   Kontrastmangel. Ebenso NICHT gemeint ist `.bestiary-attribution`: sie steht
   trotz des gemeinsamen Namensanfangs ausserhalb des Statblocks
   (bestiary-render.js:435, Geschwister der Statblock-Schachtel).
   =========================================================================== */
describe('R-07 — Pergament-Statblock: themenunabhaengige Tinte (Ratsche)', () => {
    /** Die Regeln, die IM Statblock faerben. `.bestiary-attribution` faengt
     *  der Praefix `.bestiary-attr` sonst mit ein — deshalb die drei
     *  Zellenklassen einzeln statt als Praefix. */
    const IM_STATBLOCK = /\.bestiary-statblock|\.bestiary-attr-(?:cell|label|value)\b/;
    /** Die getoente Attributzelle liegt zwischen Tinte und Pergament. */
    const ZELLE = /\.bestiary-attr-(?:label|value)\b/;
    const ZELL_TOENUNG = 'rgba(139, 69, 19, 0.08)';

    const TEXT_SCHWELLE = 4.5;
    const LINIEN_SCHWELLE = 3;

    test('die Flaeche ist noch der Pergamentverlauf — sonst handelt der Rest von nichts', () => {
        const js = fs.readFileSync(
            path.join(REPO, 'features', 'bestiary', 'bestiary-render.js'),
            'utf8'
        );
        expect(js).toContain('class="bestiary-statblock read-aloud parchment"');

        const party = cssFiles.find(f => f.name === 'party.css').content;
        const regel = regelnMitRumpf(party).find(r => /\.read-aloud\.parchment\b/.test(r.sel));
        expect(regel).toBeDefined();
        const flaeche = deklaration(regel.rumpf, 'background');
        expect(flaeche).toContain('var(--ra-parchment-from)');
        expect(flaeche).toContain('var(--ra-parchment-to)');
    });

    test('jede Tinte im Statblock ist themenunabhaengig und haelt auf beiden Verlaufsenden', () => {
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const paletten = WCAG.THEMES.map(t => ({ theme: t, p: { ...pals[t], ...alias } }));
        const p0 = paletten[0].p;
        const enden = [
            WCAG.resolve('var(--ra-parchment-from)', p0),
            WCAG.resolve('var(--ra-parchment-to)', p0)
        ];
        // Plausibilitaetsprobe: ohne aufgeloeste Enden waere alles gruen.
        expect(enden.every(Boolean)).toBe(true);

        const bestiary = cssFiles.find(f => f.name === 'bestiary.css');
        const befunde = [];
        let geprueft = 0;

        regelnMitRumpf(bestiary.content).forEach(regel => {
            const treffer = regel.sel
                .split(',')
                .map(s => s.trim())
                .filter(s => IM_STATBLOCK.test(s));
            if (!treffer.length) return;

            const flaechen = treffer.some(s => ZELLE.test(s))
                ? enden.map(e => WCAG.resolveOver(ZELL_TOENUNG, p0, e))
                : enden;

            // Der Anzeigename steht neben dem Muster: eine Fundmeldung, die
            // das Suchmuster selbst ausdruckt, ist unlesbar.
            [
                ['color', 'color', TEXT_SCHWELLE],
                [
                    'border(?:-(?:top|right|bottom|left))?(?:-color)?',
                    'Rahmenfarbe',
                    LINIEN_SCHWELLE
                ]
            ].forEach(([prop, name, schwelle]) => {
                const roh = deklaration(regel.rumpf, prop);
                if (!roh) return;
                // Aus `1px solid var(--x)` bzw. `1px solid #abc` den Farbteil.
                const farbe = (roh.match(/var\([^)]*\)|#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/) || [])[0];
                if (!farbe) return;
                geprueft++;

                // (2) Themenunabhaengigkeit: derselbe Endwert in allen vier Themes.
                const proTheme = paletten.map(({ theme, p }) => ({
                    theme,
                    wert: WCAG.resolve(farbe, p) || WCAG.resolveOver(farbe, p, flaechen[0])
                }));
                if (proTheme.some(x => !x.wert)) {
                    befunde.push(
                        `bestiary.css:${regel.zeile} (${regel.sel}) ${name}: ${farbe} ist nicht ` +
                            `aufloesbar — was der Rechner nicht kennt, darf nicht als gruen gelten`
                    );
                    return;
                }
                if (new Set(proTheme.map(x => x.wert)).size > 1) {
                    befunde.push(
                        `bestiary.css:${regel.zeile} (${regel.sel}) ${name}: ${farbe} folgt dem ` +
                            `Theme (${proTheme.map(x => `${x.theme} ${x.wert}`).join(' · ')}), das ` +
                            `Pergament tut es nicht. §7 verlangt hier eine eigene Pergamenttinte`
                    );
                }

                // (3) Kontrast auf beiden Verlaufsenden, je Theme und Ende.
                paletten.forEach(({ theme, p }) => {
                    flaechen.forEach((grund, i) => {
                        const tinte = WCAG.resolve(farbe, p) || WCAG.resolveOver(farbe, p, grund);
                        if (!tinte || !grund) return;
                        const r = WCAG.ratio2(tinte, grund);
                        if (r < schwelle) {
                            befunde.push(
                                `bestiary.css:${regel.zeile} (${regel.sel}) ${name}: ${theme} ` +
                                    `${tinte} auf ${grund} (Verlaufsende ${i + 1}): ${r} < ` +
                                    `${schwelle}`
                            );
                        }
                    });
                });
            });
        });

        // Gegenprobe: die Ratsche muss die Stellen wirklich SEHEN.
        expect(geprueft).toBeGreaterThanOrEqual(6);
        expect([...new Set(befunde)].sort()).toEqual([]);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 1 — R-08: Muenzen sind Flaechen, keine Tinten
   ===========================================================================
   ENTSCHEIDUNG D-5 (Nutzer, 2026-09-28) in einer Zeile: die vier Metalle
   bleiben als FARBE erhalten und werden zur Flaeche; die Schrift darauf ist
   --on-coin-*. Der Weg, den §3.1 vorschlug — die Muenzfarbe als Textfarbe so
   weit abdunkeln, bis sie 4,5 auf --bg-dark haelt — ist ausdruecklich
   verworfen, und zwar mit Zahlen: --coin-gm #ffd700 braeuchte in Light 49 %
   Abdunklung auf #826e00. Eine olivbraune Goldmuenze verfehlt den einzigen
   Zweck, den diese vier Farben haben.

   WAS DER ZUSTAND VOR DIESER RATSCHE WAR, gemessen mit dem Helfer aus
   Schritt 1 gegen .cf-panel { background: var(--bg-dark) }:

       --coin-pm  dark 5,97 · light 2,98 · sepia 2,59 · contrast 6,45
       --coin-gm  dark 13,86 · light 1,29 · sepia 1,12 · contrast 14,97
       --coin-sm  dark 10,68 · light 1,67 · sepia 1,45 · contrast 11,54
       --coin-km  dark 6,18 · light 2,88 · sepia 2,50 · contrast 6,68

   1,12 ist der schlechteste Wert, den dieser Baum ueberhaupt kennt — die
   Silber- und Goldmarke des Geldbeutels waren in Light und Sepia praktisch
   unsichtbar. Als Flaeche mit ihrer eigenen Tinte tragen dieselben vier
   Farben 5,80 / 13,46 / 10,38 / 6,00, und zwar in allen vier Themes gleich,
   weil --on-coin-* ueberall #111111 ist.

   WARUM SIE GEBRAUCHT WIRD, obwohl R-02 schon ueber die Muenzen urteilt: R-02
   Teilformel 1 prueft das PAAR (--on-coin-gm auf --coin-gm). Sie sagt nichts
   darueber, ob die Verwendungsstelle das Paar auch benutzt. Wer morgen
   `color: var(--coin-gm)` zurueckschreibt, laesst R-02 unberuehrt gruen und
   R-04 ebenfalls (die urteilt nur ueber Regeln, die Flaeche UND Tinte selbst
   setzen — eine Regel ohne Flaeche faellt aus ihrer Menge heraus). Genau
   diese Luecke schliesst R-08.

   DIE DRITTE PROBE IST KEIN SCHMUCK: der Geldbeutel hat FUENF Marken, und die
   fuenfte (Elektrum) faerbt sich nicht mit einem Muenz-Token, sondern mit
   --green. Blieben die vier Metalle Pillen und EM nackter Text, stuende eine
   Marke sichtbar aus der Reihe. Die Probe verlangt deshalb fuer alle fuenf
   Flaeche UND Tinte in derselben Regel.

   SIE IST BEI IHRER GEBURT ROT, mit vier Muenzstellen ohne Flaeche und der
   Reihenprobe. Gruen wird sie mit Schritt 12.
   =========================================================================== */
describe('R-08 — Muenzfarben sind Flaechen, keine Tinten (Ratsche)', () => {
    const METALLE = ['pm', 'gm', 'sm', 'km'];
    /** Die fuenf Marken des Geldbeutels, in der Reihenfolge des Markups
     *  (assets/templates/view-party.html:311-330). `em` ist bewusst dabei. */
    const MARKEN = ['pm', 'gm', 'em', 'sm', 'km'];

    /** Alle Regeln aller Dateien mit ihrer Herkunft. */
    function alleRegeln() {
        const out = [];
        cssFiles.forEach(f => {
            if (f.name === 'variables.css' || f.name === 'fonts.css') return;
            regelnMitRumpf(f.content).forEach(r => out.push({ ...r, datei: f.name }));
        });
        return out;
    }

    test('keine Muenzrolle steht als Textfarbe, und jede Muenzflaeche traegt ihre Tinte', () => {
        const befunde = [];
        let flaechen = 0;

        alleRegeln().forEach(r => {
            const tinte = deklaration(r.rumpf, 'color');
            const flaeche = deklaration(r.rumpf, 'background(?:-color)?');

            const alsText = tinte && tinte.match(/^var\(--coin-(pm|gm|sm|km)\)$/);
            if (alsText) {
                befunde.push(
                    `${r.datei}:${r.zeile} (${r.sel}) setzt --coin-${alsText[1]} als TEXTfarbe. ` +
                        `D-5 macht die Metalle zur Flaeche: background: var(--coin-${alsText[1]}); ` +
                        `color: var(--on-coin-${alsText[1]})`
                );
            }

            const alsFlaeche = flaeche && flaeche.match(/^var\(--coin-(pm|gm|sm|km)\)$/);
            if (alsFlaeche) {
                flaechen++;
                const soll = `var(--on-coin-${alsFlaeche[1]})`;
                if (tinte !== soll) {
                    befunde.push(
                        `${r.datei}:${r.zeile} (${r.sel}) fuellt mit --coin-${alsFlaeche[1]}, ` +
                            `traegt aber ${tinte || 'keine eigene Tinte'} statt ${soll}`
                    );
                }
            }
        });

        expect(befunde.sort()).toEqual([]);
        // Gegenprobe, NACH der Fundliste: ohne gefundene Muenzflaechen waere
        // diese Ratsche sonst gruen und leer. Die Reihenfolge ist Absicht —
        // bei ihrer Geburt sind noch null Flaechen da, und die Fundliste ist
        // dann die brauchbarere Meldung.
        expect(flaechen).toBeGreaterThanOrEqual(METALLE.length);
    });

    test('die fuenf Geldbeutel-Marken sind EINE Reihe — keine faellt heraus', () => {
        const party = cssFiles.find(f => f.name === 'party.css');
        const regeln = regelnMitRumpf(party.content);
        const befunde = [];

        MARKEN.forEach(m => {
            const r = regeln.find(x => x.sel.includes(`.cf-coin-item.${m} .cf-coin-label`));
            if (!r) {
                befunde.push(`party.css: keine Regel fuer .cf-coin-item.${m} .cf-coin-label`);
                return;
            }
            const flaeche = deklaration(r.rumpf, 'background(?:-color)?');
            const tinte = deklaration(r.rumpf, 'color');
            if (!flaeche || !tinte) {
                befunde.push(
                    `party.css:${r.zeile} .cf-coin-item.${m} .cf-coin-label setzt ` +
                        `${!flaeche ? 'keine Flaeche' : 'keine Tinte'} — dann steht diese eine ` +
                        `Marke als nackter Text zwischen vier Pillen`
                );
            }
        });

        expect(befunde.sort()).toEqual([]);
    });

    test('die Attributkuerzel der Schnellreferenz beziehen ihre Farbe aus dem Token', () => {
        /* Schwesterprobe zu "die Attributfarben stehen nur noch an EINER
           Stelle": die friert die zwoelf DM-Screen-Regeln ein, sagt aber
           nichts ueber die fuenf Regeln der Schnellreferenz
           (dashboard.css .attr-str .. .attr-cha).
           --attr-con FEHLT dort, und das ist kein Versehen: das Markup
           (modals-editors.html:370-376) fuehrt sieben Beispielzeilen und
           keine davon ist eine Konstitutionsprobe. Eine Regel fuer eine
           Klasse, die nirgends entsteht, waere toter Buchstabe. Die zweite
           Zusicherung haelt beides zusammen: sobald jemand eine CON-Zeile
           ins Markup schreibt, verlangt dieser Test die Regel dazu. */
        const dashboard = cssFiles.find(f => f.name === 'dashboard.css').content;
        const markup = tplFiles.find(f => f.name === 'modals-editors.html').content;
        const befunde = [];

        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(a => {
            const imMarkup = new RegExp(`class="attr-${a}"`).test(markup);
            const imCss = new RegExp(`\\.attr-${a}\\b[^}]*var\\(--attr-${a}\\)`).test(
                withoutComments(dashboard)
            );
            if (imMarkup && !imCss) {
                befunde.push(
                    `.attr-${a} kommt im Markup vor, aber dashboard.css faerbt es nicht mit ` +
                        `var(--attr-${a}) — die Zeile erbt dann die Zeilenfarbe`
                );
            }
            if (!imMarkup && imCss) {
                befunde.push(
                    `dashboard.css faerbt .attr-${a}, aber kein Markup setzt die Klasse — ` +
                        `tote Regel`
                );
            }
        });

        // Gegenprobe: mindestens fuenf der sechs muessen wirklich vorkommen,
        // sonst prueft die Schleife ueber Leerlauf.
        const vorhanden = ['str', 'dex', 'con', 'int', 'wis', 'cha'].filter(a =>
            new RegExp(`class="attr-${a}"`).test(markup)
        );
        expect(vorhanden.length).toBeGreaterThanOrEqual(5);
        expect(befunde.sort()).toEqual([]);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 1 — R-09: die Ortsfarben aus dem JS
   ===========================================================================
   DREI STELLEN IN features/locations/locations-render.js schreiben eine
   Farbe direkt ins Markup, weil sie aus den Kampagnendaten kommt und im CSS
   deshalb gar nicht stehen KANN:

     :66   der Filter-Chip     — `color: var(--${f.color})` im Inline-Stil
     :153  der Listenaufkleber — `background: var(--${filter.color})`,
                                 die Tinte stand in core.css
     :253  die Detailkopfzeile — `color: var(--${filter.color})`

   FUER JEDE RATSCHE DIESER DATEI SIND DIESE DREI UNSICHTBAR: R-02 bis R-05
   und R-07/R-08 lesen CSS. Was ein Template-Literal in eine style=-Zeichen-
   kette schreibt, sieht keine von ihnen. Genau deshalb steht diese hier —
   sonst waere die Ortsansicht die eine Ansicht der App, deren Farben nach
   Welle 1 unbewacht bleiben.

   WAS SICH IN SCHRITT 13 GEAENDERT HAT, und warum jeweils:
   (a) Der AUFKLEBER traegt eine volle Akzentflaeche, also gehoert die
       Tinte --on-<rolle> darauf (gemessen min 4,55 ueber alle acht Rollen
       und vier Themes; vorher war es `color: var(--bg-dark)` aus core.css
       mit min 2,51). Die core.css-Zeile ist entfallen: gegen einen
       Inline-Stil gewinnt sie ohnehin nie, sie waere toter Code.
   (b) Chip und Detailkopfzeile liegen auf NEUTRALER Flaeche (der Chip auf
       --bg-elevated bzw. --bg-hover, die Kopfzeile in derselben Schachtel
       wie .loc-detail-name, die Schritt 9 nachweislich als neutral
       gemessen und auf --gold-text gestellt hat). Dort gilt die Regel von
       Schritt 9: `--<rolle>-text`. Gemessen min 4,51.
   (c) `class="chip color-${f.color}"` bei :346 bleibt unveraendert — das
       ist eine 20-%-Toenung und faellt unter Entscheidung D-4 (Welle 2).
       Diese Ratsche haelt sie ausdruecklich fest, damit sie nicht
       "mitgenommen" wird.

   DER RUECKFALLWERT IST DER EIGENTLICHE INHALT VON ENTSCHEIDUNG D-7, und
   er ist hier nachgerechnet statt behauptet. Steht in den Kampagnendaten
   ein Farbwert ausserhalb der acht Optionen — aus einer aelteren Fassung,
   aus einem von Hand bearbeiteten Export — dann ist `var(--xyz)` ungueltig
   und die ganze background-Deklaration faellt aus (invalid at computed
   value time): der Aufkleber hat dann GAR KEINE Flaeche und liegt auf der
   Karte. Die Tinte muss also auf der KARTE lesbar sein, nicht auf Gold.
   Der Test rechnet genau das nach. Zur Einordnung, am 2026-09-28 gemessen:
   `var(--on-gold)` — der im Rezept vorgeschlagene Rueckfallwert — traegt
   auf --bg-card dark 1,08 · light 18,88 · sepia 1,08 · contrast 1,00. In
   drei von vier Themes waere der Aufkleber unsichtbar. `var(--text)`
   traegt 8,78-21,00 auf beiden Kartenflaechen.

   SIE IST BEI IHRER GEBURT ROT, mit vier Zeilen: die drei Stellen und die
   tote core.css-Tinte. Gruen wird sie mit Schritt 13.
   =========================================================================== */
describe('R-09 — die Ortsfarben aus dem JS (Ratsche)', () => {
    const QUELLE = path.join(REPO, 'features', 'locations', 'locations-render.js');
    const js = fs.readFileSync(QUELLE, 'utf8');
    /** Die Farboptionen des Filter-Dialogs sind die Wahrheit ueber die
     *  moeglichen Werte — nicht eine Liste in diesem Test. */
    const OPTIONEN = [
        ...(tplFiles
            .find(f => f.name === 'modals-entity.html')
            .content.match(/<select id="filter-color">[\s\S]*?<\/select>/)?.[0]
            .matchAll(/<option value="([\w-]+)"/g) || [])
    ].map(m => m[1]);

    const SCHWELLE = 4.5;

    test('jede waehlbare Filterfarbe hat Flaeche, Tinte und Textwert in allen vier Themes', () => {
        // Gegenprobe zuerst: ohne Optionen prueft die Schleife ueber Leerlauf.
        expect(OPTIONEN.length).toBe(8);
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];
        WCAG.THEMES.forEach(theme => {
            const p = { ...pals[theme], ...alias };
            OPTIONEN.forEach(farbe => {
                [`--${farbe}`, `--on-${farbe}`, `--${farbe}-text`].forEach(tok => {
                    if (!(tok in p)) befunde.push(`${theme}: ${tok} fehlt`);
                });
            });
        });
        expect(befunde.sort()).toEqual([]);
    });

    test('die drei JS-Stellen schreiben die richtige Tokenfamilie', () => {
        const befunde = [];

        // (a) Aufkleber: Flaeche UND Tinte, die Tinte mit Rueckfallwert.
        if (!/class="loc-item-tag"[^`]*background:\s*var\(--\$\{filter\.color\}\)/.test(js)) {
            befunde.push(
                'locations-render.js: der Aufkleber .loc-item-tag fuellt nicht mehr mit ' +
                    'var(--${filter.color}) — dann handelt der Rest dieser Ratsche von nichts'
            );
        }
        if (!/class="loc-item-tag"[^`]*color:\s*var\(--on-\$\{filter\.color\}\s*,/.test(js)) {
            befunde.push(
                'locations-render.js: der Aufkleber .loc-item-tag setzt keine eigene Tinte ' +
                    'var(--on-${filter.color}, …). Auf einer vollen Akzentflaeche gehoert sie ' +
                    'dorthin, und ohne Rueckfallwert bricht ein alter gespeicherter Farbwert sie'
            );
        }

        /* (b) Keine Stelle setzt die ROLLE selbst als Textfarbe.
           Der Praefixschutz `(^|[^-\w])` ist nicht Kosmetik, sondern beim
           ersten Lauf dieser Ratsche gemessen: ohne ihn liest `border-color:
           var(--${f.color})` in Zeile 66 als `color:` mit, und die Stelle
           steht doppelt in der Fundliste. Dasselbe Zaehlartefakt hat in der
           Planung zu Handoff v3 sieben angebliche `color: var(--gold-dim)`
           erzeugt, die alle `border-color` waren. */
        for (const m of js.matchAll(/(?:^|[^-\w])color:\s*var\(\s*--\$\{([^}]+)\}\s*\)/g)) {
            const vor = js.slice(0, m.index).split('\n').length;
            befunde.push(
                `locations-render.js:${vor} setzt \`color: var(--\${${m[1]}})\` — die Rolle ` +
                    `selbst. Auf neutraler Flaeche gehoert dort --<rolle>-text hin, auf einer ` +
                    `Akzentflaeche --on-<rolle>`
            );
        }

        // (c) Die Toenungsstelle bleibt, wie sie ist (D-4, Welle 2).
        if (!/class="chip color-\$\{f\.color\}"/.test(js)) {
            befunde.push(
                'locations-render.js: die Toenungsstelle `class="chip color-${f.color}"` ist ' +
                    'weg. Sie faellt unter D-4 und gehoert in Welle 2, nicht hierher'
            );
        }

        // (d) Die tote Tinte in core.css.
        const core = cssFiles.find(f => f.name === 'core.css');
        const regel = regelnMitRumpf(core.content).find(r => r.sel === '.loc-item-tag');
        expect(regel).toBeDefined();
        const tinte = deklaration(regel.rumpf, 'color');
        if (tinte) {
            befunde.push(
                `core.css:${regel.zeile} .loc-item-tag setzt \`color: ${tinte}\`. Gegen den ` +
                    `Inline-Stil derselben Elemente gewinnt sie nie — das ist toter Code, und ` +
                    `solange sie dasteht, sieht sie aus wie die gueltige Tinte`
            );
        }

        expect(befunde.sort()).toEqual([]);
    });

    test('der Rueckfallwert des Aufklebers ist auf der KARTE lesbar, nicht auf Gold', () => {
        /* Warum die Karte und nicht die Akzentflaeche: der Rueckfallwert
           greift genau dann, wenn `--<farbe>` unbekannt ist — und dann ist
           auch `background: var(--<farbe>)` ungueltig und faellt komplett
           aus. Der Aufkleber liegt in diesem Fall ohne eigene Flaeche auf
           der Karte. Eine Tinte, die nur auf Gold gut aussieht, hilft
           gerade dort nicht. */
        const m = js.match(/color:\s*var\(--on-\$\{filter\.color\}\s*,\s*var\((--[\w-]+)\)\s*\)/);
        expect(m).not.toBeNull();
        const rueckfall = m[1];
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];
        WCAG.THEMES.forEach(theme => {
            const p = { ...pals[theme], ...alias };
            const r = WCAG.minRatioOverSurfaces(rueckfall, ['--bg-card', '--bg-dark'], p);
            if (r.min === null) {
                befunde.push(`${theme}: ${rueckfall} oder eine Kartenflaeche ist nicht aufloesbar`);
                return;
            }
            if (r.min < SCHWELLE) {
                befunde.push(
                    `${theme}: der Rueckfallwert ${rueckfall} traegt auf ${r.worst} nur ` +
                        `${r.min} < ${SCHWELLE}. Greift der Rueckfall, hat der Aufkleber keine ` +
                        `eigene Flaeche mehr und liegt auf der Karte`
                );
            }
        });
        expect(befunde.sort()).toEqual([]);
    });
});
