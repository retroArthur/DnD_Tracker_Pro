// @ts-check
/**
 * W6-R-10 und W6-R-11 — die zwei Zaehler und die Phantom-Halte, am Verhalten
 * gemessen (Design-Handoff v3, Welle 6, Schritt 7)
 * ============================================================================
 *
 * WARUM DIESE DATEI UEBERHAUPT EXISTIERT. Beide Befunde dieses Schrittes sind
 * VERHALTEN, und Verhalten sieht in diesem Projekt kein bestehender Waechter:
 *
 *   — Der versionierte Stil-Sollstand hasht zwoelf berechnete Eigenschaften je
 *     Element im RUHEZUSTAND jeder Ansicht. Ein Zaehler, der "0" statt "2"
 *     anzeigt, hat genau dieselben zwoelf Werte wie einer, der "2" anzeigt:
 *     Textinhalt ist keine davon. Und ob ein Tabulatorsprung in einer
 *     unsichtbaren Leiste landet, ist ueberhaupt keine Eigenschaft eines
 *     Elements.
 *   — Die Unit-Ratsche W6-R-09 (tests/unit/design-consistency.test.js) urteilt
 *     ueber QUELLTEXT: dass der Aufruf dasteht, dass die Klasse die zwei
 *     Layout-Eigenschaften traegt, dass die alte ID weg ist. Dass der Aufruf
 *     den Zaehler auch ERREICHT und dass die Klasse den Zaehler an derselben
 *     Stelle haelt wie der geloeschte Inline-Stil, kann sie nicht wissen.
 *
 * Diese Datei ist deshalb der zweite, unabhaengige Strang, und sie ist bei
 * ihrer Geburt ROT — beziffert, siehe AUSGANGSWERTE.
 *
 * ECHTE TABULATORSPRUENGE, NIE `.focus()`. Derselbe Grundsatz wie in
 * fokusring.spec.js und eingaberahmen.spec.js, hier aus einem zweiten Grund:
 * die Phantom-Halte sind definitionsgemaess Halte der TABULATORREIHENFOLGE.
 * Ein programmatischer Fokus kann jedes Element treffen, auch eines, das die
 * Reihenfolge nie anbietet — er kann also die Frage dieses Falles nicht
 * beantworten, in keiner Richtung.
 *
 * EIN BILD WIRD ABGEWARTET. `renderAll()` laeuft in `requestAnimationFrame`;
 * ein synchroner Lesevorgang unmittelbar danach liest den ALTEN Zaehlerstand.
 * Diese Messfalle ist beim Erstellen des Plans einmal zugeschlagen (es wurde
 * daraus geschlossen, der Schreibweg laufe nie) und steht darum hier
 * ausdruecklich: alle Lesevorgaenge dieser Datei gehen durch `nachEinemBild()`.
 *
 * GEGEN DAS GEBAUTE BUENDEL, auf gefuellter Kampagne. Der gefuellte Seed
 * enthaelt 0 Zauber und 0 Auftraege — am Buendel nachgemessen, nicht
 * angenommen; die Pruefkoerper legt jeder Fall selbst an, damit er seine
 * Ausgangszahl kennt.
 *
 * AUSGANGSWERTE (gemessen am 2026-10-07 an HEAD 186e4e7, 1600x1000, gefuellte
 * Kampagne, gebautes Buendel):
 *
 *   W6-R-10 Fall 1  2 Zauber in D.spells + NUR renderSpells(): #spells-count
 *                   liest "0". Erst renderAll() zieht es auf "2" nach — und
 *                   renderAll() laeuft nur beim Import, beim Ruecknehmen und
 *                   beim Wiederherstellen, nie aus einer Zauber-CRUD.
 *   W6-R-10 Fall 2  1 Auftrag + NUR renderQuests(): #quests-count liest "0".
 *   W6-R-10 Fall 3  GRUEN bei der Geburt: die Filterrueckmeldung meldete
 *                   schon immer korrekt "Buch 2" bzw. "Buch 1/2". Dieser Fall
 *                   ist die Zusicherung, dass der Umbau sie nicht verliert —
 *                   Variante C der Entscheidung haette genau das getan (ein
 *                   leeres div).
 *   W6-R-10 Fall 4  GRUEN bei der Geburt, mit dem Inline-Stil: rechte Kante
 *                   1574,0 px = rechter Innenrand der Filterleiste, Abstand
 *                   0,0 px in allen vier Themes. Der Gegenwert ist gemessen:
 *                   mit zurueckgenommenem `margin-left: auto` springt der
 *                   Zaehler 342,3 px nach links an die Schulfilter. Genau
 *                   diese zwei Zahlen machen den Fall tragend — er bewacht
 *                   die Eigenschaft, die der Klassenumbau verlieren KANN.
 *   W6-R-11 Fall 1  12 Phantom-Halte je Ansicht, ausnahmslos: 9
 *                   `button.editor-btn` und 3 `select.editor-select` in der
 *                   schwebenden Editorleiste. Ueber die sechs Ansichten dieses
 *                   Falles also 72. Im vollen Tastaturlauf der Welle (24
 *                   Ansichten + 3 Aufklapp-Formulare + 6 Modale) trifft es 32
 *                   von 33 Messphasen: 384 Halte je Theme, 372 in Contrast.
 *                   Der Grund ist eine
 *                   einzige fehlende Zeile: die Leiste traegt
 *                   `position: fixed; display: flex; opacity: 0` OHNE
 *                   `visibility: hidden` und bleibt damit im Layout UND in der
 *                   Tabulatorreihenfolge. Ihre zwei Geschwister
 *                   (.table-context-toolbar, .link-context-toolbar) schalten
 *                   ueber `display` und sind deshalb nie betroffen — die
 *                   Asymmetrie ist im Baum nachlesbar.
 *   W6-R-11 Fall 2  1 Befund: die Eigenschaftsliste des Uebergangs liest
 *                   `opacity, transform` — `visibility` steht nicht darin.
 *                   Dieser Fall ist die vom Nutzer ausdruecklich verlangte
 *                   Nebenwirkungspruefung ("die Leiste blendet sich per
 *                   opacity ein; ein visibility: hidden ohne Uebergang wuerde
 *                   das Einblenden hart machen") und er ist der Grund, warum
 *                   `visibility` in die Eigenschaftsliste muss und nicht nur
 *                   in den Rumpf. Vor dem Schritt ist der Befund harmlos (es
 *                   gibt kein visibility zu uebergehen), nach dem Schritt
 *                   waere er der harte Umschlag — die Ratsche nennt ihn
 *                   trotzdem jetzt, weil sie sonst erst rot wuerde, nachdem
 *                   der Fehler schon im Baum liegt.
 *   W6-R-11 Gegen-  GRUEN bei der Geburt, und das ist Absicht: sie nimmt die
 *           probe   Zeile zur Laufzeit zurueck (`visibility: visible
 *                   !important`) und verlangt die Halte dann zurueck. Vor dem
 *                   Schritt beschreibt sie den Istzustand, nach dem Schritt
 *                   den zurueckgedrehten — eine Gegenprobe, die nach dem
 *                   Schritt umgeschrieben werden muesste, hat den Schritt
 *                   nicht bewacht.
 *
 * KEINE MODULPFADE IN DEN KOMMENTAREN. Das Abdeckungs-Gate wertet jede
 * woertliche Nennung eines loader.js-Modulpfads unter tests/ als Abdeckung —
 * auch die in einem Kommentar.
 */

import { test, expect } from '@playwright/test';
import { seedPopulatedSession, loadApp, waitForAppReady } from '../helpers/test-utils.js';

/** Die Filterrueckmeldung der Zauberansicht nach dem Umbau. */
const FILTER_ZAEHLER = 'spells-filter-count';

/** Sechs Ansichten fuer den Tabulatorlauf — quer durch die Gruppen der
 *  Navigation, damit nicht eine einzige Schale das Ergebnis traegt. Der
 *  Ausgangswert ist in jeder Ansicht derselbe (12), gemessen in allen 24.
 *  NICHT DABEI: bestiary. Begruendung an `lauf()` unten — dort bricht der
 *  Lauf an der virtuellen Rollung ab, bevor er das Dokumentende erreicht. */
const LAUF_ANSICHTEN = ['dashboard', 'spells', 'quests', 'wiki', 'timers', 'links'];

/**
 * Wartet ZWEI Bilder ab. `renderAll()` plant seine Arbeit in
 * `requestAnimationFrame`; das zweite Bild stellt sicher, dass auch ein
 * innerhalb des ersten geplanter Nachlauf durch ist.
 */
async function nachEinemBild(page) {
    await page.evaluate(
        () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(null))))
    );
}

/** Text eines Elements, oder null wenn es fehlt. */
async function lies(page, id) {
    return page.evaluate(x => {
        const el = document.getElementById(x);
        return el ? el.textContent : null;
    }, id);
}

/** Startet eine frische Seite mit gefuellter Kampagne am gebauten Buendel. */
async function starte(page) {
    await seedPopulatedSession(page);
    await loadApp(page);
    const hinweis = page.locator('[data-action="close-migration-hint"]').first();
    if (await hinweis.count()) await hinweis.dispatchEvent('click').catch(() => {});
    await page.waitForTimeout(200);
}

/** Legt n Pruefzauber an, OHNE renderAll() und ohne save(). */
async function legeZauberAn(page, n) {
    await page.evaluate(anzahl => {
        window.D.spells = [];
        for (let i = 0; i < anzahl; i++) {
            window.D.spells.push({
                id: 9000 + i,
                name: 'Pruefzauber ' + (i + 1),
                level: i + 1,
                school: 'Hervorrufung',
                type: 'damage'
            });
        }
    }, n);
}

test.describe('W6-R-10 — zwei Zaehler, zwei Namen, am Verhalten gemessen (Ratsche)', () => {
    test('Fall 1 — renderSpells() allein bringt den Werkzeugleisten-Zaehler auf Stand', async ({
        page
    }) => {
        /* DER BEHOBENE FEHLER, in seinem echten Pfad. Jede Zauber-CRUD der App
           ruft renderSpells(), keine ruft renderAll(). Wer hier renderAll()
           einsetzt, prueft den einen Pfad, der schon vorher stimmte. */
        await starte(page);
        await page.evaluate(() => window.switchView('spells'));
        await nachEinemBild(page);

        expect(await lies(page, 'spells-count')).toBe('0');

        await legeZauberAn(page, 2);
        await page.evaluate(() => window.renderSpells());
        await nachEinemBild(page);

        const stand = await lies(page, 'spells-count');
        expect(
            stand === '2'
                ? []
                : [
                      'Der Werkzeugleisten-Zaehler der Zauberansicht liest "' +
                          stand +
                          '" statt "2", nachdem 2 Zauber im Bestand liegen und NUR renderSpells() ' +
                          'gelaufen ist. Bei der Geburt dieser Ratsche: "0" — dauerhaft, in jedem ' +
                          'Normalbetrieb.'
                  ]
        ).toEqual([]);

        // Und zurueck: der letzte Zauber geloescht, nur renderSpells().
        await page.evaluate(() => {
            window.D.spells = [];
            window.renderSpells();
        });
        await nachEinemBild(page);
        expect(await lies(page, 'spells-count')).toBe('0');
    });

    test('Fall 2 — renderQuests() allein bringt den Auftrags-Zaehler auf Stand', async ({
        page
    }) => {
        /* DIE LEERE LISTE IST DER RANDFALL, DER ZAEHLT. renderQuests() kehrt
           bei leerer Liste FRUEH zurueck (Leerzustand statt Karten). Steht der
           Zaehlerschreibzugriff hinter dieser Rueckkehr, bleibt der Zaehler
           nach dem Loeschen des letzten Auftrags auf "1" stehen — ein Fehler,
           der genau umgekehrt zum behobenen aussieht. Darum wird beide
           Richtungen gemessen. */
        await starte(page);
        await page.evaluate(() => window.switchView('quests'));
        await nachEinemBild(page);

        expect(await lies(page, 'quests-count')).toBe('0');

        await page.evaluate(() => {
            window.D.quests = [{ id: 9001, title: 'Pruefauftrag', type: 'side' }];
            window.renderQuests();
        });
        await nachEinemBild(page);

        const stand = await lies(page, 'quests-count');
        expect(
            stand === '1'
                ? []
                : [
                      'Der Werkzeugleisten-Zaehler der Auftragsansicht liest "' +
                          stand +
                          '" statt "1", nachdem 1 Auftrag im Bestand liegt und NUR renderQuests() ' +
                          'gelaufen ist. Bei der Geburt dieser Ratsche: "0".'
                  ]
        ).toEqual([]);

        await page.evaluate(() => {
            window.D.quests = [];
            window.renderQuests();
        });
        await nachEinemBild(page);
        const leer = await lies(page, 'quests-count');
        expect(
            leer === '0'
                ? []
                : [
                      'Nach dem Loeschen des letzten Auftrags liest der Zaehler "' +
                          leer +
                          '" statt "0" — der Schreibzugriff liegt hinter der fruehen Rueckkehr ' +
                          'des Leerzustands.'
                  ]
        ).toEqual([]);
    });

    test('Fall 3 — die Filterrueckmeldung behaelt ihre n/N-Form', async ({ page }) => {
        /* VARIANTE C DER ENTSCHEIDUNG HAETTE HIER EIN LEERES DIV HINTERLASSEN
           ('spell' in COUNTED_VIEWS, Leser aus dem JS entfernt). Dieser Fall
           ist die Zusicherung, dass die Rueckmeldung den Umbau ueberlebt. */
        await starte(page);
        await legeZauberAn(page, 2);
        await page.evaluate(() => {
            window.switchView('spells');
            window.renderSpells();
        });
        await nachEinemBild(page);

        const ohneFilter = await lies(page, FILTER_ZAEHLER);
        expect(
            /^\s*\S+\s*2\s*$/.test(String(ohneFilter))
                ? []
                : [
                      'Die Filterrueckmeldung liest "' +
                          ohneFilter +
                          '" statt einer Gesamtzahl der Form "<Zeichen> 2".'
                  ]
        ).toEqual([]);

        // Stufenfilter 1: einer von zwei Zaubern bleibt uebrig.
        await page.evaluate(() => {
            window.currentSpellLevelFilter = '1';
            window.renderSpells();
        });
        await nachEinemBild(page);

        const mitFilter = await lies(page, FILTER_ZAEHLER);
        expect(
            /1\s*\/\s*2/.test(String(mitFilter))
                ? []
                : [
                      'Die Filterrueckmeldung liest "' +
                          mitFilter +
                          '" statt der gefilterten Form "1/2". Genau diese Form ist der Grund, ' +
                          'warum die Rueckmeldung einen eigenen Namen bekommt statt in das ' +
                          'setViewCount()-Schema gezwungen zu werden — setViewCount() schreibt ' +
                          'String(n), nicht n/N.'
                  ]
        ).toEqual([]);
    });

    for (const theme of ['dark', 'light', 'sepia', 'contrast']) {
        test(`Fall 4 — ${theme}: die Filterrueckmeldung steht am rechten Innenrand`, async ({
            page
        }) => {
            /* DER TRAGENDE FALL DES SCHRITTES. `margin-left: auto` ist das
               einzige Mittel, das den Zaehler im Flex-Streifen nach rechts
               schiebt (das Elternelement fuehrt kein justify-content). Es
               stand im geloeschten Inline-Stil und MUSS in der Klasse
               weiterleben. Gemessener Gegenwert mit zurueckgenommenem
               margin-left: 342,3 px nach links — das ist keine Feinheit,
               sondern ein sichtbarer Sprung an die Schulfilter. */
            await starte(page);
            await legeZauberAn(page, 2);
            await page.evaluate(t => {
                if (window.setTheme) window.setTheme(t);
                window.switchView('spells');
                window.renderSpells();
            }, theme);
            await nachEinemBild(page);
            await page.waitForTimeout(250);

            const geo = await page.evaluate(id => {
                const el = document.getElementById(id);
                if (!el) return null;
                const p = el.parentElement;
                const r = el.getBoundingClientRect();
                const pr = p.getBoundingClientRect();
                const pcs = getComputedStyle(p);
                const cs = getComputedStyle(el);
                return {
                    abstandRechts:
                        Math.round((pr.right - parseFloat(pcs.paddingRight) - r.right) * 10) / 10,
                    marginLeft: cs.marginLeft,
                    whiteSpace: cs.whiteSpace,
                    breite: Math.round(r.width * 10) / 10,
                    hoehe: Math.round(r.height)
                };
            }, FILTER_ZAEHLER);

            const befunde = [];
            if (!geo) {
                befunde.push('#' + FILTER_ZAEHLER + ' ist nicht im Baum');
            } else {
                if (geo.breite <= 0) befunde.push('die Rueckmeldung hat keine Ausdehnung');
                if (geo.abstandRechts > 1) {
                    befunde.push(
                        'Abstand zum rechten Innenrand ' +
                            geo.abstandRechts.toFixed(1) +
                            ' px (verlangt <= 1,0). Gemessen mit dem alten Inline-Stil: 0,0 px; ' +
                            'ohne margin-left: auto: 342,3 px.'
                    );
                }
                if (geo.whiteSpace !== 'nowrap') {
                    befunde.push(
                        'white-space liest ' +
                            geo.whiteSpace +
                            ' statt nowrap — die Form "1/2" kann umbrechen'
                    );
                }
            }
            expect(befunde).toEqual([]);
        });
    }

    test('Gegenprobe: der Erkenner sieht einen falschen Zaehlerstand und eine Linksverschiebung', async ({
        page
    }) => {
        /* EINE RATSCHE, DIE IHREN BEFUND NICHT ERZEUGEN KANN, ist keine. Beide
           Erkenner werden an einer zur Laufzeit eingesetzten Verletzung
           vorgefuehrt — und die Verletzung wird danach wieder zurueckgenommen,
           damit die Probe nichts hinterlaesst.
           BEI DER GEBURT IST DIESE GEGENPROBE MIT-ROT, und zwar aus einem
           banalen Grund: Teil 2 fuehrt am Element selbst vor, und das Element
           traegt vor dem Schritt noch den alten Namen. Sie ist damit kein
           Befund im Baum, sondern wartet auf die Umbenennung. */
        await starte(page);
        await legeZauberAn(page, 2);
        await page.evaluate(() => {
            window.switchView('spells');
            window.renderSpells();
        });
        await nachEinemBild(page);

        // (1) Falscher Zaehlerstand wird gelesen, nicht geraten.
        await page.evaluate(() => {
            const el = document.getElementById('spells-count');
            if (el) el.textContent = '99';
        });
        expect(await lies(page, 'spells-count')).toBe('99');
        await page.evaluate(() => window.renderSpells());
        await nachEinemBild(page);
        expect(await lies(page, 'spells-count')).toBe('2');

        // (2) Die Geometriemessung sieht die Linksverschiebung.
        const vorher = await page.evaluate(id => {
            const el = document.getElementById(id);
            const p = el.parentElement;
            return (
                Math.round(
                    (p.getBoundingClientRect().right -
                        parseFloat(getComputedStyle(p).paddingRight) -
                        el.getBoundingClientRect().right) *
                        10
                ) / 10
            );
        }, FILTER_ZAEHLER);
        const nachher = await page.evaluate(id => {
            const el = document.getElementById(id);
            el.style.marginLeft = '0px';
            const p = el.parentElement;
            const d =
                Math.round(
                    (p.getBoundingClientRect().right -
                        parseFloat(getComputedStyle(p).paddingRight) -
                        el.getBoundingClientRect().right) *
                        10
                ) / 10;
            el.style.removeProperty('margin-left');
            return d;
        }, FILTER_ZAEHLER);

        expect(vorher).toBeLessThanOrEqual(1);
        expect(nachher).toBeGreaterThan(100);
    });
});

test.describe('W6-R-11 — keine Phantom-Halte in der schwebenden Editorleiste (Ratsche)', () => {
    /* 1600x1000 VON GEBURT DER SEITE AN, nicht per setViewportSize nachtraeglich.
       Das ist die Groesse aller Tastaturmessungen dieser Welle. Nachtraeglich
       umgestellt rendert die Bestiar-Liste (virtuelle Rollung) eine andere
       Zeilenzahl mit teils gleichen Kaesten; der Rundlauf brach dann vor dem
       Ende des Dokuments ab und die Leiste — sie steht als Modal-Markup am
       Dokumentschluss — wurde in dieser einen Ansicht nie erreicht. Gemessen:
       0 statt 12 Phantom-Halte in bestiary. */
    test.use({ viewport: { width: 1600, height: 1000 } });

    /** Die zwoelf Knoten der Leiste: 9 Knoepfe und 3 Auswahlfelder. Gezaehlt,
     *  damit ein Befund sagt, wie viele Halte zurueck sind. */
    const LESE_LAUF = `(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el === document.documentElement) return { ende: true };
        const r = el.getBoundingClientRect();
        return {
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            cls: (typeof el.className === 'string' ? el.className : '').trim().split(/\\s+/).filter(Boolean).slice(0, 3).join(' '),
            inLeiste: !!(el.closest && el.closest('#floating-toolbar')),
            rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
        };
    })()`;

    /**
     * Ein echter Tabulatorlauf durch eine Ansicht. Er ist VOLLSTAENDIG, wenn
     * der Fokus am Ende das Dokument verlaesst (`activeElement` faellt auf
     * `body` zurueck) — und nur dann hat er die schwebende Leiste ueberhaupt
     * besucht, denn sie steht als Modal-Markup am DOKUMENTSCHLUSS. Ein Lauf,
     * der vorher in einem Rundlauf abbricht, meldet 0 Phantom-Halte, ohne dass
     * das etwas bedeutet. Darum gibt diese Funktion `vollstaendig` mit zurueck,
     * und Fall 1 verlangt es von jeder Ansicht.
     *
     * Beim Schreiben dieser Datei genau so zugeschlagen: in der
     * Bestiar-Ansicht brach der Lauf nach 37 Halten in den Favoritenknoepfen
     * der Monsterliste ab (die virtuelle Rollung baut Zeilen waehrend des
     * Tabbens neu, der Fokus faellt zurueck) und meldete 0 statt 12. Die
     * Ansicht ist deshalb nicht in der Liste — nicht weil der Befund dort
     * fehlt, sondern weil die MESSUNG dort nicht verlaesslich ist. Das ist der
     * vorbestehende Rollungsdefekt, der im Stil-Sollstand schon aktenkundig
     * ist, und kein Gegenstand dieses Schrittes.
     */
    async function lauf(page, ansicht) {
        await page.evaluate(x => {
            window.switchView(x);
            if (window.clearEventLog) window.clearEventLog();
        }, ansicht);
        await page.waitForTimeout(300);
        await page.evaluate(() => {
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }
            document.body.focus();
        });
        const halte = [];
        const gesehen = new Set();
        let dop = 0;
        let vollstaendig = false;
        for (let i = 0; i < 400; i++) {
            await page.keyboard.press('Tab');
            const h = await page.evaluate(LESE_LAUF);
            if (h.ende) {
                vollstaendig = true;
                break;
            }
            const k = h.tag + '|' + h.id + '|' + h.cls + '|' + h.rect.join(',');
            if (gesehen.has(k)) {
                dop++;
                if (dop > 20) break;
                continue;
            }
            gesehen.add(k);
            halte.push({ ansicht, ...h });
        }
        return { halte, vollstaendig };
    }

    test('Fall 1 — kein Tabulatorhalt landet in der unsichtbaren Leiste', async ({ page }) => {
        test.setTimeout(240000);
        await starte(page);

        /** @type {any[]} */
        const alle = [];
        const unvollstaendig = [];
        for (const v of LAUF_ANSICHTEN) {
            const r = await lauf(page, v);
            if (!r.vollstaendig) unvollstaendig.push(v + ' (' + r.halte.length + ' Halte)');
            alle.push(...r.halte);
        }

        const phantome = alle.filter(h => h.inLeiste);
        const jeAnsicht = {};
        phantome.forEach(h => {
            jeAnsicht[h.ansicht] = (jeAnsicht[h.ansicht] || 0) + 1;
        });

        const befunde = [];
        if (phantome.length) {
            befunde.push(
                phantome.length +
                    ' Tabulatorhalte liegen in #floating-toolbar, einer Leiste mit opacity: 0 ' +
                    '(je Ansicht: ' +
                    JSON.stringify(jeAnsicht) +
                    '). Ein Fokusring auf einem durchsichtigen Vorfahren ist selbst ' +
                    'durchsichtig: der Fokus verschwindet dort in nichts. Ausgangswert bei der ' +
                    'Geburt dieser Ratsche: 12 je Ansicht (9 button.editor-btn + 3 ' +
                    'select.editor-select), ueber die sechs Ansichten hier also 72.'
            );
        }
        /* OHNE DIESE ZWEITE HAELFTE WAERE DIE NULL OBEN WERTLOS. Ein Lauf, der
           das Dokumentende nicht erreicht, hat die Leiste nie gesehen. */
        if (unvollstaendig.length) {
            befunde.push(
                'Der Tabulatorlauf hat das Dokumentende nicht erreicht in: ' +
                    unvollstaendig.join(', ') +
                    '. Diese Ansichten koennen die Leiste nicht besucht haben, ihre 0 sagt also ' +
                    'nichts.'
            );
        }
        expect(befunde).toEqual([]);

        // Der Lauf hat wirklich getabbt — sonst waere die Null wertlos.
        expect(alle.length).toBeGreaterThan(150);
    });

    test('Fall 2 — die Leiste blendet weiter weich ein und aus', async ({ page }) => {
        /* DIE NEBENWIRKUNGSPRUEFUNG, ausdruecklich verlangt. `visibility` ist
           uebergangsfaehig, aber anders als alles andere: zwischen `visible`
           und `hidden` liest JEDER Zwischenwert `visible`, der Umschlag
           passiert erst am Ende der Dauer. Steht `visibility` NICHT in der
           Eigenschaftsliste des Uebergangs, springt die Sichtbarkeit im ersten
           Bild — beim Einblenden sieht man dann die Leiste sofort hart statt
           aufziehend, beim Ausblenden verschwindet sie, waehrend die Deckkraft
           noch laeuft. Dieselbe Mechanik bewacht W4-R-02 am Quelltext; hier
           wird sie am laufenden Browser gemessen. */
        const dateiPfad = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
        await page.goto(dateiPfad);
        await waitForAppReady(page);

        await page.evaluate(() => window.switchView('wiki'));
        await page.waitForSelector('#view-wiki', { state: 'visible' });
        await page.click('[data-action="call"][data-value="showWikiForm"]');
        await page.fill('#wiki-title', 'Pruefeintrag Welle 6');
        await page.selectOption('#wiki-category', 'locations');

        const editor = page.locator('#wiki-content');
        await editor.click();
        await editor.pressSequentially('Probetext');
        await editor.selectText();
        await page.waitForFunction(() =>
            document.getElementById('floating-toolbar')?.classList.contains('visible')
        );
        /* DIE BLENDE MUSS ERST DURCH SEIN. Unmittelbar nach dem Setzen der
           Klasse liest `opacity` noch 0 — der Uebergang laeuft 150 ms. Ein
           Lesevorgang ohne dieses Warten meldete beim Schreiben dieser Datei
           "opacity 0" als Befund, und das war die Messung, nicht die App. */
        await page.waitForFunction(() => {
            const t = document.getElementById('floating-toolbar');
            return t ? parseFloat(getComputedStyle(t).opacity) > 0.9 : false;
        });

        const zustand = await page.evaluate(() => {
            const t = document.getElementById('floating-toolbar');
            const cs = getComputedStyle(t);
            return {
                sichtbar: t.classList.contains('visible'),
                visibility: cs.visibility,
                opacity: parseFloat(cs.opacity),
                uebergang: cs.transitionProperty,
                dauern: cs.transitionDuration
            };
        });

        const befunde = [];
        if (zustand.visibility !== 'visible') {
            befunde.push(
                'Die eingeblendete Leiste liest visibility: ' +
                    zustand.visibility +
                    ' — sie ist unsichtbar, obwohl sie offen ist.'
            );
        }
        if (!(zustand.opacity > 0.9)) {
            befunde.push('Die eingeblendete Leiste liest opacity ' + zustand.opacity);
        }
        const props = zustand.uebergang.split(',').map(s => s.trim());
        const dauern = zustand.dauern.split(',').map(s => s.trim());
        const dauerVon = p => {
            const i = props.indexOf(p);
            if (i < 0) return null;
            const d = dauern[i % dauern.length];
            const m = /^([\d.]+)(ms|s)$/.exec(d || '');
            return m ? Math.round(parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1)) : null;
        };
        const dOpacity = dauerVon('opacity');
        const dVisibility = dauerVon('visibility');
        if (!dOpacity) {
            befunde.push(
                'Die Leiste fuehrt keinen opacity-Uebergang mehr (' + zustand.uebergang + ')'
            );
        } else if (dVisibility === null) {
            befunde.push(
                'visibility steht nicht in der Eigenschaftsliste des Uebergangs (' +
                    zustand.uebergang +
                    '). Ohne sie springt die Sichtbarkeit im ersten Bild und die Blende ist hart.'
            );
        } else if (dVisibility < dOpacity) {
            befunde.push(
                'visibility laeuft ' +
                    dVisibility +
                    'ms, opacity ' +
                    dOpacity +
                    'ms — die letzten ' +
                    (dOpacity - dVisibility) +
                    'ms der Blende sieht niemand.'
            );
        }
        expect(befunde).toEqual([]);

        // Die Leiste ist auch wirklich bedienbar geblieben, nicht nur sichtbar.
        await expect(page.locator('#floating-toolbar [data-floating-action="bold"]')).toBeVisible();
    });

    test('Gegenprobe: der Erkenner findet die Halte, wenn man die Zeile zuruecknimmt', async ({
        page
    }) => {
        /* DIESE GEGENPROBE GILT IN BEIDE RICHTUNGEN und muss nach dem Schritt
           NICHT umgeschrieben werden: sie setzt `visibility: visible` zur
           Laufzeit zurueck an die Leiste und verlangt, dass die Halte dann
           wieder da sind. Vor dem Schritt beschreibt sie den Istzustand, nach
           dem Schritt den zurueckgedrehten — eine Gegenprobe, die nur in einer
           Richtung funktioniert, hat den Schritt nicht bewacht. */
        await starte(page);

        await page.addStyleTag({
            content: '#floating-toolbar { visibility: visible !important; }'
        });
        const { halte, vollstaendig } = await lauf(page, 'dashboard');
        expect(vollstaendig).toBe(true);
        const phantome = halte.filter(h => h.inLeiste);
        expect(phantome.length).toBeGreaterThanOrEqual(10);
        expect(phantome.filter(h => h.tag === 'button').length).toBeGreaterThanOrEqual(8);
        expect(phantome.filter(h => h.tag === 'select').length).toBeGreaterThanOrEqual(3);
    });
});
