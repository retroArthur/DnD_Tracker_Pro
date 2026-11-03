// @ts-check
import path from 'path';
import { pathToFileURL } from 'url';
import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';

/**
 * Die Avatar-Vorschau im Charakterformular beim Laden und Leeren (AVATAR-VORSCHAU)
 * ================================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **solange das Charakterformular offen ist,
 * zeigt die Vorschau #cf-avatar-preview, was der Wert im Feld #char-avatar beim Speichern auf
 * der Karte ergaebe — nach jedem ✏️, nach jedem Leeren, und gleich, was vorher getippt oder
 * bearbeitet wurde.**
 *
 * Ursprung: docs/bugfixes.md, Eintrag AVATAR-DATEI, Offen (1) ("editChar() ruft die Vorschau
 * nicht auf"). Dort galt Vertrag A3 nur fuer das TIPPEN (Fall (d) von bild-lokal.spec.js);
 * dieser Vorgang dehnt ihn auf Laden und Leeren aus. Eigener Vorgang auf dem Stapelkopf
 * (BESTIAR-KLICK), keine Nachbesserung in AVATAR-DATEI (#24, gemergt).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER BEFUND (gemessen am Kopf 543706c6, Chromium, dev und prod, 1440x900 mit der Maus und
 * 390x844 per Tap, null Seitenfehler; an main 4037338d dasselbe)
 *
 * Die Vorschau zeigt immer den Wert, der seit dem Laden der Seite ZULETZT INS FELD GETIPPT
 * wurde, und ohne Tippen den Platzhalter "?" der Vorlage (assets/templates/view-party.html).
 * ✏️ (Kartenkopf, 🔍 → "✏️ Bearbeiten", Strg+K-Treffer), Abbrechen, Speichern, Kopfzeile
 * zu/auf, Taste n und die Palette aendern sie nie:
 *   - frisch geladen, ✏️ Aria (data:image/), Cora (file:///), Dorn (relativer Pfad), Fenn
 *     (https): das Feld traegt das Bild, die Vorschau "?" — bei Bram (ohne Bild) stimmt "?"
 *     nur zufaellig;
 *   - ein getipptes Bild bleibt nach Abbrechen stehen: neben dem leeren neuen Formular, neben
 *     ✏️ Bram (ohne Bild), neben ✏️ Aria (mit eigenem Bild) und nach dem Speichern eines
 *     Neulings, bis wieder getippt oder neu geladen wird.
 * Gespeichert wird der FELDWERT, nicht die Vorschau — falsche Daten entstehen so nicht, wohl
 * aber eine falsche Anzeige, der man glaubt (ein Bild "nachtragen", das schon da ist, oder
 * eines zum zweiten Mal eintragen).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DIE URSACHE
 *
 *   - updateAvatarPreview() (features/party/party-crud.js) hat genau einen Aufrufer: die
 *     data-action 'update-avatar-preview' am input-/change-Ereignis des Feldes
 *     (ui/actions/entity-actions.js). Eine Zuweisung an `.value` feuert kein Ereignis.
 *   - editChar() setzt `avatarInput.value = ch.avatar || ''` und ruft die Vorschau nicht nach —
 *     jede andere Anzeige des Formulars ruft dieselbe Funktion ausdruecklich nach
 *     (updateAttrMod, setCharLanguages, updateSpeedDisplay, updateProficiencyBonus).
 *   - cancelCharEdit() leert das Feld ueber clearFormFields() und laesst die Vorschau stehen.
 *     Ueber cancelCharEdit() laufen ALLE Leerwege: Abbrechen, Speichern (saveCharacter()),
 *     Kopfzeile aufklappen mit verworfenem Bearbeiten-Rest (ABBRUCH R1), Taste n und Palette
 *     (verwirfBearbeitenRest(), systems/spellslots/navigation.js) und Import R7.
 *   - Alt: `git log -S` findet nie einen zweiten Aufrufer; AVATAR-DATEI hat nur die Pruefung IN
 *     updateAvatarPreview() geaendert (sichereBildquelle()), nicht ihre Aufrufer.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (AVATAR-VORSCHAU)
 *
 *   R1  Invariante (A3 von AVATAR-DATEI, ausgedehnt vom Tippen auf Laden und Leeren): solange
 *       das Formular offen ist, zeigt #cf-avatar-preview das Ergebnis von
 *       sichereBildquelle(#char-avatar.value.trim()) — mit Bild genau ein GELADENES <img> mit
 *       src === Feldwert.trim(), sonst der Platzhalter "?" ohne <img>. Massgeblich ist das
 *       FELD (das, was gespeichert wuerde), nicht ch.avatar — auch bei Altdaten, Fall (W9).
 *   R2  Laden: editChar() fuehrt die Vorschau direkt nach der Feldzuweisung nach, mit dem
 *       Feldwert — fuer alle drei Einstiege (Kartenkopf, 🔍 → "✏️ Bearbeiten", Strg+K-Treffer)
 *       und gleich, was davor war (frisch geladen, getippt, ein anderer Held).
 *   R3  Leeren: cancelCharEdit() fuehrt die Vorschau nach dem Leeren aus dem Feld nach, und zwar
 *       NACH der Rueckkehr von clearFormFields(), vor dem Zuklappen — nicht in dessen try-Block
 *       (customHandlers): dort fiele der Aufruf still weg, sobald ein frueherer Handler wirft.
 *       Von aussen nicht zu sehen; die Waechter sind tests/unit/avatar-vorschau.test.js (U1:
 *       hinter einem werfenden Handler; U4: customHandlers wirft beim Eintritt — erst U4 faengt
 *       einen Aufruf als ERSTE Anweisung im Block, m5a).
 *   R4  Direkt aufrufen. Kein synthetisches input-/change-Ereignis und kein dispatchEvent am
 *       Feld: BESTIAR-KLICK (#27) stellt ein change mit dem Wert, den derselbe Handler schon
 *       per input bekam, nicht mehr zu (_changeBringtNichtsNeues(), ui/event-delegation.js) —
 *       Fall (W5); ein synthetisches input waere hier unsichtbar, darum U2/U3 der Unit-Datei.
 *   R5  ABBRUCH R2 bleibt: ein Anlege-Entwurf ohne ID behaelt Feld UND Vorschau ueber
 *       Kopfzeile zu/auf, Taste n und Palette — Kontrolle (W6).
 *   R6  Sonst aendert sich nichts: updateAvatarPreview() selbst (Pruefung nach A3, die Quelle
 *       als DOM-Eigenschaft, kein innerHTML mit Nutzerwert), keine neue globale Funktion, kein
 *       neuer Export (eslint.generated-globals.js und party-crud.d.ts bleiben unberuehrt),
 *       keine Anforderung an einen Netzwerkpfad.
 *   R7  Nicht in diesem Vorgang (je ein eigener, docs/bugfixes.md, AVATAR-VORSCHAU Offen):
 *       Sprachen ausserhalb der festen Liste gehen nach ✏️ + 💾 verloren (Produktfrage);
 *       editChar() laedt einen Helden mit `speed` als ZAHL nur halb und schreibt beim Speichern
 *       Bild und Sprachen des vorigen Helden auf ihn (Datenverfaelschung); Uebungsbonus "+3"
 *       bei Stufe 1 beim ersten Oeffnen; das Sprachmenue bleibt beim ✏️-Wechsel offen.
 *       Deshalb saet dieser Test `speed` als TEXT — ausser in (W9), der genau diese Altdaten
 *       nimmt und NUR die Invariante R1 prueft, nicht, was editChar() ins Feld schreibt.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DIE FAELLE                                                                  am Kopf 543706c6
 *
 *   (W1) frisch geladen, ✏️ ueber den Kartenkopf nacheinander Aria, Cora, Dorn, Fenn, Eik, Bram
 *        → Bild, Bild, Bild, Bild, "?" ohne Anforderung, "?"                              rot
 *   (W2) dieselbe Erwartung ueber 🔍 → "✏️ Bearbeiten" (Cora) und ueber Strg+K (Dorn)      rot
 *   (W3) Kopfzeile auf, ein Bild tippen, Abbrechen, Kopfzeile auf → "?"; ✏️ Bram → "?";
 *        ✏️ Aria → Arias Bild (am Kopf steht ueberall das getippte)                       rot
 *   (W4) Leerwege OHNE vorheriges Tippen, gemessen beim naechsten Oeffnen: Abbrechen,
 *        Speichern + Taste n, Kopfzeile zu/auf (ABBRUCH R1), Reiter Quests + Palette
 *        "Neuer Charakter" → je "?"                                                    gruen
 *        Zufaellig gruen (es wurde nie ein Bild gezeigt) — der Fall waecht gegen den Halbfix
 *        "nur editChar()": der zeigt nach ✏️ das Bild und laesst es beim Leeren stehen.
 *   (W5) GENAU Coras Wert in einen Entwurf tippen, Abbrechen, Kopfzeile auf → "?"; dann
 *        Kopfzeile zu, ✏️ Cora → Coras Bild                   rot (der Abbrechen-Schritt)
 *        Am Kopf ist "✏️ Cora" zufaellig gruen (der zuletzt getippte Wert IST Coras). Der Fall
 *        waecht gegen den verworfenen Weg R4: ein synthetisches change am Feld wird hier, beim
 *        Wert, den 'update-avatar-preview' schon per input bekam, verschluckt.
 *   (W6) Kontrolle R5: ein Entwurf mit getipptem Bild bleibt ueber Kopfzeile zu/auf, Taste n
 *        und Palette stehen, Feld und Vorschau                                          gruen
 *   (W7) 390x844 mit hasTouch per .tap(): (W1), (W3), (W4) — dort ohne Taste n und Palette
 *        (Telefon), "Speichern" gefolgt von der Kopfzeile                     rot, rot, gruen
 *   (W8) prod-Buendel: (W1) und (W3)                                                  rot
 *   (W9) Altdaten (R7): Gus mit `speed: 30` als Zahl. ✏️ Aria, dann ✏️ Gus — die Vorschau
 *        folgt dem FELD, was immer editChar() dort hinterlaesst (heute Arias Bild, weil es vor
 *        der Avatar-Zeile wirft)                                                          rot
 *        Waecht gegen eine Vorschau aus ch.avatar am ANFANG von editChar(): sie zeigte "?"
 *        neben Arias Bild im Feld, und 💾 schriebe dieses Bild auf Gus.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * GEGENPROBEN (am Buendel, nicht eingecheckt; Messung am 03.11.)
 *
 * Kopien von dist/dnd-tracker-bundled.html und dist/dnd-tracker-optimized.html am Kopf
 * 543706c6, je mit einer Aenderung an editChar()/cancelCharEdit(), gefahren mit genau dieser
 * Datei (process.cwd() = der Ordner der Kopie), alle zwoelf Faelle je Variante:
 *   fix  R2 + R3 wie im Vertrag                     12 gruen
 *   m1   nur editChar() (Halbfix)                   rot: (W4) alle vier Leerwege, je der
 *                                                   Abbrechen-Schritt von (W3) und (W5); ebenso
 *                                                   (W7)-(W3), (W7)-(W4), (W8)-(W3)
 *   m2   nur cancelCharEdit() (Halbfix)             rot: (W1), (W2), (W3) "✏️ Aria", (W5) "✏️ Cora",
 *                                                   (W9); ebenso (W7)-(W1), (W7)-(W3), (W8)
 *   m4   dispatchEvent(change) am Feld in beiden,   rot: genau (W5) "✏️ Cora" — sonst 11 gruen
 *        statt des Aufrufs (verworfen, R4)
 *   m7   updateAvatarPreview(ch.avatar) am ANFANG   rot: genau (W9) "✏️ Gus" — sonst 11 gruen
 *        von editChar(), plus R3
 *   m8   updateAvatarPreview(ch.avatar || '') an    12 gruen — zulaessig: von aussen nicht vom
 *        der Stelle von R2, plus R3                 Feld zu unterscheiden (der Kritik-Vertrag)
 * Von aussen NICHT zu unterscheiden, darum in tests/unit/avatar-vorschau.test.js: der Aufruf
 * IN customHandlers (m5, R3; hier 12 gruen, dort U1 und U4 rot; als ERSTE Anweisung im Block,
 * m5a, hier 12 gruen, dort genau U4 rot) und ein synthetisches input statt des Aufrufs (m6,
 * R4; hier 12 gruen, dort U1-U4 rot).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * WIE GEMESSEN WIRD
 *
 * Bedienung nur ueber die Oberflaeche: Reiter, Kartenkopf (`.char-card-meta`), 🔍 und
 * "✏️ Bearbeiten", Strg+K mit Klick auf den Treffer, die Kopfzeile, Abbrechen, Speichern, die
 * Taste n und die Palette; Eingaben Zeichen fuer Zeichen. Am Telefon .tap() mit mindestens
 * 450 ms Abstand: initTouchOptimizations() (systems/avatars.js) schluckt einen Knopf-Tipper
 * binnen 300 ms nach dem vorigen per preventDefault. `evaluate` nur zum Ablesen; gesaet wird
 * vor dem Laden (addInitScript, einmal je Tab).
 *
 * Nach JEDEM Schritt, bei offenem Formular, die Invariante R1 als WEICHE Zusicherung: die
 * Vorschau wird aus dem Feld vorhergesagt (Tabelle BREITE: welcher Wert ein Bild welcher Breite
 * ergibt) und mit der gelesenen verglichen; "angezeigt" heisst GELADEN (naturalWidth), nicht nur
 * "ein img steht da". Dazu, wo der Schritt es festlegt, der Feldwert selbst. Am Ende: keine
 * Anforderung an einen Netzwerkpfad (Muster aus bild-lokal.spec.js) und kein Fehler (pageerror,
 * console.error, Fehlerlog der App — EventDelegation faengt einen werfenden Handler und meldet
 * ihn NUR dort; (W9) prueft nur pageerror, siehe dort).
 *
 * Die Bilder sind Dateien des Repos (icons/icon-192.png, icons/icon-512.png), per
 * pathToFileURL() aus process.cwd(). http(s) verlaesst das Geraet nicht: HTTPS_BILD beantwortet
 * der Test mit icons/icon-192.png, alles andere bricht er ab.
 */

const WURZEL = process.cwd().replace(/\\/g, '/');
const DEV = `file:///${WURZEL}/dist/dnd-tracker-bundled.html`;
const PROD = `file:///${WURZEL}/dist/dnd-tracker-optimized.html`;
/** Der CI-Job `e2e` baut nur dev (`python build.py`); den prod-Fall gibt es nur mit einem
 *  frischen `python build.py --production` (Muster aus bestiar-klick.spec.js). */
const PROD_DA = existsSync(path.join(process.cwd(), 'dist', 'dnd-tracker-optimized.html'));
const PROD_GRUND =
    'kein prod-Buendel — vorher `python build.py --production` (der CI-Job e2e baut nur dev)';

const SPEICHER = 'dnd-tracker-v4';
const BREIT = { width: 1440, height: 900 };
const TELEFON = { width: 390, height: 844 };

/** Abstand vor jedem Tipper (> 300 ms Sperre in initTouchOptimizations()). */
const TIPP_ABSTAND = 450;
/** Zeit nach einer Bedienung fuer Zeichnen und verzoegerte Aufrufe (Strg+K: 100 ms). */
const SETZEN = 250;
/** So lange darf ein Bild laden, bevor ein Schritt als rot gilt. */
const WARTEN_BILD = 3000;

/** icons/icon-192.png des Repos als file:///-URL (unter Linux beginnt der Pfad mit `/`). */
const LOKALE_DATEI = path.resolve(process.cwd(), 'icons', 'icon-192.png');
const LOKALES_BILD = pathToFileURL(LOKALE_DATEI).href;
/** icons/icon-512.png als relativer Pfad, vom Buendel in dist/ aus gelesen. */
const RELATIVES_BILD = '../icons/icon-512.png';
/** Beantwortet der Test mit icons/icon-192.png (laden()). */
const HTTPS_BILD = 'https://example.org/held.png';
/** 1x1, wie in bild-lokal.spec.js. */
const DATA_BILD =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
/** Ein Netzwerkpfad (A1 von AVATAR-DATEI): nie angezeigt, nie angefordert. */
const NETZWERKPFAD = 'file://localhost/netzbild-a.png';

/**
 * R1 als Tabelle: welcher (getrimmte) Feldwert welche Vorschau ergibt — die Breite des GELADENEN
 * Bildes, oder null fuer den Platzhalter "?". Dass genau diese Werte ein Bild ergeben, ist A3
 * von AVATAR-DATEI (sichereBildquelle(); Wertetabelle in tests/unit/avatars.test.js).
 * @type {Map<string, number|null>}
 */
const BREITE = new Map([
    ['', null],
    [DATA_BILD, 1],
    [LOKALES_BILD, 192],
    [RELATIVES_BILD, 512],
    [HTTPS_BILD, 192],
    [NETZWERKPFAD, null]
]);

/** Lesbare Namen fuer die Meldungen (die Werte selbst sind lang). */
const NAMEN = new Map([
    ['', "''"],
    [DATA_BILD, 'DATA_BILD'],
    [LOKALES_BILD, 'LOKALES_BILD'],
    [RELATIVES_BILD, 'RELATIVES_BILD'],
    [HTTPS_BILD, 'HTTPS_BILD'],
    [NETZWERKPFAD, 'NETZWERKPFAD']
]);

/** WEICHE Zusicherungen fuer Ergebnisse: ein roter Lauf nennt JEDE gebrochene Zusage.
 *  Vorbedingungen, ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

// ---------------------------------------------------------------------------
// Saat — `speed` als TEXT (R7), sonst laedt editChar() nur halb
// ---------------------------------------------------------------------------
/**
 * @param {number} id
 * @param {string} name
 * @param {string} avatar
 * @param {object} [extra]
 */
function held(id, name, avatar, extra = {}) {
    return {
        id,
        name,
        playerName: '',
        characterClass: 'Kämpfer',
        subclass: '',
        race: 'Mensch',
        level: 1,
        background: '',
        alignment: '',
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        saveProficiencies: {},
        hpCurrent: 10,
        hpMax: 10,
        tempHp: 0,
        armorClass: 12,
        initiative: 0,
        speed: '9m|30ft.',
        hitDice: '1d10',
        passivePerception: 10,
        inspiration: false,
        resistances: [],
        immunities: [],
        languages: [],
        spellSlots: {},
        currency: { pm: 0, gm: 0, em: 0, sm: 0, km: 0 },
        notes: '',
        avatar,
        conditions: [],
        spells: [],
        items: [],
        ...extra
    };
}

const ARIA = held(1, 'Aria', DATA_BILD);
const BRAM = held(2, 'Bram', '');
const CORA = held(3, 'Cora', LOKALES_BILD);
const DORN = held(4, 'Dorn', RELATIVES_BILD);
const EIK = held(5, 'Eik', NETZWERKPFAD);
const FENN = held(6, 'Fenn', HTTPS_BILD);
/** Altdaten (W9): `speed` als Zahl, wie aeltere Staende ihn trugen; die Datengrenze laesst ihn. */
const GUS = held(7, 'Gus', '', { speed: 30 });

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

// ---------------------------------------------------------------------------
// Laden, Netz und Fehler beobachten
// ---------------------------------------------------------------------------
/**
 * Ob eine Anforderung einen Netzwerkpfad betrifft — dieselbe Lesart wie istNetzziel() in
 * bild-lokal.spec.js: unter file: ist nur `file:///` mit einem Pfad lokal, der nicht mit einem
 * weiteren Trenner beginnt und nirgends zwei hintereinander traegt.
 * @param {string} url
 */
function istNetzziel(url) {
    const s = String(url);
    if (/^file:/i.test(s)) {
        const rest = s.replace(/^file:/i, '').replace(/%2f|%5c|\\/gi, '/');
        if (!/^\/\/\/(?!\/)/.test(rest) || rest.slice(3).includes('//')) return true;
    }
    return /(^|[/\\])netzbild-[a-z]\.png$/i.test(s);
}

/**
 * Saet EINMAL je Tab vor dem Laden, laedt das Buendel und wartet auf die App. Beobachtet das Netz
 * (Netzwerkpfade abbrechen und zaehlen, http(s) abbrechen, HTTPS_BILD selbst beantworten) und
 * die Fehler. Die Fenstergroesse kommt aus test.use() — am Telefon ist `.app-title` versteckt,
 * darum wird auf `data-app-ready` gewartet, nicht auf waitForAppReady().
 * @param {import('@playwright/test').Page} page
 * @param {{ url?: string, characters?: object[] }} [opt]
 */
async function laden(page, opt = {}) {
    const url = opt.url || DEV;
    const characters = opt.characters || [ARIA, BRAM, CORA, DORN, EIK, FENN];
    /** @type {string[]} */
    const netz = [];
    /** @type {string[]} */
    const seitenfehler = [];
    /** @type {string[]} */
    const konsole = [];
    await page.route(/^https?:/i, r => r.abort());
    // Spaeter angemeldet, darum vorrangig: das http(s)-Bild beantwortet der Test selbst.
    await page.route(
        u => u.href === HTTPS_BILD,
        r => r.fulfill({ path: LOKALE_DATEI, contentType: 'image/png' })
    );
    // Entschieden an der URL, wie Chromium sie anfordert (bild-lokal.spec.js, laden()).
    await page.route(
        u => u.protocol === 'file:',
        r => (istNetzziel(r.request().url()) ? r.abort() : r.continue())
    );
    page.on('request', req => {
        if (istNetzziel(req.url())) netz.push(req.url());
    });
    page.on('pageerror', e => seitenfehler.push(String(e).split('\n')[0].slice(0, 200)));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            konsole.push('console.error: ' + m.text().split('\n')[0].slice(0, 200));
        }
    });
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (sessionStorage.getItem('avatar-vorschau-gesaet')) return;
                localStorage.setItem(schluessel, JSON.stringify(s));
                sessionStorage.setItem('avatar-vorschau-gesaet', '1');
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng
            }
        },
        [SPEICHER, saat(characters)]
    );
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 20000
    });
    await page.waitForTimeout(300);
    return {
        netz,
        seitenfehler,
        /** pageerror, console.error und das Fehlerlog der App. */
        async alleFehler() {
            const log = await page.evaluate(() =>
                // @ts-ignore
                (window.ErrorHandler?.getRecentErrors?.(50) || []).map(
                    e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
                )
            );
            return [...seitenfehler, ...konsole, ...log];
        }
    };
}

// ---------------------------------------------------------------------------
// Bedienung — Klick, am Telefon Tipper mit Abstand
// ---------------------------------------------------------------------------
/**
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

/**
 * Mitte eines Elements und ob dort wirklich es selbst obenauf liegt (bestiar-klick.spec.js).
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
 * Zur Ansicht ueber die ECHTE Navigation (zurAnsicht() aus bestiar-klick.spec.js). Desktop:
 * Gruppe aufklappen, Reiter klicken. Telefon: Leiste per Tap ausfahren, Reiter antippen, Leiste
 * wieder einfahren.
 * @param {import('@playwright/test').Page} page @param {string} ansicht
 */
async function zuReiter(page, ansicht) {
    const reiterSel = `.nav-tab[data-view="${ansicht}"]`;
    const mobil = await page.evaluate(() => document.documentElement.dataset.layout === 'mobile');
    if (mobil) {
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
        expect(m && m.frei, `Vorbedingung: der Reiter ${ansicht} ist frei`).toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (m).x, /** @type {any} */ (m).y);
        await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
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
    await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
    await page.waitForTimeout(SETZEN);
}

/** @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.locator('#char-form');
}
/** Die Kopfzeile "+ Charakter hinzufügen" ueber ihren PLATZ (charakter-anlegen.spec.js).
 *  @param {import('@playwright/test').Page} page */
function kopfzeile(page) {
    return page.locator('#view-party .card:has(> #char-form) > .collapsible-header');
}
/** @param {import('@playwright/test').Page} page */
function abbrechenKnopf(page) {
    return formular(page).getByRole('button', { name: 'Abbrechen', exact: true });
}
/** @param {import('@playwright/test').Page} page */
function speichernKnopf(page) {
    return formular(page).getByRole('button', { name: 'Speichern', exact: true });
}
/** @param {import('@playwright/test').Page} page */
function bearbeitenId(page) {
    return page.evaluate(
        () => /** @type {HTMLInputElement|null} */ (document.getElementById('edit-char-id'))?.value
    );
}

/** Vorbedingung nach einem ✏️: Formular offen, Bearbeiten-ID gesetzt.
 *  @param {import('@playwright/test').Page} page @param {number} id */
async function geladen(page, id) {
    await expect(formular(page)).toHaveClass(/\bopen\b/);
    await expect.poll(() => bearbeitenId(page)).toBe(String(id));
}

/** ✏️ ueber den Kartenkopf (`edit-char`).
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien
 *  @param {number} id */
async function bearbeitenKopf(page, bedien, id) {
    await bedien(page.locator(`#party-list .char-card-header[data-id="${id}"] .char-card-meta`));
    await geladen(page, id);
}

/** ✏️ ueber 🔍 und "✏️ Bearbeiten" im Detail-Dialog (`edit-char-from-modal`).
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien
 *  @param {number} id */
async function bearbeitenDetail(page, bedien, id) {
    await bedien(page.locator(`#char-${id} [data-action="show-char-details"]`));
    await expect(page.locator('#char-detail-modal')).toHaveClass(/\bshow\b/);
    await bedien(page.locator('#char-detail-modal [data-action="edit-char-from-modal"]'));
    await expect(page.locator('#char-detail-modal')).not.toHaveClass(/\bshow\b/);
    await geladen(page, id);
}

/** ✏️ ueber Strg+K und einen Klick auf den Treffer (navigateToResult() → editChar() nach 100 ms).
 *  @param {import('@playwright/test').Page} page @param {string} name @param {number} id */
async function bearbeitenSuche(page, name, id) {
    await page.keyboard.press('Control+k');
    await expect(page.locator('#global-search')).toBeFocused();
    await page.keyboard.type(name, { delay: 30 });
    const treffer = page
        .locator('#global-search-results .search-result-item[data-type="character"]')
        .filter({ hasText: name })
        .first();
    await treffer.click();
    await page.waitForTimeout(SETZEN);
    await geladen(page, id);
}

/** Befehlspalette → Befehl (charakter-anlegen.spec.js). Enter fuehrt den obersten Treffer aus.
 *  @param {import('@playwright/test').Page} page @param {string} text */
async function palette(page, text) {
    await page.keyboard.press('Control+Shift+K');
    await expect(page.locator('.cp-overlay')).toBeVisible();
    await expect(page.locator('.cp-input')).toBeFocused();
    await page.keyboard.type(text);
    await expect(page.locator('#cp-results-list .cp-result').first()).toContainText(text);
    await page.keyboard.press('Enter');
    await expect(page.locator('.cp-overlay')).toBeHidden();
    await page.waitForTimeout(SETZEN);
}

/** Feld antippen bzw. anklicken, leeren und Zeichen fuer Zeichen tippen.
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien
 *  @param {string} text */
async function eintippen(page, bedien, text) {
    await bedien(page.locator('#char-avatar'));
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type(text);
    await page.waitForTimeout(SETZEN);
}

// ---------------------------------------------------------------------------
// Messen — die Invariante R1
// ---------------------------------------------------------------------------
/** @param {string} wert */
function kurz(wert) {
    if (NAMEN.has(wert)) return /** @type {string} */ (NAMEN.get(wert));
    return wert.length > 60 ? wert.slice(0, 57) + '…' : wert;
}

/** Was die Vorschau zu diesem Feldwert zeigen MUSS (R1).
 *  @param {string} feld */
function vorhersage(feld) {
    const wert = feld.trim();
    if (!BREITE.has(wert)) return `UNBEKANNTER Feldwert ${kurz(wert)} — Tabelle BREITE ergaenzen`;
    const breite = BREITE.get(wert);
    return breite === null ? 'Platzhalter "?"' : `Bild ${breite}px ${kurz(wert)}`;
}

/** Feld, Formular und Vorschau, wie sie gerade stehen — nur Ablesen.
 *  @param {import('@playwright/test').Page} page */
function ablesen(page) {
    return page.evaluate(() => {
        const feld = /** @type {HTMLInputElement} */ (document.getElementById('char-avatar'));
        const vorschau = /** @type {HTMLElement} */ (document.getElementById('cf-avatar-preview'));
        const platzhalter = vorschau.querySelector('.cf-avatar-placeholder');
        return {
            feld: feld.value,
            offen: !!document.getElementById('char-form')?.classList.contains('open'),
            bilder: [...vorschau.querySelectorAll('img')].map(b => ({
                src: b.getAttribute('src') || '',
                breite: b.complete ? b.naturalWidth : 0
            })),
            platzhalter: platzhalter ? (platzhalter.textContent || '').trim() : null
        };
    });
}

/** Was die Vorschau zeigt, in derselben Sprache wie vorhersage().
 *  @param {Awaited<ReturnType<typeof ablesen>>} z */
function beschreibe(z) {
    if (z.bilder.length === 0) {
        return z.platzhalter === '?' ? 'Platzhalter "?"' : `weder Bild noch Platzhalter`;
    }
    if (z.bilder.length === 1 && z.platzhalter === null) {
        const b = z.bilder[0];
        return b.breite > 0
            ? `Bild ${b.breite}px ${kurz(b.src)}`
            : `Bild NICHT geladen ${kurz(b.src)}`;
    }
    return `${z.bilder.length} Bilder und Platzhalter ${JSON.stringify(z.platzhalter)}`;
}

const STIMMT = 'Vorschau = Feld';

/**
 * R1 nach einem Schritt, als weiche Zusicherung: die Vorschau ist die aus dem Feld vorhergesagte
 * (bis WARTEN_BILD, solange ein Bild noch laedt). Mit `feldSoll` zusaetzlich der Feldwert, den
 * der Schritt festlegt; ohne (W9) nur die Invariante, gleich was im Feld steht.
 * @param {import('@playwright/test').Page} page
 * @param {string} schritt
 * @param {string} [feldSoll]
 */
async function pruefe(page, schritt, feldSoll) {
    await weich
        .poll(
            async () => {
                const z = await ablesen(page);
                const soll = vorhersage(z.feld);
                const ist = beschreibe(z);
                return ist === soll ? STIMMT : `Feld ${kurz(z.feld)}: soll ${soll}, ist ${ist}`;
            },
            { timeout: WARTEN_BILD, message: `${schritt}: Vorschau = Feld (R1)` }
        )
        .toBe(STIMMT);
    const z = await ablesen(page);
    weich(z.offen, `${schritt}: Formular offen`).toBe(true);
    if (feldSoll !== undefined) weich(kurz(z.feld), `${schritt}: Feld`).toBe(kurz(feldSoll));
}

/**
 * Ende jedes Falls: kein Netzwerkpfad angefordert, kein Fehler.
 * @param {import('@playwright/test').Page} page
 * @param {Awaited<ReturnType<typeof laden>>} beob
 */
async function ohneNetzUndFehler(page, beob) {
    await page.waitForTimeout(300);
    expect(beob.netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
    expect(await beob.alleFehler(), 'kein Fehler').toEqual([]);
}

// ---------------------------------------------------------------------------
// Ablaeufe, je fuer Maus und Tap
// ---------------------------------------------------------------------------
/** Reihenfolge von (W1): Bild, Bild, Bild, Bild, Netzwerkpfad, ohne Bild. */
const KARTENKOPF_REIHE = [ARIA, CORA, DORN, FENN, EIK, BRAM];

/** (W1) frisch geladen, ✏️ ueber den Kartenkopf.
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien */
async function ablaufW1(page, bedien) {
    await zuReiter(page, 'party');
    for (const h of KARTENKOPF_REIHE) {
        await bearbeitenKopf(page, bedien, h.id);
        await pruefe(page, `(W1) ✏️ ${h.name} ueber den Kartenkopf`, h.avatar);
    }
}

/** (W3) ein getipptes Bild bleibt nicht ueber Abbrechen und ✏️ stehen.
 *  @param {import('@playwright/test').Page} page
 *  @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien */
async function ablaufW3(page, bedien) {
    await zuReiter(page, 'party');
    await bedien(kopfzeile(page));
    await expect(formular(page)).toHaveClass(/\bopen\b/);
    await pruefe(page, '(W3) Kopfzeile auf (neu)', '');
    await eintippen(page, bedien, HTTPS_BILD);
    await pruefe(page, '(W3) HTTPS_BILD getippt', HTTPS_BILD);
    await bedien(abbrechenKnopf(page));
    await expect(formular(page)).not.toHaveClass(/\bopen\b/);
    await bedien(kopfzeile(page));
    await expect(formular(page)).toHaveClass(/\bopen\b/);
    await pruefe(page, '(W3) getippt → Abbrechen → Kopfzeile auf', '');
    await bearbeitenKopf(page, bedien, BRAM.id);
    await pruefe(page, '(W3) dann ✏️ Bram (ohne Bild)', '');
    await bearbeitenKopf(page, bedien, ARIA.id);
    await pruefe(page, '(W3) dann ✏️ Aria', DATA_BILD);
}

/**
 * (W4) Leerwege ohne vorheriges Tippen, gemessen beim naechsten Oeffnen. Am Telefon gibt es
 * weder Taste n noch Palette: dort oeffnet nach "Speichern" die Kopfzeile, die Palette entfaellt.
 * @param {import('@playwright/test').Page} page
 * @param {(z: import('@playwright/test').Locator) => Promise<void>} bedien
 * @param {boolean} tasten
 */
async function ablaufW4(page, bedien, tasten) {
    await zuReiter(page, 'party');
    const offen = /\bopen\b/;

    // Abbrechen
    await bearbeitenKopf(page, bedien, CORA.id);
    weich(kurz((await ablesen(page)).feld), '(W4) Feld nach ✏️ Cora').toBe('LOKALES_BILD');
    await bedien(abbrechenKnopf(page));
    await expect(formular(page)).not.toHaveClass(offen);
    await bedien(kopfzeile(page));
    await expect(formular(page)).toHaveClass(offen);
    await pruefe(page, '(W4) ✏️ Cora → Abbrechen → Kopfzeile auf', '');
    await bedien(kopfzeile(page));
    await expect(formular(page)).not.toHaveClass(offen);

    // Speichern, dann Taste n (Telefon: Kopfzeile)
    await bearbeitenKopf(page, bedien, ARIA.id);
    await bedien(speichernKnopf(page));
    await expect(formular(page)).not.toHaveClass(offen);
    if (tasten) {
        await page.keyboard.press('n');
        await page.waitForTimeout(SETZEN);
    } else {
        await bedien(kopfzeile(page));
    }
    await expect(formular(page)).toHaveClass(offen);
    await pruefe(page, `(W4) ✏️ Aria → Speichern → ${tasten ? 'Taste n' : 'Kopfzeile auf'}`, '');
    await bedien(kopfzeile(page));
    await expect(formular(page)).not.toHaveClass(offen);

    // Kopfzeile zu und auf: verwirft den Bearbeiten-Rest (ABBRUCH R1)
    await bearbeitenKopf(page, bedien, ARIA.id);
    await bedien(kopfzeile(page));
    await expect(formular(page)).not.toHaveClass(offen);
    await bedien(kopfzeile(page));
    await expect(formular(page)).toHaveClass(offen);
    await pruefe(page, '(W4) ✏️ Aria → Kopfzeile zu und auf (ABBRUCH R1)', '');

    if (!tasten) return;
    // Reiter Quests, Palette "Neuer Charakter": verwirft den Rest aus der anderen Ansicht
    await bearbeitenKopf(page, bedien, ARIA.id);
    await zuReiter(page, 'quests');
    await palette(page, 'Neuer Charakter');
    await expect(page.locator('#view-party')).toHaveClass(/\bactive\b/);
    await expect(formular(page)).toHaveClass(offen);
    await pruefe(page, '(W4) ✏️ Aria → Reiter Quests → Palette "Neuer Charakter"', '');
}

// ===========================================================================
// (W1) (W2) (W3) (W4) (W5) (W6) (W9) — 1440x900, Maus und Tastatur, dev
// ===========================================================================
test.describe('1440x900, Maus und Tastatur', () => {
    test.use({ viewport: BREIT });

    test('(W1) frisch geladen: ✏️ ueber den Kartenkopf zeigt das Bild des Helden, ohne Bild und beim Netzwerkpfad "?" — dev', async ({
        page
    }) => {
        test.setTimeout(90000);
        const beob = await laden(page);
        await ablaufW1(page, bedienung(page, false));
        await ohneNetzUndFehler(page, beob);
    });

    test('(W2) frisch geladen: ✏️ ueber 🔍 → "✏️ Bearbeiten" (Cora) und ueber Strg+K (Dorn) zeigt das Bild des Helden', async ({
        page
    }) => {
        test.setTimeout(60000);
        const beob = await laden(page);
        const bedien = bedienung(page, false);
        await zuReiter(page, 'party');
        await bearbeitenDetail(page, bedien, CORA.id);
        await pruefe(page, '(W2) 🔍 → "✏️ Bearbeiten" Cora', LOKALES_BILD);
        await bearbeitenSuche(page, 'Dorn', DORN.id);
        await pruefe(page, '(W2) Strg+K → Treffer Dorn', RELATIVES_BILD);
        await ohneNetzUndFehler(page, beob);
    });

    test('(W3) ein getipptes Bild verschwindet mit Abbrechen und steht nicht neben ✏️ Bram oder ✏️ Aria — dev', async ({
        page
    }) => {
        test.setTimeout(60000);
        const beob = await laden(page);
        await ablaufW3(page, bedienung(page, false));
        await ohneNetzUndFehler(page, beob);
    });

    test('(W4) Leerwege ohne Tippen — Abbrechen, Speichern + Taste n, Kopfzeile zu/auf, Palette — hinterlassen "?" (gegen den Halbfix "nur editChar")', async ({
        page
    }) => {
        test.setTimeout(90000);
        const beob = await laden(page);
        await ablaufW4(page, bedienung(page, false), true);
        await ohneNetzUndFehler(page, beob);
    });

    test('(W5) GENAU Coras Wert getippt, Abbrechen → "?", dann ✏️ Cora → Coras Bild (gegen ein synthetisches change, R4)', async ({
        page
    }) => {
        test.setTimeout(60000);
        const beob = await laden(page);
        const bedien = bedienung(page, false);
        await zuReiter(page, 'party');
        await bedien(kopfzeile(page));
        await expect(formular(page)).toHaveClass(/\bopen\b/);
        await eintippen(page, bedien, LOKALES_BILD);
        await pruefe(page, '(W5) Coras Wert in den Entwurf getippt', LOKALES_BILD);
        await bedien(abbrechenKnopf(page));
        await expect(formular(page)).not.toHaveClass(/\bopen\b/);
        await bedien(kopfzeile(page));
        await expect(formular(page)).toHaveClass(/\bopen\b/);
        await pruefe(page, '(W5) → Abbrechen → Kopfzeile auf', '');
        await bedien(kopfzeile(page));
        await expect(formular(page)).not.toHaveClass(/\bopen\b/);
        await bearbeitenKopf(page, bedien, CORA.id);
        await pruefe(page, '(W5) → ✏️ Cora', LOKALES_BILD);
        await ohneNetzUndFehler(page, beob);
    });

    test('(W6) Kontrolle R5: ein Entwurf mit getipptem Bild behaelt Feld und Vorschau ueber Kopfzeile zu/auf, Taste n und Palette', async ({
        page
    }) => {
        test.setTimeout(60000);
        const beob = await laden(page);
        const bedien = bedienung(page, false);
        await zuReiter(page, 'party');
        await bedien(kopfzeile(page));
        await expect(formular(page)).toHaveClass(/\bopen\b/);
        await eintippen(page, bedien, HTTPS_BILD);
        await pruefe(page, '(W6) Entwurf: HTTPS_BILD getippt', HTTPS_BILD);
        await bedien(kopfzeile(page));
        await expect(formular(page)).not.toHaveClass(/\bopen\b/);
        await bedien(kopfzeile(page));
        await expect(formular(page)).toHaveClass(/\bopen\b/);
        await pruefe(page, '(W6) Entwurf → Kopfzeile zu und auf', HTTPS_BILD);
        // Der Fokus liegt nach dem Klick auf die Kopfzeile in keinem Feld: n erreicht die Seite
        await page.keyboard.press('n');
        await page.waitForTimeout(SETZEN);
        await pruefe(page, '(W6) Entwurf → Taste n', HTTPS_BILD);
        await zuReiter(page, 'quests');
        await palette(page, 'Neuer Charakter');
        await expect(page.locator('#view-party')).toHaveClass(/\bactive\b/);
        await pruefe(page, '(W6) Entwurf → Reiter Quests → Palette "Neuer Charakter"', HTTPS_BILD);
        await ohneNetzUndFehler(page, beob);
    });

    // (W9) Altdaten — prueft NUR R1 (Vorschau = Feld), nicht, was editChar() ins Feld schreibt:
    // das ist R7 (eigener Vorgang). Darum auch nur pageerror: editChar() wirft heute bei
    // `speed` als Zahl (`speedVal.split is not a function`), EventDelegation faengt das und
    // meldet es per console.error und im Fehlerlog der App — das haelt dieser Fall nicht fest,
    // weder als Soll noch als Verbot.
    test('(W9) Altdaten: nach ✏️ Aria und ✏️ Gus (`speed` als Zahl) folgt die Vorschau dem Feld', async ({
        page
    }) => {
        test.setTimeout(60000);
        const beob = await laden(page, { characters: [ARIA, BRAM, GUS] });
        const bedien = bedienung(page, false);
        expect(
            await page.evaluate(
                // @ts-ignore
                () => typeof window.D?.characters?.find(c => c.id === 7)?.speed
            ),
            'Vorbedingung: Gus traegt `speed` nach dem Laden noch als Zahl (sonst ist es keine Altdaten-Probe)'
        ).toBe('number');
        await zuReiter(page, 'party');
        await bearbeitenKopf(page, bedien, ARIA.id);
        await pruefe(page, '(W9) ✏️ Aria', DATA_BILD);
        await bearbeitenKopf(page, bedien, GUS.id);
        await pruefe(
            page,
            '(W9) dann ✏️ Gus (Altdaten): Vorschau = Feld, gleich was im Feld steht'
        );
        await page.waitForTimeout(300);
        expect(beob.netz, 'keine Anforderung an einen Netzwerkpfad').toEqual([]);
        expect(beob.seitenfehler, 'kein Seitenfehler').toEqual([]);
    });
});

// ===========================================================================
// (W7) 390x844 per Tap
// ===========================================================================
test.describe('(W7) Telefon 390x844, per Tap', () => {
    test.use({ viewport: TELEFON, hasTouch: true, isMobile: true });

    /** @param {import('@playwright/test').Page} page */
    async function mobil(page) {
        await expect(page.locator('html'), 'Vorbedingung: Mobil-Layout').toHaveAttribute(
            'data-layout',
            'mobile'
        );
    }

    test('(W7) = (W1) per Tap: ✏️ ueber den Kartenkopf zeigt das Bild des Helden', async ({
        page
    }) => {
        test.setTimeout(120000);
        const beob = await laden(page);
        await mobil(page);
        await ablaufW1(page, bedienung(page, true));
        await ohneNetzUndFehler(page, beob);
    });

    test('(W7) = (W3) per Tap: ein getipptes Bild verschwindet mit Abbrechen', async ({ page }) => {
        test.setTimeout(120000);
        const beob = await laden(page);
        await mobil(page);
        await ablaufW3(page, bedienung(page, true));
        await ohneNetzUndFehler(page, beob);
    });

    test('(W7) = (W4) per Tap: Abbrechen, Speichern + Kopfzeile, Kopfzeile zu/auf hinterlassen "?"', async ({
        page
    }) => {
        test.setTimeout(120000);
        const beob = await laden(page);
        await mobil(page);
        await ablaufW4(page, bedienung(page, true), false);
        await ohneNetzUndFehler(page, beob);
    });
});

// ===========================================================================
// (W8) prod-Buendel
// ===========================================================================
test.describe('(W8) prod-Buendel, 1440x900', () => {
    test.use({ viewport: BREIT });

    test('(W8) = (W1) am prod-Buendel', async ({ page }) => {
        test.skip(!PROD_DA, PROD_GRUND);
        test.setTimeout(90000);
        const beob = await laden(page, { url: PROD });
        await ablaufW1(page, bedienung(page, false));
        await ohneNetzUndFehler(page, beob);
    });

    test('(W8) = (W3) am prod-Buendel', async ({ page }) => {
        test.skip(!PROD_DA, PROD_GRUND);
        test.setTimeout(60000);
        const beob = await laden(page, { url: PROD });
        await ablaufW3(page, bedienung(page, false));
        await ohneNetzUndFehler(page, beob);
    });
});
