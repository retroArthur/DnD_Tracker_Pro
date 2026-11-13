const {
    erzeugeUrsprung,
    oeffneTab,
    INDEX_KEY,
    STANDARD_KEY: KEY
} = require('./helpers/multi-tab-harness.js');

const LIMIT = 5 * 1024 * 1024;
const kampagne = quickNotes => ({ _version: '2.6.1', quickNotes });

const speichern = {
    sofort: tab => tab.ctx.saveImmediate(),
    entprellt: tab => tab.ctx.save(),
    automatisch: tab => expect(tab.ctx.saveAutomatic()).toBe(true)
};

describe('N49: Strg+S wartet auf eine Drop-Zuweisung', () => {
    test.each([
        ['localStorage', true],
        ['indexedDB', true],
        ['indexedDB', false]
    ])(
        '%s mit zugestelltem Signal %s: ein zuvor wartender Save erhält Bs bestätigten Stand',
        async (backend, signalZustellen) => {
            const ursprung = erzeugeUrsprung({
                lsQuotaZeichen: backend === 'indexedDB' ? 0 : Infinity
            });
            if (backend === 'indexedDB') ursprung.saeenIdb(KEY, kampagne('Alt'));
            else ursprung.saeen(KEY, kampagne('Alt'));
            const A = await oeffneTab(ursprung, 'A').starten();
            const B = await oeffneTab(ursprung, 'B').starten();
            const wartet = Promise.withResolvers();
            const schreiben = Promise.withResolvers();
            const idbWriteTx = A.ctx.idbWriteTx;
            A.ctx.idbWriteTx = async (...args) => {
                wartet.resolve(true);
                await schreiben.promise;
                // Ohne Meldung muss auch der wartende Save selbst den Rohdatensatz prüfen.
                // Der Drop kann schon vor dem transaktionalen Vergleich fehlschlagen.
                if (!signalZustellen) throw new Error('IndexedDB-Write abgebrochen');
                return idbWriteTx(...args);
            };
            const uebernehmen = jest.fn();
            const drop = A.ctx.saveImmediate(() => ({
                snapshot: { ...A.ctx.D, quickNotes: 'A'.repeat(LIMIT) },
                publish: uebernehmen
            }));
            let wartenderSave;
            try {
                expect(await Promise.race([wartet.promise, drop])).toBe(true);
                wartenderSave = speichern.sofort(A);
                if (!signalZustellen) B.ctx.broadcastSave = () => {};
                B.ctx.D.quickNotes = 'Bestätigte Notizen aus B';
                B.ctx.D.characters = [{ id: 1, name: 'Borin' }];
                expect(await B.ctx.saveImmediate()).toMatchObject({ success: true, backend });
                const gespeichert =
                    backend === 'indexedDB'
                        ? ursprung.idbDatensatz(KEY).data
                        : ursprung.ls.get(KEY);
                expect(JSON.parse(gespeichert).characters[0].name).toBe('Borin');
                if (signalZustellen) await ursprung.uhr.laufen(0);
                expect(A.ctx.isCampaignStorageStale(KEY)).toBe(signalZustellen);
                if (!signalZustellen) expect(ursprung.ls.has(KEY + '_rev')).toBe(false);
                // As wartender kleiner Save könnte jetzt wieder nach LocalStorage schreiben.
                ursprung.quota.zeichen = Infinity;
            } finally {
                schreiben.resolve();
            }
            expect(await drop).toMatchObject(
                signalZustellen ? { success: false, superseded: true } : { success: false }
            );
            expect(uebernehmen).not.toHaveBeenCalled();
            const ergebnis = await wartenderSave;
            const C = await oeffneTab(ursprung, 'C').starten();
            expect({
                ergebnis,
                notizen: C.ctx.D.quickNotes,
                charakter: C.ctx.D.characters[0]?.name
            }).toMatchObject({
                ergebnis: { success: false, superseded: true },
                notizen: 'Bestätigte Notizen aus B',
                charakter: 'Borin'
            });
        }
    );
});

describe('N01: fremder neuer Stand während eines IndexedDB-Saves', () => {
    const faelle = Object.keys(speichern).flatMap(modus =>
        ['groß', 'Quota-Fallback', 'Wiederholung'].map(pfad => [modus, pfad])
    );

    test.each(faelle)(
        '%s / %s: der zweite Tab behält seinen Stand beim Neustart',
        async (modus, pfad) => {
            const ursprung = erzeugeUrsprung({
                lsQuotaZeichen: pfad === 'Quota-Fallback' ? 2000 : LIMIT
            });
            ursprung.saeen(KEY, kampagne('Alt'));
            const A = await oeffneTab(ursprung, 'A').starten();
            const B = await oeffneTab(ursprung, 'B').starten();
            const original = A.ctx.idbWriteTx;
            let freigeben;
            const sperre = new Promise(resolve => (freigeben = resolve));
            let versuche = 0;
            A.ctx.idbWriteTx = async (...args) => {
                versuche++;
                if (pfad === 'Wiederholung' && versuche === 1)
                    throw new Error('Commit abgebrochen');
                const result = await original(...args);
                await sperre;
                return result;
            };

            A.ctx.D.quickNotes = 'A'.repeat(pfad === 'Quota-Fallback' ? 3000 : LIMIT);
            const aSave = speichern[modus](A);
            await ursprung.uhr.laufen(300);
            expect(versuche).toBe(pfad === 'Wiederholung' ? 2 : 1);
            expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes[0]).toBe('A');

            B.ctx.D.quickNotes = 'Neu aus B';
            expect(await B.ctx.saveImmediate()).toMatchObject({
                success: true,
                backend: 'localStorage'
            });
            const revision = ursprung.ls.get(KEY + '_rev');
            const zeitstempel = ursprung.ls.get(KEY + '_ts');
            await ursprung.uhr.laufen(0);
            expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);

            freigeben();
            await ursprung.uhr.laufen(0);
            await aSave;

            const C = await oeffneTab(ursprung, 'C').starten();
            expect(C.ctx.D.quickNotes.slice(0, 20)).toBe('Neu aus B');
            expect(ursprung.ls.get(KEY + '_ts')).toBe(zeitstempel);
            expect(ursprung.ls.get(KEY + '_rev')).toBe(revision);
            expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);
        }
    );

    test.each([Infinity, 0])(
        'verspäteter Autosave respektiert bestätigten IDB-Save bei LS-Quota %s',
        async quota => {
            const ursprung = erzeugeUrsprung({ lsQuotaZeichen: quota });
            ursprung.saeenIdb(KEY, kampagne('Alt'));
            const A = await oeffneTab(ursprung, 'A').starten();
            const B = await oeffneTab(ursprung, 'B').starten();
            const original = A.ctx.idbWriteTx;
            let freigeben;
            const sperre = new Promise(resolve => (freigeben = resolve));
            A.ctx.idbWriteTx = async (...args) => {
                await sperre;
                return original(...args);
            };

            A.ctx.D.quickNotes = 'A'.repeat(LIMIT);
            expect(A.ctx.saveAutomatic()).toBe(true);
            await ursprung.uhr.laufen(300);
            expect(ursprung.idbDatensatz(KEY).data).toContain('Alt');

            B.ctx.D.quickNotes = 'B'.repeat(LIMIT);
            expect(await B.ctx.saveImmediate()).toMatchObject({
                success: true,
                backend: 'indexedDB'
            });
            await ursprung.uhr.laufen(0);
            expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);

            freigeben();
            await ursprung.uhr.laufen(0);
            const C = await oeffneTab(ursprung, 'C').starten();
            expect(C.ctx.D.quickNotes[0]).toBe('B');
        }
    );

    test('überlappende IndexedDB-Saves desselben Tabs bestätigen den jüngeren Stand', async () => {
        const ursprung = erzeugeUrsprung();
        ursprung.saeen(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();

        A.ctx.D.quickNotes = 'A'.repeat(LIMIT);
        const erster = A.ctx.saveImmediate();
        A.ctx.D.quickNotes = 'B'.repeat(LIMIT);
        const zweiter = A.ctx.saveImmediate();
        await erster;
        expect(await zweiter).toMatchObject({ success: true, backend: 'indexedDB' });
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);
        const B = await oeffneTab(ursprung, 'B').starten();
        expect(B.ctx.D.quickNotes[0]).toBe('B');
    });

    test('eine optionale ältere IDB-Kopie überschreibt keinen bestätigten IDB-Save', async () => {
        const ursprung = erzeugeUrsprung();
        ursprung.saeen(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        const original = A.ctx.idbWriteTx;
        let freigeben;
        const sperre = new Promise(resolve => (freigeben = resolve));
        A.ctx.idbWriteTx = async (...args) => {
            await sperre;
            return original(...args);
        };

        A.ctx.D.quickNotes = 'A'.repeat(3 * 1024 * 1024);
        expect(await A.ctx.saveImmediate()).toMatchObject({
            success: true,
            backend: 'localStorage'
        });
        expect(ursprung.idbDatensatz(KEY)).toBeUndefined();
        B.ctx.D.quickNotes = 'B'.repeat(LIMIT);
        expect(await B.ctx.saveImmediate()).toMatchObject({ success: true, backend: 'indexedDB' });

        freigeben();
        await ursprung.uhr.laufen(0);
        const C = await oeffneTab(ursprung, 'C').starten();
        expect(C.ctx.D.quickNotes[0]).toBe('B');
    });

    test('ein vor der Transaktion verzögerter Save schreibt nach dem Umzugs-Import nicht zurück', async () => {
        const ursprung = erzeugeUrsprung();
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const original = A.ctx.idbWriteTx;
        let freigeben;
        const sperre = new Promise(resolve => (freigeben = resolve));
        A.ctx.idbWriteTx = async (...args) => {
            await sperre;
            return original(...args);
        };

        A.ctx.D.quickNotes = 'A'.repeat(LIMIT);
        const alt = A.ctx.saveImmediate();
        const schreibsperre = A.ctx.retireCampaignWrites();
        await ursprung.uhr.laufen(5001);
        await schreibsperre;

        // Der Umzugs-Import darf unter der Sperre schreiben. Der ältere Save
        // wartet noch beim Öffnen der Datenbank, ohne eigene Transaktion.
        A.ctx.idbWriteTx = original;
        expect(await A.ctx.writeCampaignData(KEY, kampagne('B'.repeat(LIMIT)))).toMatchObject({
            success: true,
            backend: 'indexedDB'
        });
        freigeben();
        await alt;

        const B = await oeffneTab(ursprung, 'B').starten();
        expect(B.ctx.D.quickNotes[0]).toBe('B');
    });

    test('ein bewusst nach dem Fremdsave angestoßener Save gewinnt weiterhin', async () => {
        const ursprung = erzeugeUrsprung();
        ursprung.saeen(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        B.ctx.D.quickNotes = 'Neu aus B';
        expect(await B.ctx.saveImmediate()).toMatchObject({ success: true });
        await ursprung.uhr.laufen(0);
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);

        A.ctx.D.quickNotes = 'A'.repeat(LIMIT);
        expect(await A.ctx.saveImmediate()).toMatchObject({ success: true, backend: 'indexedDB' });
        const C = await oeffneTab(ursprung, 'C').starten();
        expect(C.ctx.D.quickNotes[0]).toBe('A');
    });
});

describe('N14: Umzugsimport mit einem zweiten offenen Tab', () => {
    test('ein alter Tab übernimmt den bestätigten IndexedDB-Import nicht per Autosave', async () => {
        const ursprung = erzeugeUrsprung();
        ursprung.saeenIdb(KEY, kampagne('A'.repeat(LIMIT)));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B', {
            module: [
                'systems/campaign-manager/campaign-manager.js',
                'systems/migration/full-export.js'
            ]
        }).starten();
        expect(A.ctx.D.quickNotes[0]).toBe('A');
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);

        await B.ctx.retireCampaignWrites();
        await expect(
            B.ctx.importFullExport({
                _exportType: 'full-v1',
                campaigns: { [KEY]: { data: kampagne('B'.repeat(LIMIT)) } },
                campaignIndex: { active: KEY, campaigns: [] }
            })
        ).resolves.toMatchObject({ campaignCount: 1 });
        expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes[0]).toBe('B');

        // Die Storage- und Broadcast-Ereignisse wurden noch nicht zugestellt.
        A.ctx.D.quickNotes += ' Änderung aus dem alten Tab';
        expect(A.ctx.saveAutomatic()).toBe(false);
        await ursprung.uhr.laufen(350);

        const C = await oeffneTab(ursprung, 'C').starten();
        expect(C.ctx.D.quickNotes[0]).toBe('B');
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);
    });

    test('bei voller localStorage-Quota erreicht die Meldung auch eine andere Kampagne', async () => {
        const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        const importKey = 'dnd-campaign-123';
        ursprung.saeenIdb(importKey, kampagne('A'.repeat(LIMIT)));
        const A = await oeffneTab(ursprung, 'A', { aktiv: importKey }).starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        expect(A.ctx.isCampaignStorageStale(importKey)).toBe(false);

        await expect(
            B.ctx.writeCampaignData(importKey, kampagne('B'.repeat(LIMIT)))
        ).resolves.toMatchObject({
            success: true,
            backend: 'indexedDB'
        });
        await ursprung.uhr.laufen(0);
        expect(A.ctx.saveAutomatic()).toBe(false);
        expect(JSON.parse(ursprung.idbDatensatz(importKey).data).quickNotes[0]).toBe('B');
    });
});

describe('N17: Fremdsignale während eines späteren manuellen IndexedDB-Saves', () => {
    const faelle = [
        ['localStorage', Infinity, true],
        ['indexedDB', 0, true],
        ['localStorage', Infinity, false],
        ['indexedDB', 0, false]
    ];

    test.each(faelle)(
        'Backend %s (Quota %s), Fremdsave vor Start des manuellen Saves: %s',
        async (backend, lsQuotaZeichen, vorher) => {
            const ursprung = erzeugeUrsprung({ lsQuotaZeichen });
            ursprung.saeenIdb(KEY, kampagne('Alt'));
            const A = await oeffneTab(ursprung, 'A').starten();
            const B = await oeffneTab(ursprung, 'B').starten();
            const warteVorWrite = Promise.withResolvers();
            const writeBegonnen = Promise.withResolvers();
            const idbWriteTx = A.ctx.idbWriteTx;
            A.ctx.idbWriteTx = async (...args) => {
                writeBegonnen.resolve(true);
                await warteVorWrite.promise;
                return idbWriteTx(...args);
            };

            async function speichereB() {
                B.ctx.D.quickNotes = 'Neuer Stand aus B';
                expect(await B.ctx.saveImmediate()).toMatchObject({ success: true, backend });
                expect(ursprung.ls.has(KEY + '_rev')).toBe(backend === 'localStorage');
            }

            if (vorher) await speichereB();
            A.ctx.D.quickNotes = 'A'.repeat(LIMIT);
            const aSave = A.ctx.saveImmediate();
            try {
                expect(await Promise.race([writeBegonnen.promise, aSave])).toBe(true);
                if (!vorher) await speichereB();
                // Storage- und Broadcast-Ereignisse erreichen A erst im laufenden Save.
                await ursprung.uhr.laufen(0);
            } finally {
                warteVorWrite.resolve();
            }

            const ergebnis = await aSave;
            const C = await oeffneTab(ursprung, 'C').starten();
            expect({ ergebnis, geladen: C.ctx.D.quickNotes.slice(0, 20) }).toMatchObject(
                vorher
                    ? { ergebnis: { success: true, backend: 'indexedDB' }, geladen: 'A'.repeat(20) }
                    : {
                          ergebnis: { success: false, superseded: true },
                          geladen: 'Neuer Stand aus B'
                      }
            );
            expect(A.ctx.isCampaignStorageStale(KEY)).toBe(!vorher);
        }
    );

    test('zwei manuelle Saves übernehmen trotz altem Broadcast den jüngeren eigenen Stand', async () => {
        const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        B.ctx.D.quickNotes = 'Stand aus B';
        expect(await B.ctx.saveImmediate()).toMatchObject({ success: true, backend: 'indexedDB' });
        expect(ursprung.ls.has(KEY + '_rev')).toBe(false);

        const tore = Array.from({ length: 2 }, () => ({
            beobachtet: Promise.withResolvers(),
            schreiben: Promise.withResolvers()
        }));
        let writeIndex = 0;
        const idbWriteTx = A.ctx.idbWriteTx;
        A.ctx.idbWriteTx = async (...args) => {
            const tor = tore[writeIndex++];
            if (tor) {
                tor.beobachtet.resolve(true);
                await tor.schreiben.promise;
            }
            return idbWriteTx(...args);
        };

        A.ctx.D.quickNotes = 'A'.repeat(LIMIT);
        const ersterSave = A.ctx.saveImmediate();
        let zweiterSave;
        try {
            expect(await Promise.race([tore[0].beobachtet.promise, ersterSave])).toBe(true);
            A.ctx.D.quickNotes = 'Z'.repeat(LIMIT);
            zweiterSave = A.ctx.saveImmediate();
            expect(await Promise.race([tore[1].beobachtet.promise, zweiterSave])).toBe(true);
            expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes).toBe('Stand aus B');

            // Beide Saves haben B gesehen. Sein Broadcast erreicht A erst jetzt.
            await ursprung.uhr.laufen(0);
            tore[0].schreiben.resolve();
            expect(await ersterSave).toMatchObject({ success: true, backend: 'indexedDB' });
        } finally {
            for (const tor of tore) tor.schreiben.resolve();
        }

        const ergebnis = await zweiterSave;
        const C = await oeffneTab(ursprung, 'C').starten();
        expect({ ergebnis, geladen: C.ctx.D.quickNotes[0] }).toMatchObject({
            ergebnis: { success: true, backend: 'indexedDB' },
            geladen: 'Z'
        });
    });

    test('ein neuerer IndexedDB-Save bleibt auch vor Zustellung seines Broadcasts erhalten', async () => {
        const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        const beobachtet = Promise.withResolvers();
        const schreiben = Promise.withResolvers();
        const idbWriteTx = A.ctx.idbWriteTx;
        A.ctx.idbWriteTx = async (...args) => {
            beobachtet.resolve(true);
            await schreiben.promise;
            return idbWriteTx(...args);
        };

        A.ctx.D.quickNotes = 'A'.repeat(LIMIT);
        const aSave = A.ctx.saveImmediate();
        try {
            expect(await Promise.race([beobachtet.promise, aSave])).toBe(true);
            B.ctx.D.quickNotes = 'Neuer Stand aus B';
            expect(await B.ctx.saveImmediate()).toMatchObject({
                success: true,
                backend: 'indexedDB'
            });
            expect(ursprung.ls.has(KEY + '_rev')).toBe(false);
            expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);
        } finally {
            // A wird vor der Zustellung des Broadcasts fertig.
            schreiben.resolve();
        }

        const ergebnis = await aSave;
        const C = await oeffneTab(ursprung, 'C').starten();
        expect({ ergebnis, geladen: C.ctx.D.quickNotes.slice(0, 20) }).toMatchObject({
            ergebnis: { success: false, superseded: true },
            geladen: 'Neuer Stand aus B'
        });
    });
});

describe('N19: verspätete Meldungen zu mehreren Saves', () => {
    test.each([
        ['localStorage', 'während'],
        ['localStorage', 'nach'],
        ['indexedDB', 'während'],
        ['indexedDB', 'nach']
    ])('alte %s-Meldungen %s As bestätigtem Save', async (backend, zeitpunkt) => {
        const ursprung = erzeugeUrsprung({
            lsQuotaZeichen: backend === 'indexedDB' ? 0 : Infinity
        });
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        const senden = B.ctx.broadcastSave;
        const meldungen = [];
        B.ctx.broadcastSave = (...args) => meldungen.push(args);

        const planen = ursprung.uhr.planen;
        if (backend === 'localStorage' && zeitpunkt === 'nach') {
            ursprung.uhr.planen = (tab, fn, ms, ...args) =>
                planen(tab, fn, tab === A && ms === 0 ? 100 : ms, ...args);
        }
        try {
            for (const stand of ['Erster Stand aus B', 'Zweiter Stand aus B']) {
                B.ctx.D.quickNotes = stand;
                expect(await B.ctx.saveImmediate()).toMatchObject({ success: true, backend });
            }
        } finally {
            ursprung.uhr.planen = planen;
        }
        expect(meldungen).toHaveLength(2);
        if (backend === 'localStorage') {
            expect(meldungen[0][1].revision).not.toBe(meldungen[1][1].revision);
            expect(ursprung.ls.get(KEY + '_rev')).toBe(meldungen[1][1].revision);
        } else {
            expect(ursprung.ls.has(KEY + '_rev')).toBe(false);
        }
        await ursprung.uhr.laufen(0);

        const vorWrite = Promise.withResolvers();
        const schreiben = Promise.withResolvers();
        const idbWriteTx = A.ctx.idbWriteTx;
        A.ctx.idbWriteTx = async (...args) => {
            vorWrite.resolve(true);
            await schreiben.promise;
            return idbWriteTx(...args);
        };
        A.ctx.D.quickNotes = 'A'.repeat(LIMIT);
        const aSave = A.ctx.saveImmediate();
        try {
            expect(await Promise.race([vorWrite.promise, aSave])).toBe(true);
            if (zeitpunkt === 'nach') {
                schreiben.resolve();
                expect(await aSave).toMatchObject({ success: true, backend: 'indexedDB' });
                expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);
                A.ctx.hideConflictBanner();
            }
            for (const meldung of meldungen) senden(...meldung);
            await ursprung.uhr.laufen(zeitpunkt === 'nach' ? 100 : 0);
        } finally {
            schreiben.resolve();
        }

        expect(await aSave).toMatchObject({ success: true, backend: 'indexedDB' });
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);
        if (zeitpunkt === 'nach') expect(A.bannerSichtbar()).toBe(false);
        expect(A.ctx.saveAutomatic()).toBe(true);
        const C = await oeffneTab(ursprung, 'C').starten();
        expect(C.ctx.D.quickNotes[0]).toBe('A');
    });
});

describe('N18: Autosave respektiert den bestätigten IndexedDB-Stand auch ohne Fremdsignal', () => {
    test.each(['entprellt', 'vorgezogen', 'Entladen', 'Entladen bei laufendem Autosave'])(
        'ein kleiner Autosave (%s) verdeckt den neuen IndexedDB-Stand nicht mit localStorage',
        async modus => {
            const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
            ursprung.saeenIdb(KEY, kampagne('Alt'));
            const A = await oeffneTab(ursprung, 'A').starten();
            const B = await oeffneTab(ursprung, 'B').starten();
            B.ctx.broadcastSave = jest.fn();
            B.ctx.D.quickNotes = 'Neuer Stand aus B';
            expect(await B.ctx.saveImmediate()).toMatchObject({
                success: true,
                backend: 'indexedDB'
            });
            expect(ursprung.ls.has(KEY + '_rev')).toBe(false);
            expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);

            // Das Quota-Problem ist behoben, das Fremdsignal fehlt weiterhin.
            ursprung.quota.zeichen = Infinity;
            A.ctx.D.quickNotes = 'Kleiner Autosave aus A';
            expect(A.ctx.saveAutomatic()).toBe(true);
            if (modus === 'entprellt') {
                await ursprung.uhr.laufen(300);
            } else if (modus === 'vorgezogen') {
                await A.ctx.flushPendingSaveAndSettle();
            } else if (modus === 'Entladen') {
                A.entladen('schließen');
            } else {
                const writeTx = A.ctx.idbWriteTx;
                const freigabe = Promise.withResolvers();
                A.ctx.idbWriteTx = async (...args) => {
                    await freigabe.promise;
                    return writeTx(...args);
                };
                await ursprung.uhr.laufen(300);
                try {
                    const event = A.entladen('schließen', { bleiben: true });
                    expect(ursprung.ls.has(KEY)).toBe(false);
                    expect(event.defaultPrevented).toBe(true);
                } finally {
                    freigabe.resolve();
                    await ursprung.uhr.ruhe();
                }
            }
            expect(ursprung.ls.has(KEY)).toBe(false);
            expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes).toBe(
                'Neuer Stand aus B'
            );
        }
    );

    test.each(['Speichern', 'Umzugsimport'])('B bestätigt %s vor As Autosave', async quelle => {
        const umzug = quelle === 'Umzugsimport';
        const index = { active: KEY, campaigns: [] };
        const indexRoh = JSON.stringify(index);
        const ursprung = erzeugeUrsprung({
            // Beim Umzug passt genau der bestehende Index, aber kein Revisionsmarker mehr.
            lsQuotaZeichen: umzug ? INDEX_KEY.length + indexRoh.length : 0
        });
        if (umzug) ursprung.ls.set(INDEX_KEY, indexRoh);
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B', {
            module: umzug
                ? [
                      'systems/campaign-manager/campaign-manager.js',
                      'systems/migration/full-export.js'
                  ]
                : []
        }).starten();

        const aufgabenVorher = ursprung.uhr.anstehend(A);
        const planen = ursprung.uhr.planen;
        ursprung.uhr.planen = (tab, fn, ms, ...args) =>
            planen(tab, fn, tab === A && ms === 0 ? 350 : ms, ...args);
        try {
            if (umzug) {
                await expect(
                    B.ctx.importFullExport({
                        _exportType: 'full-v1',
                        campaigns: { [KEY]: { data: kampagne('Neuer Stand aus B') } },
                        campaignIndex: index
                    })
                ).resolves.toMatchObject({ campaignCount: 1 });
            } else {
                B.ctx.D.quickNotes = 'Neuer Stand aus B';
                expect(await B.ctx.saveImmediate()).toMatchObject({
                    success: true,
                    backend: 'indexedDB'
                });
            }
        } finally {
            ursprung.uhr.planen = planen;
        }
        expect(ursprung.uhr.anstehend(A)).toBeGreaterThan(aufgabenVorher);
        expect(ursprung.ls.has(KEY + '_rev')).toBe(false);
        expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes).toBe('Neuer Stand aus B');
        expect(A.ctx.D.quickNotes).toBe('Alt');

        // Testet sowohl den direkten großen IDB-Save als auch den Quota-Fallback.
        A.ctx.D.quickNotes = umzug ? 'A'.repeat(LIMIT) : 'Automatischer Stand aus A';
        A.ctx.saveAutomatic();
        await ursprung.uhr.laufen(300);
        const vorMeldung = JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes.slice(0, 20);
        await ursprung.uhr.laufen(50);

        const C = await oeffneTab(ursprung, 'C').starten();
        expect({ vorMeldung, geladen: C.ctx.D.quickNotes.slice(0, 20) }).toEqual({
            vorMeldung: 'Neuer Stand aus B',
            geladen: 'Neuer Stand aus B'
        });
    });

    test('B bestätigt nach As Autosave-Start und noch vor As Schreibtransaktion', async () => {
        const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        const schreiben = Promise.withResolvers();
        let amWrite = false;
        const idbWriteTx = A.ctx.idbWriteTx;
        A.ctx.idbWriteTx = async (...args) => {
            amWrite = true;
            await schreiben.promise;
            return idbWriteTx(...args);
        };

        try {
            A.ctx.D.quickNotes = 'A'.repeat(LIMIT);
            expect(A.ctx.saveAutomatic()).toBe(true);
            await ursprung.uhr.laufen(300);
            expect(amWrite).toBe(true);
            expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes).toBe('Alt');

            const aufgabenVorher = ursprung.uhr.anstehend(A);
            B.ctx.D.quickNotes = 'Neuer Stand aus B';
            expect(await B.ctx.saveImmediate()).toMatchObject({
                success: true,
                backend: 'indexedDB'
            });
            expect(ursprung.ls.has(KEY + '_rev')).toBe(false);
            expect(ursprung.uhr.anstehend(A)).toBeGreaterThan(aufgabenVorher);
        } finally {
            schreiben.resolve();
        }
        // Nur IDB-Tasks abarbeiten. Der Broadcast wartet weiter in der simulierten Uhr.
        await ursprung.uhr.ruhe();
        const vorMeldung = JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes.slice(0, 20);
        const C = await oeffneTab(ursprung, 'C').starten();
        expect({ vorMeldung, geladen: C.ctx.D.quickNotes.slice(0, 20) }).toEqual({
            vorMeldung: 'Neuer Stand aus B',
            geladen: 'Neuer Stand aus B'
        });
    });

    test('ein alter Tab legt die gelöschte IDB-Standardkampagne nicht automatisch neu an', async () => {
        const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B', {
            module: ['systems/campaign-manager/campaign-manager.js']
        }).starten();

        await B.ctx.deleteCampaign();
        await ursprung.uhr.laufen(0);
        expect(B.alerts).toContainEqual(expect.stringContaining('wurde gelöscht!'));
        expect(ursprung.idbDatensatz(KEY)).toBeUndefined();
        expect(ursprung.ls.size).toBe(0);

        A.ctx.D.quickNotes += ' + Autosave';
        A.ctx.saveAutomatic();
        await ursprung.uhr.laufen(350);

        const wiederAngelegt = ursprung.idbDatensatz(KEY) !== undefined;
        const C = await oeffneTab(ursprung, 'C').starten();
        expect({ wiederAngelegt, geladen: C.ctx.D.quickNotes }).toEqual({
            wiederAngelegt: false,
            geladen: ''
        });
    });

    test('ein aktueller Tab kann ohne localStorage-Quota weiterhin automatisch speichern', async () => {
        const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        A.ctx.D.quickNotes = 'Aktueller Autosave';
        expect(A.ctx.saveAutomatic()).toBe(true);
        await ursprung.uhr.laufen(350);
        expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes).toBe('Aktueller Autosave');

        A.ctx.D.quickNotes = 'Zweiter Autosave';
        expect(A.ctx.saveAutomatic()).toBe(true);
        await ursprung.uhr.laufen(350);

        const B = await oeffneTab(ursprung, 'B').starten();
        expect(B.ctx.D.quickNotes).toBe('Zweiter Autosave');
    });
});

describe('N25: Umzugsdownload und IndexedDB-Wiederholung', () => {
    test.each(['bestätigt', 'fehlgeschlagen', 'Zeitlimit'])(
        'Download bei zweitem Speicherversuch mit Ausgang %s',
        async ausgang => {
            const ursprung = erzeugeUrsprung();
            ursprung.saeenIdb(KEY, kampagne('Bisheriger Stand'));
            const A = await oeffneTab(ursprung, 'A', {
                module: [
                    'systems/campaign-manager/campaign-manager.js',
                    'systems/migration/full-export.js'
                ]
            }).starten();
            const retryBegonnen = Promise.withResolvers();
            const retryFreigabe = Promise.withResolvers();
            const idbWriteTx = A.ctx.idbWriteTx;
            let versuche = 0;
            A.ctx.idbWriteTx = async (...args) => {
                if (++versuche === 2) {
                    retryBegonnen.resolve(true);
                    await retryFreigabe.promise;
                }
                return idbWriteTx(...args);
            };
            ursprung.idb.policy.commitFehler = ({ nr }) =>
                nr === 1 || ausgang === 'fehlgeschlagen' ? new Error('Commit abgebrochen') : null;

            let exportiert;
            A.ctx.Blob = class extends Blob {
                constructor(parts, options) {
                    super(parts, options);
                    if (options?.type === 'application/json') exportiert = JSON.parse(parts[0]);
                }
            };
            const download = jest.fn();
            A.ctx.URL = { createObjectURL: () => 'blob:umzug', revokeObjectURL: jest.fn() };
            A.ctx.document.createElement = () => ({ click: download });
            A.ctx.exportAllDataAsFile = jest.fn(); // separater Notfall-Export

            A.ctx.D.quickNotes = 'N'.repeat(LIMIT);
            A.ctx.save();
            const umzug = A.ctx.downloadFullExport();
            try {
                expect(await Promise.race([retryBegonnen.promise, umzug])).toBe(true);
                await ursprung.uhr.ruhe();
                expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes).toBe(
                    'Bisheriger Stand'
                );
                expect(download).not.toHaveBeenCalled();
                if (ausgang === 'Zeitlimit') {
                    await ursprung.uhr.laufen(5000);
                    expect(await umzug).toBe(false);
                }
            } finally {
                retryFreigabe.resolve();
                await umzug;
                await ursprung.uhr.ruhe();
            }
            expect(versuche).toBe(2);
            if (ausgang === 'bestätigt') {
                expect(await umzug).toBe(true);
                expect(download).toHaveBeenCalledTimes(1);
                expect(exportiert.campaigns[KEY].data.quickNotes).toBe(A.ctx.D.quickNotes);
            } else {
                expect(await umzug).toBe(false);
                expect(download).not.toHaveBeenCalled();
            }
        }
    );
});

describe('N26: entprelltes Speichern respektiert einen späteren bestätigten IndexedDB-Stand', () => {
    test.each([
        'Quota-Fallback',
        'großer Save',
        'Umzugsdownload',
        'IndexedDB öffnet erst beim Save'
    ])('%s', async modus => {
        const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const mitDownload = modus === 'Umzugsdownload';
        const A = await oeffneTab(ursprung, 'A', {
            module: mitDownload
                ? [
                      'systems/campaign-manager/campaign-manager.js',
                      'systems/migration/full-export.js'
                  ]
                : []
        }).starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        const begonnen = Promise.withResolvers();
        const freigabe = Promise.withResolvers();
        let amWrite = false;
        const idbWriteTx = A.ctx.idbWriteTx;
        A.ctx.idbWriteTx = async (...args) => {
            amWrite = true;
            begonnen.resolve();
            await freigabe.promise;
            return idbWriteTx(...args);
        };

        const klick = jest.fn();
        if (mitDownload) {
            A.ctx.URL = { createObjectURL: () => 'blob:umzug', revokeObjectURL: jest.fn() };
            A.ctx.document.createElement = () => ({ click: klick });
        }

        if (modus === 'IndexedDB öffnet erst beim Save') A.ctx.idb = null;
        A.ctx.D.quickNotes = modus === 'großer Save' ? 'A'.repeat(LIMIT) : 'Entprellter Save aus A';
        A.ctx.save();
        const download = mitDownload ? A.ctx.downloadFullExport() : null;
        let downloadErgebnis;
        try {
            if (mitDownload) await Promise.race([begonnen.promise, download]);
            else await ursprung.uhr.laufen(300);
            expect(amWrite).toBe(true);
            expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes).toBe('Alt');

            const aufgabenVorher = ursprung.uhr.anstehend(A);
            B.ctx.D.quickNotes = 'Neuer Stand aus B';
            expect(await B.ctx.saveImmediate()).toMatchObject({
                success: true,
                backend: 'indexedDB'
            });
            expect(ursprung.ls.has(KEY + '_rev')).toBe(false);
            expect(ursprung.uhr.anstehend(A)).toBeGreaterThan(aufgabenVorher);
            expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes).toBe(
                'Neuer Stand aus B'
            );
        } finally {
            freigabe.resolve();
            downloadErgebnis = await download;
        }
        // Nur IDB-Tasks abarbeiten. Bs Broadcast wartet bis zum Neustart weiter.
        await ursprung.uhr.ruhe();
        const vorMeldung = JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes.slice(0, 20);
        const C = await oeffneTab(ursprung, 'C').starten();
        expect({ vorMeldung, geladen: C.ctx.D.quickNotes.slice(0, 20) }).toEqual({
            vorMeldung: 'Neuer Stand aus B',
            geladen: 'Neuer Stand aus B'
        });
        if (mitDownload) {
            expect(downloadErgebnis).toBe(false);
            expect(klick).not.toHaveBeenCalled();
        }
    });

    test('ein erst nach dem Fremdsave angestoßener ausdrücklicher Save bleibt möglich', async () => {
        const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        B.ctx.D.quickNotes = 'Stand aus B';
        expect(await B.ctx.saveImmediate()).toMatchObject({ success: true, backend: 'indexedDB' });
        await ursprung.uhr.laufen(0);
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);

        A.ctx.D.quickNotes = 'Späterer ausdrücklicher Stand aus A';
        A.ctx.save();
        await ursprung.uhr.laufen(300);

        const C = await oeffneTab(ursprung, 'C').starten();
        expect(C.ctx.D.quickNotes).toBe('Späterer ausdrücklicher Stand aus A');
    });
});

describe('N28: markerlose IndexedDB-Meldungen beim nächsten laufenden Save', () => {
    test.each([
        ['Autosave', false, 'vor Commit'],
        ['Autosave', true, 'vor Commit'],
        ['Entprellter Save', false, 'vor Commit'],
        ['Autosave', false, 'nach Commit']
    ])('%s mit neuerem Fremdstand %s, Meldung %s', async (modus, neuer, zeitpunkt) => {
        const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        const B = await oeffneTab(ursprung, 'B').starten();
        const senden = B.ctx.broadcastSave;
        const meldungen = [];
        B.ctx.broadcastSave = (...args) => meldungen.push(args);
        async function speichereB(notiz) {
            B.ctx.D.quickNotes = notiz;
            expect(await B.ctx.saveImmediate()).toMatchObject({
                success: true,
                backend: 'indexedDB'
            });
            expect(ursprung.ls.has(KEY + '_rev')).toBe(false);
        }

        await speichereB('Älterer Stand aus B');
        A.ctx.D.quickNotes = 'Bestätigter Stand A1';
        expect(await A.ctx.saveImmediate()).toMatchObject({ success: true, backend: 'indexedDB' });
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);
        expect(A.bannerSichtbar()).toBe(false);
        const bestaetigt = A.ctx.getPersistSuccessCount();

        const freigabe = Promise.withResolvers();
        const idbWriteTx = A.ctx.idbWriteTx;
        const nachCommit = zeitpunkt === 'nach Commit';
        let amWrite = false;
        A.ctx.idbWriteTx = async (...args) => {
            const ergebnis = nachCommit ? await idbWriteTx(...args) : undefined;
            amWrite = true;
            await freigabe.promise;
            return nachCommit ? ergebnis : idbWriteTx(...args);
        };
        try {
            A.ctx.D.quickNotes = 'Nächster Stand A2';
            if (modus === 'Autosave') expect(A.ctx.saveAutomatic()).toBe(true);
            else A.ctx.save();
            await ursprung.uhr.laufen(300);
            expect(amWrite).toBe(true);
            expect(JSON.parse(ursprung.idbDatensatz(KEY).data).quickNotes).toBe(
                nachCommit ? 'Nächster Stand A2' : 'Bestätigter Stand A1'
            );
            expect(A.ctx.getPersistSuccessCount()).toBe(bestaetigt);

            if (neuer) await speichereB('Neuerer Stand aus B');
            expect(meldungen).toHaveLength(neuer ? 2 : 1);
            senden(...meldungen.at(-1));
            await ursprung.uhr.laufen(0);
            if (nachCommit) expect(A.bannerSichtbar()).toBe(false);
        } finally {
            freigabe.resolve();
        }
        await ursprung.uhr.ruhe();

        const C = await oeffneTab(ursprung, 'C').starten();
        expect({
            bestaetigt: A.ctx.getPersistSuccessCount() - bestaetigt,
            geladen: C.ctx.D.quickNotes,
            konflikt: A.bannerSichtbar(),
            veraltet: A.ctx.isCampaignStorageStale(KEY),
            naechsterAutosave: A.ctx.saveAutomatic()
        }).toEqual({
            bestaetigt: neuer ? 0 : 1,
            geladen: neuer ? 'Neuerer Stand aus B' : 'Nächster Stand A2',
            konflikt: neuer,
            veraltet: neuer,
            naechsterAutosave: !neuer
        });
    });
});

describe('N02: Nutzdaten passen, der neue localStorage-Zeitstempel nicht', () => {
    test.each(['sofort', 'entprellt', 'Entladen', 'neue Kampagne'])(
        '%s: nach erfolgreicher Speicherung lädt der neue Stand',
        async modus => {
            const ursprung = erzeugeUrsprung();
            ursprung.saeenIdb(KEY, kampagne('Alter IndexedDB-Stand'));
            const A = await oeffneTab(ursprung, 'A').starten();
            expect(A.ctx.D.quickNotes).toBe('Alter IndexedDB-Stand');
            A.ctx.D.quickNotes = 'Neuer Stand';
            const daten = JSON.stringify(A.ctx.D);
            const belegt = [...ursprung.ls].reduce(
                (summe, [k, v]) => summe + k.length + v.length,
                0
            );
            ursprung.quota.zeichen = belegt + KEY.length + daten.length;

            let speicherung;
            if (modus === 'Entladen') {
                A.ctx.save();
                A.entladen('schließen', { bleiben: true });
            } else if (modus === 'neue Kampagne') {
                speicherung = A.ctx.writeCampaignData(KEY, daten);
            } else {
                speicherung = speichern[modus](A);
            }
            await ursprung.uhr.laufen(350);
            if (speicherung) expect(await speicherung).toMatchObject({ success: true });

            const B = await oeffneTab(ursprung, 'B').starten();
            expect(B.ctx.D.quickNotes).toBe('Neuer Stand');
        }
    );

    test('bei fehlgeschlagenem Zeitstempel und IDB-Abbruch bleibt der letzte bestätigte Stand erhalten', async () => {
        const ursprung = erzeugeUrsprung();
        ursprung.saeenIdb(KEY, kampagne('Alt'));
        const A = await oeffneTab(ursprung, 'A').starten();
        A.ctx.D.quickNotes = 'Neu';
        ursprung.quota.zeichen = KEY.length + JSON.stringify(A.ctx.D).length;
        ursprung.idb.policy.commitFehler = () => new Error('IDB-Commit abgebrochen');

        expect(await A.ctx.saveImmediate()).toMatchObject({ success: false });
        expect(ursprung.ls.has(KEY)).toBe(false);
        const B = await oeffneTab(ursprung, 'B').starten();
        expect(B.ctx.D.quickNotes).toBe('Alt');
    });
});
