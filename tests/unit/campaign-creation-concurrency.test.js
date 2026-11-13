const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { erzeugeUrsprung, oeffneTab, INDEX_KEY } = require('./helpers/multi-tab-harness.js');

const MILLIS = 1790000000000;
const GROSS = 'x'.repeat(5 * 1024 * 1024);
const kampagne = quickNotes => ({ _version: '2.6.1', quickNotes, grosseNotiz: GROSS });

async function oeffneKampagnenTab(ursprung, name, crypto = webcrypto) {
    const tab = await oeffneTab(ursprung, name, {
        module: ['systems/campaign-manager/campaign-manager.js'],
        stubs: { crypto }
    }).starten();
    vm.runInContext('Date.now = () => ' + MILLIS, tab.ctx);
    return tab;
}

function halteDatenschreiben(tab) {
    const original = tab.ctx.writeCampaignData;
    let freigeben;
    const sperre = new Promise(resolve => (freigeben = resolve));
    tab.ctx.writeCampaignData = async (...args) => {
        await sperre;
        return original(...args);
    };
    return freigeben;
}

describe('N06: zwei parallele Anlagen beginnen in derselben Millisekunde', () => {
    test.each(['groß', 'Quota-Fallback', 'gleiche Zufallskennung'])(
        '%s: der Index enthält zwei unterschiedliche Schlüssel und die jeweils richtigen Daten',
        async modus => {
            const ursprung = erzeugeUrsprung({
                lsQuotaZeichen: modus === 'Quota-Fallback' ? 1000 : Infinity
            });
            const crypto =
                modus === 'gleiche Zufallskennung'
                    ? { getRandomValues: words => words.fill(42) }
                    : webcrypto;
            const A = await oeffneKampagnenTab(ursprung, 'A', crypto);
            const B = await oeffneKampagnenTab(ursprung, 'B', crypto);
            const aFreigeben = halteDatenschreiben(A);
            const bFreigeben = halteDatenschreiben(B);

            const payload = text => ({
                ...kampagne(text),
                grosseNotiz: modus === 'Quota-Fallback' ? 'q'.repeat(2000) : GROSS
            });
            const aImport = A.ctx.addCampaignWithData('Kampagne A', payload('Inhalt A'));
            const bImport = B.ctx.addCampaignWithData('Kampagne B', payload('Inhalt B'), {
                activate: true
            });
            expect(ursprung.ls.get(INDEX_KEY)).toBeUndefined();

            aFreigeben();
            const a = await aImport;
            bFreigeben();
            const b = await bImport;
            expect(a).toMatchObject({ success: true, backend: 'indexedDB' });
            expect(b).toMatchObject({ success: true, backend: 'indexedDB' });
            expect(a.key).not.toBe(b.key);
            const index = JSON.parse(ursprung.ls.get(INDEX_KEY));
            expect(index.campaigns).toEqual([
                expect.objectContaining({ name: 'Kampagne A', key: a.key }),
                expect.objectContaining({ name: 'Kampagne B', key: b.key })
            ]);
            expect(index.active).toBe(b.key);
            expect(JSON.parse(ursprung.idbDatensatz(a.key).data).quickNotes).toBe('Inhalt A');
            expect(JSON.parse(ursprung.idbDatensatz(b.key).data).quickNotes).toBe('Inhalt B');
        }
    );

    test('der Rückbau nach einem Indexfehler lässt die andere Kampagne intakt', async () => {
        const ursprung = erzeugeUrsprung();
        const A = await oeffneKampagnenTab(ursprung, 'A');
        const B = await oeffneKampagnenTab(ursprung, 'B');
        const aFreigeben = halteDatenschreiben(A);
        const bFreigeben = halteDatenschreiben(B);

        const aImport = A.ctx.addCampaignWithData('Kampagne A', kampagne('Inhalt A'), {
            activate: true
        });
        const bImport = B.ctx.addCampaignWithData('Kampagne B', kampagne('Inhalt B'), {
            activate: true
        });
        aFreigeben();
        const a = await aImport;
        expect(a.success).toBe(true);
        const indexNachA = ursprung.ls.get(INDEX_KEY);
        const original = B.ctx.localStorage.setItem;
        B.ctx.localStorage.setItem = (key, value) => {
            if (key === INDEX_KEY)
                throw Object.assign(new Error('Quota'), { name: 'QuotaExceededError' });
            return original(key, value);
        };

        bFreigeben();
        const b = await bImport;
        expect(b).toMatchObject({ success: false, stage: 'index' });
        expect(ursprung.ls.get(INDEX_KEY)).toBe(indexNachA);
        const aDatensatz = ursprung.idbDatensatz(a.key);
        expect(aDatensatz).toBeDefined();
        expect(JSON.parse(aDatensatz.data).quickNotes).toBe('Inhalt A');
        expect(ursprung.idbDatensatz(b.key)).toBeUndefined();
    });

    test('eine kleine Neuanlage behandelt einen vorhandenen IDB-only-Schlüssel als belegt', async () => {
        const ursprung = erzeugeUrsprung();
        const crypto = { getRandomValues: words => words.fill(42) };
        const tab = await oeffneKampagnenTab(ursprung, 'A', crypto);
        const belegt = 'dnd-campaign-' + MILLIS + '-' + '0000000042'.repeat(4);
        ursprung.saeenIdb(belegt, kampagne('Schon vorhanden'));

        const angelegt = await tab.ctx.addCampaignWithData('Neue Kampagne', { quickNotes: 'Neu' });
        expect(angelegt).toMatchObject({ success: true, backend: 'localStorage' });
        expect(angelegt.key).not.toBe(belegt);
        expect(ursprung.ls.has(belegt)).toBe(false);
        expect(JSON.parse(ursprung.idbDatensatz(belegt).data).quickNotes).toBe('Schon vorhanden');
    });

    test('eine lokale Neuanlage bleibt bei verweigertem IndexedDB-Lesezugriff möglich', async () => {
        const ursprung = erzeugeUrsprung();
        const tab = await oeffneKampagnenTab(ursprung, 'A');
        tab.ctx.idb = {
            transaction() {
                throw new Error('IndexedDB nicht lesbar');
            }
        };

        const angelegt = await tab.ctx.addCampaignWithData('Neue Kampagne', { quickNotes: 'Neu' });
        expect(angelegt).toMatchObject({ success: true, backend: 'localStorage' });
        expect(JSON.parse(ursprung.ls.get(angelegt.key))).toEqual({ quickNotes: 'Neu' });
    });
});
