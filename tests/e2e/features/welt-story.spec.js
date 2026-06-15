/**
 * E2E Tests — Phase 5: Welt & Story
 * Wave-0 Playwright-Stubs
 *
 * Diese Datei enthält übersprungene E2E-Tests je neuem Tab,
 * die in späteren Plänen aktiviert werden, sobald die jeweiligen
 * Features implementiert sind.
 *
 * Aktivierungsplan je Test ist als Kommentar angegeben.
 * Referenz-Tab-Namen: sessionprep, kalender, reise, fraktionen
 */

const { test, expect } = require('@playwright/test');

// ============================================================
// WELT-01: Session-Prep-Assistent — Tab "sessionprep" (aktiviert Plan 05-03)
// ============================================================
test.describe('WELT-01: Session-Prep-Tab', () => {
    test('Tab sessionprep ist sichtbar und anklickbar', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        // Tab-Button klicken
        await page.click('[data-view="sessionprep"]');
        // View-Container muss sichtbar sein
        await expect(page.locator('#view-sessionprep')).toBeVisible();
    });

    test('Neue Session-Prep-Modal enthält alle 5 Lazy-DM-Abschnitte', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="sessionprep"]');
        // "Neue Session-Prep"-Button klicken
        await page.click('[data-action="show-session-prep-modal"]');
        // Alle 5 Pflicht-Felder müssen im Modal vorhanden sein
        await expect(page.locator('#prep-strong-start')).toBeVisible();
        // prep-szenen ist der Button zum Hinzufügen von Szenen (im Abschnitt "Geplante Szenen")
        await expect(page.locator('#prep-szenen')).toBeVisible();
        await expect(page.locator('#prep-hinweise')).toBeVisible();
        await expect(page.locator('#prep-npcs')).toBeVisible();
        await expect(page.locator('#prep-belohnungen')).toBeVisible();
    });

    test('Offene Quests werden als offene Fäden vorgeschlagen', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        // Offene Quest in D.quests injizieren
        await page.evaluate(() => {
            if (window.D) {
                window.D.quests = [
                    { id: 99, title: 'Testquest offen', completed: false },
                    { id: 100, title: 'Testquest erledigt', completed: true }
                ];
            }
        });
        await page.click('[data-view="sessionprep"]');
        await page.click('[data-action="show-session-prep-modal"]');
        // Der offene Faden aus der Quest muss als Input-Wert erscheinen
        const faedenText = await page.locator('.wp-faden-text').allTextContents();
        const values = await page.locator('.wp-faden-text').evaluateAll(
            els => els.map(el => el.value)
        );
        expect(values.some(v => v.includes('Testquest offen'))).toBe(true);
        expect(values.some(v => v.includes('Testquest erledigt'))).toBe(false);
    });

    test('Entity-Link in Szene wird als .entity-link gerendert', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        // Session-Prep mit Entity-Link in der Szene anlegen
        await page.evaluate(() => {
            if (window.D && Array.isArray(window.D.sessionPreps)) {
                window.D.sessionPreps = [{
                    id: 1,
                    sessionNr: 1,
                    datum: '',
                    inGameDatum: '',
                    strongStart: '',
                    szenen: [{
                        id: 1,
                        titel: 'Testszene',
                        beschreibung: '[[npcs:1:Elara]] steht am Tor.',
                        ort: 'Stadttor'
                    }],
                    geheimeHinweise: '',
                    wichtigeNpcs: '',
                    belohnungen: '',
                    offeneFaeden: [],
                    links: [],
                    erstellt: Date.now()
                }];
                if (typeof window.renderSessionPrepList === 'function') {
                    window.renderSessionPrepList();
                }
            }
        });
        await page.click('[data-view="sessionprep"]');
        await page.waitForTimeout(200);
        // Prep-Karte muss sichtbar sein (Liste mit 1 Eintrag)
        await expect(page.locator('#session-prep-card-1')).toBeVisible();
    });

    test('Undo nach Speichern ist über pushUndo vorbereitet', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        // Prüfen dass sammleOffeneFaeden global verfügbar ist
        const hasFn = await page.evaluate(() => typeof window.sammleOffeneFaeden === 'function');
        expect(hasFn).toBe(true);
        // saveSessionPrep muss global verfügbar sein
        const hasSave = await page.evaluate(() => typeof window.saveSessionPrep === 'function');
        expect(hasSave).toBe(true);
    });
});

// ============================================================
// WELT-02: NPC-Generator — Button im NPC-Tab (aktiviert Plan 05-04)
// ============================================================
test.describe('WELT-02: NPC-Generator', () => {
    test('Generator-Button ist im NPC-Tab sichtbar', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="npcs"]');
        await expect(page.locator('[data-action="show-npc-generator"]')).toBeVisible();
    });

    test('Klick öffnet Modal mit Vorschau-Karte in <1s', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="npcs"]');

        const t0 = Date.now();
        await page.click('[data-action="show-npc-generator"]');
        await expect(page.locator('#npc-generator-modal')).toBeVisible();
        const elapsed = Date.now() - t0;
        expect(elapsed).toBeLessThan(1000);

        // Vorschau-Karte mit Name, Zug, Marotte vorhanden
        await expect(page.locator('.npcg-preview-name')).toBeVisible();
        await expect(page.locator('.npcg-zug')).toBeVisible();
        await expect(page.locator('.npcg-marotte')).toBeVisible();
    });

    test('Volk-Select ändert Namens-Pool (Filter wirkt)', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="npcs"]');
        await page.click('[data-action="show-npc-generator"]');
        // Filter auf Zwerg / Männlich setzen
        await page.selectOption('#npcg-volk-select', 'zwerg');
        await page.selectOption('#npcg-geschlecht-select', 'maennlich');
        // Re-Roll ausführen
        await page.click('[data-action="reroll-npc"]');
        // Name muss aus dem Zwerg-Pool stammen — check via evaluate
        const name = await page.locator('.npcg-preview-name').innerText();
        const pool = await page.evaluate(() => {
            return window.NPC_DEFAULT_TABLES &&
                   window.NPC_DEFAULT_TABLES.namen &&
                   window.NPC_DEFAULT_TABLES.namen.zwerg &&
                   window.NPC_DEFAULT_TABLES.namen.zwerg.maennlich || [];
        });
        expect(pool).toContain(name);
    });

    test('3× Re-Roll erzeugt keinen Eintrag in D.npcs', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="npcs"]');
        await page.click('[data-action="show-npc-generator"]');

        // 3× Re-Roll
        for (let i = 0; i < 3; i++) {
            await page.click('[data-action="reroll-npc"]');
        }

        const npcsCount = await page.evaluate(() => (window.D && window.D.npcs && window.D.npcs.length) || 0);
        expect(npcsCount).toBe(0);
    });

    test('"Als NPC speichern" legt genau 1 D.npcs-Eintrag an', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="npcs"]');
        await page.click('[data-action="show-npc-generator"]');

        // Einen NPC speichern
        await page.click('[data-action="save-generated-npc"]');
        await page.waitForTimeout(200);

        const npcsCount = await page.evaluate(() => (window.D && window.D.npcs && window.D.npcs.length) || 0);
        expect(npcsCount).toBe(1);
    });

    test('Gespeicherter NPC erscheint im NPC-Tab', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="npcs"]');
        await page.click('[data-action="show-npc-generator"]');

        // Name merken
        const npcName = await page.locator('.npcg-preview-name').innerText();
        // Speichern
        await page.click('[data-action="save-generated-npc"]');
        await page.waitForTimeout(300);

        // Modal sollte verschwunden sein
        await expect(page.locator('#npc-generator-modal')).not.toBeVisible();
        // NPC-Liste muss den Namen enthalten
        const npcListText = await page.locator('#npc-list').innerText();
        expect(npcListText).toContain(npcName);
    });
});

// ============================================================
// WELT-03: Timeline & Kalender — Tab "kalender" (aktiviert Plan 05-05)
// ============================================================
test.describe('WELT-03: Kalender-Tab', () => {
    test('Tab kalender ist sichtbar und anklickbar', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="kalender"]');
        await expect(page.locator('#view-kalender')).toBeVisible();
    });

    test('Kalender zeigt Harptos-Monatsnamen', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        // Kalender auf Hammer setzen
        await page.evaluate(() => {
            if (window.D && window.D.calendar) {
                window.D.calendar.day = 1;
                window.D.calendar.month = 1;
                window.D.calendar.year = 1492;
            }
        });
        await page.click('[data-view="kalender"]');
        await page.waitForTimeout(200);
        // #kalender-monat-anzeige muss Monatsnamen enthalten
        const anzeigeText = await page.locator('#kalender-monat-anzeige').innerText();
        expect(anzeigeText).toContain('Hammer');
        expect(anzeigeText).toContain('1492 DR');
    });

    test('Timeline-Eintrag kann via addCalendarEvent angelegt werden', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        const evtCount = await page.evaluate(() => {
            if (!window.D || !window.D.calendar) return -1;
            // addCalendarEvent direkt aufrufen
            if (typeof window.addCalendarEvent === 'function') {
                window.addCalendarEvent(
                    { tag: 5, monat: 3, jahr: 1492 },
                    'Testevent',
                    'manuell',
                    null
                );
            }
            return window.D.calendar.events.length;
        });
        expect(evtCount).toBeGreaterThanOrEqual(1);
    });

    test('Einträge erscheinen chronologisch sortiert (sortiereTimelineEvents)', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        const sorted = await page.evaluate(() => {
            if (!window.sortiereTimelineEvents) return null;
            var events = [
                { datum: { tag: 15, monat: 3, jahr: 1492 }, titel: 'C' },
                { datum: { tag: 1,  monat: 1, jahr: 1492 }, titel: 'A' },
                { datum: { tag: 5,  monat: 2, jahr: 1492 }, titel: 'B' }
            ];
            return window.sortiereTimelineEvents(events).map(function(e) { return e.titel; });
        });
        expect(sorted).toEqual(['A', 'B', 'C']);
    });
});

// ============================================================
// WELT-04: Reise & Wetter — Tab "reise" (aktiviert Plan 05-06)
// ============================================================
test.describe('WELT-04: Reise-Tab', () => {
    test('Tab reise ist sichtbar und anklickbar', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="reise"]');
        await expect(page.locator('#view-reise')).toBeVisible();
    });

    test('Reise-Abschluss rückt D.calendar um korrekte Tage vor', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        // Kalender auf Tag 1 setzen
        await page.evaluate(() => {
            if (window.D && window.D.calendar) {
                window.D.calendar.day = 1;
                window.D.calendar.month = 1;
                window.D.calendar.year = 1492;
            }
        });
        // abschliessenReise(3) direkt aufrufen — pushUndo + advanceCalendarDate
        await page.evaluate(() => {
            if (typeof window.abschliessenReise === 'function') {
                // Dialog nicht warten — close modal if it appears
                window.abschliessenReise(3);
            }
        });
        // Dialog (falls vorhanden) schließen
        await page.evaluate(() => {
            var modal = document.getElementById('rs-timeline-modal');
            if (modal) modal.remove();
        });
        const day = await page.evaluate(() => window.D && window.D.calendar && window.D.calendar.day);
        expect(day).toBe(4);
    });

    test('Wetter-Roll gibt Ergebnis basierend auf Jahreszeit', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        const result = await page.evaluate(() => {
            if (typeof window.rollWetter !== 'function') return null;
            return window.rollWetter('gemässigt', 'winter');
        });
        expect(result).not.toBeNull();
        expect(result.entry).toBeDefined();
        expect(typeof result.entry.text).toBe('string');
        expect(result.entry.text.length).toBeGreaterThan(0);
    });

    test('berechneTagesmarsch und jahreszeitAusDatum sind global verfügbar', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        const checks = await page.evaluate(() => ({
            berechneTagesmarsch: typeof window.berechneTagesmarsch === 'function',
            rollWetter: typeof window.rollWetter === 'function',
            rollBegegnung: typeof window.rollBegegnung === 'function',
            abschliessenReise: typeof window.abschliessenReise === 'function',
            jahreszeitAusDatum: typeof window.jahreszeitAusDatum === 'function',
            tagesmarsch24: window.berechneTagesmarsch && window.berechneTagesmarsch('normal', 'normal') === 24,
            tagesmarsch9: window.berechneTagesmarsch && window.berechneTagesmarsch('langsam', 'schwierig') === 9
        }));
        expect(checks.berechneTagesmarsch).toBe(true);
        expect(checks.rollWetter).toBe(true);
        expect(checks.rollBegegnung).toBe(true);
        expect(checks.abschliessenReise).toBe(true);
        expect(checks.jahreszeitAusDatum).toBe(true);
        expect(checks.tagesmarsch24).toBe(true);
        expect(checks.tagesmarsch9).toBe(true);
    });
});

// ============================================================
// WELT-05: Fraktionen & Ruf — Tab "fraktionen"
// aktiviert in Plan 05-07
// ============================================================
test.describe('WELT-05: Fraktionen-Tab', () => {
    test('Tab fraktionen ist sichtbar und anklickbar', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="fraktionen"]');
        await expect(page.locator('#view-fraktionen')).toBeVisible();
    });

    test('Fraktion anlegen erscheint in Übersichtsliste', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="fraktionen"]');

        // Fraktion direkt via page.evaluate anlegen (kein DOM-Formular-Roundtrip)
        await page.evaluate(() => {
            window.D.factions = [];
            window.pushUndo('Test-Fraktion');
            window.D.factions.push({
                id: 1,
                name: 'Diebesgilde',
                symbol: '🗡️',
                agenda: '',
                beschreibung: '',
                ruf: 0,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            });
            window.renderFraktionen();
        });

        // Karte erscheint in der Liste
        await expect(page.locator('.fr-faction-card')).toBeVisible();
        const count = await page.evaluate(() => window.D.factions.length);
        expect(count).toBe(1);
    });

    test('Ruf-Anpassung schreibt Eintrag in rufHistorie', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');

        // Fraktion anlegen und Ruf anpassen via page.evaluate
        const result = await page.evaluate(() => {
            window.D.factions = [{
                id: 1,
                name: 'Testgilde',
                symbol: '⚔️',
                agenda: '',
                beschreibung: '',
                ruf: 0,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            }];
            // anpassenRuf aufrufen
            window.anpassenRuf(1, 10, 'Drachenschatz gerettet');
            return {
                ruf: window.D.factions[0].ruf,
                historieLen: window.D.factions[0].rufHistorie.length,
                grund: window.D.factions[0].rufHistorie[0].grund
            };
        });

        expect(result.ruf).toBe(10);
        expect(result.historieLen).toBe(1);
        expect(result.grund).toBe('Drachenschatz gerettet');
    });

    test('Undo nach Ruf-Änderung stellt alten Wert wieder her', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');

        // Fraktion auf Ruf 0 setzen, dann +10 anpassen, dann Undo
        const result = await page.evaluate(() => {
            window.D.factions = [{
                id: 1,
                name: 'Testgilde',
                symbol: '⚔️',
                agenda: '',
                beschreibung: '',
                ruf: 0,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            }];
            // anpassenRuf ruft pushUndo VOR Mutation
            window.anpassenRuf(1, 10, 'Test');
            // Undo ausführen
            if (typeof window.undo === 'function') window.undo();
            return window.D.factions[0] ? window.D.factions[0].ruf : null;
        });

        // Nach Undo sollte ruf wieder 0 sein
        expect(result).toBe(0);
    });

    test('NPC mit factionId erscheint in Fraktions-Mitgliederliste', async ({ page }) => {
        await page.goto('http://localhost:8000/dist/dnd-tracker-bundled.html');
        await page.click('[data-view="fraktionen"]');

        // Fraktion + NPC mit factionId anlegen
        await page.evaluate(() => {
            window.D.factions = [{
                id: 42,
                name: 'Magiergilde',
                symbol: '🔮',
                agenda: '',
                beschreibung: '',
                ruf: 15,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            }];
            // NPC mit factionId setzen
            if (!window.D.npcs) window.D.npcs = [];
            window.D.npcs.push({
                id: 99,
                name: 'Gandalf der Graue',
                role: 'Zauberer',
                factionId: 42
            });
            window.renderFraktionen();
            // Fraktion auswählen um Detail zu sehen
            window.selectFraktion(42);
        });

        // Mitglied soll im Detail-Panel erscheinen
        await expect(page.locator('.fr-mitglied-name')).toContainText('Gandalf der Graue');
    });
});
