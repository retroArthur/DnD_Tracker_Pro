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

    /* ACHTUNG BEIM KOMMENTIEREN VON CSS — diese Falle ist in Welle 1 dreimal
       zugeschnappt (W1-B in variables.css, W1-C in pwa.css, W1-E in core.css).
       Der Test unten liest `cssAll`, also die Dateien MIT ihren Kommentaren.
       Wer in einem CSS-Kommentar einen Platzhalter in var()-Schreibweise
       benutzt — etwa "var(--<rolle>)" oder "var(--attr-<a>)" —, dem liest die
       Regex daraus ein Token wie `--` oder `--attr-` heraus und meldet es als
       undefiniert. Der Test geht rot, obwohl kein einziges CSS falsch ist.
       Abhilfe: im Kommentar die Tokennamen ausschreiben (var(--attr-str) bis
       var(--attr-cha)) oder die var()-Klammern ganz weglassen.
       Warum die Kommentare nicht einfach entfernt werden: der Test soll auch
       einen auskommentierten var()-Aufruf finden, der beim Wiedereinschalten
       ins Leere zeigen wuerde. */
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

    /* HIER STANDEN ZWEI TESTS ZU DEN rgba()-KANAELEN, entfernt am 2026-09-29
       (Welle 2, Schritt 2), weil die Mechanik selbst entfallen ist:

         - "rgba()-Kanaele sind in JEDEM Theme definiert, nicht nur im
           Dark-Block" haette die Entfernung viermal rot gemeldet.
         - "F-01b: keine abweichenden Fallbacks mehr an den rgba()-Kanaelen"
           waere NICHT rot geworden, sondern inhaltsleer gruen — er suchte
           nach var(--<rolle>-rgb, <fallback>) und findet nichts mehr, weil es
           die Namen nicht mehr gibt. Ein gruener Test, der nichts prueft, ist
           schlimmer als keiner; deshalb faellt auch er.

       Was beide zusammen zusicherten — dass eine Farbe nicht in zwei
       Schreibweisen gefuehrt wird, die auseinanderlaufen koennen —, sichert
       jetzt die Abwesenheit der Mechanik selbst: color-mix nimmt das
       Hex-Token direkt, es gibt keine zweite Quelle mehr. F-01 (Test 1 oben)
       wacht darueber, dass kein var() ins Leere zeigt, und R-10 am Dateiende
       darueber, dass die Literale nicht auf anderem Weg zurueckkommen. */
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
 * CSS ohne die Zweige, die in KEINEM Browser oberhalb des dokumentierten
 * Bodens greifen — heute genau die Form `@supports not (...)`.
 *
 * WOGEGEN DAS STEHT. Jedes Modell dieser Datei liest Tokens nach der Regel
 * "letzter Treffer gewinnt" (aliasSchicht) oder zaehlt Bloecke je Token
 * (themenblindeTokens). Beide Regeln sind fuer flach nebeneinander liegende
 * Bloecke richtig und fuer einen @supports-not-Zweig FALSCH: dessen
 * Deklarationen stehen zwar spaeter in der Datei, greifen aber nur dort, wo
 * die Fassung fehlt — also nirgends, wo diese App laeuft (Browserboden in
 * DEVELOPMENT.md). Ohne diese Maskierung urteilt das Testnetz ueber den
 * Rueckfallzweig statt ueber das, was der Nutzer sieht. Gemessen, nicht
 * vermutet: der Rueckfall aus Schritt 11 liess R-03 und R-04 auf einmal
 * ANDERE Zahlen melden (`.calc-action-btn.primary:hover` sprang von 5,10 auf
 * 5,73), obwohl im Browser keine einzige Farbe anders war.
 *
 * NUR DIE VERNEINTE FORM. Ein positiver `@supports (...)`-Zweig kann greifen
 * oder nicht — das haengt an der Bedingung und am Boden und ist keine Frage,
 * die eine Regex beantworten darf. Deshalb wirft diese Funktion bei einem
 * positiven Zweig HART, statt ihn stillschweigend als "gilt immer" zu
 * behandeln. Wer einen einfuehrt, entscheidet hier bewusst.
 *
 * Zeilentreu: der Rumpf wird durch Leerzeichen ersetzt, Zeilenumbrueche
 * bleiben stehen. Befunde, die Zeilennummern nennen, verschieben sich nicht.
 *
 * Kommentare zaehlen nicht mit — sonst liest die Suche das Wort "@supports"
 * aus dem Erklaertext, der neben dem Zweig steht, und wirft ueber einem
 * Satzzeichen.
 */
function ohneUnerreichbareZweige(css) {
    /* Gesucht wird in einer Fassung OHNE Kommentartext, geschnitten wird am
       Original. Beide sind zeichengleich lang, die Stellen passen also
       aufeinander. Ohne diesen Schritt wuerde das Wort "@supports" in einem
       erklaerenden Kommentar — und genau so einen traegt variables.css an
       dieser Stelle — als Zweig gelesen. */
    const maske = css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
    let out = '';
    let i = 0;
    while (i < css.length) {
        const at = maske.indexOf('@supports', i);
        if (at === -1) {
            out += css.slice(i);
            break;
        }
        const auf = maske.indexOf('{', at);
        if (auf === -1) {
            out += css.slice(i);
            break;
        }
        const bedingung = maske.slice(at + '@supports'.length, auf).trim();
        let tiefe = 1;
        let j = auf + 1;
        while (j < maske.length && tiefe) {
            if (maske[j] === '{') tiefe++;
            else if (maske[j] === '}') tiefe--;
            j++;
        }
        if (!/^not\b/.test(bedingung)) {
            throw new Error(
                `design-consistency: positiver @supports-Zweig gefunden ("@supports ${bedingung}"). ` +
                    'Das Testmodell kann nicht entscheiden, ob er oberhalb des Browserbodens greift. ' +
                    'Entweder den Zweig verneint schreiben oder diese Funktion um ein bewusstes ' +
                    'Urteil erweitern — stillschweigend "gilt immer" waere ein Fehlurteil.'
            );
        }
        out += css.slice(i, at);
        out += css.slice(at, j).replace(/[^\n]/g, ' ');
        i = j;
    }
    return out;
}

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
    let rest = ohneUnerreichbareZweige(cssFiles.find(f => f.name === 'variables.css').content);
    WCAG.THEMES.forEach(t => {
        rest = rest.replace(WCAG.blockRegexFor(t), '\n');
    });
    const out = {};
    // Letzter Treffer gewinnt — das ist die Kaskade.
    for (const m of rest.matchAll(WCAG.DECL_RE)) out[m[1]] = m[2].trim();
    return out;
}

describe('Testmodell — unerreichbare @supports-Zweige (Selbstprobe)', () => {
    /* WARUM MIT KUNST-CSS und nicht gegen variables.css: die Probe soll die
       Maskierung belegen, nicht den heutigen Dateiinhalt. Faellt der eine
       Zweig aus variables.css wieder heraus, muss diese Probe gruen BLEIBEN —
       sonst waere sie eine zweite Fassung derselben Aussage und nichts
       wert. */
    const KUNST_CSS = [
        ':root {',
        '    --a: rot;',
        '}',
        '@supports not (color: color-mix(in srgb, #000 50%, #fff)) {',
        '    :root {',
        '        --a: blau;',
        '    }',
        '}'
    ].join('\n');

    test('der verneinte Zweig verschwindet, die Zeilenzahl bleibt', () => {
        const ohne = ohneUnerreichbareZweige(KUNST_CSS);
        expect(ohne).not.toMatch(/blau/);
        expect(ohne).toMatch(/--a: rot;/);
        expect(ohne.split('\n').length).toBe(KUNST_CSS.split('\n').length);
    });

    test('ohne @supports bleibt der Text Zeichen fuer Zeichen derselbe', () => {
        const flach = ':root {\n    --a: rot;\n}\n';
        expect(ohneUnerreichbareZweige(flach)).toBe(flach);
    });

    test('ein positiver Zweig wirft, statt stillschweigend zu gelten', () => {
        const positiv = '@supports (display: grid) {\n    :root {\n        --a: blau;\n    }\n}\n';
        expect(() => ohneUnerreichbareZweige(positiv)).toThrow(/positiver @supports-Zweig/);
    });

    test('das Wort im Kommentar ist kein Zweig', () => {
        /* Diese Falle ist beim Schreiben von Schritt 11 zugeschnappt: der
           Erklaertext neben dem Rueckfall in variables.css nennt @supports
           beim Namen, und die erste Fassung der Funktion las daraus einen
           positiven Zweig — sieben Ratschen warfen auf einmal ueber einem
           Halbsatz. */
        const mitKommentar = '/* @supports ist der einzige Weg. */\n:root {\n    --a: rot;\n}\n';
        expect(() => ohneUnerreichbareZweige(mitKommentar)).not.toThrow();
        expect(ohneUnerreichbareZweige(mitKommentar)).toBe(mitKommentar);
    });

    test('ohne die Maskierung waere das Modell anders — die Probe zeigt den Unterschied', () => {
        // Gegenprobe: dieselbe Kaskadenregel wie in aliasSchicht(), einmal mit
        // und einmal ohne Maskierung. Waere der Unterschied leer, maskierte
        // die Funktion nichts und alle drei Proben darueber waeren gruen ohne
        // Aussage.
        const letzter = css => {
            let v = null;
            for (const m of css.matchAll(WCAG.DECL_RE)) if (m[1] === '--a') v = m[2].trim();
            return v;
        };
        expect(letzter(KUNST_CSS)).toBe('blau');
        expect(letzter(ohneUnerreichbareZweige(KUNST_CSS))).toBe('rot');
    });
});

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

       WAS DIESE RATSCHE NICHT PRUEFT, UND WER ES SEIT SCHRITT 8 TUT —
       Entscheidung D-4. Gemeint sind die 108 Stellen, an denen Akzenttext auf
       einer TOENUNG DERSELBEN Rolle sitzt. Prototyp ist die Gruppe
       `.color-<rolle>` in core.css, heute :583-590 und nicht :579-586 wie
       D-4 schreibt — die Anker haben sich seit der Planung verschoben. Dazu
       die FUENF `.dms-skill-header`-Regeln (D-4 nennt sechs; eine .con-Regel
       gibt es nicht, und die Schnellreferenz fuehrt keine KON-Zelle, R-08).

       "20-%-Toenung" ist eine Naeherung: nur 60 der 107 heutigen Stellen
       liegen bei 20 %, die Staerken reichen von 10 bis 30 %. Eine Regel, die
       20 % festschreibt, liesse 47 Stellen unberuehrt.

       In Welle 1 blieben sie unangetastet, weil Tinte und Toenungsstaerke
       rechnerisch nicht unabhaengig sind. WELLE 2 SCHRITT 8 hat beides in
       einem Zug entschieden (E2: Tinte --<rolle>-text, Staerke gedeckelt auf
       13/7/7/20 % je Theme) — und die Pruefung sitzt NICHT hier, sondern in
       R-04: `ruheRegeln()` loest seither die Toenung ueber den drei
       Traegerflaechen auf, statt sie zu verwerfen. R-02 urteilt weiter ueber
       TOKENWERTE, R-04 ueber Verwendungsstellen; die Arbeitsteilung bleibt
       wie sie war.

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
       orange-dim 1).

       DIE DIFFERENZ ZU DEN 108 IST INZWISCHEN GEKLAERT (Welle 2, Schritt 8),
       und sie betraegt EINS, nicht drei. Richtig ist 109 = die 108 plus
       core.css .condition-prone, das mit `color: var(--orange-dim)` auf
       rgba(180,83,9,0.2) sass und deshalb gegen --orange-dim zu rechnen war,
       nicht gegen --orange. Die zwei uebrigen Posten der 111 gehoeren nicht
       dazu:
         · dashboard.css `.wiki-link` — Cyan auf einer VIOLETTEN Toenung, also
           eine FREMDE Rolle. Der Kommentar an der Regel sagt das selbst. Die
           Kategorie hat nur "Rollentinte auf rgba-Literal" gezaehlt und den
           Rollenvergleich nie gemacht.
         · party.css `.cf-combat-stat .cf-speed-ft` — Grenzfall: die Tinte ist
           --cyan, das Literal war rgba(0,180,216,·) und liegt im RGB-Raum 127
           von --cyan #7ec4cf entfernt, also ausserhalb der Aehnlichkeits-
           schranke, mit der die 108 gezaehlt wurden. Dieselbe Stelle, zwei
           Zaehlweisen.
       Massgeblich fuer Welle 1 blieb ohnehin nur, dass die Zahl sich waehrend
       des Schritts nicht bewegt hat.

       DIE KATEGORIE SELBST GIBT ES SEIT SCHRITT 7 NICHT MEHR: im
       Komponenten-CSS steht ausserhalb der Schatten kein rgba-Literal mehr
       (R-10). Wer heute nachzaehlt, zaehlt color-mix-Toenungen, und das sind
       128 Regeln — die Menge, die R-04 seit Schritt 8 beurteilt.

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
    /** Attributkuerzel liegen auf ZWEI Flaechen — wieder, seit Welle 2
     *  Schritt 9. Die Geschichte dieser Liste gehoert dazu, weil sie schon
     *  einmal aus dem falschen Grund zwei Eintraege hatte:
     *
     *  (a) --bg-hover FEHLTE bis zum 2026-09-28. `.attr-str`..`.attr-cha` sind
     *      direkte Kinder von `.qref-row` (modals-editors.html:370-376), und
     *      dashboard.css fuehrte BEIDE Zustaende: `.qref-row` auf --bg-card und
     *      `.qref-row:hover` auf --bg-hover. Der Hover-Zustand ist beim Lesen
     *      einer Zeile nicht die Ausnahme, sondern der Normalfall. Ohne diese
     *      Flaeche war die Teilformel gruen, waehrend 10 der 12
     *      Light-/Sepia-Zellen dort unter 4,5 lagen (3,66-4,21) — genau die
     *      Auslassung, gegen die D-2 eine Teilformel weiter oben geschrieben
     *      ist. Sie kam deshalb dazu.
     *  (b) `.cf-coin-label` gehoerte nie hierher: party.css faerbt es mit
     *      --coin-pm/-gm/-sm/-km und --green, nie mit einem Attributtoken. Die
     *      Traeger auf --bg-dark sind `.dms-attr-item` und `.dms-save-item`.
     *  (c) SEIT SCHRITT 9 IST --bg-hover WIEDER DRAUSSEN, und zwar nicht, weil
     *      die Messung sich geaendert haette, sondern weil es die Flaeche nicht
     *      mehr gibt: Entscheidung E3 meldet das Ueberfahren der
     *      Schnellreferenz-Zeile ueber einen Umriss statt ueber eine Fuellung.
     *      Dass das so bleibt, behauptet nicht dieser Kommentar, sondern die
     *      Ratsche "die Attributkuerzel liegen auf genau den Flaechen …" weiter
     *      unten — sie zaehlt die Flaechen aller drei Traeger nach.
     *
     *  --bg-elevated bleibt BEWUSST draussen, anders als bei den Rollen: kein
     *  Attributkuerzel erreicht diese Flaeche. Die tragenden Behaelter setzen
     *  ihren eigenen deckenden Hintergrund (--bg-card/--bg-hover bzw.
     *  --bg-dark), damit ist der Hintergrund ihrer Eltern gleichgueltig. Eine
     *  Flaeche mitzupruefen, die es nicht gibt, waere keine schaerfere Ratsche,
     *  sondern eine unbelegte. Die vierte denkbare Flaeche — die 20-%-Toenung
     *  derselben Rolle in den FUENF `.dms-skill-header`-Regeln (dmscreen.css,
     *  heute :1870-1874; D-4 nennt sechs Regeln und :1771-1775, beides ist
     *  ueberholt) — war durch D-4 erst Welle 2 und ist seit Schritt 8
     *  erledigt: die Toenung bleibt, die Tinte ist var(--text). Die
     *  Attributfarben treten dort gar nicht mehr als Schrift auf, die
     *  Teilformel muss sie also auch nicht gegen diese Flaeche pruefen. */
    const ATTR_FLAECHEN = ['--bg-dark', '--bg-card'];

    /** BENANNTE AUSNAHME zu Teilformel 3 — SEIT WELLE 2 SCHRITT 9 LEER, und
     *  das absichtlich statt abwesend (wie EXEC_COMMAND_ALLOWLIST in
     *  editor-floating.spec.js): die Maschinerie unten bleibt stehen, damit
     *  eine kuenftige Ausnahme wieder namentlich mit ihrem gemessenen Wert
     *  eingetragen und in der Aktenlage gefuehrt werden MUSS und nicht als
     *  stille Freigabe durchgeht.
     *
     *  WAS HIER STAND: acht Zellen, die Entscheidung D-5 eingefroren hatte
     *  ("Dark/Contrast behalten ihre Werte, ausser die Weisheit") und die auf
     *  --bg-hover bei 3,16-3,58 lagen — dark str 3,36 int 3,44 wis 3,28
     *  cha 3,58 · contrast str 3,16 int 3,44 wis 3,28 cha 3,58. Sie
     *  anzuheben hiesse, eine Nutzerentscheidung zu ueberschreiben; sie still
     *  zu lassen hiesse, die Ratsche etwas Falsches behaupten zu lassen.
     *
     *  WARUM SIE WEG SIND, ohne dass eine Farbe sich geaendert hat:
     *  Entscheidung E3 hat die dritte Flaeche abgeschafft statt die acht
     *  Werte. Auf den verbliebenen zwei halten alle sechs Kuerzel in allen
     *  vier Themes (dark 4,52-8,10 · light 5,66-5,74 · sepia 4,98-5,05 ·
     *  contrast 4,72-8,79). D-5 bleibt damit unangetastet, und D-6 bewegt
     *  sich nicht — beides war der Grund, E3 der Aufhellung vorzuziehen.
     *  Die acht Tabellenzeilen in der Aktenlage sind im selben Commit
     *  entfallen; die Ratsche darunter prueft beide Richtungen. */
    const ATTR_HOVER_AUSNAHME = {};
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
                            `(3) ${theme} ${token} ${wert(token)}: min${ATTR_FLAECHEN.length} ` +
                                `${m.min} < ${TEXT_SCHWELLE} (schlechteste Flaeche ${m.worst})`
                        );
                    }
                    return;
                }
                /* Eingetragene Ausnahme. Sie deckt AUSSCHLIESSLICH die eine
                   Flaeche, auf der sie sich beruft, und auch dort nur den
                   eingetragenen Stand. Die Liste ist seit Schritt 9 leer, der
                   Zweig laeuft also nicht — er bleibt stehen, damit ein
                   kuenftiger Eintrag dieselbe Pruefung bekommt wie die acht,
                   die hier standen. Welche Flaeche gemeint ist, sagt der
                   Eintrag selbst, statt dass ein Name fest verdrahtet waere:
                   die alte Fassung nannte --bg-hover woertlich und waere nach
                   dem Streichen dieser Flaeche stumm undefined gelaufen. */
                const AUSNAHMEFLAECHE = ATTR_FLAECHEN[ATTR_FLAECHEN.length - 1];
                const gedeckt = m.values[AUSNAHMEFLAECHE];
                const uebrige = ATTR_FLAECHEN.filter(f => f !== AUSNAHMEFLAECHE);
                const ohne = uebrige.length
                    ? Math.min(...uebrige.map(f => m.values[f]))
                    : Infinity;
                if (ohne < TEXT_SCHWELLE) {
                    befunde.push(
                        `(3) ${theme} ${token} ${wert(token)}: min ohne ${AUSNAHMEFLAECHE} ` +
                            `${ohne} < ${TEXT_SCHWELLE} — die Ausnahme deckt nur ` +
                            `${AUSNAHMEFLAECHE}`
                    );
                }
                if (gedeckt < eingetragen) {
                    befunde.push(
                        `(3) ${theme} ${token} ${wert(token)}: auf ${AUSNAHMEFLAECHE} ` +
                            `${gedeckt}, eingetragen war ${eingetragen} — die benannte ` +
                            `Ausnahme verschlechtert sich`
                    );
                }
                if (gedeckt >= TEXT_SCHWELLE) {
                    befunde.push(
                        `(3) ${theme} ${token} ${wert(token)}: haelt auf ${AUSNAHMEFLAECHE} ` +
                            `jetzt ${gedeckt} — Eintrag aus ATTR_HOVER_AUSNAHME entfernen`
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

    /** DRITTE RATSCHE dieses Blocks, seit Welle 2 Schritt 9 (Entscheidung E3).
     *
     *  SIE TRAEGT DIE TEILFORMEL 3. ATTR_FLAECHEN fuehrt seit Schritt 9 nur
     *  noch zwei Flaechen statt drei, und das ist keine Abschwaechung, sondern
     *  eine Tatsachenaenderung: die Schnellreferenz-Zeile meldet das
     *  Ueberfahren nicht mehr ueber ihre Fuellung, sondern ueber einen Umriss.
     *  Damit gibt es die dritte Traegerflaeche nicht mehr.
     *
     *  Eine Behauptung dieser Art gehoert nicht in einen Kommentar. Schreibt
     *  jemand die Fuellung zurueck — und sei es als "kleine Verbesserung" —,
     *  dann faellt Teilformel 3 lautlos auf eine Flaeche zurueck, die sie gar
     *  nicht mehr prueft, und die vier Kuerzel stehen wieder bei 3,16-3,58,
     *  ohne dass ein Test das meldet. Diese Ratsche ist genau diese Meldung.
     *
     *  SIE ZAEHLT DIE FLAECHEN ALLER TRAEGER, nicht nur der einen Regel: die
     *  Schnellreferenz-Zeile in jeder ihrer Zustandsformen UND die beiden
     *  DM-Screen-Widgets, die dieselben Tokens als Schrift fuehren. Wer einen
     *  vierten Traeger anlegt, bekommt ihn hier gemeldet, nicht erst beim
     *  Nachmessen. */
    const ATTR_TRAEGER = [
        // Selektor-Teilstring, erwartete Flaechenmenge, wo die Regel steht.
        { datei: 'dashboard.css', teil: '.qref-row', flaechen: ['var(--bg-card)'] },
        { datei: 'dmscreen.css', teil: '.dms-attr-item', flaechen: ['var(--bg-dark)'] },
        { datei: 'dmscreen.css', teil: '.dms-save-item', flaechen: ['var(--bg-dark)'] }
    ];

    test('die Attributkuerzel liegen auf genau den Flaechen, die Teilformel 3 prueft', () => {
        // Gegenprobe: ohne Traeger prueft die Schleife ueber Leerlauf.
        expect(ATTR_TRAEGER.length).toBe(3);

        const befunde = [];
        ATTR_TRAEGER.forEach(t => {
            const f = cssFiles.find(x => x.name === t.datei);
            if (!f) {
                befunde.push(`${t.datei} fehlt — dann handelt der Rest dieser Ratsche von nichts`);
                return;
            }
            const regeln = regelnMitRumpf(f.content).filter(r => r.sel.includes(t.teil));
            if (!regeln.length) {
                befunde.push(
                    `${t.datei}: keine Regel mit "${t.teil}" — der Traeger ist umbenannt oder ` +
                        `weg, und Teilformel 3 prueft seither eine Flaeche, die es nicht gibt`
                );
                return;
            }
            const gefunden = new Set();
            regeln.forEach(r => {
                ['background', 'background-color'].forEach(eig => {
                    const w = deklaration(r.rumpf, eig);
                    if (w) gefunden.add(w.trim());
                });
            });
            const ueberzaehlig = [...gefunden].filter(w => !t.flaechen.includes(w)).sort();
            ueberzaehlig.forEach(w =>
                befunde.push(
                    `${t.datei} "${t.teil}" setzt die Flaeche ${w}. Teilformel 3 prueft die ` +
                        `Attributkuerzel nur gegen ${ATTR_FLAECHEN.join(' und ')} — eine ` +
                        `weitere Flaeche ist damit ungeprueft. Auf --bg-hover (#333 in Dark ` +
                        `und Contrast) fallen vier der sechs auf 3,16-3,58; genau deshalb hat ` +
                        `Entscheidung E3 die Fuellung beim Ueberfahren durch einen Umriss ` +
                        `ersetzt`
                )
            );
            t.flaechen
                .filter(w => !gefunden.has(w))
                .forEach(w =>
                    befunde.push(
                        `${t.datei} "${t.teil}" setzt ${w} nicht mehr — die Flaeche, gegen die ` +
                            `Teilformel 3 rechnet, ist eine andere geworden`
                    )
                );
        });

        expect(befunde.sort()).toEqual([]);
    });

    test('Teilformel 3 rechnet gegen genau diese zwei Flaechen', () => {
        /* Die Liste steht in ZWEI Formen da — als Eingabe der Rechnung und
           als Erwartung hier. Das ist Absicht: wer eine Flaeche ergaenzt oder
           streicht, muss beide beruehren und kommt an der Begruendung oben
           nicht vorbei. --bg-elevated war nie dabei (kein Kuerzel erreicht
           sie), --bg-hover bis Schritt 9. */
        expect(ATTR_FLAECHEN).toEqual(['--bg-dark', '--bg-card']);
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
    const NEUTRAL = /^--(bg|surface|border|overlay|scrim)(-|$)/;

    /* WARUM overlay UND scrim HIER STEHEN (Welle 2, Schritt 3). Sie sind
       nicht neutral im Sinne des Absatzes darueber — sie sind ueberhaupt
       KEINE Flaeche. `--overlay-*` und `--scrim-*` sind halbdurchsichtig;
       was eine Tinte darauf tatsaechlich hinter sich hat, ist die Flaeche
       des ELTERN-Elements, und die kennt diese Ratsche nicht. `resolve()`
       liefert fuer die Form `color-mix(..., transparent)` bewusst null, der
       Befund waere also "nicht aufloesbar" — ein Fehlalarm, kein Fund.

       ES GEHT DABEI KEINE DECKUNG VERLOREN. Dieselben sechs Regeln
       (core.css .nav-tab und .nav-tab:hover, .nav-group-btn und
       .nav-group-btn:hover, dashboard.css .conflict-banner .btn,
       dice.css .fdp-close:hover) trugen bis zu diesem Schritt ein nacktes
       `rgba(255,255,255,a)` als Hintergrund und fielen damit schon am
       Filter `^var\((--[\w-]+)\)$` in ruheRegeln() heraus. Die Ratsche hat
       ueber sie nie geurteilt; sie wuerde es jetzt nur deshalb versuchen,
       weil das Literal einen Namen bekommen hat. Der Ausschluss stellt den
       Stand von vorher wieder her, er weicht ihn nicht auf.

       Die eigentliche Luecke — Tinte auf halbdurchsichtiger Auflage ueber
       einer unbekannten Elternflaeche — bleibt offen und ist in
       HANDOFF-V3-OFFENE-PUNKTE.md als solche gefuehrt. Sie zu schliessen
       hiesse, die Elternkette aufzuloesen; das ist kein Nebenzweig dieses
       Schritts. */

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
     *      light 2,41, seit Welle 2 Schritt 6 auf der themenfolgenden
     *      Toenung 2,25), faellt unter D-4 und ist als W1-D-02 gefuehrt. R-05
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

    /* ------------------------------------------------------------------
       WELLE 2, SCHRITT 8 — die Toenungsflaechen kommen HINZU.

       Bis hierher siebte `ruheRegeln()` mit `^var\((--[\w-]+)\)$`. Eine
       Flaeche der Form `color-mix(in srgb, var(--x) N%, transparent)` fiel
       damit heraus, BEVOR ueberhaupt gerechnet wurde — und genau diese Form
       hat Welle 2 in den Schritten 4-7 flaechendeckend erzeugt. R-11 hat den
       blinden Fleck beziffert (128 Regeln setzten Tinte auf eine Toenung, und
       keine wurde beurteilt) und per Mutation belegt: `.calc-diff-badge
       .trivial` von 20 % auf 95 % gestellt, Kontrast rund 1,0 in allen vier
       Themes — kein einziger roter Test.

       AUSGANGSWERT DIESER ERWEITERUNG, gemessen am 2026-09-29 vor der
       CSS-Aenderung: die geurteilte Menge waechst von 160 auf 288 Regeln, die
       128 neuen sind Toenungen — und 116 davon sind Befunde. 114 fallen unter
       4,5 (schlechtester Wert 1,86: `dmscreen .condition-badge.paralyzed` in
       Light), 2 sind ueberhaupt nicht aufloesbar, weil ihre Tinte ueber ein
       nur in dashboard.css definiertes Token laeuft — `.entity-tag.quest` und
       `.entity-tag.spell` mit var(--color-quest)/var(--color-spell). Diese
       zwei standen in KEINER Bestandsliste dieser Welle; der Umweg ueber das
       Zweittoken hat sie vor jeder Zaehlung verborgen.

       Das ist die rote Ratsche, mit der Schritt 8 beginnt; gruen wird sie
       durch die Toenungsregel E2 (Tinte --<rolle>-text, Staerke je Theme
       gedeckelt auf 13/7/7/20 %), nicht durch eine Ausnahmeliste.

       WARUM DREI TRAEGERFLAECHEN UND NICHT VIER. Eine Toenung hat keine eigene
       Farbe; was unter ihr liegt, entscheidet. Gerechnet wird deshalb das
       Minimum ueber `--bg-card`, `--bg-dark` und `--bg-elevated` — dieselbe
       Liste, die R-11 schon fuehrt. `--bg-hover` steht NICHT darin, und das
       ist keine Bequemlichkeit, sondern eine Rechnung: die `--<rolle>-text`-
       Tokens sind in Welle 1 gegen genau diese schlechteste Flaeche auf 4,5
       gerechnet worden. Jede Auflage darueber drueckt sie unter die Schwelle,
       gleich welcher Staerke — mit --bg-hover als Traeger waere der zulaessige
       Deckel in allen vier Themes 0 %, also ein Verbot jeder Toenung
       ueberhaupt. Diese Frage ist nicht D-4, sondern W1-B-01/E3 ("Hover ohne
       Fuellung"): solange eine Zeile ihren Hover ueber eine FLAECHE meldet,
       liegt jede Toenung darin auf einer Flaeche, fuer die ihre Tinte nicht
       gerechnet ist. Sie gehoert zu Schritt 9 und ist dort benannt.

       WORAUF SICH DIE ZAHL 128 UND DAS "0 BEFUNDE" BEZIEHEN, praezisiert nach
       der Pruefung W2-D Runde 2: auf Regeln mit EIGENER Tinte. `ruheRegeln()`
       verlangt `background` UND `color` in derselben Regel. Eine ZUSTANDSregel,
       die nur die Flaeche auf eine Rollen-Toenung wechselt und die Tinte aus
       ihrer Basisregel erbt, faellt vorher heraus:

           .concentration-badge       { color: var(--purple-text); }
           .concentration-badge:hover { background: color-mix(…--purple 30%…); }

       Neun solche Regeln stehen im Baum, fuenf davon unter 4,5 (schlechteste
       `core.css .link-chip:hover`, Dark 2,87) — STAND DER PRUEFUNG W2-D
       Runde 2, hier bewusst stehengelassen und darunter berichtigt. Auch R-03
       sieht sie nicht — sie verwirft jede color-mix-Flaeche und verlangt eine
       `var(--on-*)`-Tinte; R-05 fuehrt eine Liste benannter Zustaende, R-14
       verlangt einen Nachfahren ohne eigene Flaeche. Belegt per Mutation:
       `.concentration-badge:hover` von 30 % auf 95 % gestellt, Kontrast gegen
       1,0 in allen vier Themes — kein einziger roter Test. Gefuehrt als
       offener Punkt W2-D-05.

       BERICHTIGUNG (Nachtrag, 2026-09-29). Beide Zahlen oben sind ueberholt,
       und die Mutationsanleitung ist es auch. Die Akte
       (.planning/HANDOFF-V3-OFFENE-PUNKTE.md) hat den Vorbehalt beim Nachtrag
       bekommen, diese Spiegelstelle nicht — genau die Bauart Auseinanderlaufen,
       gegen die R-06 gebaut ist, nur in die andere Richtung.

       (1) DIE ZAHL NEUN STIMMT WEITER, aber sie zaehlt nur den einen der
           beiden Wege: Tinte aus der EIGENEN Grundregel. Kommt die Tinte aus
           einem NACHFAHREN der Grundregel, ist es dieselbe Bauart und faellt
           trotzdem aus dieser Zaehlung — `dice.css .dice-attr.save:hover`
           (Tinte aus `.dice-attr.save small`) lag mit 4,41 · 4,09 · 4,18 ·
           5,05 in drei Themes darunter und stand in keiner Liste. Beide Wege
           zusammen sind 14 Paare; sie stehen am Ende dieser Datei unter R-18.

       (2) UNTER 4,5 IST VON DEN FUENFEN KEINE MEHR. Vier sind im Nachtrag
           gedeckelt worden, die fuenfte hat Tintenkorrektur und Deckel
           bekommen. Gemessen am Stand danach, min ueber
           --bg-card/--bg-dark/--bg-elevated, dark · light · sepia · contrast:
             core.css .link-chip:hover                4,81 · 4,64 · 4,64 · 4,52
             initiative.css .concentration-badge:hover
                                                      4,57 · 4,57 · 4,60 · 4,74
             initiative.css .concentration-add-btn:hover
                                                      4,81 · 4,57 · 4,60 · 5,31
             pwa.css .pwa-install-btn:active          5,65 · 4,78 · 5,14 · 6,76
             file-backup.css .backup-entry-restore:hover
                                                      4,85 · 4,54 · 4,62 · 5,39
           Der als schlechtester Fall genannte Wert 2,87 existiert nicht mehr.
           Knappster verbliebener Halter der neun ist
           `dashboard.css .dice-formula-chip:hover` mit genau 4,50 in Sepia.

       (3) DIE MUTATIONSANLEITUNG IST INERT GEWORDEN. `.concentration-badge
           :hover` traegt jetzt `min(30%, var(--tint-max))`; weil --tint-max
           13/7/7/20 % ist, ergibt `min(95%, …)` zeichengleich dieselbe Farbe.
           Der Kontrast faellt NICHT gegen 1,0, er bleibt bei 4,57 · 4,57 ·
           4,60 · 4,74. Wer die Probe wiederholt, muss den Deckel MITENTFERNEN
           (`color-mix(in srgb, var(--purple) 95%, transparent)`) — sonst misst
           er den Deckel und haelt das Ergebnis fuer den Beleg der Luecke.

       (4) DIE LUECKE SELBST IST SEIT DEM NACHTRAG GESCHLOSSEN, und zwar nicht
           an R-03, wie es hier urspruenglich stand, sondern in einer eigenen
           Ratsche: R-18 am Ende dieser Datei urteilt ueber beide Wege. Die
           schaerfere Probe von damals — alle vier Deckel zurueck auf BASE,
           volle Suite zeichengleich gruen — laeuft heute rot; sie steht im
           Kopf von R-18 zusammen mit den nachgestellten Zahlen.
       ------------------------------------------------------------------ */

    /** Die Traegerflaechen einer TOENUNG (D-2, Lesart wie R-11). */
    const TOENUNGS_TRAEGER = ['--bg-card', '--bg-dark', '--bg-elevated'];

    /** Eine Toenung: halbdurchsichtige Auflage EINER Rolle. Der Anteil bleibt
     *  ungeparst — seit Schritt 8 steht dort `min(20%, var(--tint-max))` und
     *  nicht mehr nur ein Literal; WCAG.resolveOver() rechnet beides. */
    const TOENUNGSFLAECHE =
        /^color-mix\(\s*in\s+srgb\s*,\s*var\(\s*(--[\w-]+)\s*\)\s+[\s\S]+,\s*transparent\s*\)$/i;

    /* ------------------------------------------------------------------
       KEINE FLAECHE IST AUCH EINE FLAECHE (Pruefung W2-D, Nachtrag Runde 1).

       `background: transparent` ist weder eine Vollton-Rolle noch eine
       Toenung; die Regel fiel damit vor JEDER Rechnung heraus — `voll`
       greift nicht, `TOENUNGSFLAECHE` greift nicht, und
       `mixAusdruecke('transparent')` ist leer. Sichtbar ist die Tinte
       trotzdem, und zwar direkt auf den drei Traegerflaechen, also genau
       wie unter einer 0-%-Toenung. Der einzige Unterschied war, dass
       niemand hinsah.

       WAS DAS GEKOSTET HAT: `file-backup.css .backup-entry-restore` trug
       `color: var(--red)` — die FLAECHENrolle — und las damit
       4,07 · 3,94 · 3,68 · 3,98, also in ALLEN VIER Themes unter 4,5. Das
       ist gewoehnlicher Text und kein Zustand unter der Maus. Behoben im
       selben Nachtrag auf var(--red-text) (5,48 · 5,04 · 5,05 · 5,73).

       DIE MENGE IST KLEIN UND SOLL ES BLEIBEN: 6 Regeln, alle gruen. Der
       Test gleich unter dieser Ratsche zaehlt sie, damit der Zweig nicht
       stillschweigend leerlaeuft.

       ZWEI TINTENARTEN BLEIBEN AUSSEN VOR, und beide haben einen Richter:
       NEUTRALE Textrollen (--text, --text-dim …) gehoeren R-02 Teilformel 2
       — dieselbe Abgrenzung, die der Absatz ueber NEUTRAL ganz oben fuer
       die Flaechen zieht. Und `var(--on-*)`-Tokens NENNEN ihre Flaeche:
       --on-yellow gehoert auf Gelb, --on-log auf die Blende des
       Ereignis-Logs. Sie ohne eigene Flaeche gegen --bg-card zu rechnen
       ergaebe zwei Fehlalarme (party.css .event-log-btn mit 1,87 und
       pwa.css .pwa-update-dismiss mit 1,00), die beide falsch waeren:
       gegen ihre WIRKLICHEN Flaechen lesen sie 6,96-8,12 bzw. 8,11-11,97,
       vorgerechnet in party.css und pwa.css und bewacht von R-17 und von
       dieser Ratsche an der Leiste selbst. */
    const BLANKE_FLAECHE = /^transparent$/i;
    const FREMDE_TINTE = /^--(text|on)(-|$)|^--(bg|surface|border|overlay|scrim)(-|$)/;

    /* ------------------------------------------------------------------
       EINE TOENUNG BLEIBT EINE TOENUNG, AUCH ALS VERLAUFSSTOPP
       (Pruefung W2-D Runde 1, Befund 1/2/4).

       Die Anker `^…$` von TOENUNGSFLAECHE verlangen, dass die GANZE
       Deklaration die Toenung ist. Steht dieselbe Toenung als Stopp in
       einem `linear-gradient(…)`, faellt die Regel heraus — vor jeder
       Rechnung, genau wie vor Schritt 8 die Toenung selbst herausfiel.

       DASS DAS KEINE THEORIE IST, hat die Pruefung an zwei Stellen belegt:
       `spells.css .spell-note` traegt var(--gold) auf einem 10-%-Gelbstopp
       und misst in Light 2,45 — der Zwilling derselben Datei
       (`.editor-btn:hover`, gleiche Rolle, gleiche Staerke, gleicher
       Ausgangswert) ist in Schritt 15 behoben worden, diese Regel acht
       Zeilen davor nicht, weil kein Test sie nannte. Und die einzige
       Ratsche ueber `.concentration-badge` ist in Schritt 8 mit der
       Begruendung entfernt worden, R-04 urteile jetzt an derselben Stelle
       haerter — was fuer die drei anderen Eintraege stimmte, fuer diese
       eine aber nicht: ihre Flaeche ist ein Verlauf. Seit dieser
       Erweiterung stimmt es fuer alle vier.

       GEURTEILT WIRD JEDER ROLLEN-TOENUNGSSTOPP EINZELN, und die Regel
       bekommt den schlechtesten davon — ein Verlauf malt jeden seiner
       Stopps, also muss jeder tragen.

       WAS SIE WEITERHIN NICHT SIEHT, und das ist eine Grenze und kein
       Versehen: DECKENDE Verlaufsstopps (`linear-gradient(…, var(--red),
       var(--red-dark))`). Sie sind eine andere Bauart — unter einem
       deckenden Stopp liegt keine Traegerflaeche, die Rechnung braucht
       also nicht das Minimum ueber drei Flaechen, sondern den Stopp
       selbst. Im Baum sind es 10 Regeln (3x Rot-Verlauf mit
       var(--ink-on-dark), 7x Vorlese-Papier); gemessen halten die sieben
       Papierregeln 7,13-11,87 in allen vier Themes. Gefuehrt als offener
       Punkt W2-D-04. */

    /** Alle `color-mix(…)`-Teilausdruecke eines Werts, klammergenau
     *  abgegrenzt. Eine Regex mit `[^)]*` waere hier falsch: der Anteil
     *  `min(20%, var(--tint-max))` bringt seit Schritt 8 eigene Klammern
     *  UND ein eigenes Komma mit. */
    function mixAusdruecke(wert) {
        const out = [];
        const re = /color-mix\s*\(/gi;
        let m;
        while ((m = re.exec(wert))) {
            let tiefe = 0;
            let i = m.index + m[0].length - 1;
            for (; i < wert.length; i++) {
                if (wert[i] === '(') tiefe++;
                else if (wert[i] === ')') {
                    tiefe--;
                    if (!tiefe) break;
                }
            }
            if (tiefe === 0) out.push(wert.slice(m.index, i + 1));
        }
        return out;
    }

    function ruheRegeln() {
        const out = [];
        cssFiles.forEach(f => {
            if (f.name === 'variables.css' || f.name === 'fonts.css') return;
            regelnMitRumpf(f.content).forEach(r => {
                const roh = deklaration(r.rumpf, 'background(?:-color)?');
                const tinte = deklaration(r.rumpf, 'color');
                if (!roh || !tinte) return;
                // Mehrzeilige Verlaeufe lesbar halten — die Zeichenfolge steht
                // in jeder Befundmeldung.
                const flaeche = roh.replace(/\s+/g, ' ');
                if (BLANKE_FLAECHE.test(flaeche)) {
                    const tm = tinte.match(/^var\((--[\w-]+)\)$/);
                    if (!tm || FREMDE_TINTE.test(tm[1])) return;
                    out.push({ ...r, datei: f.name, flaeche, tinte, stopps: null, blank: true });
                    return;
                }
                const voll = flaeche.match(/^var\((--[\w-]+)\)$/);
                const toenung = voll ? null : flaeche.match(TOENUNGSFLAECHE);
                const rolle = voll ? voll[1] : toenung ? toenung[1] : null;
                if (rolle) {
                    if (NEUTRAL.test(rolle)) return;
                    out.push({ ...r, datei: f.name, flaeche, tinte, stopps: null });
                    return;
                }
                // Verlauf: jede Rollen-Toenung darin zaehlt einzeln.
                const stopps = mixAusdruecke(flaeche).filter(x => {
                    const m = x.match(TOENUNGSFLAECHE);
                    return m && !NEUTRAL.test(m[1]);
                });
                if (!stopps.length) return;
                out.push({ ...r, datei: f.name, flaeche, tinte, stopps });
            });
        });
        return out;
    }

    /** Das schlechteste Verhaeltnis EINER Regel in EINEM Theme.
     *  Volle Flaeche: eine Zahl. Toenung: das Minimum ueber die drei Traeger.
     *  Verlauf: dasselbe, zusaetzlich ueber alle Rollenstopps minimiert.
     *  Blanke Flaeche (`transparent`): die Tinte liegt unvermittelt auf dem
     *  Traeger, also dasselbe Minimum ueber dieselben drei Flaechen. */
    function verhaeltnis(regel, p) {
        const tinte = WCAG.resolve(regel.tinte, p);
        if (!tinte) return { fehlt: regel.tinte };
        if (regel.blank) {
            let min = Infinity;
            let fehlt = null;
            TOENUNGS_TRAEGER.forEach(s => {
                const grund = WCAG.resolve(`var(${s})`, p);
                if (!grund) {
                    fehlt = fehlt || `var(${s})`;
                    return;
                }
                min = Math.min(min, WCAG.ratio(tinte, grund));
            });
            if (fehlt) return { fehlt };
            return { wert: Number(min.toFixed(2)) };
        }
        if (!regel.stopps && /^var\(--[\w-]+\)$/.test(regel.flaeche)) {
            const grund = WCAG.resolve(regel.flaeche, p);
            if (!grund) return { fehlt: regel.flaeche };
            return { wert: WCAG.ratio2(tinte, grund) };
        }
        const flaechen = regel.stopps || [regel.flaeche];
        let min = Infinity;
        let fehlt = null;
        flaechen.forEach(fl => {
            TOENUNGS_TRAEGER.forEach(s => {
                const grund = WCAG.resolve(`var(${s})`, p);
                const feld = grund ? WCAG.resolveOver(fl, p, grund) : null;
                if (!feld) {
                    fehlt = fehlt || `${fl} ueber ${s}`;
                    return;
                }
                min = Math.min(min, WCAG.ratio(tinte, feld));
            });
        });
        if (fehlt) return { fehlt };
        return { wert: Number(min.toFixed(2)) };
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
                const v = verhaeltnis(regel, p);
                if (v.fehlt) {
                    fehlt = fehlt || `${theme}: ${v.fehlt}`;
                    return;
                }
                werte[theme] = v.wert;
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

    /** DIE BLANKEN FLAECHEN NAMENTLICH (Pruefung W2-D, Nachtrag Runde 1).
     *  Ohne diesen Test kann der `transparent`-Zweig stillschweigend
     *  leerlaufen — genau die Bauart Fehler, die ihn noetig gemacht hat.
     *  Sechs Regeln setzen `background: transparent` mit einer Rollentinte;
     *  `.backup-entry-restore` ist die, die mit var(--red) in allen vier
     *  Themes durchfiel und im selben Nachtrag auf var(--red-text) gezogen
     *  wurde. Waechst die Zahl, ist die neue Stelle mitgerechnet worden. */
    test('die Regeln mit blanker Flaeche stehen namentlich unter Aufsicht', () => {
        const blank = ruheRegeln().filter(r => r.blank);
        expect(blank.map(r => `${r.datei} ${r.sel}`).sort()).toEqual([
            'core.css .btn-text:hover',
            'dashboard.css .char-attr-box .attr-input',
            'file-backup.css .backup-entry-restore',
            'file-backup.css .backup-warning-indicator',
            'initiative.css .concentration-add-btn',
            'pwa.css .pwa-install-btn'
        ]);
    });

    /** DIE BEIDEN VERLAUFSREGELN NAMENTLICH (Pruefung W2-D Runde 1). Es sind
     *  im Baum genau zwei Regeln, die ihre Toenung als Verlaufsstopp fuehren
     *  UND eine eigene Tinte setzen; beide waren bis zu dieser Erweiterung
     *  unsichtbar. `.concentration-badge` ist dabei der Beleg fuer den
     *  zweiten Befund der Runde: die Begruendung, mit der Schritt 8 ihre
     *  einzige Ratsche entfernt hat ("dieselbe Schwelle an derselben Stelle,
     *  nur haerter"), wird erst durch diesen Test wahr. Wer die Siebung
     *  wieder auf `^color-mix(…)$` verengt, macht ihn rot statt still. */
    test('die beiden Toenungen IM VERLAUF stehen namentlich unter Aufsicht', () => {
        const mitStopps = ruheRegeln().filter(r => r.stopps);
        expect(mitStopps.map(r => `${r.datei} ${r.sel}`).sort()).toEqual([
            'initiative.css .concentration-badge',
            'spells.css .spell-note'
        ]);
        // Und jede von ihnen fuehrt wirklich Stopps, nicht eine leere Liste.
        mitStopps.forEach(r => expect(r.stopps.length).toBeGreaterThanOrEqual(1));
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

   (3) DRITTER FALL, Pruefrunde W1-E Runde 2, und er hat die Ratsche selbst
       erweitert: `.bestiary-dice` traegt zwei voellig verschiedene
       Verwendungen — die Wuerfel im Pergament-Statblock und, ueber
       party-details.js:215-216, die Angriffswuerfel im Charakter-Detail auf
       --bg/--bg-hover. Die neue Pergamenttinte schlug ueber die Kaskade auf
       den HOVER-Zustand der zweiten Verwendung durch und senkte ihn von 6,01
       auf 1,69 (dark und contrast). Diese Ratsche sah es nicht, weil sie
       Pseudoklassen ausdruecklich ausschloss. Seitdem darf ein Zustand
       `pseudo: ':hover'` fuehren; der Fall steht als siebter Eintrag in
       ZUSTAENDE, samt Zahlen.

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
   * andere (Element, ID, `>`/`+`/`~`, Attribut) gilt als NICHT-Treffer. Eine
   * zu grosszuegige Uebereinstimmung waere schlimmer als gar keine: sie
   * rechnete eine Tinte auf eine Flaeche, die nie zusammen auftreten.
   *
   * PSEUDOKLASSEN, seit Pruefrunde W1-E Runde 2: bis dahin galt hier
   * ausnahmslos "Pseudoklasse = kein Treffer", und genau diese Ausnahme hat
   * einen Blocker durchgelassen (siehe den Zustand "Angriffswuerfel im
   * Charakter-Detail" unten in ZUSTAENDE). Ein Zustand darf jetzt mit
   * `pseudo: ':hover'` sagen, dass er ein Zustand MIT Pseudoklasse ist. Dann
   * — und nur dann — zaehlt eine Alternative, deren letzter Teil genau auf
   * diese Pseudoklasse endet, als Treffer; die Ruheregel ohne Pseudoklasse
   * trifft weiterhin mit, denn der Hover-Zustand erbt sie. Ohne `pseudo` ist
   * das Verhalten Zeichen fuer Zeichen das alte: die sieben vorhandenen
   * Zustaende sind Ruhezustaende und bleiben unberuehrt.
   */
  function trifft(alternative, klassen, vorfahren, pseudo) {
    let roh = alternative.trim();
    if (pseudo && roh.endsWith(pseudo)) roh = roh.slice(0, -pseudo.length);
    // `:` steht jetzt ausdruecklich in der Ablehnung. Das aendert nichts —
    // die Klammerprobe in alleKlassen() hat einzelne Pseudoklassen schon
    // vorher verworfen —, macht die Absicht aber lesbar.
    if (/[>+~[\]#]|:/.test(roh)) return false;
    const teile = roh.split(/\s+/);
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

  /** Spezifitaet = Klassen + Pseudoklassen. Beide wiegen in der Kaskade
   *  gleich viel (0,x,0); Elemente und IDs kommen in dieser Liste nicht vor.
   *  Fuer die sieben Ruhezustaende ist der zweite Summand immer 0 — ihre
   *  Selektoren fuehren keinen Doppelpunkt. */
  const spezifitaet = (alternative) =>
    (alternative.match(/\.[-\w]+/g) || []).length +
    (alternative.replace(/::[-\w]+/g, "").match(/:[-\w]+/g) || []).length;

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
          .filter((s) =>
            trifft(s, zustand.klassen, zustand.vorfahren, zustand.pseudo),
          );
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
      /* KEINE AUSNAHME MEHR (Welle 2, Schritt 8, D-4/E2). Der Eintrag stand
               hier, seit die Ratsche geboren wurde, und war der einzige der
               D-4-Tabelle, an dem die Tinte allein einmal gereicht haette.
               Die Geschichte in Zahlen, 18-%-Toenung derselben Rolle ueber
               --bg-elevated:
                 2026-09-28  festes Dark-Gold rgba(212,175,55,0.18)
                             dark 5,06 · light 2,41 · sepia 5,28 · contrast 7,94
                 2026-09-29  Schritt 6 stellt die Toenung auf color-mix und
                             laesst sie dem Theme folgen
                             dark 5,06 · light 2,25 · sepia 4,47 · contrast 7,09
                 2026-09-29  Schritt 8: Deckel plus --gold-text
                             dark 5,65 · light 4,78 · sepia 5,26 · contrast 7,09

               Die in W1-D-02 vorgerechnete Abhilfe "Tinte auf var(--gold-text)
               genuegt" traegt seit Schritt 6 nicht mehr (light 4,31). Erst
               Tinte UND Staerke zusammen bringen die Stelle ueber 4,5 — genau
               die Aussage, um derentwillen D-4 beides in einem Zug
               entscheidet. */
      flaecheUeber: "var(--bg-elevated)",
    },
    /* -------------------------------------------------------------------
       DER ZUSTAND, DER DIESE RATSCHE UM PSEUDOKLASSEN ERWEITERT HAT
       (Pruefrunde W1-E, Runde 2)

       `.bestiary-dice` ist NICHT nur eine Statblock-Klasse. Ausser
       renderClickableDice() (bestiary-render.js:41, immer innerhalb von
       `.bestiary-statblock`) erzeugt auch party-details.js:215-216 Spans
       mit dieser Klasse — die klickbaren Treffer- und Schadenswuerfel im
       Charakter-Detail, verpackt in `.char-attack-entry`. Dort liegt kein
       Pergament, sondern --bg (Ruhe) bzw. --bg-hover (Hover).

       Der RUHEZUSTAND war immer abgesichert: `.char-attack-entry
       .bestiary-dice` (0,2,0) schlaegt `.bestiary-dice` (0,1,0) und setzt
       --gold-text. Der HOVER-Zustand war es nicht. party.css setzt dort nur
       `background`, keine `color`; fuer `color` standen sich
       `.char-attack-entry .bestiary-dice` (0,2,0, party.css, Hub-Rang 9)
       und `.bestiary-dice:hover` (0,2,0, bestiary.css, Hub-Rang 18)
       gleichauf gegenueber — die Quellreihenfolge entschied fuer bestiary.

       Als die Statblock-Wuerfel am 2026-09-28 ihre Pergamenttinte bekamen,
       fiel dieser fremde Hover-Zustand deshalb mit: --parchment-ink-link-
       hover #7a4a00 auf --bg-hover ergibt dark 1,69 und contrast 1,69,
       wo vorher (var(--gold)) 6,01 bzw. 9,01 standen. Dark ist das
       Standardtheme. Keine Ratsche sah es: R-05 schloss Pseudoklassen
       ausdruecklich aus, R-03 verlangt eine Flaeche ohne Rueckfallwert
       (hier steht `var(--bg-hover, rgba(255,255,255,0.07))`), R-07 liest
       nur bestiary.css und kennt die Verwendung ausserhalb des Pergaments
       nicht. Die volle Jest-Suite war gruen — genau deshalb.

       Behoben strukturell: die beiden bestiary.css-Regeln heissen jetzt
       `.bestiary-statblock .bestiary-dice(:hover)` und gelten nur noch da,
       wo auch Pergament liegt. Damit erbt der Hover-Zustand hier wieder
       --gold-text: dark 6,01 · light 4,59 · sepia 5,16 · contrast 9,01,
       min 4,59 — das repariert nebenbei den vorbestehenden Light-Wert 2,40.
       ------------------------------------------------------------------- */
    {
      name: "Angriffswuerfel im Charakter-Detail, Mauszeiger darauf",
      dateien: ["party.css", "bestiary.css"],
      klassen: ["bestiary-dice"],
      vorfahren: [
        "char-attack-entry",
        "char-attacks-list",
        "char-attacks-section",
      ],
      marke: ":hover",
      pseudo: ":hover",
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
        // Die Marke ist entweder eine Klasse (`active`) oder — seit W1-E
        // Runde 2 — eine Pseudoklasse (`:hover`); im zweiten Fall traegt
        // sie den Doppelpunkt schon.
        const markeText = z.marke.startsWith(":") ? z.marke : `.${z.marke}`;
        if (!k.alternativen.some((a) => a.includes(markeText))) return;
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
       derselben Welle waren es 126: `.bestiary-statblock-name` und
       `.bestiary-statblock-section-heading` sind aus der Liste heraus,
       weil ihr "Verlauf" gar kein Theme-Verlauf war, sondern die
       themenunabhaengige Pergamentpalette — eine `-text`-Rolle konnten
       sie deshalb nie bekommen. Sie tragen jetzt --parchment-ink-red
       (10,98 / 9,29 statt 2,58-3,92) und stehen unter R-07. Seit der
       Pruefrunde W1-E sind es 124: `.bestiary-dice` und
       `.bestiary-dice:hover` sind ebenfalls heraus, weil die Wuerfelspans
       im Statblock MITTEN auf demselben Pergament liegen; sie tragen jetzt
       --parchment-ink-link / --parchment-ink-link-hover (5,93 / 5,02 bzw.
       6,07 / 5,13 statt 1,02-5,76) und stehen ebenfalls unter R-07.

       BERICHTIGUNG, Runde 2 derselben Pruefung: die Begruendung dieser
       Streichung lautete zunaechst, die Traegerangabe der beiden Zeilen
       ("--bg-dark, GRAD:#0d0d0d, GRAD:#1a1a1a") sei falsch gewesen. Sie war
       es nicht — sie beschrieb die ZWEITE Verwendung derselben Klasse,
       party-details.js:215-216 im Charakter-Detail, wo kein Pergament
       liegt. Die Zeilen waren unvollstaendig, nicht falsch, und zum
       Zeitpunkt der Streichung war eine der beiden gerade VERSCHLECHTERT
       worden (Hover 6,01 -> 1,69). Erst der Praefix `.bestiary-statblock`
       auf beiden Regeln hat die 124 gedeckt. Die zweite Verwendung kommt
       NICHT in die Liste zurueck: sie erbt --gold-text und haelt 4,5 in
       allen vier Themes (min 4,59 im Hover); sie steht stattdessen als
       benannter Zustand in R-05. Vollstaendig in
       .planning/HANDOFF-V3-OFFENE-PUNKTE.md, Gruppe B.

       SEIT SCHRITT 18 SIND ES 123 (Pruefung W2-D Runde 1):
       `.concentration-check-banner .conc-dc` ist heraus. Ihre Gruppe E war
       ueberschrieben "in keinem erreichbaren Zustand gerendert", und das war
       fuer sie falsch — die E2E-Pruefung des Konzentrations-Banners erzeugt
       das Element ueber einen realen Klick und prueft `.conc-dc` auf
       "DC 10". Sie war ein Quergriff (Toenung im Elter, Tinte im Kind) mit
       Light 2,35 bzw. 2,16 und traegt jetzt --gold-text auf zwei gedeckelten
       Stopps (Kopf 5,44 · 4,78 · 5,34 · 7,27, Fuss 5,91 · 4,62 · 5,21 ·
       10,01). Bewacht von R-14.

       Wer die Zahl senkt, OHNE dass eine Stelle erledigt ist, nimmt der
       Ratsche lautlos Stellen weg. */
    expect(stellen.length).toBe(123);

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

   NACHTRAG 2026-09-28 (Pruefrunde W1-E): ihr Suchmuster liess
   `.bestiary-dice` aus — die Wuerfelspans in Merkmalen und Aktionen, die
   mitten auf dem Pergament liegen und mit `var(--cyan)`/`var(--gold)` die
   SCHLECHTESTEN Werte des ganzen Kastens trugen, schlechter als die in
   Schritt 11 behobenen 2,58-3,92. Gemessen mit dem Helfer dieser Datei,
   je Theme Ruhe / Hover, jeweils beide Verlaufsenden:

       dark    1,59 / 1,35   und   1,71 / 1,44
       light   2,99 / 2,53   und   2,64 / 2,23
       sepia   2,56 / 2,17   und   5,76 / 4,87
       contrast 1,02 / 1,16  und   1,14 / 1,04

   Einziger Wert ueber 4,5: Sepia im Hover. Die zwei Regeln tragen seitdem
   --parchment-ink-link #105f6b (5,93 / 5,02) und --parchment-ink-link-hover
   #7a4a00 (6,07 / 5,13) — dieselbe Loesung wie beim Statblock-Rot, eigene
   themenunabhaengige Pergamenttinte statt Palettenfarbe. Die Rollen bleiben
   erhalten: kuehl in Ruhe, warm im Hover.

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
    /** Der Modulpfad steht hier BEWUSST am Stueck und in ausfuehrbarem Code,
     *  nicht nur im Erklaertext darueber: das Abdeckungs-Gate
     *  (tests/unit/module-test-coverage.test.js) zaehlt ein Modul als
     *  angefasst, wenn sein loader.js-Pfad woertlich in einer Testdatei
     *  vorkommt. Stuende der Pfad nur im Kommentar, haenge die
     *  Abdeckungsaussage an Prosa — und die naechste Kommentarueberarbeitung
     *  nimmt das Modul lautlos wieder aus dem Gate. Hier liest ihn die
     *  Zusicherung selbst. */
    const RENDER_MODUL = path.join(REPO, 'features/bestiary/bestiary-render.js');
    /** Die Regeln, die IM Statblock faerben. `.bestiary-attribution` faengt
     *  der Praefix `.bestiary-attr` sonst mit ein — deshalb die drei
     *  Zellenklassen einzeln statt als Praefix.
     *
     *  `.bestiary-dice` traegt keinen `bestiary-statblock`-Praefix und fiel
     *  deshalb bis 2026-09-28 aus dem Muster — lautlos, wie es sich fuer
     *  diesen Fehlertyp gehoert. Die Spans entstehen in
     *  renderClickableDice() (bestiary-render.js:41) und gehen ueber
     *  renderTraitList() (:240, :249) in Merkmale und Aktionen; beides
     *  verpackt renderStatblockHTML() (:300) in die Pergamentschachtel, auf
     *  demselben Weg auch in der Initiative-Schublade
     *  (initiative-statblock.js:86). Die Spans liegen also mitten auf dem
     *  Pergament und trugen mit `var(--cyan)`/`var(--gold)` die schlechteste
     *  Tinte des ganzen Kastens (Contrast 1,02 in Ruhe, 1,04 im Hover).
     *  Seit der Aufnahme ins Muster bewacht die Ratsche das, was ihre
     *  Ueberschrift immer schon behauptet hat: JEDE Tinte im Statblock. */
    const IM_STATBLOCK =
        /\.bestiary-statblock|\.bestiary-attr-(?:cell|label|value)\b|\.bestiary-dice\b/;
    /** Die getoente Attributzelle liegt zwischen Tinte und Pergament. */
    const ZELLE = /\.bestiary-attr-(?:label|value)\b/;
    /** Die Toenung der Attributzelle wird aus bestiary.css GELESEN, nicht
     *  hier wiederholt.
     *
     *  Bis Welle 2 Schritt 7 stand hier das Literal `rgba(139, 69, 19, 0.08)`
     *  fest verdrahtet. Das ist die gefaehrlichste Bauart, die eine Ratsche
     *  haben kann: aendert das Stylesheet seine Toenung, rechnet der Test
     *  stumm mit dem alten Wert weiter. Er wird nicht rot — er prueft nichts
     *  mehr. Genau das waere beim Umstieg auf
     *  `color-mix(in srgb, var(--ra-parchment-rule) 8%, transparent)`
     *  passiert: der WERT ist derselbe, die Zahl haette also gestimmt, aber
     *  die Aussage "geprueft wird, was im Stylesheet steht" nicht mehr.
     *  Design-Handoff v3, Welle 2, Schritt 7. */
    const ZELL_TOENUNG = (() => {
        const bestiaryCss = cssFiles.find(f => f.name === 'bestiary.css').content;
        const zelle = regelnMitRumpf(bestiaryCss).find(r => /\.bestiary-attr-cell\b/.test(r.sel));
        return zelle ? deklaration(zelle.rumpf, 'background') : null;
    })();

    const TEXT_SCHWELLE = 4.5;
    const LINIEN_SCHWELLE = 3;

    test('die Flaeche ist noch der Pergamentverlauf — sonst handelt der Rest von nichts', () => {
        const js = fs.readFileSync(RENDER_MODUL, 'utf8');
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
        /* Zweite Plausibilitaetsprobe, seit die Toenung gelesen statt
           verdrahtet wird: findet die Zerlegung die Regel nicht mehr, waere
           ZELL_TOENUNG null, `flaechen` [null, null] — und der Rechner
           wuerfe erst weiter unten, mit einer Meldung ueber Hexwerte statt
           ueber die verschwundene Regel. */
        expect(typeof ZELL_TOENUNG).toBe('string');
        expect(WCAG.resolveOver(ZELL_TOENUNG, p0, enden[0])).toBeTruthy();

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
                /* Aus `1px solid var(--x)` bzw. `1px solid #abc` den Farbteil.
                   color-mix() MUSS vor var() stehen und muss seine eigene
                   innere Klammer mitnehmen: die Alternation ist ungeankert,
                   und `var\([^)]*\)` findet in
                   `color-mix(in srgb, var(--x) 70%, transparent)` das innere
                   `var(--x)`. Der Rechner bekaeme dann die VOLLE Tinte statt
                   der Mischung, der Kontrast waere zu gut gerechnet und der
                   Test bliebe gruen — dieselbe stille Kopplung wie beim frueher
                   verdrahteten ZELL_TOENUNG. resolveOver() kennt beide Formen
                   laengst (deckend wie transparent), es fehlte nur der Zugriff.
                   Design-Handoff v3, Welle 2, Schritt 7. */
                const farbe = (roh.match(
                    /color-mix\((?:[^()]|\([^()]*\))*\)|var\([^)]*\)|#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/
                ) || [])[0];
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

        // Gegenprobe: die Ratsche muss die Stellen wirklich SEHEN. Die
        // Untergrenze stieg mit `.bestiary-dice` von 6 auf 8 (Ruhe und Hover
        // sind zwei eigene Regeln) — eine Zahl, die beim Schrumpfen des
        // Suchmusters sofort faellt, statt es lautlos zu erlauben.
        expect(geprueft).toBeGreaterThanOrEqual(8);
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
    /** Der Pfad am Stueck und in ausfuehrbarem Code, aus demselben Grund wie
     *  bei R-07: das Abdeckungs-Gate soll an der Zusicherung haengen, die
     *  die Datei wirklich liest, nicht an einem Kommentar. */
    const QUELLE = path.join(REPO, 'features/locations/locations-render.js');
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

        /* (d) Regeln, die gegen einen Inline-Stil derselben Elemente nie
           gewinnen. Bis Welle 2 Schritt 10 stand hier nur der Ortsaufkleber;
           die Schatzkammer hat die gleich gebaute Stelle daneben (der
           Seltenheitsaufkleber, dessen Flaeche UND Tinte aus dem Inline-Stil
           der Schatzkammer-Liste kommen — der Modulpfad steht nur unten im
           Feld `quelle`, denn ein loader-relativer Pfad in einem
           Fliesstextkommentar laesst tests/unit/module-test-coverage.test.js
           das Modul fuer getestet halten und hoehlt dessen Ausnahmeliste
           lautlos aus; genau das ist hier einmal passiert). Beide sind toter
           Code, und beide sind gefaehrlicher als gewoehnlicher toter Code:
           sie sehen aus wie die gueltige Deklaration. Wer die
           Seltenheitsfarben sucht, findet in npcs.css ein Violett, das
           nirgends erscheint.

           Die Liste nennt fuer jede Stelle die Eigenschaften, die dort tot
           sind — beim Ortsaufkleber nur die Tinte (die Flaeche steht im CSS
           und ist echt), beim Seltenheitsaufkleber beide. */
        const TOTE_REGELN = [
            { datei: 'core.css', sel: '.loc-item-tag', eig: ['color'], quelle: 'locations-render.js' },
            {
                datei: 'npcs.css',
                sel: '.loot-item-tag',
                eig: ['background', 'color'],
                quelle: 'initiative-loot.js'
            }
        ];
        expect(TOTE_REGELN.length).toBe(2);
        TOTE_REGELN.forEach(t => {
            const datei = cssFiles.find(f => f.name === t.datei);
            expect(datei).toBeDefined();
            const regel = regelnMitRumpf(datei.content).find(r => r.sel === t.sel);
            if (!regel) return; // ganz entfernt ist die sauberste Aufloesung
            t.eig.forEach(eig => {
                const wert = deklaration(regel.rumpf, eig);
                if (wert) {
                    befunde.push(
                        `${t.datei}:${regel.zeile} ${t.sel} setzt \`${eig}: ${wert}\`. Gegen ` +
                            `den Inline-Stil aus ${t.quelle} gewinnt sie nie — das ist toter ` +
                            `Code, und solange sie dasteht, sieht sie aus wie die gueltige ` +
                            `Deklaration`
                    );
                }
            });
        });

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

/* ===========================================================================
   Design-Handoff v3, Welle 2 — R-10: rgba()-Zahlentripel im Komponenten-CSS
   ===========================================================================
   ZUR NUMMER. R-01 bis R-09 sind vollstaendig von Welle 1 belegt (:1130,
   :1161, :1694, :1911, :2181, :2517, :2748, :2928, :3101). Der Handoff v3
   nennt diese Ratsche in Paragraph 6.1 "R-03" und in Paragraph 5 "T-2" —
   zwei Namen fuer dieselbe Sache, und R-03 heisst hier schon "geerbte Tinte
   auf gewechselter Flaeche". Wer Paragraph 6.1 woertlich folgt,
   ueberschreibt eine gruene Ratsche. Diese heisst deshalb R-10.

   WAS SIE ZAEHLT. Jedes rgba()/rgb() mit einem Zahlentripel in
   assets/styles/*.css, das NICHT in einer Schattendeklaration steht und
   nicht in der Ausnahmeliste unten gefuehrt ist. Der Quelltext wird vorher
   zeilentreu von Kommentaren geleert — ein roher grep zaehlt sonst die
   Erklaertexte mit.

   DIE ZAHLEN, am 2026-09-29 gegen ba3d3c2 selbst gemessen (nicht aus dem
   Handoff uebernommen; der nennt 390 Literale und 143 Werte, einen Stand von
   vor einem Loeschlauf, der schon vor Welle 1 falsch war — 336 an ca85d1b wie
   an HEAD):

       336   Zahlentripel in assets/styles/*.css, alle 20 Dateien
       332   davon im Komponenten-CSS
         4   in variables.css, ausschliesslich die vier --shadow
             (seit Welle 3 Schritt 2: ZWOELF, siehe die Gegenprobe im Test
              unten — --shadow ist entfallen, an seine Stelle treten in Dark,
              Light und Sepia je drei Stufen plus die Schublade; Contrast
              traegt Hex-Umrisse und steuert kein Tripel bei)
        85   in einer Schattendeklaration -> WELLE 3, hier ausgenommen
             (78 box-shadow, 6 text-shadow, 1 filter: drop-shadow,
              dice.css:553 — der Anker ist ueberholt, die Deklaration steht
              heute auf dice.css:583)
       247   Revier dieser Ratsche = AUSGANGSWERT bei der Geburt
       130   verschiedene vollstaendige Literale im Revier, auf 43 Tripeln

   Gegenprobe von aussen:
       grep -o "rgba?([[:space:]]*[0-9][^)]*)" assets/styles/*.css | wc -l
   (das Fragezeichen dort als Basic-Regex maskiert) liefert 341 Rohtreffer;
   5 davon stehen in Kommentaren, 341 - 5 = 336.

   SECHS KLASSEN im Revier — der Handoff fuehrt nur fuenf, und sechs seiner
   sieben Zahlen sind falsch (groesste Abweichung Faktor 9):

       162  exakter Treffer einer DARK-Rolle (gold 37, red 28, yellow 22,
            green 13, blue 11, orange 11, cyan 9, attr-dex 9, purple 6,
            coin-gm 6, pink 5, bg-card 2, bg-dark 2, attr-con 1)
        29  Weiss-Auflagen rgba(255,255,255,a), ein Tripel, acht Alphastufen
        28  palettenfremd — in keinem Theme und keiner Skala vorhanden
        17  Treffer eines themenunabhaengigen SKALENTOKENS (--know-*, --dmg-*,
            --cat-*, --ra-*) — DIE KLASSE, DIE IM HANDOFF FEHLT; sie erklaert
            die Differenz zweier Zaehllaeufe (17 + 28 = 45)
         6  Schwarz-Flaechen rgba(0,0,0,a) ohne jeden Schatten
         5  aus einer FREMDEN Theme-Palette (Light/Sepia/Contrast)
       ---
       247

   Eine Stelle steht zwischen den letzten beiden Klassen: bestiary.css:279
   rgba(139,69,19,0.08) ist zugleich Sepia --gold und Alias
   --ra-parchment-rule. Welcher Klasse sie zufaellt, haengt allein an der
   Reihenfolge der Pruefung (17/5 oder 18/4); die Summe 247 ist davon
   unberuehrt. Die Ratsche selbst zaehlt Stellen, nicht Klassen.

   GELTUNGSBEREICH, schriftlich, weil der Handoff hier irrefuehrt: NUR
   assets/styles/*.css. Im Komponenten-CSS gibt es NULL Hex-Farben, NULL
   hsl() und NULL rgb() ohne Alpha — Hex bildet dort keine Klasse. Der
   Handoff-Beleg "tools.css:1517 #ffd700" hat in der gesamten Historie nie
   existiert (git log -S ffd700 -- assets/styles/tools.css: null Commits);
   auf :1517 steht .sb-loop-btn { flex-shrink: 0 }. Das fremde Gold liegt als
   rgba(255,215,0,.) in tools.css:1067/1151/1188/1267/1272/1314.
   AUSSERHALB bleiben: assets/templates/*.html (55 Hex) und der JS-Baum
   (64 Hex, 7 rgba). Zwei davon sind nach Paragraph 7 begruendete Ausnahmen
   und bleiben es — der Laden-Handzettel-Export unter features/shops (25 Hex,
   ein eigenstaendiges Ausgabedokument ohne Theme) und der Leistengenerator
   unter ui/editors (12, die Markierstift-Palette, deren Werte im
   eingefrorenen Editor-Testnetz zeichenweise zugesichert sind).

   DIE DATEINAMEN DIESER BEIDEN STEHEN HIER ABSICHTLICH NICHT: das
   Abdeckungs-Gate in tests/unit/module-test-coverage.test.js haelt ein Modul
   fuer getestet, sobald sein loader-relativer Pfad WOERTLICH irgendwo unter
   tests/ vorkommt — auch in einem Kommentar wie diesem. Die erste Fassung
   nannte den Pfad und hat das Gate prompt rot gemacht ("Eintrag der
   Ausnahmeliste ist inzwischen abgedeckt"). Wer hier einen Modulpfad
   ausschreibt, behauptet eine Testabdeckung, die es nicht gibt.

   SIE WAR BEI IHRER GEBURT ROT, mit 247 Stellen. Das Ziel war 0 plus eine
   begruendete Ausnahmeliste, und mit Schritt 7 ist es erreicht. Der Weg
   dorthin, damit die Zwischenstaende nachvollziehbar bleiben:

       247  Geburt (Schritt 1)
       245  Schritt 2: die zwoelf --*-rgb-Kanaele und ihre Geschwisterstelle
       209  Schritt 3: 14 tote var()-Rueckfaelle, Auflagen- und Blendenleiter
        52  Schritte 4-6: 157 eindeutige Dark-Literale, 15 benannte Farben
        68  Nachtrag zu R-12: 16 Skalentoken-Stellen zurueck auf ihre
            Literale, damit Schritt 7 sie nach ZWECK entscheidet statt nach
            Wert (52 + 16 = 68 — die Zahl steigt hier bewusst)
         0  Schritt 7: 64 Urteilsstellen aufgeloest, 4 begruendete Ausnahmen

   DIE VIER AUSNAHMEN sind keine Restmenge, sondern vier einzeln
   entschiedene Faelle; ihre Begruendungen stehen unten in R10_AUSNAHMEN und
   noch einmal an der jeweiligen Regel im CSS. Drei decken eine ABSICHT
   (Flaechen, die keinem Theme folgen sollen), der vierte deckt einen
   gemessenen MANGEL, der eine Gestaltungsentscheidung braucht — er ist als
   W2-C-01 aktenkundig und darf nicht als erledigt gelesen werden.
   =========================================================================== */
/** Begruendete Ausnahmen von R-10. STEHT AUF MODULEBENE, nicht im
 *  R-10-Block: R-17 liest die zwei party.css-Literale von hier, statt sie
 *  ein zweites Mal abzuschreiben (Pruefrunde W2-E, Runde 1 — eine Ratsche,
 *  die gegen ihre eigene Abschrift rechnet, ist genau der Befund, der dort
 *  an R-16 Teil (4) erhoben wurde).
 *
 *  Schluessel ist NICHT die Zeile (die verschiebt
 *  jeder Kommentar-Commit, siehe R-06), sondern Datei plus vollstaendiges
 *  Literal, dazu die Zahl der gedeckten Stellen: deckt eine Ausnahme
 *  ploetzlich mehr Stellen als eingetragen, meldet die Ratsche das,
 *  statt die neuen stillschweigend mitzuverzeihen.
 *
 *  SIE WAR BEI DER GEBURT LEER, und das war Absicht, nicht Vergessen —
 *  wie EXEC_COMMAND_ALLOWLIST in editor-floating.spec.js. Schritt 7
 *  fuellt sie mit VIER Eintraegen. Drei davon sind Flaechen, die
 *  absichtlich keinem Theme folgen; der vierte ist ein gemessener
 *  Mangel, der eine Gestaltungsentscheidung braucht und nicht in einem
 *  Literal-Aufloesungsschritt nebenbei fallen darf. */
const R10_AUSNAHMEN = [
    {
        datei: 'party.css',
        lit: 'rgba(15, 15, 25, 0.98)',
        anzahl: 1,
        grund:
            '.event-log.persistent — Entscheidung E6. Die dunkle Blende des ' +
            'Ereignis-Logs ist gewollt themenblind; 15,15,25 kommt in keinem Theme ' +
            'und keiner Skala vor und hat keine Rolle, auf die es zeigen koennte. ' +
            'Die geerbte TINTE darauf war dagegen mangelhaft (Light 1,07) und ist ' +
            'in Schritt 10 auf themenblinde Tokens umgestellt (--on-log, ' +
            '--on-log-dim; jetzt 6,96-15,63 in allen vier Themes). Die Flaeche ' +
            'bleibt, die Tinte folgt ihr — nicht umgekehrt.'
    },
    {
        datei: 'party.css',
        lit: 'rgba(20, 20, 30, 0.95)',
        anzahl: 1,
        grund:
            '.event-log-entry — zweite Flaeche desselben Logs, gleiche Begruendung. ' +
            'Ihre Tinte ist in Schritt 10 mitgezogen worden.'
    },
    {
        datei: 'pwa.css',
        lit: 'rgba(251, 191, 36, 0.85)',
        anzahl: 1,
        grund:
            '.pwa-update-banner — W2-B-02, in Schritt 7 entschieden. Der Wert ist ' +
            'zwar zeichengleich --yellow im Dark-Block, aber die Themen' +
            'unabhaengigkeit DIESER Flaeche ist die Voraussetzung der Messung, die ' +
            'Welle 1 daneben gefuehrt hat: --on-yellow ist in allen vier Themes ' +
            '#111111 und passt nur deshalb (8,29 · 11,97 · 11,79 · 8,11). Folgte ' +
            'die Flaeche dem Theme, waeren diese Zahlen hinfaellig. Die zwei ' +
            'kleineren Literale derselben Leiste sind aufgeloest — sie zeigten auf ' +
            'ein THEME-Token (--bg-dark@dark) und tragen jetzt --on-yellow.'
    },
    {
        datei: 'dmscreen.css',
        lit: 'rgba(26, 26, 26, 0.95)',
        anzahl: 1,
        grund:
            '.modal — W2-C-01, die einzige Ausnahme dieser Liste, die einen MANGEL ' +
            'deckt statt einer Absicht. 26,26,26 ist --bg-card im Dark-Block, und ' +
            'die Tinten darauf folgen dem Theme: var(--text) erreicht Light 1,14 ' +
            'und Sepia 1,41, der Fliesstext jedes Modals ist dort unsichtbar. ' +
            'var(--bg-card) 95 % machte daraus 17,40 und 10,15. Aber .modal ist die ' +
            'Universalschachtel (19 Vorkommen in den Templates, einzige ' +
            'Flaechenquelle im Baum), ihre Tinten kommen aus rund zwanzig Dateien, ' +
            'und mindestens eine verschlechtert sich nachweislich (var(--gold) in ' +
            'Ueberschriften 4,71 -> 3,25). Das ist eine Gestaltungsentscheidung mit ' +
            'Sichtprobe in vier Themes, keine Literalaufloesung. Die gleich gebaute ' +
            'Stelle mit ueberschaubarem Tintenkreis IST umgestellt ' +
            '(dice.css .floating-dice-panel).'
    }
];

describe('R-10 — rgba()-Zahlentripel ausserhalb der Schatten (Ratsche)', () => {
    /** Zielwert der Ratsche. 0 von der Geburt an: was bleiben darf, steht
     *  namentlich in R10_AUSNAHMEN, nicht in einer Restzahl. Der gemessene
     *  Ausgangswert 247 steht im Kopfkommentar, nicht hier — eine Ratsche,
     *  deren Schranke mitwandert, schuetzt nichts. */
    const R10_ZIEL = 0;

    /** Kommentare zeilentreu leeren. withoutComments() weiter oben loescht
     *  sie ganz und verschiebt damit jede Zeilennummer — fuer einen Befund,
     *  der die Stelle nennen soll, unbrauchbar. */
    function leerKommentare(css) {
        let out = '';
        let i = 0;
        while (i < css.length) {
            if (css[i] === '/' && css[i + 1] === '*') {
                const e = css.indexOf('*/', i + 2);
                const stop = e === -1 ? css.length : e + 2;
                for (let k = i; k < stop; k++) out += css[k] === '\n' ? '\n' : ' ';
                i = stop;
                continue;
            }
            out += css[i];
            i++;
        }
        return out;
    }

    /** Alle Deklarationen einer Datei mit Eigenschaft und Wertbereich.
     *  Klammertiefe statt Zeilenlogik, damit einzeilige Regeln und
     *  mehrzeilige Werte gleich behandelt werden; runde Klammern werden am
     *  Stueck uebersprungen, damit ein Semikolon in einer url() oder einem
     *  Verlauf keine Deklaration beendet. */
    function deklarationen(css) {
        const out = [];
        let tiefe = 0;
        let i = 0;
        let start = -1;
        let doppel = -1;
        let quote = null;
        while (i < css.length) {
            const ch = css[i];
            if (quote) {
                if (ch === quote && css[i - 1] !== '\\') quote = null;
                i++;
                continue;
            }
            if (ch === '"' || ch === "'") {
                quote = ch;
                i++;
                continue;
            }
            if (ch === '(') {
                let k = 1;
                i++;
                while (i < css.length && k > 0) {
                    if (css[i] === '(') k++;
                    else if (css[i] === ')') k--;
                    i++;
                }
                continue;
            }
            if (ch === '{' || ch === '}') {
                /* Das abschliessende Semikolon der letzten Deklaration eines
                   Blocks ist in CSS optional. Ohne diesen Zweig faellt genau
                   sie aus der Zaehlung — und das ist die Schreibweise, in der
                   ein Rueckfall an der Ratsche vorbeikaeme. `tiefe` wird VOR
                   dem Dekrement geprueft, sonst waere der Block schon
                   verlassen; die Bedingung ist im uebrigen dieselbe wie im
                   `;`-Zweig, ein Selektor mit `:hover` faellt also nicht
                   durch (er wird vom oeffnenden `{` zurueckgesetzt). */
                if (ch === '}' && tiefe > 0 && start >= 0 && doppel > start) {
                    out.push({
                        prop: css.slice(start, doppel).trim().toLowerCase(),
                        von: doppel + 1,
                        bis: i
                    });
                }
                tiefe += ch === '{' ? 1 : -1;
                start = -1;
                doppel = -1;
                i++;
                continue;
            }
            if (ch === ';') {
                if (tiefe > 0 && start >= 0 && doppel > start) {
                    out.push({
                        prop: css.slice(start, doppel).trim().toLowerCase(),
                        von: doppel + 1,
                        bis: i
                    });
                }
                start = -1;
                doppel = -1;
                i++;
                continue;
            }
            if (start < 0 && !/\s/.test(ch)) start = i;
            if (ch === ':' && doppel < 0 && start >= 0) doppel = i;
            i++;
        }
        return out;
    }

    /** Schattendeklarationen gehoeren Welle 3 und bleiben hier aussen vor. */
    function istSchatten(prop) {
        return /(^|-)(box|text)-shadow$/.test(prop) || /filter$/.test(prop);
    }

    const TRIPEL = /\brgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;

    /** Mutationsprobe fuer die Zerlegung SELBST, nicht fuer ihr Ergebnis.
     *
     *  Eine Deklaration ohne abschliessendes Semikolon ist gueltiges CSS,
     *  wird von keinem Formatierer im Projekt erzwungen und ist damit genau
     *  die Schreibweise, in der ein neu eingefuehrtes Literal an dieser
     *  Ratsche vorbeikaeme. In assets/styles/*.css gibt es heute NULL solche
     *  Stellen — die Luecke faellt also bei keinem Zaehllauf auf, sondern
     *  erst beim Rueckfall, den die Ratsche verhindern soll, und dann nicht
     *  mehr. Deshalb wird die Zerlegung hier gegen synthetische Eingaben
     *  geprueft statt gegen den Quellbaum.
     *
     *  (d) ist die Gegenprobe: ein Selektor traegt mit `:hover` ebenfalls
     *  einen Doppelpunkt und darf am schliessenden `}` NICHT als
     *  Deklaration durchgehen. */
    test('deklarationen() sieht auch die letzte Deklaration ohne Semikolon', () => {
        const props = css => deklarationen(css).map(d => d.prop);
        const werte = css => deklarationen(css).map(d => css.slice(d.von, d.bis).trim());

        // (a) mit Semikolon — der Fall, den die Zerlegung schon immer sah
        expect(props('.a { background: rgba(1, 2, 3, 0.5); }')).toEqual(['background']);

        // (b) einzeilig, letzte Deklaration ohne Semikolon
        expect(props('.a { background: rgba(4, 5, 6, 0.5) }')).toEqual(['background']);
        expect(werte('.a { background: rgba(4, 5, 6, 0.5) }')).toEqual(['rgba(4, 5, 6, 0.5)']);

        // (c) mehrzeilig, letzte Deklaration ohne Semikolon
        expect(props('.a {\n    color: red;\n    background: rgba(7, 8, 9, 0.5)\n}')).toEqual([
            'color',
            'background'
        ]);

        // (d) keine Falschtreffer: leere Bloecke und Selektoren mit
        //     Doppelpunkt liefern nichts, verschachtelte At-Regeln genau
        //     ihre eine Deklaration
        expect(props('.a { }')).toEqual([]);
        expect(props('.a:hover { }')).toEqual([]);
        expect(props('@media screen { .a:hover { color: red } }')).toEqual(['color']);
    });

    test('kein rgba()-Zahlentripel ausser den begruendeten Ausnahmen', () => {
        const stellen = [];
        cssFiles.forEach(f => {
            const css = leerKommentare(f.content);
            const zeilenAnfang = [0];
            for (let i = 0; i < css.length; i++) if (css[i] === '\n') zeilenAnfang.push(i + 1);
            const zeileVon = idx => {
                let lo = 0;
                let hi = zeilenAnfang.length - 1;
                while (lo < hi) {
                    const m = (lo + hi + 1) >> 1;
                    if (zeilenAnfang[m] <= idx) lo = m;
                    else hi = m - 1;
                }
                return lo + 1;
            };
            deklarationen(css).forEach(d => {
                if (istSchatten(d.prop)) return;
                const wert = css.slice(d.von, d.bis);
                for (const t of wert.matchAll(TRIPEL)) {
                    const abs = d.von + t.index;
                    const voll = css.slice(abs).match(/^rgba?\([^)]*\)/);
                    stellen.push({
                        datei: f.name,
                        zeile: zeileVon(abs),
                        prop: d.prop,
                        lit: voll ? voll[0] : t[0]
                    });
                }
            });
        });

        /* Gegenprobe: faellt die Zerlegung auseinander, waere die Ratsche
           gruen und leer. Die Schattentokens von variables.css sind
           Tokendefinitionen, keine Schattendeklarationen, und deshalb die
           einzigen Treffer dieser Datei.

           VIER WAREN ES BIS WELLE 3, je einmal --shadow pro Theme-Block.
           ZWOELF sind es seither, und die Zahl ist bewusst nachgezogen und
           nicht umgangen: istSchatten() prueft /(^|-)(box|text)-shadow$/ und
           /filter$/ — der Name --shadow-1 endet auf "-1" und faellt unter
           keines von beiden, das Tripel in seinem Wert zaehlt also mit. Drei
           Bloecke tragen je drei Stufen plus die Schublade (3 x 4 = 12);
           Contrast traegt Hex-Umrisse und steuert null Tripel bei. Wer die
           Leiter anfasst, aendert diese Zahl mit — das ist der Zweck. */
        expect(stellen.filter(s => s.datei === 'variables.css').length).toBe(12);

        const offen = [];
        const gezaehlt = new Map();
        stellen.forEach(s => {
            if (s.datei === 'variables.css') return;
            const a = R10_AUSNAHMEN.find(x => x.datei === s.datei && x.lit === s.lit);
            if (a) {
                const k = `${a.datei}||${a.lit}`;
                gezaehlt.set(k, (gezaehlt.get(k) || 0) + 1);
                return;
            }
            offen.push(`${s.datei}:${s.zeile} ${s.prop}: ${s.lit}`);
        });
        R10_AUSNAHMEN.forEach(a => {
            const ist = gezaehlt.get(`${a.datei}||${a.lit}`) || 0;
            if (ist !== a.anzahl) {
                offen.push(
                    `AUSNAHME ${a.datei} ${a.lit} — gefuehrt fuer ${a.anzahl} Stelle(n), ` +
                        `gefunden ${ist}`
                );
            }
        });

        /* Die Stichprobe haelt die Fehlerausgabe lesbar, solange die Ratsche
           rot ist: die Zahl ist die Aussage, zwoelf Stellen zeigen die Art. */
        expect({ anzahl: offen.length, stichprobe: offen.slice(0, 12) }).toEqual({
            anzahl: R10_ZIEL,
            stichprobe: []
        });
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 2 — R-12: Skalentoken als Toenungsflaeche
   ===========================================================================
   ZUR NUMMER. R-11 ist fuer Schritt 10 (D-6, Ereignis-Log) reserviert und
   noch nicht vergeben; diese hier entsteht aus der Pruefrunde W2-B und heisst
   deshalb R-12, nicht R-11.

   DER FEHLER, GEGEN DEN SIE STEHT. Die Schritte 4-6 ersetzen mechanisch
   rgba(R,G,B,a) durch color-mix(in srgb, var(--rolle) N%, transparent). Der
   Filter, der entscheidet, WAS mechanisch darf, lautet "das Tripel trifft
   genau EINEN Tokennamen". Dieser Filter trennt eine THEME-ROLLE (--gold,
   --red, --blue: vier Bloecke, vier Werte) nicht von einem SKALENTOKEN
   (--cat-food, --know-religion, --dmg-necrotic-text, --ra-crimson-rule: ein
   Block, ein Wert) — im Gegenteil, die Skalentokens sind die EINDEUTIGSTEN
   Treffer ueberhaupt, weil kein zweites Theme denselben Wert noch einmal
   vergibt. Sie rutschen damit zwangslaeufig durch einen Filter, der sie
   heraushalten soll.

   WARUM DAS NICHT FOLGENLOS IST, obwohl keine Farbe wechselt. Ein
   Skalentoken traegt eine BEDEUTUNG aus seinem eigenen Gegenstandsbereich:
   --cat-drink ist die Ladenkategorie "Getraenk", --know-religion das
   Wissensgebiet "Religion", --dmg-necrotic-text die TINTE der Schadensart
   "nekrotisch", --ra-crimson-rule die Linienfarbe eines Vorlesetext-Stils.
   Wer es als Flaeche einer fremden Bedienoberflaeche einsetzt, koppelt beide
   aneinander: wer die Ladenkategorien umfaerbt, faerbt dann den
   Schwierigkeitsgrad einer Begegnung mit. Das ist eine Zweckentscheidung,
   und sie ist in den Schritten 4-6 nach dem WERT gefallen statt nach dem
   Zweck. Schritt 7 Punkt (3) ist genau dafuer da und schreibt ein anderes
   Verfahren vor ("auf das TOKEN umstellen, NICHT auf color-mix").

   WAS SIE ZAEHLT. Jede background-/background-color-Deklaration in
   assets/styles/*.css, deren Wert eine Toenung color-mix(in srgb,
   var(--X) N%, transparent) enthaelt, bei der --X
     (a) zu einer Skalenfamilie gehoert (--know-, --cat-, --dmg-, --ra-) UND
     (b) themenblind ist, also in GENAU EINEM Block von variables.css
         deklariert wird.
   Punkt (b) ist der Grund, warum --attr-* und --coin-* nicht auftauchen: die
   werden je Theme neu gesetzt und sind damit Theme-Rollen, keine Skala.

   SIE VERBIETET NICHTS, SIE VERLANGT EINE BEGRUENDUNG. Es kann richtig sein,
   eine Skala als Toenung zu benutzen — dann steht die Stelle mit ihrem Grund
   in R12_AUSNAHMEN. Was sie unmoeglich macht, ist die STILLE Umstellung: eine
   mechanische Runde, die eine Bedeutungsfrage nebenbei mitentscheidet, faellt
   auf.

   SIE IST BEI IHRER GEBURT ROT, mit den 16 Stellen, die die Schritte 4-6 so
   umgestellt haben (dashboard 1, party 3, initiative 3, dmscreen 2,
   encounters 5, npcs 1, dice 1). Sie wird gruen, indem diese 16 auf ihre
   Literale zuruecknehmen und damit wieder in R-10 stehen, wo Schritt 7 sie
   nach Zweck entscheidet.
   =========================================================================== */
describe('R-12 — Skalentoken als Toenungsflaeche (Ratsche)', () => {
    /** Die Familien, die eine Skala fuehren, nicht eine Theme-Rolle. */
    const SKALENFAMILIE = /^--(know|cat|dmg|ra)-/;

    /** Begruendete Ausnahmen. Schluessel ist Datei plus Token plus Anteil —
     *  NICHT die Zeile, die verschiebt jeder Kommentar-Commit (siehe R-06).
     *  `anzahl` deckt mehrere gleichartige Stellen derselben Datei ab; deckt
     *  ein Eintrag ploetzlich mehr, meldet die Ratsche das, statt die neuen
     *  stillschweigend mitzuverzeihen.
     *
     *  SIE IST BEI DER GEBURT LEER, und das ist Absicht, nicht Vergessen —
     *  wie R10_AUSNAHMEN und EXEC_COMMAND_ALLOWLIST in
     *  editor-floating.spec.js. Schritt 7 traegt hier ein, was er nach Zweck
     *  bewusst auf einer Skala stehen laesst. */
    const R12_AUSNAHMEN = [
        {
            datei: 'bestiary.css',
            token: '--ra-parchment-rule',
            anteil: '8%',
            anzahl: 1,
            grund:
                '.bestiary-attr-cell — Entscheidung E1, Welle 2 Schritt 7. Die einzige ' +
                'Stelle, die Schritt 7 bewusst auf einer Skala stehen laesst, und die ' +
                'einzige, bei der die Skala KEINE fremde Bedeutung ist: die Zelle liegt ' +
                'im Pergament-Statblock, der keinem Theme folgt, und --ra-parchment-rule ' +
                'ist die Linienfarbe ebendieses Pergaments (die Trennlinie zwei Regeln ' +
                'darueber benutzt sie bereits). Das Zahlentripel 139,69,19 war zugleich ' +
                'Sepia --gold; nach dem Wert waere die Goldrolle richtig gewesen, nach ' +
                'dem Zweck ist es das Pergament. Farbneutral.'
        }
    ];

    /** Tokens, die in GENAU EINEM Block von variables.css deklariert sind.
     *  variables.css hat keine @media-Schachtelung; der EINE @supports-Zweig
     *  (Schritt 11, Rueckfall fuer die sechs abgeleiteten Tokens) faellt vor
     *  dem Zaehlen heraus — er greift oberhalb des Browserbodens nie, und
     *  wuerde seine sechs Tokens sonst faelschlich als themenabhaengig
     *  ausweisen. Der Rest liegt flach nebeneinander. */
    function themenblindeTokens() {
        const maskiert = ohneUnerreichbareZweige(
            cssFiles.find(f => f.name === 'variables.css').content
        ).replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
        const zahl = new Map();
        let i = 0;
        while (i < maskiert.length) {
            if (maskiert[i] !== '{') {
                i++;
                continue;
            }
            let tiefe = 1;
            let j = i + 1;
            while (j < maskiert.length && tiefe) {
                if (maskiert[j] === '{') tiefe++;
                else if (maskiert[j] === '}') tiefe--;
                j++;
            }
            new Set([...maskiert.slice(i + 1, j - 1).matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]))
                .forEach(t => zahl.set(t, (zahl.get(t) || 0) + 1));
            i = j;
        }
        return new Set([...zahl.entries()].filter(([, n]) => n === 1).map(([t]) => t));
    }

    function toenungsstellen() {
        const blind = themenblindeTokens();
        const out = [];
        cssFiles.forEach(f => {
            if (f.name === 'variables.css' || f.name === 'fonts.css') return;
            const maskiert = f.content.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
            for (const d of maskiert.matchAll(
                /(?:^|[;{\s])(background(?:-color)?)\s*:\s*([^;}]+)/g
            )) {
                const prop = d[1];
                for (const t of d[2].matchAll(
                    /color-mix\(\s*in\s+srgb\s*,\s*var\(\s*(--[\w-]+)\s*\)\s*([\d.]+)%\s*,\s*transparent\s*\)/g
                )) {
                    if (!SKALENFAMILIE.test(t[1]) || !blind.has(t[1])) continue;
                    const pos = maskiert.indexOf(prop, d.index);
                    out.push({
                        datei: f.name,
                        zeile: maskiert.slice(0, pos).split('\n').length,
                        token: t[1],
                        anteil: `${t[2]}%`,
                        prop
                    });
                }
            }
        });
        return out;
    }

    test('keine Skala traegt eine fremde Flaeche ohne eingetragene Begruendung', () => {
        const stellen = toenungsstellen();
        const gezaehlt = new Map();
        const offen = [];
        stellen.forEach(s => {
            const schluessel = `${s.datei}||${s.token}||${s.anteil}`;
            gezaehlt.set(schluessel, (gezaehlt.get(schluessel) || 0) + 1);
            if (R12_AUSNAHMEN.some(a => `${a.datei}||${a.token}||${a.anteil}` === schluessel)) {
                return;
            }
            offen.push(`${s.datei}:${s.zeile} ${s.prop}: ${s.token} ${s.anteil}`);
        });
        R12_AUSNAHMEN.forEach(a => {
            const ist = gezaehlt.get(`${a.datei}||${a.token}||${a.anteil}`) || 0;
            if (ist !== a.anzahl) {
                offen.push(
                    `AUSNAHME ${a.datei} ${a.token} ${a.anteil} — gefuehrt fuer ` +
                        `${a.anzahl} Stelle(n), gefunden ${ist}`
                );
            }
        });
        expect(offen.sort()).toEqual([]);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 2 — R-13: color-mix im Basis-:root ohne Rueckfall
   ===========================================================================
   WOGEGEN SIE STEHT. Entscheidung E4 verzichtet an den FLAECHEN bewusst auf
   einen Zwei-Deklarations-Rueckfall: eine unbekannte color-mix-Form faellt
   dort von selbst auf die vorausgehende Deklaration derselben Eigenschaft
   zurueck, und ein zusaetzliches rgba-Literal liesse R-10 an jeder Stelle
   anschlagen. Fuer TOKENS gilt das NICHT: steht color-mix im Wert eines
   Custom Property, das nur EINMAL deklariert ist, gibt es keine vorausgehende
   Deklaration, auf die zurueckgefallen werden koennte — und ein
   var(--x, ersatz) hilft auch nicht, weil der Rueckfall nur bei einem NICHT
   DEFINIERTEN Namen feuert, nicht bei einem definierten mit unbrauchbarem
   Wert. Der Wert ist dann "invalid at computed value time"; die Eigenschaft
   faellt auf ihren Anfangswert, bei background-color also auf durchsichtig.
   Eine Modalblende ist dann nicht blass, sondern weg.

   E4 ordnet die @supports-Absicherung fuer SECHS Tokens an (--gold-hover,
   --green-hover, --red-dim, --green-dim, --red-dark, --orange-dim). Schritt 3
   derselben Welle hat NEUN weitere derselben Bauart angelegt
   (--overlay-faint/-weak/-mid/-strong/-heavy, --scrim-60/-70/-75/-85). Die
   Klasse ist damit von 6 auf 15 gewachsen, ohne dass die Anordnung
   mitgewachsen waere — genau der Vorgang, gegen den diese Ratsche steht: die
   Klasse soll nicht mehr lautlos wachsen koennen.

   WAS SIE ZAEHLT. Jedes Custom Property in variables.css, dessen Wert
   color-mix( enthaelt und das in GENAU EINEM Block deklariert ist. Sie war
   bei der Geburt GRUEN mit 15 Namen; sie ist kein Nachweis, sondern ein
   Inventar. Wer einen sechzehnten anlegt, traegt ihn hier ein und beantwortet
   dabei die Frage, die Schritt 11 sonst per Buchstabentreue uebergeht.
   Vollstaendig in .planning/HANDOFF-V3-OFFENE-PUNKTE.md unter W2-B-05.

   STAND SEIT SCHRITT 11: NEUN. Die sechs von E4 benannten haben ihren
   @supports-Zweig bekommen und sind damit nicht mehr rueckfalllos; die neun
   aus Schritt 3 sind es weiterhin. Das Inventar ist also kein "erledigt",
   sondern eine kleiner gewordene Restschuld — und die verbliebenen neun
   tragen ausgerechnet die Modalblenden, also den Fall, an dem die
   Eigenschaft nicht blass wird, sondern verschwindet.

   STAND SEIT WELLE 3 SCHRITT 2: DREIZEHN. Die vier Leuchtfarben --glow-gold,
   --glow-yellow, --glow-green und --glow-red sind dazugekommen. Sie stehen im
   Basis-:root und damit in genau einem Block — dasselbe Muster, dieselbe
   Restschuld. Ihr Schadensbild ist allerdings milder als das der
   Modalblenden: faellt eine Leuchte aus, verschwindet ein Hof, nicht eine
   Flaeche. --ring-gold ist AUSDRUECKLICH NICHT dabei, obwohl es color-mix
   traegt: es steht in allen vier Theme-Bloecken und faellt damit nicht unter
   "in genau einem Block deklariert".
   =========================================================================== */
describe('R-13 — color-mix im Basis-:root ohne Rueckfall (Inventar)', () => {
    /** Die gefuehrte Menge, seit Welle 3 Schritt 2 DREIZEHN. Die sechs von E4
     *  benannten sind heraus — nicht weil jemand sie gestrichen haette,
     *  sondern weil sie einen Rueckfall bekommen haben und damit nicht mehr
     *  rueckfalllos sind (die zweite Probe unten haelt das fest). Es bleiben
     *  die neun aus Welle 2 Schritt 3 (Modalblenden und Auflagen) und die
     *  vier Leuchtfarben aus Welle 3.
     *  Sortiert, damit ein Zugang an seiner Stelle auffaellt und nicht am
     *  Listenende versteckt werden kann — die vier --glow- stehen deshalb
     *  VORNE und nicht hinten angehaengt. */
    const RUECKFALLLOSE_COLOR_MIX_TOKENS = [
        '--glow-gold',
        '--glow-green',
        '--glow-red',
        '--glow-yellow',
        '--overlay-faint',
        '--overlay-heavy',
        '--overlay-mid',
        '--overlay-strong',
        '--overlay-weak',
        '--scrim-60',
        '--scrim-70',
        '--scrim-75',
        '--scrim-85'
    ];

    /** Die sechs, die E4 herausgeloest hat, mit der Rolle, auf die ihr
     *  Rueckfall zeigt. Ein Literal stuende hier falsch: es waere themenblind
     *  und in drei von vier Themes die falsche Farbe. */
    const ABGESICHERTE = {
        '--gold-hover': '--gold',
        '--green-dim': '--green',
        '--green-hover': '--green',
        '--orange-dim': '--orange',
        '--red-dark': '--red',
        '--red-dim': '--red'
    };

    /** Die @supports-Zweige von variables.css, Bedingung und Rumpf. */
    function supportsZweige() {
        const vars = cssFiles
            .find(f => f.name === 'variables.css')
            .content.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
        const out = [];
        let i = 0;
        while ((i = vars.indexOf('@supports', i)) !== -1) {
            const auf = vars.indexOf('{', i);
            if (auf === -1) break;
            let tiefe = 1;
            let j = auf + 1;
            while (j < vars.length && tiefe) {
                if (vars[j] === '{') tiefe++;
                else if (vars[j] === '}') tiefe--;
                j++;
            }
            out.push({
                bedingung: vars.slice(i + '@supports'.length, auf).trim(),
                rumpf: vars.slice(auf + 1, j - 1)
            });
            i = j;
        }
        return out;
    }

    function gemessen() {
        const maskiert = cssFiles
            .find(f => f.name === 'variables.css')
            .content.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
        const bloecke = new Map();
        const mix = new Set();
        let i = 0;
        while (i < maskiert.length) {
            if (maskiert[i] !== '{') {
                i++;
                continue;
            }
            let tiefe = 1;
            let j = i + 1;
            while (j < maskiert.length && tiefe) {
                if (maskiert[j] === '{') tiefe++;
                else if (maskiert[j] === '}') tiefe--;
                j++;
            }
            const gesehen = new Set();
            for (const d of maskiert.slice(i + 1, j - 1).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
                gesehen.add(d[1]);
                if (d[2].includes('color-mix(')) mix.add(d[1]);
            }
            gesehen.forEach(t => bloecke.set(t, (bloecke.get(t) || 0) + 1));
            i = j;
        }
        return [...mix].filter(t => bloecke.get(t) === 1).sort();
    }

    test('die Menge der rueckfalllosen color-mix-Tokens ist die gefuehrte', () => {
        expect(gemessen()).toEqual(RUECKFALLLOSE_COLOR_MIX_TOKENS);
    });

    /* ZWEI PROBEN FUER DIE SECHS, und beide werden gebraucht. Die erste
       allein wuerde auch dann gruen bleiben, wenn jemand den Zweig durch
       einen zweiten :root-Block ersetzt — der wuerde die Farben in JEDEM
       Browser umstellen und waere eine Sichtaenderung. Die zweite allein
       wuerde nicht merken, wenn der Zweig zwar dasteht, die sechs aber
       trotzdem als rueckfalllos gemessen werden. */
    test('die sechs von E4 benannten stehen in genau einem verneinten Zweig', () => {
        const zweige = supportsZweige();
        expect(zweige.length).toBe(1);
        expect(zweige[0].bedingung).toMatch(/^not\s*\(\s*color\s*:\s*color-mix\(/);
        const gesetzt = {};
        for (const d of zweige[0].rumpf.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
            gesetzt[d[1]] = d[2].trim();
        }
        expect(Object.keys(gesetzt).sort()).toEqual(Object.keys(ABGESICHERTE).sort());
        Object.entries(ABGESICHERTE).forEach(([token, rolle]) => {
            expect(gesetzt[token]).toBe(`var(${rolle})`);
        });
    });

    test('keiner der sechs zaehlt noch als rueckfalllos', () => {
        const rueckfalllos = new Set(gemessen());
        Object.keys(ABGESICHERTE).forEach(t => {
            expect(rueckfalllos.has(t)).toBe(false);
        });
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 2 — R-11: Toenungsflaechen werden gemessen
   ===========================================================================
   IHRE ERSTE AUFGABE IST SEIT SCHRITT 8 ERLEDIGT, und das gehoert hierher,
   weil sonst niemand versteht, warum von vier Teilen nur noch zwei da sind.
   R-11 wurde in Schritt 7 geboren, um einen blinden Fleck zu beziffern:
   `ruheRegeln()` im R-04-Block siebte die zu urteilende Menge mit

       const m = flaeche.match(/^var\((--[\w-]+)\)$/);
       if (!m || NEUTRAL.test(m[1])) return;

   Eine Flaeche der Form `color-mix(in srgb, var(--x) N%, transparent)` fiel
   damit HERAUS, bevor ueberhaupt gerechnet wurde — und genau diese Form hat
   Welle 2 in den Schritten 4-7 flaechendeckend erzeugt. 128 Regeln setzten
   Toenung UND Tinte, und KEINE wurde beurteilt. Belegt per Mutation
   (Pruefung W2-C Runde 1): `.calc-diff-badge.trivial` von 20 % auf 95 %
   gestellt, Kontrast rund 1,0 in allen vier Themes, kein einziger roter Test.

   SCHRITT 8 HAT DIE SIEBUNG ERSETZT. `ruheRegeln()` erkennt die Toenung
   jetzt und rechnet sie mit WCAG.resolveOver() ueber die drei Traegerflaechen
   auf; die Begruendung steht im R-04-Block. Damit sind zwei Teile dieser
   Ratsche gegenstandslos geworden und im selben Commit entfernt:

     - die Zaehlung des blinden Flecks (`TOENUNGSREGELN_OHNE_URTEIL = 128`) —
       es gibt ihn nicht mehr, und eine Zahl, die nichts mehr misst, ist
       schlimmer als keine;
     - die vier bezifferten Rueckschritte aus W2-C-02 — sie waren die
       Notsicherung fuer die Zeit BIS Schritt 8 und sind durch dieselbe
       Schwelle an derselben Stelle ersetzt, nur haerter: R-04 verlangt 4,5,
       W2C02 verlangte nur "nicht schlechter als gestern".

   BERICHTIGUNG ZUM ZWEITEN SPIEGELSTRICH (Pruefung W2-D Runde 1, Schritt 16).
   Der Satz stimmte bei seiner Niederschrift fuer DREI der vier Eintraege.
   Fuer `.concentration-badge` stimmte er NICHT: ihre Flaeche ist ein
   `linear-gradient(…)`, und `ruheRegeln()` verankerte eine Toenung mit
   `^color-mix(…)$` — die Regel fiel aus der geurteilten Menge heraus, genau
   wie vor Schritt 8 die freistehende Toenung. Zwischen Schritt 8 und
   Schritt 16 war sie also ungedeckt, und nicht mit Luft: gemessen haelt sie
   im Dark 4,57, also 0,07 ueber der Schwelle. Eine spaetere Aenderung an
   --purple-text, an den Verlaufsstaerken oder an den Traegerflaechen waere
   lautlos durchgefallen; die E2E-Pruefung des Banners prueft Text, keine
   Farbe.

   SEIT SCHRITT 16 STIMMT DER SATZ FUER ALLE VIER. `ruheRegeln()` loest
   color-mix-Stopps INNERHALB eines Verlaufs auf und urteilt jeden einzeln;
   der Test "die beiden Toenungen IM VERLAUF stehen namentlich unter
   Aufsicht" im R-04-Block nennt `.concentration-badge` und `.spell-note`
   beim Namen, damit die Deckung nicht wieder auf einem Kommentar ruht.
   Der Satz oben bleibt deshalb stehen — er beschreibt den heutigen Stand
   richtig; was hier steht, ist, dass er es zwischenzeitlich nicht tat.

   WAS BLEIBT, ist das, was R-04 nach wie vor NICHT sieht: die ZWEITE Achse.
   R-04 urteilt ueber Tinte-gegen-Flaeche. Ob eine Marke ueberhaupt als Marke
   zu erkennen ist, entscheidet Flaeche-gegen-Traeger, und das misst nur
   diese Ratsche (Teil 1, die zehn farblosen Marken) — samt dem einzigen
   bedeutungstragenden Paar eines Fortschrittsbalkens (Teil 2).
   =========================================================================== */
describe('R-11 — Toenungsflaechen werden gemessen, nicht uebersprungen (Ratsche)', () => {
    /** D-2: massgeblich ist das Minimum ueber die tatsaechlichen Traegerflaechen. */
    const TRAEGER = ['--bg-card', '--bg-dark', '--bg-elevated'];

    /* Die Siebung `toenungsRegeln()` stand bis Schritt 8 hier. Sie ist
       entfallen, weil `ruheRegeln()` im R-04-Block dieselbe Menge jetzt
       BEURTEILT statt sie nur zu zaehlen — zwei Siebungen fuer dieselbe Menge
       waeren zwei Orte, an denen sie auseinanderlaufen koennen. */

    /** Eine Regel ueber Datei und Selektor holen. Fehlt sie, ist das ein Befund
     *  und keine stille Null — eine umbenannte Regel darf die Ratsche nicht
     *  entwaffnen. */
    function regel(datei, sel) {
        const f = cssFiles.find(x => x.name === datei);
        if (!f) return null;
        return regelnMitRumpf(f.content).find(r => r.sel === sel) || null;
    }

    /**
     * BEIDE Achsen einer Toenung, je Theme das Minimum ueber die drei neutralen
     * Traegerflaechen.
     *
     * WARUM ZWEI ZAHLEN UND NICHT EINE: die Pruefung W2-C hat an den farblosen
     * Zustandsmarken gezeigt, dass eine Toenungsentscheidung zwei Kanten bewegt.
     * Tinte/Flaeche sagt, ob die Beschriftung lesbar ist; Flaeche/Traeger sagt,
     * ob die Marke ueberhaupt als Marke zu erkennen ist. Schritt 7 hatte nur die
     * erste gemessen und dabei die zweite von 1,30-1,71 auf 1,08-1,21 gedrueckt,
     * ohne dass es auffiel.
     */
    function beideAchsen(flaecheExpr, tinteExpr) {
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const tinte = {};
        const flaeche = {};
        WCAG.THEMES.forEach(t => {
            const p = { ...pals[t], ...alias };
            const ink = WCAG.resolve(tinteExpr, p);
            let mi = Infinity;
            let mf = Infinity;
            TRAEGER.forEach(s => {
                const grund = WCAG.resolve(`var(${s})`, p);
                const feld = WCAG.resolveOver(flaecheExpr, p, grund);
                if (!ink || !feld || !grund) return;
                mi = Math.min(mi, WCAG.ratio(ink, feld));
                mf = Math.min(mf, WCAG.ratio(feld, grund));
            });
            tinte[t] = Number.isFinite(mi) ? Number(mi.toFixed(2)) : null;
            flaeche[t] = Number.isFinite(mf) ? Number(mf.toFixed(2)) : null;
        });
        return { tinte, flaeche };
    }

    const reihe = o => WCAG.THEMES.map(t => `${t} ${o[t]}`).join(' · ');

    /* -------------------------------------------------------------------
       (1) Die zehn farblosen Marken
       ------------------------------------------------------------------- */

    /** Die zehn Regeln, die "keine Farbe" bedeuten: vier farblose Zustaende je
     *  Zustandsdatei, dazu die beiden neutralen Beziehungsmarken. Sie fuehren
     *  EINE Bauart — Toenung der gedaempften Textrolle, Tinte die Textrolle —,
     *  und beide Achsen sind gemessen. Die Staerke steht daneben, weil sie
     *  zwischen den Gruppen verschieden ist (30 % Zustaende, 20 % Beziehungen). */
    const FARBLOS = [
        { datei: 'core.css', sel: '.condition-blinded', staerke: 30 },
        { datei: 'core.css', sel: '.condition-deafened', staerke: 30 },
        { datei: 'core.css', sel: '.condition-petrified', staerke: 30 },
        { datei: 'core.css', sel: '.condition-exhaustion', staerke: 30 },
        { datei: 'dmscreen.css', sel: '.condition-badge.blinded', staerke: 30 },
        { datei: 'dmscreen.css', sel: '.condition-badge.deafened', staerke: 30 },
        { datei: 'dmscreen.css', sel: '.condition-badge.petrified', staerke: 30 },
        { datei: 'dmscreen.css', sel: '.condition-badge.exhaustion', staerke: 30 },
        { datei: 'dmscreen.css', sel: '.relationship-badge.neutral', staerke: 20 },
        { datei: 'initiative.css', sel: '.npc-relation-status.neutral', staerke: 20 }
    ];

    /** Gemessen am 2026-09-29, Pruefung W2-C Runde 1. Beide Zahlenreihen sind
     *  Untergrenzen: sie duerfen steigen, nicht fallen. */
    const FARBLOS_SOLL = {
        30: {
            tinte: { dark: 7.49, light: 9.67, sepia: 5.99, contrast: 8.72 },
            flaeche: { dark: 1.52, light: 1.47, sepia: 1.47, contrast: 1.66 }
        },
        20: {
            tinte: { dark: 8.75, light: 11.06, sepia: 6.87, contrast: 10.86 },
            flaeche: { dark: 1.28, light: 1.28, sepia: 1.28, contrast: 1.32 }
        }
    };

    test('die zehn farblosen Marken halten auf BEIDEN Achsen', () => {
        const befunde = [];
        FARBLOS.forEach(({ datei, sel, staerke }) => {
            const r = regel(datei, sel);
            if (!r) {
                befunde.push(`${datei} ${sel}: Regel nicht gefunden — umbenannt oder entfernt`);
                return;
            }
            const flaeche = deklaration(r.rumpf, 'background(?:-color)?');
            const tinte = deklaration(r.rumpf, 'color');
            const soll = `color-mix(in srgb, var(--text-dim) ${staerke}%, transparent)`;
            if (flaeche !== soll) {
                befunde.push(`${datei} ${sel}:${r.zeile} traegt ${flaeche}, erwartet ${soll}`);
            }
            if (tinte !== 'var(--text)') {
                befunde.push(
                    `${datei} ${sel}:${r.zeile} traegt Tinte ${tinte}; die farblose Gruppe ` +
                        `fuehrt var(--text), weil var(--text-dim) auf ihrer eigenen Toenung ` +
                        `nur 2,79-3,76 ergibt`
                );
                return;
            }
            const ist = beideAchsen(flaeche, tinte);
            const sollWerte = FARBLOS_SOLL[staerke];
            WCAG.THEMES.forEach(t => {
                if (ist.tinte[t] === null || ist.flaeche[t] === null) {
                    befunde.push(`${datei} ${sel}: ${t} nicht aufloesbar`);
                    return;
                }
                if (ist.tinte[t] < sollWerte.tinte[t]) {
                    befunde.push(
                        `${datei} ${sel}: Tinte/Flaeche ${t} ${ist.tinte[t]} < ` +
                            `${sollWerte.tinte[t]} (${reihe(ist.tinte)})`
                    );
                }
                if (ist.flaeche[t] < sollWerte.flaeche[t]) {
                    befunde.push(
                        `${datei} ${sel}: Flaeche/Traeger ${t} ${ist.flaeche[t]} < ` +
                            `${sollWerte.flaeche[t]} — die Marke verschmilzt mit der Karte ` +
                            `(${reihe(ist.flaeche)})`
                    );
                }
                if (ist.tinte[t] < 4.5) {
                    befunde.push(`${datei} ${sel}: Tinte/Flaeche ${t} ${ist.tinte[t]} < 4,5`);
                }
            });
        });
        expect(befunde.sort()).toEqual([]);
    });

    /* -------------------------------------------------------------------
       (2) Die Laufschiene des Soundboards
       ------------------------------------------------------------------- */

    /** Fuellung gegen Schiene ist das einzige bedeutungstragende Paar eines
     *  Fortschrittsbalkens (WCAG 1.4.11). Gemessen ueber `.sb-track-row`, der
     *  tatsaechlichen Traegerflaeche, nicht ueber --bg-card. Light liegt mit
     *  2,07 unter 3,0 und lag es vor Welle 2 ebenso — kein Rueckschritt, aber
     *  gefuehrt. */
    const SCHIENE_SOLL = {
        fuellung: { dark: 5.49, light: 2.07, sepia: 4.51, contrast: 7.74 },
        schiene: { dark: 1.33, light: 1.28, sepia: 1.28, contrast: 1.46 }
    };

    test('die Laufschiene des Soundboards traegt ihre Fuellung', () => {
        const schiene = regel('tools.css', '.sb-progress');
        const fuellung = regel('tools.css', '.sb-progress-fill');
        expect(Boolean(schiene && fuellung)).toBe(true);
        const schieneWert = deklaration(schiene.rumpf, 'background(?:-color)?');
        const fuellWert = deklaration(fuellung.rumpf, 'background(?:-color)?');
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];
        WCAG.THEMES.forEach(t => {
            const p = { ...pals[t], ...alias };
            const reihenGrund = WCAG.resolve('var(--bg-elevated)', p);
            const s = WCAG.resolveOver(schieneWert, p, reihenGrund);
            const f = WCAG.resolveOver(fuellWert, p, reihenGrund);
            if (!s || !f) {
                befunde.push(`${t}: ${!s ? schieneWert : fuellWert} nicht aufloesbar`);
                return;
            }
            const gegenFuellung = Number(WCAG.ratio(f, s).toFixed(2));
            const gegenReihe = Number(WCAG.ratio(s, reihenGrund).toFixed(2));
            if (gegenFuellung < SCHIENE_SOLL.fuellung[t]) {
                befunde.push(
                    `Fuellung/Schiene ${t} ${gegenFuellung} < ${SCHIENE_SOLL.fuellung[t]}`
                );
            }
            if (gegenReihe < SCHIENE_SOLL.schiene[t]) {
                befunde.push(
                    `Schiene/Reihe ${t} ${gegenReihe} < ${SCHIENE_SOLL.schiene[t]} — die ` +
                        `leere Schiene verschwindet in der Track-Reihe`
                );
            }
        });
        expect(befunde.sort()).toEqual([]);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 2 — R-14: Quergriffe (Ratsche)
   ===========================================================================
   DIE BAUART. Die Toenung steht in der ELTERNregel, die Tinte in einer
   Nachfahrenregel:

       .enc-save-box.active                 { background: color-mix(… --green …); }
       .enc-save-box.active .enc-save-label { color: var(--green-text); }

   Keine bestehende Ratsche urteilt darueber. R-04 verlangt Flaeche UND Tinte
   in DERSELBEN Regel — die Elternregel hat keine Tinte, die Kindregel keine
   Flaeche, also faellt das Paar durch beide Maschen. R-05 modelliert die
   Kaskade, aber nur fuer eine benannte Liste von Elementzustaenden, und keiner
   dieser Zustaende beschreibt einen Quergriff.

   WAS DAS GEKOSTET HAT. Schritt 8 hat drei Quergriffe von Hand gefunden und
   behoben und ihre Zahlen in den CSS-Kommentar geschrieben. Die Pruefung W2-D
   Runde 1 hat einen VIERTEN gefunden, der genauso gebaut ist und beim Zaehlen
   uebersehen wurde: `initiative.css .concentration-check-banner .conc-dc`
   traegt var(--gold) auf den beiden ungedeckelten 15-%-Stopps der Elternregel
   und misst in Light 2,35 bzw. 2,16 — schlechter als der schlechteste der drei
   behobenen (2,21). Die Zahlen standen sogar schon im CSS-Kommentar von
   Schritt 7; sie waren nur nie gegen eine Schwelle gehalten.

   Gefuehrt war die Stelle als Gruppe E von W1-D-01, ueberschrieben "in keinem
   erreichbaren Zustand gerendert". Das ist widerlegt: die E2E-Pruefung des
   Konzentrations-Banners erzeugt es ueber einen realen Klick auf die
   Schadensschaltflaeche und prueft danach `.conc-dc` auf "DC 10".

   WAS DIESE RATSCHE TUT, und wo ihre Grenze liegt. Sie sucht SELBER, statt
   eine Liste zu fuehren: jede Regel mit Rollen-Toenungsstopps (freistehend
   oder im Verlauf) wird mit jeder Regel DERSELBEN Datei gepaart, deren
   Selektor eine Nachfahrenschreibweise davon ist und die KEINE eigene Flaeche
   setzt. Die eigene Flaeche ist der entscheidende Ausschluss: `.conc-roll-btn`
   sitzt im selben Banner, setzt aber `background: var(--purple)` — seine Tinte
   liegt auf dem Knopf, nicht auf der Toenung des Elters, und ohne diesen
   Ausschluss meldete die Ratsche vier Fehlalarme mit Werten um 1,2.

   Ihre Grenze ist die SELEKTOR-Verschachtelung. Ein Kind, das im DOM unter der
   Toenung liegt, ohne dass sein Selektor das sagt (`.spell-info-line.classes`
   unter `.spell-card-header`), sieht sie nicht — das ist die Gruppe B von
   W1-D-01, ein eigener offener Punkt mit 11 Stellen und einem eigenen
   Loesungsweg.

   Die vier Paare stehen als MENGE unter Aufsicht, nicht nur ihre Werte: wer
   einen fuenften Quergriff anlegt, bekommt einen roten Test und muss ihn
   ausrechnen, statt ihn stillschweigend in den blinden Fleck zu legen.
   =========================================================================== */
describe('R-14 — Toenung im Elter, Tinte im Kind (Ratsche)', () => {
    /** Dieselben drei Traegerflaechen wie in R-04 und R-11 (D-2). */
    const TRAEGER = ['--bg-card', '--bg-dark', '--bg-elevated'];
    const SCHWELLE = 4.5;

    const TOENUNGSSTOPP =
        /^color-mix\(\s*in\s+srgb\s*,\s*var\(\s*(--[\w-]+)\s*\)\s+[\s\S]+,\s*transparent\s*\)$/i;
    const NEUTRAL = /^--(bg|surface|border|overlay|scrim)(-|$)/;

    /** Klammergenaue Abgrenzung — `min(20%, var(--tint-max))` bringt eigene
     *  Klammern und ein eigenes Komma mit. */
    function mixAusdruecke(wert) {
        const out = [];
        const re = /color-mix\s*\(/gi;
        let m;
        while ((m = re.exec(wert))) {
            let tiefe = 0;
            let i = m.index + m[0].length - 1;
            for (; i < wert.length; i++) {
                if (wert[i] === '(') tiefe++;
                else if (wert[i] === ')') {
                    tiefe--;
                    if (!tiefe) break;
                }
            }
            if (tiefe === 0) out.push(wert.slice(m.index, i + 1));
        }
        return out;
    }

    const selektorTeile = sel =>
        sel
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);

    /** Alle Quergriff-Paare des Baums. */
    function quergriffe() {
        const out = [];
        cssFiles.forEach(f => {
            if (f.name === 'variables.css' || f.name === 'fonts.css') return;
            const regeln = regelnMitRumpf(f.content);
            regeln.forEach(eltern => {
                const roh = deklaration(eltern.rumpf, 'background(?:-color)?');
                if (!roh) return;
                const stopps = mixAusdruecke(roh.replace(/\s+/g, ' ')).filter(x => {
                    const m = x.match(TOENUNGSSTOPP);
                    return m && !NEUTRAL.test(m[1]);
                });
                if (!stopps.length) return;
                regeln.forEach(kind => {
                    if (kind === eltern) return;
                    // Eigene Flaeche: die Tinte liegt nicht auf der Toenung.
                    if (deklaration(kind.rumpf, 'background(?:-color)?')) return;
                    const tinte = deklaration(kind.rumpf, 'color');
                    if (!tinte) return;
                    const m = tinte.match(/^var\((--[\w-]+)\)$/);
                    if (!m || NEUTRAL.test(m[1])) return;
                    const verschachtelt = selektorTeile(eltern.sel).some(p =>
                        selektorTeile(kind.sel).some(k => k.startsWith(p + ' '))
                    );
                    if (!verschachtelt) return;
                    out.push({ datei: f.name, eltern, kind, stopps, tinte });
                });
            });
        });
        return out;
    }

    /** DIE MENGE, nicht nur die Werte. Ein weiterer Quergriff ist ein Befund,
     *  bis jemand ihn ausrechnet und hier eintraegt. */
    const ERWARTETE_PAARE = [
        'dashboard.css .char-save-box.proficient -> .char-save-box.proficient .save-label',
        'dashboard.css .enc-save-box.active -> .enc-save-box.active .enc-save-label',
        'initiative.css .concentration-check-banner -> .concentration-check-banner .conc-dc',
        'initiative.css .init-entry.lair -> .init-entry.lair .init-name',
        /* DER FUENFTE, und er ist genau so entstanden, wie diese Ratsche es
           vorsieht: Pruefung W3-E, Runde 1 hat die Tinte der Lair-Unterzeile
           aus dem Markup ins CSS geholt — sie stand inline und war damit fuer
           jede Rechnung unsichtbar —, und im selben Zug war der Quergriff da:
           dieselbe Elternregel, dieselbe Toenung, derselbe Nachfahre ohne
           eigene Flaeche wie beim vierten eine Zeile darueber. Der Test wurde
           rot, die Zahl ist ausgerechnet und steht im Test darunter:
           var(--red-text) ueber dem 10-%-Rotstopp haelt ueber die
           D-2-Dreierliste 4,97 · 4,55 · 4,60 · 5,48 — Zahl fuer Zahl dieselbe
           Reihe wie .init-name, weil es dieselbe Tinte auf derselben Toenung
           ist. Vorher trug die Zeile inline var(--red) und war gar kein
           Quergriff, weil im CSS nichts stand, worauf man haette zeigen
           koennen: der blinde Fleck war nicht diese Ratsche, sondern der
           Inline-Stil. */
        'initiative.css .init-entry.lair -> .init-entry.lair .init-type'
    ];

    test('die fuenf bekannten Quergriffe sind die einzigen im Baum', () => {
        const gefunden = quergriffe()
            .map(q => `${q.datei} ${q.eltern.sel} -> ${q.kind.sel}`)
            .sort();
        expect(gefunden).toEqual(ERWARTETE_PAARE);
    });

    test('jeder Quergriff haelt 4,5 auf der Toenung seines Elters', () => {
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];

        quergriffe().forEach(q => {
            const werte = {};
            let fehlt = null;
            WCAG.THEMES.forEach(theme => {
                const p = { ...pals[theme], ...alias };
                const tinte = WCAG.resolve(q.tinte, p);
                if (!tinte) {
                    fehlt = fehlt || `${theme}: ${q.tinte}`;
                    return;
                }
                let min = Infinity;
                q.stopps.forEach(stopp => {
                    TRAEGER.forEach(s => {
                        const grund = WCAG.resolve(`var(${s})`, p);
                        const feld = grund ? WCAG.resolveOver(stopp, p, grund) : null;
                        if (!feld) {
                            fehlt = fehlt || `${theme}: ${stopp} ueber ${s}`;
                            return;
                        }
                        min = Math.min(min, WCAG.ratio(tinte, feld));
                    });
                });
                werte[theme] = Number(min.toFixed(2));
            });
            if (fehlt) {
                befunde.push(
                    `${q.datei} ${q.kind.sel}:${q.kind.zeile} — nicht aufloesbar (${fehlt}). ` +
                        `Was der Rechner nicht kennt, darf nicht als gruen gelten`
                );
                return;
            }
            const min = Math.min(...WCAG.THEMES.map(t => werte[t]));
            if (min < SCHWELLE) {
                const zahlen = WCAG.THEMES.map(t => `${t} ${werte[t]}`).join(' · ');
                befunde.push(
                    `${q.datei} ${q.kind.sel}:${q.kind.zeile} setzt ${q.tinte} auf die ` +
                        `Toenung von "${q.eltern.sel}":${q.eltern.zeile}: min ${min} < ` +
                        `${SCHWELLE} (${zahlen})`
                );
            }
        });

        expect(befunde.sort()).toEqual([]);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 2 — R-15: die sechs Attributfarben bleiben
   unterscheidbar (Ratsche zu D-6)
   ===========================================================================
   ZUR NUMMER. Der Plan zu Schritt 9 nennt sie "R-11". Diese Nummer ist seit
   Schritt 7 mit "Toenungsflaechen werden gemessen" belegt, und die Vergabe
   steht sogar im Kopf von R-12 als Reservierung, die dann anders eingeloest
   wurde. Wer dem Plan woertlich folgt, ueberschreibt eine gruene Ratsche.
   Dieselbe Verwechslung ist schon in Schritt 1 passiert (der Handoff nannte
   R-10 "R-03"). Die naechste freie Nummer ist R-15, und die hier heisst so.

   WORUEBER SIE URTEILT. Entscheidung D-6 sagt, die sechs Attributfarben
   muessen unterscheidbar BLEIBEN, und misst das am kleinsten Abstand zweier
   benachbarter Farbtoene. Bis hierher gab es dazu nichts: null Treffer in
   tests/, und der Kontrastrechner hatte gar keine Farbtonfunktion. D-6 war
   damit eine Absichtserklaerung, keine Schranke.

   DER BODEN IST GEMESSEN, NICHT ZITIERT. D-6 spricht von "30 Grad". Das ist
   eine Rundung: am Ausgangsbestand vor Welle 1 (ca85d1b, identisch mit der
   Wellenbasis 6ea67ed) betraegt der kleinste Nachbarabstand

       dark 29,63 · light 29,63 · sepia 30,67 · contrast 29,63

   Eine woertliche Schranke ">= 30" waere also am Ausgangsbestand in DREI von
   vier Themes rot gewesen — sie haette nicht die Verschlechterung gemeldet,
   gegen die sie steht, sondern den Zustand, den sie schuetzen soll. Der Boden
   ist deshalb je Theme der dort gemessene Wert.

   SPIELRAUM AN HEAD, und warum das die eigentliche Nachricht ist:

       dark 29,63 (0,00) · light 29,74 (+0,11) · sepia 30,85 (+0,18)
       contrast 29,63 (0,00)

   In Dark und Contrast liegt der heutige Wert EXAKT auf dem Boden. Jede
   kuenftige Verschiebung nach unten schlaegt sofort an. Das ist gewollt: der
   Vergleich ist einseitig (eine groessere Luecke faellt nicht durch) und ohne
   Toleranz.

   WER ROT ANFASST, BEWEGT DIESE RATSCHE MIT. Das Token der Staerke ist in
   KEINEM Theme ein eigener Wert: dark und contrast fuehren die Rot-Rolle,
   light und sepia deren Textvariante. Das Minimum ist in jedem Theme der
   Umbruch CHA -> STR, haengt also unmittelbar an Rot. Bei festgehaltenen
   fuenf anderen Toenen ist das erlaubte STR-Farbtonfenster (in
   0,1-Grad-Schritten gerechnet) dark/light/contrast 0,0-8,0 Grad und sepia
   0,7-6,8 Grad — heutiger Sepia-Wert 0,85, also 0,15 Grad Luft nach unten.

   EMPFINDLICHKEIT GEGEN HEX-RUNDUNG: plus/minus 1 in einem Kanal verschiebt
   den Abstand um bis zu 0,65 Grad (light dex). Wer die Light-/Sepia-Werte
   kuenftig per Faktor neu herleitet, braucht dafuer 0,7 Grad Toleranz — und
   senkt damit den wirksamen Boden auf 28,9. Das ist eine Entscheidung, keine
   Formsache, und sie gehoert dann hierher.

   VIER BEFUNDARTEN, nicht nur die Zahl:
     (1) der kleinste Nachbarabstand liegt unter dem Boden;
     (2) ein Attributtoken ist in einem Theme nicht aufloesbar (Alias ins
         Leere, Tippfehler). R-01 prueft nur die NAMENsmenge, nicht den Wert;
     (3) Saettigung 0 — der Farbton ist dann undefiniert. Die Ratsche scheitert
         HART, statt die Farbe als 0 Grad zu fuehren, wo sie zufaellig mit der
         Staerke kollidierte und minNb 0 statt einer sprechenden Meldung
         ergaebe;
     (4) Leerlaufschutz wie bei R-09: sechs Attribute, vier Themes. Eine
         Schleife ueber eine leer gewordene Menge ist gruen und prueft nichts.

   SIE IST BEI IHRER GEBURT GRUEN, und das ist kein Versehen — Schritt 9
   aendert an den Attributfarben NICHTS (Entscheidung E3 geht ueber die
   Hover-Flaeche, nicht ueber die Toene, und D-5 hat Dark/Contrast
   eingefroren). Ihr Rotlauf ist deshalb eine Mutationsprobe, kein
   Ausgangsbestand. Drei Proben, ausgefuehrt und zurueckgenommen:

     - das Token der Ausstrahlung in variables.css von #ec4899 auf #f0448f
       gerueckt (Farbton 330,37 -> 333,84, also 3,47 Grad naeher an die
       Staerke) meldet "dark: minNb 26,16 < 29,63 — die Attributfarben
       ruecken zusammen" samt der sortierten Farbtonreihe;
     - dasselbe mit dem kleinstmoeglichen Schritt, den die Abnahme dieses
       Schritts nennt: #ee4897 liegt GENAU ein Grad naeher (330,37 ->
       331,45, in Hex nicht feiner aufloesbar) und meldet in dark UND
       contrast "minNb 28,55 < 29,63". Ein Grad reicht also — die Ratsche
       ist so scharf, wie ihr Spielraum von 0,00 es verlangt;
     - das Token der Weisheit auf #808080 gesetzt meldet die Graustufe als
       eigenen, sprechenden Befund UND laesst den Rechner werfen — beides,
       weil die Ratsche gar nicht erst zu einer Zahl kommen soll;
     - ein Verweis ins Leere meldet "loest zu keinem Farbwert auf".

   NEBENSATZ AUS D-6, DER FALSCH IST und deshalb hier steht statt umgesetzt zu
   werden: D-6 verlangt fuer die Konstitution eine eigene Regel in der
   Schnellreferenz. Dort gibt es gar keine KON-Zelle — das Markup
   (assets/templates/modals-editors.html) fuehrt sieben Beispielzeilen mit
   STR, DEX, DEX, INT, WIS, WIS, CHA. Eine .attr-con-Regel waere toter
   Buchstabe; R-08 bindet Markup und Regel ohnehin aneinander und meldete die
   fehlende Regel selbst, sobald jemand eine KON-Zeile schreibt. Der Nebensatz
   ist damit erledigt, nicht offen. Das Konstitutionstoken ist trotzdem Teil
   dieser Ratsche: es traegt in den beiden DM-Screen-Widgets.
   =========================================================================== */
describe('R-15 — die sechs Attributfarben bleiben unterscheidbar (Ratsche zu D-6)', () => {
    /** Die sechs Attribute in der Reihenfolge von variables.css. Die Namen
     *  sind ausserdem an anderer Stelle eingefroren (F-18 verlangt die
     *  Schreibweise woertlich), ein umbenanntes Token faellt also doppelt
     *  auf. */
    const ATTRIBUTE = [
        '--attr-str',
        '--attr-dex',
        '--attr-con',
        '--attr-int',
        '--attr-wis',
        '--attr-cha'
    ];

    /** Der am Ausgangsbestand ca85d1b gemessene kleinste Nachbarabstand je
     *  Theme. Vergleich `>=`, auf zwei Nachkommastellen, einseitig, ohne
     *  Toleranz. Befehl:
     *    git show ca85d1b:assets/styles/variables.css > <datei>
     *  Dort stehen die sechs Toene in EINEM Aliasblock statt je Theme —
     *  deshalb sind dark, light und contrast dort zahlengleich. */
    const BODEN = { dark: 29.63, light: 29.63, sepia: 30.67, contrast: 29.63 };

    test('der kleinste Farbtonabstand der Attributfarben sinkt in keinem Theme', () => {
        // Gegenproben zuerst: ohne sie prueften die Schleifen ueber Leerlauf.
        expect(ATTRIBUTE.length).toBe(6);
        expect(WCAG.THEMES.length).toBe(4);
        expect(Object.keys(BODEN).sort()).toEqual([...WCAG.THEMES].sort());

        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];

        WCAG.THEMES.forEach(theme => {
            const p = { ...pals[theme], ...alias };

            // (2) Aufloesbarkeit. R-01 prueft die Namensmenge, nicht den Wert.
            const werte = {};
            let unaufloesbar = false;
            ATTRIBUTE.forEach(token => {
                if (!(token in p)) {
                    befunde.push(`${theme}: ${token} ist im Theme-Block nicht deklariert`);
                    unaufloesbar = true;
                    return;
                }
                const hex = WCAG.resolve(p[token], p);
                if (!hex) {
                    befunde.push(
                        `${theme}: ${token} = ${p[token]} loest zu keinem Farbwert auf — ` +
                            `ein Verweis ins Leere oder ein Tippfehler im Tokennamen`
                    );
                    unaufloesbar = true;
                    return;
                }
                werte[token] = hex;
            });
            if (unaufloesbar) return;

            // (3) Saettigung 0. Hart scheitern statt als 0 Grad fuehren.
            const grau = ATTRIBUTE.filter(t => WCAG.hue(werte[t]) === null);
            if (grau.length) {
                grau.forEach(t =>
                    befunde.push(
                        `${theme}: ${t} = ${werte[t]} ist eine Graustufe, ihr Farbton ist ` +
                            `undefiniert. Als 0 Grad gefuehrt kollidierte sie zufaellig mit ` +
                            `der Staerke und ergaebe einen Nachbarabstand von 0`
                    )
                );
                return;
            }

            // (1) Die eigentliche Schranke.
            const ist = WCAG.minNachbarabstand2(ATTRIBUTE.map(t => werte[t]));
            if (ist < BODEN[theme]) {
                const reihe = ATTRIBUTE.map(t => ({ t, h: WCAG.hue(werte[t]) }))
                    .sort((a, b) => a.h - b.h)
                    .map(x => `${x.t.slice(7)} ${x.h.toFixed(2)}`)
                    .join(' · ');
                befunde.push(
                    `${theme}: minNb ${ist} < ${BODEN[theme]} — die Attributfarben ruecken ` +
                        `zusammen. Farbtoene sortiert: ${reihe}`
                );
            }
        });

        expect(befunde.sort()).toEqual([]);
    });

    test('der heutige Stand steht als Zahl da, nicht nur als "haelt"', () => {
        // Eine Ratsche, die nur "gruen" sagt, verschweigt, wieviel Luft sie
        // hat. In Dark und Contrast ist es null.
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const ist = {};
        WCAG.THEMES.forEach(theme => {
            const p = { ...pals[theme], ...alias };
            ist[theme] = WCAG.minNachbarabstand2(ATTRIBUTE.map(t => WCAG.resolve(p[t], p)));
        });
        expect(ist).toEqual({ dark: 29.63, light: 29.74, sepia: 30.85, contrast: 29.63 });
    });

    test('die Staerke haengt an der Rot-Rolle, und das darf nicht unbemerkt wegfallen', () => {
        /* Der Boden dieser Ratsche haengt am Farbton der Staerke (das Minimum
           ist in jedem Theme der Umbruch CHA -> STR). Sie ist in keinem Theme
           ein eigener Wert. Wird diese Kopplung geloest, gilt die Begruendung
           im Kopf dieses Blocks nicht mehr — dann muss sie neu geschrieben
           werden, und dieser Test ist die Stelle, an der das auffaellt. */
        const pals = WCAG.palettes();
        const roh = {};
        WCAG.THEMES.forEach(t => {
            roh[t] = (pals[t]['--attr-str'] || '').trim();
        });
        expect(roh).toEqual({
            dark: 'var(--red)',
            light: 'var(--red-text)',
            sepia: 'var(--red-text)',
            contrast: 'var(--red)'
        });
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 2 — R-16: Tinte auf JS-gesetzter Flaeche (Ratsche)
   ===========================================================================
   DIESELBE LUECKE WIE BEI R-09, EINE ETAGE GROESSER. R-02 bis R-05, R-07/R-08,
   R-10 bis R-15 lesen CSS. Was ein Template-Literal in eine style=-Zeichenkette
   schreibt, sieht keine von ihnen. R-09 hat diese Luecke fuer EINE Datei
   geschlossen (die Ortsfarben); die uebrigen Stellen derselben Bauart waren
   bis Welle 2 Schritt 10 unbewacht.

   DIE SIGNATUR, an der man sie erkennt: `style="background: <Akzent>;
   color: var(--bg-dark)"`. Eine FLAECHENfarbe als Tinte. Das liest sich im
   Dark-Theme richtig — --bg-dark ist dort fast schwarz, und auf einer hellen
   Akzentflaeche ist fast schwarz die richtige Wahl. In Light ist --bg-dark
   #f5f5f5, in Sepia #f4e4c1: dieselbe Zeile schreibt dort fast weiss auf
   dieselbe helle Flaeche. Gemessen (eigene Rechnung, Rechner an Welle 1
   geeicht) reicht das von 2,51 bis 4,43 — der Verfolgen-Knopf der Quests
   erreicht in Light 2,98, die Zaubergrad-Pille in Sepia 2,93.

   WAS SIE ZAEHLT UND WAS SIE PRUEFT — fuenf Teile:

   (1) Die Signatur selbst, ueber alle sechs Quellordner: 0 Treffer. Der
       Suchbefehl ist zeichengleich der aus W1-C-02, damit die Zahl
       vergleichbar bleibt. Er fand dort fuenf Stellen, und diese fuenf sind
       der Rotlauf dieser Ratsche.

   (2) Die Quest-Status-Pille fuehrt ROLLENNAMEN, nicht Farbwerte, und die
       Vorlage baut daraus Flaeche und Tinte. Das ist die Bauform aus D-7/R-09
       (locations-render.js) — sie ist der Grund, warum eine spaetere Aenderung
       an einer Rolle hier nicht nachgezogen werden muss.

   (3) Die Seltenheitsskala steht in Tokens statt in Hexwerten, und zwar
       GETRENNT nach Flaeche und Tinte. Die Trennung ist der ganze Punkt:
       Paragraph 7 erlaubt einer bedeutungstragenden Skala, themenunabhaengig
       zu sein — aber nur "als Flaeche/Rahmen; als Text nur ueber theme-faehige
       Ableitungen". Die Seltenheit war beides zugleich, mit denselben fuenf
       Werten.

   (4) Jede Seltenheits-TINTE haelt 4,5 ueber die Traegerflaechen ihrer drei
       Textstellen, in allen vier Themes. Hier lag der schlechteste Einzelwert
       des ganzen Farbbefunds: der Gegenstandsname in "sehr selten" erreichte
       in Sepia 1,12 auf der ausgewaehlten Zeile. Er stand in KEINER
       Bestandsliste, weil der Suchbefehl von W1-C-02 nach `color: var(--bg-dark)`
       sucht und diese Stelle die Farbe als Text setzt.
       DIE ZWEI AUFLAGEN DIESER TRAEGERLISTE WERDEN GELESEN, NICHT WIEDERHOLT
       (Pruefrunde W2-E, Runde 1): der Spielraum betraegt hier 0,00 bis 0,11,
       und eine eingetippte Toenung neben so wenig Luft ist eine Ratsche, die
       gegen ihre eigene Abschrift rechnet statt gegen die Gestaltung. Siehe
       den Kommentar zu auswahlToenung() weiter unten.

   (5) Die Tinte der Seltenheits-MARKE ist themenblind und haelt auf allen
       fuenf Flaechen. Themenblind, weil die Flaeche es ist — genau das Muster,
       das Welle 1 Schritt 8 an der SW-Update-Leiste beschlossen hat. Weiss
       waere dort 1,53-2,72 und damit keine Alternative.

   (6) Die Textstellen BENUTZEN die Tintentabelle auch. Nachgetragen in der
       Pruefung W2-E, Runde 1: die Teile (1) bis (5) beurteilten die TABELLE
       und die WERTE, aber keine von ihnen las die Stellen, die sie brauchen.
       Dreht man in initiative-loot.js beide `${rarityInk}` wieder auf
       `${rarityBg}` zurueck — also genau der 1,12-Fall, den Schritt 10
       repariert hat —, blieb die volle Suite gruen: Teil (1) sucht nach
       `color: var(--bg-…)` und sieht ein `${rarityBg}` nicht, Teil (3) liest
       core/constants.js, Teil (4) urteilt ueber Tokenwerte statt ueber
       Verwendung. Die Lehre des Befunds W2-E-04 lautet: wer eine Skala
       absucht, muss nach ihrem NAMEN suchen. Dieser Teil tut das — er liest
       die Quelltexte, wie R-09 es fuer die Ortsfarben tut.

   WARUM DIE SCHWELLE HIER 4,5 IST UND NICHT DIE D-2-MINIMIERUNG ueber die vier
   neutralen Flaechen: die Traeger dieser Stellen sind keine neutralen
   Flaechen, sondern die Akzentflaeche selbst (Teile 2, 5) oder eine benannte
   Liste wirklich erreichbarer Karten- und Auswahlflaechen (Teil 4). Die stehen
   unten einzeln mit ihrer Herkunft da, statt dass eine allgemeine Liste
   behauptet wuerde, die fuer diese Stellen gar nicht gilt.

   SIE IST BEI IHRER GEBURT ROT, mit allen fuenf Teilen: die Signatur mit
   ihren fuenf Stellen, die Statusabbildung mit Farbwerten statt Rollennamen,
   die Seltenheitsskala mit fuenf Hexwerten und ohne Trennung, und die beiden
   Kontrastteile, weil es die Tokens noch nicht gibt, die sie pruefen sollen.
   =========================================================================== */
describe('R-16 — Tinte auf JS-gesetzter Flaeche (Ratsche)', () => {
    const SCHWELLE = 4.5;
    const QUELLORDNER = ['core', 'features', 'systems', 'ui', 'render', 'utils'];

    /** Alle .js-Dateien der sechs Quellordner, rekursiv. Kein glob, damit die
     *  Menge dieselbe ist wie die des grep-Befehls aus W1-C-02. */
    function quellDateien() {
        const out = [];
        const lauf = dir => {
            fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
                const p = path.join(dir, e.name);
                if (e.isDirectory()) lauf(p);
                else if (e.name.endsWith('.js')) out.push(p);
            });
        };
        QUELLORDNER.forEach(d => {
            const p = path.join(REPO, d);
            if (fs.existsSync(p)) lauf(p);
        });
        return out;
    }

    const DATEIEN = quellDateien();

    function lies(rel) {
        const p = path.join(REPO, ...rel.split('/'));
        return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    }

    test('(1) keine JS-Stelle setzt mehr eine Flaechenfarbe als Tinte', () => {
        // Gegenprobe: ohne Dateien prueft die Schleife ueber Leerlauf.
        expect(DATEIEN.length).toBeGreaterThan(50);

        const befunde = [];
        DATEIEN.forEach(p => {
            const inhalt = fs.readFileSync(p, 'utf8');
            const rel = path.relative(REPO, p).split(path.sep).join('/');
            for (const m of inhalt.matchAll(/style="([^"]*)"/g)) {
                const stil = m[1];
                if (!/background/.test(stil)) continue;
                if (!/(^|[^-\w])color:\s*var\(--bg-[\w-]+\)/.test(stil)) continue;
                const zeile = inhalt.slice(0, m.index).split('\n').length;
                befunde.push(
                    `${rel}:${zeile} setzt eine Flaeche UND "color: var(--bg-…)" als Tinte. ` +
                        `--bg-dark ist in Light #f5f5f5 und in Sepia #f4e4c1 — dieselbe Zeile ` +
                        `schreibt dort fast weiss auf eine helle Akzentflaeche`
                );
            }
        });
        expect(befunde.sort()).toEqual([]);
    });

    test('(2) die Quest-Status-Pille fuehrt Rollennamen und baut Flaeche und Tinte daraus', () => {
        const js = lies('systems/entity-links.js');
        expect(js).not.toBeNull();

        const befunde = [];
        const tabelle = js.match(/const statusColors = \{([\s\S]*?)\}/);
        if (!tabelle) {
            befunde.push('entity-links.js: die Statusabbildung ist weg oder heisst anders');
        } else {
            const rollen = [...tabelle[1].matchAll(/(\w+):\s*'([^']+)'/g)];
            if (!rollen.length) befunde.push('entity-links.js: die Statusabbildung ist leer');
            rollen.forEach(([, status, wert]) => {
                if (!/^[a-z]+$/.test(wert)) {
                    befunde.push(
                        `entity-links.js: Status "${status}" fuehrt "${wert}" statt eines ` +
                            `blossen Rollennamens. Mit einem fertigen var(…) kann die Vorlage ` +
                            `die passende --on-<rolle> nicht mehr bilden`
                    );
                }
            });
            // Und jede Rolle muss ihre eigene Tinte tragen koennen.
            const pals = WCAG.palettes();
            const alias = aliasSchicht();
            rollen.forEach(([, status, rolle]) => {
                WCAG.THEMES.forEach(theme => {
                    const p = { ...pals[theme], ...alias };
                    const f = p[`--${rolle}`] && WCAG.resolve(p[`--${rolle}`], p);
                    const t = p[`--on-${rolle}`] && WCAG.resolve(p[`--on-${rolle}`], p);
                    if (!f || !t) {
                        befunde.push(`${theme}: --${rolle} oder --on-${rolle} fehlt (${status})`);
                        return;
                    }
                    const r = WCAG.ratio2(t, f);
                    if (r < SCHWELLE) {
                        befunde.push(
                            `${theme}: Status "${status}" auf --${rolle}: --on-${rolle} ` +
                                `erreicht nur ${r} < ${SCHWELLE}`
                        );
                    }
                });
            });
        }
        if (!/background:\s*var\(--\$\{[\w.]+\}\)/.test(js)) {
            befunde.push(
                'entity-links.js: die Vorlage baut die Flaeche nicht mehr aus dem Rollennamen'
            );
        }
        if (!/color:\s*var\(--on-\$\{[\w.]+\}\)/.test(js)) {
            befunde.push(
                'entity-links.js: die Vorlage baut die Tinte nicht mehr aus dem Rollennamen'
            );
        }
        expect(befunde.sort()).toEqual([]);
    });

    /** Die fuenf Seltenheitsstufen in der Reihenfolge der Konstantentabelle.
     *  "normal" steht nicht dabei: es traegt keine eigene Farbe, sondern
     *  var(--text), und es bekommt auch keine Marke. */
    const SELTENHEITEN = ['common', 'uncommon', 'rare', 'veryrare', 'legendary'];

    test('(3) die Seltenheitsskala steht in Tokens, getrennt nach Flaeche und Tinte', () => {
        const js = lies('core/constants.js');
        expect(js).not.toBeNull();
        expect(SELTENHEITEN.length).toBe(5);

        const befunde = [];
        const paare = [
            { name: 'RARITY_COLORS', muster: s => `var(--rarity-${s})`, was: 'Flaeche' },
            { name: 'RARITY_TEXT_COLORS', muster: s => `var(--rarity-${s}-text)`, was: 'Tinte' }
        ];
        paare.forEach(({ name, muster, was }) => {
            const m = js.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`));
            if (!m) {
                befunde.push(`constants.js: ${name} (${was}) fehlt`);
                return;
            }
            const rumpf = m[1];
            if (/#[0-9a-fA-F]{3,6}/.test(rumpf)) {
                befunde.push(
                    `constants.js: ${name} (${was}) fuehrt noch Hexwerte. Eine Skala, die in ` +
                        `JS steht, ist fuer jede Ratsche dieses Testnetzes unsichtbar`
                );
            }
            SELTENHEITEN.forEach(s => {
                if (!rumpf.includes(muster(s))) {
                    befunde.push(`constants.js: ${name} (${was}) fuehrt ${s} nicht als ${muster(s)}`);
                }
            });
        });
        expect(befunde.sort()).toEqual([]);
    });

    /** Die Auswahl-Toenung DER QUELLE, nicht einer Abschrift: npcs.css
     *  `.loot-item.selected`. Warum das der entscheidende Unterschied ist —
     *  Pruefrunde W2-E, Runde 1: der Spielraum dieses Teils betraegt 0,00 bis
     *  0,11 (die Auswahlzeile IST die bindende Flaeche: sepia uncommon 4,50,
     *  sepia legendary 4,51, light veryrare 4,61). Stuende die Toenung hier
     *  als eingetippte 0.1, wuerde eine gewoehnliche Gestaltungsaenderung in
     *  npcs.css — 10 % auf 15 % — ALLE FUENF Tinten auf light 4,42-4,44 und
     *  sepia 4,30-4,32 druecken, waehrend dieser Test weiter mit 0,1 rechnet,
     *  4,50-4,53 meldet und gruen bleibt. Genau diese Bauart nennt der
     *  Kommentar zu ZELL_TOENUNG (Schritt 7 derselben Welle) "die
     *  gefaehrlichste Bauart, die eine Ratsche haben kann" — sie darf hier
     *  nicht durch die Hintertuer zurueckkommen.
     *  Gibt null zurueck, wenn die Regel verschwunden ist; Teil (4) meldet das
     *  als Befund, statt ueber Leerlauf gruen zu werden. */
    function auswahlToenung() {
        const css = cssFiles.find(f => f.name === 'npcs.css');
        if (!css) return null;
        const regel = regelnMitRumpf(css.content).find(r => r.sel === '.loot-item.selected');
        if (!regel) return null;
        const mix = WCAG.zerlegeMix(deklaration(regel.rumpf, 'background'));
        if (!mix || !/^transparent$/i.test(mix.gegen)) return null;
        const pct = parseFloat(mix.anteil);
        if (!isFinite(pct)) return null;
        return { basis: mix.basis, anteil: pct / 100 };
    }

    /** Dieselbe Lesart fuer die zugewiesene Zeile der Verteilen-Liste. Sie
     *  steht als rgba-Literal in render-loot.js — JS-Literale sind nach E5
     *  nicht Gegenstand dieser Welle, aber die Zahl darin ist trotzdem eine
     *  Quelle und keine Abschrift. */
    function zuweisungsToenung() {
        const js = lies('features/render-loot.js');
        if (js === null) return null;
        const m = js.match(
            /background:\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/
        );
        if (!m) return null;
        return {
            basis: WCAG.rgbToHex([Number(m[1]), Number(m[2]), Number(m[3])]),
            anteil: Number(m[4])
        };
    }

    const AUSWAHL = auswahlToenung();
    const ZUWEISUNG = zuweisungsToenung();

    /** Die Traegerflaechen der drei Stellen, an denen die Seltenheitsfarbe
     *  TEXT ist. Jede mit ihrer Herkunft, damit niemand sie fuer eine
     *  allgemeine Liste haelt:
     *    .loot-item-name  — .loot-item traegt --bg-card (core.css), :hover
     *                       --bg-elevated (core.css), .selected eine
     *                       Toenung ueber --bg-dark, deren Basis und Staerke
     *                       aus npcs.css gelesen werden (npcs.css gewinnt in
     *                       der Kaskade ueber core.css)
     *    .loot-detail-name— die Detailspalte traegt --bg-card (core.css)
     *    Zuweisungsliste  — #assign-item-list traegt --bg-dark (modals-entity
     *                       .html), die zugewiesene Zeile zusaetzlich eine
     *                       Auflage, die aus render-loot.js gelesen wird */
    function textTraeger(theme, p) {
        const dark = WCAG.resolve(p['--bg-dark'], p);
        const pr = t => `${Math.round(t.anteil * 1000) / 10} %`;
        return {
            '--bg-card': WCAG.resolve(p['--bg-card'], p),
            '--bg-elevated': WCAG.resolve(p['--bg-elevated'], p),
            '--bg-dark': dark,
            [`Auswahl (${AUSWAHL.basis} ${pr(AUSWAHL)} ueber --bg-dark)`]: WCAG.mixOver(
                WCAG.resolve(AUSWAHL.basis, p),
                AUSWAHL.anteil,
                dark
            ),
            [`zugewiesen (${ZUWEISUNG.basis} ${pr(ZUWEISUNG)} ueber --bg-dark)`]: WCAG.mixOver(
                ZUWEISUNG.basis,
                ZUWEISUNG.anteil,
                dark
            )
        };
    }

    test('(4) jede Seltenheits-Tinte haelt die Schwelle auf den Traegern ihrer Textstellen', () => {
        // Leerlaufschutz: verschwindet eine der beiden Quellregeln, ist das
        // ein Befund. Ohne diese vier Zeilen liefe der Test mit null durch.
        expect(AUSWAHL).not.toBeNull();
        expect(ZUWEISUNG).not.toBeNull();
        expect(typeof AUSWAHL.basis).toBe('string');
        expect(typeof ZUWEISUNG.basis).toBe('string');

        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];
        WCAG.THEMES.forEach(theme => {
            const p = { ...pals[theme], ...alias };
            const F = textTraeger(theme, p);
            expect(Object.keys(F).length).toBe(5);
            SELTENHEITEN.forEach(s => {
                const tok = `--rarity-${s}-text`;
                if (!(tok in p)) {
                    befunde.push(`${theme}: ${tok} fehlt`);
                    return;
                }
                const tinte = WCAG.resolve(p[tok], p);
                if (!tinte) {
                    befunde.push(`${theme}: ${tok} = ${p[tok]} loest zu keinem Farbwert auf`);
                    return;
                }
                Object.entries(F).forEach(([name, flaeche]) => {
                    const r = WCAG.ratio2(tinte, flaeche);
                    if (r < SCHWELLE) {
                        befunde.push(
                            `${theme}: ${tok} (${tinte}) auf ${name} nur ${r} < ${SCHWELLE}`
                        );
                    }
                });
            });
        });
        expect(befunde.sort()).toEqual([]);
    });

    test('(5) die Tinte der Seltenheitsmarke ist themenblind und haelt auf allen fuenf Flaechen', () => {
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];

        // Themenblind heisst: in allen vier Themes derselbe aufgeloeste Wert.
        const werte = new Set();
        WCAG.THEMES.forEach(theme => {
            const p = { ...pals[theme], ...alias };
            if (!('--on-rarity' in p)) {
                befunde.push(`${theme}: --on-rarity fehlt`);
                return;
            }
            werte.add(WCAG.resolve(p['--on-rarity'], p));
        });
        if (werte.size > 1) {
            befunde.push(
                `--on-rarity loest je Theme verschieden auf (${[...werte].sort().join(' · ')}). ` +
                    `Die Flaeche darunter folgt keinem Theme, die Tinte darf es dann auch nicht`
            );
        }

        const p0 = { ...pals.dark, ...alias };
        SELTENHEITEN.forEach(s => {
            const tok = `--rarity-${s}`;
            if (!(tok in p0)) {
                befunde.push(`${tok} fehlt`);
                return;
            }
            const flaeche = WCAG.resolve(p0[tok], p0);
            const tinte = WCAG.resolve(p0['--on-rarity'] || '', p0);
            if (!flaeche || !tinte) return;
            const r = WCAG.ratio2(tinte, flaeche);
            if (r < SCHWELLE) {
                befunde.push(
                    `--on-rarity auf ${tok} (${flaeche}) nur ${r} < ${SCHWELLE}. Weiss waere ` +
                        `dort 1,53-2,72 und ist keine Alternative`
                );
            }
        });
        expect(befunde.sort()).toEqual([]);
    });

    /** Die Stellen, an denen die Seltenheitsfarbe TEXT ist, mit der Zahl der
     *  erwarteten Vorkommen je Datei. Dieselben drei, die Teil (4)
     *  ausrechnet — dort als Traegerliste im Erklaertext, hier als gepruefte
     *  Zusicherung im ausfuehrbaren Code:
     *    initiative-loot.js  Gegenstandsname (.loot-item-name) und
     *                        Detailueberschrift (.loot-detail-name)
     *    render-loot.js      die Zeile der Zuweisungsliste */
    const TINTENSTELLEN = [
        { datei: 'features/initiative-loot.js', anzahl: 2 },
        { datei: 'features/render-loot.js', anzahl: 1 }
    ];

    /** Die Seltenheits-MARKE: die einzige Stelle, an der die Skala Flaeche
     *  sein DARF — dann aber mit der themenblinden Tinte woertlich daneben. */
    const MARKENSTELLE = { datei: 'features/initiative-loot.js', anzahl: 1 };

    /** Kommentare zeichenweise leeren, Zeilenumbrueche behalten. NOETIG, nicht
     *  Kosmetik: ueber der Bindung in render-loot.js steht der erklaerende
     *  Satz "das Muster `const X = window.X` in einer Funktion ist in
     *  CLAUDE.md als Fallstrick gefuehrt" — die Suche unten hat daraus beim
     *  ersten Versuch die Bindung `X` gelesen und die echte darunter
     *  ueberlaufen. Dieselbe Falle, die der Kommentar zu withoutComments()
     *  ganz oben fuer CSS beschreibt.
     *  Der Schutz `(?<!:)` vor `//` haelt ein `https://` in einer
     *  Zeichenkette heraus. */
    function ohneJsKommentare(js) {
        return js
            .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
            .replace(/(?<!:)\/\/[^\n]*/g, m => ' '.repeat(m.length));
    }

    /** Namen, die in dieser Datei an eine der beiden Tabellen gebunden sind.
     *  Die Luecke zwischen `=` und dem Tabellennamen darf weder Semikolon noch
     *  geschweifte Klammer enthalten, sonst zoege die Suche ueber die
     *  Anweisungsgrenze hinweg und schriebe `rarityInk` faelschlich auch die
     *  Flaechentabelle zu. Der Rueckblick `(?<![A-Z_])` haelt
     *  RARITY_TEXT_COLORS aus der Suche nach RARITY_COLORS heraus — ohne ihn
     *  waere jede Tinte auch eine Flaeche. */
    function gebundeneNamen(js, tabelle) {
        const re = new RegExp(
            `(?:const|let|var)\\s+(\\w+)\\s*=[^;{}]{0,200}?(?:window\\.)?(?<![A-Z_])${tabelle}\\s*\\[`,
            'g'
        );
        return new Set([...ohneJsKommentare(js).matchAll(re)].map(m => m[1]));
    }

    /** Interpolationen einer Eigenschaft: `color: ${name}` bzw.
     *  `background: ${name}`. Der Praefixschutz ist derselbe wie in
     *  deklaration() — ohne ihn liest `border-color:` als `color:` mit. */
    function interpolationen(js, prop) {
        const re = new RegExp(`(?:^|[^-\\w])${prop}:\\s*\\$\\{(\\w+)\\}`, 'g');
        return [...ohneJsKommentare(js).matchAll(re)].map(m => m[1]);
    }

    test('(6) die Textstellen holen ihre Tinte aus der Tintentabelle, die Marke ihre Flaeche aus der Flaechentabelle', () => {
        // Leerlaufschutz: drei Textstellen, eine Marke. Ohne diesen Beleg
        // liefe die Schleife ueber eine leere Liste und waere gruen.
        expect(TINTENSTELLEN.reduce((n, s) => n + s.anzahl, 0)).toBe(3);
        expect(MARKENSTELLE.anzahl).toBe(1);

        const befunde = [];
        TINTENSTELLEN.forEach(({ datei, anzahl }) => {
            const js = lies(datei);
            if (js === null) {
                befunde.push(`${datei}: Datei fehlt`);
                return;
            }
            const tinte = gebundeneNamen(js, 'RARITY_TEXT_COLORS');
            const flaeche = gebundeneNamen(js, 'RARITY_COLORS');
            if (!tinte.size) {
                befunde.push(
                    `${datei}: kein Name ist an RARITY_TEXT_COLORS gebunden. Wer eine ` +
                        `Seltenheitsfarbe als SCHRIFT setzt, nimmt diese Tabelle`
                );
                return;
            }

            const alsTinte = interpolationen(js, 'color');
            alsTinte.forEach(name => {
                if (flaeche.has(name)) {
                    befunde.push(
                        `${datei}: "color: \${${name}}" setzt die FLAECHENtabelle als Tinte. ` +
                            `Genau so erreichte "sehr selten" in Sepia 1,12 — die Flaechenwerte ` +
                            `sind themenblind und fuer Schrift nur in Dark und Contrast hell genug`
                    );
                } else if (!tinte.has(name)) {
                    befunde.push(
                        `${datei}: "color: \${${name}}" kommt aus keiner der beiden ` +
                            `Seltenheitstabellen — die Ratsche kann diese Tinte nicht beurteilen`
                    );
                }
            });

            const echte = alsTinte.filter(n => tinte.has(n)).length;
            if (echte !== anzahl) {
                befunde.push(
                    `${datei}: ${echte} statt ${anzahl} Textstellen mit der Seltenheits-Tinte. ` +
                        `Teil (4) rechnet die Kontraste fuer ${anzahl} Stellen dieser Datei nach`
                );
            }

            interpolationen(js, 'background').forEach(name => {
                if (tinte.has(name)) {
                    befunde.push(
                        `${datei}: "background: \${${name}}" setzt die TINTENtabelle als ` +
                            `Flaeche. Die abgedunkelten Ableitungen sind fuer Flaechen nicht gedacht`
                    );
                }
            });
        });

        const marke = lies(MARKENSTELLE.datei);
        if (marke === null) {
            befunde.push(`${MARKENSTELLE.datei}: Datei fehlt`);
        } else {
            const flaeche = gebundeneNamen(marke, 'RARITY_COLORS');
            const treffer = [
                ...ohneJsKommentare(marke).matchAll(
                    /background:\s*\$\{(\w+)\};\s*color:\s*var\(--on-rarity\)/g
                )
            ];
            if (treffer.length !== MARKENSTELLE.anzahl) {
                befunde.push(
                    `${MARKENSTELLE.datei}: ${treffer.length} statt ${MARKENSTELLE.anzahl} Marken ` +
                        `mit "background: \${…}; color: var(--on-rarity)". Teil (5) rechnet ` +
                        `--on-rarity gegen die fuenf Flaechen dieser Marke nach`
                );
            }
            treffer.forEach(([, name]) => {
                if (!flaeche.has(name)) {
                    befunde.push(
                        `${MARKENSTELLE.datei}: die Marke fuellt sich aus "${name}", das nicht ` +
                            `an RARITY_COLORS gebunden ist`
                    );
                }
            });
        }
        expect(befunde.sort()).toEqual([]);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 2 — R-17: die Tinte des Ereignis-Logs (Ratsche)
   ===========================================================================
   NACHGETRAGEN IN DER PRUEFUNG W2-E, RUNDE 1. Schritt 10 hatte zwei Haelften:
   die Seltenheitsskala (bewacht von R-16) und den Ereignis-Log (E6). Die
   zweite war von KEINER Ratsche gedeckt und liess sich rueckstandsfrei
   zurueckdrehen — beide Nachweise gegen die volle Suite gefuehrt, beide mit
   NULL neuen Fehlschlaegen:

     (a) die vier Tintendeklarationen in party.css zurueck auf var(--text) /
         var(--text-dim) — also genau der Zustand mit Light 1,07;
     (b) --on-log auf #101010 und --on-log-dim auf #202020 in allen vier
         Theme-Bloecken — dunkle Tinte auf der dunklen Blende, rechnerisch
         ~1,1.

   Warum nichts griff: die neuen Zahlen standen nur in einer Begruendungs-
   Zeichenkette von R10_AUSNAHMEN und in CSS-Kommentaren. R-01 prueft die
   NAMENSMENGE der Theme-Bloecke, nicht die Werte; R-13/ruheRegeln() greift
   nicht, weil die Flaeche ein rgba-Literal ist und keine Rolle. Der Umsetzer
   hat R-16 selbst damit begruendet, dass die sechs reparierten JS-Stellen
   sonst unbewacht waeren — fuer die zweite Haelfte desselben Schritts ist
   dieselbe Begruendung nicht angewandt worden.

   DREI TEILE, dieselbe Bauart wie R-09 und R-16:

   (1) party.css fuehrt an den vier Regeln, die auf der Blende liegen, genau
       die Log-Tokens. Gelesen wird die Deklaration, nicht ein Kommentar.

   (2) Beide Tokens loesen in allen VIER Themes zum selben Wert auf. Sie
       MUESSEN themenblind sein, weil die Flaeche darunter es ist — dasselbe
       Muster, das Welle 1 Schritt 8 an der SW-Update-Leiste beschlossen hat
       und das R-16 Teil (5) fuer die Seltenheitsmarke prueft.

   (3) Beide halten 4,5 ueber beide Flaechenliterale. Die Literale kommen aus
       R10_AUSNAHMEN, wo sie ohnehin namentlich stehen — eine zweite
       Abschrift waere genau die Bauart, die diese Pruefrunde an R-16 Teil (4)
       beanstandet hat. Der Hintergrund, gegen den die halbdurchsichtige
       Blende aufgeloest wird, ist die HELLSTE neutrale Flaeche des Themes:
       der schlechteste Fall fuer eine helle Tinte, aus der Palette gerechnet
       und nicht gewaehlt. Gemessen ergibt das 6,89 bis 15,51. Die 6,96-15,63
       in R10_AUSNAHMEN sind dieselbe Rechnung gegen die Seitenflaeche als
       Hintergrund; der kleine Unterschied ist der strengere Hintergrund hier,
       kein Widerspruch.
   =========================================================================== */
describe('R-17 — die Tinte des Ereignis-Logs (Ratsche)', () => {
    const SCHWELLE = 4.5;
    const TOKENS = ['--on-log', '--on-log-dim'];

    /** Die vier Regeln, die auf der themenblinden Blende liegen, mit dem
     *  Token, das sie tragen muessen. `.event-log-btn:hover` steht bewusst
     *  NICHT dabei: sie setzt eine eigene THEME-Flaeche (--bg-alt) und dazu
     *  var(--text) und ist in sich stimmig. */
    const STELLEN = [
        { sel: '.event-log-title', tok: '--on-log' },
        { sel: '.event-log-btn', tok: '--on-log-dim' },
        { sel: '.event-log-entry', tok: '--on-log' },
        { sel: '.event-log-time', tok: '--on-log-dim' }
    ];

    /** Die zwei Flaechenliterale — aus R10_AUSNAHMEN, nicht abgeschrieben. */
    const FLAECHEN = R10_AUSNAHMEN.filter(a => a.datei === 'party.css').map(a => a.lit);

    /** Hellste der vier neutralen Flaechen des Themes: der schlechteste Fall
     *  als Hintergrund einer halbdurchsichtigen dunklen Blende. */
    function hellsteNeutrale(p) {
        return WCAG.NEUTRAL_SURFACES.map(t => WCAG.resolve(p[t], p))
            .filter(Boolean)
            .reduce((a, b) => (WCAG.relLuminance(b) > WCAG.relLuminance(a) ? b : a));
    }

    test('(1) die vier Regeln des Logs tragen die Log-Tokens, nicht die Theme-Tinte', () => {
        const css = cssFiles.find(f => f.name === 'party.css');
        expect(css).toBeDefined();
        const regeln = regelnMitRumpf(css.content);
        // Leerlaufschutz: zerfaellt die Zerlegung, waere der Test leer gruen.
        expect(regeln.length).toBeGreaterThan(20);
        expect(STELLEN.length).toBe(4);

        const befunde = [];
        STELLEN.forEach(({ sel, tok }) => {
            const treffer = regeln.filter(r => r.sel === sel);
            if (treffer.length !== 1) {
                befunde.push(`party.css: ${treffer.length} statt 1 Regel "${sel}"`);
                return;
            }
            const wert = deklaration(treffer[0].rumpf, 'color');
            if (wert !== `var(${tok})`) {
                befunde.push(
                    `party.css:${treffer[0].zeile} ${sel} traegt "${wert}" statt var(${tok}). ` +
                        `Die Flaeche darunter ist ein themenblindes rgba-Literal; eine ` +
                        `Theme-Tinte darauf erreichte in Light 1,05-3,19`
                );
            }
        });
        expect(befunde.sort()).toEqual([]);
    });

    test('(2) beide Log-Tokens sind themenblind', () => {
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];
        TOKENS.forEach(tok => {
            const werte = new Set();
            WCAG.THEMES.forEach(theme => {
                const p = { ...pals[theme], ...alias };
                if (!(tok in p)) {
                    befunde.push(`${theme}: ${tok} fehlt`);
                    return;
                }
                werte.add(WCAG.resolve(p[tok], p));
            });
            if (werte.size > 1) {
                befunde.push(
                    `${tok} loest je Theme verschieden auf (${[...werte].sort().join(' · ')}). ` +
                        `Die Flaeche darunter folgt keinem Theme, die Tinte darf es dann auch nicht`
                );
            }
        });
        expect(befunde.sort()).toEqual([]);
    });

    test('(3) beide Log-Tokens halten die Schwelle auf beiden Flaechen des Logs', () => {
        // Leerlaufschutz: zwei Flaechen, sonst rechnet der Test ueber nichts.
        expect(FLAECHEN.length).toBe(2);

        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];
        WCAG.THEMES.forEach(theme => {
            const p = { ...pals[theme], ...alias };
            const grund = hellsteNeutrale(p);
            FLAECHEN.forEach(lit => {
                const f = WCAG.resolveOver(lit, p, grund);
                if (!f) {
                    befunde.push(`${theme}: "${lit}" loest ueber ${grund} zu keiner Flaeche auf`);
                    return;
                }
                TOKENS.forEach(tok => {
                    const tinte = p[tok] && WCAG.resolve(p[tok], p);
                    if (!tinte) {
                        befunde.push(`${theme}: ${tok} loest zu keinem Farbwert auf`);
                        return;
                    }
                    const r = WCAG.ratio2(tinte, f);
                    if (r < SCHWELLE) {
                        befunde.push(
                            `${theme}: ${tok} (${tinte}) auf "${lit}" ueber ${grund} (= ${f}) ` +
                                `nur ${r} < ${SCHWELLE}`
                        );
                    }
                });
            });
        });
        expect(befunde.sort()).toEqual([]);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 2, Nachtrag — R-18: eine verfeinernde Regel toent,
   die Tinte ist geerbt (Ratsche)
   ===========================================================================
   DIE BAUART. Eine VERFEINERNDE Regel — Zustand oder Variante, als
   Pseudoklasse ODER als zweite Klasse im Kompound — wechselt NUR die Flaeche
   auf eine Rollen-Toenung und setzt keine eigene Tinte. Gemalt wird die
   geerbte Tinte, auf einer Flaeche, fuer die sie nie gerechnet war:

       .concentration-badge       { color: var(--purple-text); }
       .concentration-badge:hover { background: color-mix(… --purple 30% …); }

   WARUM ES SIE BRAUCHT, gemessen und nicht vermutet. Der Nachtrag hat vier
   solche Regeln gedeckelt (core.css .link-chip:hover, initiative.css
   .concentration-badge:hover und .concentration-add-btn:hover, pwa.css
   .pwa-install-btn:active). Die Pruefung danach hat per Mutation belegt, dass
   KEINE Ratsche darueber urteilte: alle vier Deckel in einem kopierten Baum
   auf den Stand von BASE zurueckgedreht, volle Suite (71 Suiten) —
   zeichengleich derselbe Befundsatz, 114/114 in dieser Datei gruen, obwohl
   .link-chip:hover damit wieder auf 2,87 in Dark faellt.

   Der Quelltext sagt warum: R-04 verlangt `background` UND `color` in
   DERSELBEN Regel; diese Regeln haben keine eigene Tinte. R-03 verwirft jede
   color-mix-Flaeche und verlangt eine `var(--on-*)`-Tinte. R-05 fuehrt eine
   Liste benannter Zustaende, in der keiner davon steht. R-14 verlangt eine
   Nachfahrenschreibweise des Toenungsselektors — eine `:hover`-Regel am selben
   Element ist keine.

   ZWEI WEGE, EINE BAUART. Die Tinte kann aus der GRUNDREGEL desselben
   Elements kommen (der Fall oben) oder aus einem NACHFAHREN der Grundregel:

       .dice-attr.save:hover { background: color-mix(… --purple 15% …); }
       .dice-attr.save small { color: var(--purple-text); }

   Der zweite Weg ist der teure gewesen. Die Aktenlage zaehlt zu W2-D-05 "neun
   Regeln dieser Bauart" — das sind die neun des ERSTEN Wegs.
   `.dice-attr.save:hover` stand in keiner Liste, lag in DREI Themes unter 4,5
   (4,41 · 4,09 · 4,18 · 5,05) und fiel zwischen R-04 (keine eigene Tinte),
   R-14 (kein Nachfahrenselektor des Toenungsselektors) und der Zaehlung selbst
   hindurch. Diese Ratsche urteilt ueber beide Wege, damit die Klasse nicht ein
   drittes Mal unvollstaendig gezaehlt wird.

   DIE KLASSENFORM — was Runde 2 des Nachtrags berichtigt hat. Bis dahin stand
   im Kopf dieses Blocks und in der Aktenlage, die Menge der 14 Paare sei
   geschlossen gefuehrt und eine fuenfzehnte Stelle werde rot. Das galt nur,
   solange der Zustand eine PSEUDOKLASSE war. `ZUSTAND` streicht `:hover`,
   `:checked`, `:has(…)` und Genossen; bei `.init-entry.active` blieb der
   Selektor unveraendert und fiel als "kein Zustand" heraus. Genau dort lag die
   naechste Stelle:

       .init-entry.active       { background: linear-gradient(90deg,
                                    color-mix(… --gold 10% …) 0%, …); }
       .init-entry .drag-handle { color: var(--text-dim); }

   Gemessen 3,56 · 4,28 · 3,98 · 5,38 — Zahl fuer Zahl dieselbe wie bei zwei
   der benannten Ausnahmen unten, dieselbe Tinte, dieselbe 10-%-Goldtoenung.
   Belegt war die Luecke per Mutation: Gold von 10 % auf 95 % gestellt (der
   Kontrast der geerbten Tinte faellt gegen 1,0), volle Jest-Suite unveraendert
   gruen. Der Zieh-Griff steht als erste Gitterspalte auf dem 0-%-Ende des
   Verlaufs, also auf der vollen Toenung, und `.active` markiert die Zeile, auf
   die im Kampf am haeufigsten gesehen wird.

   Warum eine blosse Erweiterung von `ZUSTAND` NICHT genuegt: wer die Klasse
   aus dem Kompound streicht, verliert dafuer `.dice-attr.save small` — das ist
   keine Nachfahrenschreibweise von `.dice-attr`, sondern von `.dice-attr.save`.
   Die Paarung laeuft deshalb ueber die TEILMENGE der Klassen (`trifftBasis()`):
   `.init-entry` trifft jedes `.init-entry.active`, `.dice-attr.save` trifft
   sich selbst. Beide Wege bleiben, und die Menge waechst von 14 auf 19.

   FUENF AUSSCHLUESSE, jeder mit Grund:

   (1) Eigene Tinte in der Zustandsregel -> R-04 ist zustaendig, nicht diese.
   (2) Ein NACHFAHRE mit eigener Flaeche -> seine Tinte liegt auf seiner
       eigenen Flaeche, nicht auf der Toenung des Elters. Derselbe Ausschluss
       wie in R-14, und aus demselben Grund: ohne ihn meldet die Ratsche
       Fehlalarme um 1,2.
   (3) Eine Tinte `var(--on-*)` -> diese Tokens NENNEN ihre Flaeche.
       --on-yellow gehoert auf Gelb, --on-log auf die Blende des
       Ereignis-Logs; sie gegen --bg-card zu rechnen ist kategorisch falsch
       und keine Schwellenfrage. Genau so faellt pwa.css
       `.pwa-update-dismiss:hover` heraus, das sonst mit 1,00 als schlimmster
       Befund erschiene, obwohl die Regel auf der gelben
       Aktualisierungsleiste sitzt und dort 8,11-11,97 liest (in pwa.css
       vorgerechnet). Beurteilt werden diese Tokens von R-02, R-04 und R-17
       auf ihren eigenen Flaechen — der Ausschluss verschiebt sie, er verliert
       sie nicht. Er ist auch kein Schlupfloch: --on-*-Tokens sind themenblind
       und stehen unter R-01.
   (4) Reine Klassenform UND ein Nachfahre DESSELBEN Kompounds -> darueber
       urteilt R-14 (`.init-entry.lair` -> `.init-entry.lair .init-name` steht
       dort namentlich). Zwei Ratschen auf demselben Paar sind keine doppelte
       Sicherheit, sondern doppelte Buchfuehrung. Die beiden Ratschen ergaenzen
       sich genau: R-14 nimmt den Nachfahren MIT der Zustandsklasse, R-18 den
       ohne sie (`.init-entry .drag-handle`), den R-14s `startsWith`-Vergleich
       nie trifft.
   (5) Eine spezifischere Regel desselben Kompounds ueberschreibt die geerbte
       Tinte -> sie malt dort nie. `.dice-attr small` (0,1,1) verliert gegen
       `.dice-attr.save small` (0,2,1); ohne diesen Ausschluss stuende dasselbe
       Element mit zwei verschiedenen Tinten in der Menge, und eine davon ist
       Fiktion.

   DIE SIEBEN BENANNTEN AUSNAHMEN stehen hier mit ihrem gemessenen Minimum und
   melden sowohl eine Verschlechterung als auch den Fall, dass der Eintrag nur
   noch Altlast ist (Bauart wie RUHE_AUSNAHME in R-04). Keine ist ein neues
   Zugestaendnis; alle sieben sind Vorbestand, vier davon schon gefuehrt, drei
   erst durch die Klassenform sichtbar geworden:

     tools.css `.quick-access-item:hover .remove-btn`, die beiden party.css
     `.cf-attr-card`-Stellen und — neu aus Runde 2 — die beiden
     initiative.css-Paare auf `.init-entry .drag-handle` tragen
     var(--text-dim) bzw. var(--cyan-text) auf einer 10-%-Toenung. Das ist
     W2-D-02, und der Befund dort ist gemessen: --text-dim erreicht in Dark
     schon OHNE jede Toenung nur 4,32. Ein Deckel kann das nicht heilen (an
     `.init-entry.active` nachgerechnet: mit und ohne Deckel 3,56, weil
     10 % < --tint-max 13 % in Dark), die Tinte muss entschieden werden (D-4).

     loot.css `.loot-tag-chip input:checked + span` ist die Stelle, die
     Welle 1 Schritt 9 ausdruecklich vorgezogen und Welle 2 ausdruecklich
     NICHT ein zweites Mal angefasst hat (Aktenlage: "die Tintenfrage ist
     entschieden, offen bleibt die Toenungsstaerke"). Ueber ihre
     TATSAECHLICHE Flaeche --bg-card gerechnet haelt sie 5,41-9,23; die 4,23
     hier sind das Minimum ueber die drei Traeger nach D-2.

     dice.css `.fdp-die.d20` -> `.fdp-die` ist der dritte Neuzugang und der
     einzige, der NICHT zur --text-dim-Familie gehoert: var(--gold-text) aus
     der Grundregel auf den zwei Rotstopps des Wuerfelverlaufs. Die Zahlen
     stehen seit Welle 2 Schritt 7 im Kommentar der Regel selbst (ueber die
     tatsaechliche Traegerflaeche --bg-card: Verlaufskopf 6,64 · 4,56 · 4,93 ·
     11,57, Verlaufsfuss 7,27 · 3,42 · 3,72 · 12,33) — sie waren nur nie gegen
     eine Schwelle gehalten. Gefuehrt als W2-D-06.

     BERICHTIGT IN WELLE 3 SCHRITT 9, und es ist eine Berichtigung DIESES
     Kopfes: hier stand "ein Deckel allein traegt nicht: gedeckelt liest sie
     6,40 · 4,48 · 5,01 · 10,00 und verfehlt Light um 0,02". Die Zahlen sind
     richtig, der Schluss war falsch, weil er die D-2-Dreierliste fuer die
     Traegerflaeche nahm. Das ist sie hier nicht: `background:
     linear-gradient(...)` ist die Kurzschreibweise und setzt background-color
     auf transparent zurueck, das var(--bg-elevated) der Grundregel ist damit
     weg, und dahinter liegt .floating-dice-panel mit 98 % --bg-card. Ueber
     DIESE Flaeche liest die gedeckelte Regel 7,28 · 5,49 · 5,83 · 11,57, also
     min 5,49 — 0,99 ueber der Schwelle statt 0,02 darunter. Beide Stopps sind
     seit Schritt 9 gedeckelt.

     DER EINTRAG BLEIBT TROTZDEM, und sein Wert ist von 2,87 auf 4,48
     NACHGEZOGEN. Er bleibt, weil diese Ratsche nach ihrer eigenen Bauart
     ueber D-2 urteilt (wie R-04, R-11 und R-14) und dort 0,02 fehlen; er wird
     nachgezogen, weil 2,87 nach dem Deckel nicht mehr die Messung ist — mit
     der alten Zahl koennte der Deckel lautlos wieder verschwinden. Mit 4,48
     meldet `min < eingetragen` genau das. Nachgeprueft per Mutation: beide
     min()-Klammern aus dice.css entfernt, diese Ratsche geht rot mit "min
     2,87". Die Rechnung ueber die WIRKLICHE Flaeche fuehrt R-23 Teil (3), das
     zusaetzlich pinnt, dass Panelflaeche und --bg-card nur 0,01 auseinander
     liegen.

   WAS SIE NICHT SIEHT. Dasselbe wie R-14: ein Nachfahre, der im DOM unter der
   Toenung liegt, ohne dass sein Selektor das sagt. Das ist Gruppe B von
   W1-D-01 und ein eigener offener Punkt. Dazu die Teilmengenregel selbst: sie
   gilt nur fuer Koepfe aus REINEN Klassen. Ein `a:hover` oder `#id.active`
   wird weiter nur zeichengleich gepaart — geraten wird nichts.
   =========================================================================== */
describe('R-18 — verfeinernde Regel toent, Tinte ist geerbt (Ratsche)', () => {
    /** Dieselben drei Traegerflaechen wie in R-04, R-11 und R-14 (D-2). */
    const TRAEGER = ['--bg-card', '--bg-dark', '--bg-elevated'];
    const SCHWELLE = 4.5;

    const TOENUNGSSTOPP =
        /^color-mix\(\s*in\s+srgb\s*,\s*var\(\s*(--[\w-]+)\s*\)\s+[\s\S]+,\s*transparent\s*\)$/i;
    const NEUTRAL = /^--(bg|surface|border|overlay|scrim)(-|$)/;
    /** Tinten, die ihre Flaeche selbst nennen — Ausschluss (3) im Kopf. */
    const NENNT_FLAECHE = /^--on-/;

    /** Zustandsteile eines Selektors. `:has(…)` steht VORNE: sonst frisst die
     *  Alternative `:checked` das Innere von `:has(input:checked)` und laesst
     *  eine halbe Klammer stehen. */
    const ZUSTAND = /:has\([^)]*\)|:(?:hover|active|focus-visible|focus-within|focus|checked)\b/g;

    /** Klammergenaue Abgrenzung, wie in R-04 und R-14 — `min(15%,
     *  var(--tint-max))` bringt eigene Klammern und ein eigenes Komma mit. */
    function mixAusdruecke(wert) {
        const out = [];
        const re = /color-mix\s*\(/gi;
        let m;
        while ((m = re.exec(wert))) {
            let tiefe = 0;
            let i = m.index + m[0].length - 1;
            for (; i < wert.length; i++) {
                if (wert[i] === '(') tiefe++;
                else if (wert[i] === ')') {
                    tiefe--;
                    if (!tiefe) break;
                }
            }
            if (tiefe === 0) out.push(wert.slice(m.index, i + 1));
        }
        return out;
    }

    const selektorTeile = sel =>
        sel
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);

    /** Kopf-Kompound eines Selektors (bis zum ersten Kombinator) und der Rest. */
    function zerlege(sel) {
        const i = sel.search(/[\s>+~]/);
        return i === -1 ? [sel, ''] : [sel.slice(0, i), sel.slice(i).trim()];
    }

    /** Die Klassen eines Kompounds als Menge — null, wenn etwas anderes als
     *  Klassen darin steht (Element, #id, [attr]). Fuer solche Koepfe gilt nur
     *  die Zeichengleichheit, nie die Teilmengenregel: `a:hover` und `a.x`
     *  beschreiben nicht dasselbe Element, und geraten wird hier nichts. */
    function klassenMenge(komp) {
        if (!/^(?:\.[\w-]+)+$/.test(komp)) return null;
        return new Set(komp.match(/\.[\w-]+/g));
    }

    const istTeilmenge = (a, b) => [...a].every(x => b.has(x));

    /** Malt die Regel `qSel` auf dem Element, das `basis` beschreibt? Zwei Wege,
     *  und der zweite ist der Nachtrag aus Runde 2:
     *    1. Zeichengleichheit oder Nachfahrenschreibweise von `basis` — das war
     *       die ganze Paarung, solange nur Pseudoklassen als Verfeinerung
     *       galten.
     *    2. TEILMENGE der Klassen des Basis-Kompounds: `.init-entry` trifft
     *       jedes `.init-entry.active`, also malt auch `.init-entry
     *       .drag-handle` auf dessen Toenung. Ohne diesen Weg bleibt die
     *       Klassenform des Zustands unsichtbar. */
    function trifftBasis(qSel, basis) {
        if (qSel === basis) return { istBasis: true, rest: '' };
        if (qSel.startsWith(basis + ' ')) {
            return { istBasis: false, rest: qSel.slice(basis.length + 1) };
        }
        const [bKomp, bRest] = zerlege(basis);
        if (bRest) return null;
        const bSet = klassenMenge(bKomp);
        if (!bSet) return null;
        const [qKomp, qRest] = zerlege(qSel);
        const qSet = klassenMenge(qKomp);
        if (!qSet || !istTeilmenge(qSet, bSet)) return null;
        return { istBasis: !qRest, rest: qRest };
    }

    /** Deckungsgleicher Kopf — Ausschluss (4), R-14s Gebiet. */
    function kopfDeckungsgleich(qSel, basis) {
        const [bKomp] = zerlege(basis);
        const [qKomp] = zerlege(qSel);
        if (qKomp === bKomp) return true;
        const bSet = klassenMenge(bKomp);
        const qSet = klassenMenge(qKomp);
        return Boolean(bSet && qSet && bSet.size === qSet.size && istTeilmenge(qSet, bSet));
    }

    /** Alle Paare (verfeinernde Regel mit Toenung, Regel mit der geerbten Tinte). */
    function geerbteZustaende() {
        const out = [];
        cssFiles.forEach(f => {
            if (f.name === 'variables.css' || f.name === 'fonts.css') return;
            const regeln = regelnMitRumpf(f.content);
            regeln.forEach(zustand => {
                // (1) Eigene Tinte -> R-04 urteilt, nicht diese Ratsche.
                if (deklaration(zustand.rumpf, 'color')) return;
                const roh = deklaration(zustand.rumpf, 'background(?:-color)?');
                if (!roh) return;
                const stopps = mixAusdruecke(roh.replace(/\s+/g, ' ')).filter(x => {
                    const m = x.match(TOENUNGSSTOPP);
                    return m && !NEUTRAL.test(m[1]);
                });
                if (!stopps.length) return;

                selektorTeile(zustand.sel).forEach(zSel => {
                    const basis = zSel.replace(ZUSTAND, '').trim();
                    if (!basis) return;
                    const hatPseudo = basis !== zSel;
                    const [bKomp, bRest] = zerlege(basis);
                    const bSet = bRest ? null : klassenMenge(bKomp);
                    // Verfeinerung: Pseudoklasse ODER mehr als eine Klasse im
                    // Kompound. Alles andere ist keine Zustandsregel, sondern
                    // die Grundregel selbst.
                    if (!hatPseudo && !(bSet && bSet.size > 1)) return;
                    regeln.forEach(quelle => {
                        if (quelle === zustand) return;
                        const tinte = deklaration(quelle.rumpf, 'color');
                        if (!tinte) return;
                        const tm = tinte.trim().match(/^var\((--[\w-]+)\)$/);
                        // (3) Tinten, die ihre Flaeche selbst nennen.
                        if (!tm || NEUTRAL.test(tm[1]) || NENNT_FLAECHE.test(tm[1])) return;
                        const eigeneFlaeche = Boolean(
                            deklaration(quelle.rumpf, 'background(?:-color)?')
                        );
                        selektorTeile(quelle.sel).forEach(qSel => {
                            const treffer = trifftBasis(qSel, basis);
                            if (!treffer) return;
                            // (2) Nachfahre mit eigener Flaeche.
                            if (!treffer.istBasis && eigeneFlaeche) return;
                            // (4) Reine Klassenform UND Nachfahre desselben
                            // Kompounds: darueber urteilt R-14, nicht diese
                            // Ratsche. Zwei Ratschen auf demselben Paar sind
                            // keine doppelte Sicherheit, sondern doppelte
                            // Buchfuehrung.
                            if (
                                !hatPseudo &&
                                !treffer.istBasis &&
                                kopfDeckungsgleich(qSel, basis)
                            ) {
                                return;
                            }
                            // (5) Eine spezifischere Regel DESSELBEN Kompounds
                            // ueberschreibt die geerbte Tinte — dann malt sie
                            // hier nie. `.dice-attr small` (0,1,1) verliert so
                            // gegen `.dice-attr.save small` (0,2,1).
                            if (!treffer.istBasis) {
                                const spezifischer = `${basis} ${treffer.rest}`;
                                const ueberschrieben =
                                    spezifischer !== qSel &&
                                    regeln.some(
                                        r =>
                                            selektorTeile(r.sel).includes(spezifischer) &&
                                            deklaration(r.rumpf, 'color')
                                    );
                                if (ueberschrieben) return;
                            }
                            out.push({
                                datei: f.name,
                                zustand,
                                zSel,
                                quelle,
                                qSel,
                                art: treffer.istBasis ? 'Grundregel' : 'Nachfahrenregel',
                                tinte: tinte.trim(),
                                stopps
                            });
                        });
                    });
                });
            });
        });
        return out;
    }

    /** DIE MENGE, nicht nur die Werte — Bauart wie ERWARTETE_PAARE in R-14.
     *  Eine zwanzigste Stelle dieser Bauart ist ein Befund, bis jemand sie
     *  ausrechnet und hier eintraegt. Genau daran hat es zweimal gefehlt: bei
     *  `.dice-attr.save:hover` (Runde 1) und bei der ganzen Klassenform
     *  (Runde 2, die letzten fuenf Zeilen dieser Liste). */
    const ERWARTETE_PAARE = [
        'core.css .char-action-btn.primary -> .char-action-btn',
        'core.css .link-chip:hover -> .link-chip',
        'dashboard.css .dice-formula-chip:hover -> .dice-formula-chip',
        'dice.css .dice-attr.save:hover -> .dice-attr span',
        'dice.css .dice-attr.save:hover -> .dice-attr.save small',
        'dice.css .fdp-die.d20 -> .fdp-die',
        'file-backup.css .backup-entry-restore:hover -> .backup-entry-restore',
        'file-backup.css .backup-warning-indicator:hover -> .backup-warning-indicator',
        'initiative.css .concentration-add-btn:hover -> .concentration-add-btn',
        'initiative.css .concentration-badge:hover -> .concentration-badge',
        'initiative.css .init-entry.active -> .init-entry .drag-handle',
        'initiative.css .init-entry.lair -> .init-entry .drag-handle',
        'loot.css .loot-tag-chip:has(input:checked) -> .loot-tag-chip input:checked + span',
        'party.css .cf-attr-card:has(.cf-attr-save input:checked) -> .cf-attr-card .cf-attr-mod',
        'party.css .cf-attr-card:has(.cf-attr-save input:checked) -> .cf-attr-card .cf-attr-name',
        'party.css .cf-attr-card:has(.cf-attr-save input:checked) -> .cf-attr-card .cf-attr-save',
        'pwa.css .pwa-install-btn:active -> .pwa-install-btn',
        'pwa.css .pwa-install-btn:hover -> .pwa-install-btn',
        'tools.css .quick-access-item:hover -> .quick-access-item .remove-btn'
    ];

    /** Benannte Ausnahmen mit ihrem gemessenen Minimum ueber die vier Themes.
     *  Begruendung je Eintrag im Kopf dieses Blocks. Vier sind Vorbestand aus
     *  W2-D-02 bzw. der Vorziehung aus Welle 1 Schritt 9, drei sind in Runde 2
     *  des Nachtrags mit der Klassenform dazugekommen (W2-D-02 bzw. W2-D-06). */
    const AUSNAHME = {
        // 2,87 bis Welle 3 Schritt 9, seit dem Deckel 4,48 — die Begruendung
        // fuer BEIDE Zahlen steht im Kopf dieses Blocks.
        'dice.css .fdp-die.d20 -> .fdp-die': 4.48,
        'initiative.css .init-entry.active -> .init-entry .drag-handle': 3.56,
        'initiative.css .init-entry.lair -> .init-entry .drag-handle': 3.93,
        'loot.css .loot-tag-chip:has(input:checked) -> .loot-tag-chip input:checked + span': 4.23,
        'party.css .cf-attr-card:has(.cf-attr-save input:checked) -> .cf-attr-card .cf-attr-mod': 4.29,
        'party.css .cf-attr-card:has(.cf-attr-save input:checked) -> .cf-attr-card .cf-attr-save': 3.56,
        'tools.css .quick-access-item:hover -> .quick-access-item .remove-btn': 3.56
    };

    const schluesselVon = p => `${p.datei} ${p.zSel} -> ${p.qSel}`;

    /** Das schlechteste Verhaeltnis EINES Paares in EINEM Theme: Minimum ueber
     *  alle Rollenstopps der Toenung und ueber die drei Traegerflaechen. */
    function verhaeltnisse(paar, pals, alias) {
        const werte = {};
        let fehlt = null;
        WCAG.THEMES.forEach(theme => {
            const p = { ...pals[theme], ...alias };
            const tinte = WCAG.resolve(paar.tinte, p);
            if (!tinte) {
                fehlt = fehlt || `${theme}: ${paar.tinte}`;
                return;
            }
            let min = Infinity;
            paar.stopps.forEach(stopp => {
                TRAEGER.forEach(s => {
                    const grund = WCAG.resolve(`var(${s})`, p);
                    const feld = grund ? WCAG.resolveOver(stopp, p, grund) : null;
                    if (!feld) {
                        fehlt = fehlt || `${theme}: ${stopp} ueber ${s}`;
                        return;
                    }
                    min = Math.min(min, WCAG.ratio(tinte, feld));
                });
            });
            werte[theme] = Number(min.toFixed(2));
        });
        return { werte, fehlt };
    }

    test('die bekannten Paare dieser Bauart sind die einzigen im Baum', () => {
        const gefunden = geerbteZustaende().map(schluesselVon).sort();
        expect(gefunden).toEqual(ERWARTETE_PAARE);
    });

    test('jedes Paar haelt 4,5 auf der Toenung seiner verfeinernden Regel', () => {
        const pals = WCAG.palettes();
        const alias = aliasSchicht();
        const befunde = [];
        const offen = new Set(Object.keys(AUSNAHME));

        geerbteZustaende().forEach(paar => {
            const schluessel = schluesselVon(paar);
            const { werte, fehlt } = verhaeltnisse(paar, pals, alias);
            if (fehlt) {
                befunde.push(
                    `${schluessel} (Zeile ${paar.quelle.zeile}) — nicht aufloesbar (${fehlt}). ` +
                        `Was der Rechner nicht kennt, darf nicht als gruen gelten`
                );
                return;
            }
            const min = Math.min(...WCAG.THEMES.map(t => werte[t]));
            const zahlen = WCAG.THEMES.map(t => `${t} ${werte[t]}`).join(' · ');
            const eingetragen = AUSNAHME[schluessel];
            offen.delete(schluessel);

            if (eingetragen === undefined) {
                if (min < SCHWELLE) {
                    befunde.push(
                        `${schluessel}: die ${paar.art} setzt ${paar.tinte} auf die Toenung ` +
                            `von "${paar.zSel}":${paar.zustand.zeile} — min ${min} < ` +
                            `${SCHWELLE} (${zahlen})`
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
                    `${schluessel}: haelt jetzt min ${min} — Eintrag aus AUSNAHME und aus ` +
                        `HANDOFF-V3-OFFENE-PUNKTE.md entfernen`
                );
            }
        });

        [...offen]
            .sort()
            .forEach(k =>
                befunde.push(
                    `${k} steht in AUSNAHME, aber es gibt kein solches Paar mehr — ` +
                        `der Eintrag ist Altlast und gehoert entfernt`
                )
            );

        expect(befunde.sort()).toEqual([]);
    });

    /** KERNBELEG gegen die Momentaufnahme. Die Pruefung des Nachtrags hat per
     *  Mutation belegt, dass ueber die fuenf Stellen aus W2-D-05 keine Ratsche
     *  urteilte. Dieser Test haelt fest, dass sie jetzt NAMENTLICH in der
     *  geurteilten Menge stehen — sonst koennte der Selektorabgleich oben
     *  stillschweigend leerlaufen und die Ratsche waere gruen und leer. */
    test('die fuenf Stellen aus W2-D-05 stehen namentlich unter Aufsicht', () => {
        const gefunden = geerbteZustaende().map(schluesselVon);
        [
            'core.css .link-chip:hover -> .link-chip',
            'initiative.css .concentration-badge:hover -> .concentration-badge',
            'initiative.css .concentration-add-btn:hover -> .concentration-add-btn',
            'pwa.css .pwa-install-btn:active -> .pwa-install-btn',
            'file-backup.css .backup-entry-restore:hover -> .backup-entry-restore'
        ].forEach(k => expect(gefunden).toContain(k));
        // Und die sechste, die durch beide Netze fiel, bis der Nachtrag sie fand.
        expect(gefunden).toContain('dice.css .dice-attr.save:hover -> .dice-attr.save small');
    });

    /** KERNBELEG der Runde 2. Die Klassenform des Zustands war der blinde
     *  Fleck: `ZUSTAND` streicht Pseudoklassen, `.init-entry.active` blieb
     *  unveraendert und galt als "kein Zustand". Die Mutation Gold 10 % -> 95 %
     *  lief damals durch die volle Suite, ohne einen einzigen roten Test.
     *  Diese drei Stellen halten fest, dass die Klassenform jetzt namentlich in
     *  der geurteilten Menge steht — sonst koennte `trifftBasis()` still
     *  leerlaufen und die Ratsche waere wieder gruen und zu klein. */
    test('die Klassenform des Zustands steht namentlich unter Aufsicht', () => {
        const gefunden = geerbteZustaende().map(schluesselVon);
        [
            'initiative.css .init-entry.active -> .init-entry .drag-handle',
            'initiative.css .init-entry.lair -> .init-entry .drag-handle',
            'dice.css .fdp-die.d20 -> .fdp-die'
        ].forEach(k => expect(gefunden).toContain(k));
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 3 — R-19: Schatten nur aus Tokens (Ratsche)
   ===========================================================================
   ZUR NUMMER. Paragraph 6.1 des Handoffs nennt diese Ratsche "R-04". R-04 ist
   seit Welle 1 vergeben und gruen ("jede Regel haelt 4,5 auf ihrer EIGENEN
   Flaeche", Zeile 2177). Wer 6.1 woertlich folgt, ueberschreibt sie, und
   `npx jest -t "R-04"` fuehre danach ZWEI verschiedene Ratschen unter einem
   Namen. Hoechste vergebene Nummer ist R-18; diese heisst deshalb R-19.

   WARUM SIE DIE EIGENTLICHE ABSICHERUNG DIESER WELLE IST. Welle 1 und Welle 2
   konnten sich auf den versionierten Stil-Sollstand stuetzen: 254 bzw. 24
   Digests aenderten sich messbar mit. Fuer Schatten traegt er NICHT. Von 3626
   Digests fuehren genau 6 einen box-shadow ungleich 'none' — zwei .active-
   Chips der Laden-Ansicht (loot.css:313/353), je dreimal erfasst. Grund: der
   Abzug erfasst nur Ruhezustaende innerhalb der View-Container in EINEM Theme;
   von 71 Deklarationen erreichen nur 2 ueberhaupt einen Schluessel, 8 haengen
   an :hover/:focus, 61 liegen ausserhalb. Ohne die Ort->Stufe-Tabelle unten
   waere Welle 3 nach der Sichtprobe ohne jede automatische Absicherung.
   Deshalb entsteht dieser Block VOR der Umsetzung und ist bei seiner Geburt
   ROT — er fuehrt die Welle, statt ihr nachgeformt zu werden.

   DER BESTAND, an HEAD 03274fa mit eigenem Parser erhoben (Kommentare
   zeilentreu geleert, Werte ueber Zeilengrenzen bis ; oder } bei
   Klammertiefe 0 gelesen, Lagen am Komma auf Klammertiefe 0 zerlegt):

       71   box-shadow-Deklarationen in assets/styles/*.css
       86   Lagen darin: 53 Hoehe (X=0, Y>0) · 14 Gluehe (X=0, Y=0, blur>0)
            · 8 Ring (blur=0) · 9 inset · 1 seitlich · 1 none
        8   text-shadow-Deklarationen  } NICHT Gegenstand der Formpruefung,
        1   filter: drop-shadow        } siehe "GELTUNGSBEREICH" unten
       55   verschiedene box-shadow-Werte

   Der Handoff nennt 88 Deklarationen, 65 Werte und "58 hartes Schwarz". Alle
   drei sind Messverfahrensfehler und kein Zeitstand: 88 ist die Zahl der
   STICHWORTNENNUNGEN ueber drei Eigenschaften (78 roher box-shadow-grep inkl.
   6 transition-Zeilen und 1 Kommentar + 9 text-shadow + 1 drop-shadow); bei
   255f8b8, also vor dem Loeschlauf, misst derselbe Parser identisch 71/55.
   Ein ZEILENBASIERTER grep zaehlt hier ueberall zu niedrig (72 statt 78
   Literale), weil mehrlagige Werte ueber Zeilengrenzen laufen — dice.css:628
   ist der Fall, an dem das auffaellt.

   WAS SIE PRUEFT, in vier Teilen:

   (1) FORM. Jede Lage jeder box-shadow-Deklaration ist var(--shadow-1|-2|-3),
       var(--shadow-drawer), var(--ring-gold), ein `0 0 <r>px var(--glow-*)`
       oder das Schluesselwort `none` (auch mit !important) — oder sie steht
       namentlich in AUSNAHMEN.

   (2) ORT -> STUFE. Die Tabelle unten sagt fuer JEDE Hoehen- und die eine
       seitliche Lage, welche Stufe sie traegt. Das ist der Kern: Teil (1)
       allein wuerde auch dann gruen, wenn jede Stelle auf derselben Stufe
       landete. Die Zuordnung ist AUS DER MESSUNG gebildet (naechster
       Weichzeichnungsradius zu 6 / 16 / 32, Gleichstand bei 24px nach OBEN),
       nicht aus dem Ergebnis der Umsetzung abgelesen.

   (3) CONTRAST OHNE WEISS. Im Theme-Block [data-theme="contrast"] traegt kein
       Schattentoken (--shadow*, --ring*, --glow*) das Tripel 255,255,255.
       Ausdruecklich auf den THEME-BLOCK beschraenkt: die zwei themenblinden
       Glanzkanten (dice.css:630, dmscreen.css:782) tragen dasselbe Tripel
       voellig zu Recht und haben mit Contrast nichts zu tun.

   (4) AUSNAHMEN GESCHLOSSEN. Jeder Eintrag in AUSNAHMEN wird genau einmal
       getroffen. Eine Ausnahme, die ins Leere zeigt, ist Altlast; eine, die
       zweimal greift, ist eine stillschweigende Verallgemeinerung.

   DIE LEITER, und warum es diese ist. Paragraph 3.2 schlaegt 2/8 · 4/16 ·
   12/32 vor. Gemessen an den 53 Hoehenlagen laesst 2/6 · 4/16 · 8/32
   VIERUNDZWANZIG Lagen wortgleich statt elf; y=8 ist mit 12 Lagen der
   haeufigste Versatz im oberen Band und fehlt in der Handoff-Leiter,
   `0 2px 6px` kommt achtmal vor. Eine vierte Stufe kauft in derselben
   Rechnung nur +1/-1 und betraefe ein einziges Element (Entscheidung W3-D-02).

   DER CONTRAST-UMRISS. Paragraph 3.2 gibt #555/#777/#aaa. #555 ist im
   Contrast-Block bereits --border (variables.css:583) und haelt gegen die
   vier Contrast-Flaechen nur 2,82 · 2,53 · 2,13 · 1,69 — R-02 verlangt 3.
   Gemessen mit demselben Rechenweg wie tests/unit/helpers/wcag-contrast.js
   ist #888 der kleinste Grauwert, der auf ALLEN vier Flaechen 3:1 haelt
   (5,92 · 5,33 · 4,49 · 3,56); #aaa liest 9,04 · 8,13 · 6,85 · 5,44, #ccc
   13,08 · 11,76 · 9,91 · 7,87. Getrennt werden die Stufen ueber die DICKE
   (Spread 1/2/3px), nicht ueber die Helligkeit: #888 gegen #aaa ist 1,53,
   das liest niemand als Hoehenunterschied (Entscheidung W3-D-01).

   GELTUNGSBEREICH. Diese Ratsche urteilt ueber box-shadow in
   assets/styles/*.css. Die 8 text-shadow-Deklarationen und das eine
   filter: drop-shadow (dice.css:583) sind in Paragraph 3.2 ungeregelt; sie
   werden hier GEZAEHLT, damit die Restmenge nicht lautlos waechst, aber ihre
   FORM wird nicht vorgeschrieben. Die sechs Inline-Schatten im JavaScript
   kommen in Schritt 8 dazu; bis dahin ist die Goldfamilie halb im CSS und
   halb daneben, und das steht hier, damit es nicht als uebersehener Rest
   gilt.
   =========================================================================== */
describe('R-19 — Schatten nur aus Tokens (Ratsche)', () => {
    /** Zielwert. 0 von der Geburt an: was bleiben darf, steht namentlich in
     *  AUSNAHMEN, nicht in einer Restzahl. Die gemessenen Ausgangswerte
     *  stehen im Kopfkommentar und in den `vorher`-Feldern der Tabelle —
     *  eine Ratsche, deren Schranke mitwandert, schuetzt nichts. */
    const R19_ZIEL = 0;

    /** Der Tokenname zu einer Stufe. Die Schublade heisst deshalb 'drawer'
     *  und nicht 4: `--shadow-drawer` faellt in dieselbe Schreibweise, und
     *  die Tabelle unten fuehrt sie damit in derselben Spalte. */
    const stufenToken = stufe => `var(--shadow-${stufe})`;

    /* -------------------------------------------------------------------
       PARSER. Zeilentreu kommentarfrei, Werte ueber Zeilengrenzen, Lagen am
       Komma auf Klammertiefe 0, und mit dem SELEKTORPFAD als Schluessel.
       Der Pfad statt der Zeilennummer, weil Anker in diesem Repo wandern:
       alle drei Zeilenanker des Handoffs (core.css:857, initiative.css:922,
       dice.css:621) zeigen heute ins Leere, jedesmal mit richtigem Inhalt an
       anderer Stelle. Die Zeilennummern der Tabelle werden trotzdem gefuehrt
       und in einem EIGENEN Test gegen die gefundene Deklaration gehalten —
       ein Anker ohne Wertabgleich ist in dieser Datei nichts wert.
       ------------------------------------------------------------------- */

    /** Kommentare zeilentreu leeren; withoutComments() weiter oben loescht sie
     *  ganz und verschiebt damit jede Zeilennummer. */
    function leerKommentare(css) {
        let out = '';
        let i = 0;
        while (i < css.length) {
            if (css[i] === '/' && css[i + 1] === '*') {
                const e = css.indexOf('*/', i + 2);
                const stop = e === -1 ? css.length : e + 2;
                for (let k = i; k < stop; k++) out += css[k] === '\n' ? '\n' : ' ';
                i = stop;
                continue;
            }
            out += css[i];
            i++;
        }
        return out;
    }

    /** Zerlegt einen Schattenwert an den Kommas der OBERSTEN Klammerebene.
     *  Das Komma in `rgba(0, 0, 0, .5)` oder `color-mix(in srgb, …)` trennt
     *  keine Lage. */
    function lagenVon(wert) {
        const out = [];
        let tiefe = 0;
        let cur = '';
        for (const ch of wert) {
            if (ch === '(') tiefe++;
            else if (ch === ')') tiefe--;
            if (ch === ',' && tiefe === 0) {
                if (cur.trim()) out.push(cur.trim());
                cur = '';
            } else cur += ch;
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
    }

    /** Die FUEHRENDEN Laengen einer Lage (x, y, blur, spread). Abgebrochen
     *  wird beim ersten Wort, das keine Laenge ist — danach kommt die Farbe. */
    function laengen(lage) {
        const nums = [];
        for (const tok of lage
            .replace(/\binset\b/g, ' ')
            .trim()
            .split(/\s+/)) {
            if (/^-?\d*\.?\d+px$/.test(tok)) nums.push(parseFloat(tok));
            else if (tok === '0') nums.push(0);
            else break;
        }
        return nums;
    }

    /** Bauart einer Lage. Erschoepfend: jede der 86 gemessenen Lagen faellt in
     *  genau einen dieser Faelle.
     *
     *  DIE DREI ERSTEN ZEILEN SIND KEIN SONDERFALL, sondern die Fortsetzung
     *  derselben Frage nach der Umstellung: sobald eine Lage ihr Token traegt,
     *  steht die Geometrie IM Token und nicht mehr in der Regel. Ohne sie
     *  lieste die Zerlegung `var(--shadow-2)` als Lage ohne Laengen und damit
     *  als Ring — die Stelle fiele aus der Urteilsmenge von Teil (2) heraus,
     *  und die Ratsche koennte nie gruen werden. Die ZUORDNUNG Ort zu Stufe
     *  aendert das nicht; sie steht unveraendert in der Tabelle und ist aus
     *  der Messung gebildet. */
    function bauart(lage) {
        if (/^var\(--shadow-[123]\)$/.test(lage)) return 'hoehe';
        if (/^var\(--shadow-drawer\)$/.test(lage)) return 'seitlich';
        if (/^var\(--ring-gold\)$/.test(lage)) return 'ring';
        if (/\binset\b/.test(lage)) return 'inset';
        const [x = null, y = null, b = 0] = laengen(lage);
        if (x !== null && x !== 0) return 'seitlich';
        if (y !== null && y > 0) return 'hoehe';
        if (x === 0 && y === 0 && b > 0) return 'gluehe';
        return 'ring';
    }

    /** Alle Schattendeklarationen EINER Datei mit Selektorpfad und Zeile.
     *  Klammertiefe statt Zeilenlogik; runde Klammern werden am Stueck
     *  uebersprungen, damit ein Semikolon in color-mix() oder einem Verlauf
     *  keine Deklaration beendet. */
    function deklarationenVon(datei, roh) {
        const css = leerKommentare(roh);
        const zeilenAnfang = [0];
        for (let i = 0; i < css.length; i++) if (css[i] === '\n') zeilenAnfang.push(i + 1);
        const zeileVon = idx => {
            let lo = 0;
            let hi = zeilenAnfang.length - 1;
            while (lo < hi) {
                const m = (lo + hi + 1) >> 1;
                if (zeilenAnfang[m] <= idx) lo = m;
                else hi = m - 1;
            }
            return lo + 1;
        };
        const out = [];
        const stapel = [];
        let i = 0;
        let start = -1;
        let doppel = -1;
        let quote = null;
        const merke = (s, d, e) => {
            const prop = css.slice(s, d).trim().toLowerCase();
            const istSchattenProp = /^(-webkit-)?(box|text)-shadow$/.test(prop);
            const istFilter = /^(-webkit-)?filter$/.test(prop);
            if (!istSchattenProp && !istFilter) return;
            const wert = css
                .slice(d + 1, e)
                .trim()
                .replace(/\s+/g, ' ');
            if (istFilter && !/drop-shadow/.test(wert)) return;
            out.push({ datei, zeile: zeileVon(s), prop, wert, pfad: stapel.join(' >> ') });
        };
        while (i < css.length) {
            const ch = css[i];
            if (quote) {
                if (ch === quote && css[i - 1] !== '\\') quote = null;
                i++;
                continue;
            }
            if (ch === '"' || ch === "'") {
                quote = ch;
                i++;
                continue;
            }
            if (ch === '(') {
                let k = 1;
                i++;
                while (i < css.length && k > 0) {
                    if (css[i] === '(') k++;
                    else if (css[i] === ')') k--;
                    i++;
                }
                continue;
            }
            if (ch === '{') {
                stapel.push(
                    css
                        .slice(start < 0 ? i : start, i)
                        .trim()
                        .replace(/\s+/g, ' ')
                );
                start = -1;
                doppel = -1;
                i++;
                continue;
            }
            if (ch === '}') {
                if (start >= 0 && doppel > start) merke(start, doppel, i);
                stapel.pop();
                start = -1;
                doppel = -1;
                i++;
                continue;
            }
            if (ch === ';') {
                if (start >= 0 && doppel > start) merke(start, doppel, i);
                start = -1;
                doppel = -1;
                i++;
                continue;
            }
            if (start < 0 && !/\s/.test(ch)) start = i;
            if (ch === ':' && doppel < 0 && start >= 0) doppel = i;
            i++;
        }
        return out;
    }

    const alleSchatten = cssFiles.flatMap(f => deklarationenVon(f.name, f.content));
    const boxSchatten = alleSchatten.filter(d => /box-shadow$/.test(d.prop));

    /** Jede Lage einzeln, mit ihrer Deklaration im Ruecken. */
    function lagen() {
        const out = [];
        boxSchatten.forEach(d => {
            if (/^none\b/.test(d.wert)) {
                out.push({ ...d, lage: d.wert, art: 'none' });
                return;
            }
            lagenVon(d.wert).forEach(l => out.push({ ...d, lage: l, art: bauart(l) }));
        });
        return out;
    }

    /* -------------------------------------------------------------------
       DIE AUSNAHMELISTE. Geschlossen und namentlich — vierzehn Eintraege.
       `lage` nimmt genau EINE Lage heraus, `ganze: true` die ganze
       Deklaration. Der Unterschied ist der Kern der Korrektur an Paragraph 7:
       dort stehen "7 inset-Schatten .read-aloud (Papieroptik)" als
       DEKLARATIONEN. Jede dieser sieben traegt aber ZUSAETZLICH eine
       gewoehnliche Aussenlage `0 2px 6px rgba(0,0,0,0.15)`; ganzheitlich
       ausgenommen blieben sieben rohe Aussenschatten dauerhaft ausserhalb des
       Tokensystems, waehrend die Ratsche gruen meldet.
       ------------------------------------------------------------------- */
    const AUSNAHMEN = [
        /* (1-7) Der Papierhof des Vorlesetextes. Sieben Papiertoene, roh und
           themenblind — sie SIND das Papier, keine Hoehenlage. Nur die
           inset-Lage; die Aussenlage wird var(--shadow-1) (Schritt 7). */
        {
            datei: 'party.css',
            zeile: 390,
            pfad:
                '.quest-details .read-aloud, .char-notes-content .read-aloud, ' +
                '.loot-item-desc .read-aloud, .location-description .read-aloud, ' +
                '.npc-list-desc .read-aloud, .wiki-detail-body .read-aloud, ' +
                '.encounter-content .read-aloud, .spell-desc .read-aloud, ' +
                '.rich-editor .read-aloud',
            lage: 'inset 0 0 15px rgba(139, 69, 19, 0.08)',
            grund: 'Papierhof Vorlesetext (Grundton)'
        },
        {
            datei: 'party.css',
            zeile: 398,
            pfad: '.read-aloud.parchment',
            lage: 'inset 0 0 15px rgba(139, 69, 19, 0.08)',
            grund: 'Papierhof Vorlesetext (Pergament) — wertgleich mit dem Grundton, kein Fehler'
        },
        {
            datei: 'party.css',
            zeile: 406,
            pfad: '.read-aloud.crimson',
            lage: 'inset 0 0 15px rgba(153, 27, 27, 0.08)',
            grund: 'Papierhof Vorlesetext'
        },
        {
            datei: 'party.css',
            zeile: 414,
            pfad: '.read-aloud.violet',
            lage: 'inset 0 0 15px rgba(109, 40, 217, 0.08)',
            grund: 'Papierhof Vorlesetext'
        },
        {
            datei: 'party.css',
            zeile: 422,
            pfad: '.read-aloud.sage',
            lage: 'inset 0 0 15px rgba(4, 120, 87, 0.06)',
            grund: 'Papierhof Vorlesetext'
        },
        {
            datei: 'party.css',
            zeile: 430,
            pfad: '.read-aloud.sky',
            lage: 'inset 0 0 15px rgba(3, 105, 161, 0.06)',
            grund: 'Papierhof Vorlesetext'
        },
        {
            datei: 'party.css',
            zeile: 438,
            pfad: '.read-aloud.slate',
            lage: 'inset 0 0 15px rgba(71, 85, 105, 0.06)',
            grund: 'Papierhof Vorlesetext'
        },

        /* (8-9) Die zwei weissen Glanzkanten. Paragraph 7 kennt sie nicht,
           Welle 2 fuehrte sie unter ihren eigenen Ausnahmen — sie fielen
           zwischen die Wellen. Sie sind THEMENBLIND (eine Lichtkante auf
           einer Glasflaeche, in jedem Theme dieselbe) und genau deshalb bleibt
           Teilpruefung (3) auf den Contrast-Theme-Block beschraenkt. Die
           Deklaration beginnt bei dice.css:628 und laeuft ueber drei Zeilen;
           die Lage selbst steht auf 630 — genau der Unterschied, an dem ein
           zeilenbasierter grep sechs Literale verliert. */
        {
            datei: 'dice.css',
            zeile: 628,
            pfad: '.floating-dice-panel',
            lage: '0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            grund: 'Glanzkante auf Glas, themenblind'
        },
        {
            datei: 'dmscreen.css',
            zeile: 782,
            pfad: '.modal',
            lage: '0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            grund: 'Glanzkante auf Glas, themenblind'
        },

        /* (10-11) Die zwei Bilder der Pulsanimation. Der Spread laeuft von 0
           auf 8px; ein Token kann das nicht tragen. Sie konservieren
           rgba(220,38,38) = das Rot des LIGHT-Blocks, also ein themenfremdes
           Literal — das ist bewusst und steht hier, damit es nicht spaeter
           als uebersehener Rest gilt. */
        {
            datei: 'dice.css',
            zeile: 587,
            pfad: '@keyframes floatingPulse >> 0%, 100%',
            ganze: true,
            grund: 'Pulsanimation, animierter Spread'
        },
        {
            datei: 'dice.css',
            zeile: 588,
            pfad: '@keyframes floatingPulse >> 50%',
            ganze: true,
            grund: 'Pulsanimation, animierter Spread'
        },

        /* (12) Das einzige `none`. Eine Pruefung auf /^none$/ ginge am
           !important vorbei — deshalb steht es namentlich hier UND ist die
           Form `none` allgemein erlaubt. */
        {
            datei: 'encounters.css',
            zeile: 95,
            pfad: '#calculator-modal',
            ganze: true,
            grund: 'box-shadow: none !important — ausdruecklich kein Schatten'
        },

        /* (13) Das Ablageziel beim Ziehen, VOLL DECKEND. Ein einheitliches
           --ring-gold (15 %) wuerde ausgerechnet das eine Element schwaechen,
           das unmissverstaendlich sein muss. Es traegt bereits ein Token und
           kein Literal. Nur die Ringlage; die zweite Lage derselben
           Deklaration ist ein Hoehenschatten und steht in der Tabelle. */
        {
            datei: 'dmscreen.css',
            zeile: 1137,
            pfad: '[data-sortable].drag-over',
            lage: '0 0 0 2px var(--gold)',
            grund: 'Ablageziel beim Ziehen, volle Deckung gewollt'
        },

        /* (14) ZUGANG GEGENUEBER DER PLANLISTE, und zwar ein notwendiger.
           Der Plan nennt zwoelf Ausnahmen und haelt im Bestand zugleich fest:
           "3 rote Ringlagen in dice.css, davon 2 in @keyframes floatingPulse".
           Die dritte bekam keinen Platz. Sie ist die RUHELAGE derselben
           Animation — wortgleich mit dem 0-%-Bild von floatingPulse und nur
           sichtbar, wenn die Animation aussetzt (prefers-reduced-motion). Die
           beiden Bilder auszunehmen und ihren Ruhezwilling nicht, waere in
           sich widerspruechlich: R-19 koennte dann nie gruen werden, weil
           `0 0 0 0 rgba(…)` in keine erlaubte Form faellt und kein Token
           diesen Wert traegt. */
        {
            datei: 'dice.css',
            zeile: 564,
            pfad: '.floating-dice-trigger',
            lage: '0 0 0 0 rgba(220, 38, 38, 0.4)',
            grund: 'Ruhelage der Pulsanimation, wortgleich mit dem 0-%-Bild'
        }
    ];

    const ausnahmeSchluessel = a => `${a.datei}||${a.pfad}||${a.ganze ? '*GANZE*' : a.lage}`;

    function ausnahmeZu(l) {
        return AUSNAHMEN.find(
            a => a.datei === l.datei && a.pfad === l.pfad && (a.ganze ? true : a.lage === l.lage)
        );
    }

    /* -------------------------------------------------------------------
       DIE ORT -> STUFE-TABELLE. 52 Eintraege: 51 Hoehenlagen (53 gemessen,
       minus die 2 in @keyframes, die als ganze Deklaration ausgenommen sind)
       und die eine seitliche Lage der Schublade.

       GEBILDET AUS DER MESSUNG, nicht aus dem Ergebnis: Stufe = naechster
       Weichzeichnungsradius zu 6 / 16 / 32. Gleichstand tritt genau bei 24px
       ein (8 zu 16 wie 8 zu 32) und wird nach OBEN aufgeloest — das haelt den
       y-Versatz und laesst die Lage um 1,33x wachsen, statt sie um 0,67x
       schrumpfen zu lassen.

       22 der 52 Eintraege sind geometrisch WORTGLEICH mit ihrer Stufe (mit
       den zwei ausgenommenen @keyframes-Lagen sind es 24 von 53).

       EINE EINZIGE ABWEICHUNG VON DER RADIUSREGEL, und sie ist benannt:
       core.css:840 `.offline-indicator` hat Radius 10 und laege nach der
       Regel auf Stufe 1. Schritt 2 des Plans weist sie ausdruecklich Stufe 2
       zu — die Leiste ist `position: fixed`, also eine frei schwebende
       Auflage und keine angehobene Flaeche, und sie wird in derselben
       Bewegung von var(--shadow) geloest. Sichtfolge beziffert:
       Weichzeichnung 10 -> 16 px (Faktor 1,6), y 2 -> 4 px, Deckung Dark
       0,50 -> 0,45. Nach der Radiusregel waere es 10 -> 6 px (Faktor 0,6) bei
       gleichem y. Die Stelle steht deswegen auf der Sichtprobenliste.

       `vorher` ist der GEMESSENE Ausgangswert an HEAD 03274fa. Er wird nicht
       zugesichert — nach der Umsetzung steht dort ein Token — sondern in die
       Fehlermeldung gehoben, damit sichtbar bleibt, woher die Stufe kommt.
       ------------------------------------------------------------------- */
    const ORT_ZU_STUFE = [
        { datei: 'command-palette.css', zeile: 32, stufe: 3,
          pfad: '.cp-box',
          vorher: '0 16px 48px rgba(0, 0, 0, 0.6)' },
        { datei: 'core.css', zeile: 146, stufe: 3,
          pfad: '#quicknotes-modal .modal',
          vorher: '0 8px 32px rgba(0, 0, 0, 0.6)' },
        { datei: 'core.css', zeile: 390, stufe: 3,
          pfad: '.nav-group-menu',
          vorher: '0 8px 24px rgba(0,0,0,0.45)' },
        { datei: 'core.css', zeile: 854, stufe: 2,
          pfad: '.offline-indicator',
          vorher: '0 2px 10px var(--shadow)' },
        { datei: 'core.css', zeile: 1362, stufe: 1,
          pfad: '.char-tag.clickable:hover',
          vorher: '0 2px 6px rgba(0,0,0,0.3)' },
        { datei: 'core.css', zeile: 1441, stufe: 3,
          pfad: '.spell-tooltip',
          vorher: '0 8px 24px rgba(0,0,0,0.5)' },
        { datei: 'dashboard.css', zeile: 784, stufe: 2,
          pfad: '.conflict-banner',
          vorher: '0 4px 12px rgba(0,0,0,0.3)' },
        { datei: 'dashboard.css', zeile: 867, stufe: 2,
          pfad: '.dash-char:hover',
          vorher: '0 4px 12px rgba(0,0,0,0.3)' },
        { datei: 'dashboard.css', zeile: 1174, stufe: 2,
          pfad: '.qref-fab',
          vorher: '0 4px 12px rgba(0,0,0,0.4)' },
        { datei: 'dashboard.css', zeile: 1181, stufe: 2,
          pfad: '.qref-fab:hover',
          vorher: '0 6px 20px rgba(212,175,55,0.4)' },
        { datei: 'dashboard.css', zeile: 1198, stufe: 3,
          pfad: '.qref-panel',
          vorher: '0 8px 32px rgba(0,0,0,0.5)' },
        { datei: 'dice.css', zeile: 79, stufe: 2,
          pfad: '.dice-die:hover',
          vorher: '0 4px 16px rgba(0,0,0,0.3)' },
        { datei: 'dice.css', zeile: 564, stufe: 2,
          pfad: '.floating-dice-trigger',
          vorher: '0 4px 16px rgba(220, 38, 38, 0.4)' },
        { datei: 'dice.css', zeile: 573, stufe: 3,
          pfad: '.floating-dice-trigger:hover',
          vorher: '0 6px 24px rgba(220, 38, 38, 0.5)' },
        { datei: 'dice.css', zeile: 628, stufe: 3,
          pfad: '.floating-dice-panel',
          vorher: '0 8px 32px rgba(0, 0, 0, 0.5)' },
        { datei: 'dmscreen.css', zeile: 50, stufe: 3,
          pfad: '.global-search-results',
          vorher: '0 8px 24px rgba(0,0,0,0.4)' },
        { datei: 'dmscreen.css', zeile: 263, stufe: 2,
          pfad: '.condition-tooltip',
          vorher: '0 4px 12px rgba(0,0,0,0.3)' },
        { datei: 'dmscreen.css', zeile: 782, stufe: 3,
          pfad: '.modal',
          vorher: '0 8px 32px rgba(0, 0, 0, 0.4)' },
        { datei: 'dmscreen.css', zeile: 815, stufe: 3,
          pfad: '.dragging',
          vorher: '0 8px 24px rgba(212, 175, 55, 0.3)' },
        { datei: 'dmscreen.css', zeile: 872, stufe: 2,
          pfad: '.export-dropdown-content',
          vorher: '0 4px 12px rgba(0,0,0,0.3)' },
        { datei: 'dmscreen.css', zeile: 953, stufe: 1,
          pfad: '[data-tooltip]::after',
          vorher: '0 2px 8px rgba(0,0,0,0.3)' },
        { datei: 'dmscreen.css', zeile: 977, stufe: 2,
          pfad: '.char-card:hover, .npc-card:hover, .location-card:hover, .encounter-card:hover, .spell-card:hover',
          vorher: '0 4px 16px rgba(0, 0, 0, 0.25)' },
        { datei: 'dmscreen.css', zeile: 1131, stufe: 2,
          pfad: '[data-sortable].dragging',
          vorher: '0 8px 20px rgba(0, 0, 0, 0.3)' },
        { datei: 'dmscreen.css', zeile: 1137, stufe: 2,
          pfad: '[data-sortable].drag-over',
          vorher: '0 4px 12px rgba(212, 175, 55, 0.3)' },
        { datei: 'dmscreen.css', zeile: 2183, stufe: 3,
          pfad: '.dms-config-dropdown',
          vorher: '0 8px 32px rgba(0,0,0,0.4)' },
        { datei: 'dmscreen.css', zeile: 2436, stufe: 3,
          pfad: '.dmscreen-widget.dragging',
          vorher: '0 8px 32px rgba(0,0,0,0.3)' },
        { datei: 'editors.css', zeile: 192, stufe: 3,
          pfad: '.editor-toolbar .tb-menu',
          vorher: '0 14px 34px rgba(0, 0, 0, 0.65)' },
        { datei: 'editors.css', zeile: 337, stufe: 2,
          pfad: '.editor-block-handle',
          vorher: '0 4px 16px rgba(0, 0, 0, 0.4)' },
        { datei: 'encounters.css', zeile: 110, stufe: 3,
          pfad: '#calculator-modal .modal-content',
          vorher: '0 20px 60px rgba(0, 0, 0, 0.5)' },
        { datei: 'encounters.css', zeile: 577, stufe: 1,
          pfad: '#calc-budget-slider::-webkit-slider-thumb',
          vorher: '0 2px 4px rgba(0,0,0,0.3)' },
        { datei: 'encounters.css', zeile: 587, stufe: 1,
          pfad: '#calc-budget-slider::-moz-range-thumb',
          vorher: '0 2px 4px rgba(0,0,0,0.3)' },
        { datei: 'encounters.css', zeile: 645, stufe: 2,
          pfad: '.calc-favorites-dropdown',
          vorher: '0 4px 12px rgba(0,0,0,0.3)' },
        { datei: 'encounters.css', zeile: 1377, stufe: 2,
          pfad: '.enc-lang-dropdown',
          vorher: '0 4px 12px rgba(0,0,0,0.3)' },
        // Anker 1055 -> 1078: die Begruendung an .init-entry.lair .init-type
        // (Pruefung W3-E, Runde 1) ist 23 Zeilen weiter oben eingefuegt.
        { datei: 'initiative.css', zeile: 1078, stufe: 'drawer',
          pfad: '.init-statblock-content',
          vorher: '-4px 0 24px rgba(0, 0, 0, 0.5)' },
        { datei: 'loot.css', zeile: 313, stufe: 1,
          pfad: '.shop-cat-badge.active',
          vorher: '0 2px 4px rgba(212, 175, 55, 0.3)' },
        { datei: 'loot.css', zeile: 353, stufe: 1,
          pfad: '.shop-sort-btn.active',
          vorher: '0 2px 4px rgba(212, 175, 55, 0.3)' },
        { datei: 'npcs.css', zeile: 934, stufe: 3,
          pfad: '.npc-popup',
          vorher: '0 8px 32px rgba(0,0,0,0.4)' },
        { datei: 'npcs.css', zeile: 1063, stufe: 1,
          pfad: '.npc-list-tag.clickable:hover',
          vorher: '0 2px 8px rgba(0,0,0,0.3)' },
        { datei: 'party.css', zeile: 390, stufe: 1,
          pfad: '.quest-details .read-aloud, .char-notes-content .read-aloud, .loot-item-desc .read-aloud, .location-description .read-aloud, .npc-list-desc .read-aloud, .wiki-detail-body .read-aloud, .encounter-content .read-aloud, .spell-desc .read-aloud, .rich-editor .read-aloud',
          vorher: '0 2px 6px rgba(0,0,0,0.15)' },
        { datei: 'party.css', zeile: 398, stufe: 1,
          pfad: '.read-aloud.parchment',
          vorher: '0 2px 6px rgba(0,0,0,0.15)' },
        { datei: 'party.css', zeile: 406, stufe: 1,
          pfad: '.read-aloud.crimson',
          vorher: '0 2px 6px rgba(0,0,0,0.15)' },
        { datei: 'party.css', zeile: 414, stufe: 1,
          pfad: '.read-aloud.violet',
          vorher: '0 2px 6px rgba(0,0,0,0.15)' },
        { datei: 'party.css', zeile: 422, stufe: 1,
          pfad: '.read-aloud.sage',
          vorher: '0 2px 6px rgba(0,0,0,0.15)' },
        { datei: 'party.css', zeile: 430, stufe: 1,
          pfad: '.read-aloud.sky',
          vorher: '0 2px 6px rgba(0,0,0,0.15)' },
        { datei: 'party.css', zeile: 438, stufe: 1,
          pfad: '.read-aloud.slate',
          vorher: '0 2px 6px rgba(0,0,0,0.15)' },
        { datei: 'party.css', zeile: 609, stufe: 2,
          pfad: '.event-log-entry',
          vorher: '0 4px 16px rgba(0, 0, 0, 0.4)' },
        { datei: 'party.css', zeile: 1674, stufe: 2,
          pfad: '.cf-languages-block .cf-lang-dropdown',
          vorher: '0 4px 12px rgba(0, 0, 0, 0.4)' },
        { datei: 'spells.css', zeile: 446, stufe: 2,
          pfad: '.floating-toolbar',
          vorher: '0 4px 20px rgba(0, 0, 0, 0.5)' },
        { datei: 'spells.css', zeile: 535, stufe: 2,
          pfad: '.table-context-toolbar',
          vorher: '0 4px 16px rgba(0, 0, 0, 0.4)' },
        { datei: 'spells.css', zeile: 573, stufe: 2,
          pfad: '.link-context-toolbar',
          vorher: '0 4px 16px rgba(0, 0, 0, 0.4)' },
        { datei: 'tools.css', zeile: 1180, stufe: 3,
          pfad: '.wiki-search-dropdown',
          vorher: '0 10px 30px rgba(0,0,0,0.4)' },
        { datei: 'tools.css', zeile: 1359, stufe: 2,
          pfad: '.wiki-link-suggester',
          vorher: '0 4px 20px rgba(0,0,0,0.4)' }
    ];

    const stufenSchluessel = e => `${e.datei}||${e.pfad}`;

    /** Die Lagen, ueber die Teil (2) urteilt: Hoehe und die eine seitliche,
     *  ohne die ausgenommenen. */
    function tabellenLagen() {
        return lagen().filter(l => (l.art === 'hoehe' || l.art === 'seitlich') && !ausnahmeZu(l));
    }

    /* -------------------------------------------------------------------
       TEIL (2) — der Kern. Zuerst, weil alles andere ihn nur einrahmt.
       ------------------------------------------------------------------- */
    test('jede Hoehenlage steht in der Ort->Stufe-Tabelle und traegt ihre Stufe', () => {
        const offen = [];
        const getroffen = new Map();
        tabellenLagen().forEach(l => {
            const e = ORT_ZU_STUFE.find(x => x.datei === l.datei && x.pfad === l.pfad);
            if (!e) {
                offen.push(
                    `${l.datei}:${l.zeile} {${l.pfad}} — Hoehenlage OHNE Eintrag in der ` +
                        `Ort->Stufe-Tabelle: "${l.lage}"`
                );
                return;
            }
            const k = stufenSchluessel(e);
            getroffen.set(k, (getroffen.get(k) || 0) + 1);
            const soll = stufenToken(e.stufe);
            if (l.lage !== soll) {
                offen.push(
                    `${l.datei}:${l.zeile} {${l.pfad}} — traegt "${l.lage}", Tabelle sagt ` +
                        `Stufe ${e.stufe} = ${soll} (gemessener Ausgangswert: "${e.vorher}")`
                );
            }
        });
        ORT_ZU_STUFE.forEach(e => {
            const ist = getroffen.get(stufenSchluessel(e)) || 0;
            if (ist !== 1) {
                offen.push(
                    `TABELLE ${e.datei} {${e.pfad}} — ${ist}x getroffen, erwartet genau 1x ` +
                        `(Ausgangswert "${e.vorher}")`
                );
            }
        });

        /* Die Stichprobe haelt die Fehlerausgabe lesbar, solange die Ratsche
           rot ist: die Zahl ist die Aussage, zwoelf Stellen zeigen die Art. */
        expect({ anzahl: offen.length, stichprobe: offen.slice(0, 12) }).toEqual({
            anzahl: R19_ZIEL,
            stichprobe: []
        });
    });

    /** Die erlaubten Formen einer Schattenlage.
     *
     *  SIE STEHT IM describe-RUMPF UND NICHT MEHR IM TEST, seit Teil (5)
     *  dazugekommen ist (Schritt 8): die JS-Pruefung muss WORTGLEICH dieselbe
     *  Form verlangen wie die CSS-Pruefung. Zwei Kopien derselben Liste waeren
     *  genau die Stelle, an der die beiden Geltungsbereiche auseinanderlaufen
     *  — und zwar lautlos, weil beide Tests dann fuer sich gruen bleiben.
     *  Inhaltlich unveraendert gegenueber der Fassung im Test. */
    const ERLAUBT = [
        /^var\(--shadow-[123]\)$/,
        /^var\(--shadow-drawer\)$/,
        /^var\(--ring-gold\)$/,
        /^0 0 \d+px var\(--glow-(gold|yellow|green|red)\)$/,
        /^none(\s+!important)?$/
    ];

    /* -------------------------------------------------------------------
       TEIL (1) — Form. Ohne Teil (2) waere sie auch dann gruen, wenn jede
       Stelle auf derselben Stufe landete.
       ------------------------------------------------------------------- */
    test('jede Lage jeder box-shadow-Deklaration hat eine erlaubte Form', () => {
        const offen = [];
        lagen().forEach(l => {
            if (ausnahmeZu(l)) return;
            if (ERLAUBT.some(re => re.test(l.lage))) return;
            offen.push(`${l.datei}:${l.zeile} {${l.pfad}} [${l.art}] "${l.lage}"`);
        });
        expect({ anzahl: offen.length, stichprobe: offen.slice(0, 12) }).toEqual({
            anzahl: R19_ZIEL,
            stichprobe: []
        });
    });

    /* -------------------------------------------------------------------
       TEIL (3) — Contrast ohne Weiss. AUSDRUECKLICH auf den Theme-Block
       beschraenkt. Ein Lauf ueber den ganzen Baum schluege an den zwei
       themenblinden Glanzkanten an, die mit Contrast nichts zu tun haben.
       ------------------------------------------------------------------- */
    test('kein Schattentoken des Contrast-Blocks traegt 255,255,255', () => {
        const roh = cssFiles.find(f => f.name === 'variables.css').content;
        const css = leerKommentare(roh);
        const anf = css.indexOf('[data-theme="contrast"]');
        expect(anf).toBeGreaterThan(-1);
        const auf = css.indexOf('{', anf);
        let tiefe = 1;
        let j = auf + 1;
        while (j < css.length && tiefe) {
            if (css[j] === '{') tiefe++;
            else if (css[j] === '}') tiefe--;
            j++;
        }
        const rumpf = css.slice(auf + 1, j - 1);

        const SCHATTENTOKEN = /^--(shadow|ring|glow)(-|$)/;
        const WEISS = /255\s*,\s*255\s*,\s*255/;
        const offen = [];
        for (const d of rumpf.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
            if (!SCHATTENTOKEN.test(d[1])) continue;
            if (WEISS.test(d[2])) offen.push(`${d[1]}: ${d[2].trim()}`);
        }
        expect(offen).toEqual([]);

        /* Gegenprobe gegen eine gruene, leere Ratsche: der Block MUSS
           ueberhaupt Schattentokens fuehren. Faellt die Klammersuche
           auseinander oder wird der Tokensatz umbenannt, waere die Pruefung
           oben sonst trivial erfuellt. Die vier sind --shadow-1/-2/-3 und
           --shadow-drawer; --ring-gold kommt als fuenftes dazu. */
        const gefuehrt = [...rumpf.matchAll(/(--[\w-]+)\s*:/g)]
            .map(m => m[1])
            .filter(n => SCHATTENTOKEN.test(n));
        expect(gefuehrt.length).toBeGreaterThanOrEqual(4);
    });

    /* -------------------------------------------------------------------
       TEIL (4) — die Ausnahmeliste ist geschlossen. Eine Ausnahme, die ins
       Leere zeigt, ist Altlast; eine, die zweimal greift, ist eine
       stillschweigende Verallgemeinerung.
       ------------------------------------------------------------------- */
    test('jede Ausnahme wird genau einmal getroffen', () => {
        const gezaehlt = new Map();
        lagen().forEach(l => {
            const a = ausnahmeZu(l);
            if (!a) return;
            const k = ausnahmeSchluessel(a);
            gezaehlt.set(k, (gezaehlt.get(k) || 0) + 1);
        });
        const offen = [];
        AUSNAHMEN.forEach(a => {
            const k = ausnahmeSchluessel(a);
            const ist = gezaehlt.get(k) || 0;
            /* Eine `ganze`-Ausnahme deckt eine Deklaration ab; die zwei
               @keyframes-Bilder tragen je ZWEI Lagen, das eine `none` genau
               eine. Deshalb wird die Lagenzahl je Eintrag mitgefuehrt. */
            const soll = a.ganze ? (a.pfad.startsWith('@keyframes') ? 2 : 1) : 1;
            if (ist !== soll) {
                offen.push(
                    `AUSNAHME ${a.datei}:${a.zeile} {${a.pfad}} — ${ist} Lage(n) getroffen, ` +
                        `erwartet ${soll} (${a.grund})`
                );
            }
        });
        expect(offen.sort()).toEqual([]);
        expect(AUSNAHMEN.length).toBe(14);
    });

    /* -------------------------------------------------------------------
       TEIL (5) — DER GELTUNGSBEREICH JAVASCRIPT (Schritt 8, W3-D-05).

       WARUM SIE NOETIG IST, und zwar genau HIER und nicht als eigener Block.
       Welle 2 hat JavaScript ausdruecklich ausgeschlossen (E5). Bliebe es
       auch fuer Welle 3 draussen, waere R-19 nach Schritt 7 GRUEN, waehrend
       sechs goldene Inline-Schatten daneben weiterleben — die Ratsche
       behauptete dann mehr, als sie prueft. Das ist dieselbe Klasse Fehler,
       die in Welle 2 die Lehre "Gate existiert != Gate laeuft" erzeugt hat,
       und sie waere hier besonders teuer: die Goldfamilie waere zur Haelfte
       im Tokensystem und zur Haelfte nicht, ohne dass irgendetwas anschlaegt.

       Sie steht in R-19 und nicht daneben, weil sie DIESELBE Frage stellt
       ("traegt diese Schattenlage eine erlaubte Form?") und darum auch
       dieselbe Antwort benutzen muss: `ERLAUBT` ist aus dem Teil-(1)-Test in
       den describe-Rumpf gehoben, damit es die Liste genau einmal gibt.

       Das Verfahren ist im Haus vorhanden: R-09 ("die Ortsfarben aus dem JS")
       und R-16 ("Tinte auf JS-gesetzter Flaeche") lesen bereits JS-Quellen.
       Gelesen wird ueber `sourceJs()`, also dieselben sechs Quellordner
       (features, systems, ui, core, render, utils) — Werkzeuge und Tests
       bleiben aussen vor.

       ZWEI SCHREIBWEISEN, und beide muessen mit. `.style.boxShadow = '…'` ist
       die eine; die drei Ausnahmen unten sind die andere, naemlich
       `box-shadow:` in einer CSS-Zeichenkette. Wuerde nur die erste geprueft,
       waere die Ausnahmeliste eine Behauptung ohne Gegenstand: die drei
       Stellen kaemen in der Urteilsmenge gar nicht vor, und "geschlossen"
       hiesse nichts. Deshalb werden beide gesammelt und beide beurteilt.

       DIE GEMESSENEN AUSGANGSWERTE bei der Geburt dieses Teils (HEAD 7976375,
       Befehl `grep -rn "boxShadow" features/ ui/ systems/ core/ render/
       utils/ | grep -v transition` und `grep -rn "box-shadow" …`):

           6   `.style.boxShadow`-Zuweisungen mit einem Wert — alle sechs ROT
               4x `0 0 20px var(--gold)`   Sprungmarken:
                   features/encounters/encounters-render.js:520  (heute :528)
                   features/locations/locations-render.js:360    (heute :368)
                   features/npcs/npc-render.js:382               (heute :390)
                   systems/entity-links.js:430                   (heute :437)
               2x `0 0 0 2px var(--gold)`  Ringe mit Ruecknahme nach 2000 ms:
                   ui/actions/entity-actions.js:362              (heute :373)
                   systems/undo.js:778                           (war :756, dann :766)
           6   `.style.boxShadow = ''` — die Ruecknahmen, erlaubt
           3   `box-shadow:` in CSS-Zeichenketten — die drei Ausnahmen
           3   `transition = 'box-shadow …'` — keine Schattenwerte, kein Fall

       DIE ZWEITE NUMMER JE ZEILE ist die von heute. Die sechs Stellen sind bei
       ihrer Umstellung um 8 bis 11 Zeilen nach unten gerutscht, weil jede
       einen Begruendungskommentar bekommen hat (W3-D-05 verlangt die
       Begruendung AM CODE). Beide Nummern stehen hier, weil die erste den
       Ausgangswert verankert und die zweite auffindbar halten muss — ein
       Anker, der nur historisch stimmt, ist in dieser Datei nichts wert. Ein
       Test prueft sie nicht: die sechs sind KEINE Ausnahmen, sie tragen
       Tokens, und ihre Form wird ueber `ERLAUBT` geprueft, nicht ueber eine
       Zeilennummer. Geprueft werden die Anker der drei JS_AUSNAHMEN unten.

       `var(--gold)` ist ein Token, aber kein SCHATTENtoken: es traegt eine
       Farbe und keine Lage, und es ist volldeckend. Genau daran haengt die
       ganze Frage von Schritt 8 — siehe die Begruendung an den sechs Stellen
       selbst.
       ------------------------------------------------------------------- */

    /** Die drei Stellen, an denen ein Schatten im JavaScript ein Literal
     *  bleiben DARF. Namentlich, mit Grund, und jede wird genau einmal
     *  getroffen — dieselbe Zucht wie bei AUSNAHMEN oben, und aus demselben
     *  Grund: eine Ausnahme, die ins Leere zeigt, ist Altlast. */
    const JS_AUSNAHMEN = [
        {
            datei: 'features/shops/shop-export.js',
            zeile: 292,
            wert: '0 4px 6px rgba(0,0,0,0.1)',
            grund:
                'eigenstaendiges Handout-Dokument — die Datei erzeugt eine HTML-Datei ' +
                'zum Ausdrucken, die ohne die Variablen der App auskommen muss'
        },
        {
            datei: 'features/shops/shop-export.js',
            zeile: 486,
            wert: 'none',
            grund: 'Druckregel desselben Handouts'
        },
        {
            datei: 'utils/utilities.js',
            zeile: 707,
            wert: '0 4px 12px rgba(0,0,0,0.15)',
            grund:
                'Notfall-Toast (der Alt-#toast aus W2-E-05) — eine Inline-Stilzeichenkette, ' +
                'die laeuft, wenn die App schon halb steht; ein var() koennte dort leer sein'
        }
    ];

    /** Alle Schattenstellen im JavaScript, in beiden Schreibweisen, mit
     *  Datei, Zeile und Wert. */
    function jsSchatten() {
        const out = [];
        sourceJs().forEach(f => {
            const rel = path.relative(REPO, f.name).split(path.sep).join('/');
            const zeileVon = idx => f.content.slice(0, idx).split('\n').length;

            /* (a) `el.style.boxShadow = '<wert>'` — auch ueber eine
                   Klammer hinweg, wie in `(el.style.boxShadow = '')`. */
            for (const m of f.content.matchAll(
                /\.style\.boxShadow\s*=\s*(['"`])([\s\S]*?)\1/g
            )) {
                out.push({ datei: rel, zeile: zeileVon(m.index), wert: m[2].trim(), art: 'zuweisung' });
            }

            /* (b) `box-shadow: <wert>` in einer Zeichenkette. Der Wert laeuft
                   bis zum Semikolon oder zum Zeilenende. `transition:
                   box-shadow 0.3s` faellt NICHT darunter (dort folgt dem Wort
                   kein Doppelpunkt) — genau deshalb steht der Doppelpunkt im
                   Muster und nicht nur das Wort. */
            for (const m of f.content.matchAll(/box-shadow\s*:\s*([^;\n]*)/g)) {
                out.push({ datei: rel, zeile: zeileVon(m.index), wert: m[1].trim(), art: 'zeichenkette' });
            }
        });
        return out;
    }

    test('keine JS-Stelle setzt einen Schatten aus einem Literal oder Nicht-Schattentoken', () => {
        const stellen = jsSchatten();

        /* Gegenprobe gegen eine gruene, leere Ratsche: findet der Sammler
           nichts, prueft die Schleife ueber Leerlauf und meldet Erfolg.
           Zwoelf Zuweisungen sind der gemessene Bestand (6 Werte + 6
           Ruecknahmen); unter zehn ist der Sammler kaputt, nicht der Baum. */
        expect(stellen.filter(s => s.art === 'zuweisung').length).toBeGreaterThanOrEqual(10);

        const getroffen = new Map();
        const offen = [];
        stellen.forEach(s => {
            const a = JS_AUSNAHMEN.find(x => x.datei === s.datei && x.wert === s.wert);
            if (a) {
                const k = `${a.datei}:${a.zeile}`;
                getroffen.set(k, (getroffen.get(k) || 0) + 1);
                /* Kein Zeilenanker ohne Wertabgleich — dieselbe Regel wie
                   beim Ankertest oben. Wandert die Zeile, sagt die Meldung
                   die neue Nummer. */
                if (s.zeile !== a.zeile) {
                    offen.push(
                        `JS-AUSNAHME ${a.datei} "${a.wert}" — Anker ${a.zeile}, gefunden ${s.zeile}`
                    );
                }
                return;
            }
            if (s.wert === '') return; /* die Ruecknahme */
            const ok = lagenVon(s.wert).every(l => ERLAUBT.some(re => re.test(l)));
            if (ok) return;
            offen.push(`${s.datei}:${s.zeile} [${s.art}] "${s.wert}"`);
        });

        JS_AUSNAHMEN.forEach(a => {
            const ist = getroffen.get(`${a.datei}:${a.zeile}`) || 0;
            if (ist !== 1) {
                offen.push(
                    `JS-AUSNAHME ${a.datei}:${a.zeile} — ${ist}x getroffen, erwartet genau 1x ` +
                        `("${a.wert}", ${a.grund})`
                );
            }
        });

        expect({ anzahl: offen.length, stichprobe: offen.slice(0, 12) }).toEqual({
            anzahl: R19_ZIEL,
            stichprobe: []
        });
        expect(JS_AUSNAHMEN.length).toBe(3);
    });

    /* -------------------------------------------------------------------
       DIE ANKER. Kein Zeilenanker in dieser Datei ohne Wertabgleich: jede
       Zeilennummer der Tabelle und der Ausnahmeliste wird gegen die
       Deklaration gehalten, die der Selektorpfad findet. Wandert eine Zeile,
       geht dieser Test rot und sagt die neue Nummer — er blockiert nicht
       stillschweigend die Urteilsmenge.
       ------------------------------------------------------------------- */
    test('jede Zeilennummer der Tabelle trifft ihre Deklaration', () => {
        const offen = [];
        const wo = new Map();
        boxSchatten.forEach(d => wo.set(`${d.datei}||${d.pfad}`, d.zeile));
        ORT_ZU_STUFE.forEach(e => {
            const ist = wo.get(stufenSchluessel(e));
            if (ist === undefined) {
                offen.push(`${e.datei} {${e.pfad}} — keine box-shadow-Deklaration gefunden`);
            } else if (ist !== e.zeile) {
                offen.push(`${e.datei} {${e.pfad}} — Anker ${e.zeile}, gefunden ${ist}`);
            }
        });
        AUSNAHMEN.forEach(a => {
            const ist = wo.get(`${a.datei}||${a.pfad}`);
            if (ist === undefined) {
                offen.push(`AUSNAHME ${a.datei} {${a.pfad}} — keine Deklaration gefunden`);
            } else if (ist !== a.zeile) {
                offen.push(`AUSNAHME ${a.datei} {${a.pfad}} — Anker ${a.zeile}, gefunden ${ist}`);
            }
        });
        expect(offen.sort()).toEqual([]);
    });

    /* -------------------------------------------------------------------
       INVENTAR. Nicht Gegenstand der Formpruefung, aber gezaehlt — damit die
       Restmenge nicht lautlos waechst. Paragraph 3.2 regelt text-shadow und
       filter: drop-shadow nicht; wenn Schritt 5 sie mitnimmt, bleibt die Zahl
       gleich und dieser Test gruen. Waechst sie, ist eine neue ungeregelte
       Stelle entstanden.
       ------------------------------------------------------------------- */
    test('der Bestand ist der gemessene: 71 box-shadow, 8 text-shadow, 1 drop-shadow', () => {
        const zahl = prop => alleSchatten.filter(d => prop.test(d.prop)).length;
        expect({
            box: zahl(/box-shadow$/),
            text: zahl(/text-shadow$/),
            drop: zahl(/filter$/),
            lagen: lagen().length
        }).toEqual({ box: 71, text: 8, drop: 1, lagen: 86 });
    });

    /* -------------------------------------------------------------------
       SELBSTPROBE DER ZERLEGUNG, nicht ihres Ergebnisses. Ein zeilenbasierter
       grep zaehlt in diesem Bestand 72 statt 78 Literale, weil mehrlagige
       Werte ueber Zeilengrenzen laufen. Faellt die Zerlegung auf dieselbe
       Schwaeche zurueck, waere R-19 gruen und zu klein — und das faellt bei
       keinem Zaehllauf auf, sondern erst beim Rueckfall, den sie verhindern
       soll, und dann nicht mehr.
       ------------------------------------------------------------------- */
    test('lagenVon() trennt am Komma der obersten Klammerebene, nicht an der Zeile', () => {
        expect(lagenVon('0 2px 6px rgba(0, 0, 0, 0.3)')).toEqual(['0 2px 6px rgba(0, 0, 0, 0.3)']);
        expect(lagenVon('0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset')).toEqual([
            '0 8px 32px rgba(0,0,0,0.5)',
            '0 0 0 1px rgba(255,255,255,0.05) inset'
        ]);
        expect(lagenVon('0 0 0 2px color-mix(in srgb, var(--gold) 15%, transparent)')).toEqual([
            '0 0 0 2px color-mix(in srgb, var(--gold) 15%, transparent)'
        ]);
        expect(bauart('-4px 0 24px rgba(0, 0, 0, 0.5)')).toBe('seitlich');
        expect(bauart('0 0 20px rgba(220, 38, 38, 0.3)')).toBe('gluehe');
        expect(bauart('0 0 0 3px rgba(212, 175, 55, 0.1)')).toBe('ring');
        expect(bauart('inset 0 0 15px rgba(139, 69, 19, 0.08)')).toBe('inset');
        expect(bauart('0 4px 16px rgba(0, 0, 0, 0.4)')).toBe('hoehe');

        /* Der Fall, an dem der zeilenbasierte grep scheitert: eine
           Deklaration, deren zweite Lage auf einer anderen Zeile steht. Der
           Parser muss BEIDE sehen und die Deklaration auf ihrer Anfangszeile
           verankern. */
        const probe = deklarationenVon(
            'probe.css',
            '.a {\n    box-shadow:\n        0 8px 32px rgba(0, 0, 0, 0.5),\n' +
                '        0 0 0 1px rgba(255, 255, 255, 0.05) inset;\n}\n'
        );
        expect(probe.length).toBe(1);
        expect(probe[0].zeile).toBe(2);
        expect(lagenVon(probe[0].wert).length).toBe(2);
        expect(probe[0].pfad).toBe('.a');

        /* Und der Pfad einer verschachtelten At-Regel, damit die zwei
           @keyframes-Ausnahmen ihren Schluessel behalten. */
        const kf = deklarationenVon(
            'probe.css',
            '@keyframes p {\n    0%, 100% { box-shadow: 0 0 0 0 rgba(1,2,3,0.4); }\n}\n'
        );
        expect(kf.length).toBe(1);
        expect(kf[0].pfad).toBe('@keyframes p >> 0%, 100%');
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 3 — R-20: die Gluehlagen und die Rahmennachbarn
   ===========================================================================
   WARUM SIE NEBEN R-19 STEHT UND NICHT IN IHR. R-19 urteilt in Teil (2) ueber
   die 52 Hoehen- und die eine seitliche Lage. Die 14 GLUEHLAGEN kommen dort
   nur in Teil (1) vor, und der erlaubt die Form `0 0 <r>px var(--glow-*)`
   OHNE zu sagen, welches r. Damit stand die eine Groesse, die W3-D-03
   ausdruecklich unberuehrt lassen will — der Radius —, unter keiner Ratsche;
   und die DECKUNG, die das Token seit dem 2026-09-30 fuer alle 14 Stellen
   gemeinsam setzt, unter gar keiner.

   DREI LUECKEN, die sie schliesst, alle am 2026-09-30 gemessen:

   (a) DIE DECKUNG WANDERT AN ALLEN 14 STELLEN. `--glow-*` traegt EINEN
       Prozentwert fuer vierzehn Stellen, die im Bestand sechs verschiedene
       tragen: 0,20 (1x) · 0,25 (3x) · 0,30 (2x) · 0,40 (2x) · 0,50 (4x) ·
       1,00 (2x). Median 0,40, Mittel 0,4536, HAEUFIGSTER Wert 0,50.
       Mit 55 % — dem ersten hier gesetzten Wert — blieb KEINE der 14 Stellen
       gleich; mit 50 % bleiben vier bildpunktgleich (dashboard.css zweimal
       wortgleich, editors.css und spells.css als color-mix derselben Farbe).
       Das ist dieselbe Rechnung, mit der W3-D-02 die Hoehenleiter gewaehlt
       hat ("24 von 53 wortgleich statt elf"), und dieselbe, mit der
       `--ring-gold` auf 15 % kam (party.css traegt genau das schon).
       Deshalb prueft diese Ratsche nicht, ob ein Kommentar eine Zahl NENNT,
       sondern ob die gewaehlte Zahl im Bestand VORKOMMT und dort die
       haeufigste ist.

   (b) DIE RADIEN. 4/4/6/6/8/8/10/12/12/12/12/20/30/30. W3-D-03 laesst sie
       bewusst stehen; ohne Tabelle faellt eine Verschiebung bei der
       Umstellung in Schritt 6/7 niemandem auf.

   (c) DIE DOPPELTE LINIE IN CONTRAST IST GROESSER ALS 13. Der Plan fuehrt
       als Kandidaten fuer "Umriss nicht von Rahmen zu unterscheiden" nur die
       13 Schattenregeln mit `border: 1px solid var(--border)`. Gemessen
       tragen ZUSAETZLICH NEUN einen Rahmen aus `--gold`, sechs davon
       volldeckend — und im Contrast-Theme ist `--gold` #ffd700. Gegen die
       Grauleiter liest das volle Gold 1,14 (#ccc) bzw. 1,66 (#aaa): an diesen
       sechs Stellen entsteht eine Bande aus 1px Gold und 2-3px Fast-Weiss
       ohne Helligkeitsunterschied, die als verbreiteter RAHMEN liest und
       nicht als Hoehe. Die drei mit gemischtem Goldrahmen sind NICHT
       betroffen: 20-30 % Gold ueber der Contrast-Karte loesen zu einem
       dunklen Oliv auf (#41390e / #584c0c) und lesen 5,33-7,20 gegen #ccc.
       Diese Unterscheidung steht hier, weil der Befund sie nicht traf und
       eine ungepruefte Sichtprobenliste sonst drei Stellen zuviel und die
       drei schlimmsten nicht hervorgehoben nennt.

       UND SIE IST GROESSER ALS 22 (nachgetragen am 2026-09-30, Runde 2). Die
       erste Fassung dieses Blocks zaehlte drei Klassen (13 + 6 + 3) und nannte
       die Summe 22 eine Kandidatenzahl — waehrend eine vierte Klasse `sonst`
       sechs weitere Regeln auffing, die KEIN Test angesehen hat. Darin lagen
       `spells.css {.table-context-toolbar}` (Rahmen `var(--cyan)`, in Contrast
       #00ffff, 1,85 gegen #aaa) und `spells.css {.link-context-toolbar}`
       (`var(--purple)`, #ff00ff, 1,35) — die zweite also SCHLECHTER als jeder
       volldeckende Goldrahmen derselben Stufe. Dazu `dice.css
       {.floating-dice-trigger}`, dessen halbdurchsichtiger Weissrahmen ueber
       dem roten Verlauf auf 2,37 kommt. Seit Runde 2 gibt es kein
       Auffangbecken mehr: fuenf Klassen, jede gezaehlt, 28 Regeln mit
       `border`, davon 27 mit sichtbarem Rahmen neben einem Umriss, und der
       Abstand JEDER dieser 27 wird gerechnet. Die 13 `var(--border)`-Regeln
       sind damit auch aufgeschluesselt: nur EINE liegt auf Stufe 1 und damit
       bei 2,10, die anderen zwoelf bei 3,21 und 4,64.

   WAS SIE NICHT TUT. Sie schreibt keiner Gluehlage eine Deckung vor, die von
   ihrer heutigen abweicht — sie besteht darauf, dass jede Abweichung in der
   Aktenlage unter W3-F-01 namentlich auf der Sichtprobenliste steht. Ein Auge
   entscheidet, ob eine Marke noch "zeig mir, wo" leistet; eine Ratsche
   entscheidet nur, ob die Frage ueberhaupt gestellt wurde.
   =========================================================================== */
describe('R-20 — Gluehlagen und Rahmennachbarn, beziffert gefuehrt (Ratsche)', () => {
    const AKTENLAGE_PFAD = path.join(REPO, '.planning', 'HANDOFF-V3-OFFENE-PUNKTE.md');
    const AKTENLAGE = fs.readFileSync(AKTENLAGE_PFAD, 'utf8');

    /** Der Abschnitt W3-F-01 der Aktenlage, ohne seine Nachbarn. Leer, solange
     *  er nicht existiert — dann gehen die zwei Fuehrungstests rot, und genau
     *  das ist ihr Zweck. */
    function aktenlageAbschnitt(marke) {
        const i = AKTENLAGE.indexOf(`## ${marke}`);
        if (i < 0) return '';
        const j = AKTENLAGE.indexOf('\n## ', i + 1);
        return AKTENLAGE.slice(i, j < 0 ? AKTENLAGE.length : j);
    }
    const W3F01 = aktenlageAbschnitt('W3-F-01');

    /* -------------------------------------------------------------------
       ZERLEGUNG. Bewusst NICHT die von R-19 wiederverwendet: die steht im
       Rumpf ihres describe und waere nur durch ein Herausziehen erreichbar,
       das ihren eingefrorenen Block anfasst. Diese hier baut auf dem
       modulweiten regelnMitRumpf() auf, urteilt also ueber dieselben Datei-
       inhalte, und ihre Zahlen werden gegen R-19s Zahlen gehalten (Test
       "dieselbe Menge wie R-19"): 71 Deklarationen, 14 Gluehlagen.
       ------------------------------------------------------------------- */

    /** Lagen am Komma der OBERSTEN Klammerebene. */
    function lagen20(wert) {
        const out = [];
        let tiefe = 0;
        let cur = '';
        for (const ch of wert) {
            if (ch === '(') tiefe++;
            else if (ch === ')') tiefe--;
            if (ch === ',' && tiefe === 0) {
                if (cur.trim()) out.push(cur.trim());
                cur = '';
            } else cur += ch;
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
    }

    /** Die fuehrenden Laengen einer Lage. Abbruch beim ersten Wort, das keine
     *  Laenge ist — danach kommt die Farbe. */
    function laengen20(lage) {
        const nums = [];
        for (const tok of lage
            .replace(/\binset\b/g, ' ')
            .trim()
            .split(/\s+/)) {
            if (/^-?\d*\.?\d+px$/.test(tok)) nums.push(parseFloat(tok));
            else if (tok === '0') nums.push(0);
            else break;
        }
        return nums;
    }

    /** Gluehlage: X=0, Y=0, Weichzeichnung > 0, kein inset. Zeichengleich mit
     *  bauart() === 'gluehe' in R-19. */
    function istGluehe(lage) {
        if (/\binset\b/.test(lage)) return false;
        const [x = null, y = null, b = 0] = laengen20(lage);
        return x === 0 && y === 0 && b > 0;
    }

    /** Die Deckung einer Lage, oder null wenn sie keine Farbe mit Deckung
     *  traegt. `var(--glow-*)` gibt bewusst null zuruck und nicht 1: eine
     *  umgestellte Stelle traegt ihre Deckung im Token und nicht mehr hier. */
    function deckungVon(lage) {
        if (/var\(--glow-/.test(lage)) return null;
        let m = lage.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
        if (m) return parseFloat(m[1]);
        m = lage.match(/color-mix\(\s*in srgb\s*,[^,]*?([\d.]+)%\s*,\s*transparent\s*\)/);
        if (m) return parseFloat(m[1]) / 100;
        if (/var\(--|#[0-9a-f]{3,8}\b|\brgb\(/i.test(lage)) return 1.0;
        return null;
    }

    /** Die TRAEGERFARBE einer Lage als Hex, solange sie als Literal dasteht
     *  — null, sobald sie in einem Token steckt. Gegenstueck zu deckungVon()
     *  fuer die andere Haelfte der Frage "was aendert sich sichtbar": eine
     *  Stelle kann ihre Deckung behalten und trotzdem den Ton wechseln. */
    function literalFarbeVon(lage) {
        const m = lage.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return '#' + [1, 2, 3].map(i => Number(m[i]).toString(16).padStart(2, '0')).join('');
        const h = lage.match(/#[0-9a-f]{6}\b/i);
        return h ? h[0].toLowerCase() : null;
    }

    /** Alle box-shadow-Deklarationen mit Datei, Selektor, Zeile und Rumpf. */
    function schattenRegeln() {
        const out = [];
        cssFiles.forEach(f =>
            regelnMitRumpf(f.content).forEach(r => {
                const re = /(?:^|[;{\s])((?:-webkit-)?box-shadow)\s*:\s*([^;}]+)/g;
                let m;
                while ((m = re.exec(r.rumpf))) {
                    out.push({
                        datei: f.name,
                        sel: r.sel,
                        rumpf: r.rumpf,
                        prop: m[1],
                        wert: m[2].trim().replace(/\s+/g, ' '),
                        zeile: r.zeile + (r.rumpf.slice(0, m.index).match(/\n/g) || []).length
                    });
                }
            })
        );
        return out;
    }
    const SCHATTEN = schattenRegeln();

    /** Jede Gluehlage mit ihrer Deklaration im Ruecken. */
    function gluehlagen() {
        const out = [];
        SCHATTEN.forEach(d => {
            if (/^none\b/.test(d.wert)) return;
            lagen20(d.wert).forEach(l => {
                if (istGluehe(l)) out.push({ ...d, lage: l, radius: laengen20(l)[2], deckung: deckungVon(l) });
            });
        });
        return out;
    }

    /* -------------------------------------------------------------------
       DIE VIERZEHN GLUEHLAGEN, gemessen am 2026-09-30 an HEAD 947cdb1.

       `vorher` ist der Messwert im Bestand und wird NICHT dauerhaft gegen das
       CSS gehalten — nach der Umstellung in Schritt 6/7 traegt keine dieser
       Stellen mehr ein Literal, genau wie `vorher` in R-19s ORT_ZU_STUFE. Was
       dauerhaft geprueft wird: solange eine Stelle noch ein Literal traegt,
       ist es dieses; der RADIUS bleibt in jedem Fall dieser; und die Deckung
       des Tokens ist einer dieser Werte.

       `rolle` ist das Basis-Token, dessen Leuchte die Stelle tragen wird —
       gegen den Dark-Block nachgerechnet, nicht geschaetzt. Zwei Stellen
       tragen bewusst eine FREMDE Rolle (dice.css: #dc2626 ist das Rot des
       Light-Blocks, nicht --red des Dark-Blocks); sie stehen mit `fremd: true`
       und sind Punkt 5 der Sichtprobenliste.

       `farbe` ist die HEUTE getragene Literalfarbe — vier Stellen haben
       keine, weil sie schon ein Token tragen. Sie steht hier, weil die
       Deckung allein nicht zeigt, welche Stelle sich sichtbar aendert: der
       Aktenlage-Filter sah nur die Deckung und liess damit die zwei
       Farbfeld-Marken (editors.css:138, spells.css:515) durchfallen, deren
       Literal ZUFAELLIG die Dark-Ziffer von --yellow ist
       (rgba(251,191,36,.5) == #fbbf24). Ihre Deckung aendert sich nicht
       (0,50 -> 0,50), ihr TON aber in Light, Sepia und Contrast. `fremd`
       konnte das nicht fangen: das Merkmal feuert nur, wenn das Literal
       ungleich dem Dark-Token ist, und hier ist es gleich — die
       Theme-Abhaengigkeit entsteht erst durch die Tokenisierung.
       ------------------------------------------------------------------- */
    const GLUEH_STELLEN = [
        { datei: 'dashboard.css', zeile: 34, sel: '.dice-result.crit-effect', radius: 30, vorher: 0.5, rolle: '--green' },
        { datei: 'dashboard.css', zeile: 40, sel: '.dice-result.fail-effect', radius: 30, vorher: 0.5, rolle: '--red' },
        { datei: 'dice.css', zeile: 573, sel: '.floating-dice-trigger:hover', radius: 20, vorher: 0.3, rolle: '--red', farbe: '#dc2626', fremd: true },
        { datei: 'dice.css', zeile: 788, sel: '.fdp-die.d20:hover', radius: 12, vorher: 0.3, rolle: '--red', farbe: '#dc2626', fremd: true },
        { datei: 'dmscreen.css', zeile: 983, sel: '.btn:hover', radius: 12, vorher: 0.25, rolle: '--gold', farbe: '#d4af37' },
        { datei: 'dmscreen.css', zeile: 989, sel: '.btn-success:hover', radius: 12, vorher: 0.25, rolle: '--green', farbe: '#4ade80' },
        { datei: 'dmscreen.css', zeile: 1000, sel: '.btn-danger:hover', radius: 12, vorher: 0.25, rolle: '--red', farbe: '#ef4444' },
        { datei: 'editors.css', zeile: 138, sel: '.editor-toolbar .color-swatch.active', radius: 6, vorher: 0.5, rolle: '--yellow', farbe: '#fbbf24' },
        { datei: 'encounters.css', zeile: 441, sel: '.calc-threshold-marker', radius: 8, vorher: 1.0, rolle: '--gold' },
        { datei: 'file-backup.css', zeile: 40, sel: '.backup-dot-active', radius: 4, vorher: 0.4, rolle: '--green', farbe: '#4ade80' },
        { datei: 'file-backup.css', zeile: 45, sel: '.backup-dot-paused', radius: 4, vorher: 0.4, rolle: '--yellow', farbe: '#fbbf24' },
        { datei: 'spells.css', zeile: 446, sel: '.floating-toolbar', radius: 10, vorher: 0.2, rolle: '--yellow', farbe: '#fbbf24' },
        { datei: 'spells.css', zeile: 515, sel: '.color-swatch.active', radius: 6, vorher: 0.5, rolle: '--yellow', farbe: '#fbbf24' },
        { datei: 'tools.css', zeile: 1026, sel: '.char-form-progress-dot.current', radius: 8, vorher: 1.0, rolle: '--gold' }
    ];
    const gluehSchluessel = e => `${e.datei} {${e.sel}}`;

    /** Die Themes, in denen die Tokenisierung den TON einer Gluehlage
     *  aendert: dort, wo das heute getragene Literal ungleich dem Wert ist,
     *  den `rolle` im Theme-Block hat. GERECHNET aus den vier Paletten, nicht
     *  abgeschrieben — eine verschobene Ziffer in variables.css faellt damit
     *  auf, statt hier als Zusicherung zu ueberleben. */
    function tonwechselThemes(e) {
        if (!e.farbe) return [];
        const p = WCAG.palettes();
        return WCAG.THEMES.filter(t => (p[t][e.rolle] || '').toLowerCase() !== e.farbe.toLowerCase());
    }

    /* -------------------------------------------------------------------
       DIE NEUN SCHATTENREGELN MIT GOLDRAHMEN, gemessen am 2026-09-30.
       `stufe` ist die Stufe, die R-19s ORT_ZU_STUFE derselben Stelle gibt;
       `grau` der Contrast-Umriss dieser Stufe; `abstand` das GEMESSENE
       Kontrastverhaeltnis zwischen Umriss und Rahmenfarbe ueber der
       Traegerflaeche. Unter 3 liest die Bande als ein breiterer Rahmen.
       ------------------------------------------------------------------- */
    const RAHMEN_GOLD = [
        { datei: 'core.css', sel: '.spell-tooltip', art: 'voll', stufe: 3, grau: '#cccccc', abstand: 1.14 },
        { datei: 'editors.css', sel: '.editor-toolbar .tb-menu', art: 'voll', stufe: 3, grau: '#cccccc', abstand: 1.14 },
        { datei: 'encounters.css', sel: '#calculator-modal .modal-content', art: 'voll', stufe: 3, grau: '#cccccc', abstand: 1.14 },
        { datei: 'party.css', sel: '.cf-languages-block .cf-lang-dropdown', art: 'voll', stufe: 2, grau: '#aaaaaa', abstand: 1.66 },
        { datei: 'spells.css', sel: '.floating-toolbar', art: 'voll', stufe: 2, grau: '#aaaaaa', abstand: 1.66 },
        { datei: 'tools.css', sel: '.wiki-link-suggester', art: 'voll', stufe: 2, grau: '#aaaaaa', abstand: 1.66 },
        { datei: 'command-palette.css', sel: '.cp-box', art: 'mix', anteil: 30, flaeche: '--bg-card', stufe: 3, grau: '#cccccc', abstand: 5.33 },
        { datei: 'dice.css', sel: '.floating-dice-panel', art: 'mix', anteil: 30, flaeche: '--bg-card', stufe: 3, grau: '#cccccc', abstand: 5.33 },
        { datei: 'dmscreen.css', sel: '.modal', art: 'mix', anteil: 20, flaeche: '--bg-card', stufe: 3, grau: '#cccccc', abstand: 7.2 }
    ];

    /* -------------------------------------------------------------------
       DIE FUENF SCHATTENREGELN MIT EINEM ANDEREN FARBIGEN RAHMEN, gemessen
       am 2026-09-30. Sie fielen bis hierher in eine Klasse `sonst`, die KEIN
       Test angesehen hat — die Summe 22 war damit eine Messung von drei
       Klassen und keine Aussage ueber Geschlossenheit. Zwei der fuenf sind
       schlimmer als jeder Goldrahmen derselben Stufe (1,35 und 1,85 gegen
       1,66), eine dritte liegt knapp darunter, zwei sind unauffaellig.

       `ueber` steht nur, wo der Rahmen HALBDURCHSICHTIG ist und seine Farbe
       darum von der Traegerflaeche abhaengt: dice.css traegt 20 % Weiss auf
       einem Verlauf aus --red-dim (70 % Rot auf Schwarz) und --red-dark
       (55 %). Beide Enden werden gerechnet, `abstand` ist das SCHLECHTERE.
       ------------------------------------------------------------------- */
    const RAHMEN_FARBIG = [
        { datei: 'spells.css', sel: '.link-context-toolbar', token: '--purple', stufe: 2, grau: '#aaaaaa', abstand: 1.35 },
        { datei: 'spells.css', sel: '.table-context-toolbar', token: '--cyan', stufe: 2, grau: '#aaaaaa', abstand: 1.85 },
        { datei: 'dice.css', sel: '.floating-dice-trigger', token: '--overlay-strong', stufe: 2, grau: '#aaaaaa', abstand: 2.37,
          ueber: ['color-mix(in srgb, var(--red) 70%, #000)', 'color-mix(in srgb, var(--red) 55%, #000)'] },
        { datei: 'encounters.css', sel: '#calc-budget-slider::-webkit-slider-thumb', token: '--bg-dark', stufe: 1, grau: '#888888', abstand: 5.92 },
        { datei: 'encounters.css', sel: '#calc-budget-slider::-moz-range-thumb', token: '--bg-dark', stufe: 1, grau: '#888888', abstand: 5.92 }
    ];

    /* -------------------------------------------------------------------
       DIE VIERZEHN SCHATTENREGELN, DIE IHREN RAHMEN NUR UMFAERBEN, gemessen
       am 2026-09-30 (Pruefung W3-B, Runde 1). Sie setzen `border-color` und
       keine Kurzschreibweise; Breite und Stil kommen aus einer Basisregel.
       `rahmenArt()` sah sie bis hierher NICHT, und damit fehlte der
       SCHLECHTESTE Doppellinienfall der ganzen Welle in der Kandidatenliste:
       dmscreen.css faerbt beim Schweben ueber fuenf Kartenarten auf
       `--gold-dim` (#ccac00 in Contrast) um und bekommt daneben den 2-px-
       Umriss #aaa — Abstand **1,05**, schlechter als die 1,14 der drei
       gefuehrten Stufe-3-Goldrahmen, und an den zahlreichsten Karten der App.

       `stufe` ist null, wo die Deklaration nur eine Gluehe oder einen Ring
       traegt: dann entsteht in Contrast kein Umriss, und die Frage nach der
       Doppellinie stellt sich nicht. Nur die fuenf mit Stufe tragen darum
       `basis`, `grau` und `abstand` — jede Angabe dort ist geprueft, keine
       ist Beiwerk.

       `basis` ist der Selektor, der Breite UND Stil malt. Er steht hier von
       Hand und wird im Test gegen das CSS gehalten, statt aus dem
       Zustandsselektor abgeleitet zu werden: die Ableitung ist an drei der
       vierzehn Stellen nicht moeglich (`.dice-result`, `.location-card` und
       `.encounter-card` haben im ganzen Stilbaum keine Rahmenregel, und
       `[data-sortable]` bekommt seinen Rahmen von der Klasse des Elements,
       das das Attribut traegt — `.char-card` bzw. `.quest-item`). Eine
       Ableitung, die das raten muesste, waere eine Fehlerquelle und keine
       Messung.
       ------------------------------------------------------------------- */
    const RAHMEN_NURFARBE = [
        // Die fuenf mit Hoehenlage und damit mit Umriss in Contrast.
        {
            datei: 'dmscreen.css',
            sel: '.char-card:hover, .npc-card:hover, .location-card:hover, .encounter-card:hover, .spell-card:hover',
            token: '--gold-dim',
            stufe: 2,
            grau: '#aaaaaa',
            abstand: 1.05,
            basis: '.char-card'
        },
        {
            datei: 'dashboard.css',
            sel: '.dash-char:hover',
            token: '--gold',
            stufe: 2,
            grau: '#aaaaaa',
            abstand: 1.66,
            basis: '.dash-char'
        },
        {
            datei: 'dmscreen.css',
            sel: '[data-sortable].drag-over',
            token: '--gold',
            stufe: 2,
            grau: '#aaaaaa',
            abstand: 1.66,
            basis: '.char-card'
        },
        {
            datei: 'loot.css',
            sel: '.shop-cat-badge.active',
            token: '--gold',
            stufe: 1,
            grau: '#888888',
            abstand: 2.53,
            basis: '.shop-cat-badge'
        },
        {
            datei: 'loot.css',
            sel: '.shop-sort-btn.active',
            token: '--gold',
            stufe: 1,
            grau: '#888888',
            abstand: 2.53,
            basis: '.shop-sort-btn'
        },
        // Und die neun ohne Hoehenlage: reine Gluehe oder reiner Ring.
        { datei: 'dashboard.css', sel: '.dice-result.crit-effect', token: '--green', stufe: null },
        { datei: 'dashboard.css', sel: '.dice-result.fail-effect', token: '--red', stufe: null },
        { datei: 'dice.css', sel: '.fdp-die.d20:hover', token: '--red', stufe: null },
        { datei: 'dmscreen.css', sel: '.btn-success:hover', token: '--green-dim', stufe: null },
        {
            datei: 'dmscreen.css',
            sel: '.form-group input:focus, .form-group select:focus, .form-group textarea:focus',
            token: '--gold',
            stufe: null
        },
        {
            datei: 'editors.css',
            sel: '.editor-toolbar .color-swatch.active',
            token: '--gold',
            stufe: null
        },
        {
            datei: 'party.css',
            sel: '.cf-panel .cf-field input:focus, .cf-panel .cf-field select:focus',
            token: '--gold',
            stufe: null
        },
        { datei: 'spells.css', sel: '.color-swatch.active', token: '--gold', stufe: null },
        { datei: 'welt.css', sel: '.wp-rich-editor:focus', token: '--gold', stufe: null }
    ];

    /** Der Umriss, den der Contrast-Block einer Stufe gibt. Zeichengleich mit
     *  --shadow-1/-2/-3 dort; W3-D-01 trennt die Stufen ueber die DICKE. */
    const UMRISS_GRAU = { 1: '#888888', 2: '#aaaaaa', 3: '#cccccc' };

    /** Malt irgendeine Regel im Stilbaum fuer diesen Selektor einen Rahmen
     *  RUNDUM — also eine Kurzschreibweise mit einem Stil ungleich `none`?
     *  Gegenprobe zu `basis` in RAHMEN_NURFARBE: eine Zustandsregel, die nur
     *  `border-color` setzt, malt nur dann eine Linie, wenn Breite und Stil
     *  von woanders kommen. */
    function malbarerBasisRahmen(sel) {
        for (const f of cssFiles) {
            for (const r of regelnMitRumpf(f.content)) {
                if (
                    !r.sel
                        .split(',')
                        .map(s => s.trim())
                        .includes(sel)
                ) {
                    continue;
                }
                const m = r.rumpf.match(/(?:^|[;{\s])border\s*:\s*([^;}]+)/);
                if (!m) continue;
                const v = m[1].trim().replace(/\s+/g, ' ');
                if (/^none\b/.test(v) || /\bnone\b/.test(v) || /(^|\s)0(px)?(\s|$)/.test(v))
                    continue;
                return `${f.name}:${r.zeile} ${v}`;
            }
        }
        return null;
    }

    /** Die ERSTE Deklaration eines Tokens in variables.css. Erste, nicht
     *  letzte: die themeunabhaengigen Bauart-Tokens stehen einmal richtig
     *  (Zeile ~1220/1280) und ein zweites Mal im @supports-Rueckfall, der
     *  nach DEVELOPMENT.md nirgends feuert. Letzte-gewinnt lieferte dort
     *  `var(--red)` und damit einen falschen Traeger. */
    function tokenDeklaration(token) {
        const css = fs.readFileSync(WCAG.VARIABLES_CSS, 'utf8');
        const m = css.match(new RegExp(`${token}\\s*:\\s*([^;]+);`));
        return m ? m[1].trim() : null;
    }

    /** Rahmenart einer Schattenregel, oder null wenn sie keinen Rahmen
     *  traegt. ZWEI Schreibweisen, und nur zwei:
     *
     *  (1) die KURZSCHREIBWEISE `border: <breite> <stil> <farbe>` — sie
     *      bringt Breite, Stil und Farbe in einer Deklaration mit;
     *  (2) `border-color` ALLEIN — die Zustandsregel faerbt nur um, Breite
     *      und Stil kommen aus der Basisregel. Klasse `nurFarbe`, dazu-
     *      gekommen am 2026-09-30 (Pruefung W3-B, Runde 1). Sie fehlte, und
     *      damit fehlte der schlechteste Doppellinienfall der Welle
     *      (dmscreen.css, das Schweben der fuenf Kartenarten, 1,05) in der
     *      Kandidatenliste; vier weitere lagen daneben.
     *
     *  `border-left` und `border-<seite>-color` zaehlen weiter NICHT. Das ist
     *  keine Nachlaessigkeit, sondern dieselbe Entscheidung wie vorher: ein
     *  Seitenstreifen ist keine Doppellinie rundherum. Sonst waeren die sechs
     *  `.read-aloud`-Varianten (party.css, `border-left-color` auf einem
     *  4-px-Streifen links) als Rahmennachbarn gezaehlt worden, obwohl der
     *  Umriss an drei Seiten allein steht. Die Seitenstreifen sind in der
     *  Aktenlage in Teil A Eintrag 5 gefuehrt, nicht in Teil B. Der
     *  Praefixschutz ist derselbe wie in deklaration().
     *
     *  SECHS Klassen, kein Auffangbecken: die frueher hier stehende Klasse
     *  `sonst` wurde von keinem Test gelesen, und genau dort lagen die zwei
     *  spells.css-Leisten mit cyan- und purpurfarbenem Rahmen. `ohne` ist
     *  ausdruecklich benannt, damit `border: none` nicht als Rahmen zaehlt. */
    function rahmenArt(rumpf) {
        const m = rumpf.match(/(?:^|[;{\s])border\s*:\s*([^;}]+)/);
        if (!m) {
            const f = rumpf.match(/(?:^|[;{\s])border-color\s*:\s*([^;}]+)/);
            if (!f) return null;
            return { klasse: 'nurFarbe', wert: f[1].trim().replace(/\s+/g, ' ') };
        }
        const v = m[1].trim().replace(/\s+/g, ' ');
        if (/^none\b/.test(v)) return { klasse: 'ohne', wert: v };
        if (/var\(--border\)/.test(v)) return { klasse: 'border', wert: v };
        if (/solid\s+var\(--gold\)/.test(v)) return { klasse: 'goldVoll', wert: v };
        if (/color-mix/.test(v) && /var\(--gold\)/.test(v)) return { klasse: 'goldMix', wert: v };
        return { klasse: 'farbig', wert: v };
    }

    /** Die Stufe einer Schattendeklaration, ABGELEITET aus dem Radius ihrer
     *  ersten Hoehenlage: naechster Wert zu 6 / 16 / 32, Gleichstand (24 px)
     *  nach OBEN. Das ist wortgleich die Regel, nach der R-19s ORT_ZU_STUFE
     *  gebildet wurde; der Test "die abgeleitete Stufe stimmt mit RAHMEN_GOLD
     *  ueberein" haelt beide gegeneinander, statt 18 Stufenwerte von Hand
     *  hierher zu kopieren. Null, wenn die Deklaration keine Hoehenlage
     *  traegt (`none`, reine Gluehe, reiner Ring).
     *
     *  DIE ZWEITE SCHREIBWEISE (Welle 3, Schritte 3 und 4). Traegt eine Lage
     *  ihr Token, steht die Geometrie IM Token. Dann wird das Token ueber
     *  seine ERSTE Deklaration in variables.css aufgeloest — der :root-Block,
     *  wo die Leiter 0 2px 6px / 0 4px 16px / 0 8px 32px steht — und die
     *  Ableitung laeuft danach unveraendert weiter. Sie liest die Stufe also
     *  NICHT aus dem Tokennamen ab: verschiebt jemand die Leiter in
     *  variables.css, wandert die abgeleitete Stufe mit, und der Vergleich
     *  gegen die eingefrorenen Stufen von RAHMEN_GOLD schlaegt an. Erste und
     *  nicht letzte Deklaration aus demselben Grund wie bei
     *  tokenDeklaration(): in Contrast ist --shadow-N ein versatzloser Ring
     *  ohne Radius, aus dem sich keine Hoehe ableiten laesst. */
    function stufeAusRadius(wert) {
        for (const l of lagen20(wert)) {
            if (/\binset\b/.test(l)) continue;
            const tok = l.match(/^var\(\s*(--shadow-[\w-]+)\s*\)$/);
            if (tok) {
                const aufgeloest = tokenDeklaration(tok[1]);
                if (!aufgeloest) continue;
                const s = stufeAusRadius(aufgeloest);
                if (s !== null) return s;
                continue;
            }
            const [x = 0, y = 0, b = 0] = laengen20(l);
            if (b <= 0 || (x === 0 && y === 0)) continue;
            const ziele = { 1: 6, 2: 16, 3: 32 };
            let best = null;
            for (const s of [1, 2, 3]) {
                const d = Math.abs(b - ziele[s]);
                if (best === null || d <= best.d) best = { s, d };
            }
            return best.s;
        }
        return null;
    }

    /** Eine Regel je Datei+Selektor, auch wenn sie zwei box-shadow traegt. */
    function rahmenNachbarn() {
        const out = new Map();
        SCHATTEN.forEach(d => {
            const k = `${d.datei} {${d.sel}}`;
            if (out.has(k)) return;
            const a = rahmenArt(d.rumpf);
            if (a) out.set(k, { datei: d.datei, sel: d.sel, stufe: stufeAusRadius(d.wert), ...a });
        });
        return [...out.values()];
    }

    /** Die Rahmenfarbe eines Nachbarn im Contrast-Theme, aufgeloest ueber
     *  seiner Traegerflaeche — oder null, wenn die Regel keinen sichtbaren
     *  Rahmen traegt. Fuer die halbdurchsichtigen Faelle wird der
     *  SCHLECHTESTE der gefuehrten Traeger genommen. */
    function rahmenFarbeContrast(n) {
        const c = WCAG.palettes().contrast;
        if (n.klasse === 'ohne') return null;
        if (n.klasse === 'border') return c['--border'];
        if (n.klasse === 'goldVoll') return c['--gold'];
        // Die Umfaerber tragen ihr Token in der Deklaration; aufgeloest wird
        // aus dem CSS-Wert und nicht aus der Tabelle, damit ein verschobenes
        // Token hier auffaellt.
        if (n.klasse === 'nurFarbe') return WCAG.resolve(n.wert, c);
        if (n.klasse === 'goldMix') {
            const e = RAHMEN_GOLD.find(x => x.datei === n.datei && x.sel === n.sel);
            if (!e) return null;
            return WCAG.resolveOver(
                `color-mix(in srgb, var(--gold) ${e.anteil}%, transparent)`,
                c,
                c[e.flaeche]
            );
        }
        const e = RAHMEN_FARBIG.find(x => x.datei === n.datei && x.sel === n.sel);
        if (!e) return null;
        if (!e.ueber) return WCAG.resolve(`var(${e.token})`, c);
        // Halbdurchsichtig: die Deklaration des Tokens ueber jedem Traeger.
        const kandidaten = e.ueber
            .map(ausdruck =>
                WCAG.resolveOver(tokenDeklaration(e.token), c, WCAG.resolveOver(ausdruck, c, null))
            )
            .filter(Boolean);
        if (!kandidaten.length) return null;
        // Der Traeger, der dem Umriss am naechsten kommt, ist der Pruefstein.
        return kandidaten.reduce((a, b) => (WCAG.ratio(e.grau, a) <= WCAG.ratio(e.grau, b) ? a : b));
    }

    /* ===================================================================
       (a) DIE VIERZEHN GLUEHLAGEN
       =================================================================== */

    test('die Menge der Gluehlagen ist die gemessene: 14, und jede steht in GLUEH_STELLEN', () => {
        const ist = gluehlagen().map(gluehSchluessel).sort();
        const soll = GLUEH_STELLEN.map(gluehSchluessel).sort();
        expect(ist).toEqual(soll);
        expect(GLUEH_STELLEN.length).toBe(14);
        expect(new Set(soll).size).toBe(14);
    });

    test('dieselbe Menge wie R-19: 71 box-shadow-Deklarationen, 14 Gluehlagen', () => {
        expect({ dekl: SCHATTEN.length, gluehe: gluehlagen().length }).toEqual({ dekl: 71, gluehe: 14 });
    });

    test('die vierzehn Radien bleiben unberuehrt (W3-D-03): 4/4/6/6/8/8/10/12/12/12/12/20/30/30', () => {
        const nach = new Map(gluehlagen().map(l => [gluehSchluessel(l), l.radius]));
        const abweichung = GLUEH_STELLEN.filter(e => nach.get(gluehSchluessel(e)) !== e.radius).map(
            e => `${gluehSchluessel(e)} — Tabelle ${e.radius}px, gefunden ${nach.get(gluehSchluessel(e))}px`
        );
        expect(abweichung.sort()).toEqual([]);
        expect(
            GLUEH_STELLEN.map(e => e.radius)
                .sort((a, b) => a - b)
                .join('/')
        ).toBe('4/4/6/6/8/8/10/12/12/12/12/20/30/30');
    });

    /* -------------------------------------------------------------------
       DIE ROLLE IST DIE AUSSAGE, nicht "irgendein Leuchttoken" (Pruefung
       W3-C, Runde 1). `rolle` steht an jeder der vierzehn Stellen und wurde
       nur fuer die Kontrastarithmetik benutzt; KEINE Zusicherung hielt das
       getragene Token dagegen. Gemessen: `dashboard.css:34` von
       `var(--glow-green)` auf `var(--glow-red)` — der Kritischer-Treffer-Hof
       in der Farbe des Fehlschlags — liess die ganze Datei unveraendert bei
       2 roten (beide R-19), kein zusaetzlicher roter Test. Radius, Rueckfall
       aufs Literal und die Geschlossenheit der Menge waren einzeln per
       Mutation als dicht nachgewiesen; die FARBE war das Loch.

       Der Stil-Sollstand deckt es nicht ab: er traegt 6 von 3626 Digests,
       und keine dieser vierzehn Stellen erreicht ueberhaupt einen
       Digest-Schluessel. R-19/R-20 sind die einzige Deckung.

       Erwartet wird die VOLLE Lage und nicht nur der Tokenname: damit faengt
       dieselbe Zeile auch den Rueckfall auf ein Literal, den die zwei
       Literal-Zusicherungen unten per Bauart nicht sehen koennen (sie
       schweigen, sobald das Literal wieder das gemessene ist). */
    test('jede Gluehlage traegt das Token IHRER Rolle, nicht irgendein --glow-*', () => {
        const erwartet = e => `0 0 ${e.radius}px var(--glow${e.rolle.slice(1)})`;
        const nach = new Map(gluehlagen().map(l => [gluehSchluessel(l), l.lage]));
        const abweichung = GLUEH_STELLEN.filter(e => nach.get(gluehSchluessel(e)) !== erwartet(e)).map(
            e => `${gluehSchluessel(e)} — erwartet "${erwartet(e)}", gefunden "${nach.get(gluehSchluessel(e))}"`
        );
        expect(abweichung.sort()).toEqual([]);
        // Und die vier Rollen sind die vier angelegten Tokens, keine fuenfte.
        expect([...new Set(GLUEH_STELLEN.map(e => e.rolle))].sort()).toEqual([
            '--gold',
            '--green',
            '--red',
            '--yellow'
        ]);
    });

    test('solange eine Gluehlage ein Literal traegt, ist es das gemessene', () => {
        const nach = new Map(gluehlagen().map(l => [gluehSchluessel(l), l.deckung]));
        const abweichung = GLUEH_STELLEN.filter(e => {
            const d = nach.get(gluehSchluessel(e));
            return d !== null && d !== undefined && Math.abs(d - e.vorher) > 1e-9;
        }).map(e => `${gluehSchluessel(e)} — Tabelle ${e.vorher}, gefunden ${nach.get(gluehSchluessel(e))}`);
        expect(abweichung.sort()).toEqual([]);
    });

    test('solange eine Gluehlage ein Farbliteral traegt, ist es das gemessene', () => {
        const nach = new Map(gluehlagen().map(l => [gluehSchluessel(l), literalFarbeVon(l.lage)]));
        const abweichung = GLUEH_STELLEN.filter(e => {
            const f = nach.get(gluehSchluessel(e));
            return f !== null && f !== (e.farbe || null);
        }).map(e => `${gluehSchluessel(e)} — Tabelle ${e.farbe || '(Token)'}, gefunden ${nach.get(gluehSchluessel(e))}`);
        expect(abweichung.sort()).toEqual([]);
        // Vier Stellen tragen schon ein Token und haben darum kein Literal.
        expect(GLUEH_STELLEN.filter(e => !e.farbe).map(gluehSchluessel).sort()).toEqual([
            'dashboard.css {.dice-result.crit-effect}',
            'dashboard.css {.dice-result.fail-effect}',
            'encounters.css {.calc-threshold-marker}',
            'tools.css {.char-form-progress-dot.current}'
        ]);
    });

    /* -------------------------------------------------------------------
       `fremd` WIRD GEMESSEN, NICHT GESETZT. Das Merkmal sagt "das Literal
       ist nicht der Dark-Wert seiner Rolle". Als handgesetztes Flag hat es
       genau einen Fehler moeglich gemacht: es wurde als "hier wechselt der
       Ton" gelesen, obwohl es nur den Sonderfall "schon heute ein fremdes
       Rot" markiert. Die zwei Farbfeld-Marken sind NICHT fremd (ihr Literal
       ist die Dark-Ziffer von --yellow) und wechseln den Ton trotzdem.
       ------------------------------------------------------------------- */
    test('`fremd` ist genau dort gesetzt, wo das Literal nicht der Dark-Wert seiner Rolle ist', () => {
        const dark = WCAG.palette('dark');
        const abweichung = GLUEH_STELLEN.filter(e => e.farbe).filter(
            e => !!e.fremd !== ((dark[e.rolle] || '').toLowerCase() !== e.farbe.toLowerCase())
        ).map(e => `${gluehSchluessel(e)} — fremd=${!!e.fremd}, Literal ${e.farbe}, Dark ${dark[e.rolle]}`);
        expect(abweichung.sort()).toEqual([]);
        expect(GLUEH_STELLEN.filter(e => e.fremd).map(gluehSchluessel).sort()).toEqual([
            'dice.css {.fdp-die.d20:hover}',
            'dice.css {.floating-dice-trigger:hover}'
        ]);
    });

    /* -------------------------------------------------------------------
       DER TONWECHSEL, den die Deckungsrechnung nicht sieht. Jede der zehn
       Stellen mit Literal wird in DREI der vier Themes tonlich anders: die
       zwei dice-Stellen in Dark, Sepia und Contrast (ihr Literal ist das
       Light-Rot), die uebrigen acht in Light, Sepia und Contrast (ihr
       Literal ist der Dark-Wert). Zwei davon aendern ihre DECKUNG nicht und
       waren darum fuer den Aktenlage-Filter unsichtbar.
       ------------------------------------------------------------------- */
    test('zehn Gluehlagen wechseln den Ton, je in drei von vier Themes', () => {
        const mitWechsel = GLUEH_STELLEN.filter(e => tonwechselThemes(e).length > 0);
        expect(mitWechsel.length).toBe(10);
        expect([...new Set(mitWechsel.map(e => tonwechselThemes(e).length))]).toEqual([3]);
        expect(
            GLUEH_STELLEN.filter(e => e.fremd).map(e => tonwechselThemes(e).join('/'))
        ).toEqual(['dark/sepia/contrast', 'dark/sepia/contrast']);
        expect(
            [...new Set(GLUEH_STELLEN.filter(e => e.farbe && !e.fremd).map(e => tonwechselThemes(e).join('/')))]
        ).toEqual(['light/sepia/contrast']);
    });

    test('genau zwei Gluehlagen wechseln den Ton OHNE die Deckung zu aendern', () => {
        const gewaehlt = 0.5;
        const nurTon = GLUEH_STELLEN.filter(
            e => Math.abs(gewaehlt - e.vorher) < 1e-9 && tonwechselThemes(e).length > 0
        );
        expect(nurTon.map(gluehSchluessel).sort()).toEqual([
            'editors.css {.editor-toolbar .color-swatch.active}',
            'spells.css {.color-swatch.active}'
        ]);
        // Und der Ton, in den sie wechseln — das ist die Frage der Sichtprobe.
        const p = WCAG.palettes();
        expect(nurTon.map(e => WCAG.THEMES.map(t => p[t][e.rolle]).join(' '))).toEqual([
            '#fbbf24 #ca8a04 #b58900 #ffff00',
            '#fbbf24 #ca8a04 #b58900 #ffff00'
        ]);
    });

    test('die Verteilung der gemessenen Deckungen ist 0,20/0,25x3/0,30x2/0,40x2/0,50x4/1,00x2', () => {
        const verteilung = {};
        GLUEH_STELLEN.forEach(e => (verteilung[e.vorher] = (verteilung[e.vorher] || 0) + 1));
        expect(verteilung).toEqual({ 0.2: 1, 0.25: 3, 0.3: 2, 0.4: 2, 0.5: 4, 1: 2 });
    });

    /* -------------------------------------------------------------------
       DER KERN VON (a). Ein Token, das fuer 14 Stellen EINE Deckung setzt,
       darf nicht irgendeine sein. Geprueft wird nicht, ob ein Kommentar eine
       Zahl nennt — das laesst sich nachtraeglich hinschreiben —, sondern ob
       die gewaehlte Zahl im Bestand VORKOMMT und dort die haeufigste ist.
       Mit 55 % war beides falsch: 55 kommt nicht vor, haeufigster Wert ist
       0,50 (viermal). Dieselbe Rechnung wie bei der Hoehenleiter (W3-D-02)
       und bei --ring-gold (15 %, weil party.css genau das schon traegt).
       ------------------------------------------------------------------- */
    test('die Deckung der vier --glow-Tokens ist EINE, kommt im Bestand vor und ist dort die haeufigste', () => {
        const css = fs.readFileSync(path.join(REPO, 'assets', 'styles', 'variables.css'), 'utf8');
        const anteile = {};
        ['--glow-gold', '--glow-yellow', '--glow-green', '--glow-red'].forEach(t => {
            const m = css.match(
                new RegExp(`${t}\\s*:\\s*color-mix\\(\\s*in srgb\\s*,\\s*var\\(--[a-z]+\\)\\s*([\\d.]+)%\\s*,\\s*transparent\\s*\\)`)
            );
            anteile[t] = m ? parseFloat(m[1]) / 100 : null;
        });
        // EINE Deckung fuer alle vier — sonst leuchtet Gold anders als Rot.
        expect([...new Set(Object.values(anteile))]).toHaveLength(1);
        const gewaehlt = anteile['--glow-gold'];

        const haeufigkeit = {};
        GLUEH_STELLEN.forEach(e => (haeufigkeit[e.vorher] = (haeufigkeit[e.vorher] || 0) + 1));
        const spitze = Math.max(...Object.values(haeufigkeit));
        const haeufigste = Object.keys(haeufigkeit)
            .filter(k => haeufigkeit[k] === spitze)
            .map(Number);

        expect({ gewaehlt, vorkommen: haeufigkeit[gewaehlt] || 0, haeufigste }).toEqual({
            gewaehlt: 0.5,
            vorkommen: 4,
            haeufigste: [0.5]
        });
    });

    test('vier Gluehlagen bleiben bei der gewaehlten Deckung bildpunktgleich, keine wird staerker als 2,5-fach', () => {
        const gewaehlt = 0.5;
        const faktoren = GLUEH_STELLEN.map(e => ({ ort: gluehSchluessel(e), faktor: +(gewaehlt / e.vorher).toFixed(2) }));
        expect(faktoren.filter(f => f.faktor === 1).length).toBe(4);
        expect(Math.max(...faktoren.map(f => f.faktor))).toBeLessThanOrEqual(2.5);
        // Die zwei volldeckenden Goldmarken verlieren die Haelfte — das ist die
        // Stelle, an der die Sichtprobe widersprechen darf (W3-D-05 fuehrt
        // dieselbe Frage fuer die vier JS-Sprungmarken).
        expect(faktoren.filter(f => f.faktor === 0.5).map(f => f.ort).sort()).toEqual([
            'encounters.css {.calc-threshold-marker}',
            'tools.css {.char-form-progress-dot.current}'
        ]);
    });

    /* -------------------------------------------------------------------
       DER FILTER GEHT AUF "DECKUNG ODER TON", nicht mehr nur auf die
       Deckung. Mit der alten Fassung war die Differenz bei den zwei
       Farbfeld-Marken null, und sie fielen aus der Sichtprobenliste heraus,
       obwohl ihr aktiver Rahmen in Light aus Amber zu dunklem Ocker und in
       Contrast zu reinem Gelb wird. Sichtbar ist sichtbar, egal ob es die
       Deckung oder die Farbe ist, die sich bewegt.
       ------------------------------------------------------------------- */
    test('jede Gluehlage, deren Deckung ODER Ton sich aendert, steht in der Aktenlage unter W3-F-01', () => {
        expect(W3F01).not.toBe('');
        const gewaehlt = 0.5;
        const betroffen = GLUEH_STELLEN.filter(
            e => Math.abs(gewaehlt - e.vorher) > 1e-9 || tonwechselThemes(e).length > 0
        );
        expect(betroffen.length).toBe(12);
        const offen = betroffen
            .filter(e => !(W3F01.includes(e.datei) && W3F01.includes(e.sel)))
            .map(gluehSchluessel);
        expect(offen.sort()).toEqual([]);
    });

    /* ===================================================================
       (b) DIE RAHMENNACHBARN — 27, nicht 22 und nicht 13
       =================================================================== */

    /* -------------------------------------------------------------------
       DIE AUFTEILUNG IST RESTLOS. Die frueher hier stehende Fassung zaehlte
       drei Klassen (13 + 6 + 3 = 22) und nannte die Summe eine Kandidaten-
       ZAHL — aber eine vierte Klasse `sonst` fing sechs weitere Regeln auf,
       und KEIN Test hat sie angesehen. Darin lagen die zwei spells.css-
       Leisten mit cyan- und purpurfarbenem Rahmen, von denen eine (1,35)
       schlechter liegt als jeder Goldrahmen derselben Stufe (1,66). Jetzt
       faellt jede Regel mit `border` in genau eine von fuenf Klassen, jede
       Klasse hat eine Zahl, und die Summe ist eine Aussage.
       ------------------------------------------------------------------- */
    test('jede Schattenregel mit Rahmen faellt in eine der sechs Klassen: 13/6/3/5/14/1', () => {
        const nb = rahmenNachbarn();
        const zahl = k => nb.filter(n => n.klasse === k).length;
        expect({
            border: zahl('border'),
            goldVoll: zahl('goldVoll'),
            goldMix: zahl('goldMix'),
            farbig: zahl('farbig'),
            nurFarbe: zahl('nurFarbe'),
            ohne: zahl('ohne')
        }).toEqual({ border: 13, goldVoll: 6, goldMix: 3, farbig: 5, nurFarbe: 14, ohne: 1 });
        // Kein Auffangbecken: die sechs Klassen sind alle Klassen.
        expect(nb.length).toBe(42);
        expect(
            nb.filter(
                n =>
                    !['border', 'goldVoll', 'goldMix', 'farbig', 'nurFarbe', 'ohne'].includes(
                        n.klasse
                    )
            )
        ).toEqual([]);
        // 41 tragen einen SICHTBAREN Rahmen; die 42. ist
        // `border: none !important` neben `box-shadow: none !important`.
        expect(nb.filter(n => n.klasse !== 'ohne').length).toBe(41);
        expect(nb.filter(n => n.klasse === 'ohne').map(n => `${n.datei} {${n.sel}}`)).toEqual([
            'encounters.css {#calculator-modal}'
        ]);
        // Von den 41 bekommen die mit einer Hoehenlage einen Umriss und damit
        // eine Doppellinie: 27 aus der Kurzschreibweise plus 5 Umfaerber.
        expect(nb.filter(n => n.klasse === 'nurFarbe' && n.stufe).length).toBe(5);
    });

    test('die vierzehn Umfaerber sind die gemessenen und stehen in RAHMEN_NURFARBE', () => {
        const ist = rahmenNachbarn()
            .filter(n => n.klasse === 'nurFarbe')
            .map(n => `${n.datei} {${n.sel}}`)
            .sort();
        expect(ist).toEqual(RAHMEN_NURFARBE.map(e => `${e.datei} {${e.sel}}`).sort());
        expect(RAHMEN_NURFARBE.length).toBe(14);

        // Das gefuehrte Token steht wirklich in der Deklaration, und die
        // Stufe kommt aus der Ableitung, nicht aus der Tabelle.
        const nb = rahmenNachbarn();
        const abweichung = [];
        RAHMEN_NURFARBE.forEach(e => {
            const n = nb.find(x => x.datei === e.datei && x.sel === e.sel);
            if (!n) return; // von der Mengengleichheit oben schon gemeldet
            if (n.wert !== `var(${e.token})`)
                abweichung.push(`${e.datei} {${e.sel}} — Token ${e.token}, im CSS ${n.wert}`);
            if ((n.stufe || null) !== e.stufe)
                abweichung.push(`${e.datei} {${e.sel}} — Stufe ${e.stufe}, abgeleitet ${n.stufe}`);
        });
        expect(abweichung.sort()).toEqual([]);

        // Die fuenf mit Umriss fuehren eine Basisregel, die Breite und Stil
        // wirklich malt — sonst waere der `border-color` ohne Wirkung und die
        // Doppellinie eine Erfindung.
        const ohneBasis = RAHMEN_NURFARBE.filter(e => e.stufe).filter(
            e => !e.basis || !malbarerBasisRahmen(e.basis)
        );
        expect(ohneBasis.map(e => `${e.datei} {${e.sel}} — Basis ${e.basis}`)).toEqual([]);
        // Und die neun ohne Hoehenlage tragen bewusst keine dieser Angaben.
        expect(
            RAHMEN_NURFARBE.filter(e => !e.stufe).every(e => !e.basis && !e.grau && !e.abstand)
        ).toBe(true);
        expect(
            RAHMEN_NURFARBE.filter(e => e.stufe).every(e => UMRISS_GRAU[e.stufe] === e.grau)
        ).toBe(true);
    });

    test('der gemessene Abstand Umriss zu umgefaerbtem Rahmen im Contrast-Theme ist der gefuehrte', () => {
        const nb = rahmenNachbarn();
        const abweichung = [];
        RAHMEN_NURFARBE.filter(e => e.stufe).forEach(e => {
            const n = nb.find(x => x.datei === e.datei && x.sel === e.sel);
            const farbe = n ? rahmenFarbeContrast(n) : null;
            const ist = farbe ? +WCAG.ratio(e.grau, farbe).toFixed(2) : null;
            if (ist === null || Math.abs(ist - e.abstand) > 0.011) {
                abweichung.push(`${e.datei} {${e.sel}} — gefuehrt ${e.abstand}, gemessen ${ist}`);
            }
        });
        expect(abweichung.sort()).toEqual([]);
        // Alle fuenf liegen unter 3, und der schlechteste Wert der ganzen
        // Welle steht hier: --gold-dim (#ccac00) neben #aaa.
        expect(RAHMEN_NURFARBE.filter(e => e.stufe).every(e => e.abstand < 3)).toBe(true);
        expect(Math.min(...RAHMEN_NURFARBE.filter(e => e.stufe).map(e => e.abstand))).toBe(1.05);
        expect(
            Math.min(...RAHMEN_GOLD.map(e => e.abstand), ...RAHMEN_FARBIG.map(e => e.abstand))
        ).toBe(1.14);
    });

    /* -------------------------------------------------------------------
       DIE ABGELEITETE STUFE GEGEN DIE EINGEFRORENE TABELLE. stufeAusRadius()
       rechnet die Stufe aus dem Radius (naechster zu 6/16/32, Gleichstand
       nach oben) — dieselbe Regel, nach der R-19s ORT_ZU_STUFE gebildet
       wurde. Dieser Test haelt beide an den neun Goldrahmen gegeneinander:
       stimmen sie dort, ist die Ableitung auch fuer die 18 Stellen belastbar,
       fuer die hier keine Stufe von Hand steht. R-19s EINE benannte
       Abweichung (core.css .offline-indicator, Radius 10 -> Stufe 2) traegt
       keinen Rahmen und liegt darum nicht in dieser Menge.
       ------------------------------------------------------------------- */
    test('die abgeleitete Stufe stimmt an allen neun Goldrahmen mit der eingefrorenen ueberein', () => {
        const nb = rahmenNachbarn();
        const abweichung = RAHMEN_GOLD.map(e => {
            const n = nb.find(x => x.datei === e.datei && x.sel === e.sel);
            return n && n.stufe === e.stufe ? null : `${e.datei} {${e.sel}} — Tabelle ${e.stufe}, abgeleitet ${n ? n.stufe : '(nicht gefunden)'}`;
        }).filter(Boolean);
        expect(abweichung.sort()).toEqual([]);
        // Und der Umriss folgt allein aus der Stufe, nicht aus der Tabelle.
        expect(RAHMEN_GOLD.every(e => UMRISS_GRAU[e.stufe] === e.grau)).toBe(true);
        expect(RAHMEN_FARBIG.every(e => UMRISS_GRAU[e.stufe] === e.grau)).toBe(true);
    });

    test('die fuenf farbigen Rahmen sind die gemessenen und stehen in RAHMEN_FARBIG', () => {
        const ist = rahmenNachbarn()
            .filter(n => n.klasse === 'farbig')
            .map(n => `${n.datei} {${n.sel}}`)
            .sort();
        expect(ist).toEqual(RAHMEN_FARBIG.map(e => `${e.datei} {${e.sel}}`).sort());
        // Die Stufe kommt auch hier aus der Ableitung, nicht aus der Tabelle.
        const nb = rahmenNachbarn();
        const abweichung = RAHMEN_FARBIG.map(e => {
            const n = nb.find(x => x.datei === e.datei && x.sel === e.sel);
            return n && n.stufe === e.stufe ? null : `${e.datei} {${e.sel}} — Tabelle ${e.stufe}, abgeleitet ${n ? n.stufe : '?'}`;
        }).filter(Boolean);
        expect(abweichung.sort()).toEqual([]);
    });

    test('der gemessene Abstand Umriss zu farbigem Rahmen im Contrast-Theme ist der gefuehrte', () => {
        const nb = rahmenNachbarn();
        const abweichung = [];
        RAHMEN_FARBIG.forEach(e => {
            const n = nb.find(x => x.datei === e.datei && x.sel === e.sel);
            const farbe = n ? rahmenFarbeContrast(n) : null;
            const ist = farbe ? +WCAG.ratio(e.grau, farbe).toFixed(2) : null;
            if (ist === null || Math.abs(ist - e.abstand) > 0.011) {
                abweichung.push(`${e.datei} {${e.sel}} — gefuehrt ${e.abstand}, gemessen ${ist}`);
            }
        });
        expect(abweichung.sort()).toEqual([]);
        // Drei liegen unter 3 und sind damit das Problem, zwei nicht.
        expect(RAHMEN_FARBIG.filter(e => e.abstand < 3).map(e => `${e.datei} {${e.sel}}`).sort()).toEqual([
            'dice.css {.floating-dice-trigger}',
            'spells.css {.link-context-toolbar}',
            'spells.css {.table-context-toolbar}'
        ]);
    });

    test('die neun Goldrahmen sind die gemessenen und stehen in RAHMEN_GOLD', () => {
        const ist = rahmenNachbarn()
            .filter(n => n.klasse === 'goldVoll' || n.klasse === 'goldMix')
            .map(n => `${n.datei} {${n.sel}} ${n.klasse === 'goldVoll' ? 'voll' : 'mix'}`)
            .sort();
        const soll = RAHMEN_GOLD.map(e => `${e.datei} {${e.sel}} ${e.art}`).sort();
        expect(ist).toEqual(soll);
    });

    /* -------------------------------------------------------------------
       DIE ZAHLEN, auf denen die Sichtprobenliste beruht. Sie werden hier
       gerechnet und nicht abgeschrieben: aendert jemand die Grauleiter oder
       --gold im Contrast-Block, geht dieser Test rot und die Aktenlage muss
       nachgezogen werden, statt eine veraltete Zahl weiterzutragen.
       ------------------------------------------------------------------- */
    test('der gemessene Abstand Umriss zu Goldrahmen im Contrast-Theme ist der gefuehrte', () => {
        const c = WCAG.palettes().contrast;
        const abweichung = [];
        RAHMEN_GOLD.forEach(e => {
            const rahmen =
                e.art === 'voll'
                    ? c['--gold']
                    : WCAG.resolveOver(`color-mix(in srgb, var(--gold) ${e.anteil}%, transparent)`, c, c[e.flaeche]);
            const ist = +WCAG.ratio(e.grau, rahmen).toFixed(2);
            if (Math.abs(ist - e.abstand) > 0.011) {
                abweichung.push(`${e.datei} {${e.sel}} — gefuehrt ${e.abstand}, gemessen ${ist}`);
            }
        });
        expect(abweichung.sort()).toEqual([]);
        // Die sechs volldeckenden liegen unter 2 und sind damit das Problem;
        // die drei gemischten ueber 3 und damit nicht.
        expect(RAHMEN_GOLD.filter(e => e.art === 'voll').every(e => e.abstand < 2)).toBe(true);
        expect(RAHMEN_GOLD.filter(e => e.art === 'mix').every(e => e.abstand >= 3)).toBe(true);
    });

    /* -------------------------------------------------------------------
       DIE RATSCHE ueber ALLE 27, nicht mehr nur ueber die sechs Goldrahmen.
       Der Abstand jedes Nachbarn wird hier gerechnet — Rahmenfarbe im
       Contrast-Theme gegen den Umriss SEINER Stufe — und wer unter 3 liegt,
       muss namentlich in der Aktenlage stehen. Eine kuenftig eingefuegte
       Schattenregel mit farbigem Rahmen kann damit nicht mehr lautlos
       hinzukommen: sie faellt in eine gezaehlte Klasse, bekommt eine
       gerechnete Zahl, und wenn die Zahl klein ist, geht dieser Test rot.

       Die zehn, die heute unter 3 liegen: drei Goldrahmen mit 1,14, drei mit
       1,66, `--purple` mit 1,35, `--cyan` mit 1,85, der halbdurchsichtige
       Weissrahmen des Wuerfelknopfs mit 2,37 und die EINE der 13
       `var(--border)`-Regeln, die auf Stufe 1 liegt (2,10; die anderen zwoelf
       liegen bei 3,21 und 4,64 und sind damit unauffaellig).

       EHRLICH ZUR STAERKE DIESER PRUEFUNG: sie sucht Datei und Selektor als
       TEILSTRINGS im Abschnitt, nicht als Paar in einer Zeile. `dice.css
       {.floating-dice-trigger}` gilt darum schon durch den Nachbareintrag
       `.floating-dice-trigger:hover` aus Teil C als gefuehrt. Die Stelle steht
       trotzdem ausdruecklich in Teil B der Aktenlage — die Ratsche ist hier
       die schwaechere Aussage, nicht die Begruendung.
       ------------------------------------------------------------------- */
    test('jeder Rahmennachbar mit Abstand unter 3 steht namentlich in der Aktenlage unter W3-F-01', () => {
        expect(W3F01).not.toBe('');
        const knapp = rahmenNachbarn()
            .filter(n => n.klasse !== 'ohne' && n.stufe)
            .map(n => {
                const farbe = rahmenFarbeContrast(n);
                return { ...n, abstand: farbe ? +WCAG.ratio(UMRISS_GRAU[n.stufe], farbe).toFixed(2) : null };
            })
            .filter(n => n.abstand === null || n.abstand < 3);
        expect(knapp.map(n => `${n.datei} {${n.sel}} ${n.abstand}`).sort()).toEqual([
            'core.css {.spell-tooltip} 1.14',
            'dashboard.css {.dash-char:hover} 1.66',
            'dice.css {.floating-dice-trigger} 2.37',
            'dmscreen.css {.char-card:hover, .npc-card:hover, .location-card:hover, .encounter-card:hover, .spell-card:hover} 1.05',
            'dmscreen.css {[data-sortable].drag-over} 1.66',
            'dmscreen.css {[data-tooltip]::after} 2.1',
            'editors.css {.editor-toolbar .tb-menu} 1.14',
            'encounters.css {#calculator-modal .modal-content} 1.14',
            'loot.css {.shop-cat-badge.active} 2.53',
            'loot.css {.shop-sort-btn.active} 2.53',
            'party.css {.cf-languages-block .cf-lang-dropdown} 1.66',
            'spells.css {.floating-toolbar} 1.66',
            'spells.css {.link-context-toolbar} 1.35',
            'spells.css {.table-context-toolbar} 1.85',
            'tools.css {.wiki-link-suggester} 1.66'
        ]);
        const offen = knapp
            .filter(n => !(W3F01.includes(n.datei) && W3F01.includes(n.sel)))
            .map(n => `${n.datei} {${n.sel}}`);
        expect(offen.sort()).toEqual([]);
        // Die berichtigte Zahl selbst muss dort stehen, nicht die 13 des Plans,
        // nicht die 22 der drei gezaehlten Klassen und nicht die 27, solange
        // die Umfaerber dazugehoeren.
        expect(/\b41\b/.test(W3F01)).toBe(true);
    });

    /* ===================================================================
       (c) DIE ANIMATION SCHLAEGT DIE REGEL
       =================================================================== */

    /* -------------------------------------------------------------------
       WARUM DIESER BLOCK EXISTIERT (Pruefung W3-B, Runde 1, 2026-09-30).
       Eine Hoehenlage, die in der Kaskade von einer @keyframes-Animation
       ueberschrieben wird, aendert sich im Quelltext und auf keinem Schirm.
       Animationsdeklarationen stehen UEBER den normalen Autorendeklarationen
       — auch ueber einer `:hover`-Regel und unabhaengig von der Spezifitaet;
       nur `!important` schlaegt sie. `.floating-dice-trigger` (dice.css)
       traegt `animation: floatingPulse 3s ease-in-out infinite`, und
       `floatingPulse` setzt in ALLEN drei Bildern `box-shadow`, dessen erste
       Lage konstant `0 4px 16px rgba(220,38,38,0.4)` ist — genau der alte
       Literalwert. Die Stufe-2-Lage der Regel und die Stufe-3-Lage ihres
       `:hover` sind damit toter Code, solange die Animation laeuft; nur unter
       `prefers-reduced-motion: reduce` (core.css, Dauer 0,01 ms, ein
       Durchlauf, KEIN fill-mode) kommt das Token zum Vorschein.

       DAS IST KEIN CSS-BEFUND, SONDERN EINER AN DER AKTENLAGE. Die
       Sichtprobenliste fuehrte beide Zeilen als bezifferte SICHTBARE
       Aenderung (Teil A Eintrag 7, „die farbigen Hoehenlagen, die schwarz
       werden") und widersprach damit ihrem eigenen Eintrag 10, der den
       Mechanismus richtig beschreibt. Der `:hover`-Schatten war ausserdem
       schon vor Welle 3 toter Code und wurde als lebend nachgemessen. Diese
       Ratsche haelt zweierlei fest: eine ueberschriebene Lage steht in
       W3-F-01 in einer Zeile mit dem Wort `nicht gerendert`, und sie steht
       NICHT in der Aufzaehlung der sichtbaren Tonwechsel.

       SIE IST NICHT AUF dice.css GESCHNITTEN. Kommt kuenftig eine zweite
       `@keyframes` mit `box-shadow` dazu oder animiert jemand eine weitere
       Schattenregel, waechst die gemessene Menge, und beide Tests verlangen
       den Eintrag in der Aktenlage.
       ------------------------------------------------------------------- */

    /** Die Namen der @keyframes-Bloecke, die `box-shadow` setzen. Heute genau
     *  einer; `pulse`, `fadeIn`, `spin` und die 14 anderen setzen keinen. */
    function keyframesMitSchatten() {
        const out = new Set();
        cssFiles.forEach(f => {
            const re = /@keyframes\s+([\w-]+)\s*\{/g;
            let m;
            while ((m = re.exec(f.content))) {
                let tiefe = 1;
                let j = m.index + m[0].length;
                while (j < f.content.length && tiefe) {
                    if (f.content[j] === '{') tiefe++;
                    else if (f.content[j] === '}') tiefe--;
                    j++;
                }
                const rumpf = f.content.slice(m.index + m[0].length, j - 1);
                if (/(?:^|[;{\s])(?:-webkit-)?box-shadow\s*:/.test(rumpf)) out.add(m[1]);
            }
        });
        return out;
    }

    /** Die Selektoren, die eine solche Animation starten. */
    function animierteSelektoren() {
        const namen = keyframesMitSchatten();
        const out = new Set();
        cssFiles.forEach(f =>
            regelnMitRumpf(f.content).forEach(r => {
                const m = r.rumpf.match(/(?:^|[;{\s])animation(?:-name)?\s*:\s*([^;}]+)/);
                if (!m) return;
                if (m[1].split(/[\s,]+/).some(t => namen.has(t))) {
                    r.sel.split(',').forEach(s => out.add(s.trim()));
                }
            })
        );
        return out;
    }

    /** Jede Schattendeklaration, die von so einer Animation ueberschrieben
     *  wird: die Regel des animierten Selektors selbst und jede Regel
     *  DESSELBEN Elements in einem Zustand (`:hover`, `.klasse`, ...). Ein
     *  Nachfahre (`.sel svg`) gehoert NICHT dazu — das ist ein anderes
     *  Element und traegt die Animation nicht. */
    function animationUeberschrieben() {
        const sel = [...animierteSelektoren()];
        const out = new Set();
        SCHATTEN.forEach(d =>
            d.sel.split(',').forEach(teil => {
                const t = teil.trim();
                if (sel.some(s => t === s || t.startsWith(`${s}:`) || t.startsWith(`${s}.`))) {
                    out.add(`${d.datei} {${t}}`);
                }
            })
        );
        return [...out].sort();
    }

    /** Nennt diese Zeile der Aktenlage genau dieses Paar? Der Riegel
     *  `(?![\w:.-])` ist der Kern: ohne ihn gilt `.floating-dice-trigger`
     *  schon durch `.floating-dice-trigger:hover` als genannt, und die
     *  Ratsche koennte die beiden Zustaende nicht auseinanderhalten. */
    function nenntPaar(zeile, datei, sel) {
        if (!zeile.includes(datei)) return false;
        return new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w:.-])`).test(zeile);
    }

    function paarAus(schluessel) {
        const i = schluessel.indexOf(' {');
        return [schluessel.slice(0, i), schluessel.slice(i + 2, -1)];
    }

    test('die von einer Animation ueberschriebenen Hoehenlagen sind die zwei des Wuerfelknopfs', () => {
        expect([...keyframesMitSchatten()].sort()).toEqual(['floatingPulse']);
        expect([...animierteSelektoren()].sort()).toEqual(['.floating-dice-trigger']);
        // Reihenfolge der Sortierung: ':' (0x3A) liegt vor '}' (0x7D).
        expect(animationUeberschrieben()).toEqual([
            'dice.css {.floating-dice-trigger:hover}',
            'dice.css {.floating-dice-trigger}'
        ]);
    });

    test('jede von einer Animation ueberschriebene Lage steht in W3-F-01 als nicht gerendert', () => {
        expect(W3F01).not.toBe('');
        const zeilen = W3F01.split('\n');
        const ueberschrieben = animationUeberschrieben();

        // (1) Jede steht in einer Zeile, die sie ausdruecklich als nicht
        //     gerendert fuehrt.
        const ohneKennzeichnung = ueberschrieben.filter(k => {
            const [datei, sel] = paarAus(k);
            return !zeilen.some(z => nenntPaar(z, datei, sel) && /nicht gerendert/.test(z));
        });
        expect(ohneKennzeichnung).toEqual([]);

        // (2) Und keine steht in der Aufzaehlung der sichtbaren Tonwechsel:
        //     dort ist jeder Eintrag eine bezifferte sichtbare Aenderung.
        const eintrag7 = zeilen.filter(z => z.includes('die schwarz werden'));
        expect(eintrag7.length).toBe(1);
        const falschGefuehrt = ueberschrieben.filter(k => {
            const [datei, sel] = paarAus(k);
            return nenntPaar(eintrag7[0], datei, sel);
        });
        expect(falschGefuehrt).toEqual([]);
    });

    /* ===================================================================
       (d) SELBSTPROBE DER ZERLEGUNG, nicht ihres Ergebnisses
       =================================================================== */

    test('istGluehe() und deckungVon() urteilen wie R-19 und lesen beide Schreibweisen', () => {
        expect(istGluehe('0 0 8px var(--gold)')).toBe(true);
        expect(istGluehe('0 0 12px var(--glow-gold)')).toBe(true);
        expect(istGluehe('0 4px 16px rgba(0,0,0,0.4)')).toBe(false); // Hoehe
        expect(istGluehe('0 0 0 3px rgba(212,175,55,0.1)')).toBe(false); // Ring
        expect(istGluehe('inset 0 0 15px rgba(139,69,19,0.08)')).toBe(false);
        expect(istGluehe('-4px 0 24px rgba(0,0,0,0.5)')).toBe(false); // seitlich

        expect(deckungVon('0 0 4px rgba(74, 222, 128, 0.4)')).toBe(0.4);
        expect(deckungVon('0 0 30px color-mix(in srgb, var(--green) 50%, transparent)')).toBe(0.5);
        expect(deckungVon('0 0 8px var(--gold)')).toBe(1);
        // Eine umgestellte Stelle traegt ihre Deckung im Token, nicht hier:
        expect(deckungVon('0 0 12px var(--glow-gold)')).toBe(null);

        // Und der Fall, der die 22 von den 13 trennt: ein Goldrahmen ist ein
        // Rahmen, `border-left` ist keiner.
        expect(rahmenArt('box-shadow: 0 2px 6px #000; border: 1px solid var(--gold);').klasse).toBe('goldVoll');
        expect(rahmenArt('border-left: 3px solid var(--gold);')).toBe(null);
        expect(rahmenArt('border: 1px solid var(--border);').klasse).toBe('border');
        // Und die zwei Klassen, die vorher im Auffangbecken `sonst` lagen:
        expect(rahmenArt('border: 1px solid var(--cyan);').klasse).toBe('farbig');
        expect(rahmenArt('border: 2px solid var(--overlay-strong);').klasse).toBe('farbig');
        expect(rahmenArt('border: none !important;').klasse).toBe('ohne');
        expect(rahmenArt('box-shadow: none;')).toBe(null);

        // Und die Klasse, die in Runde 1 der Pruefung W3-B dazugekommen ist:
        // nur umgefaerbt zaehlt, nur EINE Seite umgefaerbt nicht.
        expect(rahmenArt('box-shadow: var(--shadow-2); border-color: var(--gold-dim);').klasse).toBe('nurFarbe');
        expect(rahmenArt('border-color: var(--gold);').wert).toBe('var(--gold)');
        expect(rahmenArt('border-left-color: var(--ra-parchment-rule);')).toBe(null);
        expect(rahmenArt('border-bottom-color: var(--gold);')).toBe(null);
        // Die Kurzschreibweise gewinnt, wenn beide dastehen: sie traegt Stil
        // und Breite und entscheidet damit, ob ueberhaupt eine Linie da ist.
        expect(rahmenArt('border: 1px solid var(--border); border-color: var(--gold);').klasse).toBe('border');
    });

    test('stufeAusRadius() loest den Gleichstand bei 24px nach OBEN und uebergeht Gluehe, Ring und inset', () => {
        expect(stufeAusRadius('0 2px 6px rgba(0,0,0,0.3)')).toBe(1);
        expect(stufeAusRadius('0 4px 16px rgba(0,0,0,0.4)')).toBe(2);
        expect(stufeAusRadius('0 8px 32px rgba(0,0,0,0.6)')).toBe(3);
        expect(stufeAusRadius('0 8px 24px rgba(0,0,0,0.5)')).toBe(3); // Gleichstand -> oben
        expect(stufeAusRadius('0 6px 20px rgba(212,175,55,0.4)')).toBe(2);
        // Eine Gluehe ist keine Hoehe, ein Ring hat keinen Radius:
        expect(stufeAusRadius('0 0 20px rgba(220, 38, 38, 0.3)')).toBe(null);
        expect(stufeAusRadius('0 0 0 2px var(--gold)')).toBe(null);
        expect(stufeAusRadius('inset 0 0 15px rgba(139,69,19,0.08)')).toBe(null);
        expect(stufeAusRadius('none')).toBe(null);
        // Die erste Hoehenlage entscheidet, auch wenn eine Gluehe davor steht:
        expect(stufeAusRadius('0 0 20px rgba(220,38,38,0.3), 0 4px 16px rgba(0,0,0,0.4)')).toBe(2);

        /* DIE ZWEITE SCHREIBWEISE DERSELBEN SACHE (Welle 3, Schritte 3 und 4).
           Sobald eine Stelle ihr Token traegt, steht die Geometrie IM Token und
           nicht mehr in der Regel. `laengen20()` findet dann keine Laengen,
           `b <= 0` greift, und die Ableitung gibt null — der Test "die
           abgeleitete Stufe stimmt an allen neun Goldrahmen mit der
           eingefrorenen ueberein" ginge rot, weil ALLE NEUN Goldrahmen und
           ALLE FUENF farbigen Rahmen in den Dateien der Schritte 3 und 4
           liegen.

           Das ist KEINE Abkuerzung: die Erweiterung liest die Stufe nicht aus
           dem Tokennamen ab, sondern loest das Token ueber seine ERSTE
           Deklaration in variables.css auf (der :root-Block, 0 2px 6px /
           0 4px 16px / 0 8px 32px) und rechnet DANACH wie bisher aus dem
           Radius. Verschiebt jemand die Leiter in variables.css, wandert die
           Ableitung mit — genau das soll sie. */
        expect(stufeAusRadius('var(--shadow-1)')).toBe(1);
        expect(stufeAusRadius('var(--shadow-2)')).toBe(2);
        expect(stufeAusRadius('var(--shadow-3)')).toBe(3);
        /* Die eigentliche Zusicherung ist nicht die Zahl, sondern die
           Gleichheit: BEIDE Schreibweisen derselben Sache muessen dasselbe
           ergeben. Bei der Schublade ist das aufschlussreich — ihr Wert
           -4px 0 24px faellt schon in der rohen Form unter "Hoehe mit Radius
           24" und loest den Gleichstand nach OBEN auf, gibt also 3 und nicht
           null. Das ist nicht neu und aendert nichts; es steht hier, damit
           niemand die Zahl fuer eine Folge der Tokenisierung haelt. */
        expect(stufeAusRadius('var(--shadow-drawer)')).toBe(
            stufeAusRadius('-4px 0 24px rgba(0,0,0,0.5)')
        );
        expect(stufeAusRadius('var(--shadow-drawer)')).toBe(3);
        // Der Ring hat keinen Radius und wird auch als Token nicht aufgeloest:
        expect(stufeAusRadius('var(--ring-gold)')).toBe(null);
        // Und gemischt: Ring voran, Hoehentoken dahinter — dmscreen .drag-over.
        expect(stufeAusRadius('0 0 0 2px var(--gold), var(--shadow-2)')).toBe(2);
    });

    test('literalFarbeVon() liest rgba und Hex und gibt bei Tokens null', () => {
        expect(literalFarbeVon('0 0 6px rgba(251, 191, 36, 0.5)')).toBe('#fbbf24');
        expect(literalFarbeVon('0 0 20px rgba(220, 38, 38, 0.3)')).toBe('#dc2626');
        expect(literalFarbeVon('0 0 8px #D4AF37')).toBe('#d4af37');
        expect(literalFarbeVon('0 0 8px var(--gold)')).toBe(null);
        expect(literalFarbeVon('0 0 12px var(--glow-yellow)')).toBe(null);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 3 — R-21: die fuenf Ringe und die Text-Leuchten
   ===========================================================================
   WARUM SIE NEBEN R-19 UND R-20 STEHT. R-19 urteilt in Teil (1) nur ueber die
   FORM einer Lage und laesst `var(--ring-gold)` zu, ohne zu sagen, welche
   Stelle ihn tragen soll und was sich dabei sichtbar aendert; ihre Teil-(2)-
   Tabelle fuehrt nur Hoehen- und die eine seitliche Lage. R-20 bewacht die 14
   Gluehlagen der box-shadow-Familie. Damit standen bis zum 2026-09-30 zwei
   Mengen unter keiner Ratsche:

   (a) DIE FUENF RINGLAGEN MIT GOLD. Vier gehen auf das Token, eine bleibt
       volldeckend. Die vier aendern dabei DICKE und/oder DECKUNG, und in
       Contrast alle vier den Ton bis zum volldeckenden Gold — die groesste
       Einzelaenderung dieser Welle in einem Theme, bei der bisher nichts
       nachgehalten hat, dass sie ueberhaupt bemerkt wird.

   (b) DIE SECHS TEXT-LEUCHTEN. Paragraph 3.2 regelt text-shadow nicht;
       Schritt 5 empfiehlt, die Familie mitzunehmen. Genau sechs der acht
       text-shadow-Deklarationen tragen die Gluehform `0 0 <r>px <Farbe>` und
       gehen deshalb auf --glow-*. Die drei anderen Schatten dieser Familie
       (zwei text-shadow, ein drop-shadow) tragen HOEHENform `0 <y> <r>` und
       bleiben Literale: die Hoehenstufen fuehren ihre Geometrie IM Token und
       sind schwarz — in einem Textschatten ist beides unbrauchbar, und ein
       Token fuer "farbige Texthoehe" gibt es nicht. Sie stehen hier
       namentlich, damit die Restmenge benannt und nicht uebersehen ist.

   DER BESTAND, am 2026-09-30 an HEAD 211aefb mit eigenem Parser erhoben
   (Kommentare zeilentreu geleert, Deklarationen ueber Klammertiefe, Lagen am
   Komma auf Klammertiefe 0):

        8   Ringlagen in box-shadow: 5 mit Gold, 3 mit dem Rot des
            Wuerfelknopfs (dessen Ruhelage und die zwei Bilder von
            floatingPulse; alle drei sind R-19-Ausnahmen)
        8   text-shadow-Deklarationen, davon 6 in Gluehform
        1   filter: drop-shadow, in Hoehenform

   WAS SIE PRUEFT:

   (1) Die Menge der Ringlagen ist die gemessene, und jede goldene steht in
       RING_STELLEN.
   (2) Die vier Fokus-/Zustandsringe tragen `var(--ring-gold)`; das Ablageziel
       traegt unveraendert sein volldeckendes Gold.
   (3) Das Token ist in allen vier Themes 3 px dick und traegt in drei 15 % und
       in Contrast volles Gold — gelesen aus variables.css, nicht behauptet.
   (4) Der Abstand jedes Rings zu SEINER Traegerflaeche, vorher und nachher, in
       allen vier Themes — gerechnet, nicht abgeschrieben.
   (5) Die sechs Text-Leuchten tragen `0 0 <r>px var(--glow-*)`, ihre Radien
       bleiben, und die drei Hoehenform-Schatten bleiben namentlich draussen.
   (6) Jede Stelle, deren Dicke, Deckung oder Ton sich aendert, steht in der
       Aktenlage unter W3-F-01 — zeilentreu als Paar aus Datei und Marke, nicht
       als zwei Teilstrings irgendwo im Abschnitt.

   SIE IST BEI DER GEBURT ROT, in fuenf Zusicherungen, mit den Ausgangswerten
   4 (Ringe noch am Literal), 6 (Text-Leuchten noch am Literal) und 11 (Stellen
   ohne Eintrag in der Aktenlage: 4 Ringe, 4 Text-Leuchten mit Tonwechsel, 3
   Restschatten). Die Zahlen stehen als Kommentar an ihrer Zielkonstante.
   =========================================================================== */
describe('R-21 — Ringe und Text-Leuchten, beziffert gefuehrt (Ratsche)', () => {
    /** Zielwerte. 0 von der Geburt an; die gemessenen Ausgangswerte stehen
     *  hier als Kommentar und NICHT als Schranke — eine Ratsche, deren
     *  Schranke mitwandert, schuetzt nichts.
     *  Ausgangswerte am 2026-09-30, HEAD 211aefb, gemessen und nicht
     *  geschaetzt: 4 Ringe noch am Literal, 6 Text-Leuchten noch am Literal
     *  und 11 Stellen ohne Eintrag in der Aktenlage (4 Ringe + 4 Text-Leuchten
     *  mit Tonwechsel + 3 Restschatten) — fuenf rote Zusicherungen. */
    const R21_ZIEL = 0;

    const AKTENLAGE_PFAD = path.join(REPO, '.planning', 'HANDOFF-V3-OFFENE-PUNKTE.md');
    const AKTENLAGE = fs.readFileSync(AKTENLAGE_PFAD, 'utf8');

    function aktenlageAbschnitt(marke) {
        const i = AKTENLAGE.indexOf(`## ${marke}`);
        if (i < 0) return '';
        const j = AKTENLAGE.indexOf('\n## ', i + 1);
        return AKTENLAGE.slice(i, j < 0 ? AKTENLAGE.length : j);
    }
    const W3F01 = aktenlageAbschnitt('W3-F-01');

    /* -------------------------------------------------------------------
       ZERLEGUNG. Eigenstaendig, wie schon bei R-20: die von R-19 steht im
       Rumpf ihres describe und waere nur durch ein Herausziehen erreichbar,
       das ihren eingefrorenen Block anfasst. Die Zahlen werden gegen R-19s
       und R-20s Zahlen gehalten (Test "dieselbe Menge wie R-19").
       ------------------------------------------------------------------- */

    /** Lagen am Komma der OBERSTEN Klammerebene. */
    function lagen21(wert) {
        const out = [];
        let tiefe = 0;
        let cur = '';
        for (const ch of wert) {
            if (ch === '(') tiefe++;
            else if (ch === ')') tiefe--;
            if (ch === ',' && tiefe === 0) {
                if (cur.trim()) out.push(cur.trim());
                cur = '';
            } else cur += ch;
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
    }

    /** Die fuehrenden Laengen einer Lage. Abbruch beim ersten Wort, das keine
     *  Laenge ist — danach kommt die Farbe. */
    function laengen21(lage) {
        const nums = [];
        for (const tok of lage
            .replace(/\binset\b/g, ' ')
            .trim()
            .split(/\s+/)) {
            if (/^-?\d*\.?\d+px$/.test(tok)) nums.push(parseFloat(tok));
            else if (tok === '0') nums.push(0);
            else break;
        }
        return nums;
    }

    /** Ringlage: X=0, Weichzeichnung 0, kein inset. Zeichengleich mit
     *  bauart() === 'ring' in R-19, einschliesslich der Tokenform. */
    function istRing(lage) {
        if (/^var\(--ring-gold\)$/.test(lage)) return true;
        if (/^var\(--shadow-(?:[123]|drawer)\)$/.test(lage)) return false;
        if (/\binset\b/.test(lage)) return false;
        const [x = null, y = null, b = 0] = laengen21(lage);
        if (x !== null && x !== 0) return false;
        if (y !== null && y > 0) return false;
        return !(x === 0 && y === 0 && b > 0);
    }

    /** Gluehlage: X=0, Y=0, Weichzeichnung > 0, kein inset. */
    function istGluehe21(lage) {
        if (/\binset\b/.test(lage)) return false;
        const [x = null, y = null, b = 0] = laengen21(lage);
        return x === 0 && y === 0 && b > 0;
    }

    /** Die Deckung einer Lage, oder null wenn sie in einem Token steckt. */
    function deckung21(lage) {
        if (/var\(--(?:glow|ring|shadow)-/.test(lage)) return null;
        let m = lage.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
        if (m) return parseFloat(m[1]);
        m = lage.match(/color-mix\(\s*in srgb\s*,[^,]*?([\d.]+)%\s*,\s*transparent\s*\)/);
        if (m) return parseFloat(m[1]) / 100;
        if (/var\(--|#[0-9a-f]{3,8}\b|\brgb\(/i.test(lage)) return 1.0;
        return null;
    }

    /** Die Literalfarbe einer Lage als Hex, null sobald sie in einem Token
     *  steckt. */
    function literalFarbe21(lage) {
        const m = lage.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return '#' + [1, 2, 3].map(i => Number(m[i]).toString(16).padStart(2, '0')).join('');
        const h = lage.match(/#[0-9a-f]{6}\b/i);
        return h ? h[0].toLowerCase() : null;
    }

    /** Alle Deklarationen einer Schatteneigenschaft mit Datei, Selektor und
     *  Zeile. `props` ist die Regex fuer den Eigenschaftsnamen. */
    function regelnMit(props) {
        const out = [];
        cssFiles.forEach(f =>
            regelnMitRumpf(f.content).forEach(r => {
                const re = new RegExp(`(?:^|[;{\\s])((?:-webkit-)?${props})\\s*:\\s*([^;}]+)`, 'g');
                let m;
                while ((m = re.exec(r.rumpf))) {
                    out.push({
                        datei: f.name,
                        sel: r.sel,
                        prop: m[1],
                        wert: m[2].trim().replace(/\s+/g, ' '),
                        zeile: r.zeile + (r.rumpf.slice(0, m.index).match(/\n/g) || []).length
                    });
                }
            })
        );
        return out;
    }
    const BOX = regelnMit('box-shadow');
    const TEXT = regelnMit('text-shadow');
    const FILTER = regelnMit('filter').filter(d => /drop-shadow/.test(d.wert));

    const schluessel = e => `${e.datei} {${e.sel}}`;

    /** Jede Ringlage der box-shadow-Familie mit ihrer Deklaration im Ruecken.
     *  Die @keyframes-Bilder liegen NICHT darin: regelnMitRumpf() laeuft in
     *  At-Regeln hinein, und `0%, 100%` ist dort ein eigener Selektorkopf —
     *  darum tragen sie ihren Dateinamen und ihren Prozentkopf und werden am
     *  Kopf erkannt, nicht ausgeschlossen. */
    function ringlagen() {
        const out = [];
        BOX.forEach(d => {
            if (/^none\b/.test(d.wert)) return;
            lagen21(d.wert).forEach(l => {
                if (istRing(l)) out.push({ ...d, lage: l, dicke: laengen21(l)[3], deckung: deckung21(l) });
            });
        });
        return out;
    }

    function textgluehlagen() {
        const out = [];
        TEXT.concat(FILTER).forEach(d => {
            const roh = /drop-shadow/.test(d.wert) ? d.wert.replace(/^.*drop-shadow\(([^)]*(?:\([^)]*\))?[^)]*)\).*$/, '$1') : d.wert;
            lagen21(roh).forEach(l => {
                if (istGluehe21(l)) out.push({ ...d, lage: l, radius: laengen21(l)[2], deckung: deckung21(l) });
            });
        });
        return out;
    }

    /* -------------------------------------------------------------------
       DIE FUENF RINGLAGEN MIT GOLD, gemessen am 2026-09-30.

       `marke` ist der Selektorausschnitt, den die Aktenlage nennen muss. Er
       ist NICHT frei gewaehlt: ein eigener Test haelt ihn gegen den gemessenen
       Selektor. Die drei Fokusregeln nennen je zwei bis drei Felder in einer
       Auswahl; die ganze Auswahl in eine Tabellenzeile der Aktenlage zu
       schreiben waere unlesbar, und ein blosser Teilstring-Treffer irgendwo im
       Abschnitt waere zu schwach (die Lehre von R-20).

       `flaeche` ist die TATSAECHLICHE Traegerflaeche, aus dem CSS gelesen und
       nicht geraten: der Ring liegt AUSSERHALB des Elements, also auf dem
       Kasten dahinter. Eine feste Hexangabe steht dort, wo die Flaeche
       themenblind ist — `.modal` (dmscreen.css) traegt ein Literal
       `rgba(26, 26, 26, 0.95)` und ist eine gefuehrte Ausnahme von R-10
       (offener Punkt W2-C-01); ihre Flaeche folgt dem Theme also NICHT,
       waehrend der Goldton darauf es sehr wohl tut.

       `vorher.farbe` IST DER KERN DIESER TABELLE und nicht Beiwerk (Pruefung
       W3-C, Runde 1). Drei der vier Ringe trugen ein themenblindes
       `rgba(212, 175, 55, …)` = fest `#d4af37`; nur `welt.css` trug schon
       `color-mix(… var(--gold) 15% …)` und folgte damit dem Theme. Die erste
       Fassung dieses Blocks fuehrte die Farbe NICHT, und ringAbstand() nahm
       fuer das "vorher" das Gold DES THEMES — also `#b8860b` in Light und
       `#8b4513` in Sepia, die an diesen drei Stellen gar nicht standen. Das
       ist kein Rundungsfehler: `party.css` galt dadurch in Light und Sepia als
       bildpunktgleich, obwohl der Ring dort die FARBE wechselt, und bei
       `dmscreen.css` zeigte die Sepia-Spalte eine Verbesserung, wo in
       Wahrheit eine Verschlechterung steht. `null` steht dort, wo die Stelle
       kein Literal trug — dann IST das Theme-Gold die richtige Ausgangsfarbe.
       Gegenstueck zu `literalFarbeVon()` in R-20, das diese Spalte von Anfang
       an fuehrte; hier fehlte sie.
       ------------------------------------------------------------------- */
    const RING_STELLEN = [
        {
            datei: 'dmscreen.css',
            zeile: 1077,
            sel: '.form-group input:focus, .form-group select:focus, .form-group textarea:focus',
            marke: '.form-group input:focus',
            vorher: { dicke: 3, deckung: 0.1, farbe: '#d4af37' },
            flaeche: '#1a1a1a',
            rolle: 'fokus',
            ziel: 'token'
        },
        {
            datei: 'party.css',
            zeile: 1217,
            sel: '.cf-panel .cf-field input:focus, .cf-panel .cf-field select:focus',
            marke: '.cf-panel .cf-field input:focus',
            vorher: { dicke: 3, deckung: 0.15, farbe: '#d4af37' },
            flaeche: '--bg-dark',
            rolle: 'fokus',
            ziel: 'token'
        },
        {
            datei: 'welt.css',
            zeile: 156,
            sel: '.wp-rich-editor:focus',
            marke: '.wp-rich-editor:focus',
            vorher: { dicke: 2, deckung: 0.15, farbe: null },
            flaeche: '--bg-card',
            rolle: 'fokus',
            ziel: 'token'
        },
        {
            datei: 'migration.css',
            zeile: 65,
            sel: '.wizard-step.active',
            marke: '.wizard-step.active',
            vorher: { dicke: 2, deckung: 0.3, farbe: '#d4af37' },
            flaeche: '--bg-card',
            rolle: 'zustand',
            ziel: 'token'
        },
        {
            datei: 'dmscreen.css',
            zeile: 1137,
            sel: '[data-sortable].drag-over',
            marke: '[data-sortable].drag-over',
            vorher: { dicke: 2, deckung: 1.0, farbe: null },
            flaeche: '#1a1a1a',
            rolle: 'ablageziel',
            ziel: 'unveraendert'
        }
    ];

    /** Die drei roten Ringlagen des Wuerfelknopfs. Sie sind R-19-Ausnahmen
     *  (Ruhelage und die zwei Bilder von floatingPulse) und tragen kein Gold;
     *  sie stehen hier, damit die gemessene Gesamtmenge 8 aufgeht und eine
     *  neunte Ringlage nicht lautlos hinzukommen kann. */
    const RING_ROT = [
        'dice.css {.floating-dice-trigger}',
        'dice.css {0%, 100%}',
        'dice.css {50%}'
    ];

    /* -------------------------------------------------------------------
       DIE SECHS TEXT-LEUCHTEN, gemessen am 2026-09-30.

       Alle sechs tragen heute 0,50 — genau die Deckung, die --glow-* setzt.
       Radius und Deckung bleiben deshalb an JEDER der sechs bildpunktgleich;
       was sich aendert, ist allein der TON, und zwar an vier von ihnen (die
       zwei dashboard-Stellen tragen schon color-mix derselben Rolle und
       aendern in keinem Theme etwas).
       ------------------------------------------------------------------- */
    const TEXT_GLUEH = [
        { datei: 'dashboard.css', zeile: 66, sel: '.dice-crit', marke: '.dice-crit', radius: 10, vorher: 0.5, rolle: '--green', farbe: null },
        { datei: 'dashboard.css', zeile: 67, sel: '.dice-fail', marke: '.dice-fail', radius: 10, vorher: 0.5, rolle: '--red', farbe: null },
        { datei: 'dice.css', zeile: 31, sel: '.dice-hero-result.crit', marke: '.dice-hero-result.crit', radius: 20, vorher: 0.5, rolle: '--green', farbe: '#4ade80' },
        { datei: 'dice.css', zeile: 36, sel: '.dice-hero-result.fail', marke: '.dice-hero-result.fail', radius: 20, vorher: 0.5, rolle: '--red', farbe: '#ef4444' },
        { datei: 'dice.css', zeile: 705, sel: '.fdp-number.crit', marke: '.fdp-number.crit', radius: 20, vorher: 0.5, rolle: '--green', farbe: '#4ade80' },
        { datei: 'dice.css', zeile: 711, sel: '.fdp-number.fail', marke: '.fdp-number.fail', radius: 20, vorher: 0.5, rolle: '--red', farbe: '#ef4444' }
    ];

    /* -------------------------------------------------------------------
       DIE DREI, DIE DRAUSSEN BLEIBEN, und warum. Alle drei sind HOEHENform
       (`0 <y> <r>`), keine Gluehe. Fuer eine Texthoehe gibt es kein Token:
       --shadow-1/-2/-3 fuehren ihre Geometrie mit sich und sind schwarz, und
       in Contrast sind sie ein Umriss mit Spread — als text-shadow ergaebe
       das eine Kontur um jeden Buchstaben. Ein Token "farbige Texthoehe"
       waere neu und hat genau eine Verwendung; es kaeme mit einem Fuss im
       Grab zur Welt (dieselbe Rechnung, mit der --glow-purple nicht angelegt
       wurde).
       ------------------------------------------------------------------- */
    const TEXT_REST = [
        {
            datei: 'dashboard.css',
            zeile: 61,
            sel: '.dice-result-main',
            marke: '.dice-result-main',
            wert: '0 2px 10px rgba(251, 191, 36, 0.3)',
            grund: 'farbige Texthoehe, kein Gluehradius'
        },
        {
            datei: 'dmscreen.css',
            zeile: 1311,
            sel: '.dms-hp-text',
            marke: '.dms-hp-text',
            wert: '0 1px 2px rgba(0,0,0,0.5)',
            grund: 'schwarze Texthoehe, Lesbarkeit auf dem HP-Balken'
        },
        {
            datei: 'dice.css',
            zeile: 583,
            sel: '.floating-dice-trigger svg',
            marke: '.floating-dice-trigger svg',
            wert: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            grund: 'schwarze Hoehe als Filter, keine box-shadow-Lage'
        }
    ];

    /** Nennt diese Zeile der Aktenlage genau dieses Paar? Der Riegel
     *  `(?![\w:.-])` ist der Kern — ohne ihn gilt `.dice-crit` schon durch
     *  `.dice-crit-effect` als genannt. Zeichengleich mit nenntPaar() in
     *  R-20; bewusst kopiert und nicht geteilt, weil beide Bloecke fuer sich
     *  lesbar bleiben sollen. */
    function nenntPaar21(zeile, datei, marke) {
        if (!zeile.includes(datei)) return false;
        return new RegExp(`${marke.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w:.-])`).test(zeile);
    }
    const W3F01_ZEILEN = W3F01.split('\n');
    const inAktenlage = (datei, marke) => W3F01_ZEILEN.some(z => nenntPaar21(z, datei, marke));

    /** Der Wert von --ring-gold je Theme, aus variables.css gelesen. */
    function ringToken() {
        const out = {};
        WCAG.THEMES.forEach(t => {
            const roh = WCAG.palette(t)['--ring-gold'] || '';
            const l = laengen21(roh);
            out[t] = { roh, dicke: l[3], deckung: deckung21(roh) };
        });
        return out;
    }

    /** Der Goldton einer Ringlage ueber ihrer Traegerflaeche, als Verhaeltnis
     *  zur Flaeche. `flaeche` ist ein Tokenname oder eine feste Hexangabe.
     *
     *  `farbe` ist die Goldangabe, die an der Stelle WIRKLICH steht: das
     *  gemessene Literal fuer die vorher-Spalte, `null` fuer alles, was dem
     *  Theme folgt (die nachher-Spalte und die eine Stelle, die schon vorher
     *  color-mix trug). Ohne diesen Parameter rechnete die vorher-Spalte drei
     *  der vier Ringe mit einem Gold, das dort nie stand — siehe den
     *  Tabellenkopf von RING_STELLEN. */
    function ringAbstand(e, theme, deckung, farbe) {
        const p = WCAG.palettes();
        const fl = e.flaeche.startsWith('#') ? e.flaeche : p[theme][e.flaeche];
        const ton = WCAG.mixOver(farbe || p[theme]['--gold'], deckung, fl);
        return +WCAG.ratio(ton, fl).toFixed(2);
    }

    /* ===================================================================
       (a) DIE FUENF RINGE
       =================================================================== */

    test('die Menge der Ringlagen ist die gemessene: 8, davon 5 mit Gold und 3 rote', () => {
        const alle = ringlagen();
        expect(alle.length).toBe(8);
        const gold = alle.filter(l => /212\s*,\s*175\s*,\s*55|--gold|--ring-gold/.test(l.lage));
        expect(gold.map(schluessel).sort()).toEqual(RING_STELLEN.map(schluessel).sort());
        expect(
            alle
                .filter(l => !gold.includes(l))
                .map(schluessel)
                .sort()
        ).toEqual([...RING_ROT].sort());
        expect(RING_STELLEN.length).toBe(5);
    });

    test('dieselbe Menge wie R-19: 71 box-shadow-Deklarationen, 8 Ringlagen', () => {
        expect({ dekl: BOX.length, ringe: ringlagen().length }).toEqual({ dekl: 71, ringe: 8 });
    });

    test('jede Marke ist ein Ausschnitt ihres gemessenen Selektors', () => {
        const abweichung = RING_STELLEN.concat(TEXT_GLUEH, TEXT_REST)
            .filter(e => !e.sel.includes(e.marke))
            .map(e => `${e.datei} {${e.sel}} — Marke "${e.marke}" steht nicht darin`);
        expect(abweichung.sort()).toEqual([]);
    });

    test('der Zeilenanker jeder Ringlage stimmt mit der gefundenen Deklaration', () => {
        const nach = new Map(ringlagen().map(l => [schluessel(l), l.zeile]));
        const abweichung = RING_STELLEN.filter(e => nach.get(schluessel(e)) !== e.zeile).map(
            e => `${schluessel(e)} — Anker ${e.zeile}, gefunden ${nach.get(schluessel(e))}`
        );
        expect(abweichung.sort()).toEqual([]);
    });

    test('die vier Fokus- und Zustandsringe tragen var(--ring-gold)', () => {
        const nach = new Map(ringlagen().map(l => [schluessel(l), l.lage]));
        const offen = RING_STELLEN.filter(e => e.ziel === 'token')
            .filter(e => nach.get(schluessel(e)) !== 'var(--ring-gold)')
            .map(e => `${schluessel(e)} — traegt "${nach.get(schluessel(e))}", erwartet var(--ring-gold)`);
        expect({ anzahl: offen.length, stichprobe: offen.sort() }).toEqual({
            anzahl: R21_ZIEL,
            stichprobe: []
        });
    });

    test('das Ablageziel beim Ziehen bleibt volldeckend und unveraendert', () => {
        const nach = new Map(ringlagen().map(l => [schluessel(l), l.lage]));
        const e = RING_STELLEN.find(x => x.ziel === 'unveraendert');
        expect(nach.get(schluessel(e))).toBe('0 0 0 2px var(--gold)');
        // Und es ist die EINZIGE Ausnahme dieser Art.
        expect(RING_STELLEN.filter(x => x.ziel === 'unveraendert').length).toBe(1);
    });

    test('solange eine Ringlage ein Literal traegt, sind Dicke, Deckung UND FARBE die gemessenen', () => {
        const nach = new Map(ringlagen().map(l => [schluessel(l), l]));
        const abweichung = RING_STELLEN.filter(e => {
            const l = nach.get(schluessel(e));
            if (!l || l.lage === 'var(--ring-gold)') return false;
            // Die FARBE gehoert dazu, nicht nur die Geometrie: mit gleicher
            // Dicke und gleicher Deckung, aber anderem Goldliteral waere die
            // vorher-Spalte des eingefrorenen Blocks falsch, und genau dieser
            // Fehler ist in Runde 1 der Pruefung W3-C gefunden worden.
            const f = literalFarbe21(l.lage);
            return (
                l.dicke !== e.vorher.dicke ||
                Math.abs(l.deckung - e.vorher.deckung) > 1e-9 ||
                f !== (e.vorher.farbe || null)
            );
        }).map(e => {
            const l = nach.get(schluessel(e));
            return (
                `${schluessel(e)} — Tabelle ${e.vorher.dicke}px/${e.vorher.deckung}/${e.vorher.farbe || '(Token)'}, ` +
                `gefunden ${l.dicke}px/${l.deckung}/${literalFarbe21(l.lage) || '(Token)'}`
            );
        });
        expect(abweichung.sort()).toEqual([]);
    });

    test('--ring-gold ist in allen vier Themes 3 px und traegt in Contrast volles Gold', () => {
        const t = ringToken();
        expect(WCAG.THEMES.map(th => t[th].dicke)).toEqual([3, 3, 3, 3]);
        expect(WCAG.THEMES.map(th => t[th].deckung)).toEqual([0.15, 0.15, 0.15, 1.0]);
        // Die volle Deckung in Contrast ist die Entscheidung des Schritts 2
        // (eine 15-%-Mischung ist in einem Kontrastthema keine Aussage) und
        // keine Nachlaessigkeit. Sie macht die vier Ringe dort um das
        // Sieben- bis Zehnfache deutlicher — der groesste Sprung der Welle in
        // einem einzelnen Theme, und deshalb steht er hier beziffert.
        expect(t.contrast.roh).toBe('0 0 0 3px var(--gold)');
    });

    test('der Abstand jedes Rings zu SEINER Traegerflaeche, vorher und nachher, in vier Themes', () => {
        const NACH = { dark: 0.15, light: 0.15, sepia: 0.15, contrast: 1.0 };
        const gerechnet = RING_STELLEN.filter(e => e.ziel === 'token').map(e => [
            `${e.datei} {${e.marke}}`,
            ...WCAG.THEMES.map(
                th =>
                    `${th} ${ringAbstand(e, th, e.vorher.deckung, e.vorher.farbe).toFixed(2)}` +
                    `->${ringAbstand(e, th, NACH[th], null).toFixed(2)}`
            )
        ].join(' | '));
        // NEU GERECHNET am 2026-09-30 (Pruefung W3-C, Runde 1), jetzt mit der
        // Farbe, die vorher wirklich dastand. Drei Zeilen lesen sich anders als
        // in der ersten Fassung, und jede Aenderung hat eine Aussage:
        //   dmscreen.css hat in ALLEN VIER Themes denselben Ausgangswert 1,20,
        //     weil dort Literal UND Flaeche themenblind sind — und verliert in
        //     Sepia (1,20 -> 1,10), wo vorher eine Verbesserung stand.
        //   party.css ist NUR in Dark bildpunktgleich: in Light und Sepia
        //     wechselt der Ring die Farbe (#d4af37 -> #b8860b bzw. #8b4513)
        //     und gewinnt dabei (1,10 -> 1,16 und 1,08 -> 1,24).
        //   migration.css schwaecht nur Dark und Light ab; in Sepia gewinnt es
        //     leicht (1,21 -> 1,26).
        // welt.css bleibt wortgleich — es trug schon color-mix.
        expect(gerechnet).toEqual([
            'dmscreen.css {.form-group input:focus} | dark 1.20->1.32 | light 1.20->1.23 | sepia 1.20->1.10 | contrast 1.20->12.41',
            'party.css {.cf-panel .cf-field input:focus} | dark 1.27->1.27 | light 1.10->1.16 | sepia 1.08->1.24 | contrast 1.21->14.97',
            'welt.css {.wp-rich-editor:focus} | dark 1.32->1.32 | light 1.17->1.17 | sepia 1.26->1.26 | contrast 1.41->13.46',
            'migration.css {.wizard-step.active} | dark 1.89->1.32 | light 1.24->1.17 | sepia 1.21->1.26 | contrast 1.85->13.46'
        ]);
    });

    test('jeder Ring, dessen Dicke, Deckung oder Ton sich aendert, steht zeilentreu in W3-F-01', () => {
        expect(W3F01).not.toBe('');
        const t = ringToken();
        const p = WCAG.palettes();
        /** In welchen Themes weicht das Token von der gemessenen Lage ab?
         *  GERECHNET aus dem Token und der Tabelle, nicht behauptet.
         *
         *  DER TON GEHOERT DAZU, und der Testname sagt es seit der Geburt —
         *  gerechnet wurde er nicht (Pruefung W3-C, Runde 1). Wer ein
         *  themenblindes `#d4af37` gegen `var(--gold)` tauscht, aendert in
         *  Light und Sepia die Farbe, ohne einen Bildpunkt Geometrie zu
         *  bewegen. Genau dieselbe Lehre hat R-20 schon gezogen ("DER FILTER
         *  GEHT AUF DECKUNG ODER TON"); hier fehlte sie noch. */
        const aendertSich = e =>
            WCAG.THEMES.filter(
                th =>
                    t[th].dicke !== e.vorher.dicke ||
                    Math.abs(t[th].deckung - e.vorher.deckung) > 1e-9 ||
                    (!!e.vorher.farbe && (p[th]['--gold'] || '').toLowerCase() !== e.vorher.farbe.toLowerCase())
            );
        const ziele = RING_STELLEN.filter(e => e.ziel === 'token');
        expect(ziele.map(e => `${e.datei} {${e.marke}} ${aendertSich(e).join('/') || '(gleich)'}`)).toEqual([
            'dmscreen.css {.form-group input:focus} dark/light/sepia/contrast',
            'party.css {.cf-panel .cf-field input:focus} light/sepia/contrast',
            'welt.css {.wp-rich-editor:focus} dark/light/sepia/contrast',
            'migration.css {.wizard-step.active} dark/light/sepia/contrast'
        ]);
        // ALLE VIER sind betroffen, spaetestens in Contrast: dort geht jede von
        // Teildeckung auf volles Gold. party.css stand hier zuerst mit "contrast"
        // allein — das war die Folge der uebergangenen Farbe: geometrisch aendert
        // sich dort in Light und Sepia nichts, tonlich sehr wohl. Nur DARK ist an
        // dieser Stelle wirklich bildpunktgleich.
        const betroffen = ziele.filter(e => aendertSich(e).length > 0);
        expect(betroffen.length).toBe(4);
        const offen = betroffen.filter(e => !inAktenlage(e.datei, e.marke)).map(e => `${e.datei} {${e.marke}}`);
        expect({ anzahl: offen.length, stichprobe: offen.sort() }).toEqual({
            anzahl: R21_ZIEL,
            stichprobe: []
        });
    });

    /* ===================================================================
       (b) DIE SECHS TEXT-LEUCHTEN UND DIE DREI, DIE BLEIBEN
       =================================================================== */

    test('der Bestand der Textschatten ist der gemessene: 8 text-shadow, 1 drop-shadow, 6 in Gluehform', () => {
        expect({ text: TEXT.length, drop: FILTER.length, gluehe: textgluehlagen().length }).toEqual({
            text: 8,
            drop: 1,
            gluehe: 6
        });
        expect(textgluehlagen().map(schluessel).sort()).toEqual(TEXT_GLUEH.map(schluessel).sort());
        // Und die drei Hoehenform-Stellen sind genau die der Restliste.
        const gluehKeys = new Set(textgluehlagen().map(schluessel));
        expect(
            TEXT.concat(FILTER)
                .filter(d => !gluehKeys.has(schluessel(d)))
                .map(schluessel)
                .sort()
        ).toEqual(TEXT_REST.map(schluessel).sort());
    });

    test('der Zeilenanker jeder Textstelle stimmt mit der gefundenen Deklaration', () => {
        const nach = new Map(TEXT.concat(FILTER).map(d => [schluessel(d), d.zeile]));
        const abweichung = TEXT_GLUEH.concat(TEXT_REST)
            .filter(e => nach.get(schluessel(e)) !== e.zeile)
            .map(e => `${schluessel(e)} — Anker ${e.zeile}, gefunden ${nach.get(schluessel(e))}`);
        expect(abweichung.sort()).toEqual([]);
    });

    test('die sechs Text-Leuchten tragen 0 0 <r>px var(--glow-*)', () => {
        const FORM = /^0 0 \d+px var\(--glow-(gold|yellow|green|red)\)$/;
        const nach = new Map(textgluehlagen().map(l => [schluessel(l), l.lage]));
        const offen = TEXT_GLUEH.filter(e => !FORM.test(nach.get(schluessel(e)) || '')).map(
            e => `${schluessel(e)} — traegt "${nach.get(schluessel(e))}"`
        );
        expect({ anzahl: offen.length, stichprobe: offen.sort() }).toEqual({
            anzahl: R21_ZIEL,
            stichprobe: []
        });
    });

    /* -------------------------------------------------------------------
       DIE ROLLE IST AUCH HIER DIE AUSSAGE. Die Zusicherung darueber prueft
       die FORM mit einem Sternchen — `var(--glow-(gold|yellow|green|red))` —
       und laesst damit Gruen gegen Rot durchgehen. Gemessen (Pruefung W3-C,
       Runde 1): `dice.css:31` von `var(--glow-green)` auf `var(--glow-red)`,
       also der kritische Treffer in der Farbe des Fehlschlags, aendert an
       dieser Datei nichts (2 rote, beide R-19). Zeichengleich mit der
       Zusicherung in R-20, aus derselben Spalte `rolle` gerechnet. */
    test('jede der sechs Text-Leuchten traegt das Token IHRER Rolle', () => {
        const erwartet = e => `0 0 ${e.radius}px var(--glow${e.rolle.slice(1)})`;
        const nach = new Map(textgluehlagen().map(l => [schluessel(l), l.lage]));
        const abweichung = TEXT_GLUEH.filter(e => nach.get(schluessel(e)) !== erwartet(e)).map(
            e => `${schluessel(e)} — erwartet "${erwartet(e)}", gefunden "${nach.get(schluessel(e))}"`
        );
        expect(abweichung.sort()).toEqual([]);
        // Nur zwei Rollen bei den Text-Leuchten: Treffer und Fehlschlag.
        expect([...new Set(TEXT_GLUEH.map(e => e.rolle))].sort()).toEqual(['--green', '--red']);
    });

    test('die sechs Radien bleiben unberuehrt: 10/10/20/20/20/20', () => {
        const nach = new Map(textgluehlagen().map(l => [schluessel(l), l.radius]));
        const abweichung = TEXT_GLUEH.filter(e => nach.get(schluessel(e)) !== e.radius).map(
            e => `${schluessel(e)} — Tabelle ${e.radius}px, gefunden ${nach.get(schluessel(e))}px`
        );
        expect(abweichung.sort()).toEqual([]);
        expect(
            TEXT_GLUEH.map(e => e.radius)
                .sort((a, b) => a - b)
                .join('/')
        ).toBe('10/10/20/20/20/20');
    });

    test('alle sechs tragen heute 0,50 — das Token aendert an keiner die Deckung', () => {
        expect([...new Set(TEXT_GLUEH.map(e => e.vorher))]).toEqual([0.5]);
        const nach = new Map(textgluehlagen().map(l => [schluessel(l), l.deckung]));
        const abweichung = TEXT_GLUEH.filter(e => {
            const d = nach.get(schluessel(e));
            return d !== null && d !== undefined && Math.abs(d - e.vorher) > 1e-9;
        }).map(e => `${schluessel(e)} — Tabelle ${e.vorher}, gefunden ${nach.get(schluessel(e))}`);
        expect(abweichung.sort()).toEqual([]);
    });

    test('solange eine Text-Leuchte ein Farbliteral traegt, ist es das gemessene', () => {
        const nach = new Map(textgluehlagen().map(l => [schluessel(l), literalFarbe21(l.lage)]));
        const abweichung = TEXT_GLUEH.filter(e => {
            const f = nach.get(schluessel(e));
            return f !== null && f !== undefined && f !== (e.farbe || null);
        }).map(e => `${schluessel(e)} — Tabelle ${e.farbe || '(Token)'}, gefunden ${nach.get(schluessel(e))}`);
        expect(abweichung.sort()).toEqual([]);
        // Zwei tragen schon color-mix derselben Rolle und haben kein Literal.
        expect(TEXT_GLUEH.filter(e => !e.farbe).map(schluessel).sort()).toEqual([
            'dashboard.css {.dice-crit}',
            'dashboard.css {.dice-fail}'
        ]);
    });

    test('vier Text-Leuchten wechseln den Ton, und jede steht zeilentreu in W3-F-01', () => {
        expect(W3F01).not.toBe('');
        const p = WCAG.palettes();
        const tonwechsel = e =>
            e.farbe ? WCAG.THEMES.filter(t => (p[t][e.rolle] || '').toLowerCase() !== e.farbe.toLowerCase()) : [];
        const betroffen = TEXT_GLUEH.filter(e => tonwechsel(e).length > 0);
        expect(betroffen.map(schluessel).sort()).toEqual([
            'dice.css {.dice-hero-result.crit}',
            'dice.css {.dice-hero-result.fail}',
            'dice.css {.fdp-number.crit}',
            'dice.css {.fdp-number.fail}'
        ]);
        // Je drei der vier Themes, nie alle vier: das Literal IST der Dark-Wert.
        expect([...new Set(betroffen.map(e => tonwechsel(e).join('/')))]).toEqual(['light/sepia/contrast']);
        const offen = betroffen.filter(e => !inAktenlage(e.datei, e.marke)).map(e => `${e.datei} {${e.marke}}`);
        expect({ anzahl: offen.length, stichprobe: offen.sort() }).toEqual({
            anzahl: R21_ZIEL,
            stichprobe: []
        });
    });

    test('die drei nicht mitgenommenen Schatten sind Hoehenform und stehen benannt in W3-F-01', () => {
        expect(W3F01).not.toBe('');
        const nach = new Map(TEXT.concat(FILTER).map(d => [schluessel(d), d.wert]));
        // Sie tragen unveraendert ihren gemessenen Wert ...
        expect(TEXT_REST.map(e => `${schluessel(e)} ${nach.get(schluessel(e))}`)).toEqual(
            TEXT_REST.map(e => `${schluessel(e)} ${e.wert}`)
        );
        // ... keine von ihnen ist Gluehform ...
        const gluehKeys = new Set(textgluehlagen().map(schluessel));
        expect(TEXT_REST.filter(e => gluehKeys.has(schluessel(e)))).toEqual([]);
        // ... und jede ist in der Aktenlage als bewusster Rest gefuehrt.
        const offen = TEXT_REST.filter(e => !inAktenlage(e.datei, e.marke)).map(e => `${e.datei} {${e.marke}}`);
        expect({ anzahl: offen.length, stichprobe: offen.sort() }).toEqual({
            anzahl: R21_ZIEL,
            stichprobe: []
        });
    });

    /* ===================================================================
       (c) SELBSTPROBE DER ZERLEGUNG, nicht ihres Ergebnisses
       =================================================================== */

    test('istRing() und istGluehe21() urteilen wie R-19, in beiden Schreibweisen', () => {
        expect(istRing('0 0 0 3px rgba(212,175,55,0.1)')).toBe(true);
        expect(istRing('0 0 0 2px var(--gold)')).toBe(true);
        expect(istRing('var(--ring-gold)')).toBe(true);
        expect(istRing('0 0 0 0 rgba(220, 38, 38, 0.4)')).toBe(true);
        expect(istRing('0 0 12px var(--glow-gold)')).toBe(false); // Gluehe
        expect(istRing('var(--shadow-2)')).toBe(false); // Hoehe im Token
        expect(istRing('0 4px 16px rgba(0,0,0,0.4)')).toBe(false); // Hoehe
        expect(istRing('-4px 0 24px rgba(0,0,0,0.5)')).toBe(false); // seitlich
        expect(istRing('inset 0 0 15px rgba(139,69,19,0.08)')).toBe(false);

        expect(istGluehe21('0 0 10px color-mix(in srgb, var(--green) 50%, transparent)')).toBe(true);
        expect(istGluehe21('0 0 20px var(--glow-red)')).toBe(true);
        expect(istGluehe21('0 2px 10px rgba(251,191,36,0.3)')).toBe(false); // Hoehe
    });

    test('deckung21() liest rgba, color-mix und Volldeckung und gibt bei Tokens null', () => {
        expect(deckung21('0 0 0 3px rgba(212, 175, 55, 0.1)')).toBe(0.1);
        expect(deckung21('0 0 0 3px color-mix(in srgb, var(--gold) 15%, transparent)')).toBe(0.15);
        expect(deckung21('0 0 0 2px var(--gold)')).toBe(1.0);
        expect(deckung21('var(--ring-gold)')).toBe(null);
        expect(deckung21('0 0 12px var(--glow-yellow)')).toBe(null);
    });

    test('lagen21() trennt am Komma der obersten Klammerebene', () => {
        expect(lagen21('var(--shadow-2), 0 0 0 0 rgba(220, 38, 38, 0.4)')).toEqual([
            'var(--shadow-2)',
            '0 0 0 0 rgba(220, 38, 38, 0.4)'
        ]);
        expect(lagen21('0 0 10px color-mix(in srgb, var(--green) 50%, transparent)')).toEqual([
            '0 0 10px color-mix(in srgb, var(--green) 50%, transparent)'
        ]);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 3 — R-22: die sechs JS-Marken, ihre Rechnung und
   ihre Aktenlage (Ratsche)

   WARUM SIE NEBEN R-19 BIS R-21 STEHT. R-19 Teil (5) urteilt darueber, ob die
   sechs JS-Stellen eine ERLAUBTE Form tragen — sie tun es. R-20 und R-21
   urteilen ueber CSS-Gluehlagen und CSS-Ringe. Ueber die sechs JS-Marken
   urteilt beziffert NICHTS: ihre vier Zahlen je Zeile stehen allein in einer
   Tabelle der Aktenlage und in Kommentaren am Code, von keiner Rechnung
   gehalten. Genau dort sind in der Pruefung W3-D Runde 1 zwei Befunde
   gefallen, und keiner davon war eine Formfrage:

     · Der Sepia-Wert des Rings faellt mit der Umstellung von 6,58 auf 2,66,
       also von "haelt" auf "haelt nicht", und stand in der Tabelle NICHT fett,
       obwohl drei Zeilen darunter steht, dass fett "unter 3:1" bedeutet.
       Sichtpunkt D3 nannte Dark und Light und liess Sepia aus — den groessten
       Sturz beider Ringe (Faktor 0,40). Damit war der einzige Uebertritt
       dieser Einheit dem Abnahmeblick entzogen.
     · Der zweite der zwei Ringe ist UNERREICHBAR. `systems/undo.js` sucht die
       Notiz ueber `[data-note-date="…"]`; die Zeichenkette `data-note-date`
       kommt im ganzen Quellbaum genau einmal vor, naemlich in dieser Abfrage.
       Es gibt keinen Setzer — die Sitzungsnotizen werden nach `n.id` gerendert
       (`sessions.js` unter `features/sessions/`, `data-id="${n.id}"` — der
       Pfad steht hier absichtlich zerlegt: das Abdeckungs-Gate in
       `module-test-coverage.test.js` liest eine woertliche Pfadnennung als
       Abdeckung, und R-22 beurteilt diese Datei nicht). `if (noteEl)`
       greift, der Zweig ist tot, der Ring wird nie gemalt. Die Aktenlage
       fuehrte seine Traegerflaeche trotzdem als "aus dem CSS gelesen" und
       schickte die Runde zu einer Probe, die nicht gelingen kann: eine
       ausbleibende Marke waere als "zu schwach" gelesen worden statt als
       "gar nicht da".

   WAS SIE TUT. Sie rechnet die vier Zahlen der Ringzeile aus den Tokens und
   der Palette neu — Verbunddeckung aus `--ring-gold` und `--glow-gold`, ueber
   `--bg-card` — und haelt sie gegen die Tabelle. Aus derselben Rechnung leitet
   sie ab, WELCHE Themes unter 3:1 liegen, und verlangt jedes davon namentlich
   in Sichtpunkt D3. Sie prueft die Fettdruck-Konvention der Tabelle gegen
   dieselbe Schwelle. Und sie bindet den Unerreichbarkeits-Eintrag an den
   Quellbaum: solange kein Setzer da ist, MUSS er in der Akte stehen; sobald
   einer kommt, darf er es NICHT mehr. Keine der drei Zusicherungen liest eine
   Zahl nur nach.

   WAS SIE NICHT TUT. Sie schreibt keiner Marke eine Deckung vor. Ob Ring plus
   Hof noch "zeig mir, wohin ich gesprungen bin" leistet, entscheidet ein Auge;
   eine Ratsche entscheidet nur, ob die Frage am richtigen Theme gestellt wurde
   und ob die Stelle ueberhaupt sichtbar ist.
   =========================================================================== */
describe('R-22 — die sechs JS-Marken, ihre Rechnung und ihre Aktenlage (Ratsche)', () => {
    /** Zielwert. 0 von der Geburt an; die gemessenen Ausgangswerte stehen als
     *  Kommentar und nicht als Schranke. Ausgangswerte am 2026-09-30,
     *  HEAD 70fc160: 2 Zahlen unter 3,00 ohne Fettdruck (2,40 und 2,66),
     *  1 Theme unter 3:1 ohne Nennung in D3 (sepia) und 1 unerreichbare
     *  Stelle ohne Eintrag in der Akte — drei rote Zusicherungen. */
    const R22_ZIEL = 0;

    const AKTENLAGE_PFAD = path.join(REPO, '.planning', 'HANDOFF-V3-OFFENE-PUNKTE.md');
    const AKTENLAGE = fs.readFileSync(AKTENLAGE_PFAD, 'utf8');
    const VARIABLES = fs.readFileSync(path.join(REPO, 'assets', 'styles', 'variables.css'), 'utf8');

    function aktenlageAbschnitt(marke) {
        const i = AKTENLAGE.indexOf(`## ${marke}`);
        if (i < 0) return '';
        const j = AKTENLAGE.indexOf('\n## ', i + 1);
        return AKTENLAGE.slice(i, j < 0 ? AKTENLAGE.length : j);
    }
    const W3F01 = aktenlageAbschnitt('W3-F-01');
    const W3F01_ZEILEN = W3F01.split('\n');

    /** Die Schwelle, die R-02 in diesem Projekt fuer Nicht-Text durchsetzt.
     *  Dieselbe Zahl, gegen die die Aktenlage ihren Fettdruck erklaert. */
    const SCHWELLE_NICHTTEXT = 3.0;

    /* ===================================================================
       (a) DER BESTAND — die sechs Stellen, mit Anker und Wert
       =================================================================== */

    /** Die sechs `.style.boxShadow`-Zuweisungen mit einem Wert, wie Schritt 8
     *  sie hinterlassen hat. `traeger`/`flaeche` sind NUR fuer die zwei Ringe
     *  gesetzt: ihr Traegerelement steht im CSS und seine Flaeche ist damit
     *  lesbar (siehe Test "die Flaeche beider Ringe steht so im CSS"). Die
     *  vier Sprungmarken sitzen an wechselnden Orten und werden in der
     *  Aktenlage als Minimum ueber vier neutrale Flaechen gefuehrt — sie sind
     *  hier im Bestand, aber nicht in der Rechnung. */
    const JS_MARKEN = [
        {
            datei: 'features/encounters/encounters-render.js',
            zeile: 528,
            wert: '0 0 20px var(--glow-gold), 0 0 8px var(--glow-gold)',
            art: 'sprungmarke'
        },
        {
            datei: 'features/locations/locations-render.js',
            zeile: 368,
            wert: '0 0 20px var(--glow-gold), 0 0 8px var(--glow-gold)',
            art: 'sprungmarke'
        },
        {
            datei: 'features/npcs/npc-render.js',
            zeile: 390,
            wert: '0 0 20px var(--glow-gold), 0 0 8px var(--glow-gold)',
            art: 'sprungmarke'
        },
        {
            datei: 'systems/entity-links.js',
            zeile: 437,
            wert: '0 0 20px var(--glow-gold), 0 0 8px var(--glow-gold)',
            art: 'sprungmarke'
        },
        {
            datei: 'ui/actions/entity-actions.js',
            zeile: 373,
            wert: 'var(--ring-gold), 0 0 12px var(--glow-gold)',
            art: 'ring',
            traeger: '.quest-item',
            flaeche: '--bg-card'
        },
        {
            datei: 'systems/undo.js',
            zeile: 778,
            wert: 'var(--ring-gold), 0 0 12px var(--glow-gold)',
            art: 'ring',
            traeger: '.session-card',
            flaeche: '--bg-card'
        }
    ];

    /** Alle `.style.boxShadow = '<wert>'` mit nicht-leerem Wert, mit Datei,
     *  Zeile und Wert. Die sechs Ruecknahmen (`= ''`) fallen heraus. */
    function jsMarken() {
        const out = [];
        sourceJs().forEach(f => {
            const rel = path.relative(REPO, f.name).split(path.sep).join('/');
            for (const m of f.content.matchAll(/\.style\.boxShadow\s*=\s*(['"`])([\s\S]*?)\1/g)) {
                const wert = m[2].trim();
                if (!wert) continue;
                out.push({
                    datei: rel,
                    zeile: f.content.slice(0, m.index).split('\n').length,
                    wert
                });
            }
        });
        return out;
    }

    const schluessel22 = e => `${e.datei}:${e.zeile}`;

    test('der Bestand ist der gemessene: sechs JS-Marken, vier Sprungmarken und zwei Ringe', () => {
        const ist = jsMarken();
        expect(ist.map(e => `${schluessel22(e)} ${e.wert}`).sort()).toEqual(
            JS_MARKEN.map(e => `${schluessel22(e)} ${e.wert}`).sort()
        );
        expect(JS_MARKEN.filter(e => e.art === 'ring').length).toBe(2);
        expect(JS_MARKEN.filter(e => e.art === 'sprungmarke').length).toBe(4);
    });

    test('die Flaeche beider Ringe steht so im CSS, wie die Aktenlage sie rechnet', () => {
        const regeln = [];
        cssFiles.forEach(f => regelnMitRumpf(f.content).forEach(r => regeln.push(r)));
        const abweichung = JS_MARKEN.filter(e => e.art === 'ring').map(e => {
            const treffer = regeln.filter(r => r.sel.split(',').some(s => s.trim() === e.traeger));
            // `deklaration()` und nicht ein eigener Ausdruck: der Praefixschutz
            // dort haelt `background-image` von `background` getrennt.
            const hg = treffer.map(r => deklaration(r.rumpf, 'background')).filter(Boolean);
            return hg.includes(`var(${e.flaeche})`)
                ? null
                : `${e.datei} {${e.traeger}} — erwartet background: var(${e.flaeche}), ` +
                      `gefunden ${JSON.stringify(hg)}`;
        });
        expect(abweichung.filter(Boolean).sort()).toEqual([]);
    });

    /* ===================================================================
       (b) DIE RECHNUNG — Verbunddeckung und Abstand, aus den Tokens
       =================================================================== */

    /** Der Mischanteil eines `--glow-*`- oder `--ring-*`-Tokens. `--ring-gold`
     *  steht in jedem der vier Theme-Bloecke, `--glow-gold` genau einmal im
     *  Basis-`:root` und folgt dem Theme allein ueber `var(--gold)` — deshalb
     *  wird es nicht aus `palette()` gelesen, sondern aus der Datei. */
    function anteilVon(text) {
        const m = text.match(
            /color-mix\(\s*in srgb\s*,\s*var\(--[\w-]+\)\s*([\d.]+)%\s*,\s*transparent\s*\)/
        );
        return m ? parseFloat(m[1]) / 100 : 1.0;
    }

    function glowAnteil() {
        const m = VARIABLES.match(/--glow-gold\s*:\s*([^;]+);/);
        if (!m) throw new Error('R-22: --glow-gold nicht in variables.css gefunden');
        return anteilVon(m[1]);
    }

    /** Die Deckung der zwei uebereinanderliegenden Lagen von
     *  `var(--ring-gold), 0 0 12px var(--glow-gold)`. Zwei halbdurchsichtige
     *  Lagen derselben Farbe decken zusammen 1-(1-a1)(1-a2) — nicht a1+a2.
     *  In Contrast traegt der Ring volles Gold, damit ist der Verbund 1. */
    function verbunddeckung(theme) {
        const ring = anteilVon(WCAG.palette(theme)['--ring-gold'] || '');
        return 1 - (1 - ring) * (1 - glowAnteil());
    }

    /** Abstand des Rings zu seiner Traegerflaeche, bei der Deckung `d`. */
    function ringAbstand22(e, theme, d) {
        const p = WCAG.palettes()[theme];
        const fl = p[e.flaeche];
        return +WCAG.ratio(WCAG.mixOver(p['--gold'], d, fl), fl).toFixed(2);
    }

    test('die Verbunddeckung ist 0,575 in drei Themes und 1,00 in Contrast', () => {
        expect(glowAnteil()).toBe(0.5);
        const ist = {};
        WCAG.THEMES.forEach(t => (ist[t] = +verbunddeckung(t).toFixed(4)));
        expect(ist).toEqual({ dark: 0.575, light: 0.575, sepia: 0.575, contrast: 1.0 });
    });

    test('die vier Zahlen der Ringzeile sind gerechnet die der Aktenlage', () => {
        const ring = JS_MARKEN.find(e => e.datei === 'ui/actions/entity-actions.js');
        const vorher = WCAG.THEMES.map(t => ringAbstand22(ring, t, 1.0).toFixed(2));
        const nachher = WCAG.THEMES.map(t => ringAbstand22(ring, t, verbunddeckung(t)).toFixed(2));
        // Gemessen 2026-09-30, unabhaengig nachgerechnet in der Pruefung W3-D
        // Runde 1. Die vorher-Zeile ist volldeckendes Gold auf --bg-card.
        expect(vorher).toEqual(['8.28', '3.25', '6.58', '13.46']);
        expect(nachher).toEqual(['3.61', '1.90', '2.66', '13.46']);

        // Und dieselben acht Zahlen stehen so in der Akte — Rechnung und
        // Tabelle sind EINE Aussage, nicht zwei.
        const komma = a => a.map(v => v.replace('.', ','));
        const nenntAlle = arr => W3F01_ZEILEN.some(z => komma(arr).every(v => z.includes(v)));
        expect({ vorher: nenntAlle(vorher), nachher: nenntAlle(nachher) }).toEqual({
            vorher: true,
            nachher: true
        });
    });

    /* ===================================================================
       (c) DIE FETTDRUCK-KONVENTION DER TABELLE
       =================================================================== */

    /** Die Marken-Tabelle aus Teil D, Zeile fuer Zeile. Erkannt an ihrem
     *  Kopf `| Marke | | dark | light | sepia | contrast |`. Leer, wenn die
     *  Tabelle fehlt — dann geht die Zusicherung darunter rot. */
    function markenTabelle() {
        const i = W3F01_ZEILEN.findIndex(z => /^\|\s*Marke\s*\|\s*\|\s*dark\s*\|/.test(z));
        if (i < 0) return [];
        const out = [];
        for (let j = i + 1; j < W3F01_ZEILEN.length && W3F01_ZEILEN[j].trim().startsWith('|'); j++) {
            out.push(W3F01_ZEILEN[j]);
        }
        return out;
    }

    test('jeder Wert unter 3,00 in der Marken-Tabelle ist fett, jeder darueber nicht', () => {
        const zeilen = markenTabelle();
        // Gegenprobe gegen eine gruene, leere Ratsche: sechs Wertzeilen plus
        // die Trennzeile sind der gemessene Bestand.
        expect(zeilen.length).toBeGreaterThanOrEqual(6);

        const offen = [];
        let zahlen = 0;
        zeilen.forEach(z => {
            z.split('|')
                .slice(1, -1)
                .forEach(zelle => {
                    const m = zelle.trim().match(/^(\*\*)?(\d+,\d{2})(\*\*)?$/);
                    if (!m) return;
                    zahlen++;
                    const wert = Number(m[2].replace(',', '.'));
                    const fett = !!m[1] && !!m[3];
                    if (wert < SCHWELLE_NICHTTEXT && !fett) {
                        offen.push(`${m[2]} liegt unter 3:1 und ist NICHT fett — ${z.trim()}`);
                    }
                    if (wert >= SCHWELLE_NICHTTEXT && fett) {
                        offen.push(`${m[2]} liegt ueber 3:1 und IST fett — ${z.trim()}`);
                    }
                });
        });
        // 24 Zahlen: sechs Wertzeilen zu je vier Themes.
        expect(zahlen).toBe(24);
        expect({ anzahl: offen.length, stichprobe: offen.sort() }).toEqual({
            anzahl: R22_ZIEL,
            stichprobe: []
        });
    });

    /* ===================================================================
       (d) WELCHE THEMES DIE SICHTPROBE NENNEN MUSS — gerechnet
       =================================================================== */

    test('jedes Theme, in dem der Ring unter 3:1 faellt, steht namentlich in Sichtpunkt D3', () => {
        expect(W3F01).not.toBe('');
        const ring = JS_MARKEN.find(e => e.datei === 'ui/actions/entity-actions.js');
        const durchfall = WCAG.THEMES.filter(
            t => ringAbstand22(ring, t, verbunddeckung(t)) < SCHWELLE_NICHTTEXT
        );
        // Gerechnet, nicht behauptet: Light UND Sepia. Beide traten mit dieser
        // Umstellung von "haelt" auf "haelt nicht" ueber (3,25 -> 1,90 und
        // 6,58 -> 2,66); Sepia ist mit Faktor 0,40 der groessere Sturz und
        // fehlte in der ersten Fassung von D3.
        expect(durchfall).toEqual(['light', 'sepia']);

        const d3 = W3F01_ZEILEN.filter(z => /^\|\s*D3\s*\|/.test(z));
        expect(d3.length).toBe(1);
        const NAME = { dark: 'Dark', light: 'Light', sepia: 'Sepia', contrast: 'Contrast' };
        const offen = durchfall
            .filter(t => !new RegExp(`\\b${NAME[t]}\\b`).test(d3[0]))
            .map(
                t =>
                    `D3 nennt ${NAME[t]} nicht, obwohl der Ring dort ` +
                    `${ringAbstand22(ring, t, verbunddeckung(t)).toFixed(2)} liest`
            );
        expect({ anzahl: offen.length, stichprobe: offen.sort() }).toEqual({
            anzahl: R22_ZIEL,
            stichprobe: []
        });
    });

    /* ===================================================================
       (e) DIE UNERREICHBARE STELLE — an den Quellbaum gebunden
       =================================================================== */

    /** Kommentare zu Leerraum, Zeilenumbrueche erhalten — damit die Zeilen-
     *  nummern stimmen. Ohne diesen Schritt zaehlte der Sammler unten den
     *  Kommentar, der die Unerreichbarkeit ERKLAERT, als deren Widerlegung:
     *  genau das ist beim ersten Lauf passiert. Eine Erwaehnung ist kein
     *  Setzer. */
    const ohneKommentare = (text, html) =>
        text
            .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
            .replace(html ? /<!--[\s\S]*?-->/g : /(?!)/g, m => m.replace(/[^\n]/g, ' '))
            .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));

    /** Setzt irgendwo im Baum etwas `data-note-date`? Gezaehlt werden nur
     *  SETZENDE Formen — ein Attribut in einer Vorlage oder Zeichenkette,
     *  `setAttribute` oder `dataset.noteDate` —, und die EINE lesende Abfrage
     *  in `systems/undo.js` faellt heraus. Bleibt nichts uebrig, ist der
     *  Zweig in `goToNote()` tot. */
    const SETZER_RE =
        /data-note-date\s*=|setAttribute\(\s*['"`]data-note-date|dataset\s*\.\s*noteDate\s*=/g;

    /** Die setzenden Stellen EINES Textes. Einzeln, damit die Selbstprobe
     *  unten sie mit Beispielen fuettern kann, ohne den Baum zu lesen. */
    function setzerIn(rel, roh) {
        const out = [];
        const inhalt = ohneKommentare(roh, rel.endsWith('.html'));
        const zeilen = inhalt.split('\n');
        for (const m of inhalt.matchAll(SETZER_RE)) {
            const nr = inhalt.slice(0, m.index).split('\n').length;
            // Die lesende Abfrage traegt dieselbe Zeichenfolge im Selektor.
            // Sie ist der Grund fuer die Pruefung, nicht ihr Gegenstand.
            if (/querySelector|\.matches\(|\.closest\(/.test(zeilen[nr - 1])) continue;
            out.push(`${rel}:${nr}`);
        }
        return out;
    }

    function noteDateSetzer() {
        const out = [];
        const pruefe = (rel, roh) => out.push(...setzerIn(rel, roh));
        sourceJs().forEach(f =>
            pruefe(path.relative(REPO, f.name).split(path.sep).join('/'), f.content)
        );
        const vorlagen = path.join(REPO, 'assets', 'templates');
        if (fs.existsSync(vorlagen)) {
            fs.readdirSync(vorlagen)
                .filter(n => n.endsWith('.html'))
                .forEach(n =>
                    pruefe(`assets/templates/${n}`, fs.readFileSync(path.join(vorlagen, n), 'utf8'))
                );
        }
        return out;
    }

    test('solange kein Setzer fuer data-note-date existiert, fuehrt die Akte die Stelle als unerreichbar', () => {
        expect(W3F01).not.toBe('');
        const ring = JS_MARKEN.find(e => e.datei === 'systems/undo.js');
        const setzer = noteDateSetzer();
        const anker = `${ring.datei}:${ring.zeile}`;
        const gefuehrt = W3F01_ZEILEN.some(z => z.includes(anker) && /unerreichbar/i.test(z));

        const offen = [];
        if (setzer.length === 0 && !gefuehrt) {
            offen.push(
                `${anker} ist unerreichbar (kein Setzer fuer data-note-date im Baum), aber ` +
                    'keine Zeile von W3-F-01 nennt den Anker zusammen mit "unerreichbar" — ' +
                    'die Runde liest eine ausbleibende Marke dann als "zu schwach" statt ' +
                    'als "gar nicht da"'
            );
        }
        if (setzer.length > 0 && gefuehrt) {
            offen.push(
                `${anker} ist wieder erreichbar (Setzer: ${setzer.join(', ')}), aber W3-F-01 ` +
                    'fuehrt die Stelle weiter als unerreichbar — der Eintrag hat sich ueberlebt'
            );
        }
        expect({ anzahl: offen.length, stichprobe: offen }).toEqual({
            anzahl: R22_ZIEL,
            stichprobe: []
        });
    });

    /* ===================================================================
       (f) SELBSTPROBE DER RECHNUNG, nicht ihres Ergebnisses
       =================================================================== */

    test('anteilVon() liest color-mix und gibt bei Volldeckung 1,00', () => {
        expect(anteilVon('0 0 0 3px color-mix(in srgb, var(--gold) 15%, transparent)')).toBe(0.15);
        expect(anteilVon('color-mix(in srgb, var(--gold) 50%, transparent)')).toBe(0.5);
        expect(anteilVon('0 0 0 3px var(--gold)')).toBe(1.0);
    });

    test('setzerIn() trennt Erwaehnung, Abfrage und echten Setzer', () => {
        // Eine Erwaehnung im Kommentar ist KEIN Setzer — sonst widerlegt der
        // erklaerende Kommentar in goToNote() seine eigene Aussage.
        expect(setzerIn('probe.js', '/* data-note-date="x" gibt es nicht */')).toEqual([]);
        expect(setzerIn('probe.js', '// noteDate = 1;')).toEqual([]);
        // In der Vorlage ist der HTML-Kommentar der Kommentar, in der .js
        // nicht — deshalb haengt die Maskierung an der Endung.
        expect(setzerIn('p.html', '<!-- data-note-date="x" -->')).toEqual([]);
        expect(setzerIn('p.html', '<div data-note-date="3">')).toEqual(['p.html:1']);
        // Die lesende Abfrage faellt heraus, der Setzer nicht.
        expect(setzerIn('probe.js', 'document.querySelector(`[data-note-date="${d}"]`);')).toEqual(
            []
        );
        expect(setzerIn('probe.js', 'el.setAttribute("data-note-date", d);')).toEqual(['probe.js:1']);
        expect(setzerIn('probe.js', 'el.dataset.noteDate = d;')).toEqual(['probe.js:1']);
        expect(setzerIn('probe.js', '`<div data-note-date="${n.date}">`')).toEqual(['probe.js:1']);
        // Und die Zeilennummer bleibt trotz maskierter Kommentare richtig.
        expect(setzerIn('probe.js', '/* a\nb */\nel.dataset.noteDate = d;')).toEqual(['probe.js:3']);
    });

    test('zwei halbdurchsichtige Lagen decken 1-(1-a)(1-b), nicht a+b', () => {
        // 0,15 + 0,50 waeren 0,65 und ergaeben in Sepia 2,97 — knapp UEBER der
        // Schwelle und damit ein anderes Urteil. Die Formel ist hier die
        // Entscheidung, nicht Beiwerk.
        const verbund = (a, b) => +(1 - (1 - a) * (1 - b)).toFixed(4);
        expect(verbund(0.15, 0.5)).toBe(0.575);
        expect(verbund(1.0, 0.5)).toBe(1.0);
        expect(verbund(0, 0.5)).toBe(0.5);
    });
});

/* ===========================================================================
   Design-Handoff v3, Welle 3 — R-23: die Restposten der Wellen 1 und 2,
   beziffert gefuehrt (Ratsche)
   ===========================================================================
   ZUR NUMMER. Hoechste vergebene ist R-22; diese heisst deshalb R-23.

   WOGEGEN SIE STEHT. Schritt 9 raeumt drei Reste der Wellen 1 und 2 ab, und
   ueber KEINEN davon urteilte bisher eine Ratsche — obwohl alle drei in R-18
   stehen. Der Grund ist R-18s eigene Bauart: sie rechnet ueber die
   Dreierliste --bg-card/--bg-dark/--bg-elevated (D-2) und NICHT ueber die
   Flaeche, auf der die Regel wirklich sitzt. Das hat drei Folgen, und jede
   ist eine Luecke:

   (a) `.backup-entry-restore:hover` liest bei R-18 4,54 und ist gruen. In
       Wirklichkeit ist der Knopf nur waehrend des Ueberfahrens seiner ZEILE
       sichtbar, und die Zeile fuellte sich dabei mit --bg-hover. Dort liest
       dieselbe Toenung 4,06 · 4,12 · 4,21 · 4,42 — in allen vier Themes
       darunter. Wer die Fuellung zurueckschreibt, faellt lautlos dorthin
       zurueck: R-18 sieht --bg-hover nicht, und R-04 sieht die Zeilenregel
       nicht, weil sie keine eigene Tinte setzt.

   (b) `.fdp-die.d20` ist bei R-18 eine benannte Ausnahme. Ihre Zahlen stehen
       seit Welle 2 Schritt 7 im Kommentar der Regel selbst — und genau da
       stand eine davon FALSCH: 3,71 statt 3,72, abgeschnitten statt
       gerundet. Ein Kommentar mit vier Zahlen je Zeile, den niemand
       nachrechnet, ist keine Belegkette, sondern eine Behauptung.

   (c) `.pwa-install-btn` hatte Hover UNGEDECKELT und Aktiv GEDECKELT. Beide
       halten 4,5, also schweigt jede Kontrastratsche — aber in Light und
       Sepia deckelt --tint-max auf 7 %, die gedrueckte Flaeche wurde damit
       BLASSER als die ueberfahrene und die Zustandsleiter stand auf dem
       Kopf: der Abstand zur Ruheflaeche las ueberfahren 1,14 und gedrueckt
       nur 1,07 (Light) bzw. 1,19 gegen 1,11 (Sepia). Eine verkehrte Leiter
       ist kein Kontrastmangel; sie faellt durch jedes Raster, das nur
       Schwellen prueft.

   (d) DIE VIERTE LUECKE IST DIE SCHWERSTE und ist beim Schreiben von (a)
       aufgefallen: der Knopf aus (a) trug in seinem Markup
       `style="color: var(--red); border-color: var(--red);"`. Ein Inline-Stil
       schlaegt JEDEN Selektor. Die Tintenkorrektur der Welle 2 von --red auf
       --red-text an dieser Regel ist damit NIE GERENDERT WORDEN — R-18 las
       die Regel, die Akte fuehrte den Punkt als geschlossen, und gemalt wurde
       die ganze Zeit die alte Farbe. Ueber der Zeilenflaeche liest die Regel
       5,52 · 5,55 · 5,32 · 6,35, das Markup aber 4,10 · 4,35 · 3,88 · 4,41.
       Teil (4) prueft deshalb ZUERST, dass kein Inline-Stil die Tinte setzt:
       eine gerechnete Reihe zu einer Farbe, die nicht erscheint, ist keine
       Absicherung, sondern ihr Gegenteil.

   IHR MITTEL IST EIN ETIKETT. Jede gefuehrte Groesse traegt im CSS eine
   Zeile der Form

       R-23: <Etikett>  <dark> · <light> · <sepia> · <contrast>

   (Etikett und Zahlenreihe durch mindestens zwei Leerzeichen getrennt) und
   diese Ratsche RECHNET die vier Zahlen aus variables.css und der jeweiligen
   Regel neu nach, statt sie abzuschreiben. Die Menge ist in beide Richtungen
   geschlossen: ein Etikett ohne Rechnung ist ein Befund, eine Rechnung ohne
   Zeile im CSS auch. Damit kann weder eine Zahl im Kommentar veralten noch
   eine Regel sich aendern, ohne dass ihr Kommentar widerspricht. Die 3,71
   aus (b) waere so nie entstanden.

   WAS SIE AUS DEM CSS LIEST UND NICHT SETZT: die Tinten (aus den
   Grundregeln), die Toenungsstopps (aus den Zustandsregeln), die
   Zeilenflaeche der Sicherungsliste (aus `.backup-entry`), die Farbe des
   Umrisses (aus `.backup-entry:hover`) und die sechs Attributtokens (aus den
   `.dms-attr-item`-Regeln). Fest verdrahtet sind nur die TRAEGER, und jeder
   mit Grund: --bg-card fuer den Wuerfelknopf (`background: linear-gradient`
   ist die Kurzschreibweise und setzt background-color auf transparent
   zurueck; dahinter liegt .floating-dice-panel mit 98 % --bg-card — der
   Unterschied ist in Teil (3) auf 0,01 gepinnt), die D-2-Dreierliste fuer den
   Kopfzeilenknopf der PWA (er sitzt an keiner einzelnen Regel), und
   --bg-hover fuer die Gegenrechnung in (a) — die Flaeche, die Weg E3 gerade
   entfernt, muss danach weiter rechenbar bleiben, sonst verliert der Befund
   seine Zahl.

   AUSGANGSWERTE AM 2026-09-30, HEAD c017e76 — FUENF rote Zusicherungen, jede
   mit der Zahl, die sie gemeldet hat:
     (2) 13 Etiketten gefuehrt, 0 davon im CSS gefunden.
     (3) beide Verlaufsstopps ungedeckelt; die Goldtinte liest auf ihnen
         6,64 · 3,42 · 3,72 · 11,57, also in Light UND Sepia unter 4,5.
     (4) `.backup-entry:hover` fuellt mit var(--bg-hover) und meldet den
         Zustand ausschliesslich darueber (kein Umriss). Der Knopf liest auf
         dieser Flaeche 4,06 · 4,12 · 4,21 · 4,42 — in allen vier Themes
         darunter. Die Inline-Pruefung aus (d) ist einen Commit spaeter
         dazugekommen und war ihrerseits rot: eine Stelle
         (`file-backup-ui.js`), die `color` UND `border-color` inline setzt.
         ZWEITER NACHTRAG (Pruefung W3-E, Runde 1): die Geometriepruefung des
         Umrisses ist noch einen Commit spaeter dazugekommen und war ebenfalls
         rot. `.backup-entry:hover` fuehrte keinen `outline-offset`, der Ring
         lag also AUSSERHALB des Rahmenkastens und seine senkrechten Segmente
         im 24px-Polster von `.modal` — einem themenblinden Literal, nicht
         --bg-card. Gegen diese Flaeche liest var(--gold-dim)
         5,27 · 3,01 · 1,57 · 7,93, in sepia also 1,57 statt der gefuehrten
         9,17. Die Reihe war richtig gerechnet und gegen die falsche Flaeche
         gehalten — dieselbe Fehlerklasse, die diese Ratsche an dice.css
         selbst als ihren Ertrag meldet.
     (5) `.pwa-install-btn:hover` ungedeckelt; die Leiter steht in Light
         (1,14 gegen 1,07) und Sepia (1,19 gegen 1,11) auf dem Kopf.
     (7) W2-D-06 und W2-B-05 nennen sich in der Stand-Angabe weiter offen;
         drei gerechnete Reihen und die gezaehlte 6 fehlen in der Akte.
   Teil (1) und (6) sind bei der Geburt GRUEN, und das ist ausgesprochen:
   (1) ist die Selbstprobe der Rechenwege, (6) haelt einen Zustand fest, den
   Welle 3 nicht angetastet hat (keine der 9 inset-Lagen liegt auf einer
   Attributflaeche). Ein Teil, der bei der Geburt gruen ist, beweist nichts
   ueber die Aenderung — er verhindert ihren Rueckschritt.
   =========================================================================== */
describe('R-23 — die Restposten der Wellen 1 und 2, beziffert gefuehrt (Ratsche)', () => {
    const SCHWELLE = 4.5;
    const SCHWELLE_NICHTTEXT = 3.0;

    /** Dieselben drei Traegerflaechen wie in R-04, R-11, R-14 und R-18 (D-2). */
    const D2 = ['var(--bg-card)', 'var(--bg-dark)', 'var(--bg-elevated)'];

    const AKTENLAGE_PFAD = path.join(REPO, '.planning', 'HANDOFF-V3-OFFENE-PUNKTE.md');
    const AKTENLAGE = fs.readFileSync(AKTENLAGE_PFAD, 'utf8');

    const pals = WCAG.palettes();
    const alias = aliasSchicht();
    const P = t => ({ ...pals[t], ...alias });
    const komma = x => x.toFixed(2).replace('.', ',');
    const reihe = f => WCAG.THEMES.map(t => komma(f(t))).join(' · ');
    const gerundet = x => Number(x.toFixed(2));

    function inhalt(name) {
        const f = cssFiles.find(x => x.name === name);
        if (!f) throw new Error(`R-23: ${name} liegt nicht in assets/styles`);
        return f.content;
    }

    /** Alle Regeln mit genau diesem Selektorteil — es sind mehrere, sobald ein
     *  @media-Block denselben Selektor nachschaerft (`.pwa-install-btn` und
     *  `.backup-entry` tun das beide). */
    function regeln(name, sel) {
        return regelnMitRumpf(inhalt(name)).filter(r =>
            r.sel
                .split(',')
                .map(s => s.trim())
                .includes(sel)
        );
    }

    /** Der Wert, der in der Kaskade gewinnt: die LETZTE Regel dieses Selektors,
     *  die die Eigenschaft ueberhaupt setzt. Die erste zu nehmen waere bei
     *  `.pwa-install-btn` falsch, die einzige zu verlangen bei `.backup-entry`
     *  ein Fehlalarm. */
    function letzteDeklaration(name, sel, prop) {
        const treffer = regeln(name, sel);
        if (!treffer.length) throw new Error(`R-23: ${name} hat keine Regel "${sel}"`);
        let wert = null;
        treffer.forEach(r => {
            const d = deklaration(r.rumpf, prop);
            if (d) wert = d;
        });
        return wert;
    }

    /** Klammergenaue Abgrenzung der color-mix-Ausdruecke eines Wertes, in
     *  Textreihenfolge. Eigene Fassung und keine Anleihe bei R-18: dessen
     *  `mixAusdruecke` steht in dessen describe-Rumpf. Das ist ein PARSER und
     *  keine Norm — bei einer LISTE waere eine zweite Fassung genau der
     *  Fehler, den W3-D fuer `ERLAUBT` benannt hat. */
    function mixStopps(wert) {
        const out = [];
        const re = /color-mix\s*\(/gi;
        let m;
        while ((m = re.exec(wert))) {
            let tiefe = 0;
            let i = m.index + m[0].length - 1;
            for (; i < wert.length; i++) {
                if (wert[i] === '(') tiefe++;
                else if (wert[i] === ')') {
                    tiefe--;
                    if (!tiefe) break;
                }
            }
            if (tiefe === 0) out.push(wert.slice(m.index, i + 1));
        }
        return out;
    }

    const DECKEL = /min\(\s*\d+(?:\.\d+)?%\s*,\s*var\(\s*--tint-max\s*\)\s*\)/i;

    /** Dieselbe Lage ohne Deckel. Die Regel NENNT ihre eigene Staerke weiter —
     *  min() deckelt, es setzt nicht gleich —, die ungedeckelte Zahl bleibt
     *  also aus dem CSS rechenbar und muss nicht abgeschrieben werden. */
    const ohneDeckel = stopp =>
        stopp.replace(/min\(\s*(\d+(?:\.\d+)?%)\s*,\s*var\(\s*--tint-max\s*\)\s*\)/gi, '$1');

    function grundfarbe(ausdruck, theme) {
        const g = WCAG.resolve(ausdruck, P(theme));
        if (!g) throw new Error(`R-23: ${ausdruck} ist in ${theme} nicht aufloesbar`);
        return g;
    }

    /** Das Feld, das `ausdruck` ueber `grund` ergibt; ausdruck === null heisst
     *  blanker Grund. */
    function feld(ausdruck, grund, theme) {
        if (ausdruck === null) return grundfarbe(grund, theme);
        const f = WCAG.resolveOver(ausdruck, P(theme), grundfarbe(grund, theme));
        if (!f) throw new Error(`R-23: ${ausdruck} ueber ${grund} ist in ${theme} nicht aufloesbar`);
        return f;
    }

    /** Das schlechteste Verhaeltnis einer Tinte ueber mehrere Toenungen und
     *  mehrere Traeger — dieselbe Form wie R-18s `verhaeltnisse()`. */
    function minVerhaeltnis(tinte, toenungen, gruende, theme) {
        const ti = grundfarbe(tinte, theme);
        let min = Infinity;
        toenungen.forEach(x => {
            gruende.forEach(g => {
                min = Math.min(min, WCAG.ratio(ti, feld(x, g, theme)));
            });
        });
        return gerundet(min);
    }

    // -----------------------------------------------------------------------
    // Die drei Stellen, ausschliesslich aus dem CSS gelesen
    // -----------------------------------------------------------------------

    /** W2-D-06: die zwei Rotstopps des W20-Verlaufs, Kopf zuerst. */
    function d20Stopps() {
        const stopps = mixStopps(
            letzteDeklaration('dice.css', '.fdp-die.d20', 'background(?:-color)?') || ''
        );
        if (stopps.length !== 2) {
            throw new Error(`R-23: .fdp-die.d20 hat ${stopps.length} Verlaufsstopps, erwartet 2`);
        }
        return stopps;
    }
    const d20Tinte = () => letzteDeklaration('dice.css', '.fdp-die', 'color');
    /** Die Flaeche hinter dem Wuerfel. Begruendung im Kopf; der Abstand zur
     *  Panelflaeche ist in Teil (3) auf 0,01 gepinnt. */
    const D20_GRUND = 'var(--bg-card)';

    /** W2-D-05a: die Zeile der Sicherungsliste und ihr Knopf. */
    const zeilenFlaeche = () =>
        letzteDeklaration('file-backup.css', '.backup-entry', 'background(?:-color)?');
    const knopfTinte = () => letzteDeklaration('file-backup.css', '.backup-entry-restore', 'color');
    function knopfToenung() {
        const stopps = mixStopps(
            letzteDeklaration('file-backup.css', '.backup-entry-restore:hover', 'background(?:-color)?') ||
                ''
        );
        if (stopps.length !== 1) {
            throw new Error(
                `R-23: .backup-entry-restore:hover hat ${stopps.length} Toenungen, erwartet 1`
            );
        }
        return stopps[0];
    }
    /** Die Farbe des Umrisses, mit dem die Zeile den Zustand jetzt meldet. */
    function umrissFarbe() {
        const roh = letzteDeklaration('file-backup.css', '.backup-entry:hover', 'outline');
        if (!roh) throw new Error('R-23: .backup-entry:hover setzt keinen outline');
        const m = roh.match(/var\(\s*--[\w-]+\s*\)/);
        if (!m) throw new Error(`R-23: im outline "${roh}" steht kein Rollentoken`);
        return m[0];
    }

    /** Der Versatz des Umrisses in px, aus dem CSS gelesen; 0, wenn die Regel
     *  keinen nennt (das ist der CSS-Standard).
     *
     *  WARUM DIESE ZAHL ZAEHLT — und zwar mehr als die Farbe. `outline` liegt
     *  bei Versatz 0 einen Pixel AUSSERHALB des Rahmenkastens. `.backup-entry`
     *  ist ein Grid in der Breite des Inhaltskastens von `.modal`, und `.modal`
     *  fuehrt `padding: 24px`. Die beiden senkrechten Segmente des Rings (je
     *  min. 44px hoch) und das untere der letzten Zeile (die traegt
     *  `border-bottom: none`) liegen damit IM POLSTER DES MODALS, und dessen
     *  einzige Flaechendeklaration im ganzen Baum ist das themenblinde Literal
     *  `rgba(26, 26, 26, 0.95)` (dmscreen.css, gefuehrte Ausnahme W2-C-01) —
     *  kein Theme-Block ueberschreibt sie. Gegen diese Flaeche liest
     *  var(--gold-dim) 5,27 · 3,01 · 1,57 · 7,93: in Sepia ist der Ring seitlich
     *  UNSICHTBAR, in Light steht er mit 3,01 auf der Schwelle. Die Reihe
     *  5,21 · 5,09 · 9,17 · 8,51, die diese Ratsche fuehrt, gilt fuer
     *  --bg-card — und die ist nur dann die wirkliche Flaeche, wenn der Ring
     *  INNEN liegt. Ein negativer Versatz stellt genau das her; zugleich deckt
     *  er das eigene border-bottom der Zeile und nimmt die Doppellinie mit. */
    /** Die Farbe der Zeilenoberkante: das border-bottom, an das das obere
     *  Segment des eingerueckten Rings von aussen stoesst. Aus dem CSS gelesen,
     *  nicht getippt. */
    function zeilenKante() {
        const roh = letzteDeklaration('file-backup.css', '.backup-entry', 'border-bottom');
        if (!roh) throw new Error('R-23: .backup-entry setzt kein border-bottom');
        const m = roh.match(/var\(\s*--[\w-]+\s*\)/);
        if (!m) throw new Error(`R-23: im border-bottom "${roh}" steht kein Rollentoken`);
        return m[0];
    }

    function umrissVersatz() {
        const roh = letzteDeklaration('file-backup.css', '.backup-entry:hover', 'outline-offset');
        if (!roh) return 0;
        const m = roh.match(/-?\d+(?:\.\d+)?/);
        if (!m) throw new Error(`R-23: im outline-offset "${roh}" steht keine Laenge`);
        return parseFloat(m[0]);
    }

    /** Das `style`-Attribut des Elements, das `klasse` traegt — aus dem
     *  Quelltext, ueber Zeilengrenzen hinweg. Gebraucht, weil ein Inline-Stil
     *  JEDEN Selektor schlaegt: eine Tinte, die die Regel setzt und das Markup
     *  ueberschreibt, wird von R-18 und von den Rechnungen hier als gemalt
     *  gefuehrt, obwohl sie nie erscheint. Genau das war bei
     *  `.backup-entry-restore` der Fall (Befund in Welle 3 Schritt 9). */
    function inlineStilVon(klasse) {
        const out = [];
        const quellen = sourceJs()
            .map(f => ({
                name: path.relative(REPO, f.name).split(path.sep).join('/'),
                content: f.content
            }))
            .concat(tplFiles.map(f => ({ name: `assets/templates/${f.name}`, content: f.content })));
        quellen.forEach(f => {
            let i = 0;
            while ((i = f.content.indexOf(klasse, i)) !== -1) {
                const auf = f.content.lastIndexOf('<', i);
                const zu = f.content.indexOf('>', i);
                i += klasse.length;
                if (auf === -1 || zu === -1) continue;
                const tag = f.content.slice(auf, zu + 1);
                // Nur echte Klassennennungen, keine Treffer in einem Selektor
                // oder Kommentar: das Tag muss die Klasse in class="…" fuehren.
                if (!new RegExp(`class\\s*=\\s*["'\`][^"'\`]*\\b${klasse}\\b`).test(tag)) continue;
                const m = tag.match(/style\s*=\s*"([^"]*)"/);
                out.push({
                    datei: f.name,
                    zeile: f.content.slice(0, auf).split('\n').length,
                    stil: m ? m[1] : null
                });
            }
        });
        return out;
    }

    /** Der eine getoente Verlaufsstopp der Lair-Zeile. Die Unterzeile
     *  "Lair Action" sitzt in der vierten Rasterspalte, also ueber dem
     *  helleren Ende des Verlaufs; gerechnet wird trotzdem gegen den GETOENTEN
     *  Stopp, weil das der schlechtere Fall ist und weil die Regelgruppe
     *  daneben (.init-entry.lair .init-name) es seit Welle 2 genauso haelt. */
    function lairStopp() {
        const stopps = mixStopps(
            letzteDeklaration('initiative.css', '.init-entry.lair', 'background(?:-color)?') || ''
        );
        if (stopps.length !== 1) {
            throw new Error(`R-23: .init-entry.lair hat ${stopps.length} Toenungen, erwartet 1`);
        }
        return stopps[0];
    }

    /** W2-D-05b: die zwei Sprossen des PWA-Knopfs. */
    const pwaTinte = () => letzteDeklaration('pwa.css', '.pwa-install-btn', 'color');
    function pwaStopp(sel) {
        const stopps = mixStopps(letzteDeklaration('pwa.css', sel, 'background(?:-color)?') || '');
        if (stopps.length !== 1) {
            throw new Error(`R-23: ${sel} hat ${stopps.length} Toenungen, erwartet 1`);
        }
        return stopps[0];
    }

    /** W1-B-01: die sechs Attributtokens, aus den Regeln gelesen statt getippt. */
    function attrTokens() {
        const out = new Set();
        for (const m of inhalt('dmscreen.css').matchAll(
            /\.dms-attr-item\.[\w-]+\s+\.dms-attr-abbr\s*\{[^}]*color\s*:\s*var\(\s*(--attr-[\w-]+)\s*\)/g
        )) {
            out.add(m[1]);
        }
        return [...out].sort();
    }
    function attrMin(grund, theme) {
        const tokens = attrTokens();
        if (tokens.length !== 6) {
            throw new Error(`R-23: ${tokens.length} Attributtokens gefunden, erwartet 6`);
        }
        let min = Infinity;
        tokens.forEach(tok => {
            min = Math.min(
                min,
                WCAG.ratio(grundfarbe(`var(${tok})`, theme), grundfarbe(grund, theme))
            );
        });
        return gerundet(min);
    }

    // -----------------------------------------------------------------------
    // DIE GEFUEHRTEN GROESSEN. Schluessel = Etikett im CSS-Kommentar.
    // -----------------------------------------------------------------------
    const GROESSEN = {
        'W2-D-06 Verlaufskopf ungedeckelt': t =>
            minVerhaeltnis(d20Tinte(), [ohneDeckel(d20Stopps()[0])], [D20_GRUND], t),
        'W2-D-06 Verlaufskopf gedeckelt': t =>
            minVerhaeltnis(d20Tinte(), [d20Stopps()[0]], [D20_GRUND], t),
        'W2-D-06 Verlaufsfuss ungedeckelt': t =>
            minVerhaeltnis(d20Tinte(), [ohneDeckel(d20Stopps()[1])], [D20_GRUND], t),
        'W2-D-06 Verlaufsfuss gedeckelt': t =>
            minVerhaeltnis(d20Tinte(), [d20Stopps()[1]], [D20_GRUND], t),
        'W2-D-06 min beider Stopps gedeckelt': t =>
            minVerhaeltnis(d20Tinte(), d20Stopps(), [D20_GRUND], t),

        'W2-D-05 Knopf auf --bg-hover': t =>
            minVerhaeltnis(knopfTinte(), [knopfToenung()], ['var(--bg-hover)'], t),
        'W2-D-05 Knopf auf der Zeilenflaeche': t =>
            minVerhaeltnis(knopfTinte(), [knopfToenung()], [zeilenFlaeche()], t),
        'W2-D-05 Umriss gegen die Zeilenflaeche': t =>
            gerundet(WCAG.ratio(grundfarbe(umrissFarbe(), t), grundfarbe(zeilenFlaeche(), t))),
        /* Die ZWEITE Flaeche des eingerueckten Rings. Innen stoesst er ueberall
           an die Zeilenflaeche; von aussen stoesst sein oberes Segment an das
           border-bottom der Zeile darueber, und das traegt var(--border). Beide
           Nachbarn gehoeren zur Rechnung, sonst waere die Behauptung "haelt
           gegen die Flaeche, auf der er liegt" wieder nur zur Haelfte belegt —
           genau der Fehler, den der eingerueckte Versatz gerade behebt. */
        'W2-D-05 Umriss gegen die Zeilenoberkante': t =>
            gerundet(WCAG.ratio(grundfarbe(umrissFarbe(), t), grundfarbe(zeilenKante(), t))),

        'W2-D-05 pwa hover ungedeckelt': t =>
            minVerhaeltnis(pwaTinte(), [ohneDeckel(pwaStopp('.pwa-install-btn:hover'))], D2, t),
        'W2-D-05 pwa hover gedeckelt': t =>
            minVerhaeltnis(pwaTinte(), [pwaStopp('.pwa-install-btn:hover')], D2, t),
        'W2-D-05 pwa aktiv gedeckelt': t =>
            minVerhaeltnis(pwaTinte(), [pwaStopp('.pwa-install-btn:active')], D2, t),

        'W1-B-01 Attributfarben auf --bg-dark': t => attrMin('var(--bg-dark)', t),
        'W1-B-01 Attributfarben auf --bg-card': t => attrMin('var(--bg-card)', t),

        /* Die drei Tinten, die Teil (8) aus dem Markup ins CSS geholt hat.
           Jede wird gegen die Flaeche gerechnet, auf der sie WIRKLICH liegt,
           und jede Flaeche kommt aus derselben Datei wie die Tinte. */
        'W3-E Lair-Unterzeile auf der Lair-Toenung': t =>
            minVerhaeltnis(
                letzteDeklaration('initiative.css', '.init-entry.lair .init-type', 'color'),
                [lairStopp(), null],
                ['var(--bg-card)'],
                t
            ),
        'W3-E Nachteil-Etikett auf der Detailflaeche': t =>
            gerundet(
                WCAG.ratio(
                    grundfarbe(letzteDeklaration('loot.css', '.si-tag-v.si-tag-neg', 'color'), t),
                    grundfarbe(letzteDeklaration('loot.css', '.si-details', 'background'), t)
                )
            ),
        'W3-E Loeschring auf der Ruheflaeche': t =>
            gerundet(
                WCAG.ratio(
                    grundfarbe(
                        letzteDeklaration('dashboard.css', '.qref-btn-del', 'border-color'),
                        t
                    ),
                    grundfarbe(letzteDeklaration('dashboard.css', '.qref-btn', 'background'), t)
                )
            )
    };

    /** Alle Kommentarzeilen der gefuehrten Form in assets/styles. */
    function etikettZeilen() {
        const out = [];
        cssFiles.forEach(f => {
            f.content.split(/\r?\n/).forEach((l, i) => {
                const m = l.match(
                    /R-23:\s*(\S.*?)\s{2,}(\d+,\d{2})\s*·\s*(\d+,\d{2})\s*·\s*(\d+,\d{2})\s*·\s*(\d+,\d{2})\s*$/
                );
                if (m) {
                    out.push({
                        datei: f.name,
                        zeile: i + 1,
                        etikett: m[1].trim(),
                        zahlen: [m[2], m[3], m[4], m[5]].join(' · ')
                    });
                }
            });
        });
        return out;
    }

    /* =====================================================================
       (1) SELBSTPROBE der Rechenwege — bei der Geburt gruen
       ===================================================================== */
    test('(1) der Rechenweg besteht die kanonischen WCAG-Paare und liest den Deckel', () => {
        WCAG.selfTest().forEach(c => expect(c.ist).toBe(c.soll));
        // Der Deckel wird als Deckel gelesen und nicht als Gleichsetzung: die
        // eigene Staerke bleibt im Ausdruck stehen und ist wieder freizulegen.
        expect(
            ohneDeckel('color-mix(in srgb, var(--red) min(20%, var(--tint-max)), transparent)')
        ).toBe('color-mix(in srgb, var(--red) 20%, transparent)');
        expect(DECKEL.test('min(12%, var(--tint-max))')).toBe(true);
        expect(DECKEL.test('12%')).toBe(false);
        // Und die Klammerabgrenzung zaehlt die Stopps eines Verlaufs richtig,
        // obwohl min() ein eigenes Komma mitbringt.
        expect(
            mixStopps(
                'linear-gradient(135deg, color-mix(in srgb, var(--a) min(1%, var(--b)), transparent), ' +
                    'color-mix(in srgb, var(--c) 2%, transparent))'
            ).length
        ).toBe(2);
    });

    /* =====================================================================
       (2) DIE ETIKETTEN — jede Zahl im CSS ist nachgerechnet
       ===================================================================== */
    test('(2) jede R-23-Zeile im CSS traegt die gerechneten Zahlen, die Menge ist geschlossen', () => {
        const befunde = [];
        const offen = new Set(Object.keys(GROESSEN));
        etikettZeilen().forEach(z => {
            const rechnung = GROESSEN[z.etikett];
            if (!rechnung) {
                befunde.push(
                    `${z.datei}:${z.zeile} — Etikett "${z.etikett}" ist in GROESSEN nicht gefuehrt`
                );
                return;
            }
            offen.delete(z.etikett);
            let soll;
            try {
                soll = reihe(rechnung);
            } catch (e) {
                befunde.push(`${z.datei}:${z.zeile} "${z.etikett}" — nicht rechenbar: ${e.message}`);
                return;
            }
            if (soll !== z.zahlen) {
                befunde.push(
                    `${z.datei}:${z.zeile} "${z.etikett}" — im Kommentar ${z.zahlen}, gerechnet ${soll}`
                );
            }
        });
        [...offen]
            .sort()
            .forEach(k =>
                befunde.push(
                    `"${k}" steht in GROESSEN, aber in keinem CSS-Kommentar — die Zahl ist unbelegt`
                )
            );
        expect(befunde.sort()).toEqual([]);
    });

    /* =====================================================================
       (3) W2-D-06 — beide Verlaufsstopps gedeckelt, Knopf haelt auf SEINER Flaeche
       ===================================================================== */
    test('(3) die zwei Rotstopps des W20-Knopfs sind gedeckelt und halten 4,5 auf --bg-card', () => {
        const befunde = [];
        const stopps = d20Stopps();
        stopps.forEach((s, i) => {
            if (!DECKEL.test(s)) {
                befunde.push(`Verlaufsstopp ${i + 1} ist ungedeckelt: ${s.replace(/\s+/g, ' ')}`);
            }
        });
        WCAG.THEMES.forEach(t => {
            const min = minVerhaeltnis(d20Tinte(), stopps, [D20_GRUND], t);
            if (min < SCHWELLE) {
                befunde.push(`${t}: ${d20Tinte()} auf den Stopps nur ${komma(min)} < ${SCHWELLE}`);
            }
        });
        // Die Vereinfachung "Traeger = --bg-card" ist gepinnt, nicht
        // angenommen: dahinter liegt .floating-dice-panel mit 98 % --bg-card.
        const panel = letzteDeklaration('dice.css', '.floating-dice-panel', 'background(?:-color)?');
        WCAG.THEMES.forEach(t => {
            // Die Panelflaeche ist selbst halbdurchsichtig und braucht deshalb
            // ihren eigenen Grund: das Panel sitzt position:fixed ueber der
            // Seite, also ueber --bg-dark.
            const panelHex = WCAG.resolveOver(panel, P(t), grundfarbe('var(--bg-dark)', t));
            if (!panelHex) {
                befunde.push(`${t}: die Panelflaeche "${panel}" ist nicht aufloesbar`);
                return;
            }
            const ti = grundfarbe(d20Tinte(), t);
            let ueberPanel = Infinity;
            stopps.forEach(s => {
                const f = WCAG.resolveOver(s, P(t), panelHex);
                if (f) ueberPanel = Math.min(ueberPanel, WCAG.ratio(ti, f));
            });
            ueberPanel = gerundet(ueberPanel);
            const ueberKarte = minVerhaeltnis(d20Tinte(), stopps, [D20_GRUND], t);
            // Gerundet verglichen, nicht rechnerisch: 3,72 - 3,71 ergibt in
            // Gleitkomma 0,010000000000000231 und waere sonst ein Fehlalarm.
            const abweichung = gerundet(Math.abs(ueberPanel - ueberKarte));
            if (abweichung > 0.01) {
                befunde.push(
                    `${t}: Panelflaeche und --bg-card weichen um ` +
                        `${komma(abweichung)} ab (${komma(ueberPanel)} gegen ` +
                        `${komma(ueberKarte)}) — die Vereinfachung im Kopf traegt nicht mehr`
                );
            }
        });
        expect(befunde).toEqual([]);
    });

    /* =====================================================================
       (4) W2-D-05a — die Zeile toent nicht, sie meldet ueber einen Umriss (E3)
       ===================================================================== */
    test('(4) die Zeile der Sicherungsliste meldet ohne Fuellung, der Knopf haelt 4,5', () => {
        const befunde = [];
        const hover = regeln('file-backup.css', '.backup-entry:hover');
        if (hover.length !== 1) {
            befunde.push(`.backup-entry:hover — ${hover.length} Regeln, erwartet genau 1`);
        } else {
            const fuellung = deklaration(hover[0].rumpf, 'background(?:-color)?');
            if (fuellung) {
                befunde.push(
                    `.backup-entry:hover:${hover[0].zeile} toent noch (background: ${fuellung}) — ` +
                        `der Knopf traegt seine Toenung dann auf dieser Flaeche`
                );
            }
            if (!deklaration(hover[0].rumpf, 'outline')) {
                befunde.push(
                    `.backup-entry:hover:${hover[0].zeile} meldet den Zustand nicht — ohne Fuellung ` +
                        `UND ohne Umriss ist das Ueberfahren unsichtbar`
                );
            }
            /* DER RING MUSS INNEN LIEGEN, sonst rechnet die Reihe unten gegen
               die falsche Flaeche. Begruendung und Geometrie an
               umrissVersatz(); die Zahlen hier sind die gemessene Aussenreihe
               gegen das themenblinde Modal-Literal. */
            const versatz = umrissVersatz();
            if (!(versatz < 0)) {
                befunde.push(
                    `.backup-entry:hover:${hover[0].zeile} fuehrt outline-offset ${versatz} — der Ring ` +
                        `liegt damit ausserhalb des Rahmenkastens und seine senkrechten Segmente ` +
                        `im 24px-Polster von .modal, dessen einzige Flaeche das themenblinde ` +
                        `rgba(26, 26, 26, 0.95) ist: aussen liest ${umrissFarbe()} dort ` +
                        `5,27 · 3,01 · 1,57 · 7,93, in sepia also 1,57 < ${SCHWELLE_NICHTTEXT}. ` +
                        `Die gefuehrte Reihe gegen ${zeilenFlaeche()} gilt erst bei negativem Versatz`
                );
            }
        }
        /* DIE GERECHNETE TINTE MUSS AUCH DIE GEMALTE SEIN. Ein Inline-Stil
           schlaegt jeden Selektor; setzt das Markup `color` oder
           `border-color`, ist die Tinte der CSS-Regel Fiktion — und R-18 wie
           die Reihe unten rechnen dann mit einer Farbe, die nie erscheint.
           Genau so war es: der Knopf trug `style="color: var(--red);
           border-color: var(--red);"`, die Tintenkorrektur der Welle 2 auf
           var(--red-text) ist also nie gerendert worden. Gemalt wurde
           4,10 · 4,35 · 3,88 · 4,41 statt 5,52 · 5,55 · 5,32 · 6,35. */
        const stellen = inlineStilVon('backup-entry-restore');
        if (!stellen.length) {
            befunde.push(
                'backup-entry-restore kommt in keinem Markup vor — die Pruefung des Inline-Stils ' +
                    'liefe leer, und eine leere Pruefung ist keine'
            );
        }
        stellen.forEach(s => {
            const gesetzt = (s.stil || '')
                .split(';')
                .map(x => x.trim())
                .filter(x => /^(color|border-color)\s*:/i.test(x));
            if (gesetzt.length) {
                befunde.push(
                    `${s.datei}:${s.zeile} setzt die Tinte des Knopfs INLINE ` +
                        `(${gesetzt.join('; ')}) und schlaegt damit die CSS-Regel — die Reihe ` +
                        `unten waere dann Fiktion`
                );
            }
        });

        try {
            const flaeche = zeilenFlaeche();
            WCAG.THEMES.forEach(t => {
                const u = GROESSEN['W2-D-05 Umriss gegen die Zeilenflaeche'](t);
                if (u < SCHWELLE_NICHTTEXT) {
                    befunde.push(
                        `${t}: der Umriss haelt gegen ${flaeche} nur ${komma(u)} < ${SCHWELLE_NICHTTEXT}`
                    );
                }
                const o = GROESSEN['W2-D-05 Umriss gegen die Zeilenoberkante'](t);
                if (o < SCHWELLE_NICHTTEXT) {
                    befunde.push(
                        `${t}: der Umriss haelt gegen die Zeilenoberkante nur ${komma(o)} < ${SCHWELLE_NICHTTEXT}`
                    );
                }
                const k = GROESSEN['W2-D-05 Knopf auf der Zeilenflaeche'](t);
                if (k < SCHWELLE) {
                    befunde.push(
                        `${t}: ${knopfTinte()} auf seiner Toenung ueber ${flaeche} nur ${komma(k)}`
                    );
                }
            });
        } catch (e) {
            befunde.push(`nicht rechenbar: ${e.message}`);
        }
        expect(befunde.sort()).toEqual([]);
    });

    /* =====================================================================
       (5) W2-D-05b — die PWA-Leiter ist gedeckelt und bleibt richtig herum
       ===================================================================== */
    test('(5) Hover und Aktiv des PWA-Knopfs halten 4,5, die Leiter steht nicht auf dem Kopf', () => {
        const befunde = [];
        const h = pwaStopp('.pwa-install-btn:hover');
        const a = pwaStopp('.pwa-install-btn:active');
        if (!DECKEL.test(h)) befunde.push(`.pwa-install-btn:hover ist ungedeckelt: ${h}`);
        if (!DECKEL.test(a)) befunde.push(`.pwa-install-btn:active ist ungedeckelt: ${a}`);

        /** Wie weit eine Toenung von der blanken Traegerflaeche abweicht. Die
         *  Sprosse "gedrueckt" darf nie NAEHER an der Ruhe liegen als
         *  "ueberfahren" — genau das war in Light und Sepia der Fall. */
        const abstand = (stopp, t) =>
            gerundet(WCAG.ratio(feld(stopp, 'var(--bg-card)', t), grundfarbe('var(--bg-card)', t)));

        let gleich = 0;
        WCAG.THEMES.forEach(t => {
            const vh = GROESSEN['W2-D-05 pwa hover gedeckelt'](t);
            const va = GROESSEN['W2-D-05 pwa aktiv gedeckelt'](t);
            if (vh < SCHWELLE) befunde.push(`${t}: Hover haelt nur ${komma(vh)} < ${SCHWELLE}`);
            if (va < SCHWELLE) befunde.push(`${t}: Aktiv haelt nur ${komma(va)} < ${SCHWELLE}`);
            const ah = abstand(h, t);
            const aa = abstand(a, t);
            if (aa < ah) {
                befunde.push(
                    `${t}: die Leiter steht auf dem Kopf — gedrueckt ${komma(aa)} liegt naeher an ` +
                        `der Ruheflaeche als ueberfahren ${komma(ah)}`
                );
            }
            if (aa === ah) gleich++;
        });
        // Fallen die beiden Flaechen in einem Theme zusammen (in Light und
        // Sepia tun sie das, weil --tint-max dort 7 % ist), muss der Zustand
        // ueber etwas anderes als die Flaeche gemeldet werden — dasselbe
        // Mittel, mit dem .link-chip:hover den Deckel ausgehalten hat.
        if (gleich) {
            const rumpf = regeln('pwa.css', '.pwa-install-btn:active')
                .map(r => r.rumpf)
                .join(';');
            const andere = rumpf
                .split(';')
                .map(s => s.trim())
                .filter(s => s && !/^background(-color)?\s*:/i.test(s));
            if (!andere.length) {
                befunde.push(
                    `in ${gleich} Theme(s) sind Hover- und Aktivflaeche zeichengleich, und ` +
                        `.pwa-install-btn:active setzt ausser background nichts — der gedrueckte ` +
                        `Zustand ist dort nicht zu sehen`
                );
            }
        }
        expect(befunde.sort()).toEqual([]);
    });

    /* =====================================================================
       (6) W1-B-01 — keine Hoehenstufe als inset auf einer Attributflaeche
       ===================================================================== */
    test('(6) die zwei Attributflaechen tragen keinen Schatten, alle sechs Werte halten 4,5', () => {
        const befunde = [];
        [
            ['dmscreen.css', '.dms-attr-item', 'var(--bg-dark)'],
            ['dashboard.css', '.qref-row', 'var(--bg-card)']
        ].forEach(([f, sel, soll]) => {
            const ist = letzteDeklaration(f, sel, 'background(?:-color)?');
            if (ist !== soll) {
                befunde.push(`${f} ${sel} traegt ${ist} statt ${soll} — die Rechnung unten gilt dann nicht`);
            }
            regeln(f, sel).forEach(r => {
                const s = deklaration(r.rumpf, 'box-shadow');
                if (s) {
                    befunde.push(
                        `${f}:${r.zeile} ${sel} traegt box-shadow: ${s.replace(/\s+/g, ' ')} — eine ` +
                            `Lage auf dieser Flaeche verschiebt die sechs Attributwerte (W1-B-01)`
                    );
                }
            });
        });
        WCAG.THEMES.forEach(t => {
            [
                ['--bg-dark', GROESSEN['W1-B-01 Attributfarben auf --bg-dark'](t)],
                ['--bg-card', GROESSEN['W1-B-01 Attributfarben auf --bg-card'](t)]
            ].forEach(([g, v]) => {
                if (v < SCHWELLE) {
                    befunde.push(`${t}: Attributfarben auf ${g} nur ${komma(v)} < ${SCHWELLE}`);
                }
            });
        });
        expect(befunde.sort()).toEqual([]);
    });

    /* =====================================================================
       (7) DIE AKTENLAGE — kein Punkt mehr ohne entschiedene Zahl
       ===================================================================== */
    function abschnitt(marke) {
        const i = AKTENLAGE.indexOf(`## ${marke} `);
        if (i < 0) return '';
        const j = AKTENLAGE.indexOf('\n## ', i + 1);
        return AKTENLAGE.slice(i, j < 0 ? AKTENLAGE.length : j);
    }

    test('(7) die vier Punkte des Schritts 9 fuehren ihre entschiedene Zahl', () => {
        const befunde = [];
        [
            ['W2-D-06', ['W2-D-06 min beider Stopps gedeckelt']],
            [
                'W2-D-05',
                [
                    'W2-D-05 Knopf auf der Zeilenflaeche',
                    'W2-D-05 pwa hover gedeckelt',
                    'W2-D-05 pwa aktiv gedeckelt'
                ]
            ],
            [
                'W1-B-01',
                ['W1-B-01 Attributfarben auf --bg-dark', 'W1-B-01 Attributfarben auf --bg-card']
            ]
        ].forEach(([marke, etiketten]) => {
            const text = abschnitt(marke);
            if (!text) {
                befunde.push(`${marke} — kein Abschnitt in der Aktenlage`);
                return;
            }
            etiketten.forEach(e => {
                let z;
                try {
                    z = reihe(GROESSEN[e]);
                } catch (err) {
                    befunde.push(`${marke} — "${e}" ist nicht rechenbar: ${err.message}`);
                    return;
                }
                if (!text.includes(z)) {
                    befunde.push(`${marke} — die gerechnete Reihe "${z}" (${e}) steht nicht im Abschnitt`);
                }
            });
        });

        // W2-B-05 fuehrt keine Kontrastzahl, sondern einen Bestand: die drei
        // Zahlen, die dem Punkt gefehlt haben. Sie werden hier GEZAEHLT und
        // nicht abgeschrieben. Kommentare werden zeilentreu geleert, damit die
        // Nennung in einem Kommentar (tools.css) nicht als Nutzung zaehlt.
        const definitionen = (
            inhalt('variables.css').match(
                /^\s*--(?:overlay-(?:faint|weak|mid|strong|heavy)|scrim-\d+)\s*:/gm
            ) || []
        ).length;
        let nutzungen = 0;
        let blenden = 0;
        cssFiles.forEach(f => {
            const ohne = f.content.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
            nutzungen += (ohne.match(/var\(\s*--(?:overlay-[\w-]+|scrim-\d+)\s*\)/g) || []).length;
            blenden += (ohne.match(/var\(\s*--scrim-\d+\s*\)/g) || []).length;
        });
        const b05 = abschnitt('W2-B-05');
        if (!b05) {
            befunde.push('W2-B-05 — kein Abschnitt in der Aktenlage');
        } else {
            [
                [definitionen, 'Definitionen'],
                [nutzungen, 'Nutzungen per var()'],
                [blenden, 'Modalblenden']
            ].forEach(([n, was]) => {
                if (!new RegExp(`\\*\\*${n}\\*\\*`).test(b05)) {
                    befunde.push(
                        `W2-B-05 — die gezaehlte Zahl ${n} (${was}) steht nicht fett im Abschnitt`
                    );
                }
            });
        }

        // Und die Stand-Angabe darf den Punkt nicht mehr offen nennen. Zwei
        // Zeilen, weil die Angabe in dieser Akte oft umbricht.
        ['W2-D-06', 'W2-B-05'].forEach(marke => {
            const zeilen = abschnitt(marke).split('\n');
            const i = zeilen.findIndex(l => l.startsWith('**Stand:'));
            const stand = i < 0 ? '' : `${zeilen[i]} ${zeilen[i + 1] || ''}`;
            if (i < 0) {
                befunde.push(`${marke} — keine Stand-Angabe im Abschnitt`);
            } else if (/offen/i.test(stand)) {
                befunde.push(`${marke} — die Stand-Angabe nennt den Punkt weiter offen: ${stand.trim()}`);
            }
        });
        expect(befunde.sort()).toEqual([]);
    });

    /* =====================================================================
       (8) DIE INLINE-TINTE, BAUMWEIT — nicht mehr je Klasse
       =====================================================================
       Teil (4) prueft EINE Klasse (.backup-entry-restore) auf einen
       farbsetzenden Inline-Stil, weil dort einer gefunden wurde. Die Akte
       nannte die Frage fuer die ganze Familie ausdruecklich "nicht erhoben".
       Pruefung W3-E, Runde 1 hat sie erhoben, und sie war nicht leer: 259 Tags
       im Baum tragen class= UND style=, und DREI davon malten eine Farbe, die
       eine CSS-Regel derselben Klasse anders nennt:

         features/initiative.js       .init-type      color: var(--red)
             gegen initiative.css .init-type { color: var(--text-dim) }.
             Auf dem getoenten Verlaufsende der Lair-Zeile las das
             4,21 · 4,35 · 3,88 · 4,49 — in ALLEN VIER Themes unter 4,5, bei
             0.75em also gewoehnlicher Text. Drei CSS-Zeilen weiter steht
             .init-entry.lair .init-name { color: var(--red-text) }: die
             Wellen-Korrektur war am Geschwister angekommen und an der
             Unterzeile nicht, weil deren Tinte im JS stand.
         features/shops/shops-core.js .si-tag-v       color: var(--red)
             gegen loot.css .si-tag-v { color: var(--cyan) }. Auf .si-details
             (--bg-card) 4,62 · 4,83 · 4,29 · 4,72, Sepia darunter.
         systems/spellslots/quick-reference.js .qref-btn border-color: var(--red)
             schlug dauerhaft dashboard.css .qref-btn:hover { border-color:
             var(--gold) } — dieser Loeschknopf hatte in KEINEM Theme eine
             Hover-Kontur. Kein Kontrastmangel (--red gegen --bg-hover
             3,36 · 3,56 · 3,36 · 3,16), aber ein stumm abgeschalteter
             Zustandsmelder.

       WARUM ES KEINE RATSCHE GESEHEN HAT: F-19 zaehlt style=" ausschliesslich
       in assets/templates. JS-erzeugte Inline-Stile stehen in keinem
       Zaehlwerk, INLINE_MAX blieb beim Entfernen eines Stils darum zu Recht
       unberuehrt, und die Klasse war ungedeckt.

       WAS DIESER TEIL PRUEFT, und zwar als MENGE:
         (a) ABWEICHUNG — der Inline-Stil setzt eine Eigenschaft, die die
             BASISREGEL derselben Klasse mit einem anderen Wert setzt.
             "Basisregel" heisst: das Subjekt-Kompound des Selektors ist genau
             `.klasse`, ohne zweite Klasse, Pseudoklasse oder Attribut.
             Nachfahrenschreibweisen sind erlaubt (`.a .klasse` zaehlt).
         (b) TOTER ZUSTAND — eine Zustandsregel derselben Klasse
             (:hover/:focus/:focus-visible/:active) setzt die Eigenschaft. Ein
             Inline-Stil schlaegt sie dauerhaft, der Zustand ist stumm.
       Beides nur fuer STATISCHE Werte: enthaelt der Wert eine
       Template-Einsetzung, ist er nicht zu beurteilen und bleibt aussen vor
       (z.B. `${rarityInk}` in initiative-loot.js). Aus demselben Grund fallen
       Klassennamen mit `$` heraus.

       DIE LISTE IST IN BEIDE RICHTUNGEN GESCHLOSSEN, wie bei Teil (2): eine
       Stelle ohne Eintrag ist ein Befund, ein Eintrag ohne Stelle auch. Damit
       schrumpft die Liste mit jeder Behebung, statt als Altlast zu verwesen.
       Der Schluessel enthaelt bewusst KEINE Zeilennummer — Zeilennummern
       rotten (R-06 muss sie deshalb nachziehen); Datei, Klasse, Eigenschaft
       und Wert zusammen sind eindeutig genug und ueberleben jede Verschiebung.

       AUSGANGSWERTE AM 2026-09-30, HEAD 6d5c629 — rot mit 12 Abweichungen und
       1 totem Zustand gegen 9 gefuehrte Eintraege, also drei unentschuldigte
       Stellen (die zwei #ef4444-Knoepfe in modals-editors.html fallen auf
       EINEN Schluessel, deshalb 9 Eintraege fuer 10 geduldete Stellen).
       ===================================================================== */
    const INLINE_FARBPROPS = [
        'color',
        'background',
        'background-color',
        'border',
        'border-color',
        'border-top',
        'border-right',
        'border-bottom',
        'border-left',
        'outline',
        'outline-color',
        'box-shadow',
        'text-shadow'
    ];
    const INLINE_ZUSTANDSFORMEN = [':hover', ':focus', ':focus-visible', ':active'];

    /** Schluessel: `datei|.klasse|eigenschaft|wert`. Wert = warum die Stelle
     *  bleiben darf. Jeder Eintrag muss GEBRAUCHT werden. */
    const INLINE_TINTE_GEDULDET = {
        'assets/templates/header.html|.nav-tab|color|var(--purple)':
            'Der Debug-Eintrag der Systemgruppe im Navigationsmenue traegt bewusst einen ' +
            'eigenen Akzent statt --text-dim. Er ist ein data-action="call" und wird nie ' +
            '.active, kann die .active-Regel also auch nicht stumm schalten.',
        'assets/templates/header.html|.nav-tab|color|var(--cyan)':
            'Der Theme-Eintrag derselben Gruppe, dieselbe Begruendung.',
        'assets/templates/modals-editors.html|.color-swatch|border|1px dashed #666':
            'Das Feld "Keine Farbe" der Markerreihe zeigt seine eigene Abwesenheit durch den ' +
            'gestrichelten Rand. F-19 fuehrt die Swatches der Editorleiste namentlich als ' +
            'Ausnahme; das Markup der Leisten ist eingefroren.',
        'assets/templates/modals-editors.html|.editor-btn|color|#888':
            '"Format entfernen" in der Schwebeleiste ist gedaempft, damit es nicht wie ein ' +
            'Formatknopf liest. Eingefrorenes Editor-Testnetz.',
        'assets/templates/modals-editors.html|.editor-btn|color|#ef4444':
            'Die beiden loeschenden Knoepfe der Tabellen- und der Link-Kontextleiste. ' +
            'Eingefrorenes Editor-Testnetz.',
        'features/quests/quests-render.js|.btn|color|var(--on-gold)':
            'Der Verfolgen-Knopf setzt Flaeche UND Tinte in einem Zug ' +
            '(background: var(--gold); color: var(--on-gold)). --on-gold ist genau die Tinte, ' +
            'die fuer diese Flaeche gerechnet ist — kein Alleingang der Tinte.',
        'features/sessions/sessions.js|.session-arc-title|color|var(--text-dim)':
            'Die Sammelgruppe "Ohne Arc" ist kein Arc und tritt bewusst hinter die goldenen ' +
            'Arc-Titel zurueck.',
        'systems/entity-links.js|.link-chip|background|var(--bg-dark)':
            'Der Zaehlchip "+N" ist kein Link; er tritt aus der blauen Toenung der echten ' +
            'Chips heraus.',
        'systems/file-backup/file-backup-ui.js|.backup-status-text|color|var(--text-dim)':
            'Der Zustand "noch nicht eingerichtet" ist gegenueber dem eingerichteten bewusst ' +
            'gedaempft.'
    };

    /** Das Subjekt-Kompound eines Selektors: der letzte Teil vor dem Ende,
     *  ueber alle vier Kombinatoren getrennt. */
    const inlineSubjekt = sel => sel.split(/\s*[\s>+~]\s*/).filter(Boolean).pop() || '';

    /** Alle Regeln aller CSS-Dateien, flach — Teil (8) fragt nicht je Datei. */
    function inlineAlleRegeln() {
        const out = [];
        cssFiles.forEach(f =>
            regelnMitRumpf(f.content).forEach(r => out.push({ datei: f.name, ...r }))
        );
        return out;
    }

    /** Jedes Tag im Baum, das class= UND style= traegt. Dieselben Quellen wie
     *  inlineStilVon(), nur ohne Klassenfilter. */
    function inlineTags() {
        const out = [];
        const quellen = sourceJs()
            .map(f => ({
                name: path.relative(REPO, f.name).split(path.sep).join('/'),
                content: f.content
            }))
            .concat(tplFiles.map(f => ({ name: `assets/templates/${f.name}`, content: f.content })));
        quellen.forEach(f => {
            const re = /<[a-zA-Z][^>]*>/g;
            let m;
            while ((m = re.exec(f.content))) {
                const cm = m[0].match(/class\s*=\s*["'`]([^"'`]*)["'`]/);
                const sm = m[0].match(/style\s*=\s*"([^"]*)"/);
                if (!cm || !sm) continue;
                out.push({
                    datei: f.name,
                    zeile: f.content.slice(0, m.index).split('\n').length,
                    klassen: cm[1].split(/\s+/).filter(k => /^[\w-]+$/.test(k)),
                    stil: sm[1]
                });
            }
        });
        return out;
    }

    test('(8) kein Inline-Stil malt eine Farbe gegen die Regel seiner eigenen Klasse', () => {
        const regelnFlach = inlineAlleRegeln();
        const tags = inlineTags();
        // Die Erhebung selbst muss greifen: findet sie kein einziges Tag, laeuft
        // sie leer und eine leere Pruefung ist keine.
        expect(tags.length).toBeGreaterThan(100);

        const befunde = [];
        const gebraucht = new Set();
        const gesehen = new Set();

        tags.forEach(tag => {
            tag.stil
                .split(';')
                .map(x => x.trim())
                .filter(Boolean)
                .forEach(decl => {
                    const i = decl.indexOf(':');
                    if (i < 0) return;
                    const prop = decl.slice(0, i).trim().toLowerCase();
                    const wert = decl.slice(i + 1).trim();
                    if (!INLINE_FARBPROPS.includes(prop)) return;
                    if (wert.includes('${')) return; // dynamisch, nicht beurteilbar
                    tag.klassen.forEach(k => {
                        const paar = `${tag.datei}:${tag.zeile}|${k}|${prop}`;
                        if (gesehen.has(paar)) return;
                        const propRe = new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;}]+)`, 'i');
                        let abweichung = null;
                        let toterZustand = null;
                        regelnFlach.forEach(r => {
                            r.sel
                                .split(',')
                                .map(s => s.trim())
                                .forEach(s => {
                                    const sub = inlineSubjekt(s);
                                    const istBasis = sub === `.${k}`;
                                    const istZustand = INLINE_ZUSTANDSFORMEN.some(
                                        z => sub === `.${k}${z}`
                                    );
                                    if (!istBasis && !istZustand) return;
                                    const rm = r.rumpf.match(propRe);
                                    if (!rm) return;
                                    const cssWert = rm[1].trim();
                                    const info = `${r.datei}:${r.zeile} ${s} { ${prop}: ${cssWert} }`;
                                    if (
                                        istBasis &&
                                        cssWert.replace(/\s+/g, '') !== wert.replace(/\s+/g, '')
                                    ) {
                                        abweichung = abweichung || info;
                                    } else if (istZustand) {
                                        toterZustand = toterZustand || info;
                                    }
                                });
                        });
                        if (!abweichung && !toterZustand) return;
                        gesehen.add(paar);
                        const schluessel = `${tag.datei}|.${k}|${prop}|${wert}`;
                        if (INLINE_TINTE_GEDULDET[schluessel]) {
                            gebraucht.add(schluessel);
                            return;
                        }
                        befunde.push(
                            abweichung
                                ? `${tag.datei}:${tag.zeile} setzt .${k} { ${prop}: ${wert} } INLINE und ` +
                                  `weicht damit von ${abweichung} ab — gemalt wird der Inline-Wert, ` +
                                  `gerechnet wird ueber den der Regel`
                                : `${tag.datei}:${tag.zeile} setzt .${k} { ${prop}: ${wert} } INLINE und ` +
                                  `schlaegt damit dauerhaft ${toterZustand} — der Zustand ist stumm`
                        );
                    });
                });
        });

        Object.keys(INLINE_TINTE_GEDULDET)
            .filter(s => !gebraucht.has(s))
            .sort()
            .forEach(s =>
                befunde.push(
                    `"${s}" steht in INLINE_TINTE_GEDULDET, aber im Baum gibt es die Stelle nicht ` +
                        `(mehr) — die Liste muss schrumpfen, sonst verwest sie`
                )
            );

        expect(befunde.sort()).toEqual([]);
    });
});
