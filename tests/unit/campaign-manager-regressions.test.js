const {
    erzeugeUrsprung,
    oeffneTab,
    INDEX_KEY,
    STANDARD_KEY
} = require('./helpers/multi-tab-harness.js');

const KAMPAGNEN_KEY = 'dnd-campaign-111';
const KAMPAGNE = { key: KAMPAGNEN_KEY, name: 'Nordmark', created: '2026-01-01' };

function kampagnenTab(ursprung, name, aktiv) {
    return oeffneTab(ursprung, name, {
        module: ['systems/campaign-manager/campaign-manager.js'],
        aktiv,
        stubs: { formatDate: datum => datum }
    }).starten();
}

function verweigereLokalesLoeschen(tab, schluessel) {
    const removeItem = tab.ctx.localStorage.removeItem;
    tab.ctx.localStorage.removeItem = key => {
        if (key === schluessel) {
            const error = new Error('Löschen verweigert');
            error.name = 'SecurityError';
            throw error;
        }
        removeItem(key);
    };
    return () => {
        tab.ctx.localStorage.removeItem = removeItem;
    };
}

test.each([STANDARD_KEY, KAMPAGNEN_KEY])(
    'N32: Eine Teillöschung von %s lässt den geladenen Stand und den zweiten Versuch zu',
    async key => {
        const ursprung = erzeugeUrsprung();
        const index = { campaigns: [KAMPAGNE], active: key };
        ursprung.ls.set(INDEX_KEY, JSON.stringify(index));
        ursprung.saeen(key, { quickNotes: 'Ältere lokale Kopie' }, { ts: null });
        ursprung.saeenIdb(key, { quickNotes: 'Aktueller Stand aus IndexedDB' });
        const tab = await kampagnenTab(ursprung, 'Löschen', key);
        expect(tab.ctx.D.quickNotes).toBe('Aktueller Stand aus IndexedDB');
        const erlauben = verweigereLokalesLoeschen(tab, key);

        await tab.ctx.deleteCampaign();

        expect(ursprung.idbDatensatz(key)).toBeUndefined();
        expect(JSON.parse(ursprung.ls.get(key)).quickNotes).toBe('Ältere lokale Kopie');
        expect(JSON.parse(ursprung.ls.get(INDEX_KEY))).toEqual(index);
        expect(tab.geschlossen).toBe(false);
        expect(tab.ctx.D.quickNotes).toBe('Aktueller Stand aus IndexedDB');
        expect(tab.ctx.areCampaignWritesRetired()).toBe(false);
        expect(tab.alerts.join(' ')).toContain('nicht vollständig gelöscht');
        expect(tab.alerts.join(' ')).not.toContain('Es wurde nichts gelöscht');

        erlauben();
        await tab.ctx.deleteCampaign();

        expect(ursprung.ls.has(key)).toBe(false);
        expect(JSON.parse(ursprung.ls.get(INDEX_KEY))).toEqual({
            campaigns: key === STANDARD_KEY ? [KAMPAGNE] : [],
            active: STANDARD_KEY
        });
        expect(tab.geschlossen).toBe(true);
        expect(tab.alerts.at(-1)).toContain('wurde gelöscht!');
    }
);

test('N33: Ein Klick in einer veralteten Liste aktiviert eine gelöschte Kampagne nicht', async () => {
    const ursprung = erzeugeUrsprung();
    ursprung.ls.set(INDEX_KEY, JSON.stringify({ campaigns: [KAMPAGNE], active: KAMPAGNEN_KEY }));
    ursprung.saeen(KAMPAGNEN_KEY, { quickNotes: 'Zu löschende Kampagne' });
    const loeschTab = await kampagnenTab(ursprung, 'Löschen', KAMPAGNEN_KEY);
    const wechselTab = await kampagnenTab(ursprung, 'Liste', STANDARD_KEY);
    wechselTab.ctx.renderCampaignList();
    expect(wechselTab.element('campaign-list').innerHTML).toContain(KAMPAGNE.name);

    await loeschTab.ctx.deleteCampaign();
    expect(wechselTab.element('campaign-list').innerHTML).toContain(KAMPAGNE.name);
    await wechselTab.ctx.switchCampaign(KAMPAGNEN_KEY);

    expect(JSON.parse(ursprung.ls.get(INDEX_KEY))).toEqual({
        campaigns: [],
        active: STANDARD_KEY
    });
    expect(wechselTab.geschlossen).toBe(false);
    expect(wechselTab.element('campaign-list').innerHTML).not.toContain(KAMPAGNE.name);
    expect(wechselTab.toasts).toContainEqual(expect.objectContaining({
        text: expect.stringContaining('nicht mehr in der Kampagnenliste')
    }));
});

test.each([true, false])(
    'N33: Die Auswahl wartet auf den Abschluss der Löschung (Löschfehler: %s)',
    async loeschFehler => {
        const ursprung = erzeugeUrsprung();
        const index = { campaigns: [KAMPAGNE], active: KAMPAGNEN_KEY };
        ursprung.ls.set(INDEX_KEY, JSON.stringify(index));
        ursprung.saeen(KAMPAGNEN_KEY, { quickNotes: 'Bisheriger Stand' });
        const loeschTab = await kampagnenTab(ursprung, 'Löschen', KAMPAGNEN_KEY);
        const wechselTab = await kampagnenTab(ursprung, 'Liste', STANDARD_KEY);
        if (loeschFehler) verweigereLokalesLoeschen(loeschTab, KAMPAGNEN_KEY);
        const indexEntfernt = Promise.withResolvers();
        const loeschenFortsetzen = Promise.withResolvers();
        const entfernen = loeschTab.ctx.removeCampaignData;
        loeschTab.ctx.removeCampaignData = async (...args) => {
            indexEntfernt.resolve();
            await loeschenFortsetzen.promise;
            return entfernen(...args);
        };

        const loeschAbschluss = loeschTab.ctx.deleteCampaign();
        let wechselFertig = false;
        let wechselAbschluss;
        try {
            await indexEntfernt.promise;
            expect(JSON.parse(ursprung.ls.get(INDEX_KEY)).campaigns).toEqual([]);
            wechselAbschluss = wechselTab.ctx.switchCampaign(KAMPAGNEN_KEY).then(() => {
                wechselFertig = true;
            });
            await ursprung.uhr.ruhe();
            expect(wechselFertig).toBe(false);
        } finally {
            loeschenFortsetzen.resolve();
            await Promise.all([loeschAbschluss, wechselAbschluss]);
        }

        expect(wechselTab.geschlossen).toBe(loeschFehler);
        expect(JSON.parse(ursprung.ls.get(INDEX_KEY))).toEqual(
            loeschFehler ? index : { campaigns: [], active: STANDARD_KEY }
        );
    }
);

test('N33: Ein Kampagnenwechsel überschreibt keinen beschädigten Index', async () => {
    const ursprung = erzeugeUrsprung();
    ursprung.ls.set(INDEX_KEY, '{beschädigt');
    const tab = await kampagnenTab(ursprung, 'Wechsel', STANDARD_KEY);

    await tab.ctx.switchCampaign(STANDARD_KEY);

    expect(ursprung.ls.get(INDEX_KEY)).toBe('{beschädigt');
    expect(tab.geschlossen).toBe(false);
    expect(tab.toasts).toContainEqual(expect.objectContaining({
        text: expect.stringContaining('Kampagnenindex ist beschädigt')
    }));
});

test('N33: Eine während der Sperrwartezeit geänderte Kampagne wird vor der Navigation gespeichert', async () => {
    const ursprung = erzeugeUrsprung();
    ursprung.ls.set(INDEX_KEY, JSON.stringify({ campaigns: [KAMPAGNE], active: STANDARD_KEY }));
    ursprung.saeenIdb(STANDARD_KEY, { quickNotes: 'Vorher' });
    ursprung.saeen(KAMPAGNEN_KEY, { quickNotes: 'Ziel' });
    const tab = await kampagnenTab(ursprung, 'Wechsel', STANDARD_KEY);
    const sperreAktiv = Promise.withResolvers();
    const freigeben = Promise.withResolvers();
    const sperre = tab.ctx.withCampaignIndexLock(async () => {
        sperreAktiv.resolve();
        await freigeben.promise;
    });
    let wechsel;
    let gespeicherteNotiz;
    tab.ctx.addEventListener('beforeunload', () => {
        gespeicherteNotiz = JSON.parse(ursprung.idbDatensatz(STANDARD_KEY).data).quickNotes;
    });
    try {
        await sperreAktiv.promise;
        wechsel = tab.ctx.switchCampaign(KAMPAGNEN_KEY);
        await ursprung.uhr.ruhe();
        tab.ctx.D.quickNotes = 'Während des Wartens gespeichert';
        tab.ctx.D.grosseNotiz = 'x'.repeat(5 * 1024 * 1024);
        tab.ctx.save();
    } finally {
        freigeben.resolve();
        await Promise.all([sperre, wechsel]);
    }

    expect(JSON.parse(ursprung.ls.get(INDEX_KEY)).active).toBe(KAMPAGNEN_KEY);
    expect(tab.entladungen[0].defaultPrevented).toBe(false);
    expect(gespeicherteNotiz).toBe('Während des Wartens gespeichert');
});

test.each([false, true])(
    'N63: Ein schon gestarteter IndexedDB-Save wartet bis nach dem Löschversuch (Rollback: %s)',
    async rollback => {
        const ursprung = erzeugeUrsprung();
        const kampagne = { ...KAMPAGNE, _localInstance: 'bisherige-instanz' };
        const index = { campaigns: [kampagne], active: KAMPAGNEN_KEY };
        ursprung.ls.set(INDEX_KEY, JSON.stringify(index));
        ursprung.saeenIdb(KAMPAGNEN_KEY, {
            quickNotes: 'Bisheriger bestätigter Stand',
            grosseNotiz: 'A'.repeat(5 * 1024 * 1024)
        });
        const loeschTab = await kampagnenTab(ursprung, 'Löschen', KAMPAGNEN_KEY);
        const speicherTab = await kampagnenTab(ursprung, 'Speichern', KAMPAGNEN_KEY);
        expect(speicherTab.ctx.D.quickNotes).toBe('Bisheriger bestätigter Stand');
        expect(ursprung.ls.has(KAMPAGNEN_KEY + '_rev')).toBe(false);

        if (rollback) {
            ursprung.idb.policy.requestFehler = op => op === 'delete' ? new Error('Delete aborted') : null;
        }
        const lesenAngefordert = Promise.withResolvers();
        const lesenFortsetzen = Promise.withResolvers();
        const lesen = speicherTab.ctx.loadFromIndexedDBFallbackRaw;
        let gelesen;
        speicherTab.ctx.loadFromIndexedDBFallbackRaw = async key => {
            lesenAngefordert.resolve();
            await lesenFortsetzen.promise;
            gelesen = await lesen(key);
            return gelesen;
        };
        speicherTab.ctx.D.quickNotes = 'Änderung aus dem bereits geöffneten Tab';
        const start = ursprung.idb.anfragen.length;
        const bestaetigt = speicherTab.ctx.getPersistSuccessCount();
        const speichern = speicherTab.ctx.saveImmediate();
        try {
            await lesenAngefordert.promise;
            await loeschTab.ctx.deleteCampaign();
            expect(JSON.parse(ursprung.ls.get(INDEX_KEY))).toEqual(
                rollback ? index : { campaigns: [], active: STANDARD_KEY }
            );
            expect(!!ursprung.idbDatensatz(KAMPAGNEN_KEY)).toBe(rollback);
            await ursprung.uhr.laufen(0);
        } finally {
            lesenFortsetzen.resolve();
            await speichern;
        }

        const writes = ursprung.idb.anfragen.slice(start).filter(
            anfrage => anfrage.store === 'campaigns' && anfrage.op === 'put'
        );
        expect(!!gelesen).toBe(rollback);
        expect(writes).toHaveLength(rollback ? 1 : 0);
        expect(speicherTab.ctx.getPersistSuccessCount() - bestaetigt).toBe(rollback ? 1 : 0);
        expect(ursprung.ls.has(KAMPAGNEN_KEY)).toBe(false);
        if (rollback) {
            expect(await speichern).toMatchObject({ success: true, backend: 'indexedDB' });
            const neuerTab = await kampagnenTab(ursprung, 'Neustart', KAMPAGNEN_KEY);
            expect(neuerTab.ctx.D.quickNotes).toBe('Änderung aus dem bereits geöffneten Tab');
        } else {
            expect(await speichern).toMatchObject({ success: false });
            expect(ursprung.idbDatensatz(KAMPAGNEN_KEY)).toBeUndefined();
            expect(ursprung.ls.has(KAMPAGNEN_KEY + '_rev')).toBe(false);
        }
    }
);
