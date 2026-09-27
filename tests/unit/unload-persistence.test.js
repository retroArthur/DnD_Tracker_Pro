/**
 * Code-Review 2026-09-21, Einheit U7 — R02: Schliessen oder Neuladen eines Tabs darf keine
 * neueren Daten ueberschreiben.
 *
 * Vorher schrieb systems/avatars.js bei JEDEM beforeunload JSON(window.D) in den aktiven
 * Schluessel — ohne Aenderungs-, Revisions- oder Konfliktpruefung, ohne _ts und am
 * IndexedDB-Modus vorbei. Ein unveraenderter, veralteter Tab machte so die Arbeit eines
 * anderen Tabs zunichte; location.reload() nach "Alle Daten loeschen", nach dem
 * Umzugs-Import und nach dem Kampagnen-Loeschen schrieb den alten Stand zurueck.
 *
 * Soll (systems/spellslots/persistence.js):
 *  - load()/jeder Save setzen eine Baseline {Schluessel, gelesener LS-Wert, _rev, Snapshot};
 *    ein fremder Schreiber (Broadcast, storage-Ereignis, _rev, Inhalt) macht den Tab "veraltet"
 *  - beim Verlassen schreibt nur ein geaenderter, NICHT veralteter Tab — synchron mit _ts/_rev;
 *    im IndexedDB-Modus wird der Save angestossen
 *  - die native Rueckfrage nur bei einem ausdruecklich angestossenen Save (ausstehend, laufend,
 *    gescheitert) — D5 = A; harmlose Nebenaenderungen fragen nie
 *  - automatische Saves (Session-Timer, Reparatur nach load(), initRandomTables,
 *    Markdown-Onboarding) schreiben in einem veralteten Tab und nach gescheitertem load() nie
 *    (D4 = A); ausdrueckliche Saves bleiben last-writer-wins
 *  - retireCampaignWrites(): harte Schreibsperre VOR dem Entfernen/Umziehen
 *
 * Werkbank: tests/unit/helpers/multi-tab-harness.js (ein vm-Kontext je Tab, geteilter
 * Ursprung, virtuelle Uhr). Die Tabs booten in core/init.js-Reihenfolge; window.STORAGE_KEY
 * wird nicht gesetzt.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
    erzeugeUrsprung,
    oeffneTab,
    buendelDedup,
    STANDARD_KEY: KEY,
    INDEX_KEY,
    WURZEL
} = require('./helpers/multi-tab-harness.js');

const NEBEN_KEY = 'dnd-campaign-111';
const MB = 1024 * 1024;

function kampagne(namenListe, extra = {}) {
    return Object.assign(
        { _version: '2.6.1', characters: namenListe.map((n, i) => ({ id: i + 1, name: n })) },
        extra
    );
}

// > 5 MB UTF-8: IndexedDB-Modus. zeichen 'ä' ergibt 2 Byte je Zeichen.
function grosseKampagne(zeichen = 'A', anzahl = 6) {
    const k = kampagne(Array.from({ length: anzahl }, (_, i) => 'Held ' + i));
    k.characters.forEach(c => {
        c.notes = zeichen.repeat(MB);
    });
    return k;
}

function namen(roh) {
    if (roh === null || roh === undefined) return null;
    return (JSON.parse(roh).characters || []).map(c => c.name);
}

function namenIn(D) {
    return (D.characters || []).map(c => c.name);
}

const beimEntladen = (u, tab) => u.schreibvorgaenge({ tab, phase: ['beforeunload', 'pagehide'] });
const speicherVoll = tab => tab.toasts.filter(t => /Speicher voll/.test(t.text));

async function zweiTabs(u, opt = {}) {
    const A = await oeffneTab(u, 'A', opt.A).starten();
    const B = await oeffneTab(u, 'B', opt.B).starten();
    return { A, B };
}

// B fuegt "Borin" hinzu und speichert sofort; Ereignisse an A zustellen
async function bSpeichertBorin(u, B) {
    B.ctx.D.characters.push({ id: 2, name: 'Borin' });
    const r = await B.ctx.saveImmediate();
    await u.uhr.laufen(0);
    return r;
}

// ============================================================
// Kern
// ============================================================

describe('R02 — Kern: ein Tab schreibt beim Verlassen nie blind zurueck', () => {
    test('U1: unveraenderter, veralteter Tab A — Bs Stand, Bs _ts und der naechste Start bleiben bei B', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const { A, B } = await zweiTabs(u);
        await bSpeichertBorin(u, B);
        const tsVonB = u.ls.get(KEY + '_ts');
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Borin']); // Nicht-Vakuitaet

        const ev = A.entladen('schliessen');

        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Borin']);
        expect(beimEntladen(u, 'A')).toEqual([]);
        expect(u.ls.get(KEY + '_ts')).toBe(tsVonB);
        expect(ev.defaultPrevented).toBe(false);
        const C = await oeffneTab(u, 'C').starten();
        expect(namenIn(C.ctx.D)).toEqual(['Aria', 'Borin']);
    });

    test('U2: realistische Reihenfolge — B speichert entprellt, B schliesst, dann der vergessene Tab A', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const { A, B } = await zweiTabs(u);
        B.ctx.D.characters.push({ id: 2, name: 'Borin' });
        B.ctx.save();
        await u.uhr.laufen(350);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Borin']);

        B.entladen('schliessen');
        A.entladen('schliessen');

        const C = await oeffneTab(u, 'C').starten();
        expect(namenIn(C.ctx.D)).toEqual(['Aria', 'Borin']);
    });

    test('U3: ein unveraenderter einzelner Tab schreibt beim Verlassen gar nichts', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await oeffneTab(u, 'A').starten();

        A.entladen('schliessen');

        expect(beimEntladen(u, 'A')).toEqual([]);
    });

    test('U4 (Sicherheitsnetz): geaenderter, nicht veralteter Tab mit ausstehendem save() — synchron geschrieben, _ts und _rev neu', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']), { ts: '1000' });
        const A = await oeffneTab(u, 'A').starten();
        A.ctx.D.characters[0].name = 'Aria (umbenannt)';
        A.ctx.save(); // ausstehend (300 ms)

        const ev = A.entladen('schliessen innerhalb des Debounce');

        expect(namen(u.ls.get(KEY))).toEqual(['Aria (umbenannt)']);
        expect(u.ls.get(KEY + '_ts')).not.toBe('1000');
        expect(u.ls.get(KEY + '_rev')).toEqual(expect.any(String));
        expect(ev.defaultPrevented).toBe(false);
    });

    // Jede echte Sitzung hat schon gespeichert: nach dem EIGENEN Save muss die Baseline dem
    // eigenen Write folgen — sonst gilt der Tab gegen sich selbst als veraltet (automatische
    // Saves, der Flush beim Verstecken und das Schreiben beim Verlassen waeren gesperrt)
    const EIGENER_SAVE = {
        saveImmediate: async (u, A) => {
            expect(await A.ctx.saveImmediate()).toMatchObject({
                success: true,
                backend: 'localStorage'
            });
        },
        'entprellter save()': async (u, A) => {
            A.ctx.save();
            await u.uhr.laufen(350);
        }
    };

    test.each(Object.keys(EIGENER_SAVE))(
        'U4b (Sicherheitsnetz nach eigenem Save, %s): erneut geaendert mit ausstehendem save() — synchron geschrieben, keine Rueckfrage, _rev neu',
        async art => {
            const u = erzeugeUrsprung();
            u.saeen(KEY, kampagne(['Aria']), { ts: '1000' });
            const A = await oeffneTab(u, 'A').starten();
            A.ctx.D.characters[0].name = 'Aria 1';
            await EIGENER_SAVE[art](u, A);
            expect(namen(u.ls.get(KEY))).toEqual(['Aria 1']); // Nicht-Vakuitaet
            const revNachEigenemSave = u.ls.get(KEY + '_rev');
            expect(revNachEigenemSave).toEqual(expect.any(String));
            expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);
            expect(A.ctx.saveAutomatic()).toBe(true); // Session-Timer & Co. schreiben weiter

            A.ctx.D.characters[0].name = 'Aria 2';
            A.ctx.save(); // ausstehend (300 ms)
            const ev = A.entladen('schliessen innerhalb des Debounce');

            expect(namen(u.ls.get(KEY))).toEqual(['Aria 2']);
            expect(ev.defaultPrevented).toBe(false);
            expect(u.ls.get(KEY + '_rev')).toEqual(expect.any(String));
            expect(u.ls.get(KEY + '_rev')).not.toBe(revNachEigenemSave);
            expect(beimEntladen(u, 'A').map(e => e.key)).toContain(KEY);
        }
    );

    test('U5: geaendert UND veraltet, ausdruecklicher Save ausstehend — Bs Daten bleiben, Rueckfrage angefordert', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const { A, B } = await zweiTabs(u);
        await bSpeichertBorin(u, B);
        A.ctx.D.characters[0].name = 'Aria (A, ungespeichert)';
        A.ctx.save();

        const ev = A.entladen('schliessen');

        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Borin']);
        expect(ev.defaultPrevented).toBe(true);
        expect(beimEntladen(u, 'A')).toEqual([]);
    });

    test('U6: veralteter Tab mit nur harmloser Nebenaenderung (Wuerfelhistorie ohne save) — kein Schreiben, keine Rueckfrage', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const { A, B } = await zweiTabs(u);
        await bSpeichertBorin(u, B);
        A.ctx.quickRoll(20); // D.diceHistory ohne save()
        expect(A.ctx.D.diceHistory.length).toBe(1);

        const ev = A.entladen('schliessen');

        expect(beimEntladen(u, 'A')).toEqual([]);
        expect(ev.defaultPrevented).toBe(false);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Borin']);
    });

    test('U7: Veraltung allein am Inhalt — ein Fremdschreiber ohne _rev/Broadcast/Ereignis; der geaenderte Tab A ueberschreibt ihn nicht', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await oeffneTab(u, 'A').starten();
        u.fremdSchreiben(KEY, kampagne(['Aria', 'Fremd']));
        A.ctx.D.quickNotes = 'Notiz in A';

        A.entladen('schliessen');

        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Fremd']);
        expect(beimEntladen(u, 'A')).toEqual([]);
    });
});

// ============================================================
// IndexedDB-Modus
// ============================================================

describe('R02 — IndexedDB-Modus (> 5 MB)', () => {
    const LS_QUOTA = 5 * MB; // Zeichen

    test('U8: unveraenderter Tab — kein localStorage-Schreibversuch fuer die Kampagne, kein "Speicher voll"', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const A = await oeffneTab(u, 'A').starten();
        expect(namenIn(A.ctx.D)).toHaveLength(6); // aus IndexedDB geladen

        A.entladen('schliessen');

        expect(u.schreibvorgaenge({ tab: 'A', praefix: KEY })).toEqual([]);
        expect(speicherVoll(A)).toEqual([]);
    });

    test('U9: Mehrbyte-Inhalt (> 5 MB UTF-8, unter der Zeichen-Quota) — veralteter, unveraenderter Tab legt keinen localStorage-Schatten an', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne('ä', 3));
        const { A, B } = await zweiTabs(u);
        B.ctx.D.characters[1].name = 'Neu aus B';
        const r = await B.ctx.saveImmediate();
        await u.uhr.laufen(0);
        expect(r).toMatchObject({ success: true, backend: 'indexedDB' });

        A.entladen('schliessen');

        expect(u.ls.has(KEY)).toBe(false);
        expect(JSON.parse(u.idbDatensatz(KEY).data).characters[1].name).toBe('Neu aus B');
    });

    test('U10: ausstehende Umbenennung beim Schliessen — IndexedDB-put ist abgesetzt, Rueckfrage angefordert', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const A = await oeffneTab(u, 'A').starten();
        A.ctx.D.characters[0].name = 'Umbenannt';
        A.ctx.save();
        const vorher = u.idb.anfragen.length;

        const ev = A.entladen('schliessen innerhalb des Debounce');

        // Nur "abgesetzt" pruefen — ob ein entladendes Dokument den Commit erlebt, garantiert
        // kein Browser. Die Rueckfrage haelt die Seite dafuer offen.
        const puts = u.idb.anfragen
            .slice(vorher)
            .filter(a => a.op === 'put' && a.store === 'campaigns');
        expect(puts.length).toBeGreaterThanOrEqual(1);
        expect(JSON.parse(puts[puts.length - 1].wert.data).characters[0].name).toBe('Umbenannt');
        expect(ev.defaultPrevented).toBe(true);
    });

    test('U11: Flush beim Verstecken — die Aenderung ist vor dem Schliessen in IndexedDB, das spaetere Schliessen fragt nicht', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const A = await oeffneTab(u, 'A').starten();
        A.ctx.D.characters[0].name = 'Umbenannt vor Tabwechsel';
        A.ctx.save();

        A.verstecken();
        await u.uhr.laufen(0); // kein Timer-Fortschritt noetig: der Commit laeuft ueber IndexedDB
        const ev = A.entladen('spaeter schliessen');

        expect(ev.defaultPrevented).toBe(false);
        const C = await oeffneTab(u, 'C').starten();
        expect(C.ctx.D.characters[0].name).toBe('Umbenannt vor Tabwechsel');
    });

    const idbPuts = (u, ab) =>
        u.idb.anfragen.slice(ab).filter(a => a.op === 'put' && a.store === 'campaigns');

    // Nach dem eigenen IndexedDB-Save folgt die Baseline dem eigenen Write (Snapshot, _rev)
    async function eigenerIdbSave(u, A, name) {
        A.ctx.D.characters[0].name = name;
        const r = await A.ctx.saveImmediate();
        await u.uhr.laufen(0);
        expect(r).toMatchObject({ success: true, backend: 'indexedDB' });
        expect(JSON.parse(u.idbDatensatz(KEY).data).characters[0].name).toBe(name);
    }

    test('U4c: nach dem eigenen IndexedDB-Save — _rev gesetzt; unveraendert geschlossen: kein weiterer put, keine Rueckfrage', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const A = await oeffneTab(u, 'A').starten();
        await eigenerIdbSave(u, A, 'Gespeichert');
        // Der _rev-Marker ist im IndexedDB-Modus das einzige Signal an andere Tabs
        expect(u.ls.get(KEY + '_rev')).toEqual(expect.any(String));
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);
        const vorher = u.idb.anfragen.length;

        const ev = A.entladen('schliessen');
        await u.uhr.laufen(0);

        expect(idbPuts(u, vorher)).toEqual([]);
        expect(ev.defaultPrevented).toBe(false);
        expect(u.schreibvorgaenge({ tab: 'A', phase: ['beforeunload', 'pagehide'] })).toEqual([]);
    });

    test('U4d: nach dem eigenen IndexedDB-Save erneut geaendert mit ausstehendem save() — put mit der neuen Aenderung abgesetzt, Rueckfrage angefordert', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const A = await oeffneTab(u, 'A').starten();
        await eigenerIdbSave(u, A, 'Erste');
        expect(A.ctx.saveAutomatic()).toBe(true);
        A.ctx.D.characters[0].name = 'Zweite';
        A.ctx.save();
        const vorher = u.idb.anfragen.length;

        const ev = A.entladen('schliessen innerhalb des Debounce');

        const puts = idbPuts(u, vorher);
        expect(puts.length).toBeGreaterThanOrEqual(1);
        expect(JSON.parse(puts[puts.length - 1].wert.data).characters[0].name).toBe('Zweite');
        expect(ev.defaultPrevented).toBe(true); // D5: > 5 MB schreibt noch
        expect(speicherVoll(A)).toEqual([]);
    });

    // A ist veraltet UND geaendert (ausdruecklicher Save ausstehend): Bs neuerer
    // IndexedDB-Datensatz ueberlebt, As Aenderung landet nirgends, die Rueckfrage kommt.
    // Im IndexedDB-Modus fehlt der Kampagnenschluessel in localStorage — die Inhaltspruefung
    // sieht dort null === null und erkennt NICHTS. Veraltung haengt allein an _rev und am
    // external-Flag (BroadcastChannel/storage-Ereignis ueber systems/undo.js).
    async function veraltetUndGeaendertSchliessen(u, A, { zustellen = true } = {}) {
        if (zustellen) await u.uhr.laufen(0);
        A.ctx.D.characters[0].name = 'A (veraltet)';
        A.ctx.save();
        const ev = A.entladen('schliessen');
        await u.uhr.laufen(0); // ein angestossener put haette jetzt committet
        const rec = JSON.parse(u.idbDatensatz(KEY).data);
        expect(rec.characters[1].name).toBe('Neu aus B');
        expect(rec.characters[0].name).toBe('Held 0');
        expect(ev.defaultPrevented).toBe(true);
        return ev;
    }

    async function bSpeichertInIdb(u, B) {
        B.ctx.D.characters[1].name = 'Neu aus B';
        const r = await B.ctx.saveImmediate();
        expect(r).toMatchObject({ success: true, backend: 'indexedDB' });
        expect(u.ls.has(KEY)).toBe(false); // kein localStorage-Schatten: Inhaltspruefung blind
    }

    test('U9b: veraltet UND geaendert im IndexedDB-Modus — Bs Datensatz ueberlebt, Rueckfrage angefordert', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const { A, B } = await zweiTabs(u);
        await bSpeichertInIdb(u, B);

        await veraltetUndGeaendertSchliessen(u, A);
        expect(A.bannerSichtbar()).toBe(true);
    });

    test('U9c: _rev allein — A schliesst, bevor Bs Broadcast und storage-Ereignis zugestellt sind', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const { A, B } = await zweiTabs(u);
        await bSpeichertInIdb(u, B);
        expect(A.bannerSichtbar()).toBe(false); // noch nichts zugestellt

        await veraltetUndGeaendertSchliessen(u, A, { zustellen: false });
    });

    test('U9d: localStorage voll — Bs _rev-Write scheitert, allein der BroadcastChannel macht A veraltet', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        u.saeenIdb(KEY, grosseKampagne());
        const { A, B } = await zweiTabs(u);
        await bSpeichertInIdb(u, B);
        expect(u.ls.has(KEY + '_rev')).toBe(false); // der _rev-Marker fehlt wirklich

        await veraltetUndGeaendertSchliessen(u, A);
        expect(A.bannerSichtbar()).toBe(true);
    });

    test('U9e: ohne BroadcastChannel — das storage-Ereignis des _rev-Markers zeigt das Banner, A ueberschreibt nicht', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const ohneKanal = { stubs: { BroadcastChannel: undefined } };
        const { A, B } = await zweiTabs(u, { A: ohneKanal, B: ohneKanal });
        await bSpeichertInIdb(u, B);
        await u.uhr.laufen(0);
        expect(A.bannerSichtbar()).toBe(true);

        await veraltetUndGeaendertSchliessen(u, A);
    });

    // Korrekturrunde zum Code-Review 2026-09-21 (F2, U7 minor:2 / R02-Restbefund R1):
    // der >5-MB-Zweig von persistOnUnload stiess _persistNow() auch fuer harmlose
    // Nebenaenderungen an. Sein put wird NACH dem laufenden ausdruecklichen Save des
    // anderen Tabs angelegt und committet danach — D4 verbietet genau das.
    test('U9f: harmlose Nebenaenderung beim Schliessen setzt keinen put ab, waehrend Bs ausdruecklicher IDB-Save laeuft', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const { A, B } = await zweiTabs(u);
        const vorher = u.idb.anfragen.length;
        B.ctx.D.characters.push({ id: 99, name: 'Borin' });
        const bSave = B.ctx.saveImmediate();
        A.ctx.D.diceHistory = [{ dice: 'd20', result: 7, timestamp: 1 }]; // harmlos, ohne save()
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false); // Nicht-Vakuitaet: A gilt als frisch

        const ev = A.entladen('schliessen');
        await u.uhr.laufen(0);
        const r = await bSave;
        await u.uhr.laufen(0);

        expect(r).toMatchObject({ success: true, backend: 'indexedDB' });
        expect(idbPuts(u, vorher)).toHaveLength(1);
        expect(ev.defaultPrevented).toBe(false);
        const C = await oeffneTab(u, 'C').starten();
        expect(namenIn(C.ctx.D)).toContain('Borin');
    });

    test('U22: switchCampaign() schreibt einen ausstehenden Save fest, BEVOR neu geladen wird — keine Rueckfrage', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        u.ls.set(
            INDEX_KEY,
            JSON.stringify({ campaigns: [{ key: NEBEN_KEY, name: 'Neben' }], active: KEY })
        );
        const A = await oeffneTab(u, 'A', {
            module: ['systems/campaign-manager/campaign-manager.js']
        }).starten();
        A.ctx.D.characters[0].name = 'Vor dem Wechsel';
        A.ctx.save();

        const fertig = A.ctx.switchCampaign(NEBEN_KEY);
        await u.uhr.laufen(0);
        await fertig;

        expect(A.geschlossen).toBe(true);
        expect(A.entladungen[0].defaultPrevented).toBe(false);
        expect(JSON.parse(u.idbDatensatz(KEY).data).characters[0].name).toBe('Vor dem Wechsel');
        expect(JSON.parse(u.ls.get(INDEX_KEY)).active).toBe(NEBEN_KEY);
    });
});

// ============================================================
// Loeschende und umziehende Ablaeufe
// ============================================================

describe('R02 — loeschende/umziehende Ablaeufe: harte Schreibsperre VOR dem Entfernen', () => {
    async function alleDatenLoeschen(u, variante) {
        u.saeen(KEY, kampagne(['Aria']));
        u.saeenIdb(KEY, kampagne(['Aria (IDB-Kopie)']));
        const A = oeffneTab(u, 'A', {
            module: ['systems/spellslots/import-export.js'],
            stubs: { reportSafetyBackup: async s => s }
        });
        // Sicherheitskopie (systems/backups.js) gibt die Kontrolle an die Uhr ab — ein
        // ueberfaelliger Debounce KANN waehrenddessen feuern, wie im Browser
        A.ctx.createAutoBackup = () => new Promise(r => A.ctx.setTimeout(() => r('written'), 0));
        await A.starten();
        A.ctx.D.quickNotes = 'kurz vor dem Klick getippt';
        A.ctx.save();
        if (variante === 'ueberfaellig') u.uhr.blockieren(400); // Dialog blockiert, Timer faellig

        const fertig = A.ctx.clearStorage();
        await u.uhr.laufen(1100); // Sicherheitskopie, Entfernen, Reload-Timer (1 s)
        await fertig;
        return A;
    }

    test.each([['ausstehend'], ['ueberfaellig']])(
        'U12: "Alle Daten loeschen" mit %s Debounce — Schluessel, _ts, _rev und IndexedDB-Kopie bleiben weg',
        async variante => {
            const u = erzeugeUrsprung();
            const A = await alleDatenLoeschen(u, variante);

            expect(A.geschlossen).toBe(true); // Reload lief
            expect(A.toasts.map(t => t.text)).toContain('✅ Alle Daten gelöscht');
            expect(u.ls.has(KEY)).toBe(false);
            expect(u.ls.has(KEY + '_ts')).toBe(false);
            expect(u.ls.has(KEY + '_rev')).toBe(false);
            expect(u.idbDatensatz(KEY)).toBeUndefined();
            // Nach dem Entfernen schreibt nichts den Schluessel neu
            const log = u.schreibvorgaenge({ tab: 'A', praefix: KEY });
            const letztesEntfernen = log.map(e => e.op).lastIndexOf('removeItem');
            expect(letztesEntfernen).toBeGreaterThan(-1);
            expect(log.slice(letztesEntfernen + 1).filter(e => e.op === 'setItem')).toEqual([]);
            const C = await oeffneTab(u, 'C').starten();
            expect(namenIn(C.ctx.D)).toEqual([]);
        }
    );

    test('U13: Schreibsperre — nach retireCampaignWrites() schreiben save(), saveImmediate(), saveAutomatic(), Undo und Entladen nichts', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await oeffneTab(u, 'A').starten();
        A.ctx.saveUndoState('vorher');
        A.ctx.D.quickNotes = 'nach der Sperre';
        const vorher = u.log.length;

        await A.ctx.retireCampaignWrites();
        A.ctx.save();
        const sofort = await A.ctx.saveImmediate();
        const automatisch = A.ctx.saveAutomatic();
        A.ctx.undo(); // ruft saveImmediate()
        await u.uhr.laufen(400);
        // F2: undo() stellt D wieder her — ohne diese erneute Aenderung endete
        // persistOnUnload schon an der Unveraendert-Pruefung und der Retired-Waechter
        // blieb ungebunden (U7 minor:9)
        A.ctx.D.quickNotes = 'nach undo';
        const ev = A.entladen('reload');

        expect(sofort).toEqual({ success: false, error: 'retired' });
        expect(automatisch).toBe(false);
        expect(ev.defaultPrevented).toBe(false);
        expect(u.log.slice(vorher)).toEqual([]);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria']);
    });

    function exportObjekt(namenListe) {
        return {
            _exportType: 'full-v1',
            campaigns: { [KEY]: { meta: { key: KEY }, data: kampagne(namenListe) } },
            campaignIndex: { campaigns: [], active: KEY }
        };
    }

    function exportDatei(namenListe) {
        return {
            name: 'umzug.json',
            size: 200,
            inhalt: JSON.stringify(exportObjekt(namenListe))
        };
    }

    test.each([['unveraendert'], ['mit ausstehendem Save vor dem Import']])(
        'U14: Umzugs-Assistent (%s) — der importierte Stand ueberlebt das Neuladen',
        async variante => {
            const u = erzeugeUrsprung();
            u.saeen(KEY, kampagne(['Vor-Import']));
            const A = await oeffneTab(u, 'A', {
                module: [
                    'systems/campaign-manager/campaign-manager.js',
                    'systems/migration/full-export.js',
                    'systems/migration/migration-wizard.js'
                ]
            }).starten();
            if (variante !== 'unveraendert') {
                A.ctx.D.quickNotes = 'ungespeichert';
                A.ctx.save();
            }

            A.ctx._processWizardFile(
                exportDatei(['Importiert']),
                A.element('migration-wizard-dropzone')
            );
            await A.dateiGelesen;
            expect(namen(u.ls.get(KEY))).toEqual(['Importiert']); // Import geschrieben
            // wizard-close: window.location.reload()
            const ev = A.ctx.location.reload();

            expect(ev.defaultPrevented).toBe(false);
            expect(namen(u.ls.get(KEY))).toEqual(['Importiert']);
            await u.uhr.laufen(400);
            const C = await oeffneTab(u, 'C').starten();
            expect(namenIn(C.ctx.D)).toEqual(['Importiert']);
        }
    );

    // Korrekturrunde zum Code-Review 2026-09-21 (F2, U7 minor:3 + open:7 /
    // R02-Restbefund R2): der Umzugs-Assistent schreibt den Import ueber
    // StorageAPI (ohne Generationszaehler) und sperrt danach die Schreibpfade.
    // Ein noch laufender IndexedDB-Save DIESES Tabs raeumte danach den frisch
    // importierten Schluessel samt _ts weg — der naechste Start las die alte
    // IndexedDB-Kopie, obwohl der Assistent Erfolg gemeldet hatte.
    const IMPORT_MODULE = [
        'systems/campaign-manager/campaign-manager.js',
        'systems/migration/full-export.js'
    ];

    function grosseAltKampagne(anzahl = 6) {
        const k = kampagne(Array.from({ length: anzahl }, (_, i) => 'Alt ' + i));
        k.characters.forEach(c => {
            c.notes = 'A'.repeat(MB);
        });
        return k;
    }

    test('U14c: Import waehrend eines laufenden IndexedDB-Saves — der Nachlauf des Saves loescht den Import nicht', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: 5 * MB });
        u.saeenIdb(KEY, grosseAltKampagne());
        const A = await oeffneTab(u, 'A', { module: IMPORT_MODULE }).starten();
        expect(namenIn(A.ctx.D)).toHaveLength(6); // Nicht-Vakuitaet: IndexedDB-Modus

        A.ctx.D.quickNotes = 'x';
        const laufend = A.ctx.saveImmediate(); // put abgesetzt, Commit offen
        A.ctx.importFullExport(exportObjekt(['Importiert']));
        A.ctx.retireCampaignWrites(); // genau migration-wizard.js:550 (ohne await)
        expect(u.ls.has(KEY)).toBe(true); // der Import steht im Speicher
        await u.uhr.laufen(0);
        await laufend;
        await u.uhr.laufen(0);
        A.entladen('reload');

        expect(u.ls.has(KEY)).toBe(true);
        const C = await oeffneTab(u, 'C').starten();
        expect(namenIn(C.ctx.D)).toEqual(['Importiert']);
    });

    test('U14d: dasselbe mit await retireCampaignWrites() VOR dem Import (gleiches Realm) — Umsortieren hilft nicht', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: 5 * MB });
        u.saeenIdb(KEY, grosseAltKampagne());
        const A = await oeffneTab(u, 'A', { module: IMPORT_MODULE }).starten();
        A.ctx.__exp = exportObjekt(['Importiert']);

        // Im Realm des Tabs, damit die await-Reihenfolge dieselbe ist wie im Assistenten:
        // die Settle-Warter werden im finally von saveToIndexedDBFallback freigegeben, also
        // VOR dem Nachlauf des Aufrufers (open:7).
        const direkt = await vm.runInContext(
            `(async () => {
                D.quickNotes = 'x';
                const laufend = saveImmediate();
                await retireCampaignWrites();
                importFullExport(__exp);
                const da = localStorage.getItem('${KEY}') !== null;
                await laufend;
                return da;
            })()`,
            A.ctx
        );
        expect(direkt).toBe(true);
        await u.uhr.laufen(0);

        expect(u.ls.has(KEY)).toBe(true);
        const C = await oeffneTab(u, 'C').starten();
        expect(namenIn(C.ctx.D)).toEqual(['Importiert']);
    });

    test('U15: deleteCampaign() auf der aktiven benannten Kampagne mit ausstehendem Save — nach der Navigation kein Waisen-Schluessel', async () => {
        const u = erzeugeUrsprung();
        u.ls.set(
            INDEX_KEY,
            JSON.stringify({ campaigns: [{ key: NEBEN_KEY, name: 'Neben' }], active: NEBEN_KEY })
        );
        u.saeen(NEBEN_KEY, kampagne(['X']));
        const A = await oeffneTab(u, 'A', {
            aktiv: NEBEN_KEY,
            module: ['systems/campaign-manager/campaign-manager.js']
        }).starten();
        expect(namenIn(A.ctx.D)).toEqual(['X']);
        A.ctx.D.quickNotes = 'getippt';
        A.ctx.save();

        const fertig = A.ctx.deleteCampaign();
        await u.uhr.laufen(0);
        await fertig;
        await u.uhr.laufen(400);

        expect(A.geschlossen).toBe(true);
        expect(A.entladungen[0].defaultPrevented).toBe(false);
        expect(u.ls.has(NEBEN_KEY)).toBe(false);
        expect(u.ls.has(NEBEN_KEY + '_ts')).toBe(false);
        expect(u.ls.has(NEBEN_KEY + '_rev')).toBe(false);
        expect(JSON.parse(u.ls.get(INDEX_KEY)).campaigns).toEqual([]);
    });

    test('U15b: deleteCampaign() der Standard-Kampagne mit UEBERFAELLIGEM Debounce — der Schluessel entsteht nicht neu', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await oeffneTab(u, 'A', {
            module: ['systems/campaign-manager/campaign-manager.js']
        }).starten();
        A.ctx.D.quickNotes = 'getippt';
        A.ctx.save();
        u.uhr.blockieren(400); // Bestaetigungsdialog blockiert, der Timer ist faellig

        const fertig = A.ctx.deleteCampaign();
        await u.uhr.laufen(0);
        await fertig;
        await u.uhr.laufen(400);

        expect(A.geschlossen).toBe(true);
        expect(u.ls.has(KEY)).toBe(false);
        expect(u.ls.has(KEY + '_ts')).toBe(false);
        expect(u.ls.has(KEY + '_rev')).toBe(false);
        expect(u.idbDatensatz(KEY)).toBeUndefined();
    });
});

// ============================================================
// Randfaelle
// ============================================================

describe('R02 — Randfaelle', () => {
    // Die automatischen Schreiber des Starts in core/init.js-Reihenfolge: initRandomTables()
    // (ueber renderRandomTables) und das Markdown-Onboarding (initMarkdownSettings(), save()
    // 2 s nach dem Start)
    const START_SCHREIBER = ['features/random-tables.js', 'ui/editors/markdown-shortcuts.js'];
    const ONBOARDING_MS = 2000 + 300 + 200; // Onboarding-Timeout + Debounce + Reserve

    test('U16: load() scheitert an abgeschnittenem JSON — weder Entladen noch die automatischen Start-Saves (initRandomTables, Markdown-Onboarding) ueberschreiben den Rohtext', async () => {
        const u = erzeugeUrsprung();
        const kaputt =
            '{"_version":"2.6.1","characters":[{"id":1,"name":"Aria"}],"notes":"abgeschn';
        u.ls.set(KEY, kaputt);
        const A = await oeffneTab(u, 'A', { module: START_SCHREIBER }).starten();
        expect(A.ctx.D.randomTables).toBeUndefined();
        expect(A.ctx.D.settings.markdownOnboardingSeen).toBe(false); // initializeData()

        A.ctx.initRandomTables();
        A.ctx.initMarkdownSettings();
        await u.uhr.laufen(ONBOARDING_MS);
        A.entladen('schliessen');

        // Nicht-Vakuitaet: beide automatischen Schreiber liefen
        expect(A.ctx.D.randomTables.length).toBeGreaterThan(0);
        expect(A.ctx.D.settings.markdownOnboardingSeen).toBe(true);
        expect(A.toasts.some(t => /Markdown Shortcuts/.test(t.text))).toBe(true);
        expect(u.ls.get(KEY)).toBe(kaputt);
        expect(u.schreibvorgaenge({ tab: 'A', praefix: KEY })).toEqual([]);
    });

    test('U16b (Kontrolle): gesunder Start — das Markdown-Onboarding speichert sein Flag weiterhin', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria'], { settings: { markdownOnboardingSeen: false } }));
        const A = await oeffneTab(u, 'A', { module: START_SCHREIBER }).starten();

        A.ctx.initMarkdownSettings();
        await u.uhr.laufen(ONBOARDING_MS);

        const gespeichert = JSON.parse(u.ls.get(KEY));
        expect(gespeichert.settings.markdownOnboardingSeen).toBe(true);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria']);
    });

    // Korrekturrunde zum Code-Review 2026-09-21 (F2, U7 minor:5 / R02-Restbefund R3):
    // ohne Baseline kehrte persistOnUnload zurueck, BEVOR `explicit` berechnet war —
    // der ausdrueckliche Save eines Tabs mit gescheitertem load() verfiel still.
    test('U16c: load() gescheitert, ausdruecklicher Save ausstehend — Rueckfrage angefordert, Rohtext unberuehrt', async () => {
        const u = erzeugeUrsprung();
        const kaputt = '{"_version":"2.6.1","characters":[{"id":1,"na';
        u.ls.set(KEY, kaputt);
        const A = await oeffneTab(u, 'A').starten();
        A.ctx.D.characters.push({ id: 1, name: 'Neu angelegt' });
        A.ctx.save(); // ausdruecklich (CRUD)

        const ev = A.entladen('schliessen innerhalb des Debounce');

        expect(ev.defaultPrevented).toBe(true);
        expect(u.ls.get(KEY)).toBe(kaputt);
        expect(u.schreibvorgaenge({ tab: 'A', praefix: KEY })).toEqual([]);
    });

    // Korrekturrunde zum Code-Review 2026-09-21 (F2, holistisch user-flows):
    // saveAutomatic() prueft die Veraltung nur beim Aufruf. Wurde der Tab waehrend
    // der 300 ms Entprellung veraltet, schrieb der Timer-Koerper trotzdem (D4), und
    // persistOnUnload zaehlte den Timer als ausdruecklich (D5).
    test('U23: ein waehrend der Entprellung veralteter automatischer Save schreibt nicht mehr', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const { A, B } = await zweiTabs(u);
        B.ctx.D.characters.push({ id: 2, name: 'B-Arbeit' });
        B.ctx.save(); // ausdruecklich, faellig bei t=300
        await u.uhr.laufen(100);

        // t=100: A ist noch frisch — der Session-Timer-Autosave wird angenommen
        A.ctx.D.lastSessionDuration = 300;
        expect(A.ctx.saveAutomatic()).toBe(true);
        await u.uhr.laufen(250); // t=350: B hat geschrieben, A hat das Ereignis gesehen
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'B-Arbeit']);
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true); // Nicht-Vakuitaet
        await u.uhr.laufen(100); // t=450: As Timer (faellig t=400) ist gelaufen

        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'B-Arbeit']);
        expect(u.schreibvorgaenge({ tab: 'A', praefix: KEY })).toEqual([]);
        const ev = B.entladen('schliessen');
        expect(ev.defaultPrevented).toBe(false);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'B-Arbeit']);
    });

    test('U24: veralteter Tab mit ausschliesslich automatischem Save — keine Rueckfrage, kein Schreiben (D5)', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const { A, B } = await zweiTabs(u);
        B.ctx.D.characters.push({ id: 2, name: 'B-Arbeit' });
        B.ctx.save();
        await u.uhr.laufen(100);
        A.ctx.D.lastSessionDuration = 300; // Session-Timer-Tick, A noch frisch
        expect(A.ctx.saveAutomatic()).toBe(true);
        await u.uhr.laufen(250); // B hat bei t=300 geschrieben, A ist veraltet
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);

        const ev = A.entladen('schliessen');

        expect(ev.defaultPrevented).toBe(false);
        expect(u.schreibvorgaenge({ tab: 'A', praefix: KEY })).toEqual([]);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'B-Arbeit']);
    });

    test('U17: das Schliessen des veralteten Tabs A zeigt in B keinen Konflikt, Bs "Neu laden" behaelt Borin', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const { A, B } = await zweiTabs(u);
        await bSpeichertBorin(u, B);
        expect(A.bannerSichtbar()).toBe(true); // A hat Bs Save gesehen

        A.entladen('schliessen');
        await u.uhr.laufen(0);

        expect(B.bannerSichtbar()).toBe(false);
        B.ctx.reloadData();
        await u.uhr.laufen(0);
        expect(namenIn(B.ctx.D)).toEqual(['Aria', 'Borin']);
    });

    test('U18 (Kontrolle): kampagnenuebergreifend — Bs Save auf Kampagne Y macht A auf X nicht veraltet; As Aenderung wird ohne Rueckfrage geschrieben', async () => {
        const u = erzeugeUrsprung();
        u.ls.set(
            INDEX_KEY,
            JSON.stringify({ campaigns: [{ key: NEBEN_KEY, name: 'Y' }], active: KEY })
        );
        u.saeen(KEY, kampagne(['Aria']));
        u.saeen(NEBEN_KEY, kampagne(['Yvo']));
        const { A, B } = await zweiTabs(u, { B: { aktiv: NEBEN_KEY } });
        expect(namenIn(B.ctx.D)).toEqual(['Yvo']);
        A.ctx.D.characters[0].name = 'Aria (A)';
        A.ctx.save();
        B.ctx.D.characters.push({ id: 2, name: 'Yara' });
        await B.ctx.saveImmediate();
        await u.uhr.laufen(0);
        // Broadcast und storage-Ereignisse der anderen Kampagne: weder Banner noch Veraltung
        expect(A.bannerSichtbar()).toBe(false);
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);

        const ev = A.entladen('schliessen');

        expect(ev.defaultPrevented).toBe(false);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria (A)']);
        expect(namen(u.ls.get(NEBEN_KEY))).toEqual(['Yvo', 'Yara']);
    });

    test('U19: Altbestand ohne _rev plus ein Alt-Version-Schreiber ohne _rev — die Inhaltspruefung erkennt den Tab als veraltet', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria'])); // kein _rev
        const A = await oeffneTab(u, 'A').starten();
        u.fremdSchreiben(KEY, kampagne(['Aria', 'Alt-Version']));
        A.ctx.D.characters[0].name = 'Aria (A)';
        A.ctx.save();

        A.entladen('schliessen');

        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Alt-Version']);
        expect(typeof A.ctx.isCampaignStorageStale).toBe('function');
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);
    });

    test('U20: "Bleiben" nach der Rueckfrage — der ausstehende Save laeuft danach trotzdem (Timer nicht verworfen)', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const { A, B } = await zweiTabs(u);
        await bSpeichertBorin(u, B);
        A.ctx.D.characters[0].name = 'Aria (A, bleibt)';
        A.ctx.save();

        const ev = A.entladen('schliessen', { bleiben: true });
        expect(ev.defaultPrevented).toBe(true);
        expect(A.geschlossen).toBe(false);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Borin']);

        await u.uhr.laufen(350);
        // Ausdruecklicher Save im veralteten Tab: last-writer-wins (D4 = A)
        expect(namen(u.ls.get(KEY))).toEqual(['Aria (A, bleibt)']);
    });

    function mitSessionTimer(u, name) {
        return oeffneTab(u, name, { module: ['systems/session-timer.js'] });
    }

    test('U21: Session-Timer-Autosave in einem veralteten Tab schreibt nichts', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await mitSessionTimer(u, 'A').starten();
        const B = await oeffneTab(u, 'B').starten();
        await bSpeichertBorin(u, B);
        A.ctx.SESSION_AUTO_SAVE_INTERVAL = 1; // statt 300 s

        A.ctx.toggleSessionTimer();
        await u.uhr.laufen(1000 + 400);
        A.ctx.toggleSessionTimer();

        expect(A.ctx.D.lastSessionDuration).toBe(1); // Autosave-Zweig lief
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Borin']);
        expect(u.schreibvorgaenge({ tab: 'A', praefix: KEY })).toEqual([]);
    });

    test('U21b (Kontrolle): im nicht veralteten Tab schreibt der Session-Timer-Autosave weiter', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await mitSessionTimer(u, 'A').starten();
        A.ctx.SESSION_AUTO_SAVE_INTERVAL = 1;

        A.ctx.toggleSessionTimer();
        await u.uhr.laufen(1000 + 400);
        A.ctx.toggleSessionTimer();

        expect(JSON.parse(u.ls.get(KEY)).lastSessionDuration).toBe(1);
    });
});

// ============================================================
// Waechter der Korrekturrunde (F2): Zusicherungen, die U7 hinterlassen, aber nicht
// gebunden hat. Alle vor und nach dem Fix gruen; die Mutationen, die sie toeten,
// stehen im docs/bugfixes.md-Eintrag "R02/R04 Nachtrag".
// ============================================================

describe('R02 — Waechter der Korrekturrunde (F2)', () => {
    const LS_QUOTA = 5 * MB;

    function mitImportExport(u, name) {
        const A = oeffneTab(u, name, {
            module: ['systems/spellslots/import-export.js'],
            stubs: { reportSafetyBackup: async s => s }
        });
        A.ctx.createAutoBackup = async () => 'written';
        return A;
    }

    test('U25: frischer Ursprung, geaenderter Tab, "Alle Daten loeschen" — der Schluessel entsteht nicht neu', async () => {
        const u = erzeugeUrsprung();
        const A = mitImportExport(u, 'A');
        await A.starten();
        A.ctx.D.characters.push({ id: 1, name: 'Nie gespeichert' }); // geaendert, ohne save()

        const fertig = A.ctx.clearStorage();
        await u.uhr.laufen(1100);
        await fertig;

        expect(A.geschlossen).toBe(true);
        expect(u.ls.has(KEY)).toBe(false);
    });

    test('U26a: der letzte Save ist gescheitert (IndexedDB-Modus) — das Schliessen fragt nach (D5)', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const A = await oeffneTab(u, 'A').starten();
        u.idb.policy.commitFehler = () => new Error('commit failed');
        A.ctx.D.characters[0].name = 'Umbenannt';
        A.ctx.save();
        await u.uhr.laufen(350);
        for (let i = 0; i < 5; i++) await u.uhr.laufen(0);
        expect(A.toasts.some(t => /Speichern fehlgeschlagen/.test(t.text))).toBe(true);

        const ev = A.entladen('schliessen nach gescheitertem Save');

        expect(ev.defaultPrevented).toBe(true);
    });

    test('U26b: ein laufender IndexedDB-Write beim Schliessen — Rueckfrage angefordert (D5)', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const A = await oeffneTab(u, 'A').starten();
        A.ctx.D.characters[0].name = 'Umbenannt';
        A.ctx.saveImmediate(); // put abgesetzt, noch nicht committet

        const ev = A.entladen('schliessen waehrend des Commits');

        expect(ev.defaultPrevented).toBe(true);
    });

    test('U26c: switchCampaign() im IndexedDB-Modus — der Datensatz ist VOR dem beforeunload committet', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        u.ls.set(
            INDEX_KEY,
            JSON.stringify({ campaigns: [{ key: NEBEN_KEY, name: 'Neben' }], active: KEY })
        );
        const A = await oeffneTab(u, 'A', {
            module: ['systems/campaign-manager/campaign-manager.js']
        }).starten();
        let beimEntladenName = null;
        A.ctx.addEventListener('beforeunload', () => {
            const rec = u.idbDatensatz(KEY);
            beimEntladenName = rec ? JSON.parse(rec.data).characters[0].name : null;
        });
        A.ctx.D.characters[0].name = 'Vor dem Wechsel';
        A.ctx.save();

        const fertig = A.ctx.switchCampaign(NEBEN_KEY);
        await u.uhr.laufen(0);
        await fertig;

        expect(beimEntladenName).toBe('Vor dem Wechsel');
        expect(A.geschlossen).toBe(true);
    });

    test('U26d: deleteCampaign() bricht ab (Index-Write scheitert) — der Tab bleibt nicht gesperrt', async () => {
        const u = erzeugeUrsprung();
        u.ls.set(
            INDEX_KEY,
            JSON.stringify({ campaigns: [{ key: NEBEN_KEY, name: 'Neben' }], active: NEBEN_KEY })
        );
        u.saeen(NEBEN_KEY, kampagne(['X']));
        const A = await oeffneTab(u, 'A', {
            aktiv: NEBEN_KEY,
            module: ['systems/campaign-manager/campaign-manager.js']
        }).starten();
        A.ctx.D.quickNotes = 'getippt';
        A.ctx.save();
        A.ctx.saveCampaignIndex = () => ({ success: false, error: 'quota' });

        await A.ctx.deleteCampaign();
        await u.uhr.laufen(400);
        expect(JSON.parse(u.ls.get(NEBEN_KEY)).quickNotes).toBe('getippt');

        A.ctx.D.quickNotes = 'spaeter';
        A.ctx.save();
        await u.uhr.laufen(400);
        expect(JSON.parse(u.ls.get(NEBEN_KEY)).quickNotes).toBe('spaeter');
    });

    test('U26e: clearStorage() bricht ab (IndexedDB-Delete scheitert) — der Tab bleibt nicht gesperrt', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = mitImportExport(u, 'A');
        await A.starten();
        A.ctx.D.quickNotes = 'getippt';
        A.ctx.save();
        u.idb.policy.requestFehler = op => (op === 'delete' ? new Error('delete failed') : null);

        const fertig = A.ctx.clearStorage();
        await u.uhr.laufen(0);
        await fertig;
        u.idb.policy.requestFehler = () => null;
        await u.uhr.laufen(400);

        expect(A.geschlossen).toBe(false);
        expect(A.toasts.map(t => t.text)).toContain('❌ Fehler beim Löschen');
        expect(JSON.parse(u.ls.get(KEY)).quickNotes).toBe('getippt');

        A.ctx.D.quickNotes = 'spaeter';
        A.ctx.save();
        await u.uhr.laufen(400);
        expect(JSON.parse(u.ls.get(KEY)).quickNotes).toBe('spaeter');
    });

    test('U26f: der Reparatur-Save nach load() schreibt nichts, wenn der Tab binnen 1 s veraltet', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await oeffneTab(u, 'A', {
            stubs: {
                validateDataIntegrity: () => ({ valid: false, repairs: ['nextId korrigiert'] })
            }
        }).starten();
        const B = await oeffneTab(u, 'B').starten();
        B.ctx.D.characters.push({ id: 2, name: 'Borin' });
        await B.ctx.saveImmediate();
        await u.uhr.laufen(0);

        await u.uhr.laufen(1000 + 400); // As Reparatur-Timer (1 s) plus Entprellung

        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Borin']);
        expect(u.schreibvorgaenge({ tab: 'A', praefix: KEY }).filter(e => e.key === KEY)).toEqual(
            []
        );
    });

    test('U27a: IndexedDB-Modus ohne BroadcastChannel — Bs entprellter save() macht A veraltet', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: LS_QUOTA });
        u.saeenIdb(KEY, grosseKampagne());
        const ohneKanal = { stubs: { BroadcastChannel: undefined } };
        const { A, B } = await zweiTabs(u, { A: ohneKanal, B: ohneKanal });
        B.ctx.D.characters[1].name = 'Neu aus B';
        B.ctx.save();
        await u.uhr.laufen(350);
        await u.uhr.laufen(0);
        expect(JSON.parse(u.idbDatensatz(KEY).data).characters[1].name).toBe('Neu aus B');

        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);
        A.ctx.D.characters[0].name = 'A (veraltet)';
        A.ctx.save();
        const ev = A.entladen('schliessen');
        await u.uhr.laufen(0);

        expect(JSON.parse(u.idbDatensatz(KEY).data).characters[1].name).toBe('Neu aus B');
        expect(ev.defaultPrevented).toBe(true);
    });

    // Bs localStorage-Write scheitert an der Quota — der IndexedDB-Rueckfall committet.
    // Sein _rev ist das einzige Signal, das A veralten laesst.
    function bScheitertAmSchluessel(B) {
        const orig = B.ctx.localStorage.setItem;
        B.ctx.localStorage.setItem = (k, v) => {
            if (k === KEY) throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
            return orig(k, v);
        };
    }

    test('U27b: localStorage-Quota-Rueckfall des entprellten save() setzt _rev — A wird veraltet', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const ohneKanal = { stubs: { BroadcastChannel: undefined } };
        const { A, B } = await zweiTabs(u, { A: ohneKanal, B: ohneKanal });
        const revVorher = u.ls.get(KEY + '_rev');
        bScheitertAmSchluessel(B);
        B.ctx.D.characters.push({ id: 2, name: 'Borin' });

        B.ctx.save();
        await u.uhr.laufen(350);
        await u.uhr.laufen(0);

        expect(namen(u.idbDatensatz(KEY).data)).toEqual(['Aria', 'Borin']);
        expect(u.ls.get(KEY + '_rev')).not.toBe(revVorher);
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);
    });

    test('U27c: localStorage-Quota-Rueckfall von saveImmediate() setzt _rev — A wird veraltet', async () => {
        // Quota: Startwert, _ts und _rev passen, ein deutlich groesseres D nicht
        const u = erzeugeUrsprung({ lsQuotaZeichen: 2000 });
        u.saeen(KEY, kampagne(['Aria']));
        const ohneKanal = { stubs: { BroadcastChannel: undefined } };
        const { A, B } = await zweiTabs(u, { A: ohneKanal, B: ohneKanal });
        const revVorher = u.ls.get(KEY + '_rev');
        B.ctx.D.characters.push({ id: 2, name: 'Borin', notes: 'x'.repeat(3000) });

        const r = await B.ctx.saveImmediate();
        await u.uhr.laufen(0);

        expect(r).toMatchObject({ success: true, backend: 'indexedDB' });
        expect(namen(u.idbDatensatz(KEY).data)).toEqual(['Aria', 'Borin']);
        expect(u.ls.get(KEY + '_rev')).not.toBe(revVorher);
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);
    });

    test('U28: ein unter der Sperre committeter IDB-Save holt Aufraeumen und Baseline beim Aufheben nach', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']), { ts: '1000' });
        const A = await oeffneTab(u, 'A').starten();
        expect(u.ls.has(KEY + '_ts')).toBe(true); // Nicht-Vakuitaet: LS-Kopie mit _ts
        A.ctx.D.characters[0].notes = 'A'.repeat(6 * MB); // ueber 5 MB: IndexedDB-Modus

        const laufend = A.ctx.saveImmediate();
        A.ctx.retireCampaignWrites();
        await u.uhr.laufen(0);
        await laufend;
        await u.uhr.laufen(0);

        A.ctx.resumeCampaignWrites();
        await u.uhr.laufen(400);

        expect(u.ls.has(KEY)).toBe(false);
        expect(u.ls.has(KEY + '_ts')).toBe(false);
        const C = await oeffneTab(u, 'C').starten();
        expect(namenIn(C.ctx.D)).toEqual(['Aria']);
        expect(C.ctx.D.characters[0].notes).toHaveLength(6 * MB);
    });
});

// ============================================================
// Vertraege (vor und nach dem Fix gruen)
// ============================================================

describe('Vertraege der Persistenz (vor und nach U7 gruen)', () => {
    test('K1: der entprellte save() schreibt erst nach 300 ms und setzt _ts', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']), { ts: '1000' });
        const A = await oeffneTab(u, 'A').starten();
        A.ctx.D.characters.push({ id: 2, name: 'Neu' });
        A.ctx.save();

        await u.uhr.laufen(299);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria']);
        await u.uhr.laufen(2);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Neu']);
        expect(u.ls.get(KEY + '_ts')).not.toBe('1000');
    });

    test('K2: save() gefolgt von saveImmediate() ergibt genau zwei Hook-Aufrufe (stability.test.js R15)', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await oeffneTab(u, 'A').starten();
        let aufrufe = 0;
        A.ctx.registerPostSaveHook(() => aufrufe++);

        A.ctx.save();
        await A.ctx.saveImmediate();
        expect(aufrufe).toBe(1);
        await u.uhr.laufen(400);
        expect(aufrufe).toBe(2);
    });

    test('K3: scheitert jedes setItem, landet saveImmediate() in IndexedDB — mit genau EINEM "Speicher voll"-Toast', async () => {
        const u = erzeugeUrsprung({ lsQuotaZeichen: 0 });
        const A = await oeffneTab(u, 'A').starten();
        A.ctx.D.characters.push({ id: 1, name: 'Q' });

        const r = await A.ctx.saveImmediate();

        expect(r).toMatchObject({ success: true, backend: 'indexedDB' });
        expect(namen(u.idbDatensatz(KEY).data)).toEqual(['Q']);
        expect(speicherVoll(A)).toHaveLength(1);
    });
});

// ============================================================
// Schluesselaufloesung und Quelltext-Waechter
// ============================================================

describe('Schluesselaufloesung (getActiveCampaignKey) und Quelltext-Waechter', () => {
    test('S1: Loader-Modus (Quellen ungebuendelt, ohne window.STORAGE_KEY) — load() und save() nutzen dnd-tracker-v4, nie "undefined"', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await oeffneTab(u, 'A', { buendelTreu: false }).starten();

        expect(namenIn(A.ctx.D)).toEqual(['Aria']);
        A.ctx.D.characters.push({ id: 2, name: 'Neu' });
        await A.ctx.saveImmediate();
        expect(namen(u.ls.get(KEY))).toEqual(['Aria', 'Neu']);
        expect(u.ls.has('undefined')).toBe(false);
        expect(u.ls.has('undefined_ts')).toBe(false);
    });

    test('S2: kein Modul des Quellbaums liest window.STORAGE_KEY (einziger Resolver: getActiveCampaignKey)', () => {
        const treffer = [];
        function gehe(abs, rel) {
            for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
                const kindAbs = path.join(abs, e.name);
                const kindRel = rel + '/' + e.name;
                if (e.isDirectory()) gehe(kindAbs, kindRel);
                else if (e.name.endsWith('.js')) {
                    fs.readFileSync(kindAbs, 'utf8')
                        .split(/\r?\n/)
                        .forEach((zeile, i) => {
                            if (/window\.STORAGE_KEY\b/.test(zeile))
                                treffer.push(`${kindRel}:${i + 1}`);
                        });
                }
            }
        }
        ['core', 'systems', 'features', 'ui', 'utils', 'render'].forEach(o =>
            gehe(path.join(WURZEL, o), o)
        );
        expect(treffer).toEqual([]);
    });

    test('S3: systems/avatars.js registriert keinen beforeunload-Handler mehr', () => {
        const src = fs.readFileSync(path.join(WURZEL, 'systems/avatars.js'), 'utf8');
        expect(src).not.toMatch(/beforeunload/);
    });

    test('S4 (Werkbank-Selbsttest): die Buendel-Dedup-Nachbildung entfernt genau die build.py-Zeilen', () => {
        const [a, b] = buendelDedup([
            'const STORAGE_KEY = window.APP_CONFIG.STORAGE_KEY;\nconst D0 = window.D0;',
            'function f() {\n    const STORAGE_KEY = window.STORAGE_KEY;\n    const D0 = window.D0;\n    const Frei = window.Frei;\n}'
        ]);
        expect(a).toBe('const STORAGE_KEY = window.APP_CONFIG.STORAGE_KEY;\nconst D0 = window.D0;');
        expect(b).toBe(
            'function f() {\n// [DEDUP] STORAGE_KEY\n// [DEDUP] D0\n    const Frei = window.Frei;\n}'
        );
    });
});
