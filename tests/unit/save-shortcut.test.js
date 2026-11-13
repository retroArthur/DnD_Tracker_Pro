const { erzeugeUrsprung, oeffneTab } = require('./helpers/multi-tab-harness.js');

async function oeffneTastaturTab(ursprung) {
    const tab = await oeffneTab(ursprung, 'Speicherkürzel', {
        module: ['systems/spellslots/keyboard-shortcuts.js']
    }).starten();
    tab.ctx.initKeyboardShortcuts();
    return tab;
}

function drueckeS(tab, optionen) {
    const ereignis = new window.KeyboardEvent('keydown', {
        key: 's',
        cancelable: true,
        ...optionen
    });
    tab.feuere('document', 'keydown', ereignis);
    return ereignis;
}

test.each([
    ['Strg+S', { ctrlKey: true }],
    ['Cmd+S mit Großschreibtaste', { metaKey: true, key: 'S' }]
])('%s meldet erst den bestätigten Speichervorgang', async (_kuerzel, optionen) => {
    const ursprung = erzeugeUrsprung();
    const tab = await oeffneTastaturTab(ursprung);
    const abgeschlossen = Promise.withResolvers();
    tab.ctx.saveImmediate = jest.fn(() => abgeschlossen.promise);

    const ereignis = drueckeS(tab, optionen);
    expect(ereignis.defaultPrevented).toBe(true);
    expect(tab.ctx.saveImmediate).toHaveBeenCalledTimes(1);
    expect(tab.toasts).toEqual([]);

    abgeschlossen.resolve({ success: true, backend: 'indexedDB' });
    await ursprung.uhr.ruhe(1);
    expect(tab.toasts).toEqual([{ text: 'Gespeichert', typ: undefined }]);
});

test('Strg+S lässt die Persistenz einen Speicherfehler und den Notfallexport melden', async () => {
    const ursprung = erzeugeUrsprung();
    const tab = await oeffneTastaturTab(ursprung);
    ursprung.quota.zeichen = 0;
    ursprung.idb.policy.commitFehler = () => new Error('IndexedDB-Commit fehlgeschlagen');
    tab.ctx.exportAllDataAsFile = jest.fn();
    const speichern = jest.spyOn(tab.ctx, 'saveImmediate');

    expect(drueckeS(tab, { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(await speichern.mock.results[0].value).toMatchObject({ success: false });
    await ursprung.uhr.ruhe(1);

    expect(tab.ctx.exportAllDataAsFile).toHaveBeenCalledTimes(1);
    expect(tab.toasts).toEqual([
        { text: expect.stringContaining('Versuche Fallback zu IndexedDB'), typ: 'warning' },
        { text: expect.stringContaining('Speichern fehlgeschlagen'), typ: 'error' }
    ]);
});

test('Strg+S meldet einen überholten Speichervorgang nicht', async () => {
    const ursprung = erzeugeUrsprung();
    const tab = await oeffneTastaturTab(ursprung);
    tab.ctx.saveImmediate = jest.fn().mockResolvedValue({
        success: false,
        superseded: true,
        error: 'superseded'
    });

    expect(drueckeS(tab, { ctrlKey: true }).defaultPrevented).toBe(true);
    await ursprung.uhr.ruhe(1);
    expect(tab.toasts).toEqual([]);
});

test('S ohne Speicherkürzel lässt das Browser-Ereignis durch', async () => {
    const tab = await oeffneTastaturTab(erzeugeUrsprung());
    tab.ctx.saveImmediate = jest.fn();

    expect(drueckeS(tab, {}).defaultPrevented).toBe(false);
    expect(drueckeS(tab, { altKey: true }).defaultPrevented).toBe(false);
    expect(drueckeS(tab, { ctrlKey: true, shiftKey: true, key: 'S' }).defaultPrevented).toBe(false);
    expect(drueckeS(tab, { metaKey: true, shiftKey: true, key: 'S' }).defaultPrevented).toBe(false);
    expect(tab.ctx.saveImmediate).not.toHaveBeenCalled();
});
