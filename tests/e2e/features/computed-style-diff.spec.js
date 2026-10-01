// @ts-check
/**
 * Computed-Style-Vergleichslauf — Phase 15, Plan 15-06 (D-24), repariert in Plan 15-13 (D-17,
 * 15-VERIFICATION.md Gap 2, 15-REVIEW.md CR-04).
 *
 * Dritte Nachweissaeule neben der gruenen Suite und der menschlichen Sichtung: ein Abzug
 * berechneter Endwerte (`getComputedStyle`) ueber ALLE Ansichten, in drei Durchgaengen (Standard /
 * schmales Layoutprofil / emulierte reduzierte Bewegung), verglichen gegen den vorigen Abzug.
 *
 * Der Sollstand liegt unter `tests/e2e/baselines/computed-style-baseline.json` — VERSIONIERT,
 * NICHT unter dem per `.gitignore` ausgeschlossenen Ergebnisverzeichnis. Ein Sollstand, der nur
 * im Arbeitsverzeichnis des Autors existiert, ist in CI und in jedem frischen Klon `null`; der
 * Vergleich liefert dann sofort eine leere Liste und alle drei Faelle laufen gruen OHNE zu
 * vergleichen (15-REVIEW.md CR-04, Mangel 1). Der Sollstand ist damit ein VERTRAG: er wandert in
 * die Git-Historie, und jede Welle, die berechnete Stile absichtlich aendert (Phasen 16-19), muss
 * ihn danach ausdruecklich neu erheben.
 *
 * **Form des versionierten Sollstands (Checkpoint-Entscheidung C, 2026-09-11 — Hybrid).** Der
 * verbindliche, eingecheckte Sollstand ist NICHT der Vollabzug der berechneten Werte, sondern eine
 * KURZFORM: je Ansicht und Elementschluessel ein stabiler SHA-256-Hash ueber die zwoelf
 * Eigenschaften (`digestElement()`), plus die vollstaendige Schluesselmenge der Ansicht. Der
 * Vollabzug (alle zwoelf Rohwerte je Element) wird weiterhin — unveraendert wie vor diesem Plan —
 * NUR unter dem per `.gitignore` ausgeschlossenen Ergebnisverzeichnis geschrieben
 * (`tests/e2e/test-results/computed-style-snapshot.json`) und dient der oertlichen Fehlersuche; er
 * ist bei jedem Lauf aktuell, auch bei einem roten. Warum Hybrid statt Vollabzug: ein je Phase neu
 * geschriebener Mehrmegabyte-Sollstand (gemessen: der Vollabzug dieses Plans allein waere ueber
 * 1,6 MB) waechst die Git-Historie dauerhaft und ist nicht folgenlos zuruecknehmbar; die Kurzform
 * ist rund eine Groessenordnung kleiner, erkennt Wertaenderungen UND beide Richtungen der
 * Schluesselmengen-Aenderung genauso zuverlaessig, und ihr Diff ist zeilenweise lesbar. Die
 * Fehlermeldung einer Digest-Abweichung kann keinen alten/neuen Wert nennen — nur DASS sich an
 * diesem Schluessel etwas geaendert hat — und verweist deshalb auf den lokalen Vollabzug fuer die
 * konkreten Werte.
 *
 * Schreibsperre (CR-04, Mangel 2): der versionierte Sollstand wird nur geschrieben, wenn entweder
 * gar keiner existiert ODER die Umgebungsvariable `UPDATE_STYLE_BASELINE` auf `1` steht — UND in
 * allen drei Faellen steht der Schreibaufruf HINTER der Zusicherung. Beide Aenderungen zusammen:
 * die Reihenfolge allein genuegt nicht (ein Lauf mit gesetztem Schalter wuerde sonst weiterhin vor
 * der Zusicherung schreiben), die Sperre allein genuegt nicht (ein zweiter Lauf nach einem
 * Fehlschlag duerfte sonst wieder schreiben). Ein Waechter, der eine gefundene Abweichung im
 * selben Lauf als neuen Sollstand festschreibt, meldet einen Befund genau einmal und nie wieder —
 * das ist schlechter als gar kein Waechter (T-15-27). Der lokale Vollabzug UNTERLIEGT dieser
 * Sperre NICHT — er wird vor jeder Zusicherung geschrieben, weil er gerade bei einem roten Lauf
 * gebraucht wird.
 *
 * Der Diff ist ERWARTUNGSGEFUEHRT, nicht leer verlangt: eine Welle, die berechnete Stile
 * absichtlich aendert, aendert `EXPECTED_DEVIATION_KEYS`. Diese Liste ist NACH der Neuerhebung des
 * Sollstands in Plan 15-13 wieder LEER — siehe Regel im Kommentar dort.
 *
 * Beidseitiger Schluesselmengen-Vergleich (CR-04, Mangel 3): `diffPass()` meldet neben geaenderten
 * Digests an gemeinsamen Schluesseln zusaetzlich Schluessel, die nur im Vorlauf vorhanden waren
 * (Element verschwunden), UND Schluessel, die nur im aktuellen Lauf vorhanden sind (Element neu
 * erschienen). Die zweite Richtung ist die vom Bericht verlangte; die dritte ist die Richtung, in
 * der die schwerste Regression dieser Phase gewirkt hat — `.init-mob-dmg-inputs.hidden` wurde
 * geloescht, ein bis dahin verborgenes Element wurde sichtbar, also erschien ein NEUER Schluessel,
 * den der alte, einseitige Vergleich stillschweigend uebergangen haette.
 *
 * Alle drei Durchgaenge benutzen `seedPopulatedSession()` statt des leeren Seeds (CR-04, Mangel 4)
 * — ohne befuellte Daten werden die Entitaets-Markups, auf die geloeschte CSS-Regeln wirken, nie
 * gerendert. Zwei der betroffenen Markups (Shop-Artikelbereich, Fraktions-Ruf-Historie) entstehen
 * zusaetzlich erst im aufgeklappten Shop bzw. bei ausgewaehlter Fraktion — `VIEW_STATE_SETUP`
 * stellt diesen Zustand vor der Erfassung her.
 *
 * Drei Tests = drei Durchgaenge, serialisiert (test.describe.configure mode: 'serial') — alle drei
 * schreiben (bei gesetzter Schreibsperre bzw. immer, im Fall des lokalen Vollabzugs) in dieselbe
 * Datei, und `fullyParallel: true` in playwright.config.js wuerde sie sonst nebenlaeufig ausfuehren
 * und die Datei gegenseitig ueberschreiben.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { loadApp, seedPopulatedSession } from '../helpers/test-utils.js';

test.describe.configure({ mode: 'serial' });

// Alle 24 Ansichten aus systems/tab-registry.js TAB_RENDER_REGISTRY — die
// vollstaendige Liste der Ansichten (read_first: systems/tab-registry.js).
const VIEWS = [
    'dashboard', 'party', 'npcs', 'locations', 'quests', 'encounter',
    'initiative', 'loot', 'shops', 'spells', 'notes', 'wiki', 'links',
    'dice', 'timers', 'data', 'dmscreen', 'bestiary', 'sessionprep',
    'kalender', 'reise', 'fraktionen', 'soundboard', 'dicestats'
];

// Feste Eigenschaftsliste — AUSDRUECKLICH ohne width/height (haengen am
// Viewport und am Inhalt, erzeugen sonst Rauschen ohne Aussage).
const PROPERTIES = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderRadius',
    'padding',
    'margin',
    'fontSize',
    'fontWeight',
    'boxShadow',
    'opacity',
    'display',
    'textAlign'
];

// Deckelung der je Ansicht erfassten Elemente — verhindert, dass ein Lauf auf
// einer grossen Kampagne (T-15-15) unbegrenzt waechst. Wird im Bericht
// ausgewiesen (element count + capped-Flag je Ansicht), damit ein stiller
// Abbruch nicht als "keine Abweichung" erscheint.
const MAX_ELEMENTS_PER_VIEW = 300;

// Ansicht → Zustandsherstellung VOR der Erfassung (Plan 15-13, CR-04 Mangel 4). Zwei der vier von
// Plan 15-12 wiederhergestellten Markups entstehen erst im aufgeklappten Shop bzw. bei
// ausgewaehlter Fraktion — ohne diesen Schritt bleiben Artikelbereich und Fraktions-Detailbereich
// verborgen und fallen aus der Erfassung, selbst mit befuelltem Seed. Beide Funktionen sind aus
// dem jeweiligen Feature-Modul exportiert (toggleShop/selectFraktion), keine UI-Klickpfade.
const VIEW_STATE_SETUP = {
    shops: async page => {
        await page.evaluate(() => {
            // @ts-ignore — global aus features/shops/shops-core.js
            if (typeof window.toggleShop === 'function') window.toggleShop(1);
        });
    },
    fraktionen: async page => {
        await page.evaluate(() => {
            // @ts-ignore — global aus features/fraktionen/fraktionen-render.js
            if (typeof window.selectFraktion === 'function') window.selectFraktion(1);
        });
    }
};

// Gemessener Leerzustand je Ansicht (seedCleanSession, ohne Zustandsherstellung, gegen das
// gebaute Buendel dieser Sitzung — Plan 15-13, Task 2). Diese vier Ansichten tragen die
// geseedeten Entitaeten dieses Plans (party: Charakter mit Zauberplaetzen; shops: Shop mit NPC-
// /Ort-Verknuepfung und nicht verfuegbarem Artikel; fraktionen: Fraktion mit Ruf-Historie;
// initiative: Mob-Kombattant). Die Erfassung mit dem befuellten Seed MUSS darueber liegen — sonst
// ist der Durchgang stillschweigend auf einen Leerzustand zurueckgefallen (z. B. weil sich eine
// Datenform geaendert hat), und das waere ein Fehlschlag, kein bestandener Lauf.
const MIN_ELEMENTS_ABOVE_EMPTY = {
    party: 23,
    shops: 21,
    fraktionen: 16,
    initiative: 29
};

// Erwartungsliste absichtlicher Abweichungen (D-24) — nach der Neuerhebung des Sollstands in
// Plan 15-13 LEER. Ein Eintrag gehoert hierhin AUSSCHLIESSLICH fuer die Dauer genau der Welle,
// die eine berechnete Stiländerung absichtlich herbeifuehrt — mit Nennung des Plans, aus dem er
// stammt (z. B. "15-16: Farbtoken-Umstellung, siehe D-27"). Eine Ausnahmeliste, die nichts mehr
// ausnimmt, ist eine stille Freigabe: sie wuerde ab dem naechsten Lauf echte Befunde an genau
// diesen Schluesseln verschlucken. Jeder Eintrag ist ein Teilstring, der gegen den
// Element-Schluessel geprueft wird.
// U6 (Hoehenbudget der Listen-Schalen): die fuenf Master-Detail-Schalen rechnen ihre Hoehe nicht
// mehr gegen die verdrahtete 120px, sondern gegen die GEMESSENE Umrahmung
// (`--view-frame-height`, updateStickyOffsets()). Mit stehendem Umzugs-Band — dem Normalfall unter
// file://, und dem Zustand, in dem dieser Durchgang laeuft — ist die Umrahmung 195px statt 120px,
// die Bestiar-Schale also 525 statt 600px hoch und ihre Liste 439 statt 514px. Der VirtualScroll
// des Bestiars (`VirtualScroll.create(container, filtered, renderBestiaryListItem, 52)`,
// features/bestiary/bestiary-render.js) rendert daraus 13 statt 15 Zeilen — gemessen am gebauten
// Buendel bei 1280x720, Gegenprobe mit auf 120px gezwungenem Token. Die beiden letzten Zeilen und
// ihre je sechs Kindelemente verschwinden damit aus der Erfassung. Das ist KEIN Stilverlust: die
// 75px, die hier wegfallen, waren genau der Seitenueberhang, auf dem die Werkzeugleiste unter die
// Kopfzeile rutschte. Der versionierte Sollstand bleibt unangetastet; nur diese 14 Schluessel sind
// benannt ausgenommen, alles andere bleibt bewacht.
// Die Teilstrings tragen KEIN Ansichtspraefix: isExpectedDeviation() wird mit dem Element-
// schluessel allein aufgerufen, nicht mit `ansicht/schluessel` (am Aufruf in diffPass()
// nachgelesen — ein Praefix hier nimmt nichts aus). Zwoelf der vierzehn tragen `bestiary` im
// Klassennamen und sind damit ohnehin ansichtsgebunden; `span.sr-only#13/#14` kommt im
// gesamten Sollstand NUR im Bestiar vor (am JSON nachgezaehlt, standard und reducedMotion).
const EXPECTED_DEVIATION_KEYS = [
    'button.bestiary-fav#13',
    'button.bestiary-fav#14',
    'div.bestiary-list-item#13',
    'div.bestiary-list-item#14',
    'span.bestiary-badge.srd#13',
    'span.bestiary-badge.srd#14',
    'span.bestiary-cr#13',
    'span.bestiary-cr#14',
    'span.bestiary-name#13',
    'span.bestiary-name#14',
    'span.bestiary-type#13',
    'span.bestiary-type#14',
    'span.sr-only#13',
    'span.sr-only#14'
];

// NUR fuer den schmalen Durchgang (375x812). Dieselbe Ursache eine Stufe weiter: das Bestiar war
// die einzige der fuenf Schalen, die ihr Hoehenbudget unter 900px und im Mobil-Layout wieder aufgab
// (`height: auto; overflow: visible`, zwei Fassungen in bestiary.css). Die SEITE scrollte dann, und
// die Werkzeugleiste der Ansicht fuhr vollstaendig aus dem Fenster — gemessen am Buendel zu
// b09550b, Bestiar mit gewaehltem Monster, per Mausrad bis zum Anschlag: 900x700 Seitenueberhang
// 697px, Leiste bei -474..-400, `elementFromPoint` auf das Suchfeld antwortete mit "nichts". Seit
// Runde 1 behaelt die Schale ihr Budget und `.bestiary-layout` scrollt selbst. Die Liste ist damit
// an die Schalenhoehe gebunden statt an den Inhalt, und der VirtualScroll rendert bei 375x812 vier
// Zeilen weniger (#9..#12) — am gebauten Buendel nachgezaehlt, nicht geschaetzt.
//
// WARUM GETRENNT VON DER LISTE OBEN: die vier Zeilen sind im Sollstand in ALLEN DREI Durchgaengen
// erfasst (standard, narrow, reducedMotion — am JSON nachgezaehlt). Eine Ausnahme in der globalen
// Liste haette sie auch in den beiden breiten Durchgaengen ausgeblendet, wo sich nichts geaendert
// hat und wo sie weiter bewacht gehoeren. Deshalb nimmt isExpectedDeviation() seit Runde 1 den
// Durchgang mit.
//
// Die Teilstrings tragen weiterhin kein Ansichtspraefix (siehe oben). 30 der 35 tragen `bestiary`
// im Klassennamen; `span.sr-only#8` bis `#12` kommen im gesamten Sollstand NUR im Bestiar vor —
// am JSON nachgezaehlt, in allen drei Durchgaengen.
//
// ERWEITERT MIT M2 (2026-10) um die SIEBTE Zeile, `#8` — dieselbe Ursache eine Stufe weiter.
// M2b/M2c geben der Schale im Mobil-Layout 108px zurueck (zweite Reservierung des Leistenplatzes
// entfallen, Hinweisband auf Telefonbreite kurz gefasst): bei 375x812 waechst `.bestiary-view` von
// 466 auf 574px. Dass die Liste davon SCHRUMPFT (Sichtfeld 400 -> 122px, gerenderte Zeilen 13 -> 8),
// liegt NICHT an der Schale, sondern an `VirtualScroll.create()` — der geteilten Maschinerie in
// `virtual-scroll.js` (im `ui/`-Verzeichnis). Der vollstaendige Pfad steht hier ABSICHTLICH nicht:
// das Abdeckungs-Gate in tests/unit/module-test-coverage.test.js zaehlt jede woertliche
// Pfadnennung in einer Testdatei als Abdeckung, und diese Erwaehnung ist keine. Es nimmt
// `container.clientHeight`, sonst `parent.clientHeight - padY`, sonst den festen Rueckfall 400. In
// der Schmalfassung ist `.bestiary-master` inhaltsgetrieben (`grid-template-rows: auto`,
// `overflow-y: visible`), also liefert die Messung einen Wert, der von der vorigen Messung abhaengt
// — ein Fixpunkt ohne Bezug zum verfuegbaren Platz. Die 400px vorher waren genau dieser feste
// Rueckfall, nicht eine Messung: mit der groesseren Schale greift jetzt der zweite Zweig und liefert
// 122px, wo ~228px frei sind.
//
// GEMESSEN, dass dabei keine Funktion verlorengeht (je drei Telefonfenster vor und nach der
// Aenderung, Rad bis zum Anschlag ueber der Liste): die Liste scrollt in allen sechs Zustaenden bis
// an ihr Ende, das letzte Monster (Kraken) liegt im Fenster und ist anklickbar. Und der Wert ist
// auch NACH der Aenderung nicht einheitlich — 400px bei 360x740, 122px bei 375x812, 127px bei
// 390x844 —, er war also nie eine Eigenschaft des Entwurfs. Das Hoehenbudget der Schmalfassung des
// Bestiars gerade zu ruecken heisst, dieser geteilten Maschinerie eine echte Platzrechnung zu geben;
// das ist eine Einheit fuer sich und steht als offener Befund. Hier wird nur der eine Schluessel
// benannt, der dadurch aus der Erfassung faellt — alles andere bleibt bewacht.
const EXPECTED_DEVIATION_KEYS_NARROW = [
    'button.bestiary-fav#8',
    'div.bestiary-list-item#8',
    'span.bestiary-badge.srd#8',
    'span.bestiary-cr#8',
    'span.bestiary-name#8',
    'span.bestiary-type#8',
    'span.sr-only#8',
    'button.bestiary-fav#9',
    'button.bestiary-fav#10',
    'button.bestiary-fav#11',
    'button.bestiary-fav#12',
    'div.bestiary-list-item#9',
    'div.bestiary-list-item#10',
    'div.bestiary-list-item#11',
    'div.bestiary-list-item#12',
    'span.bestiary-badge.srd#9',
    'span.bestiary-badge.srd#10',
    'span.bestiary-badge.srd#11',
    'span.bestiary-badge.srd#12',
    'span.bestiary-cr#9',
    'span.bestiary-cr#10',
    'span.bestiary-cr#11',
    'span.bestiary-cr#12',
    'span.bestiary-name#9',
    'span.bestiary-name#10',
    'span.bestiary-name#11',
    'span.bestiary-name#12',
    'span.bestiary-type#9',
    'span.bestiary-type#10',
    'span.bestiary-type#11',
    'span.bestiary-type#12',
    'span.sr-only#9',
    'span.sr-only#10',
    'span.sr-only#11',
    'span.sr-only#12'
];

/**
 * @param {string} elementKey Element-Schluessel OHNE Ansichtspraefix
 * @param {string} [durchgang] 'standard' | 'narrow' | 'reducedMotion'
 */
function isExpectedDeviation(elementKey, durchgang) {
    if (EXPECTED_DEVIATION_KEYS.some(frag => elementKey.includes(frag))) return true;
    return (
        durchgang === 'narrow' &&
        EXPECTED_DEVIATION_KEYS_NARROW.some(frag => elementKey.includes(frag))
    );
}

// Versionierter Sollstand (Kurzform/Digest, Checkpoint-Entscheidung C) — NICHT unter dem per
// .gitignore ausgeschlossenen Ergebnisverzeichnis (siehe Kopfkommentar). `UPDATE_STYLE_BASELINE=1`
// erzwingt eine bewusste Neuerhebung; ohne gesetzten Schalter UND ohne fehlenden Sollstand wird
// nicht geschrieben (Schreibsperre, CR-04 Mangel 2).
const BASELINE_DIR = path.join(process.cwd(), 'tests/e2e/baselines');
const BASELINE_PATH = path.join(BASELINE_DIR, 'computed-style-baseline.json');

// Lokaler Vollabzug (alle Rohwerte je Element) — bewusst weiterhin unter dem ausgeschlossenen
// Ergebnisverzeichnis, dient ausschliesslich der oertlichen Fehlersuche bei einer gemeldeten
// Digest-Abweichung. Wird bei JEDEM Lauf geschrieben (auch einem roten), unterliegt NICHT der
// Schreibsperre — anders als der versionierte Sollstand ist er kein Vergleichsgegenstand.
const FULL_CAPTURE_DIR = path.join(process.cwd(), 'tests/e2e/test-results');
const FULL_CAPTURE_PATH = path.join(FULL_CAPTURE_DIR, 'computed-style-snapshot.json');
const FULL_CAPTURE_PATH_REL = 'tests/e2e/test-results/computed-style-snapshot.json';

/**
 * Vorlauf-Sollstand (Digestform), EINMAL beim Laden dieses Moduls gelesen (nicht pro Test) —
 * damit alle drei Durchgaenge gegen denselben, unveraenderten Ausgangsstand dieses Prozesslaufs
 * diffen, unabhaengig davon, in welcher Reihenfolge sie selbst schon geschrieben haben.
 * @returns {object|null}
 */
function loadBaseline() {
    if (!fs.existsSync(BASELINE_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    } catch {
        return null;
    }
}

function saveBaseline(baseline) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2), 'utf8');
}

function saveFullCapture(capture) {
    fs.mkdirSync(FULL_CAPTURE_DIR, { recursive: true });
    fs.writeFileSync(FULL_CAPTURE_PATH, JSON.stringify(capture, null, 2), 'utf8');
}

const previousBaseline = loadBaseline();
const currentBaseline = previousBaseline ? JSON.parse(JSON.stringify(previousBaseline)) : {};
const currentFullCapture = {};

/**
 * Erfasst je sichtbarem Element mit mindestens einer Klasse innerhalb der
 * aktiven Ansicht die feste Eigenschaftsliste. Laeuft im Browser-Kontext
 * (page.evaluate) — reine Funktion ihrer Argumente, kein Zugriff auf
 * Modul-Scope, damit sie serialisierbar bleibt.
 * @param {{viewId: string, properties: string[], maxElements: number}} args
 */
function captureViewInBrowser({ viewId, properties, maxElements }) {
    const container = document.getElementById(`view-${viewId}`);
    if (!container) return { found: false, capped: false, elementCount: 0, elements: {} };

    const all = Array.from(container.querySelectorAll('*')).filter(el => el.classList && el.classList.length > 0);
    const visible = all.filter(el => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 || rect.height > 0;
    });

    const capped = visible.length > maxElements;
    const limited = capped ? visible.slice(0, maxElements) : visible;

    // Stabiler Schluessel: Elementname + sortierte Klassenliste +
    // Geschwisterindex (fortlaufende Vorkommenszahl derselben Signatur in
    // Dokumentreihenfolge) — vergleichbar ueber Laeufe hinweg.
    const seenSignatures = new Map();
    const elements = {};
    limited.forEach(el => {
        const tag = el.tagName.toLowerCase();
        const classes = Array.from(el.classList).sort().join('.');
        const signature = `${tag}.${classes}`;
        const idx = seenSignatures.get(signature) || 0;
        seenSignatures.set(signature, idx + 1);
        const key = `${signature}#${idx}`;

        const cs = getComputedStyle(el);
        // Laufend animierte Elemente NICHT in den Vergleich aufnehmen (Signatur-Index bleibt
        // trotzdem stabil, s.o.): eine CSS-`animation` mit `infinite` (z.B. `.dms-live-badge`,
        // `animation: dms-live-pulse 2s ease-in-out infinite`) liefert je nach Erfassungszeitpunkt
        // innerhalb des Zyklus einen anderen Endwert (hier: `opacity` zwischen 1 und 0.6) — reines
        // Zeitrauschen ohne Aussage ueber eine echte Stiländerung, analog zum Ausschluss von
        // width/height oben. `elementCount` (Sichtbarkeitspruefung) zaehlt das Element trotzdem mit.
        if (cs.animationName && cs.animationName !== 'none') return;

        const record = {};
        properties.forEach(p => {
            record[p] = cs[p];
        });
        elements[key] = record;
    });

    return { found: true, capped, elementCount: visible.length, elements };
}

// Digestlaenge in Hex-Zeichen (64 Bit) — der volle SHA-256 (64 Hex-Zeichen) waere fuer eine
// Kollisionsdomaene von wenigen tausend Elementen je Lauf (< 10.000, gemessen) deutlich
// ueberdimensioniert; 64 Bit halten die Kollisionswahrscheinlichkeit bei dieser Groessenordnung
// astronomisch klein (Geburtstagsschranke ~2^32 Eintraege) und tragen den Groessenvorteil der
// Kurzform (Checkpoint-Entscheidung C) tatsaechlich in die Datei.
const DIGEST_HEX_LENGTH = 16;

/**
 * Stabiler, gekuerzter SHA-256-Hash ueber die feste Eigenschaftsliste eines einzelnen Elements —
 * die Kurzform, die im versionierten Sollstand landet (Checkpoint-Entscheidung C). Eigenschaften
 * werden in `PROPERTIES`-Reihenfolge mit einem Trennzeichen verkettet, das in keinem der
 * berechneten CSS-Werte vorkommt (U+241F, Unit Separator als sichtbares Steuerzeichen).
 * @param {Record<string, string>} record
 * @returns {string}
 */
function digestElement(record) {
    const serialized = PROPERTIES.map(p =>
        Object.prototype.hasOwnProperty.call(record, p) ? String(record[p]) : ' '
    ).join('␟');
    return crypto.createHash('sha256').update(serialized).digest('hex').slice(0, DIGEST_HEX_LENGTH);
}

/**
 * Wandelt einen rohen Durchgang (`runPass()`-Ergebnis) in die Digestform je Ansicht um:
 * die sortierte Schluesselmenge plus ein Digest je Schluessel.
 * @param {object} rawPass
 * @returns {object}
 */
function toDigestPass(rawPass) {
    const digestPass = {};
    for (const viewId of Object.keys(rawPass)) {
        const view = rawPass[viewId];
        const keys = Object.keys(view.elements).sort();
        const digests = {};
        keys.forEach(key => {
            digests[key] = digestElement(view.elements[key]);
        });
        digestPass[viewId] = { elementCount: view.elementCount, capped: view.capped, keys, digests };
    }
    return digestPass;
}

/**
 * Fuehrt einen kompletten Durchgang ueber alle Ansichten aus und liefert das
 * Ergebnis je Ansicht. Navigiert per `window.switchView()` direkt (wie
 * `tests/e2e/tab-navigation.spec.js`), NICHT ueber UI-Klicks durch die
 * Kopfzeilen-Dropdowns — ein rasch aufeinanderfolgender Klickpfad durch alle
 * 24 Ansichten laesst geoeffnete `.nav-group-menu`-Dropdowns ueberlappen und
 * blockiert nachfolgende Klicks (`sticky`-Elemente wie `.encounter-controls`
 * werden dann faelschlich als Ursache gemeldet). `switchView()` ist derselbe
 * Codepfad, den ein echter Klick am Ende ausloest (Rendering + `.active`
 * class), nur ohne den Dropdown-Umweg. Nach dem Ansichtswechsel wird — falls
 * registriert — die Zustandsherstellung aus `VIEW_STATE_SETUP` ausgefuehrt.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<object>}
 */
async function runPass(page) {
    const result = {};
    for (const viewId of VIEWS) {
        await page.evaluate(v => {
            // @ts-ignore — global aus systems/tab-registry.js / core/init.js
            window.switchView(v);
        }, viewId);
        await page.waitForSelector(`#view-${viewId}.active`, { state: 'visible', timeout: 5000 });
        if (VIEW_STATE_SETUP[viewId]) {
            await VIEW_STATE_SETUP[viewId](page);
        }
        // 400 ms statt 150. Die 150 lagen GENAU auf der Dauer des laengsten
        // Uebergangs, den dieser Lauf beruehrt: `.fr-faction-card` traegt
        // `transition: border-color 0.15s, background 0.15s` (welt.css), und
        // `VIEW_STATE_SETUP.fraktionen` waehlt die Karte unmittelbar davor aus.
        // `getComputedStyle` liefert waehrend eines laufenden Uebergangs den
        // INTERPOLIERTEN Wert — gemessen ueber drei aufeinanderfolgende Laeufe
        // lieferte `div.fr-faction-card.fr-selected#0` abwechselnd
        // `rgb(212, 175, 55)` und `rgb(211, 174, 55)` als `borderColor`, also
        // einen Digest, der ohne jede Codeaenderung kippt. Ein Waechter, der
        // muenzwurfartig rot wird, wird abgeschaltet statt gelesen. 400 ms
        // liegen deutlich hinter jedem Uebergang dieses Laufs; der Aufschlag
        // kostet 24 Ansichten x 3 Durchgaenge x 250 ms = rund 18 Sekunden.
        await page.waitForTimeout(400);
        const captured = await page.evaluate(captureViewInBrowser, {
            viewId,
            properties: PROPERTIES,
            maxElements: MAX_ELEMENTS_PER_VIEW
        });
        console.log(
            `[computed-style-diff] ${viewId}: ${captured.elementCount} Elemente erfasst` +
                (captured.capped ? ` (gedeckelt bei ${MAX_ELEMENTS_PER_VIEW})` : '')
        );
        expect(captured.found, `Ansicht view-${viewId} wurde nicht im DOM gefunden`).toBe(true);
        expect(captured.elementCount, `Ansicht view-${viewId} hat kein klassenbehaftetes sichtbares Element`).toBeGreaterThan(0);
        if (Object.prototype.hasOwnProperty.call(MIN_ELEMENTS_ABOVE_EMPTY, viewId)) {
            expect(
                captured.elementCount,
                `Ansicht view-${viewId} liefert mit befuelltem Seed nicht mehr Elemente als der ` +
                    `gemessene Leerzustand (${MIN_ELEMENTS_ABOVE_EMPTY[viewId]}) — der Durchgang ist ` +
                    `stillschweigend auf einen Leerzustand zurueckgefallen`
            ).toBeGreaterThan(MIN_ELEMENTS_ABOVE_EMPTY[viewId]);
        }
        result[viewId] = captured;
    }
    return result;
}

/**
 * Vergleicht den aktuellen Durchgang (Digestform) mit dem vorigen (falls vorhanden) und liefert
 * die Liste UNERWARTETER Abweichungen (Schluessel ausserhalb EXPECTED_DEVIATION_KEYS). Meldet
 * DREI Arten von Befund je Ansicht (CR-04, Mangel 3): ein geaenderter Digest an einem in beiden
 * Laeufen vorhandenen Schluessel (die Meldung nennt Ansicht und Schluessel und verweist fuer die
 * konkreten Werte auf den lokalen Vollabzug — der Digest selbst kann keinen alten/neuen Wert
 * nennen); ein Schluessel, der im Vorlauf vorhanden war und jetzt nicht mehr erfasst wird (Element
 * verschwunden); und ein Schluessel, der im Vorlauf fehlte und jetzt erfasst wird (Element neu
 * erschienen). Alle drei unterliegen derselben Erwartungsliste.
 *
 * `durchgang` benennt den Durchgang ('standard' | 'narrow' | 'reducedMotion') und entscheidet, ob
 * die NUR fuer den schmalen Durchgang geltenden Ausnahmen greifen (siehe
 * EXPECTED_DEVIATION_KEYS_NARROW). Ohne diesen Parameter waere jede Ausnahme global, und eine
 * Ausnahme, die nur in einem Durchgang gebraucht wird, blendete die beiden anderen mit aus.
 *
 * @param {object|null} previousDigestPass
 * @param {object} currentDigestPass
 * @param {string} durchgang
 * @returns {string[]}
 */
function diffPass(previousDigestPass, currentDigestPass, durchgang) {
    if (!previousDigestPass) return [];
    const unexpected = [];
    for (const viewId of Object.keys(currentDigestPass)) {
        const prevView = previousDigestPass[viewId];
        const currView = currentDigestPass[viewId];
        if (!prevView) continue; // Ansicht ist neu im Vergleich zur Vorlaufdatei

        // Art 1: geaenderter Digest an einem gemeinsamen Schluessel
        for (const key of currView.keys) {
            const prevDigest = prevView.digests[key];
            if (prevDigest === undefined) continue; // Art 3, separat unten behandelt
            if (prevDigest !== currView.digests[key]) {
                const entry = `${viewId}/${key}: Digest geaendert (Werte im lokalen Vollabzug ${FULL_CAPTURE_PATH_REL})`;
                if (!isExpectedDeviation(key, durchgang)) unexpected.push(entry);
            }
        }

        // Art 2: Schluessel im Vorlauf vorhanden, jetzt nicht mehr erfasst (Element verschwunden)
        for (const key of prevView.keys) {
            if (!(key in currView.digests) && !isExpectedDeviation(key, durchgang)) {
                unexpected.push(`${viewId}/${key}: Element im Vorlauf vorhanden, jetzt nicht mehr erfasst`);
            }
        }

        // Art 3: Schluessel im Vorlauf NICHT vorhanden, jetzt erfasst (Element neu erschienen) —
        // die Richtung, in der die schwerste Regression dieser Phase gewirkt hat
        // (.init-mob-dmg-inputs.hidden geloescht -> Element wurde sichtbar).
        for (const key of currView.keys) {
            if (!(key in prevView.digests) && !isExpectedDeviation(key, durchgang)) {
                unexpected.push(`${viewId}/${key}: Element im Vorlauf nicht vorhanden, jetzt neu erfasst`);
            }
        }
    }
    return unexpected;
}

test.describe('Computed-Style-Vergleichslauf (D-24)', () => {
    test('Standard', async ({ page }) => {
        await seedPopulatedSession(page);
        await loadApp(page);

        const passResult = await runPass(page);
        const digestPass = toDigestPass(passResult);

        // Lokaler Vollabzug: VOR der Zusicherung geschrieben (auch bei einem roten Lauf verfuegbar
        // fuer die oertliche Fehlersuche) und OHNE Schreibsperre — er ist kein Vergleichsgegenstand.
        currentFullCapture.standard = passResult;
        saveFullCapture(currentFullCapture);

        const unexpected = diffPass(previousBaseline ? previousBaseline.standard : null, digestPass, 'standard');
        currentBaseline.standard = digestPass;

        expect(unexpected, `Unerwartete Stilabweichungen (Standard):\n${unexpected.join('\n')}`).toEqual([]);

        // Schreibsperre (CR-04, Mangel 2): schreibt NUR wenn noch kein Sollstand existiert oder
        // der Schalter gesetzt ist — UND erst NACH der Zusicherung, damit ein gefundener Befund
        // nicht im selben Lauf als neuen Sollstand festgeschrieben wird.
        if (!previousBaseline || process.env.UPDATE_STYLE_BASELINE === '1') {
            saveBaseline(currentBaseline);
        }
    });

    test('Schmales Layout', async ({ page }) => {
        await seedPopulatedSession(page);
        await loadApp(page);
        await page.setViewportSize({ width: 375, height: 812 });
        await page.evaluate(() => {
            // @ts-ignore — global aus dem Layout-Profil-Modul
            if (typeof window.setLayout === 'function') window.setLayout('mobile');
        });
        await page.waitForTimeout(200);

        const passResult = await runPass(page);
        const digestPass = toDigestPass(passResult);

        currentFullCapture.narrow = passResult;
        saveFullCapture(currentFullCapture);

        const unexpected = diffPass(previousBaseline ? previousBaseline.narrow : null, digestPass, 'narrow');
        currentBaseline.narrow = digestPass;

        expect(unexpected, `Unerwartete Stilabweichungen (schmales Layout):\n${unexpected.join('\n')}`).toEqual([]);

        if (!previousBaseline || process.env.UPDATE_STYLE_BASELINE === '1') {
            saveBaseline(currentBaseline);
        }
    });

    test('Emulierte reduzierte Bewegung', async ({ page }) => {
        await seedPopulatedSession(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await loadApp(page);

        const passResult = await runPass(page);
        const digestPass = toDigestPass(passResult);

        currentFullCapture.reducedMotion = passResult;
        saveFullCapture(currentFullCapture);

        const unexpected = diffPass(previousBaseline ? previousBaseline.reducedMotion : null, digestPass, 'reducedMotion');
        currentBaseline.reducedMotion = digestPass;

        expect(unexpected, `Unerwartete Stilabweichungen (reduzierte Bewegung):\n${unexpected.join('\n')}`).toEqual([]);

        if (!previousBaseline || process.env.UPDATE_STYLE_BASELINE === '1') {
            saveBaseline(currentBaseline);
        }
    });
});
