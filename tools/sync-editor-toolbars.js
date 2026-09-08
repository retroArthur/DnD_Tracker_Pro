#!/usr/bin/env node
/**
 * Schreibt die statischen Editor-Werkzeugleisten aus dem Generator in die
 * Templates.
 *
 * Warum nicht zur Laufzeit generieren: das Markup muss im Bundle stehen.
 * Die Initialisierung laeuft einmal beim Start, und die Playwright-Suite
 * klickt Buttons unmittelbar nach dem Oeffnen eines Formulars — ein zur
 * Laufzeit nachgereichtes Markup waere zu spaet.
 *
 * Warum nicht von Hand: es sind 22 Bloecke in sieben Dateien. Die frueheren
 * Handkopien waren bereits auseinandergedriftet.
 *
 * Aufruf:
 *   node tools/sync-editor-toolbars.js           schreibt
 *   node tools/sync-editor-toolbars.js --check   prueft nur (Exit 1 bei Drift)
 *
 * Der --check-Modus ist das, was tests/unit/editor-toolbar-sync.test.js fährt.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.join(__dirname, '..');

// Manifest: eine Zeile je statischer Leiste. Erhoben am 2026-09-07 aus dem
// Bestand; `wikiLink` und `extraClass` bilden die dokumentierten Sonderfaelle ab.
const TOOLBARS = [
    // --- FULL (2) ---
    { file: 'assets/templates/view-resources.html', id: 'session-text', tier: 'full' },
    {
        file: 'assets/templates/view-resources.html',
        id: 'wiki-content',
        tier: 'full',
        opts: { wikiLink: true }
    },

    // --- MID (5) ---
    { file: 'assets/templates/view-encounters.html', id: 'enc-traits', tier: 'mid' },
    { file: 'assets/templates/view-encounters.html', id: 'enc-equipment', tier: 'mid' },
    { file: 'assets/templates/view-encounters.html', id: 'enc-actions', tier: 'mid' },
    { file: 'assets/templates/view-encounters.html', id: 'enc-skills', tier: 'mid' },
    {
        file: 'assets/templates/view-party.html',
        id: 'char-notes',
        tier: 'mid',
        opts: { extraClass: 'cf-notes-toolbar' }
    },

    // --- MINIMAL (14) ---
    { file: 'assets/templates/modals-entity.html', id: 'loc-desc', tier: 'minimal' },
    { file: 'assets/templates/modals-entity.html', id: 'npc-desc', tier: 'minimal' },
    { file: 'assets/templates/modals-entity.html', id: 'loot-desc', tier: 'minimal' },
    { file: 'assets/templates/modals-entity.html', id: 'quest-desc', tier: 'minimal' },
    { file: 'assets/templates/modals-entity.html', id: 'quest-epilog', tier: 'minimal' },
    { file: 'assets/templates/modals-entity.html', id: 'spell-desc', tier: 'minimal' },
    { file: 'assets/templates/modals-entity.html', id: 'spell-note', tier: 'minimal' },
    // Diese beiden hatten im Bestand KEINEN Loeschen-Knopf — der Generator gibt
    // ihnen einen. Bewusste, harmlose Vereinheitlichung (W-07).
    { file: 'assets/templates/modals-entity.html', id: 'fraktion-agenda', tier: 'minimal' },
    { file: 'assets/templates/modals-entity.html', id: 'fraktion-beschreibung', tier: 'minimal' },
    { file: 'assets/templates/view-bestiary.html', id: 'bst-traits', tier: 'minimal' },
    { file: 'assets/templates/view-bestiary.html', id: 'bst-actions', tier: 'minimal' },
    { file: 'assets/templates/view-bestiary.html', id: 'bst-reactions', tier: 'minimal' },
    { file: 'assets/templates/view-bestiary.html', id: 'bst-legendary', tier: 'minimal' },
    { file: 'assets/templates/modals-editors.html', id: 'quick-ref-entry-content', tier: 'minimal' },

    // --- Sonderfall (1): trug im Bestand gar keine Tier-Klasse UND keine
    // .toolbar-row, weshalb sich ihre acht Bedienelemente wegen
    // flex-direction:column uebereinander stapelten. Wird als 'mid' gefuehrt,
    // was ihrem tatsaechlichen Funktionsumfang entspricht (W-08).
    { file: 'assets/templates/view-tools.html', id: 'link-desc', tier: 'mid' }
];

function loadGenerator() {
    const source = fs.readFileSync(
        path.join(REPO_ROOT, 'ui/editors/editor-toolbar-build.js'),
        'utf8'
    );
    const windowStub = {};
    vm.runInContext(source, vm.createContext({ window: windowStub, console }));
    if (typeof windowStub.buildEditorToolbar !== 'function') {
        throw new Error('buildEditorToolbar wurde nicht exportiert');
    }
    return windowStub.buildEditorToolbar;
}

/**
 * Findet den Block `<div class="editor-toolbar...">…</div>` zu einer Editor-ID.
 * Zaehlt <div>/</div> aus, statt per Regex zu raten — die Bloecke enthalten
 * verschachtelte divs und die Verschachtelungstiefe ist je Tier verschieden.
 */
function findToolbarBlock(content, editorId) {
    const openRe = /<div class="editor-toolbar[^"]*"[^>]*>/g;
    let m;
    while ((m = openRe.exec(content)) !== null) {
        const start = m.index;
        // Gehoert dieser Block zur gesuchten ID? Der Bezug steht entweder in
        // data-cmd (format-text) oder in data-value (clear-formatting) oder,
        // bei bereits synchronisierten Bloecken, in data-toolbar-for.
        let depth = 0;
        let end = -1;
        const tagRe = /<\/?div\b[^>]*>/g;
        tagRe.lastIndex = start;
        let t;
        while ((t = tagRe.exec(content)) !== null) {
            if (t[0].startsWith('</')) {
                depth--;
                if (depth === 0) {
                    end = t.index + t[0].length;
                    break;
                }
            } else {
                depth++;
            }
        }
        if (end === -1) continue;
        const block = content.slice(start, end);
        const belongs =
            block.includes(`data-toolbar-for="${editorId}"`) ||
            block.includes(`data-cmd="${editorId}"`) ||
            block.includes(`data-value="${editorId}"`) ||
            block.includes(`data-editor="${editorId}"`);
        if (belongs) return { start, end, block };
    }
    return null;
}


function main() {
    const check = process.argv.includes('--check');
    // --only <id>[,<id>] erlaubt einen gestaffelten Rollout: erst die zwei
    // FULL-Leisten beweisen den Attributvertrag gegen das eingefrorene
    // Testnetz, danach der Rest.
    const onlyArg = process.argv.find(a => a.startsWith('--only='));
    const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;
    const build = loadGenerator();
    const byFile = new Map();
    for (const t of TOOLBARS) {
        if (only && !only.has(t.id)) continue;
        if (!byFile.has(t.file)) byFile.set(t.file, []);
        byFile.get(t.file).push(t);
    }

    let changed = 0;
    let drift = 0;
    const problems = [];

    // Code-Review 2026-09-08: zuerst ALLE Dateien im Speicher aufbauen, erst
    // danach schreiben. Vorher stand fs.writeFileSync INNERHALB dieser
    // Schleife, waehrend problems erst nach ihr geprueft wurde — eine nicht
    // gefundene Leiste in der letzten Datei beendete den Lauf mit Code 1,
    // obwohl die vorherigen Dateien laengst geschrieben waren. "Fehler" hiess
    // also nicht "nichts angefasst".
    const zuSchreiben = [];
    for (const [rel, entries] of byFile) {
        const abs = path.join(REPO_ROOT, rel);
        let content = fs.readFileSync(abs, 'utf8');
        const before = content;

        for (const t of entries) {
            const found = findToolbarBlock(content, t.id);
            if (!found) {
                problems.push(`${rel}: Leiste fuer "${t.id}" nicht gefunden`);
                continue;
            }
            const html = build(t.id, t.tier, t.opts || {});
            if (found.block === html) continue;
            drift++;
            content = content.slice(0, found.start) + html + content.slice(found.end);
        }

        if (content !== before) {
            changed++;
            zuSchreiben.push([abs, content]);
        }
    }

    if (problems.length) {
        console.error('FEHLER:');
        problems.forEach(p => console.error('  - ' + p));
        process.exit(1);
    }

    // Erst hier schreiben: an dieser Stelle steht fest, dass JEDE Leiste
    // gefunden wurde. --check schreibt weiterhin nichts.
    if (!check) {
        for (const [abs, content] of zuSchreiben) {
            fs.writeFileSync(abs, content, 'utf8');
        }
    }

    if (check) {
        if (drift > 0) {
            console.error(
                `Drift: ${drift} Leiste(n) in ${changed} Datei(en) weichen vom Generator ab.\n` +
                    'Beheben mit: node tools/sync-editor-toolbars.js'
            );
            process.exit(1);
        }
        console.log(`Alle ${TOOLBARS.length} Leisten sind mit dem Generator synchron.`);
        return;
    }

    const scope = only ? `${only.size} ausgewaehlte` : `${TOOLBARS.length}`;
    console.log(`${drift} von ${scope} Leisten aktualisiert (${changed} Datei(en) geschrieben).`);
}

if (require.main === module) {
    main();
}

module.exports = { TOOLBARS, findToolbarBlock, loadGenerator };
