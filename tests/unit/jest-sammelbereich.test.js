/**
 * Der Sammelbereich von Jest — kein verschachtelter Worktree urteilt mit
 *
 * DER BEFUND. Die Desktop-App legt fuer eine ausgelagerte Aufgabe einen
 * git-Worktree UNTERHALB des Repos an (`.claude/.claude/worktrees/<name>/`).
 * `jest.config.cjs` sammelt mit `roots: ['<rootDir>']` und einem `testMatch`,
 * das jede `*.test.js` im ganzen Baum meint, und ignorierte bis hierher nur
 * `/node_modules/` und `/dist/`. Gemessen, mit einem solchen
 * Worktree im Baum:
 *
 *   npx jest --listTests     163 Testdateien, davon 78 aus dem Worktree
 *   npx jest                 2 failed — beide aus der FREMDEN Kopie
 *
 * Die zwei roten kamen aus einem aelteren Stand von stability.test.js, dessen
 * persistence.js git im Worktree frisch mit CRLF materialisiert hatte; der
 * eigene Zweig war gruen. Eine fremde, veraltete Kopie urteilte also ueber den
 * eigenen Zweig — und umgekehrt koennte eine echte Regression zwischen 78
 * fremden Suiten untergehen. Erkennungszeichen war allein der Pfad in der
 * Fehlermeldung (`at ... (.claude/.claude/worktrees/...)`).
 *
 * WARUM EIN UNIT-TEST UND NICHT NUR DIE MESSUNG. Auf dem CI-Laeufer gibt es nie
 * einen verschachtelten Worktree; dort sammelt Jest mit und ohne das Muster
 * dasselbe. Ein Rueckbau der Zeile waere also nur lokal sichtbar, und nur,
 * solange zufaellig ein Worktree herumliegt. Dieser Test prueft deshalb das
 * MUSTER selbst — mit genau der Umwandlung, die Jest vornimmt: jest-config
 * ersetzt `<rootDir>`, schickt jedes Muster durch `replacePathSepForRegex` aus
 * jest-regex-util und verbindet sie mit `|`. Damit gilt der Test auf Windows
 * (Backslash-Pfade) wie auf dem Linux-Laeufer.
 *
 * UND DIE GEGENRICHTUNG. Ein zu breites Muster verschluckte die eigene Suite,
 * und Jest meldete dann schlicht weniger Tests — gruen. Teil 2 verlangt deshalb,
 * dass KEINE echte Testdatei des Baums ignoriert wird, gesammelt wie `testMatch`
 * sie meint.
 */

const fs = require('fs');
const path = require('path');
const { replacePathSepForRegex } = require('jest-regex-util');

const REPO = path.resolve(__dirname, '..', '..');
const config = require(path.join(REPO, 'jest.config.cjs'));

/** Verzeichnisse, die beim Sammeln der ECHTEN Testdateien nicht betreten werden. */
const NICHT_BETRETEN = new Set(['node_modules', 'dist', '.git', '.claude', 'coverage']);

/**
 * Die Ignorier-Muster aus jest.config.cjs, umgewandelt wie Jest es tut.
 * @returns {RegExp|null}
 */
function ignorierMuster() {
    const roh = config.testPathIgnorePatterns || [];
    if (roh.length === 0) return null;
    return new RegExp(
        roh.map(p => replacePathSepForRegex(p.replace(/<rootDir>/g, REPO))).join('|')
    );
}

/**
 * Alle echten Testdateien des Baums, so wie `testMatch` sie meint.
 * @returns {string[]} absolute Pfade
 */
function echteTestdateien() {
    const treffer = [];
    const geh = verz => {
        for (const e of fs.readdirSync(verz, { withFileTypes: true })) {
            if (NICHT_BETRETEN.has(e.name)) continue;
            const voll = path.join(verz, e.name);
            if (e.isDirectory()) geh(voll);
            else if (/\.test\.[jt]s$/.test(e.name)) treffer.push(voll);
        }
    };
    geh(REPO);
    return treffer;
}

describe('Jest sammelt nur den eigenen Baum', () => {
    test('ein verschachtelter Worktree unter .claude wird nicht gesammelt', () => {
        const re = ignorierMuster();
        expect(re).not.toBeNull();
        // Beide Lagen, in denen die App ihre Worktrees anlegt: unter dem
        // .claude-Unterordner, wenn die Sitzung dort steht (so hier), und
        // direkt unter .claude, wenn sie im Repo-Wurzelverzeichnis steht.
        const lagen = [
            path.join(
                REPO,
                '.claude',
                '.claude',
                'worktrees',
                'probe',
                'tests',
                'unit',
                'a.test.js'
            ),
            path.join(REPO, '.claude', 'worktrees', 'probe', 'tests', 'unit', 'a.test.js')
        ];
        const gesammelt = lagen.filter(p => !re.test(p)).map(p => path.relative(REPO, p));
        expect(gesammelt).toEqual([]);
    });

    test('keine echte Testdatei des Baums wird ignoriert', () => {
        const re = ignorierMuster();
        const alle = echteTestdateien();
        // BASE-01/empty: ein leerer Fund waere kein sauberer Fund.
        expect(alle.length).toBeGreaterThanOrEqual(50);
        const verschluckt = alle.filter(p => re && re.test(p)).map(p => path.relative(REPO, p));
        expect(verschluckt).toEqual([]);
    });

    // DER PUNKT IST EIN PUNKT. Im Quelltext von jest.config.cjs muss das Muster
    // `'/\\.claude/'` lauten: `'/\.claude/'` ist in einem JavaScript-String eine
    // wirkungslose Maskierung und ergibt `/.claude/` — ein Regex, dessen `.`
    // auf JEDES Zeichen passt. Genau so stand die Zeile beim ersten Schreiben
    // da, und die beiden Teile darueber waren damit gruen: die Worktrees werden
    // ignoriert, und keine echte Testdatei liegt in einem Ordner wie
    // `xclaude/`. Dieser Teil nennt solche Doppelgaenger beim Namen.
    test('das Muster trifft nur .claude und keinen Doppelgaenger', () => {
        const re = ignorierMuster();
        expect(re).not.toBeNull();
        const doppelgaenger = ['xclaude', '-claude', 'claude', '.claudex'].map(ordner =>
            path.join(REPO, 'tests', ordner, 'a.test.js')
        );
        const faelschlich = doppelgaenger.filter(p => re.test(p)).map(p => path.relative(REPO, p));
        expect(faelschlich).toEqual([]);
    });
});
