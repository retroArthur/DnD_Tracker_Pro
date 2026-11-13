const { erzeugeUrsprung, oeffneTab, INDEX_KEY } = require('./helpers/multi-tab-harness.js');

const KAMPAGNEN_KEY = 'dnd-campaign-111';
const ORIGINAL = 'Bisherige Kampagne';
const MODULE = ['systems/campaign-manager/campaign-manager.js', 'systems/migration/full-export.js'];

function erfasseSperrtransaktion(ursprung, tab) {
    let transaktion;
    tab.ctx.indexedDB = {
        open(name, version) {
            const request = ursprung.sperrDb.open(name, version);
            if (name !== 'dnd-tracker-db-campaign-operations' || transaktion) return request;
            const db = request.result;
            const transaction = db.transaction;
            db.transaction = (...txArgs) => {
                db.transaction = transaction;
                transaktion = transaction.call(db, ...txArgs);
                return transaktion;
            };
            return request;
        }
    };
    return () => transaktion.abort();
}

function starteImport(tab, name, backend) {
    const geschrieben = Promise.withResolvers();
    const freigabe = Promise.withResolvers();
    const writeCampaignData = tab.ctx.writeCampaignData;
    tab.ctx.writeCampaignData = async (...args) => {
        const ergebnis = await writeCampaignData(...args);
        geschrieben.resolve(ergebnis);
        await freigabe.promise;
        return ergebnis;
    };

    const data = { quickNotes: name };
    if (backend === 'indexedDB') data.grosseNotiz = 'x'.repeat(5 * 1024 * 1024);
    const abgeschlossen = tab.ctx
        .importFullExport({
            _exportType: 'full-v1',
            campaigns: { [KAMPAGNEN_KEY]: { data } },
            campaignIndex: { active: KAMPAGNEN_KEY, campaigns: [{ key: KAMPAGNEN_KEY, name }] }
        })
        .then(
            ergebnis => ({ ergebnis }),
            fehler => ({ fehler })
        );
    return {
        geschrieben: Promise.race([geschrieben.promise, abgeschlossen]),
        abgeschlossen,
        fortsetzen: freigabe.resolve
    };
}

test.each`
    backendA          | backendB          | webLocks | zweiterImport
    ${'localStorage'} | ${'localStorage'} | ${false} | ${'Indexfehler'}
    ${'indexedDB'}    | ${'indexedDB'}    | ${false} | ${'Indexfehler'}
    ${'indexedDB'}    | ${'indexedDB'}    | ${true}  | ${'Indexfehler'}
    ${'indexedDB'}    | ${'indexedDB'}    | ${true}  | ${'Erfolg'}
    ${'localStorage'} | ${'localStorage'} | ${false} | ${'Sperrverlust'}
    ${'indexedDB'}    | ${'indexedDB'}    | ${false} | ${'Sperrverlust'}
    ${'indexedDB'}    | ${'localStorage'} | ${false} | ${'Sperrverlust'}
    ${'indexedDB'}    | ${'localStorage'} | ${false} | ${'Erfolg'}
`(
    'N20: A in $backendA mit Web Lock=$webLocks und $zweiterImport in B ($backendB)',
    async ({ backendA, backendB, webLocks, zweiterImport }) => {
        const ursprung = erzeugeUrsprung();
        const indexVorher = JSON.stringify({
            active: KAMPAGNEN_KEY,
            campaigns: [{ key: KAMPAGNEN_KEY, name: ORIGINAL }]
        });
        ursprung.ls.set(INDEX_KEY, indexVorher);
        if (backendA === 'indexedDB') {
            ursprung.saeenIdb(KAMPAGNEN_KEY, { quickNotes: ORIGINAL });
        } else {
            ursprung.saeen(KAMPAGNEN_KEY, { quickNotes: ORIGINAL });
        }

        const a = await oeffneTab(ursprung, 'A', {
            module: MODULE,
            aktiv: KAMPAGNEN_KEY
        }).starten();
        const requestLock = jest.fn((_name, work) => work());
        if (webLocks) a.ctx.navigator.locks = { request: requestLock };
        const b = await oeffneTab(ursprung, 'B', {
            module: MODULE,
            aktiv: KAMPAGNEN_KEY
        }).starten();
        const aSperreAbbrechen = erfasseSperrtransaktion(ursprung, a);
        const bSperreAbbrechen =
            zweiterImport === 'Sperrverlust' ? erfasseSperrtransaktion(ursprung, b) : null;
        if (zweiterImport === 'Indexfehler') {
            const setItem = b.ctx.localStorage.setItem;
            b.ctx.localStorage.setItem = (key, value) => {
                if (key === INDEX_KEY) {
                    const fehler = new Error('Indexwrite verweigert');
                    fehler.name = 'QuotaExceededError';
                    throw fehler;
                }
                return setItem(key, value);
            };
        }
        const gespeicherteNotiz = backend => {
            const raw =
                backend === 'indexedDB'
                    ? ursprung.idbDatensatz(KAMPAGNEN_KEY).data
                    : ursprung.ls.get(KAMPAGNEN_KEY);
            return JSON.parse(raw).quickNotes;
        };

        const importA = starteImport(a, 'Aus Import A', backendA);
        let importB;
        try {
            expect(await importA.geschrieben).toMatchObject({ success: true, backend: backendA });
            expect(gespeicherteNotiz(backendA)).toBe('Aus Import A');
            aSperreAbbrechen();

            importB = starteImport(b, 'Aus Import B', backendB);
            expect(await importB.geschrieben).toMatchObject({ success: true, backend: backendB });
            expect(gespeicherteNotiz(backendB)).toBe('Aus Import B');

            importA.fortsetzen();
            // A erreicht den Rückbau, während B seine Sperre noch hält. Eine Reparatur
            // darf dort auf den Erwerb warten, deshalb A hier nicht bis zum Ende erwarten.
            await ursprung.uhr.ruhe();
            expect(gespeicherteNotiz(backendB)).toBe('Aus Import B');
            if (bSperreAbbrechen) {
                bSperreAbbrechen();
                // A bekommt den nächsten freien Sperrplatz. B bleibt bis zum nächsten
                // Schritt pausiert und hat seinen eigenen Rückbau noch nicht angefordert.
                await ursprung.uhr.ruhe();
            }
        } finally {
            importA.fortsetzen();
            importB?.fortsetzen();
            await Promise.all([importA.abgeschlossen, importB?.abgeschlossen]);
        }

        expect((await importA.abgeschlossen).fehler?.message).toMatch(/abgebrochen/i);
        const expected = zweiterImport === 'Erfolg' ? 'Aus Import B' : ORIGINAL;
        if (zweiterImport === 'Erfolg') {
            expect((await importB.abgeschlossen).ergebnis).toMatchObject({ campaignCount: 1 });
            expect(JSON.parse(ursprung.ls.get(INDEX_KEY)).campaigns[0].name).toBe(expected);
        } else {
            const bFehler = zweiterImport === 'Sperrverlust' ? /abgebrochen/i : /Kampagnenindex/;
            expect((await importB.abgeschlossen).fehler?.message).toMatch(bFehler);
            expect(ursprung.ls.get(INDEX_KEY)).toBe(indexVorher);
        }
        expect(requestLock).toHaveBeenCalledTimes(webLocks ? 1 : 0);
        const neustart = await oeffneTab(ursprung, 'Neustart', { aktiv: KAMPAGNEN_KEY }).starten();
        expect(neustart.ctx.D.quickNotes).toBe(expected);
        if (backendA === 'indexedDB' && backendB === 'localStorage') {
            // Der Rückbau stellt auch die IndexedDB-Kopie neben Bs LocalStorage-Stand wieder her.
            expect(gespeicherteNotiz('indexedDB')).toBe(ORIGINAL);
            expect(ursprung.idbDatensatz(KAMPAGNEN_KEY).importRevision).toBeUndefined();
        }
    }
);
