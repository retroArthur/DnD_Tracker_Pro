/**
 * Dokument-Konsistenz — die Zahlen in CLAUDE.md und docs/bugfixes.md
 *
 * Angefangen mit der CSS-Dateizahl (DOC-01..04), erweitert um die
 * Vorlagenzahl (DOC-05..07) und um die Kuerzeltabelle samt Bugfix-Katalog
 * (DOC-08..12, HILF).
 *
 * Anders als css-usage-report.test.js (das ein Werkzeug gegen Fixtures prueft)
 * IST hier der Tagesstand des Repos der Pruefgegenstand: das Verzeichnis
 * assets/styles/, die Hub-Datei assets/styles.css und CLAUDE.md selbst werden
 * vom echten Baum gelesen und gegeneinander gehalten. Anlass: Plan 15-02 hat
 * die CSS-Dateizahl in CLAUDE.md nur an EINER Stelle korrigiert und dabei auf
 * eine einzelne woertliche deutsche Zeichenkette gegrept (`grep -c "13 modulare
 * CSS-Dateien" CLAUDE.md == 0`) — zwei weitere Stellen im selben Dokument, eine
 * davon in englischer Formulierung, blieben unentdeckt falsch. DOC-02 ersetzt
 * diese Abnahmeform durch eine sprachunabhaengige Zahlpruefung.
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const STYLES_DIR = path.join(REPO, 'assets', 'styles');
const STYLES_HUB_PATH = path.join(REPO, 'assets', 'styles.css');
const CLAUDE_MD_PATH = path.join(REPO, 'CLAUDE.md');

// Der Struktur-Codeblock im Abschnitt "CSS Organization for New Features" wird
// ueber diese Konstante identifiziert: gesucht ist der eingezaeunte Codeblock,
// dessen Inhalt eine Zeile enthaelt, die GENAU mit diesem Marker beginnt.
const STRUCTURE_BLOCK_MARKER = 'assets/styles/';

// Baumverbinder-Zeichen, mit denen jeder Dateieintrag im Struktur-Codeblock
// beginnt (Unicode-Box-Zeichnung: ├── bzw. └──).
const TREE_CONNECTOR_PATTERN = /^[├└]─+\s*/;

const claudeMdContent = fs.readFileSync(CLAUDE_MD_PATH, 'utf8');
const hubContent = fs.readFileSync(STYLES_HUB_PATH, 'utf8');

// Gemessener Ausgangswert (2026-09-09, ls assets/styles/*.css | wc -l): 20
// CSS-Dateien, 20 @import-Zeilen im Hub. Diese Konstanten werden NICHT
// hartkodiert, sondern in jedem Testlauf frisch vom Baum erhoben — der
// Kommentar hier dokumentiert nur den Stand, gegen den DOC-01 zuletzt gruen
// war, und ersetzt keine Messung.
const measuredCssFileNames = fs
    .readdirSync(STYLES_DIR)
    .filter(f => f.endsWith('.css'));
const measuredCssFileCount = measuredCssFileNames.length;

// @import-Reihenfolge des Hubs — das ist zugleich die Kaskadenreihenfolge und
// die Sollreihenfolge des Struktur-Codeblocks (DOC-04).
const importFilenames = [...hubContent.matchAll(/@import\s+url\(\s*['"]styles\/([^'")]+)['"]\s*\)/g)].map(
    m => m[1]
);

/**
 * Findet alle eingezaeunten Codebloecke (```...```) in einem Markdown-Text
 * und liefert deren Inhalt (ohne die Zaunzeilen selbst).
 */
function extractFencedBlocks(markdown) {
    return [...markdown.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map(m => m[1]);
}

/**
 * Liefert genau die Bloecke, deren Inhalt eine Zeile enthaelt, die exakt mit
 * STRUCTURE_BLOCK_MARKER beginnt.
 */
function findStructureBlocks(markdown) {
    return extractFencedBlocks(markdown).filter(block =>
        block.split('\n').some(line => line.startsWith(STRUCTURE_BLOCK_MARKER))
    );
}

/**
 * Zieht aus einem Struktur-Codeblock die Eintragszeilen: jede Zeile, die mit
 * einem Baumverbinder beginnt und auf einen Dateinamen mit der Endung .css
 * fuehrt. Reihenfolge bleibt erhalten.
 */
function extractStructureCssEntries(blockContent) {
    return blockContent
        .split('\n')
        .filter(line => TREE_CONNECTOR_PATTERN.test(line))
        .map(line => {
            const rest = line.replace(TREE_CONNECTOR_PATTERN, '').trim();
            return rest.split(/\s+/)[0];
        })
        .filter(name => name.endsWith('.css'));
}

describe('DOC — CLAUDE.md widerspricht sich nicht ueber die CSS-Dateizahl', () => {
    test('DOC-01: Zahl der .css-Dateien in assets/styles/ entspricht der Zahl der @import-Zeilen in assets/styles.css', () => {
        // Verankerung, gegen die DOC-02/03/04 messen: ohne diesen Fall koennte
        // eine unvollstaendige Hub-Datei alle drei uebrigen Zusicherungen
        // gemeinsam verschieben, ohne dass es auffiele.
        expect(measuredCssFileCount).toBe(importFilenames.length);
    });

    test('DOC-02: jede Zahlenbehauptung ueber die CSS-Dateizahl in CLAUDE.md nennt die gemessene Zahl, sprachunabhaengig', () => {
        // Kandidatenzeilen: entweder die Zeichenfolge "assets/styles" oder der
        // Wortbestandteil "CSS-Datei" (case-insensitive) — die Einschraenkung
        // ist notwendig, weil dieselbe Tabelle eine Zeile tiefer eine Zahl
        // modularer HTML-Vorlagen nennt; die ist ab jetzt durch DOC-06
        // geschuetzt, nicht mehr eine ungeschuetzte Zahl wie zu dem Zeitpunkt,
        // als dieser Kommentar zuerst geschrieben wurde.
        const candidateLines = claudeMdContent
            .split('\n')
            .filter(line => line.includes('assets/styles') || /CSS-Datei/i.test(line));

        // (\d+)\s+modular\w* trifft "modular", "modulare" und "modularen"
        // gleichermassen und damit sowohl die englische als auch die deutsche
        // Sprachfassung — das ist die sprachunabhaengige Kernpruefung.
        const numberClaimPattern = /(\d+)\s+modular\w*/gi;
        const claims = [];
        candidateLines.forEach(line => {
            for (const match of line.matchAll(numberClaimPattern)) {
                claims.push(parseInt(match[1], 10));
            }
        });

        // BASE-01/empty: ein leerer Trefferlauf ist ein Fehlschlag, kein
        // stiller Erfolg — sonst wuerde eine kuenftige Umformulierung den
        // Waechter leer durchlaufen lassen.
        expect(claims.length).toBeGreaterThanOrEqual(3);

        claims.forEach(claim => {
            expect(claim).toBe(measuredCssFileCount);
        });
    });

    test('DOC-03: der Struktur-Codeblock listet genau so viele .css-Eintraege, wie Dateien vorhanden sind', () => {
        const structureBlocks = findStructureBlocks(claudeMdContent);
        // Bei mehreren Treffern waere nicht bestimmt, welcher Block geprueft
        // wird — GENAU EINER wird erwartet.
        expect(structureBlocks.length).toBe(1);

        const entries = extractStructureCssEntries(structureBlocks[0]);
        expect(entries.length).toBe(measuredCssFileCount);
    });

    test('DOC-04: die Dateinamen im Struktur-Codeblock stimmen in Menge UND Reihenfolge mit der @import-Reihenfolge des Hubs ueberein', () => {
        const structureBlocks = findStructureBlocks(claudeMdContent);
        expect(structureBlocks.length).toBe(1);

        const entries = extractStructureCssEntries(structureBlocks[0]);

        // BASE-01/encoding: vollstaendige Zeichenkettengleichheit je Eintrag,
        // nicht Teilstring-Treffer — toEqual auf Arrays vergleicht Element
        // fuer Element per ===, ein Praefixtreffer (z.B. "core.css" gegen
        // "dashboard-core.css") zaehlt also nicht als Gleichheit.
        expect(entries).toEqual(importFilenames);
    });
});

// Ladeliste der HTML-Vorlagen aus loader.js (DOC-05/DOC-06/DOC-07) — Anlass:
// 15-REVIEW.md WR-03/IN-06. Laut CLAUDE.md (Abschnitt "Single Source of Truth
// for Modules/Templates/CSS") ist diese Ladeliste die Einzelquelle fuer
// Vorlagen; build.py liest sie zur Bauzeit aus. Ein benannter regulaerer
// Ausdruck holt die Dateinamen aus den Eintraegen des TEMPLATES-Arrays.
const LOADER_JS_PATH = path.join(REPO, 'loader.js');
const TEMPLATES_DIR = path.join(REPO, 'assets', 'templates');
const BODY_HTML_PATH = path.join(REPO, 'assets', 'body.html');

const loaderContent = fs.readFileSync(LOADER_JS_PATH, 'utf8');
const bodyHtmlContent = fs.readFileSync(BODY_HTML_PATH, 'utf8');

// Gemessener Ausgangswert (2026-09-11, ls assets/templates/*.html | wc -l): 12
// HTML-Vorlagen. Wird NICHT hartkodiert, sondern in jedem Testlauf frisch vom
// Baum erhoben.
const measuredTemplateFileNames = fs
    .readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.html'));
const measuredTemplateFileCount = measuredTemplateFileNames.length;

// Benannter regulaerer Ausdruck auf die Eintraege des TEMPLATES-Arrays in
// loader.js, normalisiert auf den blossen Dateinamen.
const TEMPLATE_ENTRY_PATTERN = /'assets\/templates\/(?<filename>[a-z0-9-]+\.html)'/g;
const loaderTemplateFileNames = [...loaderContent.matchAll(TEMPLATE_ENTRY_PATTERN)].map(
    m => m.groups.filename
);

// Vorlagenpfade, die der Hinweiskommentar in assets/body.html aufzaehlt
// (DOC-07), normalisiert auf den blossen Dateinamen.
const BODY_HTML_TEMPLATE_PATTERN = /assets\/templates\/(?<filename>[a-z0-9-]+\.html)/g;
const bodyHtmlTemplateFileNames = [...bodyHtmlContent.matchAll(BODY_HTML_TEMPLATE_PATTERN)].map(
    m => m.groups.filename
);

describe('DOC — CLAUDE.md widerspricht sich nicht ueber die Vorlagenzahl', () => {
    test('DOC-05: Zahl und Namensmenge der .html-Dateien in assets/templates/ entsprechen der Ladeliste in loader.js', () => {
        // Anzahl UND Namensmenge — zwei gleich lange, aber inhaltlich
        // unterschiedliche Listen waeren sonst gruen, obwohl die
        // Einzelquellen-Regel des Projekts (CLAUDE.md, ARCH-01) verletzt
        // waere: eine im Verzeichnis liegende, aber nicht geladene Datei
        // zaehlte sonst stillschweigend mit. Reihenfolge wird bewusst NICHT
        // gefordert — die Ladeliste traegt eine sachlich begruendete
        // Sonderreihenfolge (F-07, view-welt vor view-tools), die das
        // Verzeichnis nicht abbildet.
        expect(measuredTemplateFileCount).toBe(loaderTemplateFileNames.length);
        expect([...measuredTemplateFileNames].sort()).toEqual(
            [...loaderTemplateFileNames].sort()
        );
    });

    test('DOC-06: jede Zahlenbehauptung ueber die Vorlagenzahl in CLAUDE.md nennt die gemessene Zahl, sprachunabhaengig', () => {
        // Kandidatenzeilen: entweder die Zeichenfolge "assets/templates" oder
        // der Wortbestandteil "HTML-Template(s)" (case-insensitive) — CSS-
        // Zeilen werden ausdruecklich ausgeschlossen, damit DOC-02 und DOC-06
        // sich nicht gegenseitig rot faerben.
        const candidateLines = claudeMdContent
            .split('\n')
            .filter(
                line =>
                    (line.includes('assets/templates') || /HTML-Templates?/i.test(line)) &&
                    !(line.includes('assets/styles') || /CSS-Datei/i.test(line))
            );

        // (\d+)\s+modular\w* trifft "modular", "modulare" und "modularen"
        // gleichermassen — dieselbe sprachunabhaengige Kernpruefung wie
        // DOC-02.
        const numberClaimPattern = /(\d+)\s+modular\w*/gi;
        const claims = [];
        candidateLines.forEach(line => {
            for (const match of line.matchAll(numberClaimPattern)) {
                claims.push(parseInt(match[1], 10));
            }
        });

        // BASE-01/empty: ein leerer Trefferlauf ist ein Fehlschlag, kein
        // stiller Erfolg.
        expect(claims.length).toBeGreaterThanOrEqual(1);

        claims.forEach(claim => {
            expect(claim).toBe(measuredTemplateFileCount);
        });
    });

    test('DOC-07: der Hinweiskommentar in assets/body.html listet dieselbe Vorlagenmenge wie die Ladeliste', () => {
        // BASE-01/encoding: vollstaendige Zeichenkettengleichheit je Eintrag.
        // Der Kommentar beschreibt sich selbst als nicht mehr direkt
        // verwendet (assets/body.html:1-2) — genau deshalb faellt er beim
        // Aendern der Ladeliste nicht automatisch auf, und genau deshalb ist
        // er laut 15-REVIEW.md (IN-06) die nachgewiesene Quelle der falschen
        // Zahl in CLAUDE.md.
        expect(bodyHtmlTemplateFileNames.length).toBe(loaderTemplateFileNames.length);
        expect([...bodyHtmlTemplateFileNames].sort()).toEqual(
            [...loaderTemplateFileNames].sort()
        );
    });
});
// ============================================================
// DIE KUERZELTABELLE UND DIE AKTEN (HILF, Einheit 2)
// ============================================================
//
// WARUM DIESE FAELLE. Dieselbe Krankheit wie bei DOC-02, zwei Dokumente
// weiter. Die Kuerzeltabelle in CLAUDE.md und der Bugfix-Katalog in
// docs/bugfixes.md sind die beiden Akten, aus denen ein spaeterer Leser
// erfaehrt, was die App mit der Tastatur tut und welche Fehler es dabei
// schon gab. Keine von beiden war bis hierher durch irgendeine Ratsche
// gedeckt — gemessen: CLAUDE.md wird im ganzen Baum nur von DIESER Datei
// als Daten gelesen (und dort nur fuer CSS- und Vorlagenzahlen),
// docs/bugfixes.md von keiner.
//
// WAS DABEI SCHIEFGEHT, BELEGT: der Katalog fuehrt an drei Stellen "21
// Call-Sites" von `document.execCommand` in `ui/editors/rich-text.js`,
// waehrend der Quellbaum seit Phase 9 NULL Aufrufe enthaelt und CLAUDE.md
// die Abloesung als abgeschlossen fuehrt. Und die Gruppenzeilen der
// Kuerzeltabelle nannten die Tasten, aber keine der Zahlen, die
// `tastatur-gruppen.spec.js` zusichert — eine Tabelle, die die Wirkung
// behauptet, ohne die Messung dahinter zu nennen.
//
// DIE QUELLE IST NIE DIE TABELLE. Jede Zahl unten kommt aus dem Code oder
// aus der Zusicherung eines Falls; die Dokumente werden dagegen gehalten,
// nie umgekehrt.
//
// ZUR FORM DER ZUSICHERUNGEN: Jest kennt das zweite Argument von
// `expect()` NICHT (das ist Playwright). Was der Fehlschlag nennen soll,
// steht darum IM verglichenen Wert — eine leere Liste als Sollwert, die
// Fundstellen als Istwert. Der Diff ist dann der Befund.

const BUGFIXES_MD_PATH = path.join(REPO, 'docs', 'bugfixes.md');
const KEYBOARD_GROUP_PATH = path.join(REPO, 'ui', 'keyboard-group.js');
const GROUP_SPEC_PATH = path.join(REPO, 'tests', 'e2e', 'features', 'tastatur-gruppen.spec.js');

const bugfixesMdContent = fs.readFileSync(BUGFIXES_MD_PATH, 'utf8');
const keyboardGroupSource = fs.readFileSync(KEYBOARD_GROUP_PATH, 'utf8');
const groupSpecSource = fs.readFileSync(GROUP_SPEC_PATH, 'utf8');

/**
 * Der Abschnitt "Keyboard Shortcuts" aus CLAUDE.md: von seiner Ueberschrift
 * bis zur naechsten Ueberschrift derselben Stufe. Die Tabelle UND der
 * Erlaeuterungsabsatz darunter gehoeren dazu — beide sind Teil derselben
 * Auskunft an den Leser.
 */
function extractKeyboardSection(markdown) {
    const lines = markdown.split('\n');
    const start = lines.findIndex(l => /^##\s+Keyboard Shortcuts\s*$/.test(l));
    if (start < 0) return '';
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
        if (/^##\s+/.test(lines[i])) {
            end = i;
            break;
        }
    }
    return lines.slice(start, end).join('\n');
}

const keyboardSection = extractKeyboardSection(claudeMdContent);

/**
 * Die Tasten, die `ui/keyboard-group.js` bedient — aus `GRUPPEN_TASTEN`
 * gelesen, nicht aus einer Liste hier. Ihre deutsche Schreibweise in der
 * Tabelle steht in TASTE_IM_DOKUMENT; eine Taste ohne Eintrag dort ist
 * KEIN stiller Erfolg, sondern der Auftrag, Zeile und Abbildung
 * nachzutragen (DOC-09).
 */
const GRUPPEN_TASTEN_PATTERN = /const\s+GRUPPEN_TASTEN\s*=\s*new\s+Set\(\[([\s\S]*?)\]\)/;
const gruppenTastenMatch = keyboardGroupSource.match(GRUPPEN_TASTEN_PATTERN);
const gruppenTasten = gruppenTastenMatch
    ? [...gruppenTastenMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1])
    : [];

const TASTE_IM_DOKUMENT = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Home: 'Pos1',
    End: 'Ende'
};

/**
 * Liest die Zahl aus einer `expect(<name>, …).toBe(<zahl>)`-Zusicherung.
 */
function leseZusicherung(quelle, name) {
    const treffer = quelle.match(new RegExp(`expect\\(\\s*${name},[^;]*?\\.toBe\\((\\d+)\\)`));
    return treffer ? parseInt(treffer[1], 10) : null;
}

/**
 * Die beiden Zahlen, die Fall (1) von `tastatur-gruppen.spec.js`
 * zusichert: Punkte im Dokument und Halte darunter. Sie sind der
 * gemessene Beleg fuer "ein Halt je Gruppe" und damit das, was die
 * Gruppenzeilen der Kuerzeltabelle nennen muessen.
 */
const gemessenePunkte = leseZusicherung(groupSpecSource, 'punkte');
const gemesseneHalte = leseZusicherung(groupSpecSource, 'halte');

describe('DOC — die Kuerzeltabelle in CLAUDE.md faellt nicht hinter die Gruppenmechanik zurueck', () => {
    test('DOC-08: die Gruppenzeilen nennen die Zahlen, die tastatur-gruppen.spec.js (1) zusichert', () => {
        // BASE-01/empty: ohne gelesene Zusicherung und ohne gefundenen
        // Abschnitt misst der Fall nichts.
        expect(typeof gemessenePunkte).toBe('number');
        expect(typeof gemesseneHalte).toBe('number');
        expect(keyboardSection.length).toBeGreaterThan(0);

        // NUR die Zeilen der Gruppenmechanik, nicht der ganze Abschnitt.
        // Der erste Entwurf dieses Falls mass gegen den ganzen Abschnitt und
        // war fuer die Haltzahl damit wertlos: die Zeile `Alt+1/2/4/6/8`
        // enthaelt eine freistehende 6, der Fall war an dieser Haelfte gruen,
        // bevor die Zahl irgendwo stand.
        const gruppenZeilen = keyboardSection
            .split('\n')
            .filter(
                l =>
                    l.startsWith('|') &&
                    (l.includes('ui/keyboard-group.js') || l.includes('tastatur-gruppen.spec.js'))
            );
        expect(gruppenZeilen.length).toBeGreaterThanOrEqual(1);
        const gruppenText = gruppenZeilen.join('\n');

        // Ziffernschranken, damit "42" nicht als Teil von "142" durchgeht.
        const nennt = zahl => new RegExp(`(?<!\\d)${zahl}(?!\\d)`).test(gruppenText);
        const fehlendeZahlen = [
            { was: 'Punkte je sechs Kaempfer', zahl: gemessenePunkte },
            { was: 'Halte darunter', zahl: gemesseneHalte }
        ].filter(z => !nennt(z.zahl));

        // Eine Tabelle, die "ein Halt je Gruppe" behauptet, ohne die
        // Messung dahinter zu nennen, ist Prosa. Fall (1) von
        // tastatur-gruppen.spec.js sichert beide Zahlen zu.
        expect(fehlendeZahlen).toEqual([]);
    });

    test('DOC-09: die Kuerzeltabelle nennt jede Taste, die GRUPPEN_TASTEN bedient', () => {
        // BASE-01/empty: ein leerer Tastensatz heisst, dass der Leser von
        // `ui/keyboard-group.js` kaputt ist — nicht, dass alles stimmt.
        expect(gruppenTasten.length).toBeGreaterThanOrEqual(1);

        // Eine neue Gruppentaste braucht BEIDES: eine Zeile in der
        // Kuerzeltabelle und einen Eintrag in TASTE_IM_DOKUMENT.
        expect(gruppenTasten.filter(t => !TASTE_IM_DOKUMENT[t])).toEqual([]);

        const fehlend = gruppenTasten
            .filter(t => TASTE_IM_DOKUMENT[t])
            .filter(t => !keyboardSection.includes(TASTE_IM_DOKUMENT[t]))
            .map(t => `${t} (${TASTE_IM_DOKUMENT[t]})`);
        expect(fehlend).toEqual([]);
    });

    test('DOC-10: jede Datei und jede Fallnummer, die die Kuerzeltabelle nennt, existiert', () => {
        // Teil 1 — die Pfade. Mit Schraegstrich: relativ zur Wurzel. Ohne
        // Schraegstrich (blosser Dateiname, wie "tastenhilfe.spec.js"):
        // irgendwo unter tests/ aufloesbar.
        const pfadTreffer = [
            ...keyboardSection.matchAll(/`([A-Za-z0-9_./-]+\.(?:js|py|html|css|md))`/g)
        ];
        const pfade = [...new Set(pfadTreffer.map(m => m[1]))].sort();
        expect(pfade.length).toBeGreaterThanOrEqual(1);

        const basisnamen = new Set();
        (function sammle(verzeichnis) {
            for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
                if (eintrag.isDirectory()) sammle(path.join(verzeichnis, eintrag.name));
                else basisnamen.add(eintrag.name);
            }
        })(path.join(REPO, 'tests'));

        const totePfade = pfade.filter(p =>
            p.includes('/') ? !fs.existsSync(path.join(REPO, p)) : !basisnamen.has(p)
        );
        expect(totePfade).toEqual([]);

        // Teil 2 — die Fallnummern. "`…spec.js` (11)" heisst: in jener Datei
        // gibt es einen Fall, dessen Name mit "(11)" beginnt. Eine
        // umnumerierte Datei macht die Tabelle sonst lautlos falsch.
        const zitate = [...keyboardSection.matchAll(/`([A-Za-z0-9_./-]+\.spec\.js)`\s*\((\d+)\)/g)];
        expect(zitate.length).toBeGreaterThanOrEqual(1);

        const fehlendeFaelle = [];
        for (const [, datei, nummer] of zitate) {
            const name = datei.split('/').pop();
            const voll = path.join(REPO, 'tests', 'e2e', 'features', name);
            if (!fs.existsSync(voll)) {
                fehlendeFaelle.push(`${name} fehlt`);
                continue;
            }
            const inhalt = fs.readFileSync(voll, 'utf8');
            if (!new RegExp(`test\\(\\s*['"]\\(${nummer}\\)`).test(inhalt)) {
                fehlendeFaelle.push(`${name} hat keinen Fall (${nummer})`);
            }
        }
        expect(fehlendeFaelle).toEqual([]);
    });
});

// Gemessen am 2026-10-14: 88 Pfadangaben (mit Schraegstrich) in
// docs/bugfixes.md, davon 8 tot. Die 8 sind Altlasten aus der Zeit vor den
// Modulteilungen (features/dice/maps.js -> features/maps/,
// features/shops/wiki.js -> features/wiki/ usw.) und werden hier NICHT
// repariert: der Pin haelt fest, dass die Zahl sich nicht nach oben bewegt.
// Ein neuer Eintrag mit falschem Pfad hebt sie, eine Reparatur senkt sie —
// in beiden Faellen rot, in beiden Faellen absichtlich.
const BUGFIX_TOTE_PFADE_PIN = 8;

describe('DOC — docs/bugfixes.md verwest nicht', () => {
    test('DOC-11: die Zahl toter Pfadangaben im Bugfix-Katalog == Pin (exakt)', () => {
        const alle = [
            ...bugfixesMdContent.matchAll(/`([A-Za-z0-9_./-]+\.(?:js|css|html|py|json|md))`/g)
        ];
        const pfade = [...new Set(alle.map(m => m[1]).filter(p => p.includes('/')))].sort();

        // BASE-01/empty: ein leerer Katalog ist kein sauberer Katalog.
        expect(pfade.length).toBeGreaterThanOrEqual(50);

        const tote = pfade.filter(p => !fs.existsSync(path.join(REPO, p)));
        // Die toten Pfade stehen im verglichenen Objekt, damit der
        // Fehlschlag sie nennt statt nur eine Zahl zu zeigen.
        expect({ anzahl: tote.length, tote }).toMatchObject({ anzahl: BUGFIX_TOTE_PFADE_PIN });
    });

    test('DOC-12: jede Zahlangabe ueber execCommand-Aufrufe nennt die im Quellbaum gemessene Zahl', () => {
        // Die Messung: AUFRUFE (`.execCommand(`), nicht Nennungen — dieselbe
        // Schranke, die CLAUDE.md fuer den Quellbaum fuehrt.
        let aufrufe = 0;
        const zaehle = verzeichnis => {
            for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
                const voll = path.join(verzeichnis, eintrag.name);
                if (eintrag.isDirectory()) zaehle(voll);
                else if (eintrag.name.endsWith('.js')) {
                    aufrufe += (fs.readFileSync(voll, 'utf8').match(/\.execCommand\s*\(/g) || [])
                        .length;
                }
            }
        };
        ['core', 'utils', 'systems', 'features', 'ui', 'render'].forEach(v =>
            zaehle(path.join(REPO, v))
        );

        // Jede Zeile beider Akten, die execCommand nennt UND eine Zahl von
        // Aufrufen/Stellen/Call-Sites behauptet.
        const behauptungen = [];
        for (const [datei, inhalt] of [
            ['CLAUDE.md', claudeMdContent],
            ['docs/bugfixes.md', bugfixesMdContent]
        ]) {
            inhalt.split('\n').forEach((zeile, i) => {
                if (!/execCommand/.test(zeile)) return;
                for (const m of zeile.matchAll(/(\d+)\s+(?:Call-Sites?|Stellen|Aufrufe?)\b/g)) {
                    behauptungen.push({ ort: `${datei}:${i + 1}`, zahl: parseInt(m[1], 10) });
                }
            });
        }
        // BASE-01/empty: ohne Kandidatenzeile misst der Fall nichts.
        expect(behauptungen.length).toBeGreaterThanOrEqual(1);

        const falsch = behauptungen
            .filter(b => b.zahl !== aufrufe)
            .map(b => `${b.ort} nennt ${b.zahl}, gemessen sind ${aufrufe}`);
        expect(falsch).toEqual([]);
    });
});
