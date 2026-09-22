/**
 * Code-Review 2026-09-21, Einheit U8 — R06: Das Konflikt-Nachladen ("🔄 Neu laden" im
 * Konflikt-Banner) rendert und bestaetigt erst, wenn das Laden abgeschlossen ist.
 *
 * Vorher rief reloadData() (systems/undo.js) das asynchrone load() (quick-roll.js) OHNE
 * await auf: im IndexedDB-Modus und im Stale-Shadow-Modus (localStorage ohne _ts) malte der
 * naechste Frame noch den ALTEN Stand, Banner und Erfolgsmeldung kamen vor dem Lesen, danach
 * renderte nichts mehr. load() schluckte jeden Fehler und loeste undefined auf — Fehlschlaege
 * meldete reloadData als Erfolg. dismissConflict() schaltete jeden spaeteren Konflikt der
 * Sitzung stumm; ein vor dem Klick gestellter save() schrieb im Ladefenster den verdraengten
 * Stand ueber die Daten des anderen Tabs; Strg+Z stellte die alte Linie unter falschem Namen
 * wieder her; ein Doppelklick lud zweimal.
 *
 * Soll:
 *  - load(options) liefert ein LoadResult {ok, applied, source, reason?, degraded?, warning?,
 *    error?}; strictIdb (Neuladen) wertet einen gescheiterten IDB-Lesevorgang als Fehlschlag
 *  - reloadData() wartet (gemeinsames Promise bei Doppelklick, lehnt nie ab), stellt entprellte
 *    Saves im Ladefenster zurueck (Waechter 10 s), rendert vollstaendig neu
 *    (renderAfterDataReplace), meldet ehrlich und laesst weitere Konflikte zu
 *  - Undo nach dem Neuladen: Schritt "Neu laden (anderer Tab)" (D6 = A)
 *
 * Werkbank: tests/unit/helpers/multi-tab-harness.js (echte Quellen in loader.js-Reihenfolge,
 * virtuelle Uhr, geteilter Speicher) plus features/render-dashboard.js (echtes renderAll mit
 * requestAnimationFrame-Warteschlange). Lese-Requests des IndexedDB-Doubles lassen sich
 * zurueckhalten (Schnappschuss bei der Erstellung) oder scheitern lassen.
 */

const { erzeugeUrsprung, oeffneTab, STANDARD_KEY: KEY } = require('./helpers/multi-tab-harness.js');

jest.setTimeout(30000);

const NEBEN_KEY = 'dnd-campaign-222';
const MB = 1024 * 1024;
const WAECHTER_MS = 10000;

const OK_TOAST = '🔄 Daten neu geladen';
const WARN_TOAST = '⚠️ Daten neu geladen (Nachbearbeitung unvollständig)';
const FEHLER_TOAST = '❌ Neu laden fehlgeschlagen – aktueller Stand bleibt erhalten';
const ZEIT_TOAST =
    '❌ Neu laden fehlgeschlagen – Zeitüberschreitung, aktueller Stand bleibt erhalten';
const IDB_WARN_TOAST = '⚠️ Kampagne konnte nicht aus IndexedDB gelesen werden';

// Renderer, die das echte renderAll() aufruft — hier stumm (renderParty wird beobachtet)
const STUMME_RENDERER = [
    'renderNPCList',
    'renderLocations',
    'renderQuests',
    'renderEncounters',
    'renderInit',
    'renderLoot',
    'renderShops',
    'renderSpells',
    'renderSessions',
    'renderLinks',
    'renderWiki',
    'renderFilterList',
    'initQuickRefCustom',
    'renderRandomTables',
    'renderTimers',
    'updateIOCounts'
];

function kampagne(namenListe, extra = {}) {
    return Object.assign(
        { _version: '2.6.1', characters: namenListe.map((n, i) => ({ id: i + 1, name: n })) },
        extra
    );
}

// > 5 MB UTF-8: der echte save() nimmt den IndexedDB-Pfad
function grosseKampagne(erster) {
    const k = kampagne([erster, 'Zwei', 'Drei', 'Vier', 'Fuenf', 'Sechs']);
    k.characters.forEach(c => {
        c.notes = 'A'.repeat(MB);
    });
    return k;
}

function namenIn(D) {
    return (D.characters || []).map(c => c.name);
}

function namen(roh) {
    if (roh === null || roh === undefined) return null;
    return (JSON.parse(roh).characters || []).map(c => c.name);
}

/** Tab mit echtem renderAll (rAF-Warteschlange) und beobachtbaren Render-Stellen. */
function oeffne(u, name, opt = {}) {
    const frames = [];
    const tab = oeffneTab(u, name, {
        module: ['features/render-dashboard.js'].concat(opt.module || []),
        aktiv: opt.aktiv,
        stubs: Object.assign(
            {
                requestAnimationFrame: fn => {
                    frames.push(fn);
                    return frames.length;
                }
            },
            opt.stubs || {}
        )
    });
    const ctx = tab.ctx;
    tab.renders = [];
    tab.tabRenders = [];
    tab.nachlauf = [];
    STUMME_RENDERER.forEach(n => {
        ctx[n] = () => {};
    });
    ctx.renderParty = () => tab.renders.push(namenIn(ctx.D));
    ctx.renderTabContent = ansicht => tab.tabRenders.push(`${ansicht}:${namenIn(ctx.D).join(',')}`);
    // Beim Start gesetzte D-Abkoemmlinge (Theme, Layout) — werden nach dem Ersetzen neu angewandt
    ctx.loadTheme = () => tab.nachlauf.push('theme:' + ((ctx.D.settings || {}).theme || '-'));
    ctx.loadLayout = () => tab.nachlauf.push('layout');
    ctx.document.querySelector = sel => (sel === '.view.active' ? { id: 'view-dashboard' } : null);
    /** Naechster Animations-Frame: alle vorgemerkten rAF-Rueckrufe laufen. */
    tab.frame = () => {
        const q = frames.splice(0);
        q.forEach(fn => fn(0));
        return q.length;
    };
    tab.toastTexte = () => tab.toasts.map(t => t.text);
    tab.anzahlToast = text => tab.toasts.filter(t => t.text === text).length;
    return tab;
}

/** Tab booten und die Boot-Spuren (Toasts, Frames, Renders) verwerfen. */
async function starte(tab) {
    await tab.starten();
    tab.frame();
    tab.renders.length = 0;
    tab.tabRenders.length = 0;
    tab.nachlauf.length = 0;
    tab.toasts.length = 0;
    return tab;
}

/** Lese-Requests auf den Kampagnen-Store zurueckhalten, bis der Test sie freigibt. */
function halteLesen(u) {
    const offen = [];
    u.idb.policy.halten = (op, store) => {
        if (op !== 'get' || store !== 'campaigns') return null;
        let loesen;
        const p = new Promise(r => {
            loesen = r;
        });
        offen.push(loesen);
        return p;
    };
    return {
        get anzahl() {
            return offen.length;
        },
        /** Freigeben; mit einem Error scheitern die gehaltenen Requests damit. */
        freigeben(ergebnis) {
            u.idb.policy.halten = () => null;
            offen.splice(0).forEach(fn => fn(ergebnis));
        }
    };
}

function lesenScheitert(u) {
    u.idb.policy.requestFehler = (op, store) =>
        op === 'get' && store === 'campaigns' ? new Error('IDB-Lesefehler (Test)') : null;
}

/** Ein fremder Tab derselben Herkunft, der nur sendet (BroadcastChannel). */
function fremderKanal(u, tab) {
    const Kanal = u.kanalKlasseFuer({ name: 'fremd', geschlossen: false });
    return new Kanal(tab.ctx.APP_CONFIG.BROADCAST_CHANNEL);
}

async function fremderSave(u, kanal, campaign = KEY) {
    kanal.postMessage({ type: 'save', tabId: 'fremder-tab', campaign, timestamp: 1 });
    await u.uhr.laufen(0);
}

async function ergebnisVon(u, promise) {
    const r = await promise;
    await u.uhr.ruhe();
    return r;
}

/** Tab A im IndexedDB-Modus (localStorage leer), Stand "Alt". */
async function tabImIdbModus(u, daten = kampagne(['Alt'])) {
    u.saeenIdb(KEY, daten);
    return starte(oeffne(u, 'A'));
}

describe('R06 — Neuladen wartet auf das Laden (IndexedDB-Pfade)', () => {
    test('T1: IndexedDB-Modus, Lesen haelt an — kein Frame, keine Bestaetigung, Banner bleibt; danach der neue Stand vollstaendig', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u);
        u.saeenIdb(KEY, kampagne(['Neu'], { quickNotes: 'B-Notiz' }));
        A.ctx.showConflictBanner();
        const halt = halteLesen(u);

        const p = A.ctx.reloadData();
        await u.uhr.ruhe();
        A.frame();

        expect(A.renders).toEqual([]); // kein Frame mit dem alten Stand
        expect(A.toastTexte()).not.toContain(OK_TOAST);
        expect(A.bannerSichtbar()).toBe(true);
        expect(typeof (p && p.then)).toBe('function');
        expect(halt.anzahl).toBe(1);

        halt.freigeben();
        const r = await ergebnisVon(u, p);

        expect(r).toMatchObject({ ok: true, applied: true, source: 'indexedDB' });
        A.frame();
        expect(A.renders).toEqual([['Neu']]);
        expect(A.tabRenders).toEqual(['dashboard:Neu']);
        expect(A.element('quick-notes').value).toBe('B-Notiz');
        expect(A.anzahlToast(OK_TOAST)).toBe(1);
        expect(A.bannerSichtbar()).toBe(false);
    });

    test('T2: Stale-Shadow (localStorage ohne _ts, neuere IndexedDB) — kein Frame vor dem Rohlesen, danach der IndexedDB-Stand', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Alt']));
        const A = await starte(oeffne(u, 'A'));
        // Anderer Tab: localStorage voll -> IndexedDB-Rueckfall, alter Wert ohne _ts bleibt
        u.ls.set(KEY, JSON.stringify(kampagne(['Schatten'])));
        u.ls.delete(KEY + '_ts');
        u.saeenIdb(KEY, kampagne(['Neu']));
        const halt = halteLesen(u);

        const p = A.ctx.reloadData();
        await u.uhr.ruhe();
        A.frame();
        expect(A.renders).toEqual([]);

        halt.freigeben();
        const r = await ergebnisVon(u, p);
        A.frame();
        expect(A.renders).toEqual([['Neu']]);
        expect(r).toMatchObject({ ok: true, applied: true, source: 'indexedDB' });
    });
});

describe('R06 — Ladeergebnis und ehrliche Meldung', () => {
    test('T3a: IndexedDB-Lesefehler im IndexedDB-Modus — {ok:false}, Fehlermeldung, Banner bleibt, D unveraendert, kein Render', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u);
        A.ctx.showConflictBanner();
        lesenScheitert(u);

        const r = await ergebnisVon(u, A.ctx.reloadData());
        A.frame();

        expect(A.toastTexte()).not.toContain(OK_TOAST);
        expect(A.bannerSichtbar()).toBe(true);
        expect(A.renders).toEqual([]);
        expect(namenIn(A.ctx.D)).toEqual(['Alt']);
        expect(r).toMatchObject({ ok: false, applied: false, reason: 'idb-error' });
        expect(A.toastTexte()).toContain(FEHLER_TOAST);
        expect(A.toastTexte()).toContain(IDB_WARN_TOAST);
    });

    test('T3b: beschaedigtes JSON (mit _ts) — reason "parse", keine Bestaetigung', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Alt']));
        const A = await starte(oeffne(u, 'A'));
        u.saeen(KEY, '{kaputt', { ts: '2000' });
        A.ctx.showConflictBanner();

        const r = await ergebnisVon(u, A.ctx.reloadData());

        expect(A.toastTexte()).not.toContain(OK_TOAST);
        expect(A.bannerSichtbar()).toBe(true);
        expect(r).toMatchObject({ ok: false, applied: false, reason: 'parse' });
        expect(A.toastTexte()).toContain(FEHLER_TOAST);
        expect(namenIn(A.ctx.D)).toEqual(['Alt']);
    });

    test('T3c: nichts gespeichert — reason "not-found", keine Bestaetigung, der Tab bleibt veraltet', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Alt']));
        const A = await starte(oeffne(u, 'A'));
        // Ein anderer Tab hat die Kampagne entfernt (storage-Ereignisse an A)
        u.ls.delete(KEY);
        u.ls.delete(KEY + '_ts');
        A.feuere('window', 'storage', { key: KEY, oldValue: 'x', newValue: null });
        expect(A.bannerSichtbar()).toBe(true);

        const r = await ergebnisVon(u, A.ctx.reloadData());

        expect(A.toastTexte()).not.toContain(OK_TOAST);
        expect(A.bannerSichtbar()).toBe(true);
        expect(r).toMatchObject({ ok: false, applied: false, source: null, reason: 'not-found' });
        expect(namenIn(A.ctx.D)).toEqual(['Alt']);
        // Keine frische Baseline: automatische Saves schreiben den verdraengten Stand nicht
        // in den entfernten Schluessel zurueck (R02, D4 = A)
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);
        expect(A.ctx.saveAutomatic()).toBe(false);
    });

    test('T3d: localStorage-Pfad — load() liefert genau {ok:true, applied:true, source:"localStorage"}', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Alt']));
        const A = await starte(oeffne(u, 'A'));
        u.saeen(KEY, kampagne(['X']), { ts: '2000' });

        const r = await A.ctx.load();

        expect(r).toEqual({ ok: true, applied: true, source: 'localStorage' });
        expect(namenIn(A.ctx.D)).toEqual(['X']);
    });

    test('T3e: Stale-Shadow plus IndexedDB-Lesefehler (strictIdb) — idb-error, D unveraendert, Banner bleibt, der lokale Save bleibt erhalten', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Alt']));
        const A = await starte(oeffne(u, 'A'));
        A.ctx.D.characters[0].name = 'Alt-lokal';
        A.ctx.save(); // ausdruecklicher Save ist ausstehend
        u.ls.set(KEY, JSON.stringify(kampagne(['Uralt-Schatten'])));
        u.ls.delete(KEY + '_ts');
        A.ctx.showConflictBanner();
        lesenScheitert(u);

        const r = await ergebnisVon(u, A.ctx.reloadData());

        expect(namenIn(A.ctx.D)).toEqual(['Alt-lokal']);
        expect(A.toastTexte()).not.toContain(OK_TOAST);
        expect(A.bannerSichtbar()).toBe(true);
        expect(r).toMatchObject({ ok: false, applied: false, source: null, reason: 'idb-error' });
        expect(A.toastTexte()).toContain(FEHLER_TOAST);

        // Der zurueckgestellte Save wird danach geschrieben (last-writer-wins, D4 = A)
        await u.uhr.laufen(1000);
        expect(namen(u.ls.get(KEY))).toEqual(['Alt-lokal']);
        expect(u.ls.get(KEY + '_ts')).not.toBeNull();
    });

    test('T3f: localStorage-Gluecksfall Ende-zu-Ende — neuer Stand gerendert, Theme/Layout/Notizen nachgezogen, Banner weg, Konflikte wieder scharf', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await starte(oeffne(u, 'A'));
        const B = await starte(oeffne(u, 'B'));
        B.ctx.D.characters.push({ id: 2, name: 'Borin' });
        B.ctx.D.quickNotes = 'Notiz aus B';
        B.ctx.D.settings = { theme: 'sepia' };
        await B.ctx.saveImmediate();
        await u.uhr.laufen(0);
        expect(A.bannerSichtbar()).toBe(true);

        const r = await ergebnisVon(u, A.ctx.reloadData());
        A.frame();

        expect(A.renders).toEqual([['Aria', 'Borin']]);
        expect(A.nachlauf).toEqual(['theme:sepia', 'layout']);
        expect(A.element('quick-notes').value).toBe('Notiz aus B');
        expect(A.tabRenders).toEqual(['dashboard:Aria,Borin']);
        expect(A.anzahlToast(OK_TOAST)).toBe(1);
        expect(A.bannerSichtbar()).toBe(false);
        expect(A.element('save-indicator').className).toBe('save-indicator saved');
        expect(r).toEqual({ ok: true, applied: true, source: 'localStorage' });
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);

        // Ein neuer Konflikt wird wieder angezeigt
        B.ctx.D.characters.push({ id: 3, name: 'Cara' });
        await B.ctx.saveImmediate();
        await u.uhr.laufen(0);
        expect(A.bannerSichtbar()).toBe(true);
    });

    test('T3g: validateDataIntegrity wirft nach dem Uebernehmen — Warnhinweis statt Fehler, Banner weg, Stand gerendert', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Alt']));
        const A = await starte(oeffne(u, 'A'));
        u.saeen(KEY, kampagne(['Neu']), { ts: '2000' });
        A.ctx.showConflictBanner();
        A.ctx.validateDataIntegrity = () => {
            throw new Error('Integritaetspruefung kaputt');
        };

        const r = await ergebnisVon(u, A.ctx.reloadData());
        A.frame();

        expect(A.toastTexte()).toContain(WARN_TOAST);
        expect(A.toastTexte().some(t => t.startsWith('❌'))).toBe(false);
        expect(A.toastTexte()).not.toContain(OK_TOAST);
        expect(A.bannerSichtbar()).toBe(false);
        expect(A.renders).toEqual([['Neu']]);
        expect(r).toMatchObject({ ok: true, applied: true, source: 'localStorage' });
        expect(typeof r.warning).toBe('string');
    });
});

describe('R06 — Konflikterkennung nach dem Neuladen', () => {
    test('T4a: nach erfolgreichem Neuladen zeigen ein zweiter BroadcastChannel-Save und ein storage-Ereignis das Banner wieder', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await starte(oeffne(u, 'A'));
        const B = await starte(oeffne(u, 'B'));
        B.ctx.D.characters.push({ id: 2, name: 'Borin' });
        await B.ctx.saveImmediate();
        await u.uhr.laufen(0);
        expect(A.bannerSichtbar()).toBe(true);

        await ergebnisVon(u, A.ctx.reloadData());
        expect(A.bannerSichtbar()).toBe(false);

        // zweiter Konflikt nur ueber den BroadcastChannel
        const kanal = fremderKanal(u, A);
        await fremderSave(u, kanal);
        expect(A.bannerSichtbar()).toBe(true);

        // und nur ueber ein storage-Ereignis
        A.element('conflict-banner').classList.remove('show');
        A.feuere('window', 'storage', { key: KEY, oldValue: 'a', newValue: 'b' });
        expect(A.bannerSichtbar()).toBe(true);
    });

    test('T4b (Kontrolle): nach "Ignorieren" bleiben weitere fremde Saves stumm', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Aria']));
        const A = await starte(oeffne(u, 'A'));
        const kanal = fremderKanal(u, A);
        await fremderSave(u, kanal);
        expect(A.bannerSichtbar()).toBe(true);

        A.ctx.dismissConflict();
        await fremderSave(u, kanal);
        A.feuere('window', 'storage', { key: KEY, oldValue: 'a', newValue: 'b' });

        expect(A.bannerSichtbar()).toBe(false);
    });

    test('T4c: ein fremder Save WAEHREND des gehaltenen Lesens haelt das Banner nach dem Erfolg offen', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u);
        const kanal = fremderKanal(u, A);
        u.saeenIdb(KEY, kampagne(['Neu']));
        await fremderSave(u, kanal);
        expect(A.bannerSichtbar()).toBe(true);
        const halt = halteLesen(u);

        const p = A.ctx.reloadData();
        await u.uhr.ruhe();
        await fremderSave(u, kanal); // der gelesene Stand kann diesen Save verpasst haben
        halt.freigeben();
        const r = await ergebnisVon(u, p);

        expect(A.bannerSichtbar()).toBe(true);
        expect(r).toMatchObject({ ok: true, applied: true });
        expect(namenIn(A.ctx.D)).toEqual(['Neu']);
        // Banner sichtbar heisst weiterhin veraltet: automatische Saves bleiben gesperrt
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(true);
    });

    test('T4d: ein fremder Save fuer eine ANDERE Kampagne waehrend des Neuladens haelt das Banner nicht offen', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u);
        const kanal = fremderKanal(u, A);
        u.saeenIdb(KEY, kampagne(['Neu']));
        await fremderSave(u, kanal);
        const halt = halteLesen(u);

        const p = A.ctx.reloadData();
        await u.uhr.ruhe();
        await fremderSave(u, kanal, NEBEN_KEY);
        A.feuere('window', 'storage', { key: NEBEN_KEY, oldValue: 'a', newValue: 'b' });
        halt.freigeben();
        const r = await ergebnisVon(u, p);

        expect(A.bannerSichtbar()).toBe(false);
        expect(r).toMatchObject({ ok: true, applied: true });
        expect(A.ctx.isCampaignStorageStale(KEY)).toBe(false);
    });
});

describe('R06 — ausstehende Saves im Ladefenster', () => {
    test('T5a: > 5 MB — ein beim Klick ausstehender save() schreibt den verdraengten Stand nie; danach bleibt kein Timer', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u, grosseKampagne('Alt'));
        u.saeenIdb(KEY, grosseKampagne('Neu'));
        A.ctx.showConflictBanner();
        A.ctx.save(); // mit dem veralteten D gestellt
        const halt = halteLesen(u);

        const p = A.ctx.reloadData();
        await u.uhr.laufen(1000); // 300-ms-Debounce laeuft ab, waehrend das Lesen haengt

        expect(namen(u.idbDatensatz(KEY).data)[0]).toBe('Neu');

        halt.freigeben();
        await ergebnisVon(u, p);
        expect(u.uhr.anstehend(A)).toBe(0);
        await u.uhr.laufen(2000);

        expect(namen(u.idbDatensatz(KEY).data)[0]).toBe('Neu');
        expect(namenIn(A.ctx.D)[0]).toBe('Neu');
    });

    test('T5b (Kontrolle): scheitert das Neuladen, wird der ausstehende lokale Save danach geschrieben', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u);
        A.ctx.D.characters[0].name = 'Lokal';
        A.ctx.save();
        lesenScheitert(u);

        await ergebnisVon(u, A.ctx.reloadData());
        await u.uhr.laufen(1000);

        expect(namen(u.ls.get(KEY))).toEqual(['Lokal']);
    });

    test('T5c: eine Aenderung plus save() WAEHREND des gehaltenen Lesens wird nicht geschrieben; D endet als geladener Stand', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u, grosseKampagne('Alt'));
        u.saeenIdb(KEY, grosseKampagne('Neu'));
        const halt = halteLesen(u);

        const p = A.ctx.reloadData();
        await u.uhr.ruhe();
        A.ctx.D.characters[0].name = 'Alt-waehrenddessen';
        A.ctx.save();
        await u.uhr.laufen(1000);

        expect(namen(u.idbDatensatz(KEY).data)[0]).toBe('Neu');

        halt.freigeben();
        await ergebnisVon(u, p);
        await u.uhr.laufen(2000);

        expect(namen(u.idbDatensatz(KEY).data)[0]).toBe('Neu');
        expect(namenIn(A.ctx.D)[0]).toBe('Neu');
    });

    test('T5d: saveImmediate (per undo) im Ladefenster — nach dem Erfolg entspricht der Speicher D (neu festgeschrieben)', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u);
        A.ctx.saveUndoState('lokale Änderung');
        A.ctx.D.characters[0].name = 'Alt-editiert';
        u.saeenIdb(KEY, kampagne(['Neu']));
        const halt = halteLesen(u);

        const p = A.ctx.reloadData();
        await u.uhr.ruhe();
        A.ctx.undo(); // schreibt sofort (saveImmediate) den verdraengten Stand
        await u.uhr.ruhe();
        expect(namen(u.ls.get(KEY))).toEqual(['Alt']);

        halt.freigeben();
        await ergebnisVon(u, p);

        expect(namenIn(A.ctx.D)).toEqual(['Neu']);
        expect(u.ls.get(KEY)).toBe(JSON.stringify(A.ctx.D));
    });

    test('T5e: Waechter — das Lesen haengt; nach 10 s endet die Sperre, der Save laeuft, Fehlermeldung; ein spaetes Lesen wird verworfen', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u);
        u.saeenIdb(KEY, kampagne(['Neu']));
        A.ctx.showConflictBanner();
        A.ctx.D.characters[0].name = 'Lokal';
        A.ctx.save();
        const halt = halteLesen(u);

        const p = A.ctx.reloadData();
        await u.uhr.laufen(WAECHTER_MS + 1000);

        expect(A.toastTexte()).toContain(ZEIT_TOAST);
        expect(A.toastTexte()).not.toContain(OK_TOAST);
        expect(A.bannerSichtbar()).toBe(true);
        expect(namen(u.ls.get(KEY))).toEqual(['Lokal']);
        const r = await ergebnisVon(u, p);
        expect(r).toMatchObject({ ok: false, applied: false, reason: 'timeout' });

        // Das Lesen kommt spaet doch noch an: nicht uebernehmen
        halt.freigeben();
        await u.uhr.laufen(1000);
        expect(namenIn(A.ctx.D)).toEqual(['Lokal']);
        expect(namen(u.ls.get(KEY))).toEqual(['Lokal']);
    });
});

describe('R06 — Undo, Doppelklick, Altformat', () => {
    test('T6: Undo nach dem Neuladen macht das Neuladen rueckgaengig (D6 = A)', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Alt']));
        const A = await starte(oeffne(u, 'A'));
        A.ctx.saveUndoState('lokale Änderung');
        A.ctx.D.characters[0].name = 'Alt-editiert';
        u.saeen(KEY, kampagne(['Neu']), { ts: '5000' });

        await ergebnisVon(u, A.ctx.reloadData());
        expect(namenIn(A.ctx.D)).toEqual(['Neu']);
        A.ctx.undo();
        await u.uhr.ruhe();

        const letzter = A.toastTexte()[A.toastTexte().length - 1];
        expect(letzter).toBe('↩️ Rückgängig: Neu laden (anderer Tab)');
        expect(namenIn(A.ctx.D)).toEqual(['Alt-editiert']);
    });

    test('T7: Doppelklick waehrend des gehaltenen Lesens — genau ein load(), genau eine Bestaetigung', async () => {
        const u = erzeugeUrsprung();
        const A = await tabImIdbModus(u);
        u.saeenIdb(KEY, kampagne(['Neu']));
        const echtesLoad = A.ctx.load;
        let aufrufe = 0;
        A.ctx.load = (...args) => {
            aufrufe++;
            return echtesLoad(...args);
        };
        const halt = halteLesen(u);

        const p1 = A.ctx.reloadData();
        const p2 = A.ctx.reloadData();
        await u.uhr.ruhe();
        halt.freigeben();
        await ergebnisVon(u, p1);
        await ergebnisVon(u, p2);

        expect(aufrufe).toBe(1);
        expect(A.anzahlToast(OK_TOAST)).toBe(1);
        expect(namenIn(A.ctx.D)).toEqual(['Neu']);
    });

    test('T8: ein Alt-Stempel "2.11" wird beim Neuladen migriert und als Erfolg gemeldet', async () => {
        const u = erzeugeUrsprung();
        u.saeen(KEY, kampagne(['Alt']));
        const A = await starte(
            oeffne(u, 'A', {
                module: ['systems/spellslots/version-migration.js'],
                stubs: { getSpellSlotsForClass: () => [0, 0, 0, 0, 0, 0, 0, 0, 0] }
            })
        );
        const legacy = {
            _version: '2.11',
            characters: [{ id: 1, name: 'Legacy', conditions: ['poisoned'] }]
        };
        u.saeen(KEY, legacy, { ts: '3000' });

        const r = await ergebnisVon(u, A.ctx.reloadData());

        expect(r).toEqual({ ok: true, applied: true, source: 'localStorage' });
        const held = A.ctx.D.characters[0];
        expect(held.name).toBe('Legacy');
        expect(held.xp).toBe(0); // Migration 5.0.0
        expect(held.conditions).toEqual([{ type: 'poisoned', name: 'poisoned' }]); // 2.3.0
        expect(Array.isArray(A.ctx.D.bestiary)).toBe(true); // 3.0.0
        expect(A.ctx.D._version).toBe(A.ctx.APP_CONFIG.VERSION);
        expect(A.anzahlToast(OK_TOAST)).toBe(1);
    });
});
