// @ts-check
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

/**
 * E2E Tests — Kampagnen-Import im Browser (R03, Korrekturrunde F5)
 *
 * Das Regressionsnetz zu R03 ("Ueberschreiben ersetzt statt mischt") lag bisher
 * ausschliesslich in Jest-vm-Werkbaenken; der geplante Browser-Test fehlte (R03-Restbefund
 * der Abnahme). Diese Spec spielt den Fall im echten gebauten Bundle durch:
 *
 *   1. Eine laufende Kampagne mit einer Fraktion, einer Schnellnotiz und _nextId.npcs = 1.
 *   2. Ein ECHTER Export ohne _nextId, mit NPC-IDs [1, 2] und ohne factions, wird ueber den
 *      echten Eintrittspunkt (#import-file) im Ueberschreib-Zweig eingespielt (Entscheidung
 *      D3: erster Dialog Abbrechen = weitere Optionen, zweiter Dialog OK = ERSETZEN).
 *   3. Ein NPC wird ueber das echte Formular angelegt.
 *   4. Neuladen.
 *
 * Erwartung: der neue NPC bekommt die ID 3 (nicht 1 — der Fehler vor R03: der Zaehler der
 * alten Kampagne blieb stehen, weil jeder Export _nextId entfernt), die IDs sind eindeutig,
 * Fraktionen und Schnellnotizen der alten Kampagne sind weg (Standardwerte), und das
 * Neuladen aendert die IDs nicht mehr (validateDataIntegrity() findet nichts zu reparieren).
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/**
 * Seed der laufenden Kampagne. Spiegelt CLEAN_SESSION_SEED aus
 * tests/e2e/helpers/test-utils.js (weit-in-der-Zukunft-_version, damit load() migrateData()
 * ueberspringt; markdownOnboardingSeen, damit der Onboarding-Hinweis nach 2 s keinen Klick
 * abfaengt; die vier Schluessel, die initializeData() NICHT vorbelegt, plus ein voller
 * _nextId-Satz, damit kein Reparatur-save() den geteilten #toast-Knoten belegt) und ergaenzt
 * die drei Felder dieses Tests: eine Fraktion und eine Schnellnotiz, die die Datei NICHT
 * kennt, und _nextId.npcs = 1.
 *
 * Bewusst GEGEN das Vorhandensein des Schluessels abgesichert (Muster
 * seedCleanSessionOnce()): addInitScript() laeuft bei JEDER Navigation, also auch beim
 * Neuladen in Schritt 4 — ein ungeschuetzter Seed wuerde den importierten Stand
 * ueberschreiben und den Reload-Teil des Tests sinnlos machen.
 * @param {import('@playwright/test').Page} page
 */
async function seedLaufendeKampagne(page) {
    await page.addInitScript(() => {
        try {
            if (localStorage.getItem('dnd-tracker-v4') !== null) return;
            localStorage.setItem(
                'dnd-tracker-v4',
                JSON.stringify({
                    _version: '99.0.0',
                    settings: {
                        theme: 'dark',
                        lastView: 'dashboard',
                        enableMarkdownShortcuts: true,
                        enableMarkdownImportExport: true,
                        markdownOnboardingSeen: true,
                        levelingMode: 'xp'
                    },
                    randomTables: [],
                    timers: [],
                    shops: [],
                    campaign: {},
                    factions: [{ id: 1, name: 'Alte Gilde' }],
                    quickNotes: 'Alte Notiz',
                    _nextId: {
                        characters: 1,
                        npcs: 1,
                        locations: 1,
                        quests: 1,
                        encounters: 1,
                        spells: 1,
                        loot: 1,
                        items: 1,
                        wiki: 1,
                        sessionNotes: 1,
                        randomTables: 1
                    }
                })
            );
        } catch {
            // file:// localStorage-Beschraenkungen unterscheiden sich je Browser-Build;
            // schlaegt der Seed still fehl, startet die App mit ihrem eigenen Standard.
        }
    });
}

/** @param {import('@playwright/test').Page} page */
async function ladeApp(page) {
    await page.goto(APP_URL);
    await waitForAppReady(page);
}

/**
 * Spielt eine Kampagnendatei ueber #import-file im Ueberschreib-Zweig ein (D3: ersten
 * Dialog abweisen, zweiten bestaetigen) und wartet auf 'Import OK'.
 * @param {import('@playwright/test').Page} page
 * @param {object} payload
 */
async function importiereUeberschreibend(page, payload) {
    let dialoge = 0;
    page.on('dialog', dialog => {
        dialoge++;
        return dialoge === 1 ? dialog.dismiss() : dialog.accept();
    });
    await page.setInputFiles('#import-file', {
        name: 'kampagne-umzug.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(payload))
    });
    // U5: auf das Kampfprotokoll warten statt auf den abgeschalteten Alt-Knoten
    // #toast. Strenger als vorher: der Ringpuffer verliert die Meldung nicht, waehrend
    // der geteilte #toast-Knoten von jeder spaeteren Meldung ueberschrieben wurde —
    // genau daran haengt die Seed-Begruendung im Kopf dieser Datei.
    await page.waitForFunction(
        () =>
            (typeof window.getCombatLog === 'function' ? window.getCombatLog() : []).some(e =>
                String(e.text).includes('Import OK')
            ),
        { timeout: 15000 }
    );
}

/** Liest den Zustand, der fuer diesen Test zaehlt. @param {import('@playwright/test').Page} page */
async function zustand(page) {
    return page.evaluate(() => ({
        npcIds: (window.D.npcs || []).map(n => n.id),
        npcNamen: (window.D.npcs || []).map(n => n.name),
        factions: window.D.factions,
        quickNotes: window.D.quickNotes,
        nextIdNpcs: window.D._nextId ? window.D._nextId.npcs : undefined
    }));
}

test.describe('Kampagnen-Import im Browser — Ueberschreiben ersetzt, IDs bleiben eindeutig (R03)', () => {
    test('Import, NPC ueber das Formular anlegen, Neuladen: neue ID 3, alte Fraktion und Notiz weg, IDs ueberleben das Neuladen', async ({
        page
    }) => {
        const fehler = [];
        page.on('pageerror', e => fehler.push(String(e)));
        page.on('console', msg => {
            if (msg.type() === 'error') fehler.push(msg.text());
        });

        await seedLaufendeKampagne(page);
        await ladeApp(page);

        // Nicht-Vakuitaet: der Seed ist wirklich angekommen
        const vorher = await zustand(page);
        expect(vorher.factions).toEqual([{ id: 1, name: 'Alte Gilde' }]);
        expect(vorher.quickNotes).toBe('Alte Notiz');
        expect(vorher.nextIdNpcs).toBe(1);

        // Echter Export: der Exporter entfernt _nextId, die Datei kennt keine factions
        const version = await page.evaluate(() => window.APP_CONFIG.VERSION);
        await importiereUeberschreibend(page, {
            _campaignName: 'Importierte Kampagne',
            _version: version,
            _exportDate: new Date().toISOString(),
            npcs: [
                { id: 1, name: 'Import-NPC A' },
                { id: 2, name: 'Import-NPC B' }
            ]
        });

        const nachImport = await zustand(page);
        expect(nachImport.npcIds).toEqual([1, 2]);
        expect(nachImport.factions).toEqual([]);
        expect(nachImport.quickNotes).toBe('');

        // NPC ueber das ECHTE Formular anlegen (Muster tests/e2e/crud/npcs.spec.js)
        const navTab = page.locator('.nav-tab[data-view="npcs"]');
        if (!(await navTab.isVisible())) {
            const gruppe = page.locator('.nav-group', { has: navTab });
            if ((await gruppe.count()) > 0) await gruppe.locator('.nav-group-btn').click();
        }
        await navTab.click();
        await page.click('[data-action="show-modal"][data-value="npc-modal"]');
        await page.locator('#npc-name').fill('Neu angelegter NPC');
        await page.click('[data-action="call"][data-value="saveNPC"]');

        await expect
            .poll(
                () =>
                    page.evaluate(() =>
                        (window.D.npcs || []).map(n => n.id + ':' + n.name).join('|')
                    ),
                { timeout: 10000 }
            )
            .toBe('1:Import-NPC A|2:Import-NPC B|3:Neu angelegter NPC');

        // Auf den entprellten save() warten, bevor neu geladen wird
        await expect
            .poll(
                () =>
                    page.evaluate(() => {
                        const roh = localStorage.getItem('dnd-tracker-v4');
                        if (!roh) return null;
                        try {
                            return (JSON.parse(roh).npcs || []).map(n => n.id).join(',');
                        } catch {
                            return null;
                        }
                    }),
                { timeout: 10000 }
            )
            .toBe('1,2,3');

        await page.reload();
        await waitForAppReady(page);
        // validateDataIntegrity() plant eine Reparatur erst 1 s nach load() ein — solange
        // warten, damit ein etwaiges Umnummerieren sichtbar wird statt uebersehen zu werden.
        await page.waitForTimeout(1500);

        const nachReload = await zustand(page);
        expect(nachReload.npcIds).toEqual([1, 2, 3]);
        expect(new Set(nachReload.npcIds).size).toBe(3);
        expect(nachReload.npcNamen).toEqual(['Import-NPC A', 'Import-NPC B', 'Neu angelegter NPC']);
        expect(nachReload.factions).toEqual([]);
        expect(nachReload.quickNotes).toBe('');

        expect(fehler).toEqual([]);
    });
});
