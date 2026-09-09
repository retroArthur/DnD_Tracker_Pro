/**
 * Dokument-Konsistenz — CSS-Dateizahl in CLAUDE.md
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
        // modularer HTML-Vorlagen nennt ("10 modulare HTML-Templates"), die
        // hier nicht mitgezaehlt werden darf.
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
