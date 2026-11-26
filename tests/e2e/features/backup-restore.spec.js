// @ts-check
import { test, expect, httpAppUrl } from '../helpers/http-app.js';
import { withInitialSeed } from '../helpers/initial-seed.js';
import { navigateToTab, waitForAppReady } from '../helpers/test-utils.js';

/**
 * Auto-Backup-Restore im echten Browser — R01/R05 (Code-Review 2026-09-21, Einheit U4)
 *
 * Primaerpfad mit echtem IndexedDB: createAutoBackup() schreibt in den 'backups'-Store,
 * das Backup-Modal nennt die Kampagne und adressiert das Backup ueber seinen Zeitstempel
 * (data-id), der Restore bringt JEDES Kampagnenfeld zurueck (auch nach einem Neuladen),
 * und Strg+Z stellt den Stand vor dem Restore wieder her.
 *
 * Die Seed-Kampagne ist bereits "gueltig" (aktueller _version, timers/shops/campaign,
 * vollstaendiges _nextId), damit weder load() migriert noch validateDataIntegrity() eine
 * Reparatur-Speicherung einplant. Das Startskript wird nach dem ersten Laden entfernt,
 * damit der Reload den wiederhergestellten Stand nicht ueberschreibt.
 * Voraussetzung: frischer Dev-Build (python build.py).
 */

const KEY = 'dnd-tracker-v4';

const FULL = {
    _version: '2.6.1',
    characters: [
        {
            id: 1,
            name: 'Thorin',
            characterClass: 'Kämpfer',
            level: 3,
            xp: 900,
            hpCurrent: 20,
            hpMax: 28,
            conditions: [{ type: 'custom', name: 'Verflucht', addedAt: 1 }],
            skillProficiencies: {},
            skillExpertise: {},
            attacks: [],
            spellSlotsMax: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            spellSlotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ],
    npcs: [{ id: 1, name: 'Elminster' }],
    quests: [{ id: 1, title: 'Drachenhort', createdAt: 1 }],
    locations: [{ id: 1, name: 'Tiefwasser' }],
    loot: [],
    encounters: [],
    links: [],
    filters: [],
    storyArcs: [],
    tags: ['boss'],
    wiki: [],
    spells: [{ id: 1, name: 'Feuerball', spellClass: 'Magier', spellClasses: ['Magier'] }],
    sessionNotes: [{ id: 1, date: '2026-09-01', content: '<p>U4-Sitzung</p>' }],
    quickNotes: 'U4-Schnellnotiz',
    initiative: { combatants: [], currentTurn: 0, round: 1 },
    calendar: { day: 12, month: 5, year: 1492, events: [{ id: 1, title: 'Fest' }] },
    settings: {
        theme: 'dark',
        lastView: 'dashboard',
        enableMarkdownShortcuts: true,
        enableMarkdownImportExport: true,
        markdownOnboardingSeen: true,
        levelingMode: 'milestone'
    },
    bestiary: [{ id: 1, name: 'U4-Drache' }],
    bestiaryFavorites: ['goblin'],
    sessionPreps: [{ id: 1, titel: 'U4-Prep' }],
    factions: [{ id: 1, name: 'U4-Harfner', ruf: 10 }],
    soundboard: { scenes: [{ id: 1, name: 'Taverne', slot: 1, tracks: [] }] },
    shops: [],
    randomTables: [
        { id: 1, name: 'U4-Wetter', icon: 'W', entries: [{ weight: 1, text: 'Regen' }] }
    ],
    quickRefCustom: [{ id: 1, title: 'U4-Hausregel', content: 'x' }],
    dmScreenNotes: 'U4-DM-Notiz',
    partyGold: 1234,
    timers: [],
    campaign: {},
    _nextId: {
        characters: 2,
        npcs: 2,
        locations: 2,
        quests: 2,
        encounters: 1,
        spells: 2,
        loot: 1,
        items: 1,
        wiki: 1,
        sessionNotes: 2,
        randomTables: 2,
        combatants: 1,
        calendarEvents: 2,
        factions: 2,
        sessionPreps: 2,
        bestiary: 2,
        quickRefCustom: 2
    }
};

// settings.lastView ist navigationsgetrieben -> settings nur ueber levelingMode pruefen
const CHECKED = [
    'characters',
    'sessionNotes',
    'quickNotes',
    'calendar',
    'tags',
    'bestiary',
    'bestiaryFavorites',
    'sessionPreps',
    'factions',
    'soundboard',
    'randomTables',
    'quickRefCustom',
    'dmScreenNotes',
    'partyGold',
    'initiative'
];

async function laden(page, full) {
    await withInitialSeed(
        page,
        ([key, data]) => {
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(key + '_ts', String(Date.now()));
        },
        [KEY, full],
        async () => {
            await page.goto(httpAppUrl(page));
            await waitForAppReady(page);
        }
    );
}

test.describe('Auto-Backup-Restore (R01/R05)', () => {
    test('IndexedDB-Backup ueber das Modal wiederherstellen: alle Felder zurueck, Kampagne sichtbar', async ({
        page
    }) => {
        // Abweichende Startsaat: eine erneute Saat darf den Restore nicht verdecken.
        await laden(page, { ...FULL, quickNotes: 'U4-Startsaat vor dem Backup' });
        const dialoge = [];
        page.on('dialog', dialog => {
            dialoge.push(dialog.message());
            dialog.accept();
        });

        // Echter Primaerpfad: Auto-Backup in den IndexedDB-Store 'backups'
        await page.evaluate(async notes => {
            window.D.quickNotes = notes;
            await window.createAutoBackup();
        }, FULL.quickNotes);
        const imStore = await page.evaluate(
            () =>
                new Promise((resolve, reject) => {
                    const tx = window.idb.transaction(['backups'], 'readonly');
                    const req = tx
                        .objectStore('backups')
                        .index('campaign')
                        .getAll('dnd-tracker-v4');
                    req.onsuccess = () => resolve(req.result.length);
                    req.onerror = () => reject(req.error);
                })
        );
        expect(imStore).toBe(1);

        // Nach dem Backup weiterarbeiten
        await page.evaluate(async () => {
            window.D.sessionNotes = [];
            window.D.factions = [];
            window.D.quickNotes = 'nach dem Backup';
            window.D.settings.levelingMode = 'xp';
            await window.saveImmediate();
        });

        await navigateToTab(page, 'data');
        await page.click('[data-action="call"][data-value="showBackupsModal"]');
        const kopf = page.locator('#backups-list .meta-text');
        await expect(kopf).toHaveText('Kampagne: Standard-Kampagne');
        const knoepfe = page.locator('#backups-list [data-action="restore-backup"]');
        await expect(knoepfe).toHaveCount(1);
        const dataId = await knoepfe.first().getAttribute('data-id');
        expect(dataId).toMatch(/^\d+$/);

        await knoepfe.first().click();
        await page.waitForFunction(() => (window.D.sessionNotes || []).length === 1);
        expect(dialoge.some(m => m.includes('Standard-Kampagne') && m.includes('Strg+Z'))).toBe(
            true
        );

        // Gespeicherter Stand (saveImmediate() wird im Restore abgewartet)
        await expect
            .poll(async () =>
                page.evaluate(
                    k => (JSON.parse(localStorage.getItem(k) || '{}').sessionNotes || []).length,
                    KEY
                )
            )
            .toBe(1);
        const persistiert = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
        for (const key of CHECKED) {
            expect({ key, v: persistiert[key] }).toEqual({ key, v: FULL[key] });
        }
        expect(persistiert.settings.levelingMode).toBe('milestone');
        expect(persistiert._version).toBe('2.6.1');

        // Neuladen: der wiederhergestellte Stand bleibt
        await page.evaluate(() => sessionStorage.removeItem('u4-seeded'));
        await page.reload();
        await waitForAppReady(page);
        const nachReload = await page.evaluate(
            keys => Object.fromEntries(keys.map(k => [k, window.D[k]])),
            CHECKED
        );
        for (const key of CHECKED) {
            expect({ key, v: nachReload[key] }).toEqual({ key, v: FULL[key] });
        }
    });

    test('Strg+Z nach dem Restore stellt den Stand davor wieder her', async ({ page }) => {
        await laden(page, FULL);
        page.on('dialog', dialog => dialog.accept());
        await page.evaluate(() => window.createAutoBackup());
        await page.evaluate(async () => {
            window.D.quickNotes = 'vor dem Restore';
            window.D.sessionNotes = [];
            await window.saveImmediate();
        });

        await navigateToTab(page, 'data');
        await page.click('[data-action="call"][data-value="showBackupsModal"]');
        await page.locator('#backups-list [data-action="restore-backup"]').first().click();
        await page.waitForFunction(() => window.D.quickNotes === 'U4-Schnellnotiz');

        await page.evaluate(() => window.undo());
        await page.waitForFunction(() => window.D.quickNotes === 'vor dem Restore');
        expect(await page.evaluate(() => window.D.sessionNotes.length)).toBe(0);
    });
});
