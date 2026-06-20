// @ts-check
/**
 * Test Utilities für D&D Tracker E2E Tests
 * Gemeinsame Hilfsfunktionen für alle Tests
 */

/**
 * Lädt die App und wartet auf vollständige Initialisierung
 * @param {import('@playwright/test').Page} page
 */
export async function loadApp(page) {
    const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
    await page.goto(filePath);
    await page.waitForSelector('.app-title', { timeout: 10000 });
    // Warte auf App-Initialisierung
    await page.waitForTimeout(500);
}

/**
 * Navigiert zu einem Tab
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName - z.B. 'party', 'npcs', 'locations', 'quests', 'encounter', 'dice'
 */
export async function navigateToTab(page, tabName) {
    const tab = page.locator(`.nav-tab[data-view="${tabName}"]`);
    // Gruppierte Nav: liegt der Tab in einem geschlossenen Dropdown, erst die Gruppe öffnen
    if (!(await tab.isVisible())) {
        const group = page.locator('.nav-group', {
            has: page.locator(`.nav-tab[data-view="${tabName}"]`)
        });
        if ((await group.count()) > 0) {
            await group.locator('.nav-group-btn').click();
            await page.waitForTimeout(50);
        }
    }
    await tab.click();
    await page.waitForTimeout(300);
}

/**
 * Öffnet ein Collapse-Formular
 * @param {import('@playwright/test').Page} page
 * @param {string} formName - z.B. 'char-form', 'enc-form'
 */
export async function openCollapseForm(page, formName) {
    const form = page.locator(`#${formName}`);
    const isOpen = await form.evaluate(el => el.classList.contains('open'));

    if (!isOpen) {
        await page.click(`[data-action="toggle-collapse"][data-value="${formName}"]`);
        await page.waitForTimeout(300);
    }
}

/**
 * Schließt ein Collapse-Formular
 * @param {import('@playwright/test').Page} page
 * @param {string} formName
 */
export async function closeCollapseForm(page, formName) {
    const form = page.locator(`#${formName}`);
    const isOpen = await form.evaluate(el => el.classList.contains('open'));

    if (isOpen) {
        await page.click(`[data-action="toggle-collapse"][data-value="${formName}"]`);
        await page.waitForTimeout(300);
    }
}

/**
 * Öffnet ein Modal
 * @param {import('@playwright/test').Page} page
 * @param {string} modalId - z.B. 'npc-modal', 'quest-modal'
 */
export async function openModal(page, modalId) {
    // Modal öffnen falls nicht bereits offen
    const modal = page.locator(`#${modalId}`);
    const isVisible = await modal.isVisible();

    if (!isVisible) {
        // Versuche über data-action zu öffnen
        const openButton = page
            .locator(`[data-action="open-${modalId}"], [onclick*="${modalId}"]`)
            .first();
        if (await openButton.isVisible()) {
            await openButton.click();
            await page.waitForTimeout(300);
        }
    }
}

/**
 * Schließt ein Modal per Escape
 * @param {import('@playwright/test').Page} page
 */
export async function closeModal(page) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
}

/**
 * Füllt ein Textfeld aus
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS Selector oder ID
 * @param {string} value
 */
export async function fillField(page, selector, value) {
    const field = page.locator(selector.startsWith('#') ? selector : `#${selector}`);
    await field.fill(value);
}

/**
 * Wählt eine Option aus einem Dropdown (falls Option existiert)
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} value
 */
export async function selectOption(page, selector, value) {
    const select = page.locator(selector.startsWith('#') ? selector : `#${selector}`);

    // Prüfe ob die Option existiert
    const options = await select.locator('option').allTextContents();
    const optionExists = options.some(
        opt => opt.toLowerCase().includes(value.toLowerCase()) || opt === value
    );

    if (optionExists) {
        try {
            await select.selectOption(value);
        } catch {
            // Falls direkte Auswahl fehlschlägt, versuche über Label
            const matchingOption = options.find(opt =>
                opt.toLowerCase().includes(value.toLowerCase())
            );
            if (matchingOption) {
                await select.selectOption({ label: matchingOption });
            }
        }
    }
    // Wenn Option nicht existiert, einfach überspringen
}

/**
 * Klickt einen Button mit data-action
 * @param {import('@playwright/test').Page} page
 * @param {string} action - z.B. 'save-character', 'delete-npc'
 * @param {string} [value] - Optional data-value
 */
export async function clickAction(page, action, value) {
    const selector = value
        ? `[data-action="${action}"][data-value="${value}"]`
        : `[data-action="${action}"]`;
    await page.click(selector);
    await page.waitForTimeout(300);
}

/**
 * Wartet auf Toast-Nachricht
 * @param {import('@playwright/test').Page} page
 * @param {string} [text] - Optionaler Text der enthalten sein soll
 */
export async function waitForToast(page, text) {
    const toast = page.locator('#toast.show');
    await toast.waitFor({ state: 'visible', timeout: 3000 });
    if (text) {
        await page.waitForFunction(
            expectedText => document.querySelector('#toast')?.textContent?.includes(expectedText),
            text,
            { timeout: 3000 }
        );
    }
    // Warte bis Toast verschwindet
    await page.waitForTimeout(1500);
}

/**
 * Löscht alle App-Daten (localStorage)
 * @param {import('@playwright/test').Page} page
 */
export async function clearAppData(page) {
    await page.evaluate(() => {
        localStorage.clear();
        // @ts-ignore
        if (typeof D !== 'undefined') {
            // @ts-ignore
            D.characters = [];
            // @ts-ignore
            D.npcs = [];
            // @ts-ignore
            D.locations = [];
            // @ts-ignore
            D.quests = [];
            // @ts-ignore
            D.encounters = [];
            // @ts-ignore
            D.loot = [];
            // @ts-ignore
            D.spells = [];
        }
    });
}

/**
 * Holt die aktuelle Anzahl von Entities
 * @param {import('@playwright/test').Page} page
 * @param {string} type - z.B. 'characters', 'npcs', 'locations'
 */
export async function getEntityCount(page, type) {
    return await page.evaluate(entityType => {
        // @ts-ignore
        return D && D[entityType] ? D[entityType].length : 0;
    }, type);
}

/**
 * Holt Entity-Daten nach ID
 * @param {import('@playwright/test').Page} page
 * @param {string} type
 * @param {number} id
 */
export async function getEntityById(page, type, id) {
    return await page.evaluate(
        ({ entityType, entityId }) => {
            // @ts-ignore
            return D && D[entityType] ? D[entityType].find(e => e.id === entityId) : null;
        },
        { entityType: type, entityId: id }
    );
}

/**
 * Generiert einen eindeutigen Testnamen
 * @param {string} prefix
 */
export function generateTestName(prefix) {
    return `${prefix}_Test_${Date.now()}`;
}

/**
 * Prüft ob Element sichtbar ist
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
export async function isVisible(page, selector) {
    const element = page.locator(selector);
    return await element.isVisible();
}

/**
 * Wartet auf Änderung im DOM
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
export async function waitForElement(page, selector, options = {}) {
    await page.locator(selector).waitFor({ state: 'visible', timeout: 5000, ...options });
}

/**
 * Führt Undo aus
 * @param {import('@playwright/test').Page} page
 */
export async function performUndo(page) {
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
}

/**
 * Führt Redo aus
 * @param {import('@playwright/test').Page} page
 */
export async function performRedo(page) {
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(300);
}

/**
 * Speichert manuell (Ctrl+S)
 * @param {import('@playwright/test').Page} page
 */
export async function performSave(page) {
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(500);
}

/**
 * Holt den Inhalt eines Rich-Text-Editors
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
export async function getRichTextContent(page, selector) {
    return await page.locator(selector).innerHTML();
}

/**
 * Setzt Rich-Text-Inhalt
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} content
 */
export async function setRichTextContent(page, selector, content) {
    await page.locator(selector).fill('');
    await page.locator(selector).pressSequentially(content);
}

// Test-Daten Generatoren
export const testData = {
    character: () => ({
        name: generateTestName('Hero'),
        player: 'Test Player',
        class: 'Fighter',
        race: 'Human',
        level: 5,
        hp: 45,
        ac: 16,
        str: 16,
        dex: 14,
        con: 15,
        int: 10,
        wis: 12,
        cha: 8
    }),

    npc: () => ({
        name: generateTestName('NPC'),
        role: 'Merchant',
        race: 'Dwarf',
        chapter: '1',
        description: 'A friendly merchant who sells potions.'
    }),

    location: () => ({
        name: generateTestName('Location'),
        description: 'A mysterious place full of adventure.'
    }),

    quest: () => ({
        title: generateTestName('Quest'),
        description: 'Find the lost artifact.',
        type: 'main',
        rewardGold: 100
    }),

    encounter: () => ({
        name: generateTestName('Monster'),
        creatureType: 'beast',
        cr: '1',
        ac: 13,
        hp: 22,
        str: 14,
        dex: 12,
        con: 13,
        int: 2,
        wis: 10,
        cha: 5
    })
};
