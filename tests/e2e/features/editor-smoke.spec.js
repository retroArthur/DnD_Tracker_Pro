// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Editor-Smoke (execCommand-Ablösung, Phase 9, Plan 04)
 *
 * Belegt, dass die geteilte Editor-Engine (formatText() + der Markdown-Live-
 * Shortcut-Umwandler) nicht nur im Referenz-Editor Wiki verdrahtet ist, sondern
 * in allen fünf weiteren Entity-Editoren (NPCs, Orte, Quests, Sessions,
 * Quick-Referenz) — Vorher-Beweis für EDIT-02 vor der Migration in
 * Pläne 09-06..09-09. Alle Erwartungswerte sind EMPIRISCH am gebauten Bundle
 * erhoben (temporäre Probe-Spec, analog 09-01..09-03-Muster), nicht geraten.
 */

const TESTTEXT = 'Probetext';
// Empirisch erhoben: derselbe Wert wie der Referenz-Editor Wiki
// (editor-formatting.spec.js, ERWARTET_BOLD_NACH_KLICK) — Beweis für "eine
// geteilte Engine" über alle Entity-Editoren.
const BOLD_ERWARTET = '<b>Probetext</b>';

async function gotoBundleFresh(page) {
    const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
    await page.goto(filePath);
    await page.waitForSelector('.app-title', { timeout: 10000 });
}

/**
 * Öffnet einen Nav-Tab, der in einer eingeklappten Nav-Group liegt. Da jeder
 * Test mit einem frischen Seitenladen (gotoBundleFresh) beginnt, ist die
 * Gruppe garantiert geschlossen — die Gruppe wird deshalb bedingungslos
 * geöffnet (kein Sichtbarkeits-Guard nötig).
 */
async function openTabInGroup(page, tabName) {
    const tab = page.locator(`.nav-tab[data-view="${tabName}"]`);
    const group = page.locator('.nav-group', { has: tab });
    await group.locator('.nav-group-btn').click();
    await tab.click();
}

/**
 * Jede Textselektion in einem .rich-editor löst über den geteilten,
 * document-weiten selectionchange-Listener (rich-text.js initFloatingToolbar())
 * die floating Toolbar aus (150ms Debounce) — unabhängig davon, welcher
 * Entity-Editor gerade selektiert wurde. Für die Tests der STATISCHEN Toolbar
 * muss sie deshalb deterministisch wieder ausgeblendet werden, bevor der
 * statische Toolbar-Button geklickt wird — sonst überlagert das fixed-position
 * Element (racy, abhängig vom Timing) den Klick-Zielbereich. Escape scheidet
 * als Dismiss-Weg aus: es schließt in den Modal-Editoren (NPCs/Orte/Quests/
 * Quick-Referenz) zusätzlich das ganze Modal. Stattdessen wird die
 * app-eigene, global exportierte hideFloatingToolbar() (rich-text.js) direkt
 * aufgerufen — ein dokumentiertes Setup-Vehikel (D-06): geprüft wird der
 * Klick auf den statischen Toolbar-Button, nicht der Dismiss-Mechanismus der
 * floating Toolbar selbst (der hat eigene, dedizierte Tests in
 * editor-floating.spec.js aus Plan 09-03).
 */
async function dismissFloatingToolbar(page) {
    await page.waitForFunction(() =>
        document.getElementById('floating-toolbar')?.classList.contains('visible')
    );
    await page.evaluate(() => window.hideFloatingToolbar());
    await page.waitForFunction(
        () => !document.getElementById('floating-toolbar')?.classList.contains('visible')
    );
}

/**
 * Selektiert den Textknoten-Inhalt eines Editors exakt (Zeichen-Offsets), statt
 * editor.selectText() zu nutzen. Für die floating-Toolbar-Tests notwendig
 * (09-03-SUMMARY.md, Selektionstechnik-Learning): applyFloatingFormat()s
 * .parentElement.closest(tag)-Erkennung trifft sonst den Editor-Container statt
 * das Format-Tag.
 */
async function selectExactTextRange(page, editorId, matchText) {
    await page.evaluate(
        ({ id, text }) => {
            const el = document.getElementById(id);
            let target = null;
            el.childNodes.forEach(n => {
                if (n.nodeType === Node.TEXT_NODE && n.textContent.includes(text)) target = n;
            });
            if (!target) return;
            const idx = target.textContent.indexOf(text);
            const range = document.createRange();
            range.setStart(target, idx);
            range.setEnd(target, idx + text.length);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        },
        { id: editorId, text: matchText }
    );
}

// ---------------------------------------------------------------
// Editor-Tabelle: je ein Eintrag pro weiterem Entity-Editor. Ein neuer Editor
// ist eine zusätzliche Zeile hier — der Testkörper bleibt unverändert.
// ---------------------------------------------------------------
const EDITORS = [
    {
        name: 'NPCs',
        editorId: 'npc-desc',
        boldSelector: '[data-action="format-text"][data-cmd="npc-desc"][data-editor="bold"]',
        open: async page => {
            await openTabInGroup(page, 'npcs');
            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
        }
    },
    {
        name: 'Orte',
        editorId: 'loc-desc',
        boldSelector: '[data-action="format-text"][data-cmd="loc-desc"][data-editor="bold"]',
        open: async page => {
            await openTabInGroup(page, 'locations');
            await page.click('[data-action="show-modal"][data-value="location-modal"]');
        }
    },
    {
        name: 'Quests',
        editorId: 'quest-desc',
        boldSelector: '[data-action="format-text"][data-cmd="quest-desc"][data-editor="bold"]',
        open: async page => {
            await openTabInGroup(page, 'quests');
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
        }
    },
    {
        name: 'Sessions',
        editorId: 'session-text',
        boldSelector:
            '[data-action="format-text"][data-cmd="session-text"][data-editor="bold"]',
        open: async page => {
            await openTabInGroup(page, 'notes');
            await page.click('[data-action="toggle-collapse"][data-value="session-form"]');
        }
    },
    {
        name: 'Quick-Referenz',
        editorId: 'quick-ref-entry-content',
        boldSelector:
            '[data-action="format-text"][data-cmd="quick-ref-entry-content"][data-editor="bold"]',
        // Kein data-view-Nav-Tab nötig: der Öffner ist die dauerhaft sichtbare
        // Schnell-Referenz-FAB (systems/spellslots/quick-reference.js:74
        // toggleQuickRef(), Zeilen 357-368 addQuickRefEntry()) — ein echter
        // data-action-Button, kein page.evaluate()-Umweg nötig.
        open: async page => {
            await page.click('.qref-fab[data-action="toggle-quick-ref"]');
            await page.click('[data-action="add-quick-ref-entry"]');
        }
    }
];

test.describe('Editor-Smoke — geteilte Engine in allen Entity-Editoren', () => {
    for (const cfg of EDITORS) {
        test(`${cfg.name}: Fett über die statische Toolbar erzeugt dasselbe Markup wie der Referenz-Editor Wiki`, async ({
            page
        }) => {
            await gotoBundleFresh(page);
            await cfg.open(page);
            const editor = page.locator(`#${cfg.editorId}`);
            await expect(editor).toBeVisible();
            await editor.click();
            await editor.pressSequentially(TESTTEXT);
            await editor.selectText();
            await dismissFloatingToolbar(page);
            const boldBtn = page.locator(cfg.boldSelector);
            await expect(boldBtn).toBeVisible();
            await boldBtn.click();
            await expect(editor).toHaveJSProperty('innerHTML', BOLD_ERWARTET);
            await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
        });
    }
});

test.describe('Smoke — floating Toolbar', () => {
    // Zwei Editoren mit unterschiedlichem Container-Typ (Modal vs. Inline-
    // Formular), empfohlen laut Plan: NPCs und Sessions.
    const FLOATING_EDITORS = EDITORS.filter(e => e.name === 'NPCs' || e.name === 'Sessions');

    for (const cfg of FLOATING_EDITORS) {
        test(`${cfg.name}: Fett über die floating Toolbar erzeugt dasselbe Markup wie der Referenz-Editor Wiki`, async ({
            page
        }) => {
            await gotoBundleFresh(page);
            await cfg.open(page);
            const editor = page.locator(`#${cfg.editorId}`);
            await expect(editor).toBeVisible();
            await editor.click();
            await editor.pressSequentially(TESTTEXT);
            await selectExactTextRange(page, cfg.editorId, TESTTEXT);
            await editor.dispatchEvent('mouseup');
            await page.waitForFunction(() =>
                document.getElementById('floating-toolbar')?.classList.contains('visible')
            );
            const floatingBoldBtn = page.locator('[data-floating-action="bold"]');
            await expect(floatingBoldBtn).toBeVisible();
            await floatingBoldBtn.click();
            await expect(editor).toHaveJSProperty('innerHTML', BOLD_ERWARTET);
            await expect(editor.evaluate(el => el.textContent)).resolves.toContain(TESTTEXT);
        });
    }
});
