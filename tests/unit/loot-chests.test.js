const fs = require('fs');
const path = require('path');
const vm = require('vm');

const feature = path.join(__dirname, '../../features/loot-chests.js');

function loadPicker() {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(feature, 'utf8'), context);
    return context.pickLootChestEntry;
}

test('relative Gewichte teilen den Bereich auch bei Dezimalwerten korrekt auf', () => {
    const pick = loadPicker();
    const trank = { name: 'Heiltrank', weight: 0.5 };
    const ring = { name: 'Silberring', weight: 1.5 };
    const entries = [trank, ring];

    expect(pick(entries, 0)).toBe(trank);
    expect(pick(entries, 0.24999)).toBe(trank);
    expect(pick(entries, 0.25)).toBe(ring);
    expect(pick(entries, 0.99999)).toBe(ring);
    expect(entries).toEqual([trank, ring]);
});

test('eine leere Truhe und Einträge mit Gewicht null liefern keinen Drop', () => {
    const pick = loadPicker();
    const ausgeschlossen = { name: 'Lederbeutel', weight: 0 };
    const ring = { name: 'Silberring', weight: 1 };

    expect(pick([], 0)).toBeNull();
    expect(pick([ausgeschlossen], 0)).toBeNull();
    expect(pick([ausgeschlossen, ring], 0)).toBe(ring);
});
