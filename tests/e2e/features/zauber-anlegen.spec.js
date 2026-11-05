// @ts-check
/**
 * Anlegen nach abgebrochenem Bearbeiten: das Zauberformular (ABBRUCH, ZAUBER)
 * ===========================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer einen Zauber zum
 * Bearbeiten oeffnet, abbricht und danach einen Zauber ANLEGT, bekommt ein
 * leeres Formular, und Speichern legt einen NEUEN Zauber an** — der zuvor
 * bearbeitete bleibt feldgleich, in D, im Speicher und nach dem Neuladen.
 * Verschwindet der bearbeitete Zauber unter dem offenen Formular (Strg+Z),
 * wird die Eingabe als neuer Zauber gespeichert und das gesagt.
 *
 * Vertrag des Vorgangs ABBRUCH, hier gelten R1, R2 und R4 (unten im
 * Wortlaut). Vorbild ist die NPC-Behebung, `npc-formular.spec.js` Faelle
 * (3), (13), (14), (18).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu e5bc99d, 1440x900, echte Klicks und Tasten,
 * Saat wie unten (Feuerball mit JEDEM Feld gefuellt, bewusst ungleich den
 * Vorgaben des Formulars). So war es VOR dem Fix:
 *
 *   ✏️ Feuerball → ✕ (oder       das Formular trug Feuerball samt
 *   Escape) → "+ Zauber"         #edit-spell-id "1", alle Felder, die
 *                                Markdown-Knoepfe sichtbar; 💾 als
 *                                "Magisches Geschoss" UEBERSCHRIEB Feuerball
 *                                (id 1) — in D, im Speicher, nach dem
 *                                Neuladen. Keine Meldung.
 *   ebenso ✏️ aus der globalen   dasselbe
 *   Suche → Escape → "+ Zauber"
 *   ✏️ → ✕ → 🗑️ → "+ Zauber"     NICHTS gespeichert: D ["Licht"], der neue
 *                                Zauber war still weg, der Rueckgaengig-Stapel
 *                                bekam einen leeren Eintrag "Zauber
 *                                bearbeitet"
 *   ✏️ → Escape → 🗑️ des         dasselbe ueber den Knopf der leeren Liste:
 *   letzten → "➕ Zauber         D [], die Liste zeigte weiter "Keine Zauber"
 *   erstellen"
 *   "+ Zauber" Neu A → 💾 →      Strg+Z (mit dem Fokus im Namensfeld) nahm
 *   ✏️ Neu A → " (Wirt)" →       "Neu A" aus D, das Formular blieb offen;
 *   Strg+Z → 💾                  💾 speicherte NICHTS, meldete nichts, und der
 *                                leere Eintrag "Zauber bearbeitet" leerte den
 *                                Wiederholen-Stapel — Neu A war unrettbar
 *
 * DIE URSACHEN (Stand e5bc99d; Fundstellen nach dem Fix nennt der Katalog,
 * `docs/bugfixes.md`, Eintrag ABBRUCH):
 *   - "+ Zauber" (`assets/templates/view-resources.html`) war ein nacktes
 *     `show-modal` → `ui/actions/ui-actions.js` → `showModal()`
 *     (`systems/spellslots/navigation.js`), das nur oeffnet.
 *   - Der Knopf der leeren Liste (`renderSpells()`,
 *     `features/spells/spell-manager.js`) ebenso.
 *   - ✕ (`hideModal()`) und Escape (`systems/spellslots/keyboard-shortcuts.js`)
 *     schliessen nur. `clearSpellForm()` lief ausschliesslich aus
 *     `saveSpell()`.
 *   - `saveSpell()` entschied allein nach dem versteckten `#edit-spell-id`,
 *     legte `pushUndo('Zauber bearbeitet')` an, BEVOR es suchte, und
 *     `if (idx > -1)` fiel bei einer verwaisten ID still durch. Eine
 *     Erfolgsmeldung gibt es nicht — jeder Verlust war stumm.
 *   - Strg+Z ist "immer aktiv" (`keyboard-shortcuts.js`), auch mit dem
 *     Fokus in einem Feld des offenen Formulars.
 *
 * DIE REGELN, die hier gelten (nicht eine bestimmte Umsetzung):
 *   R1  Nach ✏️ → Abbrechen zeigt JEDER Anlege-Weg ein Formular ohne
 *       Bearbeiten-ID und ohne Werte des bearbeiteten Zaubers; 💾 legt neu
 *       an, der bearbeitete bleibt feldgleich.
 *   R2  Ein nie gespeicherter Anlege-Entwurf ueberlebt Escape und ✕, und
 *       der naechste Anlege-Weg verwirft ihn nicht — auch dann nicht, wenn
 *       vor ihm ein Bearbeiten abgebrochen wurde: geleert wird nur, solange
 *       ein Bearbeiten-REST im Formular steht (Fall (2)).
 *   R4  Zeigt die Bearbeiten-ID beim Speichern ins Leere, wird die Eingabe
 *       als NEUER Zauber gespeichert und eine Warnung gezeigt; keine Meldung
 *       "… aktualisiert", kein leerer Rueckgaengig-Eintrag "Zauber bearbeitet".
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE WEGE, gemessen (nicht aus dem Quelltext abgeschrieben)
 *
 * ANLEGEN: "+ Zauber" in der Werkzeugleiste und "➕ Zauber erstellen" der
 * leeren Liste. Keine Taste n, keine Befehlspalette (gemessen: n in
 * #view-spells oeffnet nichts, "Zauber" liefert 0 Treffer) — darum gibt es
 * hier keinen R3-Fall. Der Knopf der leeren Liste erscheint nur bei leerer
 * UND ungefilterter Liste (`render/helpers.js`): solange der bearbeitete
 * Zauber existiert, gibt es ihn nicht. Er fuehrt darum IMMER ueber das
 * Loeschen — Fall (4).
 *
 * ABBRECHEN: ✕ und Escape. Einen Abbrechen-Knopf hat das Formular nicht, ein
 * Klick daneben schliesst es nicht. Verteilt: ✕ in (1) und (3), Escape in
 * (2) und (4); (2) bricht danach den frischen Anlege-Entwurf noch mit ✕ ab.
 *
 * ZURUECKNEHMEN UNTER DEM OFFENEN FORMULAR: nur Strg+Z. Die beiden ↩️-Knoepfe
 * (Kopfzeile und Telefon-Kopfleiste) liegen bei offenem #spell-modal UNTER
 * `.modal-overlay` — gemessen per `elementFromPoint` auf der Knopfmitte bei
 * 1440x900 und 390x844, beidemal trifft der Punkt die Schale. Darum kein
 * Fall mit dem Rueckgaengig-Knopf.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD (eigene Vorgaenge, siehe Vertrag)
 *
 * Der Titel "Zauber bearbeiten" beim Bearbeiten (V6). Das ZWEITE ✏️
 * desselben Zaubers nach einem 💾: es zeigte den alten Stand, solange
 * `EntityLookup` einen Zwischenspeicher hatte (Katalog ABBRUCH, Offen (2));
 * seit RUECKSPRUNG ist das behoben und hat einen eigenen Waechter
 * (ruecksprung-rundlauf.spec.js, Fall (3)) — darum bearbeitet kein Fall hier
 * denselben Zauber zweimal. Der SRD-Typ, den ✏️ → 💾 auf "spell"
 * umschreibt, und das verdeckte Materialfeld.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Zauber A: JEDES Feld des Formulars gefuellt, und zwar ungleich den
 *  Vorgaben von `clearSpellForm()` (Zeit, Reichweite als eigene Eingabe,
 *  Dauer) — sonst saehe ein Formular, das einen Wert von Feuerball
 *  weitertraegt, aus wie ein leeres. */
const FEUERBALL = {
    id: 1,
    name: 'Feuerball',
    type: 'damage',
    level: 3,
    spellClasses: ['Magier', 'Zauberer'],
    school: 'Hervorrufung',
    time: '1 Bonusaktion',
    range: '45m|150ft.',
    duration: 'Konzentration, bis zu 1 Minute',
    ritual: true,
    v: true,
    g: true,
    m: true,
    material: 'Fledermausguano',
    description: '<p>Eine <b>Explosion</b>.</p>',
    note: '<p>Notiz A</p>'
};

/** Zauber B: alle Auswahl- und Optionalfelder leer bzw. auf der Vorgabe. */
const LICHT = {
    id: 2,
    name: 'Licht',
    type: 'spell',
    level: 0,
    spellClasses: [],
    school: '',
    time: '1 Aktion',
    range: '',
    duration: 'Unmittelbar',
    ritual: false,
    v: false,
    g: false,
    m: false,
    material: '',
    description: '',
    note: ''
};

/** @param {object[]} spells */
function seed(spells) {
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
        spells,
        wiki: [],
        links: [],
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
            spells: Math.max(0, ...spells.map(s => s.id)) + 1,
            loot: 1,
            items: 1,
            wiki: 1,
            sessionNotes: 1,
            randomTables: 1,
            filters: 1,
            factions: 1
        }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App. "Failed to load resource" ist
 * Netzrauschen (Schriften unter file://).
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
 * Die Zauber-Ansicht, wie ein Nutzer sie oeffnet: "📚 Inhalte ▾" → "✨ Zauber".
 * Die App merkt sich die letzte Ansicht nicht (`lastView` wird nirgends
 * gelesen), darum gibt es keinen Weg ueber die Saat.
 * @param {import('@playwright/test').Page} page
 */
async function zuDenZaubern(page) {
    await page.locator('.nav-group-btn', { hasText: 'Inhalte' }).click();
    await page.locator('.nav-group-menu .nav-tab[data-view="spells"]').click();
    await expect(page.locator('#view-spells')).toBeVisible();
}

/**
 * Laedt breit, saet EINMAL je Tab und oeffnet die Zauber-Ansicht. Die Saat
 * steht hinter einer sessionStorage-Sperre: ein `page.reload()` liest dann,
 * was die App gespeichert hat, statt die Saat neu zu schreiben.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} spells
 */
async function zauberLaden(page, spells) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('zauber-anlegen-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('zauber-anlegen-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(spells)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN, sonst misst ein Speicher-Fall nichts:
    // repariert `load()` die Saat, schreibt `saveAutomatic()` etwa 1,4 s
    // spaeter den ganzen Stand aus D (siehe npc-formular.spec.js). Erkennbar
    // daran, dass `_version` der Saat ueberschrieben wird.
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
    await zuDenZaubern(page);
}

/** Neu laden und warten, bis die App steht — die Saat greift dank der
 *  Sperre nicht noch einmal.
 *  @param {import('@playwright/test').Page} page */
async function neuLaden(page) {
    await page.reload();
    await waitForAppReady(page);
}

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/** Ein Zauber aus D, ohne `undefined`-Felder (dieselbe Form wie im Speicher).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function zauberInD(page, id) {
    return page.evaluate(
        id => JSON.parse(JSON.stringify(window.D.spells.find(s => s.id === id) ?? null)),
        id
    );
}

/** Ein Zauber aus dem Speicher.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function zauberImSpeicher(page, id) {
    return page.evaluate(
        ([schluessel, id]) => {
            try {
                return (
                    (JSON.parse(localStorage.getItem(schluessel) || '{}').spells || []).find(
                        s => s.id === id
                    ) ?? null
                );
            } catch {
                return '(nicht lesbar)';
            }
        },
        [SPEICHER, id]
    );
}

/** Alle Zaubernamen, in D bzw. im Speicher. Ohne ID: welche ID ein neuer
 *  Zauber bekommt, entscheidet nextId(), nicht dieser Waechter.
 *  @param {import('@playwright/test').Page} page */
function namenInD(page) {
    return page.evaluate(() => window.D.spells.map(s => s.name));
}
/** @param {import('@playwright/test').Page} page */
function namenImSpeicher(page) {
    return page.evaluate(schluessel => {
        try {
            return (JSON.parse(localStorage.getItem(schluessel) || '{}').spells || []).map(
                s => s.name
            );
        } catch {
            return ['(nicht lesbar)'];
        }
    }, SPEICHER);
}

/** Die ID des Zaubers mit diesem Namen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function idVon(page, name) {
    return page.evaluate(name => window.D.spells.find(s => s.name === name)?.id ?? null, name);
}

/** Alle Felder des Formulars, wie das Template sie fuehrt — dazu die
 *  Markdown-Knoepfe: sie haengen an #edit-spell-id und exportieren den
 *  bearbeiteten Zauber, wenn sie im Anlege-Formular stehen bleiben.
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value;
        const haken = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.checked;
        const md = document.getElementById('spell-markdown-actions');
        return {
            offen: document.getElementById('spell-modal')?.classList.contains('show'),
            titel: document.querySelector('#spell-modal .modal-title')?.textContent?.trim(),
            id: wert('edit-spell-id'),
            name: wert('spell-name'),
            typ: wert('spell-type'),
            stufe: wert('spell-level'),
            schule: wert('spell-school'),
            klassen: Array.from(
                document.querySelectorAll('#spell-modal .spell-classes-grid input:checked')
            ).map(i => /** @type {HTMLInputElement} */ (i).value),
            zeit: wert('spell-time-select'),
            zeitEigen: wert('spell-time-custom'),
            reichweite: wert('spell-range-select'),
            reichweiteEigen: wert('spell-range-custom'),
            dauer: wert('spell-duration-select'),
            dauerEigen: wert('spell-duration-custom'),
            ritual: haken('spell-ritual'),
            v: haken('spell-v'),
            g: haken('spell-g'),
            m: haken('spell-m'),
            material: wert('spell-material'),
            beschreibung: document.getElementById('spell-desc')?.innerHTML,
            notiz: document.getElementById('spell-note')?.innerHTML,
            markdownKnoepfeSichtbar: md ? getComputedStyle(md).display !== 'none' : null
        };
    });
}

/** Das leere Formular im Anlege-Zustand — gemessen gleich beim frischen
 *  "+ Zauber" und nach ✏️ → 💾 → "+ Zauber" (M0 der Messung). */
const LEER = {
    offen: true,
    titel: 'Zauber hinzufügen',
    id: '',
    name: '',
    typ: 'spell',
    stufe: '0',
    schule: '',
    klassen: [],
    zeit: '1 Aktion',
    zeitEigen: '',
    reichweite: '',
    reichweiteEigen: '',
    dauer: 'Unmittelbar',
    dauerEigen: '',
    ritual: false,
    v: false,
    g: false,
    m: false,
    material: '',
    beschreibung: '',
    notiz: '',
    markdownKnoepfeSichtbar: false
};

/** "+ Zauber" in der Werkzeugleiste — ueber Rolle und Namen, nicht ueber
 *  `data-action`: der Knopf ist derselbe vor und nach dem Fix, sein
 *  `data-action` nicht.
 *  @param {import('@playwright/test').Page} page */
function plusZauber(page) {
    return page
        .locator('#view-spells .section-toolbar-actions')
        .getByRole('button', { name: '+ Zauber', exact: true });
}

/** "➕ Zauber erstellen" der leeren Liste — ueber den sichtbaren Text.
 *  @param {import('@playwright/test').Page} page */
function leereListeKnopf(page) {
    return page.locator('#spell-list').getByRole('button', { name: /Zauber erstellen/ });
}

/** Karte aufklappen (Klick auf den Kopf), dann ✏️.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function bearbeiten(page, id) {
    const karte = page.locator(`#spell-list .spell-card[data-spell-id="${id}"]`);
    if (!(await karte.evaluate(k => k.classList.contains('expanded')))) {
        await karte.locator('.spell-card-header').click();
    }
    await karte.locator('[data-action="edit-spell-stop"]').click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
}

/** Karte aufklappen, dann 🗑️ (die Rueckfrage bestaetigt der Fall per
 *  `page.on('dialog')`).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function loeschen(page, id) {
    const karte = page.locator(`#spell-list .spell-card[data-spell-id="${id}"]`);
    if (!(await karte.evaluate(k => k.classList.contains('expanded')))) {
        await karte.locator('.spell-card-header').click();
    }
    await karte.locator('[data-action="delete-spell-stop"]').click();
}

/** ✕ in der Kopfzeile des Formulars.
 *  @param {import('@playwright/test').Page} page */
async function kreuz(page) {
    await page.locator('#spell-modal .modal-header').getByRole('button', { name: '✕' }).click();
    await expect(page.locator('#spell-modal')).not.toHaveClass(/\bshow\b/);
}

/** Escape.
 *  @param {import('@playwright/test').Page} page */
async function escape(page) {
    await page.keyboard.press('Escape');
    await expect(page.locator('#spell-modal')).not.toHaveClass(/\bshow\b/);
}

/** 💾 im Formular.
 *  @param {import('@playwright/test').Page} page */
async function speichern(page) {
    await page
        .locator('#spell-modal .modal-footer')
        .getByRole('button', { name: 'Speichern', exact: true })
        .click();
    await expect(page.locator('#spell-modal')).not.toHaveClass(/\bshow\b/);
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
 *  ihn neu. Ohne ihn waere "der Speicher traegt den alten Stand" nicht von
 *  "es wurde gar nicht geschrieben" zu unterscheiden.
 *  @param {import('@playwright/test').Page} page */
function revStand(page) {
    return page.evaluate(schluessel => localStorage.getItem(schluessel + '_rev'), SPEICHER);
}
/** Wartet, bis seit `rev` geschrieben wurde. `weich: true` dort, wo das
 *  Schreiben selbst schon die Zusage der Regel ist (R4: "die Eingabe wird
 *  gespeichert") — dann nennt ein roter Lauf auch die Folgen in D und im
 *  Speicher, statt am Nachweis stehen zu bleiben. Grundlos gruen wird der
 *  Fall dadurch nicht: eine weiche Zusicherung faerbt ihn ebenso rot.
 *  @param {import('@playwright/test').Page} page
 *  @param {string|null} rev
 *  @param {string} was
 *  @param {{ weich?: boolean }} [opt] */
async function geschriebenSeit(page, rev, was, opt = {}) {
    await (opt.weich ? weich : expect)
        .poll(() => revStand(page), {
            timeout: SOFORT_MS,
            message: `${was}: save() muss schreiben (entprellt 300 ms)`
        })
        .not.toBe(rev);
}

/** Der oberste Eintrag des Rueckgaengig-Stapels, und ob er LEER ist (sein
 *  Zustand gleich D — ein Strg+Z darauf aendert nichts).
 *  @param {import('@playwright/test').Page} page */
function undoKopf(page) {
    return page.evaluate(() => {
        const kopf = undoStack.length ? undoStack[undoStack.length - 1] : null;
        return {
            aktion: kopf ? kopf.action : null,
            leer: kopf ? kopf.state === JSON.stringify(window.D) : null
        };
    });
}

/** Meldungen, die von einem Aktualisieren sprechen.
 *  @param {string[]} meldungen */
function aktualisiertMeldungen(meldungen) {
    return meldungen.filter(m => /aktualisiert/i.test(m));
}

// ===========================================================================
// (1) R1: ✏️ → ✕ → "+ ZAUBER" LEGT NEU AN UND UEBERSCHREIBT NICHT
// ===========================================================================
//
// Vor dem Fix (gemessen): das Formular trug Feuerball samt ID und sichtbaren
// Markdown-Knoepfen; 💾 als "Magisches Geschoss" ueberschrieb Feuerball in
// D, im Speicher und nach dem Neuladen — ohne jede Meldung.
test('(1) R1: ✏️ → ✕ → "+ Zauber" zeigt ein leeres Formular, 💾 legt NEU an, Feuerball bleibt — in D, im Speicher, nach dem Neuladen', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await zauberLaden(page, [FEUERBALL, LICHT]);
    expect(
        await zauberInD(page, 1),
        'die Saat muss so in D ankommen, sonst misst der Fall die Saat'
    ).toEqual(FEUERBALL);

    await bearbeiten(page, 1);
    await kreuz(page);

    await plusZauber(page).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    // WEICH: ein roter Lauf soll danach auch den Verlust nennen.
    weich(
        await formular(page),
        '"+ Zauber" nach ✏️ → ✕ muss leer und im Anlege-Zustand sein'
    ).toEqual(LEER);
    await page.locator('#spell-name').fill('Magisches Geschoss');
    const rev = await revStand(page);
    await speichern(page);
    await geschriebenSeit(page, rev, '"+ Zauber" → 💾');

    weich(await namenInD(page), 'D: Feuerball und Licht bleiben, der neue kommt dazu').toEqual([
        'Feuerball',
        'Licht',
        'Magisches Geschoss'
    ]);
    weich(await zauberInD(page, 1), 'D: Feuerball feldgleich').toEqual(FEUERBALL);
    weich(await undoKopf(page), 'der Rueckgaengig-Eintrag des Anlegens').toEqual({
        aktion: 'Zauber erstellt',
        leer: false
    });
    weich(await namenImSpeicher(page), 'localStorage: alle drei').toEqual([
        'Feuerball',
        'Licht',
        'Magisches Geschoss'
    ]);
    weich(await zauberImSpeicher(page, 1), 'localStorage: Feuerball feldgleich').toEqual(FEUERBALL);

    await neuLaden(page);
    weich(await namenInD(page), 'nach dem Neuladen: alle drei').toEqual([
        'Feuerball',
        'Licht',
        'Magisches Geschoss'
    ]);
    weich(await zauberInD(page, 1), 'nach dem Neuladen: Feuerball feldgleich').toEqual(FEUERBALL);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2) R1: ✏️ AUS DER GLOBALEN SUCHE → ESCAPE → "+ ZAUBER" LEGT NEU AN
// ===========================================================================
//
// Der zweite Bearbeiten-Weg (Strg+K, Treffer anklicken) und der zweite
// Abbruch-Weg. Vor dem Fix (gemessen): Formular mit id "1"/"Feuerball",
// 💾 ueberschrieb Feuerball. Dazu R2 im Anschluss: der Name, der nach dem
// Aufraeumen getippt wird, ist ein Entwurf und ueberlebt ✕ → "+ Zauber".
test('(2) R1: ✏️ aus der globalen Suche → Escape → "+ Zauber" zeigt ein leeres Formular, 💾 legt NEU an; der Entwurf danach ueberlebt ✕', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await zauberLaden(page, [FEUERBALL, LICHT]);

    await page.keyboard.press('Control+k');
    await expect(page.locator('#global-search')).toBeFocused();
    await page.keyboard.type('Feuerball');
    await page
        .locator('#global-search-results [data-action="navigate-result"][data-type="spell"]')
        .first()
        .click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    expect(
        (await formular(page)).id,
        'Vorbedingung: die Suche hat Feuerball zum Bearbeiten geoeffnet'
    ).toBe('1');
    await escape(page);

    await plusZauber(page).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), '"+ Zauber" nach ✏️ aus der Suche → Escape muss leer sein').toEqual(
        LEER
    );
    await page.locator('#spell-name').fill('Magisches Geschoss');

    // R2 NACH DEM AUFRAEUMEN: was jetzt im Formular steht, ist ein Anlege-
    // Entwurf. Ein Fix, der sich "es wurde einmal abgebrochen" merkt statt
    // nachzusehen, ob ein Bearbeiten-REST im Formular steht, leert ihn beim
    // naechsten "+ Zauber" ein zweites Mal — der Waechter (6) saehe das nie,
    // weil vor seinem Entwurf kein Bearbeiten lag.
    await kreuz(page);
    await plusZauber(page).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    const entwurf = await formular(page);
    weich(
        { id: entwurf.id, name: entwurf.name },
        'der Entwurf nach dem Aufraeumen ueberlebt ✕ → "+ Zauber" (R2)'
    ).toEqual({ id: '', name: 'Magisches Geschoss' });
    // Falls ein falscher Fix ihn doch verwarf: der Name, damit der Rest des
    // Falls die Speicher-Zusagen weiter misst statt an "Name erforderlich"
    // haengen zu bleiben.
    await page.locator('#spell-name').fill('Magisches Geschoss');
    const rev = await revStand(page);
    await speichern(page);
    await geschriebenSeit(page, rev, '"+ Zauber" → 💾');

    weich(await namenInD(page), 'D').toEqual(['Feuerball', 'Licht', 'Magisches Geschoss']);
    weich(await zauberInD(page, 1), 'D: Feuerball feldgleich').toEqual(FEUERBALL);
    weich(await namenImSpeicher(page), 'localStorage').toEqual([
        'Feuerball',
        'Licht',
        'Magisches Geschoss'
    ]);
    weich(await zauberImSpeicher(page, 1), 'localStorage: Feuerball feldgleich').toEqual(FEUERBALL);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) R4 GELOESCHT: ✏️ → ✕ → 🗑️ → "+ ZAUBER" SPEICHERT DEN NEUEN ZAUBER
// ===========================================================================
//
// Vor dem Fix (gemessen): das Formular trug die ID des geloeschten
// Feuerball; saveSpell() fand sie nicht, speicherte NICHTS, meldete nichts
// und legte einen leeren Eintrag "Zauber bearbeitet" an.
//
// Ob der Fix das Formular beim Oeffnen leert (dann gibt es beim 💾 keine
// verwaiste ID mehr) oder erst beim Speichern auffaengt, ist seine Sache —
// beides genuegt R4. Darum prueft der Fall die Warnung NICHT, wohl aber das
// leere Formular (R1) und dass der neue Zauber ankommt.
test('(3) R4 geloescht: ✏️ → ✕ → 🗑️ → "+ Zauber": leeres Formular, 💾 speichert den neuen Zauber', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await zauberLaden(page, [FEUERBALL, LICHT]);

    await bearbeiten(page, 1);
    await kreuz(page);
    const revLoeschen = await revStand(page);
    await loeschen(page, 1);
    await expect
        .poll(() => namenInD(page), { message: 'Vorbedingung: Feuerball ist geloescht' })
        .toEqual(['Licht']);
    // Das entprellte Schreiben des Loeschens abwarten: landete es erst nach
    // dem `revStand()` vor 💾, hielte `geschriebenSeit()` es fuer das
    // Speichern des neuen Zaubers und der Speicher-Blick kaeme zu frueh.
    await geschriebenSeit(page, revLoeschen, '🗑️');

    await plusZauber(page).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), '"+ Zauber" nach ✏️ → ✕ → 🗑️').toEqual(LEER);
    await page.locator('#spell-name').fill('Magisches Geschoss');
    const stand = await meldungsStand(page);
    const rev = await revStand(page);
    await speichern(page);
    await geschriebenSeit(page, rev, '"+ Zauber" → 💾');

    weich(await namenInD(page), 'D: der neue Zauber ist da').toEqual([
        'Licht',
        'Magisches Geschoss'
    ]);
    weich(await undoKopf(page), 'kein leerer Eintrag "Zauber bearbeitet"').toEqual({
        aktion: 'Zauber erstellt',
        leer: false
    });
    weich(
        aktualisiertMeldungen(await meldungenSeit(page, stand)),
        'keine Meldung "… aktualisiert"'
    ).toEqual([]);
    weich(await namenImSpeicher(page), 'localStorage').toEqual(['Licht', 'Magisches Geschoss']);

    await neuLaden(page);
    weich(await namenInD(page), 'nach dem Neuladen').toEqual(['Licht', 'Magisches Geschoss']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) R4 GELOESCHT: DER KNOPF DER LEEREN LISTE NACH ✏️ → ESCAPE → 🗑️
// ===========================================================================
//
// "➕ Zauber erstellen" gibt es nur bei leerer und ungefilterter Liste —
// also erst, nachdem der letzte Zauber geloescht ist. Dieser Fall ist damit
// zugleich der R1-Fall dieses Anlege-Wegs. Vor dem Fix (gemessen): id "1",
// 💾 speicherte nichts, D blieb [] und die Liste zeigte weiter "Keine
// Zauber"; das erste Strg+Z danach aenderte nichts.
test('(4) R4 geloescht: ✏️ → Escape → 🗑️ des letzten → "➕ Zauber erstellen": leeres Formular, 💾 speichert', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await zauberLaden(page, [FEUERBALL]);

    await bearbeiten(page, 1);
    await escape(page);
    const revLoeschen = await revStand(page);
    await loeschen(page, 1);
    await expect(leereListeKnopf(page), 'Vorbedingung: die Liste ist leer').toBeVisible();
    // Wie in (3): das Schreiben des Loeschens darf nicht als das des
    // neuen Zaubers durchgehen.
    await geschriebenSeit(page, revLoeschen, '🗑️');

    await leereListeKnopf(page).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), '"➕ Zauber erstellen" nach ✏️ → Escape → 🗑️').toEqual(LEER);
    await page.locator('#spell-name').fill('Magisches Geschoss');
    const stand = await meldungsStand(page);
    const rev = await revStand(page);
    await speichern(page);
    await geschriebenSeit(page, rev, '"➕ Zauber erstellen" → 💾');

    weich(await namenInD(page), 'D: der neue Zauber ist da').toEqual(['Magisches Geschoss']);
    // Kurze Frist: saveSpell() zeichnet die Liste synchron, und das
    // Schreiben ist oben schon abgewartet — laenger warten aendert nichts.
    await weich(
        page.locator('#spell-list .spell-card'),
        'die Liste zeigt den neuen Zauber'
    ).toHaveCount(1, { timeout: 1000 });
    weich(await undoKopf(page), 'kein leerer Eintrag "Zauber bearbeitet"').toEqual({
        aktion: 'Zauber erstellt',
        leer: false
    });
    weich(
        aktualisiertMeldungen(await meldungenSeit(page, stand)),
        'keine Meldung "… aktualisiert"'
    ).toEqual([]);
    weich(await namenImSpeicher(page), 'localStorage').toEqual(['Magisches Geschoss']);

    await neuLaden(page);
    weich(await namenInD(page), 'nach dem Neuladen').toEqual(['Magisches Geschoss']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (5) R4: STRG+Z MIT DEM FOKUS IM FELD NIMMT DEN ZAUBER UNTER DEM FORMULAR WEG
// ===========================================================================
//
// Strg+Z wirkt auch mit dem Fokus im Namensfeld ("immer aktiv") und nimmt
// hier das Anlegen zurueck, waehrend ✏️ denselben Zauber offen hat. Das
// Formular haelt die Eingabe, die ID zeigt ins Leere. Vor dem Fix
// (gemessen): 💾 speicherte nichts, meldete nichts, legte einen leeren
// Eintrag "Zauber bearbeitet" an — und der leerte den Wiederholen-Stapel,
// "Neu A" war auch per Strg+Y nicht mehr zu retten. Jetzt: als neuer Zauber
// gespeichert, und eine Warnung sagt genau das.
test('(5) R4: Strg+Z im Namensfeld nimmt den Zauber unter dem offenen ✏️ zurueck — 💾 speichert ihn NEU und warnt', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await zauberLaden(page, [FEUERBALL]);

    await plusZauber(page).click();
    await page.locator('#spell-name').fill('Neu A');
    const revAnlegen = await revStand(page);
    await speichern(page);
    // Erst das entprellte Schreiben des Anlegens abwarten — sonst koennte es
    // NACH dem Strg+Z unten landen und dessen Messung verfaelschen.
    await geschriebenSeit(page, revAnlegen, '"+ Zauber" → 💾');
    const neuA = await idVon(page, 'Neu A');
    expect(neuA, '"Neu A" muss angelegt sein').not.toBeNull();

    await bearbeiten(page, /** @type {number} */ (neuA));
    await page.locator('#spell-name').click();
    await page.keyboard.press('End');
    await page.keyboard.type(' (Wirt)');
    const revUndo = await revStand(page);
    await page.keyboard.press('Control+z');
    await expect
        .poll(() => namenInD(page), { message: 'Vorbedingung: Strg+Z nimmt "Neu A" aus D' })
        .toEqual(['Feuerball']);
    await geschriebenSeit(page, revUndo, 'Strg+Z');
    const offen = await formular(page);
    expect(
        { offen: offen.offen, id: offen.id, name: offen.name },
        'Vorbedingung: das Formular ist noch offen und zeigt auf "Neu A"'
    ).toEqual({ offen: true, id: String(neuA), name: 'Neu A (Wirt)' });

    const stand = await meldungsStand(page);
    const rev = await revStand(page);
    await speichern(page);
    // WEICH: dass ueberhaupt geschrieben wird, ist hier schon Teil von R4 —
    // ein Fix, der die verwaiste Eingabe still verwirft, soll unten auch an
    // D, Warnung und Speicher rot werden, nicht nur an diesem Nachweis.
    await geschriebenSeit(page, rev, '💾 nach Strg+Z', { weich: true });

    weich(await namenInD(page), 'D: die Eingabe ist als neuer Zauber gespeichert').toEqual([
        'Feuerball',
        'Neu A (Wirt)'
    ]);
    weich(await zauberInD(page, 1), 'D: Feuerball feldgleich').toEqual(FEUERBALL);
    const meldungen = await meldungenSeit(page, stand);
    weich(
        aktualisiertMeldungen(meldungen),
        'keine Meldung "… aktualisiert" fuer ein Speichern, das nichts aktualisieren konnte'
    ).toEqual([]);
    weich(
        meldungen.some(
            m =>
                m.startsWith('warning: ') &&
                /existiert nicht mehr/.test(m) &&
                /neue[rn]? Zauber/.test(m)
        ),
        `eine Warnung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
    weich(await undoKopf(page), 'kein leerer Eintrag "Zauber bearbeitet"').toEqual({
        aktion: 'Zauber erstellt',
        leer: false
    });
    weich(await namenImSpeicher(page), 'localStorage').toEqual(['Feuerball', 'Neu A (Wirt)']);

    await neuLaden(page);
    weich(await namenInD(page), 'nach dem Neuladen').toEqual(['Feuerball', 'Neu A (Wirt)']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) WAECHTER R2: EIN ANLEGE-ENTWURF UEBERLEBT ESCAPE, ✕ UND BEIDE ANLEGE-WEGE
// ===========================================================================
//
// Der neue Anlege-Weg darf das Formular NUR leeren, wenn ein Bearbeiten
// Reste hinterliess (#edit-spell-id gesetzt). Ein echter Entwurf bleibt
// stehen — vor dem Fix ebenso (gemessen), darum ein Waechter. Er faehrt
// BEIDE Anlege-Wege: bei leerer Liste stehen "➕ Zauber erstellen" und
// "+ Zauber" nebeneinander.
test('(6) R2 (Waechter): ein Anlege-Entwurf ueberlebt Escape und ✕, "➕ Zauber erstellen" und "+ Zauber" verwerfen ihn nicht', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await zauberLaden(page, []);

    await leereListeKnopf(page).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    await page.locator('#spell-name').fill('Entwurf');
    await page.locator('#spell-school').selectOption('Illusion');
    await page.locator('#spell-modal .spell-classes-grid').getByLabel('Barde').check();
    const ENTWURF = {
        id: '',
        name: 'Entwurf',
        schule: 'Illusion',
        klassen: ['Barde'],
        titel: 'Zauber hinzufügen'
    };
    /** @param {Awaited<ReturnType<typeof formular>>} f */
    const auszug = f => ({
        id: f.id,
        name: f.name,
        schule: f.schule,
        klassen: f.klassen,
        titel: f.titel
    });

    await escape(page);
    await leereListeKnopf(page).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    weich(auszug(await formular(page)), 'Escape → "➕ Zauber erstellen"').toEqual(ENTWURF);

    await kreuz(page);
    await plusZauber(page).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    weich(auszug(await formular(page)), '✕ → "+ Zauber"').toEqual(ENTWURF);

    const rev = await revStand(page);
    await speichern(page);
    await geschriebenSeit(page, rev, 'Entwurf → 💾');
    weich(await namenInD(page), 'D: der Entwurf ist angelegt').toEqual(['Entwurf']);
    weich(await namenImSpeicher(page), 'localStorage').toEqual(['Entwurf']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (7) KONTROLLE: ✏️ → 💾 → "+ ZAUBER" — DER WEG, DER SCHON VOR DEM FIX STIMMTE
// ===========================================================================
//
// Wer das Bearbeiten mit 💾 abschliesst, bekommt beim naechsten "+ Zauber"
// schon vor dem Fix ein leeres Formular (`saveSpell()` ruft
// `clearSpellForm()`). Die Kontrolle haelt fest, dass der Fix daran nichts
// verschiebt: die Aenderung kommt an, alle anderen Felder bleiben, und der
// neue Zauber ist ein neuer.
test('(7) Kontrolle: ✏️ → 💾 → "+ Zauber" → 💾: der bearbeitete traegt seine Aenderung, der neue ist neu', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await zauberLaden(page, [FEUERBALL, LICHT]);
    const geaendert = { ...FEUERBALL, name: 'Feuerball II' };

    await bearbeiten(page, 1);
    await page.locator('#spell-name').fill('Feuerball II');
    const revBearbeiten = await revStand(page);
    await speichern(page);
    await geschriebenSeit(page, revBearbeiten, '✏️ → 💾');
    weich(await zauberInD(page, 1), 'D nach ✏️ → 💾').toEqual(geaendert);

    await plusZauber(page).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), '"+ Zauber" nach ✏️ → 💾').toEqual(LEER);
    await page.locator('#spell-name').fill('Schild');
    const rev = await revStand(page);
    await speichern(page);
    await geschriebenSeit(page, rev, '"+ Zauber" → 💾');

    weich(await namenInD(page), 'D').toEqual(['Feuerball II', 'Licht', 'Schild']);
    weich(await zauberInD(page, 1), 'D: Feuerball II').toEqual(geaendert);
    weich(await zauberInD(page, 2), 'D: Licht unberuehrt').toEqual(LICHT);
    weich(await undoKopf(page), 'der Rueckgaengig-Eintrag des Anlegens').toEqual({
        aktion: 'Zauber erstellt',
        leer: false
    });
    weich(await namenImSpeicher(page), 'localStorage').toEqual(['Feuerball II', 'Licht', 'Schild']);
    weich(await zauberImSpeicher(page, 1), 'localStorage: Feuerball II').toEqual(geaendert);

    await neuLaden(page);
    weich(await namenInD(page), 'nach dem Neuladen').toEqual(['Feuerball II', 'Licht', 'Schild']);
    weich(await zauberInD(page, 1), 'nach dem Neuladen: Feuerball II').toEqual(geaendert);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
