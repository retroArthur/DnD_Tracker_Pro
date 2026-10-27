// @ts-check
/**
 * Anlegen nach abgebrochenem Bearbeiten — das Charakter-Formular (ABBRUCH, CHAR)
 * ==============================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer einen Charakter mit
 * ✏️ oeffnet und das Formular verlaesst, ohne zu speichern, bekommt beim
 * naechsten Anlege-Weg ein LEERES Formular — "Speichern" legt einen NEUEN
 * Charakter an, der bearbeitete bleibt, wie er war;** und zeigt die
 * Bearbeiten-ID beim Speichern ins Leere, geht die Eingabe nicht verloren.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu e5bc99d (Branch abbrechen-neu), Chromium, 1440x900,
 * echte Klicks und Tasten, Saat wie unten (Aria mit jedem Feld, das das
 * Formular zeigt, dazu Bran), am Schreibtisch und am Telefon (390x844).
 *
 *   ✏️ Aria → Kopfzeile zu →       das Formular traegt id 1 / "Aria"; "Neu" →
 *   Kopfzeile, Taste n oder        💾 UEBERSCHREIBT Aria: D = Speicher = nach
 *   Befehlspalette                 dem Neuladen ["1:Neu","2:Bran"], Meldung
 *                                  "Charakter aktualisiert" — in allen zwoelf
 *                                  Kombinationen, ebenso am Telefon (K3b)
 *   ✏️ Aria → "Abbrechen" →        neu angelegt, aber mit Stufe 5, Resistenz
 *   ein Anlege-Weg                 Feuer, Immunitaet Gift von Aria
 *   ✏️ → Kopfzeile zu → 🗑️ →       NICHTS gespeichert, D = Speicher = [],
 *   "➕ Charakter erstellen"        Meldung "Charakter aktualisiert", leerer
 *   der leeren Liste → 💾           Rueckgaengig-Eintrag "Charakter bearbeitet"
 *   ✏️, 🗑️ unter dem offenen       die Eingabe ist weg, dieselbe falsche
 *   Formular, 💾                   Meldung, derselbe leere Eintrag
 *   "Neu A" → ✏️ → "Wirt" →        Strg+Z wirkt trotz Fokus im Feld und nimmt
 *   Strg+Z → 💾                    "Neu A" zurueck; 💾 speichert nichts,
 *                                  "Neu A (Wirt)" ist endgueltig verloren
 *   dasselbe mit ↩️ in der         ebenso verloren (K3c) — der Weg ohne
 *   Telefon-Kopfleiste             Tastatur
 *   Taste n / Palette bei          klappen das Formular ZU (Eingabe bleibt
 *   offenem ✏️                     stehen), das naechste n klappt es im
 *                                  Bearbeiten-Zustand wieder auf
 *
 * DIE URSACHEN: Es gibt keine Anlegen-Funktion. Jeder Anlege-Weg ist der
 * reine Umschalter `toggleCollapse('char-form')`
 * (`systems/spellslots/navigation.js:119-134`), der nur die Klasse `open`
 * wechselt — die Kopfzeile (`assets/templates/view-party.html:44`), die Taste
 * n (`systems/spellslots/keyboard-shortcuts.js:809`), die Befehlspalette
 * (`features/command-palette/action-registry.js:26`) und der Knopf der leeren
 * Liste (`features/party/party-render.js:63-71`). Wer das Formular anders als
 * mit "Abbrechen" verlaesst, behaelt `#edit-char-id` samt allen Feldern.
 * `saveCharacter()` (`features/party/party-crud.js:174-329`) legt den
 * Rueckgaengig-Eintrag "Charakter bearbeitet" an, BEVOR es die ID sucht (Z.
 * 301), tut nichts, wenn `findIndex` -1 liefert (Z. 302-318, kein else), und
 * meldet trotzdem "Charakter aktualisiert" (Z. 328). Strg+Z ist "immer aktiv",
 * vor der isTyping-Schranke (`keyboard-shortcuts.js:514-519` gegen Z. 582).
 * Und `cancelCharEdit()` leert nicht alles: `'char-level'` steht nur unter
 * `defaults` (`party-crud.js:489`), `clearFormFields()` wendet die aber nur
 * auf gelistete Felder an (`utils/form-helpers.js:39-44`);
 * `clearChipSelection('.cf-chip')` (`party-crud.js:500`) baut den Selektor
 * `.cf-chip .cf-chip` (`utils/form-helpers.js:94`), der nichts trifft.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag ABBRUCH, docs/bugfixes.md), so wie sie hier gelten
 *
 *   R1  Nach ✏️ → Abbruch (Kopfzeile zuklappen, Knopf "Abbrechen") zeigt
 *       JEDER Anlege-Weg ein Formular ohne Bearbeiten-ID und ohne Werte des
 *       bearbeiteten Charakters; 💾 legt NEU an, der bearbeitete bleibt
 *       feldgleich — in D, im Speicher, nach dem Neuladen. Faelle (1)-(4),
 *       je Anlege-Weg einer: Kopfzeile, Taste n, Befehlspalette, leere Liste.
 *   R2  Ein nie gespeicherter Entwurf ueberlebt Escape und Zuklappen; der
 *       naechste Anlege-Weg verwirft ihn nicht — KEINER der vier, auch nicht
 *       der Knopf der leeren Liste. Fall (5), Waechter.
 *   R3  Ist das Formular offen — im Bearbeiten-Zustand ODER als Entwurf —,
 *       tun Taste n und Befehlspalette NICHTS: kein Zuklappen, kein Leeren.
 *       Die Kopfzeile bleibt ein Umschalter. Fall (6).
 *   R4  Zeigt die Bearbeiten-ID beim 💾 ins Leere (geloescht, per Strg+Z oder
 *       per Rueckgaengig-KNOPF zurueckgenommen, waehrend das Formular offen
 *       war), wird die Eingabe als NEUER Charakter gespeichert, mit einer
 *       Warnung; keine Meldung "… aktualisiert", kein leerer Eintrag "…
 *       bearbeitet" — auch nicht UNTER einem "… erstellt" (geprueft wird der
 *       Zuwachs des ganzen Stapels, nicht nur sein Kopf). Faelle (7), (8), (9).
 *   R5-R8 betreffen dieses Formular nicht.
 *   Fall (10) ist eine Kontrolle: ✏️ → 💾 → Anlegen legt schon heute neu an.
 *
 * Welche Abbruch-Wege es gibt, steht in der Messung: "Abbrechen" und
 * Zuklappen ueber die Kopfzeile. Escape tut am Klappformular nichts (es
 * schliesst nur Overlays und Modale, `keyboard-shortcuts.js:404-505`) — kein
 * eigener Abbruch-Weg (Kritik, Abschnitt 4); Taste n und Palette sind nach R3
 * keiner. Darum ist "Abbrechen" in Fall (2) Abbruch-Weg und NICHT Kontrolle:
 * es leert zwar die ID, laesst aber Stufe und Chips stehen — das ist rot nach
 * R1 ("ohne Werte des bearbeiteten Eintrags").
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Der Titel "… bearbeiten" (V6) und der Kampagnen-Import "Ersetzen" bei
 * offenem Formular (Kritik L2) — eigene Vorgaenge (Vertrag, "Nicht in diesem
 * PR"); ebenso die globale Suche ueber ein offenes Formular (Kritik,
 * Abschnitt 3, nur gelesen). Der Rueckgaengig-Knopf der Schreibtisch-Kopfzeile
 * (`header.html:38`) ruft dasselbe undo() wie der des Telefons — Fall (9)
 * faehrt den Weg ohne Tastatur nur einmal. Die Roster-Knoepfe "+ Neu"
 * (`party-render.js:88,122`) sind tot (`.party-roster { display: none }`,
 * `assets/styles/dashboard.css:2388-2390`) — kein Weg, den ein Nutzer hat.
 * Ob "Abbrechen" einen ANLEGE-Entwurf leeren darf, laesst der Vertrag fuer ein
 * Klappformular offen (dort ist "Abbrechen" das Leeren); Fall (5) faehrt den
 * Knopf "Abbrechen" darum nicht. Die Kontrolle (10) prueft nach ✏️ → 💾 nur
 * ID, Name und das Neu-Anlegen, nicht die Reste von Stufe und Chips — die
 * kommen aus derselben `cancelCharEdit()` und sind in Fall (2) rot.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie in der Messung; die Kopfleiste zeigt dort alle Knoepfe. */
const BREIT = { width: 1440, height: 900 };
/** Das Telefon — Fall (9), Rueckgaengig ohne Tastatur. */
const TELEFON = { width: 390, height: 844 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Eine Figur mit einem Wert in JEDEM Feld, das das Formular zeigt — sonst
 *  koennte ein Rest im Anlege-Formular stehen, ohne dass ein Fall ihn sieht.
 *  Stufe, Resistenz und Immunitaet sind genau die Felder, die "Abbrechen"
 *  heute stehen laesst. */
const ARIA = {
    id: 1,
    name: 'Aria',
    playerName: 'Anna',
    characterClass: 'Barde',
    subclass: 'Kollegium',
    race: 'Elf',
    level: 5,
    background: 'Gelehrte',
    alignment: 'NG',
    weight: 60,
    attributes: { str: 8, dex: 14, con: 12, int: 13, wis: 10, cha: 18 },
    saveProficiencies: { str: false, dex: true, con: false, int: false, wis: false, cha: true },
    hpCurrent: 30,
    hpMax: 33,
    tempHp: 0,
    armorClass: 14,
    initiative: 2,
    speed: '9m|30ft.',
    proficiencyBonus: 3,
    hitDice: '5d8',
    passivePerception: 12,
    inspiration: true,
    skillProficiencies: { performance: true, persuasion: true },
    skillExpertise: { performance: true },
    attacks: [{ name: 'Rapier', attackBonus: 5, damage: '1d8+2', damageType: 'Stich' }],
    resistances: ['Feuer'],
    immunities: ['Gift'],
    languages: ['Gemein', 'Elfisch'],
    spellSlots: {
        0: { max: 3, current: 3 },
        1: { max: 4, current: 2 },
        2: { max: 3, current: 3 },
        3: { max: 2, current: 1 },
        4: { max: 0, current: 0 },
        5: { max: 0, current: 0 },
        6: { max: 0, current: 0 },
        7: { max: 0, current: 0 },
        8: { max: 0, current: 0 },
        9: { max: 0, current: 0 }
    },
    currency: { pm: 0, gm: 50, em: 0, sm: 7, km: 0 },
    notes: '<p>Aria-Notiz</p>',
    avatar: '',
    height: 170,
    spells: [],
    items: []
};

/** Eine zweite, schlichte Figur — der bearbeitete Eintrag ist nicht der einzige. */
const BRAN = {
    id: 2,
    name: 'Bran',
    playerName: '',
    characterClass: '',
    subclass: '',
    race: '',
    level: 1,
    background: '',
    alignment: '',
    weight: 0,
    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saveProficiencies: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    hpCurrent: 10,
    hpMax: 10,
    tempHp: 0,
    armorClass: 10,
    initiative: 0,
    speed: '9m|30ft.',
    proficiencyBonus: 2,
    hitDice: '',
    passivePerception: 10,
    inspiration: false,
    skillProficiencies: {},
    skillExpertise: {},
    attacks: [],
    resistances: [],
    immunities: [],
    languages: [],
    spellSlots: {},
    currency: { pm: 0, gm: 0, em: 0, sm: 0, km: 0 },
    notes: '',
    avatar: '',
    height: 0,
    spells: [],
    items: []
};

/** @param {object[]} characters */
function seed(characters) {
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
        characters,
        npcs: [],
        locations: [],
        quests: [],
        loot: [],
        spells: [],
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
            characters: 10,
            npcs: 1,
            locations: 1,
            quests: 1,
            encounters: 1,
            spells: 1,
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
 * Laedt breit, saet EINMAL je Tab und oeffnet die Party-Ansicht. Die Saat
 * steht hinter einer sessionStorage-Sperre: ein `page.reload()` liest dann,
 * was die App gespeichert hat, statt die Saat neu zu schreiben.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} characters
 * @param {{ width: number, height: number }} [kleiner] Erst NACH dem Laden
 *  verkleinern — `waitForAppReady()` wartet auf `.app-title`, und die ist im
 *  Mobil-Layout versteckt (wie in `npc-formular.spec.js`).
 */
async function laden(page, characters, kleiner) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('charakter-anlegen-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('charakter-anlegen-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(characters)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN, sonst misst ein Speicher-Fall nichts:
    // repariert `load()` die Saat, schreibt `saveAutomatic()` etwas spaeter
    // den ganzen Stand aus D. Erkennbar daran, dass `_version` der Saat
    // ueberschrieben wird; kommt binnen 4 s keine, steht auch keine aus
    // (bei dieser Saat gemessen: keine — die 4 s laufen also je Fall ab).
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
    // Navigation ist Vorbereitung, nicht die gemessene Handlung.
    await page.evaluate(() => window.switchView('party'));
    await expect(page.locator('#view-party')).toBeVisible();
    if (kleiner) {
        // Das Layout-Profil folgt der Fenstergroesse — dieselbe Wartezeit
        // wie in `npc-formular.spec.js` und `kampfrunde.spec.js`.
        await page.setViewportSize(kleiner);
        await page.waitForTimeout(450);
    }
}

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

// ---------------------------------------------------------------------------
// Bedienelemente
// ---------------------------------------------------------------------------

/** Das Klappformular. */
function formularKarte(page) {
    return page.locator('#char-form');
}

/** Die Kopfzeile "+ Charakter hinzufügen" — ueber ihren PLATZ (die Karte,
 *  die #char-form traegt), nicht ueber `data-action`/`data-value`: die
 *  Anlege-Wege werden mit dem Fix umverdrahtet. Auch nicht ueber den Titel —
 *  der soll beim Bearbeiten einmal anders heissen (V6, eigener Vorgang).
 *  @param {import('@playwright/test').Page} page */
function kopfzeile(page) {
    return page.locator('#view-party .card:has(> #char-form) > .collapsible-header');
}

/** Der Knopf der LEEREN Liste — ueber Rolle und sichtbaren Text.
 *  @param {import('@playwright/test').Page} page */
function leereListeKnopf(page) {
    return page.locator('#party-list').getByRole('button', { name: /Charakter erstellen/ });
}

/** @param {import('@playwright/test').Page} page */
function speichernKnopf(page) {
    return formularKarte(page).getByRole('button', { name: 'Speichern', exact: true });
}
/** @param {import('@playwright/test').Page} page */
function abbrechenKnopf(page) {
    return formularKarte(page).getByRole('button', { name: 'Abbrechen', exact: true });
}

/** ✏️: Klick auf den Kartenkopf (`edit-char`).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function bearbeiten(page, id) {
    await page.locator(`#party-list .char-card-header[data-id="${id}"] .char-card-meta`).click();
    await expect(formularKarte(page)).toHaveClass(/\bopen\b/);
    await expect.poll(() => bearbeitenId(page)).toBe(String(id));
}

/** Die Bearbeiten-ID des Formulars (`#edit-char-id`, Vertrag).
 *  @param {import('@playwright/test').Page} page */
function bearbeitenId(page) {
    return page.evaluate(
        () => /** @type {HTMLInputElement|null} */ (document.getElementById('edit-char-id'))?.value
    );
}

/** 🗑️ an der Karte (der Bestaetigungsdialog wird im Fall angenommen).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function loeschen(page, id) {
    await page.locator(`#party-list [data-action="delete-char"][data-id="${id}"]`).click();
}

/** Befehlspalette → Befehl. Erst tippen, wenn das Suchfeld den Fokus hat;
 *  Enter fuehrt den OBERSTEN Treffer aus, die Suche ist um 80 ms entprellt.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} text */
async function palette(page, text) {
    await page.keyboard.press('Control+Shift+K');
    await expect(page.locator('.cp-overlay')).toBeVisible();
    await expect(page.locator('.cp-input')).toBeFocused();
    await page.keyboard.type(text);
    await expect(page.locator('#cp-results-list .cp-result').first()).toContainText(text);
    await page.keyboard.press('Enter');
    await expect(page.locator('.cp-overlay')).toBeHidden();
}

/** Vorbereitung, nicht die gemessene Handlung: den Fokus aus einem Feld
 *  nehmen, damit eine Taste auf der Seite landet (isTyping-Schranke,
 *  `keyboard-shortcuts.js:249-251` — auch eine Checkbox ist ein INPUT).
 *  @param {import('@playwright/test').Page} page */
async function fokusWeg(page) {
    await page.evaluate(() => /** @type {HTMLElement|null} */ (document.activeElement)?.blur());
}

// ---------------------------------------------------------------------------
// Auslesen
// ---------------------------------------------------------------------------

/** Was das Formular zeigt — jedes Feld, in dem Aria einen Wert hat.
 *  (Der Uebungsbonus fehlt: er ist eine Anzeige, aus der Stufe berechnet.)
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value;
        const an = sel =>
            Array.from(document.querySelectorAll(sel))
                .filter(i => /** @type {HTMLInputElement} */ (i).checked)
                .map(i => /** @type {HTMLInputElement} */ (i).value);
        const kuerzel = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        return {
            offen: document.getElementById('char-form')?.classList.contains('open'),
            id: wert('edit-char-id'),
            name: wert('char-name'),
            spieler: wert('char-player'),
            klasse: wert('char-class'),
            unterklasse: wert('char-subclass'),
            volk: wert('char-race'),
            stufe: wert('char-level'),
            hintergrund: wert('char-background'),
            gesinnung: wert('char-alignment'),
            groesse: wert('char-height'),
            gewicht: wert('char-weight'),
            tp: wert('char-hp-cur'),
            tpMax: wert('char-hp-max'),
            rk: wert('char-ac'),
            ini: wert('char-init'),
            wahrnehmung: wert('char-perception'),
            trefferwuerfel: wert('char-hitdice'),
            inspiration: /** @type {HTMLInputElement|null} */ (
                document.getElementById('char-inspiration')
            )?.checked,
            attribute: kuerzel.map(a => wert('char-' + a)).join(' '),
            rettungswuerfe: kuerzel.filter(
                a =>
                    /** @type {HTMLInputElement|null} */ (document.getElementById('char-save-' + a))
                        ?.checked
            ),
            fertigkeiten: Array.from(
                document.querySelectorAll('#char-form input[id^="char-skill-"]')
            )
                .filter(i => /** @type {HTMLInputElement} */ (i).checked)
                .map(i => i.id.replace('char-skill-', '')),
            zauberplaetze: Array.from({ length: 10 }, (_, i) => wert('char-slot-' + i)).join(' '),
            waehrung: ['pm', 'gm', 'em', 'sm', 'km'].map(m => wert('char-' + m)).join(' '),
            resistenzen: an('#char-resistances input'),
            immunitaeten: an('#char-immunities input'),
            sprachen: an('#cf-lang-dropdown input'),
            angriffe: document.querySelectorAll('#cf-attacks-container .cf-attack-row').length,
            notiz: document.getElementById('char-notes')?.textContent?.trim()
        };
    });
}

/** Das leere, offene Formular im Anlege-Zustand — gemessen frisch nach dem
 *  Laden (Template-Vorgaben: Stufe 1, Attribute 10, Plaetze und Muenzen 0). */
const LEER = {
    offen: true,
    id: '',
    name: '',
    spieler: '',
    klasse: '',
    unterklasse: '',
    volk: '',
    stufe: '1',
    hintergrund: '',
    gesinnung: '',
    groesse: '',
    gewicht: '',
    tp: '',
    tpMax: '',
    rk: '',
    ini: '',
    wahrnehmung: '',
    trefferwuerfel: '',
    inspiration: false,
    attribute: '10 10 10 10 10 10',
    rettungswuerfe: [],
    fertigkeiten: [],
    zauberplaetze: '0 0 0 0 0 0 0 0 0 0',
    waehrung: '0 0 0 0 0',
    resistenzen: [],
    immunitaeten: [],
    sprachen: [],
    angriffe: 0,
    notiz: ''
};

/** Ein Charakter aus D, ohne `undefined`-Felder (dieselbe Form wie im Speicher).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function charInD(page, id) {
    return page.evaluate(
        id => JSON.parse(JSON.stringify(window.D.characters.find(c => c.id === id) ?? null)),
        id
    );
}
/** @param {import('@playwright/test').Page} page
 *  @param {number} id */
function charImSpeicher(page, id) {
    return page.evaluate(
        ([schluessel, id]) => {
            try {
                return (
                    (JSON.parse(localStorage.getItem(schluessel) || '{}').characters || []).find(
                        c => c.id === id
                    ) ?? null
                );
            } catch {
                return '(nicht lesbar)';
            }
        },
        [SPEICHER, id]
    );
}

/** Alle Charaktere als "Name:Spieler", in D bzw. im Speicher. Ohne ID: welche
 *  ID ein neuer Charakter bekommt, entscheidet nextId(), nicht dieser Waechter.
 *  @param {import('@playwright/test').Page} page */
function allesInD(page) {
    return page.evaluate(() => window.D.characters.map(c => `${c.name}:${c.playerName || ''}`));
}
/** @param {import('@playwright/test').Page} page */
function allesImSpeicher(page) {
    return page.evaluate(schluessel => {
        try {
            return (JSON.parse(localStorage.getItem(schluessel) || '{}').characters || []).map(
                c => `${c.name}:${c.playerName || ''}`
            );
        } catch {
            return ['(nicht lesbar)'];
        }
    }, SPEICHER);
}

/** Die ID des Charakters mit diesem Namen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function idVon(page, name) {
    return page.evaluate(name => window.D.characters.find(c => c.name === name)?.id ?? null, name);
}

/** Die Felder eines NEU angelegten Charakters, in denen Aria einen Wert
 *  traegt — ein frisch angelegter hat hier die Vorgaben (gemessen,
 *  `30-rest-diff`).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function neuerCharakter(page, name) {
    return page.evaluate(name => {
        const c = window.D.characters.find(x => x.name === name);
        return c
            ? {
                  spieler: c.playerName,
                  klasse: c.characterClass,
                  volk: c.race,
                  stufe: c.level,
                  uebungsbonus: c.proficiencyBonus,
                  resistenzen: c.resistances,
                  immunitaeten: c.immunities,
                  sprachen: c.languages,
                  angriffe: (c.attacks || []).length,
                  tpMax: c.hpMax,
                  notiz: c.notes
              }
            : null;
    }, name);
}
const NEU_OHNE_ARIA = {
    spieler: '',
    klasse: '',
    volk: '',
    stufe: 1,
    uebungsbonus: 2,
    resistenzen: [],
    immunitaeten: [],
    sprachen: [],
    angriffe: 0,
    tpMax: 0,
    notiz: ''
};

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

/** 💾 im Formular — und warten, bis die entprellte Speicherung geschrieben hat.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} was
 *  @param {(ziel: import('@playwright/test').Locator) => Promise<void>} [druecken] */
async function speichern(page, was, druecken) {
    // ERST EINE NOCH AUSSTEHENDE FREMDE SPEICHERUNG ABWARTEN, sonst kann der
    // neue `_rev` von IHR kommen und der Fall liest den Speicher, bevor dieses
    // 💾 geschrieben hat. Gemessen: in (4) und (7) steht beim 💾 das entprellte
    // save() des 🗑️ noch aus (`deleteWithConfirm()`, `utils/crud-helpers.js`;
    // Anzeige `#save-indicator.saving`). Heute faellt das nicht auf, weil das
    // 💾 dort nichts aendert — nach dem Fix waere es ein Wackler: feuert der
    // Zeitgeber des 🗑️ zwischen dem Lesen des `_rev` und dem Klick, fehlte der
    // neue Charakter im Speicher. save() setzt die Anzeige sofort auf
    // "Speichert..." und nimmt sie erst nach dem Schreiben zurueck.
    await expect(
        page.locator('#save-indicator'),
        `${was}: vorher darf keine fremde Speicherung mehr ausstehen`
    ).not.toHaveClass(/\bsaving\b/, { timeout: SOFORT_MS });
    const rev = await revStand(page);
    if (druecken) await druecken(speichernKnopf(page));
    else await speichernKnopf(page).click();
    await expect
        .poll(() => revStand(page), {
            timeout: SOFORT_MS,
            message: `${was}: save() muss schreiben (entprellt 300 ms)`
        })
        .not.toBe(rev);
}

/** Die Beschriftungen des Rueckgaengig-Stapels, aelteste zuerst.
 *  @param {import('@playwright/test').Page} page */
function undoAktionen(page) {
    return page.evaluate(() => undoStack.map(e => e.action));
}

/** R4 an den Rueckgaengig-Stapel: das 💾 mit verwaister ID legt GENAU einen
 *  Eintrag "Charakter erstellt" an. Nur den Kopf zu pruefen, liesse einen
 *  Fix durch, der das heutige `pushUndo('Charakter bearbeitet')` stehen
 *  laesst und fuer das Neu-Anlegen einen zweiten Eintrag darauflegt — der
 *  leere Eintrag "… bearbeitet" laege dann direkt darunter (Vertrag: "kein
 *  leerer Undo-Eintrag", "geprueft wird VOR pushUndo").
 *  @param {string[]} vorher
 *  @param {string[]} nachher */
function r4Undo(vorher, nachher) {
    weich(
        nachher,
        'genau ein neuer Rueckgaengig-Eintrag "Charakter erstellt", kein leerer "Charakter bearbeitet"'
    ).toEqual([...vorher, 'Charakter erstellt']);
}

/** Die Zusagen von R4 an die Meldungen eines 💾 mit verwaister ID.
 *  @param {string[]} meldungen */
function r4Meldungen(meldungen) {
    weich(
        meldungen,
        'keine Erfolgsmeldung fuer ein Aktualisieren, das nicht stattfinden kann'
    ).not.toContain('success: Charakter aktualisiert');
    weich(
        meldungen.some(
            m =>
                m.startsWith('warning: ') &&
                /existiert nicht mehr/.test(m) &&
                /als neue[rn]? Charakter/.test(m)
        ),
        `eine Warnung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
}

// ===========================================================================
// (1) R1 — KOPFZEILE ZU, KOPFZEILE AUF: LEER, UND 💾 LEGT NEU AN
// ===========================================================================
//
// Der Kernfall und der haeufigste Weg (auch am Telefon gemessen, K3b): die
// Kopfzeile ist Umschalter UND Anlege-Weg. Zuklappen ist ein Abbruch (R3),
// das naechste Aufklappen muss ein leeres Anlege-Formular bringen. Heute
// traegt es id 1 / "Aria", und 💾 ueberschreibt Aria — auch nach dem Neuladen.
test('(1) R1: ✏️ → Kopfzeile zu → Kopfzeile auf zeigt ein leeres Formular, 💾 legt NEU an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, [ARIA, BRAN]);
    const aria = await charInD(page, 1);
    expect(aria?.name, 'die Saat muss in D ankommen').toBe('Aria');

    await bearbeiten(page, 1);
    await kopfzeile(page).click();
    await expect(formularKarte(page), 'die Kopfzeile klappt zu').not.toHaveClass(/\bopen\b/);
    await kopfzeile(page).click();
    await expect(formularKarte(page), 'die Kopfzeile klappt auf').toHaveClass(/\bopen\b/);
    weich(
        await formular(page),
        'Kopfzeile nach ✏️ → Kopfzeile zu: leer und im Anlege-Zustand'
    ).toEqual(LEER);

    await page.locator('#char-name').fill('Neu');
    await speichern(page, '"Neu"');
    weich(await allesInD(page), 'D: Aria und Bran bleiben, "Neu" kommt dazu').toEqual([
        'Aria:Anna',
        'Bran:',
        'Neu:'
    ]);
    weich(await charInD(page, 1), 'D: Aria feldgleich').toEqual(aria);
    weich(await neuerCharakter(page, 'Neu'), 'D: "Neu" traegt nichts von Aria').toEqual(
        NEU_OHNE_ARIA
    );
    weich(await allesImSpeicher(page), 'localStorage').toEqual(['Aria:Anna', 'Bran:', 'Neu:']);
    weich(await charImSpeicher(page, 1), 'localStorage: Aria feldgleich').toEqual(aria);

    await page.reload();
    await waitForAppReady(page);
    weich(await allesInD(page), 'D nach dem Neuladen').toEqual(['Aria:Anna', 'Bran:', 'Neu:']);
    weich(await charInD(page, 1), 'Aria nach dem Neuladen').toEqual(aria);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2) R1 — "ABBRECHEN", DANN TASTE n: OHNE STUFE UND CHIPS DES BEARBEITETEN
// ===========================================================================
//
// "Abbrechen" leert heute die ID — aber nicht alles: Stufe 5, Resistenz
// Feuer und Immunitaet Gift von Aria stehen im naechsten Anlege-Formular und
// landen im neuen Charakter (gemessen, Diff gegen einen frisch angelegten:
// genau level, proficiencyBonus, resistances, immunities).
test('(2) R1: ✏️ → "Abbrechen" → Taste n zeigt ein Formular ohne Werte von Aria', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, [ARIA, BRAN]);
    const aria = await charInD(page, 1);

    await bearbeiten(page, 1);
    await abbrechenKnopf(page).click();
    await expect(formularKarte(page), '"Abbrechen" klappt zu').not.toHaveClass(/\bopen\b/);
    await fokusWeg(page);
    await page.keyboard.press('n');
    await expect(formularKarte(page), 'Taste n oeffnet').toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Taste n nach ✏️ → "Abbrechen"').toEqual(LEER);

    await page.locator('#char-name').fill('Neu');
    await speichern(page, '"Neu"');
    weich(await allesInD(page), 'D').toEqual(['Aria:Anna', 'Bran:', 'Neu:']);
    weich(await charInD(page, 1), 'D: Aria feldgleich').toEqual(aria);
    weich(await neuerCharakter(page, 'Neu'), 'D: "Neu" traegt nichts von Aria').toEqual(
        NEU_OHNE_ARIA
    );
    weich(await allesImSpeicher(page), 'localStorage').toEqual(['Aria:Anna', 'Bran:', 'Neu:']);
    weich(await charImSpeicher(page, 1), 'localStorage: Aria feldgleich').toEqual(aria);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) R1 — KOPFZEILE ZU, DANN BEFEHLSPALETTE "NEUER CHARAKTER"
// ===========================================================================
test('(3) R1: ✏️ → Kopfzeile zu → Befehlspalette "Neuer Charakter" zeigt ein leeres Formular', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, [ARIA, BRAN]);
    const aria = await charInD(page, 1);

    await bearbeiten(page, 1);
    await kopfzeile(page).click();
    await expect(formularKarte(page), 'die Kopfzeile klappt zu').not.toHaveClass(/\bopen\b/);
    await palette(page, 'Neuer Charakter');
    await expect(formularKarte(page), 'die Palette oeffnet').toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Befehlspalette nach ✏️ → Kopfzeile zu').toEqual(LEER);

    await page.locator('#char-name').fill('Neu');
    await speichern(page, '"Neu"');
    weich(await allesInD(page), 'D').toEqual(['Aria:Anna', 'Bran:', 'Neu:']);
    weich(await charInD(page, 1), 'D: Aria feldgleich').toEqual(aria);
    weich(await allesImSpeicher(page), 'localStorage').toEqual(['Aria:Anna', 'Bran:', 'Neu:']);
    weich(await charImSpeicher(page, 1), 'localStorage: Aria feldgleich').toEqual(aria);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) R1 — KOPFZEILE ZU, 🗑️, DANN "➕ CHARAKTER ERSTELLEN" DER LEEREN LISTE
// ===========================================================================
//
// Der Knopf der leeren Liste ist der Weg, auf den man nach dem Loeschen des
// letzten Charakters gestossen wird. Heute traegt das Formular dann die ID
// des geloeschten; 💾 speichert NICHTS, meldet "Charakter aktualisiert" und
// legt einen leeren Rueckgaengig-Eintrag an — auch nach dem Neuladen leer.
test('(4) R1: ✏️ → Kopfzeile zu → 🗑️ → Knopf der leeren Liste zeigt ein leeres Formular, 💾 legt an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await laden(page, [ARIA]);

    await bearbeiten(page, 1);
    await kopfzeile(page).click();
    await expect(formularKarte(page), 'die Kopfzeile klappt zu').not.toHaveClass(/\bopen\b/);
    await loeschen(page, 1);
    await expect.poll(() => allesInD(page), { message: 'Aria ist geloescht' }).toEqual([]);
    await expect(leereListeKnopf(page)).toBeVisible();
    await leereListeKnopf(page).click();
    await expect(formularKarte(page), 'der Knopf der leeren Liste oeffnet').toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Knopf der leeren Liste nach ✏️ → Kopfzeile zu → 🗑️').toEqual(LEER);

    await page.locator('#char-name').fill('Neu');
    await speichern(page, '"Neu"');
    weich(await allesInD(page), 'D: "Neu" ist angelegt').toEqual(['Neu:']);
    weich(await allesImSpeicher(page), 'localStorage').toEqual(['Neu:']);

    await page.reload();
    await waitForAppReady(page);
    weich(await allesInD(page), 'D nach dem Neuladen').toEqual(['Neu:']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (5) WAECHTER R2 — EIN ANLEGE-ENTWURF UEBERLEBT ESCAPE, ZUKLAPPEN UND JEDEN ANLEGE-WEG
// ===========================================================================
//
// Der Fix leert NUR, wenn ein Bearbeiten Reste hinterliess (#edit-char-id
// gesetzt). Ein Entwurf, der nie gespeichert wurde, bleibt — heute schon so
// (gemessen, V5); dieser Fall haelt es fest. Escape tut am Klappformular
// heute nichts; schliesst es das Formular kuenftig, ist das kein Bruch —
// darum klappt der Fall nur zu, was noch offen ist.
//
// OHNE CHARAKTERE gesaet, damit ALLE VIER Anlege-Wege den Entwurf schonen
// muessen, auch der Knopf der leeren Liste: der Vertrag nimmt nur beim
// Encounter zwei Knoepfe aus, die immer leeren. Ein Fix, der den Knopf der
// leeren Liste wie `showEncForm()` bauen wuerde (erst leeren, dann oeffnen),
// waere sonst gruen.
test('(5) R2 (Waechter): ein Anlege-Entwurf ueberlebt Escape, Zuklappen, Taste n, Palette, leere Liste, Kopfzeile', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, []);

    await kopfzeile(page).click();
    await expect(formularKarte(page)).toHaveClass(/\bopen\b/);
    await page.locator('#char-level').fill('3');
    await page.locator('#char-resistances .cf-chip', { hasText: 'Kälte' }).click();
    await page.locator('#char-name').fill('Entwurf');
    const entwurf = await formular(page);
    expect(
        { id: entwurf.id, name: entwurf.name, stufe: entwurf.stufe, res: entwurf.resistenzen },
        'Vorbedingung: der Entwurf steht im Formular'
    ).toEqual({ id: '', name: 'Entwurf', stufe: '3', res: ['Kälte'] });

    await page.keyboard.press('Escape');
    if (await formularKarte(page).evaluate(f => f.classList.contains('open'))) {
        await kopfzeile(page).click();
    }
    await expect(formularKarte(page)).not.toHaveClass(/\bopen\b/);
    await fokusWeg(page);
    await page.keyboard.press('n');
    await expect(formularKarte(page), 'Taste n oeffnet').toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Taste n nach Escape/Zuklappen').toEqual(entwurf);

    await kopfzeile(page).click();
    await expect(formularKarte(page)).not.toHaveClass(/\bopen\b/);
    await palette(page, 'Neuer Charakter');
    await expect(formularKarte(page), 'die Palette oeffnet').toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Befehlspalette nach Zuklappen').toEqual(entwurf);

    await kopfzeile(page).click();
    await expect(formularKarte(page)).not.toHaveClass(/\bopen\b/);
    await expect(leereListeKnopf(page)).toBeVisible();
    await leereListeKnopf(page).click();
    await expect(formularKarte(page), 'der Knopf der leeren Liste oeffnet').toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Knopf der leeren Liste nach Zuklappen').toEqual(entwurf);

    await kopfzeile(page).click();
    await expect(formularKarte(page)).not.toHaveClass(/\bopen\b/);
    await kopfzeile(page).click();
    await expect(formularKarte(page), 'die Kopfzeile oeffnet').toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Kopfzeile nach Zuklappen').toEqual(entwurf);

    await speichern(page, '"Entwurf"');
    weich(await allesInD(page), 'D: der Entwurf ist angelegt').toEqual(['Entwurf:']);
    weich(await allesImSpeicher(page), 'localStorage').toEqual(['Entwurf:']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) R3 — TASTE n UND BEFEHLSPALETTE BEI OFFENEM FORMULAR TUN NICHTS
// ===========================================================================
//
// Heute klappen beide das offene Bearbeiten-Formular ZU (die Eingabe bleibt
// stehen, das naechste n klappt es im Bearbeiten-Zustand wieder auf). Nach
// R3 bleibt es offen und unveraendert — wie NPC-Fall (19); danach dasselbe
// fuer einen offenen Anlege-Entwurf. Den Fokus aus dem Feld nimmt ein Klick
// auf eine Panel-Ueberschrift, wie ein Nutzer es tut.
test('(6) R3: Taste n und Befehlspalette bei offenem ✏️ und offenem Entwurf: das Formular bleibt offen und, wie es ist', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, [ARIA, BRAN]);
    const aria = await charInD(page, 1);

    await bearbeiten(page, 1);
    await page.locator('#char-player').fill('Neue Spielerin');
    await page.locator('#char-form .cf-panel-title').first().click();
    expect(
        await page.evaluate(() => document.activeElement?.tagName),
        'Vorbedingung: nach dem Klick auf die Ueberschrift liegt der Fokus auf BODY'
    ).toBe('BODY');
    const vorher = await formular(page);
    expect(
        { offen: vorher.offen, id: vorher.id, spieler: vorher.spieler },
        'Vorbedingung: das Bearbeiten-Formular mit der Aenderung'
    ).toEqual({ offen: true, id: '1', spieler: 'Neue Spielerin' });

    await page.keyboard.press('n');
    weich(await formular(page), 'Taste n bei offenem ✏️').toEqual(vorher);

    await palette(page, 'Neuer Charakter');
    weich(await formular(page), 'Befehlspalette "Neuer Charakter" bei offenem ✏️').toEqual(vorher);

    // Ohne offenes Formular gaebe es keinen Speichern-Knopf — dann nennen
    // die weichen Zusagen oben den Grund.
    await expect(formularKarte(page), 'die Bearbeitung muss noch offen sein').toHaveClass(
        /\bopen\b/
    );
    await speichern(page, '✏️ → 💾');
    weich(await allesInD(page), 'D: Aria traegt die Aenderung, kein neuer Eintrag').toEqual([
        'Aria:Neue Spielerin',
        'Bran:'
    ]);
    // Nur die Kernfelder: ✏️ → 💾 schreibt die Fertigkeiten-Tabellen
    // vollstaendig aus (alle 18 Schluessel), das ist der normale Rundlauf
    // und nicht Gegenstand dieses Falls.
    /** @param {any} c */
    const kern = c =>
        c && {
            name: c.name,
            playerName: c.playerName,
            characterClass: c.characterClass,
            race: c.race,
            level: c.level,
            hpMax: c.hpMax,
            armorClass: c.armorClass,
            resistances: c.resistances,
            immunities: c.immunities,
            languages: c.languages
        };
    weich(kern(await charInD(page, 1)), 'D: Aria mit der Aenderung, sonst wie vorher').toEqual({
        ...kern(aria),
        playerName: 'Neue Spielerin'
    });
    weich(await allesImSpeicher(page), 'localStorage').toEqual(['Aria:Neue Spielerin', 'Bran:']);

    // R3 GILT AUCH FUER EINEN OFFENEN ANLEGE-ENTWURF ("Ist das Formular schon
    // offen …"). Ohne diesen Teil waere ein Fix gruen, der nur bei gesetzter
    // ID stillhaelt und sonst weiter umschaltet: n klappte den Entwurf zu.
    await kopfzeile(page).click();
    await expect(formularKarte(page), 'die Kopfzeile oeffnet').toHaveClass(/\bopen\b/);
    await page.locator('#char-name').fill('Entwurf');
    await page.locator('#char-form .cf-panel-title').first().click();
    const entwurf = await formular(page);
    expect(
        {
            offen: entwurf.offen,
            id: entwurf.id,
            name: entwurf.name,
            fokus: await page.evaluate(() => document.activeElement?.tagName)
        },
        'Vorbedingung: der offene Entwurf, der Fokus auf BODY'
    ).toEqual({ offen: true, id: '', name: 'Entwurf', fokus: 'BODY' });

    await page.keyboard.press('n');
    weich(await formular(page), 'Taste n bei offenem Entwurf').toEqual(entwurf);

    await palette(page, 'Neuer Charakter');
    weich(await formular(page), 'Befehlspalette "Neuer Charakter" bei offenem Entwurf').toEqual(
        entwurf
    );

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (7) R4 — UNTER DEM OFFENEN ✏️ GELOESCHT: 💾 SPEICHERT NEU UND SAGT ES
// ===========================================================================
//
// Das Formular bleibt nach 🗑️ an der Karte offen, die ID zeigt ins Leere.
// Heute: die Eingabe ist weg, Meldung "Charakter aktualisiert", leerer
// Rueckgaengig-Eintrag "Charakter bearbeitet" — auch nach dem Neuladen.
test('(7) R4: ✏️ → 🗑️ unter dem offenen Formular → 💾 speichert die Eingabe als neuen Charakter', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await laden(page, [ARIA, BRAN]);

    await bearbeiten(page, 1);
    await loeschen(page, 1);
    await expect.poll(() => allesInD(page), { message: 'Aria ist geloescht' }).toEqual(['Bran:']);
    await expect(formularKarte(page), 'Vorbedingung: das Formular ist noch offen').toHaveClass(
        /\bopen\b/
    );
    await page.locator('#char-player').fill('Geaendert');

    const stand = await meldungsStand(page);
    const undoVorher = await undoAktionen(page);
    await speichern(page, '💾 mit verwaister ID');
    weich(await allesInD(page), 'D: die Eingabe ist als neuer Charakter gespeichert').toEqual([
        'Bran:',
        'Aria:Geaendert'
    ]);
    weich(await allesImSpeicher(page), 'localStorage').toEqual(['Bran:', 'Aria:Geaendert']);
    r4Meldungen(await meldungenSeit(page, stand));
    r4Undo(undoVorher, await undoAktionen(page));

    await page.reload();
    await waitForAppReady(page);
    weich(await allesInD(page), 'D nach dem Neuladen').toEqual(['Bran:', 'Aria:Geaendert']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) R4 — Strg+Z MIT DEM FOKUS IM FELD NIMMT DEN EINTRAG UNTER DEM FORMULAR WEG
// ===========================================================================
//
// Strg+Z ist "immer aktiv", auch im Textfeld des offenen Formulars, und nimmt
// hier das Anlegen von "Neu A" zurueck. Das Formular haelt id/Name/"Wirt".
// Heute: 💾 speichert nichts, "Neu A (Wirt)" ist verloren.
test('(8) R4: "Neu A" → ✏️ → "Wirt" → Strg+Z im Feld → 💾 speichert "Neu A" neu und sagt es', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, [ARIA, BRAN]);

    await kopfzeile(page).click();
    await expect(formularKarte(page)).toHaveClass(/\bopen\b/);
    await page.locator('#char-name').fill('Neu A');
    await speichern(page, '"Neu A"');
    const neuA = await idVon(page, 'Neu A');
    expect(neuA, '"Neu A" muss angelegt sein').not.toBeNull();

    await bearbeiten(page, /** @type {number} */ (neuA));
    await page.locator('#char-player').click();
    await page.keyboard.type('Wirt');
    await page.keyboard.press('Control+z');
    await expect
        .poll(() => allesInD(page), { message: 'Strg+Z nimmt "Neu A" zurueck' })
        .toEqual(['Aria:Anna', 'Bran:']);
    await expect(formularKarte(page), 'Vorbedingung: das Formular ist noch offen').toHaveClass(
        /\bopen\b/
    );

    const stand = await meldungsStand(page);
    const undoVorher = await undoAktionen(page);
    await speichern(page, '💾 mit verwaister ID');
    weich(await allesInD(page), 'D: die Eingabe ist gespeichert').toEqual([
        'Aria:Anna',
        'Bran:',
        'Neu A:Wirt'
    ]);
    weich(await allesImSpeicher(page), 'localStorage').toEqual([
        'Aria:Anna',
        'Bran:',
        'Neu A:Wirt'
    ]);
    r4Meldungen(await meldungenSeit(page, stand));
    r4Undo(undoVorher, await undoAktionen(page));

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (9) R4 — DERSELBE WEG OHNE TASTATUR: ↩️ IN DER TELEFON-KOPFLEISTE
// ===========================================================================
//
// Kritik K3c: eine Abwehr, die nur Strg+Z in Feldern sperrt, deckt diesen Weg
// nicht — der Rueckgaengig-KNOPF ist bei offenem Formular sichtbar
// (`assets/templates/modals-tools.html:299`; am Schreibtisch derselbe Weg
// ueber `header.html:38`). Gemessen: "Neu A" samt Eingabe weg, Meldung
// "Charakter aktualisiert", leerer Eintrag. Getippt wird mit `.tap()`.
//
// DER ABSTAND ZWISCHEN ZWEI TIPPERN IST NOETIG, nicht Geduld:
// `initTouchOptimizations()` (`systems/avatars.js`) ruft `preventDefault()`
// auf jedem `touchend` an einem Knopf, der weniger als 300 ms nach dem
// vorigen kommt (Doppeltipp-Zoom-Sperre) — dann entsteht KEIN `click`.
test.describe('(9) Telefon 390x844', () => {
    test.use({ viewport: TELEFON, hasTouch: true, isMobile: true });

    /** Tippt nach mehr als 300 ms Abstand zum vorigen Tipper.
     *  @param {import('@playwright/test').Locator} ziel */
    async function tippen(ziel) {
        await ziel.page().waitForTimeout(350);
        await ziel.tap();
    }

    test('(9) R4: "Neu A" → ✏️ → "Wirt" → ↩️ der Kopfleiste → 💾 speichert "Neu A" neu und sagt es', async ({
        page
    }) => {
        test.setTimeout(60000);
        const fehler = fehlerFangen(page);
        await laden(page, [ARIA], TELEFON);
        await expect(page.locator('html'), 'Vorbedingung: Mobil-Layout').toHaveAttribute(
            'data-layout',
            'mobile'
        );

        await tippen(kopfzeile(page));
        await expect(formularKarte(page)).toHaveClass(/\bopen\b/);
        await page.locator('#char-name').fill('Neu A');
        await speichern(page, '"Neu A"', tippen);
        const neuA = await idVon(page, 'Neu A');
        expect(neuA, '"Neu A" muss angelegt sein').not.toBeNull();

        await tippen(
            page.locator(`#party-list .char-card-header[data-id="${neuA}"] .char-card-meta`)
        );
        await expect(formularKarte(page)).toHaveClass(/\bopen\b/);
        await expect.poll(() => bearbeitenId(page)).toBe(String(neuA));
        await page.locator('#char-player').fill('Wirt');
        const rueckgaengig = page.locator('.mobile-header [title="Rückgängig"]');
        await expect(
            rueckgaengig,
            'Vorbedingung: ↩️ ist bei offenem Formular sichtbar'
        ).toBeVisible();
        await tippen(rueckgaengig);
        await expect
            .poll(() => allesInD(page), { message: '↩️ nimmt "Neu A" zurueck' })
            .toEqual(['Aria:Anna']);
        await expect(formularKarte(page), 'Vorbedingung: das Formular ist noch offen').toHaveClass(
            /\bopen\b/
        );

        const stand = await meldungsStand(page);
        const undoVorher = await undoAktionen(page);
        await speichern(page, '💾 mit verwaister ID', tippen);
        weich(await allesInD(page), 'D: die Eingabe ist gespeichert').toEqual([
            'Aria:Anna',
            'Neu A:Wirt'
        ]);
        weich(await allesImSpeicher(page), 'localStorage').toEqual(['Aria:Anna', 'Neu A:Wirt']);
        r4Meldungen(await meldungenSeit(page, stand));
        r4Undo(undoVorher, await undoAktionen(page));

        weich(await fehler.alle(), 'Telefon: kein Fehler').toEqual([]);
    });
});

// ===========================================================================
// (10) KONTROLLE — ✏️ → 💾 → KOPFZEILE LEGT SCHON HEUTE NEU AN
// ===========================================================================
//
// Speichern ruft `cancelCharEdit()` und leert die ID — der Weg ist heute
// richtig, was das Neu-Anlegen angeht. Er muss es nach dem Fix bleiben (der
// neue Aufklapp-Zweig darf ein gespeichertes Bearbeiten nicht anders
// behandeln). Bewusst NUR ID, Name und das Ergebnis: Stufe und Chips stehen
// auch hier noch (dieselbe Ursache, rot in Fall (2)).
test('(10) (Kontrolle): ✏️ → 💾 → Kopfzeile → "Neu" → 💾 legt neu an, Aria bleibt', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, [ARIA, BRAN]);

    await bearbeiten(page, 1);
    await speichern(page, '✏️ → 💾');
    await expect(formularKarte(page), '💾 klappt zu').not.toHaveClass(/\bopen\b/);
    const aria = await charInD(page, 1);

    await kopfzeile(page).click();
    await expect(formularKarte(page)).toHaveClass(/\bopen\b/);
    const f = await formular(page);
    weich({ id: f.id, name: f.name }, 'Kopfzeile nach ✏️ → 💾').toEqual({ id: '', name: '' });

    await page.locator('#char-name').fill('Neu');
    await speichern(page, '"Neu"');
    weich(await allesInD(page), 'D').toEqual(['Aria:Anna', 'Bran:', 'Neu:']);
    weich(await charInD(page, 1), 'D: Aria wie nach dem ersten 💾').toEqual(aria);
    weich(await allesImSpeicher(page), 'localStorage').toEqual(['Aria:Anna', 'Bran:', 'Neu:']);
    weich(await charImSpeicher(page, 1), 'localStorage: Aria').toEqual(aria);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
