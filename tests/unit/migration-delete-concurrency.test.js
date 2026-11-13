const { isDeepStrictEqual } = require('node:util');
const {
    erzeugeUrsprung,
    oeffneTab,
    INDEX_KEY,
    STANDARD_KEY
} = require('./helpers/multi-tab-harness.js');

const KAMPAGNEN_KEY = 'dnd-campaign-111';
const ALTE_KAMPAGNE = { key: KAMPAGNEN_KEY, name: 'Vor dem Umzug' };
const IMPORTIERTE_KAMPAGNE = { key: KAMPAGNEN_KEY, name: 'Nach dem Umzug' };

function erfasseSperrtransaktion(ursprung, tab) {
    let transaktion;
    tab.ctx.indexedDB = {
        open(name, version) {
            const request = ursprung.sperrDb.open(name, version);
            if (name !== 'dnd-tracker-db-campaign-operations' || transaktion) return request;
            const db = request.result;
            const transaction = db.transaction;
            db.transaction = (...args) => {
                db.transaction = transaction;
                transaktion = transaction.call(db, ...args);
                return transaktion;
            };
            return request;
        }
    };
    return () => transaktion.abort();
}

test.each(['ohne Web Locks', 'Web Locks nur im Löschtab', 'Sperrabbruch beim Import'])(
    'Löschen während eines Umzugsimports (%s) entfernt Daten und Indexeintrag',
    async modus => {
        const ursprung = erzeugeUrsprung();
        const alterIndex = { campaigns: [ALTE_KAMPAGNE], active: KAMPAGNEN_KEY };
        ursprung.ls.set(INDEX_KEY, JSON.stringify(alterIndex));
        ursprung.saeenIdb(KAMPAGNEN_KEY, { quickNotes: 'Alter Stand' });
        const importTab = await oeffneTab(ursprung, 'Import', {
            module: [
                'systems/campaign-manager/campaign-manager.js',
                'systems/migration/full-export.js'
            ]
        }).starten();
        const loeschTab = await oeffneTab(ursprung, 'Löschen', {
            module: ['systems/campaign-manager/campaign-manager.js'],
            aktiv: KAMPAGNEN_KEY
        }).starten();
        if (modus === 'Web Locks nur im Löschtab') {
            loeschTab.ctx.navigator.locks = { request: (_name, work) => work() };
        }
        const sperreVerlieren = modus === 'Sperrabbruch beim Import';
        const sperreAbbrechen = sperreVerlieren
            ? erfasseSperrtransaktion(ursprung, importTab)
            : null;

        const datenGeschrieben = Promise.withResolvers();
        const importFortsetzen = Promise.withResolvers();
        const writeCampaignData = importTab.ctx.writeCampaignData;
        importTab.ctx.writeCampaignData = async (...args) => {
            const ergebnis = await writeCampaignData(...args);
            datenGeschrieben.resolve(ergebnis);
            await importFortsetzen.promise;
            return ergebnis;
        };

        const importAbschluss = importTab.ctx
            .importFullExport({
                _exportType: 'full-v1',
                campaigns: {
                    [KAMPAGNEN_KEY]: {
                        data: {
                            quickNotes: 'Neuer Stand',
                            grosseNotiz: 'x'.repeat(5 * 1024 * 1024)
                        }
                    }
                },
                campaignIndex: { campaigns: [IMPORTIERTE_KAMPAGNE], active: KAMPAGNEN_KEY }
            })
            .then(
                ergebnis => ({ ergebnis }),
                fehler => ({ fehler })
            );
        let loeschAbschluss;
        let indexVorFreigabe;
        let datenVorFreigabe;
        try {
            expect(await Promise.race([datenGeschrieben.promise, importAbschluss])).toMatchObject({
                success: true,
                backend: 'indexedDB'
            });
            expect(JSON.parse(ursprung.idbDatensatz(KAMPAGNEN_KEY).data).quickNotes).toBe(
                'Neuer Stand'
            );
            expect(JSON.parse(ursprung.ls.get(INDEX_KEY))).toEqual(alterIndex);

            sperreAbbrechen?.();
            loeschAbschluss = loeschTab.ctx.deleteCampaign();
            if (sperreVerlieren) {
                await loeschAbschluss;
            } else {
                // Datenbank-Tasks abarbeiten, während der Import auf Freigabe wartet.
                await ursprung.uhr.ruhe();
                indexVorFreigabe = JSON.parse(ursprung.ls.get(INDEX_KEY));
                datenVorFreigabe = ursprung.idbDatensatz(KAMPAGNEN_KEY);
            }
        } finally {
            importFortsetzen.resolve();
        }

        const [importErgebnis] = await Promise.all([importAbschluss, loeschAbschluss]);
        if (sperreVerlieren) {
            expect(importErgebnis.fehler?.message).toContain('IndexedDB-Transaktion abgebrochen');
        } else {
            expect(indexVorFreigabe).toEqual(alterIndex);
            expect(JSON.parse(datenVorFreigabe.data).quickNotes).toBe('Neuer Stand');
            expect(importErgebnis.ergebnis).toMatchObject({ campaignCount: 1 });
        }
        expect(loeschTab.alerts).toContainEqual(expect.stringContaining('wurde gelöscht!'));
        expect(ursprung.ls.has(KAMPAGNEN_KEY)).toBe(false);
        expect(ursprung.idbDatensatz(KAMPAGNEN_KEY)).toBeUndefined();
        expect(JSON.parse(ursprung.ls.get(INDEX_KEY))).toEqual({
            campaigns: [],
            active: STANDARD_KEY
        });
    }
);

test.each(['vor Datenlöschung', 'nach IndexedDB-Commit', 'mit paralleler Löschung'])(
    'N21: Sperrabbruch %s erhält den Index noch vorhandener Kampagnendaten',
    async modus => {
        const ursprung = erzeugeUrsprung();
        const weitereKampagne = { key: 'dnd-campaign-123', name: 'Weitere Kampagne' };
        const alterIndex = JSON.stringify({
            campaigns: [ALTE_KAMPAGNE, weitereKampagne],
            active: KAMPAGNEN_KEY
        });
        const indexOhneKampagne = JSON.stringify({
            campaigns: [weitereKampagne],
            active: STANDARD_KEY
        });
        ursprung.ls.set(INDEX_KEY, alterIndex);
        ursprung.saeenIdb(KAMPAGNEN_KEY, { quickNotes: 'Alter Stand' });
        ursprung.saeen(KAMPAGNEN_KEY, { quickNotes: 'Alter Stand' });
        const alterLocalStorage = ursprung.ls.get(KAMPAGNEN_KEY);
        const alterIdbStand = ursprung.idbDatensatz(KAMPAGNEN_KEY);
        const tabOptionen = {
            module: ['systems/campaign-manager/campaign-manager.js'],
            aktiv: KAMPAGNEN_KEY
        };
        const tab = await oeffneTab(ursprung, 'Löschen', tabOptionen).starten();
        const andererTab =
            modus === 'mit paralleler Löschung'
                ? await oeffneTab(ursprung, 'Anderer Löschvorgang', tabOptionen).starten()
                : null;

        const haltepunkt = Promise.withResolvers();
        const weiter = Promise.withResolvers();
        const sperreAbbrechen = erfasseSperrtransaktion(ursprung, tab);
        const idbSchonGeloescht = modus === 'nach IndexedDB-Commit';
        if (idbSchonGeloescht) {
            const idbWriteTx = tab.ctx.idbWriteTx;
            tab.ctx.idbWriteTx = async (...args) => {
                const ergebnis = await idbWriteTx(...args);
                haltepunkt.resolve(true);
                await weiter.promise;
                return ergebnis;
            };
        } else {
            const removeCampaignData = tab.ctx.removeCampaignData;
            tab.ctx.removeCampaignData = async (...args) => {
                haltepunkt.resolve(true);
                await weiter.promise;
                return removeCampaignData(...args);
            };
        }

        const geloescht = tab.ctx.deleteCampaign();
        try {
            expect(await Promise.race([haltepunkt.promise, geloescht])).toBe(true);
            expect(ursprung.ls.get(INDEX_KEY)).toBe(indexOhneKampagne);
            expect(ursprung.idbDatensatz(KAMPAGNEN_KEY)).toEqual(
                idbSchonGeloescht ? undefined : alterIdbStand
            );
            expect(ursprung.ls.get(KAMPAGNEN_KEY)).toBe(alterLocalStorage);
            sperreAbbrechen();
            await ursprung.uhr.ruhe();
            if (andererTab) {
                await andererTab.ctx.deleteCampaign();
                expect(andererTab.alerts).toContainEqual(
                    expect.stringContaining('wurde gelöscht!')
                );
            }
        } finally {
            weiter.resolve();
            await geloescht;
        }

        expect({
            index: ursprung.ls.get(INDEX_KEY),
            localStorage: ursprung.ls.get(KAMPAGNEN_KEY),
            indexedDB: ursprung.idbDatensatz(KAMPAGNEN_KEY),
            meldungen: tab.alerts,
            gesperrt: tab.ctx.areCampaignWritesRetired()
        }).toEqual({
            index: andererTab ? indexOhneKampagne : alterIndex,
            localStorage: andererTab ? undefined : alterLocalStorage,
            indexedDB: andererTab || idbSchonGeloescht ? undefined : alterIdbStand,
            meldungen: [expect.stringContaining('IndexedDB-Transaktion abgebrochen')],
            gesperrt: false
        });
    }
);

test.each([
    { befund: 'N22', indexfehler: false, pruefeSicherung: false },
    { befund: 'N22', indexfehler: true, pruefeSicherung: false },
    { befund: 'N27', indexfehler: false, pruefeSicherung: true }
])(
    '$befund: „Alle Daten löschen“ wartet auf den Umzugsimport (Indexfehler: $indexfehler)',
    async ({ indexfehler, pruefeSicherung }) => {
        const ursprung = erzeugeUrsprung();
        const alterIndex = { campaigns: [ALTE_KAMPAGNE], active: KAMPAGNEN_KEY };
        ursprung.ls.set(INDEX_KEY, JSON.stringify(alterIndex));
        ursprung.saeenIdb(KAMPAGNEN_KEY, {
            quickNotes: 'Alter Stand',
            characters: [{ id: 1, name: 'Bisheriger Charakter' }]
        });
        const importTab = await oeffneTab(ursprung, 'Import', {
            module: [
                'systems/campaign-manager/campaign-manager.js',
                'systems/migration/full-export.js'
            ],
            aktiv: KAMPAGNEN_KEY
        }).starten();
        const resetTab = await oeffneTab(ursprung, 'Datenreset', {
            module: pruefeSicherung
                ? ['systems/backups.js', 'systems/spellslots/import-export.js']
                : ['systems/spellslots/import-export.js'],
            aktiv: KAMPAGNEN_KEY,
            stubs: pruefeSicherung
                ? undefined
                : {
                      createAutoBackup: async () => 'indexeddb',
                      reportSafetyBackup: async () => {}
                  }
        }).starten();
        if (indexfehler) {
            const setItem = importTab.ctx.localStorage.setItem;
            importTab.ctx.localStorage.setItem = (key, value) => {
                if (key === INDEX_KEY) {
                    const error = new Error('Indexwrite verweigert');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
                return setItem(key, value);
            };
        }

        const importGeschrieben = Promise.withResolvers();
        const importFortsetzen = Promise.withResolvers();
        const writeCampaignData = importTab.ctx.writeCampaignData;
        importTab.ctx.writeCampaignData = async (...args) => {
            const result = await writeCampaignData(...args);
            importGeschrieben.resolve(result);
            await importFortsetzen.promise;
            return result;
        };
        const liesNotiz = () => {
            const record = ursprung.idbDatensatz(KAMPAGNEN_KEY);
            return record ? JSON.parse(record.data).quickNotes : null;
        };
        const liesIndex = () => JSON.parse(ursprung.ls.get(INDEX_KEY));
        let beimLoeschen;
        let sicherungBeimLoeschen;
        const removeCampaignData = resetTab.ctx.removeCampaignData;
        resetTab.ctx.removeCampaignData = (...args) => {
            beimLoeschen = { index: liesIndex(), notiz: liesNotiz() };
            if (pruefeSicherung) {
                const stand = JSON.parse(ursprung.idbDatensatz(KAMPAGNEN_KEY).data);
                const sicherungen = ursprung.idb
                    .zeilen('backups')
                    .filter(
                        eintrag =>
                            eintrag.campaignKey === KAMPAGNEN_KEY && eintrag.kind === 'safety'
                    );
                const gesichert = sicherungen[0] ? JSON.parse(sicherungen[0].data) : null;
                sicherungBeimLoeschen = {
                    anzahl: sicherungen.length,
                    notiz: gesichert?.quickNotes,
                    kompletterStand: isDeepStrictEqual(gesichert, stand)
                };
            }
            return removeCampaignData(...args);
        };

        const importierterIndex = { campaigns: [IMPORTIERTE_KAMPAGNE], active: KAMPAGNEN_KEY };
        const importAbschluss = importTab.ctx
            .importFullExport({
                _exportType: 'full-v1',
                campaigns: {
                    [KAMPAGNEN_KEY]: {
                        data: {
                            quickNotes: 'Neuer Stand',
                            characters: [{ id: 2, name: 'Importierter Charakter' }],
                            grosseNotiz: 'x'.repeat(5 * 1024 * 1024)
                        }
                    }
                },
                campaignIndex: importierterIndex
            })
            .then(
                ergebnis => ({ ergebnis }),
                fehler => ({ fehler })
            );
        let resetAbschluss;
        let wartenderStand;
        try {
            expect(await Promise.race([importGeschrieben.promise, importAbschluss])).toMatchObject({
                success: true,
                backend: 'indexedDB'
            });
            resetAbschluss = resetTab.ctx.clearStorage();
            await ursprung.uhr.ruhe();
            wartenderStand = { index: liesIndex(), notiz: liesNotiz() };
        } finally {
            importFortsetzen.resolve();
            await Promise.all([importAbschluss, resetAbschluss]);
        }

        if (indexfehler) {
            expect((await importAbschluss).fehler?.message).toContain('Kampagnenindex');
        } else {
            expect((await importAbschluss).ergebnis).toMatchObject({ campaignCount: 1 });
        }
        const erwarteterIndex = indexfehler ? alterIndex : importierterIndex;
        expect({ wartenderStand, beimLoeschen }).toEqual({
            wartenderStand: { index: alterIndex, notiz: 'Neuer Stand' },
            beimLoeschen: {
                index: erwarteterIndex,
                notiz: indexfehler ? 'Alter Stand' : 'Neuer Stand'
            }
        });
        expect(liesIndex()).toEqual(erwarteterIndex);
        expect(liesNotiz()).toBeNull();
        expect(resetTab.toasts).toContainEqual(
            expect.objectContaining({ text: '✅ Alle Daten gelöscht' })
        );
        if (pruefeSicherung) {
            expect(sicherungBeimLoeschen).toEqual({
                anzahl: 1,
                notiz: 'Neuer Stand',
                kompletterStand: true
            });
        }
    }
);

test.each([false, true])(
    'Ohne Sperr-DB brechen Import und Löschen vor dem Write ab (Web Locks: %s)',
    async webLocks => {
        const ursprung = erzeugeUrsprung();
        const alterIndex = { campaigns: [ALTE_KAMPAGNE], active: KAMPAGNEN_KEY };
        ursprung.ls.set(INDEX_KEY, JSON.stringify(alterIndex));
        ursprung.saeenIdb(KAMPAGNEN_KEY, { quickNotes: 'Alter Stand' });
        const tab = await oeffneTab(ursprung, 'A', {
            module: [
                'systems/campaign-manager/campaign-manager.js',
                'systems/migration/full-export.js'
            ],
            aktiv: KAMPAGNEN_KEY
        }).starten();
        tab.ctx.indexedDB = {};
        if (webLocks) tab.ctx.navigator.locks = { request: (_name, work) => work() };

        await expect(
            tab.ctx.importFullExport({
                _exportType: 'full-v1',
                campaigns: { [KAMPAGNEN_KEY]: { data: { quickNotes: 'Neuer Stand' } } },
                campaignIndex: { campaigns: [IMPORTIERTE_KAMPAGNE], active: KAMPAGNEN_KEY }
            })
        ).rejects.toThrow('Kampagnensperre ist nicht verfügbar');
        await tab.ctx.deleteCampaign();

        expect(tab.alerts).toContainEqual(
            expect.stringContaining('Kampagnensperre ist nicht verfügbar')
        );
        expect(tab.ctx.areCampaignWritesRetired()).toBe(false);
        expect(JSON.parse(ursprung.ls.get(INDEX_KEY))).toEqual(alterIndex);
        expect(JSON.parse(ursprung.idbDatensatz(KAMPAGNEN_KEY).data).quickNotes).toBe(
            'Alter Stand'
        );
    }
);

test('N27: Datenreset erhält einen neueren IndexedDB-Save ohne localStorage-Marker', async () => {
    const ursprung = erzeugeUrsprung({ lsQuotaZeichen: 0 });
    ursprung.saeenIdb(KAMPAGNEN_KEY, {
        quickNotes: 'Zu sichernder Stand',
        characters: [{ id: 1, name: 'Bisheriger Charakter' }]
    });
    const sicherungsStand = JSON.parse(ursprung.idbDatensatz(KAMPAGNEN_KEY).data);
    const resetTab = await oeffneTab(ursprung, 'Datenreset', {
        module: ['systems/backups.js', 'systems/spellslots/import-export.js'],
        aktiv: KAMPAGNEN_KEY
    }).starten();
    const schreibTab = await oeffneTab(ursprung, 'Speichern', { aktiv: KAMPAGNEN_KEY }).starten();

    let sicherungenVorSave;
    let fremdSave;
    const removeCampaignData = resetTab.ctx.removeCampaignData;
    resetTab.ctx.removeCampaignData = async (...args) => {
        sicherungenVorSave = ursprung.idb.zeilen('backups');
        schreibTab.ctx.D.quickNotes = 'Neuer Stand aus dem anderen Tab';
        fremdSave = await schreibTab.ctx.saveImmediate();
        return removeCampaignData(...args);
    };

    await resetTab.ctx.clearStorage();

    expect(sicherungenVorSave).toEqual([
        expect.objectContaining({ campaignKey: KAMPAGNEN_KEY, kind: 'safety' })
    ]);
    expect(JSON.parse(sicherungenVorSave[0].data)).toEqual(sicherungsStand);
    expect(fremdSave).toMatchObject({ success: true, backend: 'indexedDB' });
    expect(ursprung.ls.has(KAMPAGNEN_KEY + '_rev')).toBe(false);
    expect(resetTab.toasts).toContainEqual(
        expect.objectContaining({
            text: expect.stringContaining('Fehler beim Löschen'),
            typ: 'error'
        })
    );
    expect(resetTab.toasts).not.toContainEqual(
        expect.objectContaining({ text: '✅ Alle Daten gelöscht' })
    );
    expect(resetTab.ctx.areCampaignWritesRetired()).toBe(false);
    const neustart = await oeffneTab(ursprung, 'Neustart', { aktiv: KAMPAGNEN_KEY }).starten();
    expect(neustart.ctx.D.quickNotes).toBe('Neuer Stand aus dem anderen Tab');
});

test('N29: eine verweigerte LocalStorage-Löschung meldet einen Fehler und lässt die Kampagne erreichbar', async () => {
    const ursprung = erzeugeUrsprung();
    const notiz = 'Kampagnendaten sind noch vorhanden';
    const protokollSuffix = '_kampfprotokoll';
    ursprung.saeen(KAMPAGNEN_KEY, {
        quickNotes: notiz,
        characters: [{ id: 1, name: 'Bisheriger Charakter' }]
    });
    ursprung.ls.set(KAMPAGNEN_KEY + '_rev', 'bisherige-revision');
    ursprung.ls.set(KAMPAGNEN_KEY + protokollSuffix, '["Bisheriger Eintrag"]');
    const schluessel = [
        KAMPAGNEN_KEY,
        ...['_ts', '_rev', protokollSuffix].map(s => KAMPAGNEN_KEY + s)
    ];
    const gespeicherterStand = () => schluessel.map(key => ursprung.ls.get(key));
    const vorReset = gespeicherterStand();
    const resetTab = await oeffneTab(ursprung, 'Datenreset', {
        module: ['systems/backups.js', 'systems/spellslots/import-export.js'],
        aktiv: KAMPAGNEN_KEY,
        stubs: { KPLOG_SCHLUESSEL_SUFFIX: protokollSuffix }
    }).starten();
    const removeItem = resetTab.ctx.localStorage.removeItem;
    resetTab.ctx.localStorage.removeItem = key => {
        if (key === KAMPAGNEN_KEY) {
            const error = new Error('Löschen verweigert');
            error.name = 'SecurityError';
            throw error;
        }
        removeItem(key);
    };
    const reload = jest.fn();
    resetTab.ctx.location.reload = reload;

    await resetTab.ctx.clearStorage();
    const nachReset = gespeicherterStand();
    await ursprung.uhr.laufen(1000);
    const neustart = await oeffneTab(ursprung, 'Neustart', { aktiv: KAMPAGNEN_KEY }).starten();

    expect({
        fehlermeldung: resetTab.toasts.some(toast => toast.typ === 'error'),
        erfolgsmeldung: resetTab.toasts.some(toast => toast.text === '✅ Alle Daten gelöscht'),
        reloads: reload.mock.calls.length,
        schreibsperre: resetTab.ctx.areCampaignWritesRetired(),
        notiz: neustart.ctx.D.quickNotes,
        kampagneUndMetadaten: nachReset
    }).toEqual({
        fehlermeldung: true,
        erfolgsmeldung: false,
        reloads: 0,
        schreibsperre: false,
        notiz,
        kampagneUndMetadaten: vorReset
    });
});
