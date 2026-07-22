/**
 * Action-Registry Kollisions-Test — Phase 8 (Test-Fundament grün), D-02, Pitfall 1
 *
 * `EventDelegation.registerAction()` hat keinen Kollisionsschutz: registriert ein zweites
 * `ui/actions/*.js`-Modul denselben `data-action`-Schlüssel, gewinnt "last-write-wins" nach
 * Ladereihenfolge (`loader.js`) — silent, ohne Fehler. Genau das brach den STR/DEX/CON/...-
 * Modifikator-Badge (combat-actions.js registrierte `update-attr-mod`/`update-enc-attr-mod`
 * NACH entity-actions.js mit einer falschen 2-Parameter-Signatur, siehe 08-RESEARCH.md
 * Pitfall 1/2).
 *
 * Dieser Test ist reine statische Analyse (fs + path, kein vm, kein DOM) und scannt jede
 * Datei unter `ui/actions/*.js` nach registrierten `data-action`-Schlüsseln. Er schlägt fehl,
 * sobald ein Schlüssel in mehr als einer Datei registriert wird — außer er steht explizit auf
 * der Allowlist unten.
 */

const fs = require('fs');
const path = require('path');

const ACTIONS_DIR = path.join(__dirname, '../../ui/actions');

// Einziger bekannter, harmloser Bestands-Duplikat (08-RESEARCH.md Architecture Patterns
// Pattern "EventDelegation Last-Write-Wins Collision Detection"): beide Registrierungen
// rufen applyQuickAction mit einer bereits-int ctx.id auf; parseInt ist idempotent, daher
// funktional äquivalent unabhängig davon, welche Registrierung gewinnt.
const ALLOWED_DUPLICATE_ACTIONS = ['apply-quick-action'];

function scanActionKeysByFile() {
    const files = fs.readdirSync(ACTIONS_DIR).filter(f => f.endsWith('.js'));
    const keyToFiles = {};

    for (const file of files) {
        const content = fs.readFileSync(path.join(ACTIONS_DIR, file), 'utf8');
        const re = /^\s*'([a-zA-Z0-9_-]+)':/gm;
        let match;
        const keysInFile = new Set();
        while ((match = re.exec(content))) {
            keysInFile.add(match[1]);
        }
        for (const key of keysInFile) {
            (keyToFiles[key] ??= []).push(file);
        }
    }

    return keyToFiles;
}

describe('Action-Registry Kollisions-Erkennung (Phase 8, D-02, Pitfall 1)', () => {
    test('ui/actions/*.js enthält mindestens eine Datei zum Scannen', () => {
        const files = fs.readdirSync(ACTIONS_DIR).filter(f => f.endsWith('.js'));
        expect(files.length).toBeGreaterThan(0);
    });

    test('kein data-action-Schlüssel ist in mehr als einer Datei registriert (außer Allowlist)', () => {
        const keyToFiles = scanActionKeysByFile();
        const unexpectedDuplicates = [];

        for (const [key, files] of Object.entries(keyToFiles)) {
            const distinctFiles = [...new Set(files)];
            if (distinctFiles.length > 1 && !ALLOWED_DUPLICATE_ACTIONS.includes(key)) {
                unexpectedDuplicates.push(`${key} -> ${distinctFiles.join(', ')}`);
            }
        }

        expect(unexpectedDuplicates).toEqual([]);
    });

    test('bekannte Allowlist-Duplikate sind weiterhin tatsächlich dupliziert (Allowlist bleibt aktuell)', () => {
        const keyToFiles = scanActionKeysByFile();

        for (const key of ALLOWED_DUPLICATE_ACTIONS) {
            const distinctFiles = [...new Set(keyToFiles[key] || [])];
            expect(distinctFiles.length).toBeGreaterThanOrEqual(2);
        }
    });

    test('update-attr-mod und update-enc-attr-mod sind je nur einmal registriert (Regressionsschutz Pitfall 1/2)', () => {
        const keyToFiles = scanActionKeysByFile();

        expect([...new Set(keyToFiles['update-attr-mod'] || [])]).toEqual(['entity-actions.js']);
        expect([...new Set(keyToFiles['update-enc-attr-mod'] || [])]).toEqual(['entity-actions.js']);
    });
});
