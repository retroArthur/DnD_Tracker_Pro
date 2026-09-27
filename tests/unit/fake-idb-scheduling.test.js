/**
 * Code-Review 2026-09-21, Korrekturrunde F1 — Transaktionsreihenfolge des
 * IndexedDB-Doubles (`tests/unit/helpers/fake-idb.js`).
 *
 * Das Double ist die Werkbank fuer R02/R04/R06 (conflict-reload,
 * unload-persistence, idb-transaction-commit). Seine Reihenfolge-Semantik ist
 * damit selbst pruefbedürftiges Testwerk: weicht sie von IndexedDB ab, sehen
 * die darauf aufbauenden Tests Abläufe, die es im Browser nicht gibt — und
 * verstecken echte Rennen (R06: ein Save im Ladefenster, der vor dem Lesen
 * festschrieb, war im Double unsichtbar).
 *
 * Geprueft wird die Planungsregel aus IndexedDB 3.0 (§transaction scheduling):
 *   - eine readwrite-Transaktion wartet auf ALLE frueher erstellten, noch nicht
 *     beendeten Transaktionen mit ueberlappendem Bereich;
 *   - eine readonly-Transaktion wartet auf frueher erstellte, noch nicht
 *     beendete readwrite-Transaktionen.
 * Das Double behandelt jedes Paar als ueberlappend (Store-Bereich wird
 * ignoriert) — strenger als die Spezifikation, aber nie falsch-freigebend.
 *
 * Zusaetzlich festgehalten: die halten()-Politik braucht KEINEN Schnappschuss
 * bei der Erstellung mehr. Ein spaeter erstellter Schreibvorgang wartet jetzt
 * ohnehin hinter dem gehaltenen Lesen, also liest es dieselben Daten wie ein
 * echtes IndexedDB — und ein abgebrochener Halt darf die Warteschlange nicht
 * dauerhaft blockieren.
 */

'use strict';

const { setImmediate: naechsterTask } = require('timers');
const { erzeugeFakeIDB } = require('./helpers/fake-idb.js');

/**
 * Laesst die Task-Warteschlange (setImmediate) mehrfach leerlaufen.
 * Reicht fuer jede in diesen Tests erzeugte Kette aus Requests und Commits.
 * `setImmediate` wird — wie im Double selbst — aus `timers` geholt, weil die
 * jsdom-Umgebung es nicht global bereitstellt.
 */
async function ruhe(runden = 40) {
    for (let i = 0; i < runden; i++) {
        await new Promise(r => naechsterTask(r));
    }
}

function haltePolitik(w, op = 'get', store = 'campaigns') {
    const offen = [];
    w.policy.halten = (o, s) => (o === op && s === store ? new Promise(r => offen.push(r)) : null);
    return wert => {
        w.policy.halten = () => null;
        offen.splice(0).forEach(r => r(wert));
    };
}

// ============================================================
// Planungsregel
// ============================================================

describe('Fake-IndexedDB — Transaktionsreihenfolge wie in der Spezifikation', () => {
    test('S1: ein readwrite, das waehrend eines gehaltenen Lesens erstellt wird, schreibt erst danach fest', async () => {
        const w = erzeugeFakeIDB();
        w.setze('campaigns', { id: 'k', data: 'Alt' });
        const freigeben = haltePolitik(w);
        const folge = [];

        const leseTx = w.db.transaction(['campaigns'], 'readonly');
        const leseReq = leseTx.objectStore('campaigns').get('k');
        leseReq.onsuccess = () => folge.push('lesen:' + leseReq.result.data);
        leseTx.oncomplete = () => folge.push('lesen.complete');

        await ruhe();

        const schreibTx = w.db.transaction(['campaigns'], 'readwrite');
        schreibTx.objectStore('campaigns').put({ id: 'k', data: 'Neu' });
        schreibTx.oncomplete = () => folge.push('schreiben.complete');

        await ruhe();

        // Solange das Lesen haengt, darf der spaeter erstellte Write nichts tun
        expect(folge).toEqual([]);
        expect(w.datensatz('campaigns', 'k').data).toBe('Alt');

        freigeben();
        await ruhe();

        expect(folge).toEqual(['lesen:Alt', 'lesen.complete', 'schreiben.complete']);
        expect(w.datensatz('campaigns', 'k').data).toBe('Neu');
    });

    test('S2: ein readonly, das nach einem noch offenen readwrite erstellt wird, sieht dessen Daten', async () => {
        const w = erzeugeFakeIDB();
        w.setze('campaigns', { id: 'k', data: 'Alt' });

        const schreibTx = w.db.transaction(['campaigns'], 'readwrite');
        schreibTx.objectStore('campaigns').put({ id: 'k', data: 'Neu' });

        const leseTx = w.db.transaction(['campaigns'], 'readonly');
        const leseReq = leseTx.objectStore('campaigns').get('k');
        let gelesen = null;
        leseReq.onsuccess = () => {
            gelesen = leseReq.result.data;
        };

        await ruhe();
        expect(gelesen).toBe('Neu');
    });

    test('S3: zwei gehaltene Lesevorgaenge blockieren sich nicht gegenseitig (readonly nebenlaeufig)', async () => {
        const w = erzeugeFakeIDB();
        w.setze('campaigns', { id: 'k', data: 'Alt' });
        const freigeben = haltePolitik(w);
        const gelesen = [];

        ['a', 'b'].forEach(marke => {
            const tx = w.db.transaction(['campaigns'], 'readonly');
            const req = tx.objectStore('campaigns').get('k');
            req.onsuccess = () => gelesen.push(marke);
        });

        await ruhe();
        expect(gelesen).toEqual([]);
        freigeben();
        await ruhe();
        expect(gelesen.sort()).toEqual(['a', 'b']);
    });

    test('S4: readwrite-Transaktionen bleiben seriell in Erstellungsreihenfolge', async () => {
        const w = erzeugeFakeIDB();
        const folge = [];
        [1, 2, 3].forEach(nr => {
            const tx = w.db.transaction(['campaigns'], 'readwrite');
            tx.objectStore('campaigns').put({ id: 'k', data: 'W' + nr });
            tx.oncomplete = () => folge.push(nr);
        });
        await ruhe();
        expect(folge).toEqual([1, 2, 3]);
        expect(w.datensatz('campaigns', 'k').data).toBe('W3');
    });

    test('S5: ein abgebrochenes gehaltenes Lesen gibt die Warteschlange frei', async () => {
        const w = erzeugeFakeIDB();
        w.setze('campaigns', { id: 'k', data: 'Alt' });
        const freigeben = haltePolitik(w);
        const folge = [];

        const leseTx = w.db.transaction(['campaigns'], 'readonly');
        const leseReq = leseTx.objectStore('campaigns').get('k');
        // Kein preventDefault: der Request-Fehler blubbert und bricht die Transaktion ab
        leseTx.onabort = () => folge.push('lesen.abort');

        await ruhe();

        const schreibTx = w.db.transaction(['campaigns'], 'readwrite');
        schreibTx.objectStore('campaigns').put({ id: 'k', data: 'Neu' });
        schreibTx.oncomplete = () => folge.push('schreiben.complete');

        await ruhe();
        expect(folge).toEqual([]);

        const fehler = new Error('Lesefehler');
        freigeben(fehler);
        await ruhe();

        expect(leseReq.error).toBe(fehler);
        expect(folge).toEqual(['lesen.abort', 'schreiben.complete']);
        expect(w.datensatz('campaigns', 'k').data).toBe('Neu');
    });

    test('S6: ein abgebrochenes readwrite blockiert spaetere Transaktionen nicht', async () => {
        const w = erzeugeFakeIDB();
        w.policy.commitFehler = ({ nr }) => (nr === 1 ? new Error('commit') : null);
        const folge = [];

        const a = w.db.transaction(['campaigns'], 'readwrite');
        a.objectStore('campaigns').put({ id: 'k', data: 'A' });
        a.onabort = () => folge.push('a.abort');

        const b = w.db.transaction(['campaigns'], 'readwrite');
        b.objectStore('campaigns').put({ id: 'k', data: 'B' });
        b.oncomplete = () => folge.push('b.complete');

        await ruhe();
        expect(folge).toEqual(['a.abort', 'b.complete']);
        expect(w.datensatz('campaigns', 'k').data).toBe('B');
    });
});
