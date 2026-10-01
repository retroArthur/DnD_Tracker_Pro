/**
 * Unit — Loeschpfade und der Protokollschluessel (U5, Pruefrunde 1)
 *
 * BEFUND, GEGEN DEN DIESE DATEI GESCHRIEBEN IST: der Loeschdialog verspricht
 * woertlich, "ALLE Kampagnendaten unwiderruflich" zu loeschen — Charaktere,
 * NSCs, Orte. removeCampaignData() entfernte aber nur drei Schluessel (die
 * Daten, `_ts`, `_rev`). Den von U5 neu angelegten vierten, der die
 * Protokolleintraege und damit NAMEN von Charakteren, NSCs und Monstern
 * traegt, kannte niemand. Er blieb liegen, wurde beim naechsten Start wieder
 * gelesen und stand im Panel unter der Zeile "Alle Daten geloescht".
 *
 * Derselbe Fehler traf deleteCampaign() (dort ueber dieselbe Funktion) und den
 * Nur-lokal-Pfad confirmLocalOnlyCampaignRemoval(), dessen Rueckfrage ebenfalls
 * zusagt, die lokalen Daten zu loeschen.
 *
 * DER SUFFIX STEHT HIER NICHT WOERTLICH. Er wird aus dem Modul unter Pruefung
 * abgeleitet (kpLogSpeicherSchluessel() minus Kampagnenschluessel) — sonst
 * pruefte diese Datei nur, dass zwei Abschriften derselben Zeichenkette
 * uebereinstimmen, und ein Umbenennen im Protokollmodul faende sie nicht.
 *
 * Werkbank: tests/unit/helpers/multi-tab-harness.js (ein vm-Kontext, virtuelle
 * Uhr, geteilter localStorage) — dieselbe wie tests/unit/unload-persistence.js
 * nebenan nutzt, weil removeCampaignData() in systems/spellslots/persistence.js
 * ohne Ursprung und IndexedDB-Doppel nicht laufen kann.
 */

const { erzeugeUrsprung, oeffneTab, STANDARD_KEY: KEY } = require('./helpers/multi-tab-harness.js');

// Der loader.js-relative Pfad steht in AUSFUEHRBAREM Code, nicht nur im
// Erklaertext: das Abdeckungs-Gate (tests/unit/module-test-coverage.test.js)
// sucht ihn woertlich, und ein Kommentar ist dort ausdruecklich KEINE Abdeckung.
const KERN_REL = 'features/combat-log/combat-log-core.js';

const NEBEN_KEY = 'dnd-campaign-777';

/**
 * Oeffnet einen gebooteten Tab, in dem das Protokollmodul mitgeladen ist.
 * @param {Object} u - Ursprung aus erzeugeUrsprung()
 * @returns {Promise<Object>} der gestartete Tab
 */
function tabMitProtokoll(u) {
    return oeffneTab(u, 'A', { module: [KERN_REL] }).starten();
}

/**
 * Der Schluessel-Zusatz des Protokolls, ABGELEITET aus dem Modul.
 * @param {Object} tab
 * @returns {string}
 */
function protokollSuffix(tab) {
    const voll = tab.ctx.kpLogSpeicherSchluessel();
    expect(voll.startsWith(KEY)).toBe(true);
    return voll.slice(KEY.length);
}

describe('P1 — removeCampaignData() entfernt auch das Kampfprotokoll', () => {
    test('P1a: der Protokollschluessel der AKTIVEN Kampagne ist nach dem Loeschen weg', async () => {
        const u = erzeugeUrsprung();
        const tab = await tabMitProtokoll(u);

        tab.ctx.pushCombatLog('Held 01 trifft NSC 07 für 12 Schaden', 'success', 'kampf');
        await u.uhr.laufen(600); // ueber der Schreibverzoegerung des Protokolls

        const protokoll = tab.ctx.kpLogSpeicherSchluessel();
        expect(u.ls.has(protokoll)).toBe(true);
        expect(u.ls.get(protokoll)).toContain('Held 01');

        const ergebnis = await tab.ctx.removeCampaignData(KEY);
        expect(ergebnis.success).toBe(true);

        // Das ist der Befund: der Dialog sagt "ALLE Kampagnendaten", der Name
        // des Charakters steht danach weiter im Speicher.
        expect(u.ls.has(protokoll)).toBe(false);
    });

    test('P1b: auch das Protokoll einer NICHT aktiven Kampagne verschwindet (deleteCampaign)', async () => {
        const u = erzeugeUrsprung();
        const tab = await tabMitProtokoll(u);
        const suffix = protokollSuffix(tab);
        const fremd = NEBEN_KEY + suffix;

        u.saeen(NEBEN_KEY, { _version: '2.6.1', characters: [] });
        u.ls.set(
            fremd,
            JSON.stringify([
                { nr: 1, text: 'Ork 03: 12 Schaden', typ: 'info', kategorie: 'kampf', zeit: 1 }
            ])
        );

        const ergebnis = await tab.ctx.removeCampaignData(NEBEN_KEY);
        expect(ergebnis.success).toBe(true);
        expect(u.ls.has(NEBEN_KEY)).toBe(false);
        expect(u.ls.has(fremd)).toBe(false);
    });

    test('P1c: der Nur-lokal-Pfad raeumt das Protokoll mit auf', async () => {
        const u = erzeugeUrsprung();
        const tab = await tabMitProtokoll(u);
        const suffix = protokollSuffix(tab);
        const protokoll = KEY + suffix;

        u.saeen(KEY, { _version: '2.6.1', characters: [] });
        u.ls.set(
            protokoll,
            JSON.stringify([
                { nr: 1, text: 'NSC 07 weicht aus', typ: 'info', kategorie: 'kampf', zeit: 1 }
            ])
        );

        // confirm() antwortet in der Werkbank mit true, wenn nichts anderes gesetzt ist:
        // der Nutzer waehlt "nur die lokalen Daten loeschen".
        const ergebnis = tab.ctx.confirmLocalOnlyCampaignRemoval(KEY, 'Testkampagne');
        expect(ergebnis.removed).toBe(true);
        expect(u.ls.has(KEY)).toBe(false);
        expect(u.ls.has(protokoll)).toBe(false);
    });

    test('P1d: ohne geladenes Protokollmodul bleibt der Loeschpfad unveraendert erfolgreich', async () => {
        // Die Loeschfunktion darf kein Modul VORAUSSETZEN, das in ihrer eigenen
        // Unit-Lage nicht geladen ist (tests/unit/backups-autobackup.test.js laedt
        // genau diese Reihe ohne das Protokoll).
        const u = erzeugeUrsprung();
        const tab = await oeffneTab(u, 'A').starten();
        u.saeen(KEY, { _version: '2.6.1', characters: [] });

        const ergebnis = await tab.ctx.removeCampaignData(KEY);
        expect(ergebnis.success).toBe(true);
        expect(u.ls.has(KEY)).toBe(false);
    });
});
