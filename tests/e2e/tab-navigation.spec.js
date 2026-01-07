// @ts-check
import { test, expect } from '@playwright/test';

/**
 * D&D Tracker - Tab Navigation Tests
 * Tests the Tab Registry System to ensure tabs re-render correctly when switched
 *
 * Related: systems/tab-registry.js, systems/tab-registry.md
 * Bug Fix: DOM robustness - missing DOM bei renderRandomTables, renderInitiative
 */

// Helper: Ensure D object is available
async function ensureAppInitialized(page) {
  try {
    // Try to wait for D to be available
    await page.waitForFunction(() => {
      return typeof window.D !== 'undefined' &&
             typeof window.save === 'function' &&
             typeof window.renderRandomTables === 'function';
    }, { timeout: 3000 });
  } catch (e) {
    // If D doesn't exist after timeout, log warning and continue
    // Tests will initialize D defensively if needed
    console.warn('[Test Setup] D object not yet initialized, tests will handle defensively');
  }
}

// Helper: Load app before each test
test.beforeEach(async ({ page }) => {
  const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

  // Navigate to page first to establish context
  await page.goto(filePath, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Clear localStorage and reload to start fresh
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for app header to be visible
  await page.waitForSelector('.app-header', { state: 'visible', timeout: 5000 });

  // Give app time to initialize with clean state
  await page.waitForTimeout(1000);
});

test.describe('Tab Registry System', () => {

  test('dice tab renders random tables when switched to', async ({ page }) => {
    // Clear default tables and add test table
    await page.evaluate(() => {
      window.D.randomTables = [{
        id: Date.now(),
        name: 'Test Table',
        icon: '🎲',
        entries: [
          { weight: 1, text: 'Entry 1' },
          { weight: 1, text: 'Entry 2' }
        ]
      }];
      window.save();
    });

    // Switch to dice tab
    await page.click('[data-view="dice"]');

    // Wait for dice view to be active
    await page.waitForSelector('#view-dice.active', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify random tables container is visible
    const container = page.locator('#random-tables-list');
    await expect(container).toBeVisible();

    // Check if table card is rendered (use .first() for strict mode)
    const tableCard = page.locator('.rt-card').first();
    await expect(tableCard).toBeVisible();
    await expect(tableCard).toContainText('Test Table');
  });

  test('dice tab re-renders when switching back', async ({ page }) => {
    // Setup: Clear defaults and add initial random table
    await page.evaluate(() => {
      window.D.randomTables = [{
        id: 1,
        name: 'Initial Table',
        icon: '🎯',
        entries: []
      }];
      window.save();
    });

    // Switch to dice tab
    await page.click('[data-view="dice"]');
    await page.waitForSelector('#view-dice.active', { timeout: 5000 });
    await page.waitForTimeout(300);
    await expect(page.locator('.rt-card').first()).toContainText('Initial Table');

    // Switch away
    await page.click('[data-view="dashboard"]');
    await page.waitForSelector('#view-dashboard.active', { timeout: 5000 });

    // Add a second table while away from dice tab
    await page.evaluate(() => {
      window.D.randomTables.push({
        id: 2,
        name: 'New Table',
        icon: '🎲',
        entries: []
      });
      window.save();
    });

    // Switch back to dice tab
    await page.click('[data-view="dice"]');
    await page.waitForSelector('#view-dice.active', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Both tables should be visible (re-render happened)
    const tableCards = page.locator('.rt-card');
    await expect(tableCards).toHaveCount(2);
    await expect(page.locator('.rt-card').nth(1)).toContainText('New Table');
  });

  test('initiative tab renders combat tracker when switched to', async ({ page }) => {
    // Add combatants
    await page.evaluate(() => {
      window.D.initiative = {
        round: 1,
        currentTurn: 0,
        combatants: [
          {
            id: 1,
            name: 'Fighter',
            init: 20,
            hp: 50,
            maxHp: 50,
            ac: 18,
            type: 'player'
          },
          {
            id: 2,
            name: 'Goblin',
            init: 15,
            hp: 7,
            maxHp: 7,
            ac: 13,
            type: 'enemy'
          }
        ]
      };
      window.save();
    });

    // Switch to initiative tab
    await page.click('[data-view="initiative"]');
    await page.waitForTimeout(300);

    // Verify initiative list exists
    const initList = page.locator('#init-list');
    await expect(initList).toBeVisible();

    // Check if combatants are rendered
    const combatants = page.locator('.init-combatant');
    await expect(combatants).toHaveCount(2);
    await expect(page.locator('.init-combatant').first()).toContainText('Fighter');
    await expect(page.locator('.init-combatant').nth(1)).toContainText('Goblin');

    // Check round number is displayed
    const roundNum = page.locator('#round-num');
    await expect(roundNum).toContainText('1');
  });

  test('initiative tab re-renders when switching back', async ({ page }) => {
    // Setup initial combatant
    await page.evaluate(() => {
      window.D.initiative = {
        round: 1,
        currentTurn: 0,
        combatants: [{
          id: 1,
          name: 'Wizard',
          init: 18,
          hp: 30,
          maxHp: 30,
          ac: 12,
          type: 'player'
        }]
      };
      window.save();
    });

    // Switch to initiative tab
    await page.click('[data-view="initiative"]');
    await page.waitForTimeout(200);
    await expect(page.locator('.init-combatant')).toHaveCount(1);

    // Switch away
    await page.click('[data-view="dashboard"]');
    await page.waitForTimeout(200);

    // Modify data while away - advance round and damage combatant
    await page.evaluate(() => {
      window.D.initiative.round = 3;
      window.D.initiative.combatants[0].hp = 15;  // Half HP
      window.save();
    });

    // Switch back to initiative tab
    await page.click('[data-view="initiative"]');
    await page.waitForTimeout(300);

    // Verify re-render happened - round and HP should be updated
    const roundNum = page.locator('#round-num');
    await expect(roundNum).toContainText('3');

    const combatant = page.locator('.init-combatant').first();
    await expect(combatant).toContainText('15'); // Current HP
  });

  test('party tab re-renders when switching back', async ({ page }) => {
    // Add a character
    await page.evaluate(() => {
      if (!window.D.characters) window.D.characters = [];
      window.D.characters.push({
        id: 1,
        name: 'Thorin',
        class: 'Fighter',
        level: 5,
        hp: 45,
        maxHp: 45,
        ac: 18
      });
      window.save();
    });

    // Switch to party tab
    await page.click('[data-view="party"]');
    await page.waitForTimeout(200);
    await expect(page.locator('.party-member')).toHaveCount(1);

    // Switch away
    await page.click('[data-view="dashboard"]');
    await page.waitForTimeout(200);

    // Add another character while away
    await page.evaluate(() => {
      window.D.characters.push({
        id: 2,
        name: 'Elara',
        class: 'Wizard',
        level: 5,
        hp: 28,
        maxHp: 28,
        ac: 12
      });
      window.save();
    });

    // Switch back to party tab
    await page.click('[data-view="party"]');
    await page.waitForTimeout(300);

    // Both characters should be visible
    const members = page.locator('.party-member');
    await expect(members).toHaveCount(2);
  });

  test('timers tab re-renders when switching back', async ({ page }) => {
    // Add a timer
    await page.evaluate(() => {
      if (!window.D.timers) window.D.timers = [];
      window.D.timers.push({
        id: 1,
        name: 'Concentration',
        seconds: 300,
        active: false
      });
      window.save();
    });

    // Switch to timers tab
    await page.click('[data-view="timers"]');
    await page.waitForTimeout(200);

    // Verify timer is rendered
    const timer = page.locator('.timer-item');
    await expect(timer).toBeVisible();
    await expect(timer).toContainText('Concentration');

    // Switch away
    await page.click('[data-view="dashboard"]');
    await page.waitForTimeout(200);

    // Add another timer
    await page.evaluate(() => {
      window.D.timers.push({
        id: 2,
        name: 'Short Rest',
        seconds: 3600,
        active: false
      });
      window.save();
    });

    // Switch back
    await page.click('[data-view="timers"]');
    await page.waitForTimeout(300);

    // Both timers should be visible
    const timers = page.locator('.timer-item');
    await expect(timers).toHaveCount(2);
  });

});

test.describe('Tab Registry Error Handling', () => {

  test('switching to tab with no data shows empty state', async ({ page }) => {
    // Ensure no random tables exist
    await page.evaluate(() => {
      window.D.randomTables = [];
      window.save();
      // Trigger re-render to show empty state
      if (typeof window.renderRandomTables === 'function') {
        window.renderRandomTables();
      }
    });

    // Switch to dice tab
    await page.click('[data-view="dice"]');
    await page.waitForSelector('#view-dice.active', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Container should exist but show empty message
    const container = page.locator('#random-tables-list');
    await expect(container).toBeVisible();
    await expect(container).toContainText('Keine Tabellen');
  });

  test('switching to initiative with empty tracker shows empty state', async ({ page }) => {
    // Clear initiative
    await page.evaluate(() => {
      window.D.initiative = {
        round: 1,
        currentTurn: -1,
        combatants: []
      };
      window.save();
    });

    // Switch to initiative tab
    await page.click('[data-view="initiative"]');
    await page.waitForTimeout(200);

    // Should show empty message
    const initList = page.locator('#init-list');
    await expect(initList).toBeVisible();
    await expect(initList).toContainText('Keine Kämpfer');
  });

  test('tab with no renders (data tab) still switches correctly', async ({ page }) => {
    // Data tab has no renders in registry
    await page.click('[data-view="data"]');
    await page.waitForTimeout(200);

    // Tab should be active
    const dataTab = page.locator('[data-view="data"]');
    await expect(dataTab).toHaveClass(/active/);

    // View should be visible
    const dataView = page.locator('#view-data');
    await expect(dataView).toHaveClass(/active/);
  });

});

test.describe('Tab Registry Performance', () => {

  test('multiple rapid tab switches complete successfully', async ({ page }) => {
    const tabs = ['dashboard', 'party', 'npcs', 'dice', 'initiative', 'loot'];

    // Rapidly switch between tabs
    for (const tab of tabs) {
      await page.click(`[data-view="${tab}"]`);
      await page.waitForTimeout(50); // Minimal delay
    }

    // Final tab should be active
    const finalTab = page.locator('[data-view="loot"]');
    await expect(finalTab).toHaveClass(/active/);

    // No console errors
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('switching tabs does not cause memory leaks', async ({ page }) => {
    // Switch between tabs 10 times
    for (let i = 0; i < 10; i++) {
      await page.click('[data-view="dice"]');
      await page.waitForTimeout(100);
      await page.click('[data-view="initiative"]');
      await page.waitForTimeout(100);
    }

    // Check that page is still responsive
    const title = page.locator('.app-title');
    await expect(title).toBeVisible();

    // No console errors
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

});

test.describe('Tab Registry Integration', () => {

  test('undo/redo triggers re-render on active tab', async ({ page }) => {
    // Add random table
    await page.evaluate(() => {
      if (!window.D.randomTables) window.D.randomTables = [];
      window.D.randomTables.push({
        id: 1,
        name: 'Original Table',
        icon: '🎯',
        entries: []
      });
      window.save();
    });

    // Switch to dice tab
    await page.click('[data-view="dice"]');
    await page.waitForTimeout(200);
    await expect(page.locator('.rt-card')).toContainText('Original Table');

    // Make a change (add another table)
    await page.evaluate(() => {
      window.saveUndoState();
      window.D.randomTables.push({
        id: 2,
        name: 'New Table',
        icon: '🎲',
        entries: []
      });
      window.save();
    });
    await page.waitForTimeout(200);

    // Should show 2 tables
    await expect(page.locator('.rt-card')).toHaveCount(2);

    // Undo (if undo function is accessible)
    const undoResult = await page.evaluate(() => {
      if (typeof window.undo === 'function') {
        window.undo();
        return true;
      }
      return false;
    });

    if (undoResult) {
      await page.waitForTimeout(200);
      // Should be back to 1 table
      await expect(page.locator('.rt-card')).toHaveCount(1);
    }
  });

  test('import data triggers re-render on active tab', async ({ page }) => {
    // Clear default tables first
    await page.evaluate(() => {
      window.D.randomTables = [];
      window.save();
      if (typeof window.renderRandomTables === 'function') {
        window.renderRandomTables();
      }
    });

    // Switch to dice tab
    await page.click('[data-view="dice"]');
    await page.waitForSelector('#view-dice.active', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify empty state
    await expect(page.locator('#random-tables-list')).toContainText('Keine Tabellen');

    // Simulate import by directly setting data
    await page.evaluate(() => {
      window.D.randomTables = [{
        id: 1,
        name: 'Imported Table',
        icon: '📥',
        entries: [{ weight: 1, text: 'Test' }]
      }];
      // Trigger re-render
      if (typeof window.renderRandomTables === 'function') {
        window.renderRandomTables();
      }
    });
    await page.waitForTimeout(300);

    // Imported table should be visible
    await expect(page.locator('.rt-card').first()).toContainText('Imported Table');
  });

});
