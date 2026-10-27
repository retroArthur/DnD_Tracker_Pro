// @ts-check
/**
 * Anlegen nach abgebrochenem Bearbeiten: das Link-Formular (ABBRUCH, LINK)
 * =========================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer einen Link mit ✏️
 * oeffnet, die Bearbeitung auf irgendeinem Weg liegen laesst und danach
 * "+ Link" bzw. "+ Link hinzufügen" drueckt, legt einen NEUEN Link an** — der
 * bearbeitete bleibt feldgleich, in D, im Speicher und nach dem Neuladen; und
 * zeigt die Bearbeiten-ID beim Speichern ins Leere, wird die Eingabe als
 * neuer Link gespeichert, und die Meldung sagt das.
 *
 * Das Formular ist kein Dialog, sondern die Karte `#link-form-card` in der
 * Links-Ansicht (`assets/templates/view-tools.html:38-62`), ein- und
 * ausgeblendet ueber `style.display`. "+ Link" (`view-tools.html:35`) ist ein
 * UMSCHALTER: ist die Karte sichtbar, blendet derselbe Klick sie aus.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu e5bc99d, 1440x900, echte Klicks und Tasten (Sonden
 * der Gruppe "welt", `links.probe.js`; Saat: ein bearbeiteter Link und ein
 * Nachbar):
 *
 *   ✏️ → "+ Link" (blendet aus)     die Karte traegt den bearbeiteten Link samt
 *   → "+ Link" (blendet ein)        #edit-link-id; "Speichern" als "D&D Beyond"
 *   (ebenso nach Escape und nach    UEBERSCHREIBT ihn — Kategorie und
 *   einem Ansichtswechsel, die      Beschreibung bleiben die alten —, Meldung
 *   die Karte gar nicht schliessen) "Link aktualisiert"; in D, im Speicher und
 *                                   nach dem Neuladen
 *   ✏️ → "+ Link" → 🗑️ → "+ Link   NICHTS gespeichert, D.links leer, KEINE
 *   hinzufügen" der leeren Liste    Meldung, ein leerer Rueckgaengig-Eintrag
 *                                   "Link bearbeitet"
 *   ✏️ → 🗑️ bei offener Karte → 💾  ebenso still verloren
 *   ✏️ → Strg+Z im Feld → 💾        ebenso still verloren
 *   ✏️ → "Abbrechen" → "+ Link"     korrekt — "Abbrechen" leert (Fall 4)
 *
 * DIE URSACHEN, alle in `features/shops/links.js`:
 *   :62-68   toggleLinkForm() schaltet nur `display` um und leert nie. Es ist
 *            der Weg BEIDER Anlege-Knoepfe ("+ Link" und "+ Link hinzufügen"
 *            der leeren Liste, :34-42) — und bei sichtbarer Karte zugleich ein
 *            Schliessweg, der nicht leert.
 *   :90      pushUndo('Link bearbeitet') laeuft VOR der Pruefung, ob es den
 *            Link noch gibt — darum der leere Rueckgaengig-Eintrag.
 *   :91-96   `if (editId) { … if (idx > -1) { …; showToast(…) } }` ohne
 *            `else`: eine ID ins Leere speichert nichts und meldet nichts (die
 *            Meldung steht nur im Erfolgszweig, :95); :102-104 schliessen die
 *            Karte danach, als waere alles gut.
 *   :137-147 deleteLink() laesst eine offene Bearbeitung des geloeschten Links
 *            stehen, samt ID.
 * Dazu: Escape (`systems/spellslots/keyboard-shortcuts.js:404` ff.) kennt nur
 * Dialoge, und switchView() (`systems/spellslots/navigation.js`) fasst die
 * Karte nicht an — beide lassen die Bearbeitung offen, das naechste "+ Link"
 * blendet sie nur aus. Strg+Z ist "immer aktiv"
 * (`keyboard-shortcuts.js:514-518`), auch mit dem Fokus in einem Feld der
 * Karte, und nimmt D unter der offenen Bearbeitung zurueck.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag ABBRUCH), die diese Datei prueft
 *
 *   R1  Nach Bearbeiten und einem Abbruch-Weg zeigt JEDER Anlege-Weg ein
 *       Formular ohne Bearbeiten-ID und ohne Werte des bearbeiteten Links;
 *       Speichern legt einen NEUEN an, der bearbeitete bleibt feldgleich.
 *       Anlege-Wege: "+ Link" (1, 2, 4), "+ Link hinzufügen" (3).
 *       Abbruch-Wege: Escape (1), Ansichtswechsel (2), "+ Link" bei offener
 *       Bearbeitung (3; in 1 und 2 heute der erste der zwei Klicks),
 *       "Abbrechen" (4, Waechter — leert schon heute).
 *   R2  Ein nie gespeicherter Entwurf ueberlebt Zuklappen per "+ Link",
 *       Escape und Ansichtswechsel; der naechste Anlege-Weg verwirft ihn
 *       nicht — geprueft mit BEIDEN Anlege-Knoepfen. (7, Waechter)
 *   R4  Zeigt die Bearbeiten-ID beim Speichern ins Leere — geloescht (5) oder
 *       per Strg+Z mit dem Fokus im Feld zurueckgenommen (6) —, wird die
 *       Eingabe als NEUER Link gespeichert, mit einer Warnung, ohne
 *       "Link aktualisiert" und ohne leeren Eintrag "Link bearbeitet".
 *   Kontrolle: ✏️ → 💾 → "+ Link" ist schon heute korrekt. (8)
 * R3 entfaellt: fuer Links gibt es weder die Taste n noch einen Eintrag der
 * Befehlspalette (gemessen: Karte bleibt versteckt bzw. 0 Treffer). R5–R8
 * gelten anderen Formularen.
 *
 * WIE DIE FAELLE ANLEGEN: der Anlege-Knopf wird geklickt, BIS die Karte
 * sichtbar ist, hoechstens zweimal. Steht eine Bearbeitung noch offen (nach
 * Escape oder Ansichtswechsel), blendet der erste Klick sie heute aus und
 * erst der zweite ein. Ob "+ Link" bei sichtbarer Bearbeitung kuenftig
 * ausblendet oder gleich auf ein leeres Anlegen umschaltet, ist eine offene
 * Entscheidung des Fixes — die Faelle pruefen, was der Nutzer danach VOR
 * SICH hat, nicht die Zahl der Klicks. "Leer" heisst: so, wie die Karte
 * frisch nach dem Laden war (jeder Fall liest diesen Stand vor dem ersten ✏️).
 *
 * GEGENPROBE (beim Schreiben, nicht Teil der Datei): mit der Fix-Skizze des
 * Berichts — toggleLinkForm() leert beim EINblenden, wenn #edit-link-id
 * gesetzt ist; saveLink() prueft die ID ueber `D.links` vor pushUndo() und
 * legt eine verwaiste als neu an, mit Warnung — zur Laufzeit nachgebildet,
 * liefen alle acht Faelle gruen; ebenso mit der Variante, in der "+ Link"
 * eine offene Bearbeitung gleich in ein leeres Anlegen umschaltet. ROT
 * wurden dagegen die nachgebildeten FALSCHEN Fixe, jeder an seiner Regel:
 * Anlegen leert immer bzw. der Knopf der leeren Liste leert immer bzw.
 * Zuklappen per "+ Link" leert (alle drei: Fall 7); nur die ID wird
 * geleert, die Werte bleiben (1-3); die verwaiste Eingabe wird mit Warnung
 * verworfen (5, 6); die Existenzpruefung laeuft ueber `EntityLookup` (5,
 * siehe unten).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER ZWISCHENSPEICHER VON `EntityLookup` — UND WARUM FALL (5) DIREKT GEHT
 *
 * editLink() (`links.js:107`) und deleteLink() (`:139`) lesen ueber
 * `EntityLookup.link()`, und dessen Zwischenspeicher ist nach dem Laden
 * EINGESCHALTET: renderAll() ruft renderInit()
 * (`features/render-dashboard.js:55`), das ihn einschaltet
 * (`features/initiative.js:113`) und bei 0 Kaempfern in `:121-125`
 * zurueckkehrt, ohne ihn zu leeren. Ein zweites ✏️ desselben Links nach einem
 * Speichern zeigt dann den alten Stand — ein ANDERER Fehler mit eigenem PR
 * (Kritik L1). Diese Datei haengt an ihm nicht:
 *  - Kein Fall bearbeitet denselben Link zweimal mit Speichern dazwischen.
 *  - Die Faelle ausser (5) klicken nach dem Laden zuerst in die NPC-Ansicht
 *    — deren Darstellung leert den Zwischenspeicher und schaltet ihn ab
 *    (Kritik K1b) — und erst dann in die Links-Ansicht. Wer L1 behebt, darf
 *    den Umweg stehen lassen; er schadet nicht.
 *  - Fall (5) geht dagegen DIREKT von der Startansicht in die Links-Ansicht,
 *    so, wie ein Nutzer die App nach dem Laden vorfindet: der
 *    Zwischenspeicher ist an (nachgemessen: nach dem Laden, nach
 *    Start → Links und nach ✏️ eingeschaltet, `links-1` darin). Das haengt
 *    NICHT an L1 — es gibt kein zweites ✏️ —, prueft aber, worauf R4 baut:
 *    eine Existenzpruefung ueber `EntityLookup` saehe den geloeschten Link
 *    noch (deleteLink() hat ihn eben dort abgelegt) und verloere die Eingabe
 *    wie heute. Mit dem Umweg ueber die NPCs war genau dieser falsche Fix
 *    gruen. (Strg+Z in Fall (6) laeuft ueber renderAll(), das den
 *    Zwischenspeicher leert; dort fiele der Fehler nicht auf.)
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Der Kartenkopf heisst auch beim Bearbeiten "Link hinzufügen" (V6), der
 * veraltete Zwischenspeicher selbst (L1), der Kampagnen-Import "Ersetzen" bei
 * offener Karte (L2), das Telefon (L3) — eigene Vorgaenge. Ob deleteLink()
 * die Karte abraeumen sollte, war im Bericht offen; der Vertrag hat es mit
 * R4 entschieden ("geloescht, waehrend das Formular offen war" → als neuer
 * Link gespeichert), und Fall (5) verlangt genau das: die Eingabe steht nach
 * dem Loeschen noch da und wird gespeichert.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Der Link, der bearbeitet wird: mit JEDEM Feld, das das Formular fuehrt,
 *  jedes anders als im frischen Formular (Kategorie NICHT "rules", die erste
 *  Option), dazu ein Feld, das kein Formular kennt — sonst koennte ein
 *  Ueberschreiben ein Feld treffen, ohne dass ein Fall es merkt. */
const WELTKARTE = {
    id: 1,
    title: 'Weltkarte',
    url: 'https://example.org/karte',
    category: 'maps',
    description: '<p>Die grosse Karte</p>',
    eigenesFeld: 'bleibt'
};

/** Der Nachbar — er darf nie etwas abbekommen. */
const SRD = {
    id: 2,
    title: 'SRD',
    url: 'https://example.org/srd',
    category: 'rules',
    description: ''
};

/** Was die Faelle als neuen Link eintippen. */
const NEU = { title: 'D&D Beyond', url: 'https://example.org/ddb' };

/** @param {object[]} links */
function seed(links) {
    return {
        _version: '99.0.0',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            markdownOnboardingSeen: true,
            enableMarkdownShortcuts: true
        },
        randomTables: [],
        timers: [],
        shops: [],
        campaign: {},
        characters: [],
        npcs: [],
        locations: [],
        quests: [],
        loot: [],
        spells: [],
        wiki: [],
        links,
        filters: [],
        factions: [],
        tags: [],
        sessionNotes: [],
        encounters: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 1,
            npcs: 1,
            locations: 1,
            quests: 1,
            encounters: 1,
            spells: 1,
            loot: 1,
            items: 1,
            wiki: 1,
            links: Math.max(0, ...links.map(l => l.id)) + 1,
            sessionNotes: 1,
            randomTables: 1,
            filters: 1,
            factions: 1
        }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App (`EventDelegation` meldet einen
 * geworfenen Handler NUR dort und als `console.error`). "Failed to load
 * resource" ist Netzrauschen (Schriften unter file://).
 * @param {import('@playwright/test').Page} page
 */
function fehlerFangen(page) {
    /** @type {string[]} */
    const fehler = [];
    page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            fehler.push('console.error: ' + m.text().split('\n')[0]);
        }
    });
    return {
        /** Alles bisher Gefangene plus das Fehlerlog der App. */
        async alle() {
            const log = await page.evaluate(() =>
                (window.ErrorHandler?.getRecentErrors(50) || []).map(
                    e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
                )
            );
            return [...fehler, ...log];
        }
    };
}

/**
 * Laedt breit, saet EINMAL je Tab und geht per Klick ueber die NPC-Ansicht
 * in die Links-Ansicht — mit `{ direkt: true }` ohne den Umweg, von der
 * Startansicht aus (warum: siehe Kopf, "Der Zwischenspeicher"). Die Saat
 * steht hinter einer sessionStorage-Sperre: ein `page.reload()` liest dann,
 * was die App gespeichert hat, statt die Saat neu zu schreiben.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} links
 * @param {{ direkt?: boolean }} [weg]
 */
async function linksLaden(page, links, weg = {}) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('link-anlegen-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('link-anlegen-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(links)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN, sonst misst ein Speicher-Fall nichts:
    // repariert `load()` die Saat, schreibt `saveAutomatic()` spaeter den
    // ganzen Stand aus D (siehe npc-formular.spec.js). Erkennbar daran, dass
    // `_version` der Saat ueberschrieben wird; kommt binnen 4 s keine, steht
    // auch keine aus.
    await page
        .waitForFunction(
            schluessel => {
                try {
                    return (
                        JSON.parse(localStorage.getItem(schluessel) || '{}')._version !== '99.0.0'
                    );
                } catch {
                    return false;
                }
            },
            SPEICHER,
            { timeout: 4000 }
        )
        .catch(() => {});
    if (!weg.direkt) {
        await navigateToTab(page, 'npcs');
        await expect(page.locator('#view-npcs')).toBeVisible();
    }
    await navigateToTab(page, 'links');
    await expect(page.locator('#view-links')).toBeVisible();
    expect(
        await page.evaluate(() => window.D.links.map(l => l.id)),
        'Vorbedingung: die Saat ist in D angekommen'
    ).toEqual(links.map(l => l.id));
}

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/** Die Karte und alle ihre Felder, wie das Template sie fuehrt.
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const karte = document.getElementById('link-form-card');
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value;
        return {
            sichtbar: karte ? getComputedStyle(karte).display !== 'none' : null,
            id: wert('edit-link-id'),
            titel: wert('link-title'),
            url: wert('link-url'),
            kategorie: wert('link-cat'),
            beschreibung: document.getElementById('link-desc')?.textContent?.trim()
        };
    });
}

/** Die Karte, wie sie frisch nach dem Laden ist — sichtbar gemacht. Das ist
 *  "leer": so muss jeder Anlege-Weg sie zeigen.
 *  @param {import('@playwright/test').Page} page */
async function frischesFormular(page) {
    const f = await formular(page);
    expect(f.id, 'Vorbedingung: die frische Karte traegt keine Bearbeiten-ID').toBe('');
    return { ...f, sichtbar: true };
}

/** "+ Link" in der Werkzeugleiste — ueber Rolle und Namen, nicht ueber
 *  `data-action`: der Knopf ist derselbe vor und nach dem Fix, sein
 *  Handler vielleicht nicht.
 *  @param {import('@playwright/test').Page} page */
function plusLink(page) {
    return page.locator('#view-links').getByRole('button', { name: '+ Link', exact: true });
}

/** "+ Link hinzufügen" der LEEREN Liste (`links.js:34-42`, nur bei leerem
 *  D.links; bei leerem Filterergebnis gibt es ihn nicht).
 *  @param {import('@playwright/test').Page} page */
function leerKnopf(page) {
    return page.locator('#links-list').getByRole('button', { name: '+ Link hinzufügen' });
}

/** Ein Knopf der Karte, ueber seinen Text.
 *  @param {import('@playwright/test').Page} page
 *  @param {'Speichern'|'Abbrechen'} name */
function kartenKnopf(page, name) {
    return page.locator('#link-form-card').getByRole('button', { name, exact: true });
}

/** Ist die Karte sichtbar?
 *  @param {import('@playwright/test').Page} page */
async function karteSichtbar(page) {
    return (await formular(page)).sichtbar === true;
}

/**
 * Ein Anlege-Weg: den Knopf klicken, BIS die Karte sichtbar ist (hoechstens
 * zweimal — siehe Kopf, "Wie die Faelle anlegen").
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} knopf
 */
async function anlegen(page, knopf) {
    for (let i = 0; i < 2; i++) {
        await knopf.click();
        await page.waitForTimeout(100);
        if (await karteSichtbar(page)) return;
    }
    await expect(
        page.locator('#link-form-card'),
        'der Anlege-Weg muss die Karte zeigen'
    ).toBeVisible();
}

/** ✏️ an einem Link der Liste — die Karte steht danach mit seiner ID offen.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function bearbeiten(page, id) {
    await page.locator(`#links-list [data-action="edit-link"][data-id="${id}"]`).click();
    await expect(page.locator('#link-form-card')).toBeVisible();
    await expect(page.locator('#edit-link-id'), 'Vorbedingung: ✏️ setzt die ID').toHaveValue(
        String(id)
    );
}

/** 🗑️ an einem Link der Liste; die Rueckfrage wird bestaetigt. Wartet das
 *  entprellte Schreiben des Loeschens ab — sonst koennte es erst NACH dem
 *  `revStand()` des folgenden Speicherns landen, dessen Warten erfuellen und
 *  den Speicher lesen lassen, bevor das Speichern selbst geschrieben ist.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function loeschen(page, id) {
    const rev = await revStand(page);
    page.once('dialog', d => d.accept());
    await page.locator(`#links-list [data-action="delete-link"][data-id="${id}"]`).click();
    await expect(
        page.locator(`#links-list [data-action="edit-link"][data-id="${id}"]`)
    ).toHaveCount(0);
    await geschriebenSeit(page, rev, `🗑️ Link ${id}`);
}

/** Klick in ein Feld der Karte, alles markieren, neu tippen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} feld
 *  @param {string} text */
async function eintippen(page, feld, text) {
    await page.locator(feld).click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type(text);
}

/** "Speichern" der Karte und das entprellte Schreiben abwarten.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} was */
async function speichern(page, was) {
    const rev = await revStand(page);
    await kartenKnopf(page, 'Speichern').click();
    await geschriebenSeit(page, rev, was);
}

/** Alle Links aus D, ohne `undefined`-Felder (dieselbe Form wie im Speicher).
 *  @param {import('@playwright/test').Page} page */
function linksInD(page) {
    return page.evaluate(() => JSON.parse(JSON.stringify(window.D.links ?? null)));
}

/** Alle Links aus dem Speicher.
 *  @param {import('@playwright/test').Page} page */
function linksImSpeicher(page) {
    return page.evaluate(schluessel => {
        try {
            return JSON.parse(localStorage.getItem(schluessel) || '{}').links ?? null;
        } catch {
            return '(nicht lesbar)';
        }
    }, SPEICHER);
}

/** Die Nummer der juengsten Meldung (Ereignis-Log und Kampfprotokoll werden
 *  aus `showToast()` beschickt; das Protokoll fuehrt sie nummeriert).
 *  @param {import('@playwright/test').Page} page */
function meldungsStand(page) {
    return page.evaluate(() =>
        (window.getCombatLog?.() || []).reduce((m, e) => Math.max(m, e.nr), 0)
    );
}
/** Alle Meldungen nach `nr`, aelteste zuerst, als `typ: Text`.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} nr */
function meldungenSeit(page, nr) {
    return page.evaluate(
        nr =>
            (window.getCombatLog?.() || [])
                .filter(e => e.nr > nr)
                .sort((a, b) => a.nr - b.nr)
                .map(e => `${e.typ}: ${e.text}`),
        nr
    );
}

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad der Persistenz setzt
 *  ihn neu, auch wenn der Inhalt gleich bleibt. Ohne ihn waere "der Speicher
 *  traegt den alten Stand" nicht von "es wurde gar nicht geschrieben" zu
 *  unterscheiden.
 *  @param {import('@playwright/test').Page} page */
function revStand(page) {
    return page.evaluate(schluessel => localStorage.getItem(schluessel + '_rev'), SPEICHER);
}
/** Wartet, bis seit `rev` geschrieben wurde.
 *  @param {import('@playwright/test').Page} page
 *  @param {string|null} rev
 *  @param {string} was */
async function geschriebenSeit(page, rev, was) {
    await expect
        .poll(() => revStand(page), {
            timeout: SOFORT_MS,
            message: `${was}: save() muss schreiben (entprellt 300 ms)`
        })
        .not.toBe(rev);
}

/** Der oberste Eintrag des Rueckgaengig-Stapels.
 *  @param {import('@playwright/test').Page} page */
function undoKopf(page) {
    return page.evaluate(() => (undoStack.length ? undoStack[undoStack.length - 1].action : null));
}

/**
 * Die Zusagen von R1 an einen Link-Bestand — aus D, aus dem Speicher oder
 * nach dem Neuladen: der bearbeitete Link feldgleich, der Nachbar feldgleich,
 * genau ein Link mehr, und der neue traegt NICHTS vom bearbeiteten (keine ID,
 * keine Kategorie, keine Beschreibung). Welche ID er bekommt, entscheidet
 * nextId(), nicht diese Datei — nur eine der vorhandenen darf es nicht sein.
 * @param {any} liste
 * @param {string} wo
 * @param {{ kategorie: string|undefined }} frisch
 */
function r1Pruefen(liste, wo, frisch) {
    const links = Array.isArray(liste) ? liste : [];
    weich(
        links.find(l => l.id === 1) ?? null,
        `${wo}: der bearbeitete Link bleibt feldgleich`
    ).toEqual(WELTKARTE);
    weich(links.find(l => l.id === 2) ?? null, `${wo}: der Nachbar bleibt feldgleich`).toEqual(SRD);
    weich(
        links.map(l => l.title),
        `${wo}: der bearbeitete bleibt, ein NEUER Link kommt dazu`
    ).toEqual([WELTKARTE.title, SRD.title, NEU.title]);
    const neu = links.find(l => l.title === NEU.title);
    weich(
        neu
            ? {
                  url: neu.url,
                  category: neu.category,
                  description: neu.description,
                  eigeneId: neu.id !== 1 && neu.id !== 2
              }
            : null,
        `${wo}: der neue Link traegt nichts vom bearbeiteten`
    ).toEqual({ url: NEU.url, category: frisch.kategorie, description: '', eigeneId: true });
}

/**
 * Der gemeinsame Schluss der R1-Faelle: die Karte ist leer, der neue Link
 * wird eingetippt und gespeichert, dann D, Speicher und Neuladen.
 * @param {import('@playwright/test').Page} page
 * @param {any} frisch
 * @param {string} weg
 */
async function anlegenUndPruefen(page, frisch, weg) {
    // WEICH: ein roter Lauf soll danach auch den Verlust nennen.
    weich(await formular(page), `${weg}: die Karte muss leer und im Anlege-Zustand sein`).toEqual(
        frisch
    );
    await eintippen(page, '#link-title', NEU.title);
    await eintippen(page, '#link-url', NEU.url);
    const stand = await meldungsStand(page);
    await speichern(page, `${weg} → Speichern`);

    r1Pruefen(await linksInD(page), 'D', frisch);
    weich(await meldungenSeit(page, stand), 'die Meldung des Speicherns').toContain(
        'success: Link hinzugefügt'
    );
    r1Pruefen(await linksImSpeicher(page), 'localStorage', frisch);

    await page.reload();
    await waitForAppReady(page);
    r1Pruefen(await linksInD(page), 'D nach dem Neuladen', frisch);
}

// ===========================================================================
// (1) ✏️ → ESCAPE → "+ LINK" LEGT NEU AN
// ===========================================================================
//
// Escape schliesst die Karte heute gar nicht — die Bearbeitung bleibt mit
// ihrer ID stehen. Der Nutzer drueckt "+ Link": der erste Klick blendet aus,
// der zweite ein, und die Karte traegt die Weltkarte samt ID. Gemessen
// (L-V1-escape): "Speichern" ueberschreibt die Weltkarte.
test('(1) nach ✏️ und Escape legt "+ Link" einen NEUEN Link an', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await linksLaden(page, [WELTKARTE, SRD]);
    const frisch = await frischesFormular(page);

    await bearbeiten(page, 1);
    await page.keyboard.press('Escape');
    await anlegen(page, plusLink(page));
    await anlegenUndPruefen(page, frisch, '✏️ → Escape → "+ Link"');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2) ✏️ → ANSICHTSWECHSEL → "+ LINK" LEGT NEU AN
// ===========================================================================
//
// Ueber die Navigation in die Startansicht und zurueck — auch das laesst die
// Karte heute mit der ID stehen (L-V1-ansicht).
test('(2) nach ✏️ und einem Ansichtswechsel legt "+ Link" einen NEUEN Link an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await linksLaden(page, [WELTKARTE, SRD]);
    const frisch = await frischesFormular(page);

    await bearbeiten(page, 1);
    await navigateToTab(page, 'dashboard');
    await expect(page.locator('#view-dashboard')).toBeVisible();
    await navigateToTab(page, 'links');
    await expect(page.locator('#view-links')).toBeVisible();
    await anlegen(page, plusLink(page));
    await anlegenUndPruefen(page, frisch, '✏️ → Ansichtswechsel → "+ Link"');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) ✏️ → "+ LINK" (ZUKLAPPEN) → 🗑️ → "+ LINK HINZUFÜGEN" LEGT AN
// ===========================================================================
//
// Der Knopf der LEEREN Liste ist der Weg, auf den man nach dem Loeschen des
// letzten Links gestossen wird — oft nachdem man ihn sich in ✏️ angesehen und
// die Karte mit "+ Link" wieder zugeklappt hat. Gemessen (L-V3-leer-plus):
// die Karte traegt die ID des geloeschten Links, "Speichern" speichert NICHTS,
// meldet NICHTS und hinterlaesst einen leeren Eintrag "Link bearbeitet".
//
// Heute klappt der Klick auf "+ Link" die Bearbeitung zu. Ob er das nach dem
// Fix noch tut oder gleich auf ein leeres Anlegen umschaltet, ist dessen
// offene Entscheidung (siehe Kopf) — darum wird hier NICHT zugesichert, dass
// die Karte danach verborgen ist. Beides muss beim Knopf der leeren Liste
// zum selben Ergebnis fuehren.
test('(3) nach ✏️, "+ Link" und 🗑️ legt "+ Link hinzufügen" der leeren Liste einen NEUEN Link an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await linksLaden(page, [WELTKARTE]);
    const frisch = await frischesFormular(page);

    await bearbeiten(page, 1);
    await plusLink(page).click();
    await loeschen(page, 1);
    await expect(leerKnopf(page), 'Vorbedingung: die leere Liste bietet ihren Knopf').toBeVisible();

    await anlegen(page, leerKnopf(page));
    weich(await formular(page), '"+ Link hinzufügen" nach dem Loeschen').toEqual(frisch);
    await eintippen(page, '#link-title', NEU.title);
    await eintippen(page, '#link-url', NEU.url);
    const stand = await meldungsStand(page);
    await speichern(page, '"+ Link hinzufügen" → Speichern');

    /** @param {any} liste */
    const kurz = liste =>
        (Array.isArray(liste) ? liste : []).map(l => ({
            title: l.title,
            url: l.url,
            category: l.category,
            description: l.description
        }));
    const erwartet = [{ ...NEU, category: frisch.kategorie, description: '' }];
    weich(kurz(await linksInD(page)), 'D: genau der neue Link').toEqual(erwartet);
    weich(await meldungenSeit(page, stand), 'die Meldung des Speicherns').toContain(
        'success: Link hinzugefügt'
    );
    weich(await undoKopf(page), 'der Rueckgaengig-Eintrag').toBe('Link erstellt');
    weich(kurz(await linksImSpeicher(page)), 'localStorage: genau der neue Link').toEqual(erwartet);
    await page.reload();
    await waitForAppReady(page);
    weich(kurz(await linksInD(page)), 'D nach dem Neuladen').toEqual(erwartet);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) WAECHTER: ✏️ → "ABBRECHEN" → "+ LINK" LEGT NEU AN
// ===========================================================================
//
// Schon vor dem Fix gruen: "Abbrechen" (`view-tools.html:60`) leert die Karte
// (L-V1-abbrechen). Der Fall haelt den einzigen heute leerenden Abbruch-Weg
// fest, damit der Fix ihn nicht nebenbei verliert.
test('(4) nach ✏️ und "Abbrechen" legt "+ Link" einen NEUEN Link an (Waechter)', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await linksLaden(page, [WELTKARTE, SRD]);
    const frisch = await frischesFormular(page);

    await bearbeiten(page, 1);
    await kartenKnopf(page, 'Abbrechen').click();
    await expect(page.locator('#link-form-card')).toBeHidden();
    await anlegen(page, plusLink(page));
    await anlegenUndPruefen(page, frisch, '✏️ → Abbrechen → "+ Link"');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (5) WIRD DER LINK UNTER DER OFFENEN KARTE GELOESCHT, GEHT DIE EINGABE NICHT VERLOREN
// ===========================================================================
//
// Anders als ein Dialog deckt die Karte die Liste nicht ab: 🗑️ ist bei
// offener Bearbeitung erreichbar. Gemessen (L-V3-offen): die Karte bleibt mit
// der ID des geloeschten Links stehen, "Speichern" speichert NICHTS, meldet
// NICHTS, und der Rueckgaengig-Stapel bekommt einen leeren Eintrag
// "Link bearbeitet". Eingetippt wird VOR dem Loeschen — so prueft der Fall
// auch, dass das Loeschen die laufende Eingabe nicht verwirft.
//
// Der Fall geht DIREKT von der Startansicht in die Links-Ansicht, ohne den
// Umweg ueber die NPCs: so steht die App nach dem Laden da, mit
// eingeschaltetem Zwischenspeicher von `EntityLookup`. Eine
// Existenzpruefung, die ueber ihn liefe, saehe den geloeschten Link noch —
// genau das soll hier rot werden (siehe Kopf, "Der Zwischenspeicher").
test('(5) ✏️, Eingabe, 🗑️ desselben Links bei offener Karte: Speichern legt ihn neu an und sagt es', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await linksLaden(page, [WELTKARTE, SRD], { direkt: true });

    await bearbeiten(page, 1);
    await eintippen(page, '#link-title', 'Weltkarte 2');
    await loeschen(page, 1);
    const nachLoeschen = await formular(page);
    weich(nachLoeschen, 'die Eingabe steht nach dem Loeschen noch in der Karte').toEqual({
        sichtbar: true,
        id: '1',
        titel: 'Weltkarte 2',
        url: WELTKARTE.url,
        kategorie: WELTKARTE.category,
        beschreibung: 'Die grosse Karte'
    });
    // Ohne sichtbare Karte gaebe es nichts mehr zu speichern — dann nennt die
    // weiche Zusage oben den Grund.
    expect(nachLoeschen.sichtbar, 'die Karte muss nach dem Loeschen offen sein').toBe(true);

    const stand = await meldungsStand(page);
    await speichern(page, '🗑️ → Speichern');

    /** @param {any} liste */
    const kurz = liste =>
        (Array.isArray(liste) ? liste : []).map(
            l => `${l.title}|${l.url}|${l.category}|${l.description}`
        );
    const erwartet = [
        `${SRD.title}|${SRD.url}|${SRD.category}|`,
        `Weltkarte 2|${WELTKARTE.url}|${WELTKARTE.category}|${WELTKARTE.description}`
    ];
    weich(kurz(await linksInD(page)), 'D: die Eingabe ist als neuer Link gespeichert').toEqual(
        erwartet
    );
    weich(
        (await linksInD(page)).find(l => l.id === 2) ?? null,
        'D: der Nachbar bleibt feldgleich'
    ).toEqual(SRD);
    const meldungen = await meldungenSeit(page, stand);
    weich(
        meldungen,
        'keine Erfolgsmeldung fuer ein Aktualisieren, das nicht stattfand'
    ).not.toContain('success: Link aktualisiert');
    weich(
        meldungen.some(
            m =>
                m.startsWith('warning: ') &&
                /existiert nicht mehr/.test(m) &&
                /neue[rn]? Link/.test(m)
        ),
        `die Meldung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
    weich(await undoKopf(page), 'kein leerer Eintrag "Link bearbeitet"').toBe('Link erstellt');
    weich(kurz(await linksImSpeicher(page)), 'localStorage').toEqual(erwartet);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) NIMMT STRG+Z DEN LINK UNTER DER OFFENEN KARTE ZURUECK, GEHT DIE EINGABE NICHT VERLOREN
// ===========================================================================
//
// Strg+Z wirkt auch mit dem Fokus im URL-Feld und nimmt hier das Anlegen von
// "Neu A" zurueck, waehrend ✏️ denselben Link offen hat. Die Karte haelt die
// Eingabe, die ID zeigt ins Leere. Gemessen (L-V4): nichts gespeichert,
// keine Meldung, leerer Eintrag "Link bearbeitet".
test('(6) ✏️ eines Links, den Strg+Z im Feld zuruecknimmt: Speichern legt ihn neu an und sagt es', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await linksLaden(page, [WELTKARTE, SRD]);

    await anlegen(page, plusLink(page));
    await eintippen(page, '#link-title', 'Neu A');
    await eintippen(page, '#link-url', 'https://example.org/a');
    await speichern(page, '"Neu A" anlegen');
    const neuA = await page.evaluate(
        () => window.D.links.find(l => l.title === 'Neu A')?.id ?? null
    );
    expect(neuA, '"Neu A" muss angelegt sein').not.toBeNull();

    await bearbeiten(page, /** @type {number} */ (neuA));
    await page.locator('#link-url').click();
    await page.keyboard.press('End');
    await page.keyboard.type('/neu');
    const revVorUndo = await revStand(page);
    await page.keyboard.press('Control+z');
    await expect
        .poll(async () => (await linksInD(page)).map(l => l.title), {
            message: 'Vorbedingung: Strg+Z nimmt "Neu A" in D zurueck'
        })
        .toEqual([WELTKARTE.title, SRD.title]);
    // Das Schreiben des Strg+Z abwarten — sonst koennte es NACH dem
    // Speichern unten landen und dessen Messung verfaelschen.
    await geschriebenSeit(page, revVorUndo, 'Strg+Z');
    expect(
        await formular(page),
        'Vorbedingung: die Karte ist noch offen, mit der Eingabe'
    ).toMatchObject({ sichtbar: true, id: String(neuA), url: 'https://example.org/a/neu' });

    const stand = await meldungsStand(page);
    await speichern(page, 'Strg+Z → Speichern');

    /** @param {any} liste */
    const kurz = liste => (Array.isArray(liste) ? liste : []).map(l => `${l.title}|${l.url}`);
    const erwartet = [
        `${WELTKARTE.title}|${WELTKARTE.url}`,
        `${SRD.title}|${SRD.url}`,
        'Neu A|https://example.org/a/neu'
    ];
    weich(kurz(await linksInD(page)), 'D: die Eingabe ist gespeichert').toEqual(erwartet);
    const meldungen = await meldungenSeit(page, stand);
    weich(
        meldungen,
        'keine Erfolgsmeldung fuer ein Aktualisieren, das nicht stattfand'
    ).not.toContain('success: Link aktualisiert');
    weich(
        meldungen.some(
            m =>
                m.startsWith('warning: ') &&
                /existiert nicht mehr/.test(m) &&
                /neue[rn]? Link/.test(m)
        ),
        `die Meldung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
    weich(await undoKopf(page), 'kein leerer Eintrag "Link bearbeitet"').toBe('Link erstellt');
    weich(kurz(await linksImSpeicher(page)), 'localStorage').toEqual(erwartet);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (7) WAECHTER: EIN ANLEGE-ENTWURF UEBERLEBT ESCAPE, ANSICHTSWECHSEL UND ZUKLAPPEN
// ===========================================================================
//
// Schon vor dem Fix gruen (L-V5-plus/-escape/-ansicht): ein nie
// gespeicherter Entwurf (keine ID) bleibt stehen. Der Fix darf beim Anlegen
// NUR leeren, wenn ein Bearbeiten Reste hinterliess — sonst verwirft "+ Link"
// die laufende Eingabe. "Abbrechen" leert dagegen auch einen Entwurf, heute
// wie kuenftig: das ist seine Aufgabe (cancelLinkEdit, im Vertrag die
// Leeren-Funktion des Formulars), darum kommt es hier nicht vor.
//
// Die Liste ist LEER gesaet, damit es BEIDE Anlege-Knoepfe gibt: ein Fix,
// der nur einem von ihnen einen eigenen, immer leerenden Weg gibt, wird so
// auch rot. Jeder Abbruch-Weg wird fuer sich gegangen und danach der
// Entwurf gelesen — das Zuklappen per "+ Link" ZUERST, solange die Karte
// sicher sichtbar ist: liefe es nur hinter Escape und Ansichtswechsel, fiele
// ein Fix, der Escape die Karte schliessen und "+ Link" beim Zuklappen leeren
// laesst, durch (nachgebildet: so war der Fall gruen).
test('(7) ein Anlege-Entwurf ueberlebt Escape, Ansichtswechsel und Zuklappen per "+ Link" (Waechter)', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await linksLaden(page, []);
    await expect(leerKnopf(page), 'Vorbedingung: die leere Liste bietet ihren Knopf').toBeVisible();

    const entwurf = {
        sichtbar: true,
        id: '',
        titel: 'Entwurf',
        url: 'https://example.org/entwurf',
        kategorie: 'tools',
        beschreibung: 'Notiz'
    };
    await anlegen(page, plusLink(page));
    await eintippen(page, '#link-title', entwurf.titel);
    await eintippen(page, '#link-url', entwurf.url);
    await page.locator('#link-cat').selectOption(entwurf.kategorie);
    await page.locator('#link-desc').click();
    await page.keyboard.type(entwurf.beschreibung);

    // Zuklappen: "+ Link" bleibt fuer die sichtbare Karte ein Umschalter
    // (Vertrag R3: "Zuklappen ist ein Abbruch") — weich, damit ein roter Lauf
    // auch den Entwurf danach nennt.
    await plusLink(page).click();
    await weich(page.locator('#link-form-card'), '"+ Link" klappt die Karte zu').toBeHidden();
    await anlegen(page, leerKnopf(page));
    weich(await formular(page), 'der Entwurf nach Zuklappen → "+ Link hinzufügen"').toEqual(
        entwurf
    );

    await page.keyboard.press('Escape');
    await anlegen(page, plusLink(page));
    weich(await formular(page), 'der Entwurf nach Escape → "+ Link"').toEqual(entwurf);

    await navigateToTab(page, 'dashboard');
    await expect(page.locator('#view-dashboard')).toBeVisible();
    await navigateToTab(page, 'links');
    await expect(page.locator('#view-links')).toBeVisible();
    await anlegen(page, leerKnopf(page));
    weich(await formular(page), 'der Entwurf nach Ansichtswechsel → "+ Link hinzufügen"').toEqual(
        entwurf
    );

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) KONTROLLE: ✏️ → SPEICHERN → "+ LINK" LEGT NEU AN
// ===========================================================================
//
// Schon vor dem Fix gruen: Speichern leert die Karte (`links.js:102`), das
// naechste "+ Link" legt an. Die Kontrolle haelt fest, dass der Bearbeiten-
// Zweig und das Anlegen danach unberuehrt bleiben. Bearbeitet wird EINMAL —
// ein zweites ✏️ desselben Links waere Kritik L1 (siehe Kopf).
test('(8) ✏️ → Speichern → "+ Link" legt einen NEUEN Link an (Kontrolle)', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await linksLaden(page, [WELTKARTE, SRD]);
    const frisch = await frischesFormular(page);

    await bearbeiten(page, 1);
    await eintippen(page, '#link-title', 'Weltkarte II');
    let stand = await meldungsStand(page);
    await speichern(page, '✏️ → Speichern');
    const geaendert = { ...WELTKARTE, title: 'Weltkarte II' };
    weich(
        (await linksInD(page)).find(l => l.id === 1) ?? null,
        'D: die Aenderung ist gespeichert'
    ).toEqual(geaendert);
    weich(await meldungenSeit(page, stand), 'die Meldung des Bearbeitens').toContain(
        'success: Link aktualisiert'
    );
    weich(await undoKopf(page), 'der Rueckgaengig-Eintrag des Bearbeitens').toBe('Link bearbeitet');

    await anlegen(page, plusLink(page));
    weich(await formular(page), '"+ Link" nach dem Speichern').toEqual(frisch);
    await eintippen(page, '#link-title', NEU.title);
    await eintippen(page, '#link-url', NEU.url);
    stand = await meldungsStand(page);
    await speichern(page, '"+ Link" → Speichern');

    /** @param {any} liste */
    const kurz = liste => (Array.isArray(liste) ? liste : []).map(l => `${l.title}|${l.url}`);
    const erwartet = [
        `Weltkarte II|${WELTKARTE.url}`,
        `${SRD.title}|${SRD.url}`,
        `${NEU.title}|${NEU.url}`
    ];
    weich(kurz(await linksInD(page)), 'D').toEqual(erwartet);
    weich(
        (await linksInD(page)).find(l => l.id === 1) ?? null,
        'D: der bearbeitete bleibt'
    ).toEqual(geaendert);
    weich(await meldungenSeit(page, stand), 'die Meldung des Anlegens').toContain(
        'success: Link hinzugefügt'
    );
    weich(kurz(await linksImSpeicher(page)), 'localStorage').toEqual(erwartet);
    await page.reload();
    await waitForAppReady(page);
    weich(kurz(await linksInD(page)), 'D nach dem Neuladen').toEqual(erwartet);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
