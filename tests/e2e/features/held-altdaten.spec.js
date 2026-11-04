// @ts-check
import fs from 'node:fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

/**
 * ✏️ an einem Helden mit Altdaten laedt ganz oder gar nicht (CHAR-HALBLADEN)
 * ==========================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT: **nach ✏️ an einem Helden steht im Formular genau dieser
 * Held — nie ein Rest des vorher bearbeiteten Helden, eines Entwurfs oder eines leer
 * geoeffneten Formulars —, und 💾 ohne Aenderung schreibt nichts Fremdes auf ihn.** Kann
 * editChar() einen Wert nicht laden, ist das Formular danach leer und zu, mit einer
 * sichtbaren Meldung; einen Mischzustand gibt es nicht.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER BEFUND (Mess- und Kritik-Agent, Chromium, dev und prod, 1440x900 und 390x844, echte
 * Klicks, Tasten und Taps; Saat ueber localStorage vor dem Laden, also durch die Datengrenze)
 *
 * Aria (ID 1) ist vollstaendig, Xaver (ID 2) legitim und in jedem von editChar() gelesenen
 * Feld anders als Aria; Xaver' traegt genau eine Abweichung. 31 Felder x 7 Formen (Zahl, Text,
 * Liste, Objekt, null, fehlend, true) plus Zusatzformen:
 *
 *   - editChar() wirft bei genau 18 Kombinationen, an jedem Einstieg gleich: speed als Zahl
 *     (auch die App-Altform 30), Liste, Objekt, true (`speedVal.split is not a function`);
 *     resistances und immunities als Zahl, Objekt, true (`(ch.resistances || []).includes`);
 *     languages als Zahl, Objekt, true (`languages.split`, in setCharLanguages()); attacks als
 *     Zahl, Text, Objekt, true (`(ch.attacks || []).forEach`). Der Fehler steht nur als
 *     console.error und im Fehlerlog der App; ueber Strg+K laeuft er ungefangen durch
 *     (pageerror). Die Nutzerin sieht nichts.
 *   - B (✏️ Aria, dann ✏️ Xaver'): das Formular bleibt offen; ID, Name und alle Felder vor dem
 *     Wurfpunkt gehoeren Xaver, alles danach Aria. 💾 ohne Aenderung schreibt in 14 Faellen
 *     Arias Werte auf Xaver (bei speed 14 Felder: Trefferwuerfel, Passive Wahrnehmung,
 *     Inspiration, Resistenzen, Immunitaeten, Sprachen, Zauberplaetze, Waehrung, Notizen, Bild,
 *     Groesse, Fertigkeiten, Expertise, Angriffe); nach dem Neuladen steht es so im Speicher.
 *     attacks wirft im letzten Block: keine Fremddaten, aber die Angriffe werden [].
 *   - A (frisch ✏️ Xaver'): das Formular bleibt zu, ✏️ tut sichtbar nichts; das verborgene
 *     Formular traegt ID und Felder bis zum Wurf.
 *   - L (Kopfzeile "+ Charakter hinzufuegen" auf, dann ✏️ Xaver', dann 💾): Xavers Felder
 *     hinter dem Wurfpunkt werden Leerwerte — eigene Daten weg (Kritik, neu).
 *   - E (Entwurf getippt: Name, Bild 'bilder/neuling.png', Notiz, PM 77; dann ✏️ Xaver', 💾):
 *     Bild, Notiz und PM des Entwurfs stehen in Xaver, der Entwurf ist weg (Kritik, neu).
 *   - Offen (g) von AVATAR-VORSCHAU: ein Avatar 42, {x:1} oder true wird im Feld "42",
 *     "[object Object]" bzw. "true", das ✏️ fordert dist/42 usw. an, 💾 schreibt den Text.
 *   - Ohne Wurf laden die legitimen Formen richtig (Kontrolle, languages als Text, speed '9m',
 *     attackBonus '+5', level '7'); manche verlustbehaftet wie seit jeher (E4, unten).
 *
 * DIE URSACHE (features/party/party-crud.js, editChar()): es laedt weder total noch atomar.
 * Es schreibt zuerst `edit-char-id`, dann Feld fuer Feld; vier Leser setzen eine Form voraus,
 * `||` rettet nur falsche Werte. Wirft ein Leser, bleibt alles davor vom neuen, alles danach vom
 * vorigen Inhalt, und `classList.add('open')` am Ende wird nicht erreicht. Die Aufrufer
 * schlucken den Wurf (EventDelegation._handleClick protokolliert nur; navigateToResult ruft
 * editChar() per setTimeout ungefangen), und saveCharacter() uebernimmt den Mischzustand. Die
 * Datengrenze laesst diese Formen bewusst durch (utils/basic.js; speed als Zahl hat die App
 * selbst geschrieben, Reiter-Import bis 99143da7).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (VERTRAG CHAR-HALBLADEN der Kritik, mit den Entscheidungen E1–E6)
 *
 *   E1  Ort: editChar() wird total und atomar; die Datengrenze bleibt, wie sie ist.
 *   R1  Total: editChar() wirft fuer keine Form in keinem gelesenen Feld — kein console.error,
 *       kein Eintrag im Fehlerlog, kein pageerror; an jedem Einstieg (Kartenkopf mit Maus,
 *       Tab+Enter und Tap; 🔍 → "✏️ Bearbeiten"; Strg+K-Treffer). Ausnahme languages, siehe
 *       ABGRENZUNG.
 *   R2  Vollstaendig: nach ✏️ X ist das Formular offen (auch frisch), #edit-char-id ist X, jedes
 *       Steuerelement traegt den Wert aus X, im Altfeld den aus R5 — nie einen Wert des vorher
 *       bearbeiteten Helden, eines Entwurfs oder eines leer geoeffneten Formulars.
 *   R3  Atomar: jeden Fehler beim Laden faengt ein catch-Zweig, der cancelCharEdit() ruft —
 *       Formular leer und zu, keine ID, keine Teilwerte, genau eine Meldung showToast(…,
 *       'error') (E5: sichtbar, nicht ErrorHandler.showError wegen dessen Entprellung) und ein
 *       Eintrag ueber ErrorHandler.log. Der Fehler verlaesst editChar() nicht, auch nicht ueber
 *       Strg+K. Atomar macht DIESER Zweig das Laden — nicht "vorher leeren" und nicht "ID
 *       zuletzt"; wo die ID-Zeile steht, ist freigestellt (nicht messbar, Mutante m4).
 *   R4  Leeren vorab: editChar() ruft vor dem Laden cancelCharEdit(); messbar daran, dass das
 *       Sprachmenue beim ✏️-Wechsel zugeht (HA9).
 *   R5  Leser: speed — Text wie heute, eine Zahl waehlt die Option mit data-ft gleich der Zahl,
 *       sonst '9m|30ft.' (E3), jede andere Form '9m|30ft.'; resistances/immunities — Liste und
 *       Text wie heute, sonst keine Chips; attacks — nur eine Liste wie heute, sonst keine
 *       Zeile; avatar — nur Text, sonst '' (E2: keine Anforderung, kein Scheinpfad). Alles
 *       andere liest wie heute.
 *   R6  Legitimes bleibt: Laden schreibt nie nach D; 💾 ohne Aenderung ergibt in D und im
 *       Speicher dasselbe wie heute, ausser bei den heute werfenden Formen und einem Avatar, der
 *       kein Text ist.
 *   E4  Was sich nicht darstellen laesst (Klasse/Volk/Gesinnung ohne Option, speed-Text ohne
 *       Option, resistances als Objekt): hier nur "kein Wurf"; das Verwerfen bleibt wie heute
 *       (Offen-Punkt, eigener Vorgang).
 *   E6  NPC-, Encounter-, Quest-Formular und Heldenliste/-detail: nicht hier (Offen-Punkte).
 *
 * ABGRENZUNG MIT SPRACHEN-FREI (stapelt auf diesem Vorgang): den Leser fuer languages baut NUR
 * SPRACHEN-FREI; setCharLanguages() bleibt hier unveraendert und darf bei 42/{x:1}/true weiter
 * werfen — der catch-Zweig (R3) faengt es. Die languages-Faelle dieser Datei sichern darum NUR:
 * kein Halbladen (ENTWEDER offen mit Xavers Werten ausserhalb der Sprachen, ODER leer und zu
 * mit genau einer sichtbaren Fehlermeldung und einem Eintrag im Fehlerlog), keine Sprache von
 * Aria, kein Fremdwert in D nach 💾, kein pageerror. Sie legen weder fest, ob das Formular
 * offen oder zu bleibt, noch, welcher Sprachwert gespeichert wird.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DIE FAELLE (gemessen mit dieser Datei am Basisstand 0f63c0be, dev und prod gebaut, Chromium,
 * --workers=3: 63 rot, 11 gruen — rot genau die Fehlerfaelle, gruen genau die Kontrollen)
 *
 *   HA1+HA2  B, Kartenkopf, Maus: ✏️ Aria → ✏️ Xaver' (18 Kombinationen). HA1, das Formular:
 *        kein Fehler, offen, ID 2, jedes Steuerelement = Kontrolle ausser denen des Altfelds,
 *        dort R5 bzw. nichts von Aria. HA2, dann 💾 ohne Aenderung und Neuladen: Xaver in D und
 *        im Speicher = Kontroll-💾 ausser dem Altfeld (dort R5). Ein Fall je Kombination, die
 *        Zusagen sind mit (HA1) bzw. (HA2) beschriftet — HA2 faehrt HA1 ohnehin. 18 von 18 rot;
 *        bei attacks nur an "kein Fehler" (der Wurf liegt im letzten Block, 💾 schreibt dort
 *        schon heute keine Fremddaten), bei languages an Halbladen und Arias Sprachen in D.
 *   HA3  A, frisch ✏️ Xaver' (18): wie HA1                                     18 von 18 rot
 *        (das Formular bleibt zu, das verborgene traegt ID und Teilwerte)
 *   HA4  L, Kopfzeile auf → ✏️ Xaver' → 💾 (speed 30, languages 7, resistances {feuer:true},
 *        immunities true): wie HA1 und HA2                                     4 von 4 rot
 *   HA5  E, Entwurf → ✏️ Xaver' → 💾 (speed 30, languages 7): wie HA2, kein Entwurfswert in
 *        Xaver, 2 Helden                                                       2 von 2 rot
 *   HA6  je speed 30 und languages 7, mit 💾: 🔍 → "✏️ Bearbeiten"; Strg+K-Treffer (languages
 *        dort zusaetzlich mit pageerror); Tab bis zum Kartenkopf + Enter; 390x844 per Tap (B
 *        und L); prod-Buendel (ohne prod-Buendel uebersprungen)              12 von 12 rot
 *   HA7  Offen (g): Avatar 42, {x:1}, true und als Liste, frisch ✏️, dev und prod: keine
 *        Anforderung im App-Ordner, Feld '' und Vorschau "?", 💾 schreibt '' und sonst
 *        dasselbe wie die Kontrolle                                            8 von 8 rot
 *   HA8  R6, Kontrollen: 💾 ohne Aenderung ergibt dasselbe wie heute (Werte am Basisstand
 *        gemessen) — Kontrolle, languages als Text und mit einer freien Sprache, speed '9m' und
 *        '12m|40ft.', attackBonus '+5', level '7', Avatar als relativer Pfad und mit NBSP vor
 *        dem Bild, notes 42, playerName {x:1}                                 11 von 11 gruen
 *   HA9  R4: ✏️ Aria → Sprachmenue auf → ✏️ Xaver: das Menue ist zu            rot
 *
 * Die Einzelheiten ohne Bildschirmweg (Fehlerinjektion, speed 25/40/35/0) stehen in
 * tests/unit/held-laden.test.js (HL1–HL3).
 *
 * DIE MUTANTEN (Kopien des Buendels und von party-crud.js ausserhalb des Repos, nicht
 * eingecheckt; gefahren mit dieser Datei und tests/unit/held-laden.test.js; keine Variante
 * aendert setCharLanguages(), wie oben abgegrenzt — ausser der Gegenprobe "SPRACHEN-FREI"):
 *
 *   fix  totale Leser, Leeren vorab, catch → cancelCharEdit(), ID zuletzt     74 von 74 gruen
 *        dasselbe plus `typeof languages === 'string'` in setCharLanguages()  74 von 74 gruen
 *        (Gegenprobe "SPRACHEN-FREI laedt die Sprachen offen": die languages-Faelle legen
 *        offen/zu nicht fest)
 *   m1   nur Leeren vorab                     62 rot: alles ausser HA8 und HA9 (Formular zu,
 *                                             Fehler; das 💾 von HA2 ist unerreichbar)
 *   m2   nur totale Leser, kein catch         15 rot: die 14 languages-Faelle und HA9
 *   m3   ohne catch                           die 14 languages-Faelle rot (Halbladen)
 *   m4   ID zuerst, mit catch                 gruen (HA1–HA5) — darum keine Regel
 *   m5   Avatar ueber datenText               HA7 rot bei 42 und true (dev und prod: dist/42)
 *   m6   ohne Leeren vorab                    nur HA9 rot
 *   m7   catch ohne cancelCharEdit()          die 14 languages-Faelle rot (zu, ohne ID, mit
 *                                             Teilwerten von Xaver)
 *   m9   Avatar wie heute (`ch.avatar || ''`) HA7 8 von 8 rot
 *
 * WIE GEURTEILT WIRD: am Formular (jedes Steuerelement in #char-form, auch ein kuenftiges,
 * dazu Modifikatoren, Fuss-Anzeige, Sprachanzeige, Vorschau, Angriffszeilen, offen/zu), an D
 * und am Speicher. Bezug ist ein KONTROLLLAUF mit dem legitimen Xaver unter demselben
 * Bedienweg in einem eigenen Browserkontext (je Arbeiter einmal je Weg): sein Formular nach
 * dem ✏️, sein D nach dem 💾, das leere Formular danach und Arias Formular. "Ein Wert von
 * Aria" ist ein Wert gleich Arias, der weder der Kontrolle noch dem Leerwert gleicht. Bedient
 * wird nur mit Klicks, Tasten und Taps; `evaluate` nur zum Ablesen, gesaet wird vor dem Laden
 * (einmal je Tab, ein Neuladen liest, was die App gespeichert hat). Fehler: pageerror,
 * console.error (ohne "Failed to load resource") und das Fehlerlog der App, vom Laden an.
 * Weich sind die Zusagen des Vertrags (ein roter Lauf nennt jede gebrochene), hart nur die
 * Vorbedingungen (Kontrolle, Aria laedt, Dialoge gehen auf).
 *
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD: der gespeicherte Sprachwert und offen/zu bei languages
 * (SPRACHEN-FREI); was sich nicht darstellen laesst (E4); attacks als Text ueber 🔍 (das
 * Detail wirft dort schon vorher, party-details.js, E6); NPC-, Encounter-, Quest-Formular,
 * Heldenliste und -detail (E6); quick-actions Dash bei speed als Zahl (E6); Firefox.
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const APP_URL_PROD = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-optimized.html`;
/** Der App-Ordner, wie Chromium ihn anfordert — dort darf ein Avatar, der kein Text ist,
 *  nichts anfordern (HA7). */
const APP_ORDNER = `file:///${process.cwd().replace(/\\/g, '/')}/dist/`;
/** Der CI-Job `e2e` baut nur dev; den prod-Fall gibt es nur mit `python build.py --production`
 *  (Muster aus bild-lokal.spec.js (W8)). */
const PROD_DA = fs.existsSync(path.join(process.cwd(), 'dist', 'dnd-tracker-optimized.html'));
const PROD_GRUND =
    'kein prod-Buendel — vorher `python build.py --production` (der CI-Job e2e baut nur dev)';

const BREIT = { width: 1440, height: 900 };
const TELEFON = { width: 390, height: 844 };
const SPEICHER = 'dnd-tracker-v4';
/** Zeit nach einer Bedienung fuer Zeichnen und verzoegerte Aufrufe. */
const SETZEN = 250;
/** Strg+K: navigateToResult() ruft editChar() erst nach 100 ms. */
const SUCHE_WARTEN = 600;
/** Abstand vor jedem Tipper (> 300 ms Sperre in initTouchOptimizations()). */
const TIPP_ABSTAND = 450;
/** `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Weiche Zusicherungen fuer die Zusagen des Vertrags. */
const weich = expect.configure({ soft: true });

// ===========================================================================
// SAAT
// ===========================================================================

const BILD_A =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGM4IScHRwzEcQCxYxBBO0tjggAAAABJRU5ErkJggg==';
const BILD_X =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAIAAABvrngfAAAAEUlEQVR4nGOQkzuBhhhoKwQADRIkkRAX1DgAAAAASUVORK5CYII=';

/** @param {number[]} maxe */
function plaetze(maxe) {
    /** @type {Record<number, {max: number, current: number}>} */
    const s = {};
    for (let i = 0; i <= 9; i++) s[i] = { max: maxe[i] || 0, current: maxe[i] || 0 };
    return s;
}

/** Aria: vollstaendig; jeder Wert weicht von Xaver UND vom Leerwert des Formulars ab. */
const ARIA = {
    id: 1,
    name: 'Aria',
    playerName: 'Anna',
    characterClass: 'Magier',
    subclass: 'Bannmagie',
    race: 'Elf',
    level: 5,
    background: 'Weise',
    alignment: 'NG',
    weight: 60,
    height: 170,
    attributes: { str: 8, dex: 14, con: 12, int: 18, wis: 13, cha: 15 },
    saveProficiencies: { int: true, wis: true },
    hpCurrent: 22,
    hpMax: 27,
    tempHp: 3,
    armorClass: 12,
    initiative: 2,
    speed: '12m|40ft.',
    proficiencyBonus: 3,
    hitDice: '5d6',
    passivePerception: 11,
    inspiration: true,
    skillProficiencies: { arcana: true, history: true },
    skillExpertise: { arcana: true },
    attacks: [{ name: 'Dolch', attackBonus: 4, damage: '1d4+2', damageType: 'Stich' }],
    resistances: ['Feuer'],
    immunities: ['Blitz'],
    languages: ['Elfisch', 'Drakonisch'],
    spellSlots: plaetze([3, 4, 3, 2]),
    currency: { pm: 1, gm: 50, em: 3, sm: 7, km: 9 },
    notes: '<p>Aria-Notiz</p>',
    avatar: BILD_A,
    xp: 6500,
    spells: [],
    items: [],
    conditions: [],
    tags: []
};

/** Xaver: legitim, in jedem von editChar() gelesenen Feld anders als Aria. */
const XAVER = {
    id: 2,
    name: 'Xaver',
    playerName: 'Xenia',
    characterClass: 'Kämpfer',
    subclass: 'Champion',
    race: 'Zwerg',
    level: 3,
    background: 'Soldat',
    alignment: 'LN',
    weight: 80,
    height: 140,
    attributes: { str: 16, dex: 12, con: 15, int: 9, wis: 11, cha: 8 },
    saveProficiencies: { str: true, con: true },
    hpCurrent: 28,
    hpMax: 31,
    tempHp: 4,
    armorClass: 18,
    initiative: 1,
    speed: '8m|25ft.',
    proficiencyBonus: 2,
    hitDice: '3d10',
    passivePerception: 13,
    inspiration: false,
    skillProficiencies: { athletics: true, perception: true },
    skillExpertise: { athletics: true },
    attacks: [{ name: 'Streitaxt', attackBonus: 5, damage: '1d8+3', damageType: 'Hieb' }],
    resistances: ['Gift'],
    immunities: ['Kälte'],
    languages: ['Gemein', 'Zwergisch'],
    spellSlots: plaetze([0, 2]),
    currency: { pm: 2, gm: 12, em: 4, sm: 30, km: 5 },
    notes: '<p>Xaver-Notiz</p>',
    avatar: BILD_X,
    xp: 900,
    spells: [],
    items: [],
    conditions: [],
    tags: []
};

/** Der Entwurf von Weg E (getippt, nie gespeichert). */
const ENTWURF = { name: 'Neuling', avatar: 'bilder/neuling.png', notiz: 'Entwurfsnotiz', pm: '77' };

/**
 * Xaver mit EINER Abweichung (`feld` leer: der legitime Xaver).
 * @param {string} [feld]
 * @param {any} [wert]
 * @returns {Record<string, any>}
 */
function xaverMit(feld, wert) {
    const x = JSON.parse(JSON.stringify(XAVER));
    if (feld) x[feld] = wert;
    return x;
}

/** @param {object[]} characters */
function saat(characters) {
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
        bestiary: [],
        bestiaryFavorites: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 3,
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
            factions: 1,
            bestiary: 1
        }
    };
}

// ===========================================================================
// LADEN, FEHLER, ANFORDERUNGEN
// ===========================================================================

/**
 * Laedt, saet EINMAL je Tab, faengt jeden Fehler vom Laden an (pageerror, console.error, das
 * Fehlerlog der App — `sichern()` liest es vor einem Neuladen) und zaehlt die file:-
 * Anforderungen.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} characters
 * @param {{ url?: string, telefon?: boolean }} [opt]
 */
async function laden(page, characters, opt = {}) {
    /** @type {string[]} */
    const fehler = [];
    /** @type {string[]} */
    const anforderungen = [];
    await page.route(/^https?:/i, r => r.abort());
    page.on('pageerror', e => fehler.push('pageerror: ' + String(e.message).split('\n')[0]));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            fehler.push('console.error: ' + m.text().split('\n')[0].slice(0, 200));
        }
    });
    page.on('request', r => {
        if (r.url().startsWith('file:')) anforderungen.push(r.url());
    });
    if (!opt.telefon) await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (sessionStorage.getItem('held-altdaten-gesaet')) return;
                localStorage.setItem(schluessel, JSON.stringify(s));
                sessionStorage.setItem('held-altdaten-gesaet', '1');
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng
            }
        },
        /** @type {[string, any]} */ ([SPEICHER, saat(characters)])
    );
    await page.goto(opt.url || APP_URL);
    if (opt.telefon) {
        await page.waitForFunction(
            () => document.documentElement.dataset.appReady === 'true',
            null,
            {
                timeout: 20000
            }
        );
    } else {
        await waitForAppReady(page);
    }
    // Die fremde Speicherung nach load() abwarten (wie npc-altdaten.spec.js): sonst schreibt
    // sie spaeter und ein Neuladen-Fall liest sie statt dessen, was der Weg schrieb.
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
            { timeout: SOFORT_MS }
        )
        .catch(() => {});
    await page.waitForTimeout(300);

    /** @type {string[]} */
    const gesichert = [];
    const appLog = () =>
        page.evaluate(() =>
            // @ts-ignore
            (window.ErrorHandler?.getRecentErrors?.(50) || []).map(
                /** @param {any} e */ e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
            )
        );
    return {
        anforderungen,
        /** Das Fehlerlog der App festhalten, bevor ein Neuladen es leert. */
        async sichern() {
            gesichert.push(...(await appLog()));
        },
        /** @returns {Promise<string[]>} */
        async alle() {
            return [...fehler, ...gesichert, ...(await appLog())];
        }
    };
}

/** @typedef {Awaited<ReturnType<typeof laden>>} Beobachtung */

// ===========================================================================
// BEDIENUNG
// ===========================================================================

/**
 * Klick, am Telefon Tipper mit Abstand.
 * @param {import('@playwright/test').Page} page
 * @param {boolean} tap
 * @returns {(ziel: import('@playwright/test').Locator) => Promise<void>}
 */
function bedienung(page, tap) {
    return async ziel => {
        if (tap) {
            await page.waitForTimeout(TIPP_ABSTAND);
            await ziel.tap();
        } else {
            await ziel.click();
        }
        await page.waitForTimeout(SETZEN);
    };
}

/** @typedef {(ziel: import('@playwright/test').Locator) => Promise<void>} Bedien */

/**
 * Mitte eines Elements und ob dort wirklich es selbst obenauf liegt (bild-lokal.spec.js).
 * @param {import('@playwright/test').Page} page @param {string} sel
 */
function mitteFrei(page, sel) {
    return page.evaluate(s => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const x = Math.round(r.left + r.width / 2);
        const y = Math.round(r.top + r.height / 2);
        const oben = document.elementFromPoint(x, y);
        return { x, y, frei: !!oben && (oben === el || el.contains(oben)) };
    }, sel);
}

/**
 * Zur Heldenansicht ueber die echte Navigation (wie zuReiter() in bild-lokal.spec.js). Am
 * Telefon vorher den Umzugshinweis per Tap wegnehmen (bild-lokal.spec.js (W7), mobil()).
 * @param {import('@playwright/test').Page} page
 */
async function zurParty(page) {
    const reiterSel = '.nav-tab[data-view="party"]';
    const mobil = await page.evaluate(() => document.documentElement.dataset.layout === 'mobile');
    if (mobil) {
        const hinweis = page.locator('#migration-hint-banner');
        if (await hinweis.isVisible()) {
            await page.waitForTimeout(TIPP_ABSTAND);
            await hinweis.locator('[data-action="close-migration-hint"]').tap();
            await expect(hinweis).toBeHidden();
        }
        await page.waitForTimeout(TIPP_ABSTAND);
        const u = await mitteFrei(page, '.mobile-nav-toggle');
        expect(u && u.frei, 'Vorbedingung: der Umschalter der Leiste ist frei').toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (u).x, /** @type {any} */ (u).y);
        await page.waitForTimeout(TIPP_ABSTAND);
        await page.locator(reiterSel).scrollIntoViewIfNeeded();
        let m = null;
        for (let i = 0; i < 40; i++) {
            m = await mitteFrei(page, reiterSel);
            if (m && m.frei) break;
            await page.waitForTimeout(150);
        }
        expect(m && m.frei, 'Vorbedingung: der Reiter party ist frei').toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (m).x, /** @type {any} */ (m).y);
        await expect(page.locator('#view-party')).toHaveClass(/\bactive\b/);
        await page.waitForTimeout(TIPP_ABSTAND);
        const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
        if (offen) {
            const u2 = await mitteFrei(page, '.mobile-nav-toggle');
            await page.touchscreen.tap(/** @type {any} */ (u2).x, /** @type {any} */ (u2).y);
            await page.waitForTimeout(TIPP_ABSTAND);
        }
        return;
    }
    const reiter = page.locator(reiterSel).first();
    if (!(await reiter.isVisible())) {
        await page.locator('.nav-group', { has: reiter }).locator('.nav-group-btn').click();
    }
    await reiter.click();
    await expect(page.locator('#view-party')).toHaveClass(/\bactive\b/);
    await page.waitForTimeout(SETZEN);
}

/** @param {import('@playwright/test').Page} page @param {number} id */
const kartenkopf = (page, id) =>
    page.locator(`#party-list .char-card-header[data-id="${id}"] .char-card-meta`);
/** Die Kopfzeile "+ Charakter hinzufuegen" ueber ihren PLATZ (bild-lokal.spec.js).
 *  @param {import('@playwright/test').Page} page */
const kopfzeile = page => page.locator('#view-party .card:has(> #char-form) > .collapsible-header');
/** @param {import('@playwright/test').Page} page */
const formular = page => page.locator('#char-form');
/** @param {import('@playwright/test').Page} page */
const speichernKnopf = page =>
    formular(page).getByRole('button', { name: 'Speichern', exact: true });

/** @param {import('@playwright/test').Page} page */
function bearbeitenId(page) {
    return page.evaluate(
        () => /** @type {HTMLInputElement|null} */ (document.getElementById('edit-char-id'))?.value
    );
}

/** Vorbedingung nach ✏️ Aria (legitim): offen, ID 1.
 *  @param {import('@playwright/test').Page} page */
async function ariaGeladen(page) {
    await expect(formular(page), 'Vorbedingung: ✏️ Aria oeffnet das Formular').toHaveClass(
        /\bopen\b/
    );
    await expect.poll(() => bearbeitenId(page), { message: 'Vorbedingung: ✏️ Aria' }).toBe('1');
}

/**
 * Tab, bis der Kartenkopf des Helden den Fokus hat (hoechstens 400 Mal).
 * @param {import('@playwright/test').Page} page @param {number} id
 */
async function tabBisKartenkopf(page, id) {
    for (let i = 0; i < 400; i++) {
        await page.keyboard.press('Tab');
        const da = await page.evaluate(
            i => !!document.activeElement?.matches?.(`.char-card-header[data-id="${i}"]`),
            id
        );
        if (da) return;
    }
    throw new Error(`Vorbedingung: Kartenkopf ${id} per Tab nicht erreicht`);
}

/**
 * Feld anklicken bzw. antippen, leeren (Strg+A, Entf) und Zeichen fuer Zeichen tippen.
 * @param {import('@playwright/test').Page} page
 * @param {string} selektor
 * @param {string} text
 * @param {Bedien} bedien
 */
async function eintippen(page, selektor, text, bedien) {
    await bedien(page.locator(selektor));
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type(text);
}

/**
 * Die Bedienwege bis einschliesslich ✏️ an Xaver (ID 2).
 * @type {Record<string, (page: import('@playwright/test').Page, bedien: Bedien) => Promise<void>>}
 */
const WEGE = {
    /** B: ✏️ Aria, dann ✏️ Xaver ueber den Kartenkopf. */
    async B(page, bedien) {
        await bedien(kartenkopf(page, 1));
        await ariaGeladen(page);
        await bedien(kartenkopf(page, 2));
    },
    /** A: frisch ✏️ Xaver. */
    async A(page, bedien) {
        await bedien(kartenkopf(page, 2));
    },
    /** L: Kopfzeile auf (leeres offenes Formular), dann ✏️ Xaver. */
    async L(page, bedien) {
        await bedien(kopfzeile(page));
        await expect(formular(page), 'Vorbedingung: die Kopfzeile oeffnet').toHaveClass(/\bopen\b/);
        await bedien(kartenkopf(page, 2));
    },
    /** E: Kopfzeile auf, Entwurf tippen, dann ✏️ Xaver. */
    async E(page, bedien) {
        await bedien(kopfzeile(page));
        await expect(formular(page), 'Vorbedingung: die Kopfzeile oeffnet').toHaveClass(/\bopen\b/);
        await eintippen(page, '#char-name', ENTWURF.name, bedien);
        await eintippen(page, '#char-avatar', ENTWURF.avatar, bedien);
        await eintippen(page, '#char-notes', ENTWURF.notiz, bedien);
        await eintippen(page, '#char-pm', ENTWURF.pm, bedien);
        await page.waitForTimeout(SETZEN);
        await bedien(kartenkopf(page, 2));
    },
    /** 🔍 → "✏️ Bearbeiten" im Detail-Dialog, nach ✏️ Aria. */
    async Detail(page, bedien) {
        await bedien(kartenkopf(page, 1));
        await ariaGeladen(page);
        await bedien(page.locator('#char-2 [data-action="show-char-details"]'));
        await expect(
            page.locator('#char-detail-modal'),
            'Vorbedingung: das Detail geht auf'
        ).toHaveClass(/\bshow\b/);
        await bedien(page.locator('#char-detail-modal [data-action="edit-char-from-modal"]'));
        await expect(page.locator('#char-detail-modal')).not.toHaveClass(/\bshow\b/);
    },
    /** Strg+K, "Xaver" tippen, Treffer klicken (navigateToResult → setTimeout → editChar). */
    async StrgK(page, bedien) {
        await bedien(kartenkopf(page, 1));
        await ariaGeladen(page);
        await page.keyboard.press('Control+k');
        await expect(page.locator('#global-search'), 'Vorbedingung: Strg+K').toBeFocused();
        await page.keyboard.type('Xaver', { delay: 30 });
        const treffer = page
            .locator('#global-search-results .search-result-item[data-type="character"]')
            .filter({ hasText: 'Xaver' })
            .first();
        await treffer.click();
        await page.waitForTimeout(SUCHE_WARTEN);
    },
    /** Tab bis zum Kartenkopf + Enter, fuer Aria und Xaver. */
    async Tab(page) {
        await tabBisKartenkopf(page, 1);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(SETZEN);
        await ariaGeladen(page);
        await tabBisKartenkopf(page, 2);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(SETZEN);
    }
};

// ===========================================================================
// ABLESEN
// ===========================================================================

/**
 * Das Charakterformular, wie es steht: JEDES Steuerelement in #char-form (auch eines, das es
 * heute noch nicht gibt), dazu Modifikatoren, Fuss-, Sprach- und Bildanzeige, die
 * Angriffszeilen und ob das Formular offen ist. Dieselbe Lesart wie formularStand() in
 * tests/unit/held-laden.test.js.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Record<string, any>>}
 */
function formularStand(page) {
    return page.evaluate(() => {
        const form = /** @type {HTMLElement} */ (document.getElementById('char-form'));
        /** @type {Record<string, any>} */
        const r = {};
        r.offen = form.classList.contains('open');
        r['char-form-icon'] = document.getElementById('char-form-icon')?.textContent ?? null;
        let ohneId = 0;
        for (const el of form.querySelectorAll('input, select, textarea, [contenteditable]')) {
            if (el.closest('#cf-attacks-container')) continue;
            const e = /** @type {HTMLInputElement} */ (el);
            const gruppe = e.closest('#char-resistances, #char-immunities, #cf-lang-dropdown');
            const k =
                gruppe && e.type === 'checkbox'
                    ? `${gruppe.id}:${e.value}`
                    : e.id || `ohne-id-${ohneId++}`;
            if (e.getAttribute('contenteditable') === 'true') {
                r[k] = e.innerHTML;
            } else if (e.type === 'checkbox' || e.type === 'radio') {
                const traeger = e.closest('.cf-chip, .cf-lang-item');
                r[k] = traeger
                    ? `${e.checked}|${traeger.classList.contains('selected') ? 'markiert' : 'unmarkiert'}`
                    : e.checked;
            } else if (e.tagName === 'SELECT' && /** @type {any} */ (e).multiple) {
                r[k] = [.../** @type {any} */ (e).options]
                    .map(o => (o.selected ? o.value : `(${o.value})`))
                    .join(',');
            } else {
                r[k] = e.value;
            }
        }
        for (const el of form.querySelectorAll('[id$="-mod"], #char-speed-ft, #cf-lang-display')) {
            r[el.id] = (el.textContent || '').trim();
        }
        const vorschau = /** @type {HTMLElement} */ (document.getElementById('cf-avatar-preview'));
        const bild = vorschau.querySelector('img');
        r['cf-avatar-preview'] = bild
            ? `Bild ${bild.getAttribute('src')}`
            : `Text ${(vorschau.textContent || '').trim()}`;
        r.angriffe = [...form.querySelectorAll('#cf-attacks-container .cf-attack-row')]
            .map(z =>
                [...z.querySelectorAll('input')]
                    .map(i => /** @type {HTMLInputElement} */ (i).value)
                    .join('/')
            )
            .join(' | ');
        return r;
    });
}

/** @param {import('@playwright/test').Page} page @param {number} id */
function heldInD(page, id) {
    return page.evaluate(i => {
        // @ts-ignore
        const c = (window.D?.characters || []).find(x => x && x.id === i);
        return c ? JSON.parse(JSON.stringify(c)) : null;
    }, id);
}
/** @param {import('@playwright/test').Page} page @param {number} id */
function heldImSpeicher(page, id) {
    return page.evaluate(([k, i]) => {
        try {
            const d = JSON.parse(localStorage.getItem(String(k)) || '{}');
            return (d.characters || []).find(/** @param {any} c */ c => c && c.id === i) || null;
        } catch {
            return null;
        }
    }, /** @type {[string, number]} */ ([SPEICHER, id]));
}
/** @param {import('@playwright/test').Page} page */
function anzahlHelden(page) {
    // @ts-ignore
    return page.evaluate(() => (window.D?.characters || []).length);
}

/**
 * 💾 klicken bzw. tippen und warten, bis der Speicher D gleicht. Gibt Xaver aus D zurueck.
 * @param {import('@playwright/test').Page} page
 * @param {Bedien} bedien
 */
async function speichern(page, bedien) {
    await bedien(speichernKnopf(page));
    await expect
        .poll(
            async () =>
                JSON.stringify(await heldImSpeicher(page, 2)) ===
                JSON.stringify(await heldInD(page, 2)),
            { timeout: SOFORT_MS, message: '💾 landet im Speicher' }
        )
        .toBe(true);
    return heldInD(page, 2);
}

/**
 * Neu laden (die Saat bleibt aus: sessionStorage-Sperre) und warten, bis die App steht.
 * @param {import('@playwright/test').Page} page
 * @param {Beobachtung} beob
 * @param {boolean} telefon
 */
async function neuLaden(page, beob, telefon) {
    await beob.sichern();
    await page.reload();
    if (telefon) {
        await page.waitForFunction(
            () => document.documentElement.dataset.appReady === 'true',
            null,
            {
                timeout: 20000
            }
        );
    } else {
        await waitForAppReady(page);
    }
    await page.waitForTimeout(300);
}

// ===========================================================================
// KONTROLLE
// ===========================================================================

/**
 * @typedef {{
 *   stand: Record<string, any>, leer: Record<string, any>, aria: Record<string, any>,
 *   d: Record<string, any>, fehler: string[]
 * }} Kontrolle
 */

/** Je Arbeiter einmal je Weg, Buendel und Groesse. @type {Map<string, Promise<Kontrolle>>} */
const KONTROLLEN = new Map();

/**
 * @typedef {{ weg: string, url: string, telefon: boolean }} Lauf
 * @typedef {{ page: import('@playwright/test').Page, browser: import('@playwright/test').Browser,
 *   optionen: import('@playwright/test').BrowserContextOptions }} Werkzeug
 */

/**
 * Der Kontrolllauf mit dem legitimen Xaver unter demselben Weg, in einem EIGENEN Kontext
 * (kein geteilter Speicher mit dem Fall): Formular nach dem ✏️, D nach dem 💾, das leere
 * Formular danach, und Arias Formular nach einem ✏️ Aria.
 * @param {Werkzeug} w
 * @param {Lauf} lauf
 * @returns {Promise<Kontrolle>}
 */
function kontrolle(w, lauf) {
    const schluessel = `${lauf.weg}|${lauf.url}|${lauf.telefon}`;
    let p = KONTROLLEN.get(schluessel);
    if (!p) {
        p = (async () => {
            const kontext = await w.browser.newContext(w.optionen);
            try {
                const page = await kontext.newPage();
                const beob = await laden(page, [ARIA, xaverMit()], {
                    url: lauf.url,
                    telefon: lauf.telefon
                });
                await zurParty(page);
                const bedien = bedienung(page, lauf.telefon);
                await WEGE[lauf.weg](page, bedien);
                const stand = await formularStand(page);
                const d = await speichern(page, bedien);
                const leer = await formularStand(page);
                await bedien(kartenkopf(page, 1));
                await ariaGeladen(page);
                const aria = await formularStand(page);
                return { stand, leer, aria, d, fehler: await beob.alle() };
            } finally {
                await kontext.close();
            }
        })();
        p.catch(() => KONTROLLEN.delete(schluessel));
        KONTROLLEN.set(schluessel, p);
    }
    return p;
}

/**
 * Vorbedingung: die Kontrolle laedt fehlerfrei, offen, als Xaver, und 💾 leert.
 * @param {Kontrolle} k
 */
function kontrolleTraegt(k) {
    expect(k.fehler, 'Vorbedingung: der Kontrolllauf ist fehlerfrei').toEqual([]);
    expect(
        { offen: k.stand.offen, id: k.stand['edit-char-id'], name: k.stand['char-name'] },
        'Vorbedingung: die Kontrolle laedt Xaver'
    ).toEqual({ offen: true, id: '2', name: 'Xaver' });
    expect(
        { offen: k.leer.offen, id: k.leer['edit-char-id'] },
        'Vorbedingung: nach dem 💾 der Kontrolle ist das Formular leer und zu'
    ).toEqual({ offen: false, id: '' });
    expect(k.aria['char-name'], 'Vorbedingung: ✏️ Aria laedt Aria').toBe('Aria');
}

// ===========================================================================
// URTEIL
// ===========================================================================

/**
 * Gehoert ein Schluessel aus formularStand() zu diesem Datenfeld?
 * @param {string} feld @param {string} k
 */
function gehoertZu(feld, k) {
    switch (feld) {
        case 'speed':
            return k === 'char-speed' || k === 'char-speed-ft';
        case 'resistances':
            return k.startsWith('char-resistances:');
        case 'immunities':
            return k.startsWith('char-immunities:');
        case 'languages':
            return (
                k.startsWith('cf-lang-dropdown:') ||
                k === 'char-languages' ||
                k === 'cf-lang-display'
            );
        case 'attacks':
            return k === 'angriffe';
        case 'avatar':
            return k === 'char-avatar' || k === 'cf-avatar-preview';
        default:
            return false;
    }
}

/** Was R5 nach dem 💾 im Altfeld verlangt (languages: Sache von SPRACHEN-FREI).
 *  @type {Record<string, any>} */
const R5_GESPEICHERT = {
    speed: '9m|30ft.',
    resistances: [],
    immunities: [],
    attacks: [],
    avatar: ''
};

/**
 * Teilobjekt mit genau diesen Schluesseln.
 * @param {Record<string, any>} o @param {string[]} ks
 */
function nur(o, ks) {
    /** @type {Record<string, any>} */
    const r = {};
    for (const k of ks) r[k] = o[k];
    return r;
}

/**
 * Schluessel mit einem Wert von Aria: gleich Arias Formular, aber weder gleich der Kontrolle
 * noch dem Leerwert.
 * @param {Record<string, any>} z @param {Kontrolle} k
 */
function arienWerte(z, k) {
    return Object.keys(z).filter(
        s => z[s] === k.aria[s] && k.aria[s] !== k.stand[s] && k.aria[s] !== k.leer[s]
    );
}

/** Arias Sprachen im Formular (Haken, verborgene Liste, Anzeige). @param {Record<string, any>} z */
function arienSprachen(z) {
    return ARIA.languages.filter(
        l =>
            String(z[`cf-lang-dropdown:${l}`]).startsWith('true') ||
            String(z['char-languages']).split(',').includes(l) ||
            String(z['cf-lang-display']).includes(l)
    );
}

/**
 * Fremde Sprachen in D (von Aria oder aus dem Entwurf).
 * @param {any} sprachen
 */
function fremdeSprachenInD(sprachen) {
    return Array.isArray(sprachen) ? sprachen.filter(l => ARIA.languages.includes(l)) : [];
}

/**
 * Das Formular nach dem ✏️ (HA1/HA3, und der Formularteil von HA4–HA6). Gibt zurueck, ob das
 * Formular offen ist.
 * @param {import('@playwright/test').Page} page
 * @param {Beobachtung} beob
 * @param {Kontrolle} k
 * @param {string} feld
 * @param {any} wert
 * @param {string} wo
 */
async function formularUrteil(page, beob, k, feld, wert, wo) {
    const z = await formularStand(page);
    const fehler = await beob.alle();

    if (feld === 'languages' && !z.offen) {
        // Der catch-Zweig (R3, E5): leer und zu, genau eine sichtbare Meldung, ein Logeintrag.
        weich(z, `${wo}: bleibt das Formular zu, dann leer — kein Halbladen (R3)`).toEqual(k.leer);
        const meldung = page.locator('#event-log .event-log-entry.error');
        await weich(meldung, `${wo}: genau eine Fehlermeldung (E5)`).toHaveCount(1);
        await weich(meldung.first(), `${wo}: die Fehlermeldung ist sichtbar (E5)`).toBeVisible();
        weich(
            fehler.filter(f => f.startsWith('ErrorHandler')).length,
            `${wo}: genau ein Eintrag im Fehlerlog (R3)`
        ).toBe(1);
        weich(
            fehler.filter(f => f.startsWith('pageerror')),
            `${wo}: kein pageerror (R3)`
        ).toEqual([]);
        return false;
    }

    weich(
        { offen: z.offen, id: z['edit-char-id'] },
        `${wo}: das Formular ist offen und bearbeitet Xaver (R2)`
    ).toEqual({ offen: true, id: '2' });
    const ausserhalb = Object.keys(k.stand).filter(s => !gehoertZu(feld, s));
    weich(
        nur(z, ausserhalb),
        `${wo}: jedes Steuerelement ausser ${feld} traegt Xavers Wert (R2)`
    ).toEqual(nur(k.stand, ausserhalb));
    weich(arienWerte(z, k), `${wo}: kein Wert von Aria (R2)`).toEqual([]);
    if (feld === 'languages') {
        weich(arienSprachen(z), `${wo}: keine Sprache von Aria (R2)`).toEqual([]);
        weich(
            fehler.filter(f => f.startsWith('pageerror')),
            `${wo}: kein pageerror (R3)`
        ).toEqual([]);
    } else {
        if (feld in R5_GESPEICHERT && !(feld === 'attacks' && Array.isArray(wert))) {
            const alt = Object.keys(k.leer).filter(s => gehoertZu(feld, s));
            weich(nur(z, alt), `${wo}: ${feld} zeigt den Leerwert aus R5`).toEqual(
                nur(k.leer, alt)
            );
        }
        weich(fehler, `${wo}: kein Fehler — pageerror, console.error, Fehlerlog (R1)`).toEqual([]);
    }
    return z.offen;
}

/**
 * Xaver in D bzw. im Speicher nach dem 💾 (HA2 und Folgende).
 * @param {Record<string, any>|null} ist
 * @param {Kontrolle} k
 * @param {string} feld
 * @param {string} wo
 */
function datensatzUrteil(ist, k, feld, wo) {
    const ohne = (/** @type {Record<string, any>|null} */ o) => {
        const c = { ...(o || {}) };
        delete c[feld];
        return c;
    };
    weich(ohne(ist), `${wo}: alles ausser ${feld} wie das 💾 der Kontrolle (R6)`).toEqual(
        ohne(k.d)
    );
    if (feld === 'languages') {
        weich(fremdeSprachenInD(ist?.languages), `${wo}: keine Sprache von Aria in D`).toEqual([]);
    } else if (feld in R5_GESPEICHERT) {
        weich(ist?.[feld], `${wo}: ${feld} nach R5`).toEqual(R5_GESPEICHERT[feld]);
    }
}

/**
 * Ein Fall: Saat mit Xaver', Weg, Formular-Urteil, auf Wunsch 💾 (und Neuladen).
 * @param {Werkzeug} w
 * @param {{ weg: string, feld: string, wert: any, speichern?: boolean, neuladen?: boolean,
 *   url?: string, telefon?: boolean, titel: string, formTitel?: string }} fall
 */
async function fallFahren(w, fall) {
    const lauf = { weg: fall.weg, url: fall.url || APP_URL, telefon: !!fall.telefon };
    const k = await kontrolle(w, lauf);
    kontrolleTraegt(k);
    const { page } = w;
    const beob = await laden(page, [ARIA, xaverMit(fall.feld, fall.wert)], {
        url: lauf.url,
        telefon: lauf.telefon
    });
    await zurParty(page);
    const vorD = await heldInD(page, 2);
    const bedien = bedienung(page, lauf.telefon);
    await WEGE[fall.weg](page, bedien);
    const offen = await formularUrteil(
        page,
        beob,
        k,
        fall.feld,
        fall.wert,
        fall.formTitel || fall.titel
    );
    if (!fall.speichern) return;

    if (!offen) {
        if (fall.feld !== 'languages') return; // schon rot: offen ist Zusage (R2)
        // languages, catch-Zweig: kein 💾-Weg; D und Speicher bleiben, wie sie waren.
        weich(await heldInD(page, 2), `${fall.titel}: D unveraendert`).toEqual(vorD);
        weich(await anzahlHelden(page), `${fall.titel}: 2 Helden`).toBe(2);
        if (fall.neuladen) {
            await neuLaden(page, beob, lauf.telefon);
            weich(
                await heldInD(page, 2),
                `${fall.titel}: nach dem Neuladen D unveraendert`
            ).toEqual(vorD);
        }
        return;
    }
    const d = await speichern(page, bedien);
    datensatzUrteil(d, k, fall.feld, `${fall.titel}, 💾`);
    weich(await anzahlHelden(page), `${fall.titel}: 2 Helden nach dem 💾`).toBe(2);
    if (fall.neuladen) {
        await neuLaden(page, beob, lauf.telefon);
        datensatzUrteil(
            await heldInD(page, 2),
            k,
            fall.feld,
            `${fall.titel}, nach dem Neuladen in D`
        );
        datensatzUrteil(
            await heldImSpeicher(page, 2),
            k,
            fall.feld,
            `${fall.titel}, nach dem Neuladen im Speicher`
        );
        const fehler = await beob.alle();
        weich(
            fehler.filter(f => f.startsWith('pageerror')),
            `${fall.titel}: kein pageerror`
        ).toEqual([]);
    }
}

// ===========================================================================
// FAELLE
// ===========================================================================

/** Die 18 Kombinationen: die 17 werfenden der Messung und die App-Altform speed:30.
 *  @type {Array<[string, string, any]>} */
const WERFEND = [
    ['speed', 'Zahl 42', 42],
    ['speed', 'Liste', ['abc']],
    ['speed', 'Objekt', { x: 1 }],
    ['speed', 'true', true],
    ['speed', 'App-Altform 30', 30],
    ['resistances', 'Zahl 42', 42],
    ['resistances', 'Objekt', { x: 1 }],
    ['resistances', 'true', true],
    ['immunities', 'Zahl 42', 42],
    ['immunities', 'Objekt', { x: 1 }],
    ['immunities', 'true', true],
    ['languages', 'Zahl 42', 42],
    ['languages', 'Objekt', { x: 1 }],
    ['languages', 'true', true],
    ['attacks', 'Zahl 42', 42],
    ['attacks', 'Text', 'abc'],
    ['attacks', 'Objekt', { x: 1 }],
    ['attacks', 'true', true]
];

/** @type {[string, string, any]} */
const SPEED_30 = ['speed', 'App-Altform 30', 30];
/** @type {[string, string, any]} */
const SPRACHEN_7 = ['languages', 'Zahl 7', 7];

test.describe('CHAR-HALBLADEN — ✏️ an einem Helden mit Altdaten laedt ganz oder gar nicht', () => {
    test.describe.configure({ timeout: 120000 });

    test.describe('1440x900, Maus und Tastatur, dev', () => {
        for (const [feld, form, wert] of WERFEND) {
            test(`(HA1+HA2) B: ✏️ Aria → ✏️ Xaver mit ${feld} als ${form} → 💾 → Neuladen — Formular, D und Speicher wie die Kontrolle`, async ({
                page,
                browser,
                viewport,
                hasTouch,
                isMobile,
                userAgent,
                deviceScaleFactor
            }) => {
                const optionen = { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor };
                await fallFahren(
                    { page, browser, optionen },
                    {
                        weg: 'B',
                        feld,
                        wert,
                        speichern: true,
                        neuladen: true,
                        formTitel: `(HA1) ${feld} als ${form}`,
                        titel: `(HA2) ${feld} als ${form}`
                    }
                );
            });
        }

        for (const [feld, form, wert] of WERFEND) {
            test(`(HA3) A: frisch ✏️ Xaver mit ${feld} als ${form} — offen, Xavers Werte, kein Fehler`, async ({
                page,
                browser,
                viewport,
                hasTouch,
                isMobile,
                userAgent,
                deviceScaleFactor
            }) => {
                const optionen = { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor };
                await fallFahren(
                    { page, browser, optionen },
                    { weg: 'A', feld, wert, titel: `(HA3) ${feld} als ${form}` }
                );
            });
        }

        /** @type {Array<[string, string, any]>} */
        const L_FAELLE = [
            SPEED_30,
            SPRACHEN_7,
            ['resistances', 'Objekt {feuer:true}', { feuer: true }],
            ['immunities', 'true', true]
        ];
        for (const [feld, form, wert] of L_FAELLE) {
            test(`(HA4) L: Kopfzeile auf → ✏️ Xaver mit ${feld} als ${form} → 💾 — Xaver behaelt seine Felder`, async ({
                page,
                browser,
                viewport,
                hasTouch,
                isMobile,
                userAgent,
                deviceScaleFactor
            }) => {
                const optionen = { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor };
                await fallFahren(
                    { page, browser, optionen },
                    { weg: 'L', feld, wert, speichern: true, titel: `(HA4) ${feld} als ${form}` }
                );
            });
        }

        for (const [feld, form, wert] of [SPEED_30, SPRACHEN_7]) {
            test(`(HA5) E: Entwurf → ✏️ Xaver mit ${feld} als ${form} → 💾 — kein Entwurfswert in Xaver, 2 Helden`, async ({
                page,
                browser,
                viewport,
                hasTouch,
                isMobile,
                userAgent,
                deviceScaleFactor
            }) => {
                const optionen = { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor };
                await fallFahren(
                    { page, browser, optionen },
                    { weg: 'E', feld, wert, speichern: true, titel: `(HA5) ${feld} als ${form}` }
                );
                const x = await heldInD(page, 2);
                weich(
                    {
                        name: x?.name,
                        avatar: x?.avatar,
                        notizMitEntwurf: String(x?.notes).includes(ENTWURF.notiz),
                        pm: x?.currency?.pm
                    },
                    `(HA5) ${feld} als ${form}: kein Entwurfswert in Xaver`
                ).toEqual({ name: 'Xaver', avatar: BILD_X, notizMitEntwurf: false, pm: 2 });
            });
        }

        for (const [weg, name] of [
            ['Detail', '🔍 → "✏️ Bearbeiten"'],
            ['StrgK', 'Strg+K-Treffer'],
            ['Tab', 'Tab bis zum Kartenkopf + Enter']
        ]) {
            for (const [feld, form, wert] of [SPEED_30, SPRACHEN_7]) {
                test(`(HA6) ${name}, nach ✏️ Aria: Xaver mit ${feld} als ${form} → 💾`, async ({
                    page,
                    browser,
                    viewport,
                    hasTouch,
                    isMobile,
                    userAgent,
                    deviceScaleFactor
                }) => {
                    const optionen = { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor };
                    await fallFahren(
                        { page, browser, optionen },
                        {
                            weg,
                            feld,
                            wert,
                            speichern: true,
                            titel: `(HA6) ${name}, ${feld} als ${form}`
                        }
                    );
                });
            }
        }

        test('(HA9) R4: ✏️ Aria → Sprachmenue auf → ✏️ Xaver — das Menue ist zu', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, xaverMit()]);
            await zurParty(page);
            const bedien = bedienung(page, false);
            await bedien(kartenkopf(page, 1));
            await ariaGeladen(page);
            const huelle = page.locator('#cf-languages-wrapper');
            await bedien(huelle.locator('.cf-lang-trigger'));
            await expect(huelle, 'Vorbedingung: das Sprachmenue ist auf').toHaveClass(/\bopen\b/);
            await bedien(kartenkopf(page, 2));
            await expect
                .poll(() => bearbeitenId(page), { message: 'Vorbedingung: ✏️ Xaver' })
                .toBe('2');
            await weich(huelle, '(HA9) nach ✏️ Xaver ist das Sprachmenue zu (R4)').not.toHaveClass(
                /\bopen\b/
            );
            weich(await beob.alle(), '(HA9) kein Fehler').toEqual([]);
        });
    });

    // =======================================================================
    // (HA6) Telefon 390x844, per Tap
    // =======================================================================
    test.describe('(HA6) Telefon 390x844, per Tap', () => {
        test.use({ viewport: TELEFON, hasTouch: true, isMobile: true });

        for (const [weg, name] of [
            ['B', 'B (✏️ Aria → ✏️ Xaver)'],
            ['L', 'L (Kopfzeile auf → ✏️ Xaver)']
        ]) {
            for (const [feld, form, wert] of [SPEED_30, SPRACHEN_7]) {
                test(`(HA6) Telefon ${name}: Xaver mit ${feld} als ${form} → 💾`, async ({
                    page,
                    browser,
                    viewport,
                    hasTouch,
                    isMobile,
                    userAgent,
                    deviceScaleFactor
                }) => {
                    const optionen = { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor };
                    await fallFahren(
                        { page, browser, optionen },
                        {
                            weg,
                            feld,
                            wert,
                            telefon: true,
                            speichern: true,
                            titel: `(HA6) Telefon ${weg}, ${feld} als ${form}`
                        }
                    );
                });
            }
        }
    });

    // =======================================================================
    // (HA6) prod-Buendel
    // =======================================================================
    test.describe('(HA6) prod-Buendel, 1440x900', () => {
        for (const [feld, form, wert] of [SPEED_30, SPRACHEN_7]) {
            test(`(HA6) prod, B: Xaver mit ${feld} als ${form} → 💾`, async ({
                page,
                browser,
                viewport,
                hasTouch,
                isMobile,
                userAgent,
                deviceScaleFactor
            }) => {
                test.skip(!PROD_DA, PROD_GRUND);
                const optionen = { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor };
                await fallFahren(
                    { page, browser, optionen },
                    {
                        weg: 'B',
                        feld,
                        wert,
                        url: APP_URL_PROD,
                        speichern: true,
                        titel: `(HA6) prod, ${feld} als ${form}`
                    }
                );
            });
        }
    });

    // =======================================================================
    // (HA7) Offen (g): ein Avatar, der kein Text ist
    // =======================================================================
    test.describe('(HA7) Avatar, der kein Text ist (E2), dev und prod', () => {
        /** @type {Array<[string, any]>} */
        const AVATARE = [
            ['Zahl 42', 42],
            ['Objekt', { x: 1 }],
            ['true', true],
            ['Liste', ['bilder/ida.png']]
        ];
        for (const [buendel, url] of [
            ['dev', APP_URL],
            ['prod', APP_URL_PROD]
        ]) {
            for (const [form, wert] of AVATARE) {
                test(`(HA7) ${buendel}: frisch ✏️ Xaver mit avatar als ${form} — keine Anforderung, Feld '', 💾 schreibt ''`, async ({
                    page,
                    browser,
                    viewport,
                    hasTouch,
                    isMobile,
                    userAgent,
                    deviceScaleFactor
                }) => {
                    test.skip(buendel === 'prod' && !PROD_DA, PROD_GRUND);
                    const optionen = { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor };
                    const titel = `(HA7) ${buendel}, avatar als ${form}`;
                    const k = await kontrolle(
                        { page, browser, optionen },
                        { weg: 'A', url, telefon: false }
                    );
                    kontrolleTraegt(k);
                    const beob = await laden(page, [ARIA, xaverMit('avatar', wert)], { url });
                    await zurParty(page);
                    const bedien = bedienung(page, false);
                    const vorher = beob.anforderungen.length;
                    await bedien(kartenkopf(page, 2));
                    await page.waitForTimeout(300);
                    const imOrdner = beob.anforderungen
                        .slice(vorher)
                        .filter(
                            u =>
                                u.startsWith(APP_ORDNER) &&
                                !/dnd-tracker-(bundled|optimized)\.html$/.test(u)
                        );
                    weich(
                        imOrdner,
                        `${titel}: das ✏️ fordert nichts im App-Ordner an (E2)`
                    ).toEqual([]);
                    const z = await formularStand(page);
                    weich(
                        { feld: z['char-avatar'], vorschau: z['cf-avatar-preview'] },
                        `${titel}: Feld '' und Vorschau wie leer (E2)`
                    ).toEqual({ feld: '', vorschau: k.leer['cf-avatar-preview'] });
                    const offen = await formularUrteil(page, beob, k, 'avatar', wert, titel);
                    if (!offen) return;
                    const d = await speichern(page, bedien);
                    datensatzUrteil(d, k, 'avatar', `${titel}, 💾`);
                });
            }
        }
    });

    // =======================================================================
    // (HA8) R6: Legitimes bleibt — 💾 ohne Aenderung wie heute
    // =======================================================================
    test.describe('(HA8) R6, Kontrollen: 💾 ohne Aenderung ergibt dasselbe wie heute', () => {
        /**
         * Feld, Wert in der Saat, und was nach dem 💾 in D steht — gemessen am Basisstand
         * 0f63c0be (dev). `{}`: alles wie das 💾 der Kontrolle.
         * @type {Array<[string, string, any, Record<string, any>]>}
         */
        const LEGITIM = [
            ['', 'Kontrolle (legitimer Xaver)', undefined, {}],
            ['languages', "Text 'Gemein, Zwergisch'", 'Gemein, Zwergisch', {}],
            [
                'languages',
                "['Gemein', 'Kauderwelsch'] (freie Sprache, Offen (a))",
                ['Gemein', 'Kauderwelsch'],
                { languages: ['Gemein'] }
            ],
            ['speed', "'9m'", '9m', { speed: '9m|30ft.' }],
            ['speed', "'12m|40ft.'", '12m|40ft.', { speed: '12m|40ft.' }],
            [
                'attacks',
                "attackBonus '+5'",
                [{ name: 'Streitaxt', attackBonus: '+5', damage: '1d8+3', damageType: 'Hieb' }],
                {}
            ],
            ['level', "'7'", '7', { level: 7, proficiencyBonus: 3 }],
            [
                'avatar',
                "relativer Pfad 'bilder/xaver.png'",
                'bilder/xaver.png',
                { avatar: 'bilder/xaver.png' }
            ],
            ['avatar', 'NBSP vor dem Bild', ' ' + BILD_X, {}],
            ['notes', 'Zahl 42', 42, { notes: '42' }],
            ['playerName', 'Objekt {x:1}', { x: 1 }, { playerName: '[object Object]' }]
        ];
        for (const [feld, form, wert, soll] of LEGITIM) {
            test(`(HA8) B + 💾: ${feld || 'Kontrolle'} als ${form} — wie heute`, async ({
                page,
                browser,
                viewport,
                hasTouch,
                isMobile,
                userAgent,
                deviceScaleFactor
            }) => {
                const optionen = { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor };
                const titel = `(HA8) ${feld || 'Kontrolle'} als ${form}`;
                const k = await kontrolle(
                    { page, browser, optionen },
                    { weg: 'B', url: APP_URL, telefon: false }
                );
                kontrolleTraegt(k);
                const beob = await laden(page, [ARIA, feld ? xaverMit(feld, wert) : xaverMit()]);
                await zurParty(page);
                const bedien = bedienung(page, false);
                await WEGE.B(page, bedien);
                await expect(formular(page), `Vorbedingung: ${titel} laedt`).toHaveClass(
                    /\bopen\b/
                );
                const d = await speichern(page, bedien);
                weich(d, `${titel}: D nach dem 💾 wie heute`).toEqual({ ...k.d, ...soll });
                weich(
                    await heldImSpeicher(page, 2),
                    `${titel}: Speicher nach dem 💾 wie heute`
                ).toEqual({
                    ...k.d,
                    ...soll
                });
                weich(await beob.alle(), `${titel}: kein Fehler`).toEqual([]);
            });
        }
    });
});
