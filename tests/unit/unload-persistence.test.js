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
 *  - automatische Saves (Session-Timer, Reparatur nach load(), initRandomTables) schreiben in
 *    einem veralteten Tab nie (D4 = A); ausdrueckliche Saves bleiben last-writer-wins
 *  - retireCampaignWrites(): harte Schreibsperre VOR dem Entfernen/Umziehen
 *
 * Werkbank: tests/unit/helpers/multi-tab-harness.js (ein vm-Kontext je Tab, geteilter
 * Ursprung, virtuelle Uhr). Die Tabs booten in core/init.js-Reihenfolge; window.STORAGE_KEY
 * wird nicht gesetzt.
 */

const fs = require('fs');
const path = require('path');
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
        const ev = A.entladen('reload');

        expect(sofort).toEqual({ success: false, error: 'retired' });
        expect(automatisch).toBe(false);
        expect(ev.defaultPrevented).toBe(false);
        expect(u.log.slice(vorher)).toEqual([]);
        expect(namen(u.ls.get(KEY))).toEqual(['Aria']);
    });

    function exportDatei(namenListe) {
        const exp = {
            _exportType: 'full-v1',
            campaigns: { [KEY]: { meta: { key: KEY }, data: kampagne(namenListe) } },
            campaignIndex: { campaigns: [], active: KEY }
        };
        return { name: 'umzug.json', size: 200, inhalt: JSON.stringify(exp) };
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
