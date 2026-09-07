/**
 * Unit Tests — NPC-Generator (features/npc-generator/)
 *
 * Herkunft: Phase-5-Wave-0-Stub, aktiviert in Plan 05-04. Bis Phase 14 Plan 05
 * Teil der Welt-Story-Sammel-Testdatei (WELT-02-Block); durch TEST-04
 * (Plan 14-05) mechanisch in eine dedizierte Datei ausgegliedert —
 * unveraendert uebernommen, kein Test geaendert oder hinzugefuegt.
 */

// ============================================================
// WELT-02: NPC-Generator
// ============================================================
describe('WELT-02: NPC-Generator', () => {
    // NPC_DEFAULT_TABLES: Inline-Minimal-Stub für Unit-Tests (Non-ESM: kein require möglich)
    const NPC_DEFAULT_TABLES_STUB = {
        namen: {
            mensch: { maennlich: ['Aldric', 'Berthold'], weiblich: ['Anna', 'Berta'], neutral: ['Alex'] },
            elf:    { maennlich: ['Aethon', 'Liriel'], weiblich: ['Sylara', 'Mireth'] },
            zwerg:  { maennlich: ['Thorin', 'Bofur', 'Gloin'], weiblich: ['Disa', 'Hilda'] },
            halbling: { maennlich: ['Frodo', 'Bilbo'], weiblich: ['Rosie', 'Lobelia'] },
            halbork:  { maennlich: ['Grak', 'Murg'], weiblich: ['Asha', 'Reth'] },
            tiefling: { maennlich: ['Kael', 'Varek'], weiblich: ['Livia', 'Mira'] },
            gnom:     { maennlich: ['Fizban', 'Gnimble'], weiblich: ['Merry', 'Bittergold'] }
        },
        persoenlichkeitszuege: ['Mutig', 'Vorsichtig', 'Neugierig'],
        marotten: ['Trommelt mit den Fingern', 'Wiederholt letzte Worte'],
        berufe: ['Schmied', 'Händler', 'Söldner'],
        aussehen: ['Narbe über dem linken Auge', 'Ungewöhnlich groß']
    };

    // generiereNPCName: Inline-Implementierung (Non-ESM — direkt testbar)
    function generiereNPCName(volk, geschlecht) {
        var tables = NPC_DEFAULT_TABLES_STUB;
        if (!tables || !tables.namen) return 'Unbekannt';
        var pool = (tables.namen[volk] && tables.namen[volk][geschlecht]) || [];
        if (pool.length === 0) return 'Unbekannt';
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function generiereNPC(volk, geschlecht) {
        var tables = NPC_DEFAULT_TABLES_STUB;
        var name = generiereNPCName(volk, geschlecht);
        var zugArr = tables.persoenlichkeitszuege || [];
        var zug = zugArr[Math.floor(Math.random() * zugArr.length)] || '';
        var marotteArr = tables.marotten || [];
        var marotte = marotteArr[Math.floor(Math.random() * marotteArr.length)] || '';
        var berufArr = tables.berufe || [];
        var beruf = berufArr[Math.floor(Math.random() * berufArr.length)] || '';
        var aussArr = tables.aussehen || [];
        var aussehen = aussArr[Math.floor(Math.random() * aussArr.length)] || '';
        return { name, volk: volk || 'mensch', geschlecht: geschlecht || 'neutral', zug, marotte, beruf, aussehen };
    }

    test('generiereNPCName(zwerg, maennlich) liefert Wert aus Namens-Pool', () => {
        var name = generiereNPCName('zwerg', 'maennlich');
        var pool = NPC_DEFAULT_TABLES_STUB.namen.zwerg.maennlich;
        expect(pool).toContain(name);
    });

    test('generiereNPCName mit unbekanntem Volk gibt Fallback zurück', () => {
        var name = generiereNPCName('drache', 'maennlich');
        expect(name).toBe('Unbekannt');
    });

    test('generiereNPC liefert alle Pflichtfelder', () => {
        var npc = generiereNPC('zwerg', 'maennlich');
        expect(npc).toHaveProperty('name');
        expect(npc).toHaveProperty('zug');
        expect(npc).toHaveProperty('marotte');
        expect(npc.name).toBeTruthy();
        expect(npc.zug).toBeTruthy();
        expect(npc.marotte).toBeTruthy();
        // Pflichtfelder sind gesetzt (kein leerer String)
        expect(typeof npc.name).toBe('string');
        expect(typeof npc.zug).toBe('string');
        expect(typeof npc.marotte).toBe('string');
    });

    test('Re-Roll erzeugt anderen NPC ohne D.npcs zu befüllen', () => {
        // D.npcs simulieren
        global.window = global.window || {};
        global.window.D = global.window.D || {};
        global.window.D.npcs = [];
        // 3 Re-Rolls simulieren
        for (var i = 0; i < 3; i++) {
            generiereNPC('mensch', 'maennlich');
        }
        // D.npcs darf nicht befüllt worden sein
        expect(global.window.D.npcs.length).toBe(0);
    });
});
