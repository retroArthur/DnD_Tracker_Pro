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

// Die fuenf Eigenschaften, die das UA-Stilblatt an einem Formularelement SELBST setzt und die es
// daher NICHT erbt. Sie bilden den Fingerabdruck, mit dem sich ein Formularelement erkennen
// laesst, das keine einzige App-Regel abbekommen hat — siehe `uaFingerabdruck()` in
// `captureViewInBrowser()` und die Begruendung im Kopfkommentar (Befund 2).
const UA_PROBE_PROPERTIES = ['backgroundColor', 'borderColor', 'borderRadius', 'padding', 'fontSize'];

// Nachstellung einer breiter laufenden Schriftmetrik, WOERTLICH dieselbe wie in
// tests/e2e/features/breite-schrift.spec.js (C1). Die App bestimmt ihre Schriften an genau zwei
// Stellen (assets/styles/variables.css), und BEIDE Ketten haben einen Gewinner, den es nur unter
// Windows gibt ('Segoe UI' bzw. Consolas — JetBrains Mono und Fira Code sind auf beiden
// Plattformen nicht installiert, nachgemessen). Unter Linux greift die fontconfig-Standardschrift
// bzw. DejaVu Sans Mono, und die laufen rund 14.5 % (UI) bzw. 9.5 % (Mono) breiter. Verdana liegt
// mit Faktor 1.1554 einen Prozentpunkt UEBER der Linux-UI-Schrift (am CI-Befund kalibriert:
// ~1.145), Courier New mit 0.600em Vorschub knapp unter DejaVu Sans Mono (0.602em).
const BREITE_SCHRIFT =
    ':root { --font-ui: Verdana, sans-serif !important; ' +
    '--font-mono: "Courier New", monospace !important; }';

// Bezugstext der Vorbedingung des vierten Durchgangs — ein echter Knopftext der Werkzeugleiste.
// Eine Buchstabenreihe waere kuerzer und damit unempfindlicher.
const PROBETEXT = '+ Neuer Charakter';

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
// stammt (z. B. "15-16: Farbtoken-Umstellung, siehe D-27"). Ein Eintrag, der ueber diese Welle
// hinaus stehen bleibt, ist eine stille Freigabe: er verschluckt ab dem naechsten Lauf echte
// Befunde an genau diesem Schluessel. Jeder Eintrag ist ein Teilstring, der gegen den
// Element-Schluessel geprueft wird.
//
// BEIDE LISTEN SIND SEIT M3b (2026-10-01) WIEDER LEER — und zwar absichtlich leer, nicht
// abwesend. Vor M3b trugen sie zusammen 49 Schluessel (14 global + 35 nur schmal): Bestiar-
// Listenzeilen, die durch die Hoehenbudget-Korrektur (U6) und die beiden Platzgewinne aus M2
// aus der Erfassung gefallen waren. Sie standen dort ueber mehrere Wellen hinweg und waren damit
// genau das, was der Absatz oben verbietet. Statt sie weiterzuschleppen ist der Sollstand
// REGULAER NEU ERHOBEN (`UPDATE_STYLE_BASELINE=1`) und schluesselweise gegen den vorigen
// verglichen — Zu- und Abgaenge einzeln benannt, nicht gezaehlt:
//
//   Durchgang       Zugaenge  Abgaenge  Digest-Aenderungen  Elementzahl Bestiar
//   --------------  --------  --------  ------------------  -------------------
//   standard               0        14                   0          129 -> 115
//   narrow                 0        35                   0          115 ->  80
//   reducedMotion          0        14                   0          129 -> 115
//
//   63 Meldungen an 49 verschiedenen Schluesseln (standard und reducedMotion nennen dieselben
//   14). ALLE 63 liegen in der Bestiar-Ansicht; 54 tragen `bestiary` im Klassennamen, die
//   restlichen 9 sind `span.sr-only#8` bis `#14` aus genau denselben Listenzeilen. KEIN Abgang
//   darueber hinaus, KEIN Zugang, und an keinem weiterhin erfassten Element hat sich ein
//   berechneter Wert bewegt (0 Digest-Aenderungen in allen drei Durchgaengen). Das war die
//   Behauptung der beiden Ausnahmelisten, und sie haelt — geprueft, nicht geglaubt.
//
// Dass die Elementzahl der Bestiar-Ansicht dabei SINKT, ist kein Stilverlust, sondern der
// ungeloeste Befund hinter der geteilten Scroll-Maschinerie (`virtual-scroll.js` im `ui/`-
// Verzeichnis — der vollstaendige Pfad steht hier ABSICHTLICH nicht: das Abdeckungs-Gate in
// tests/unit/module-test-coverage.test.js zaehlt jede woertliche Pfadnennung in einer Testdatei
// als Abdeckung, und diese Erwaehnung ist keine): deren Platzrechnung nimmt
// `container.clientHeight`, sonst `parent.clientHeight - padY`, sonst den festen Rueckfall 400 —
// ein Fixpunkt ohne Bezug zum verfuegbaren Platz, der bei GROESSERER Schale WENIGER Zeilen
// rendert. Gemessen und offen; eine
// eigene Einheit. Der Sollstand hier bildet den Istzustand ab, er rechtfertigt ihn nicht.
//
// Die Mechanik (`isExpectedDeviation()` mit dem `durchgang`-Parameter) bleibt stehen, damit die
// naechste Welle, die berechnete Stile absichtlich aendert, sie wieder benutzen kann — eine leere
// Liste ist der Normalzustand, keine fehlende Einrichtung.

// ZWEITE REGULAERE NEUERHEBUNG, C1 (2026-10-02). Dieselbe Mechanik wie bei M3b, derselbe
// schluesselweise Vergleich gegen den vorigen Sollstand:
//
//   Durchgang       Zugaenge  Abgaenge  Digest-Aenderungen  Elementzahl
//   --------------  --------  --------  ------------------  -----------
//   standard               0         0                   0  unveraendert
//   narrow                 0         0                  14  unveraendert
//   reducedMotion          0         0                   0  unveraendert
//
// Die 14 liegen alle im schmalen Durchgang und sind 13x `div.section-toolbar-actions#0` (npcs,
// locations, quests, encounter, loot, shops, spells, links, dmscreen, bestiary, sessionprep,
// kalender, fraktionen) plus `npcs/button.btn.btn-secondary.npcg-trigger-btn#0`. In ALLEN 14 ist
// die einzige bewegte Eigenschaft `margin` — nachgemessen am gebauten Buendel bei 375x812 im
// Mobil-Profil, mit und ohne die Aenderung:
//
//   npcs       actions  margin 0px                    -> 0px 0px 0px 31.6719px
//              trigger  margin 0px 0px 0px 128.734px  -> 0px
//   locations  actions  margin 0px                    -> 0px 0px 0px 126.656px
//   loot       actions  margin 0px                    -> 0px 0px 0px 153.797px
//   fraktionen actions  margin 0px                    -> 0px 0px 0px 28.6406px
//
// URSACHE UND WARUM DAS KEIN GESTALTBEFUND IST: `.section-toolbar-actions` traegt
// `margin-left: auto` (editors.css). Chromium loest ein `auto` in `getComputedStyle().margin`
// zum BENUTZTEN Wert in Bildpunkten auf, und der benutzte Wert eines auto-Rands in einer
// Flexzeile IST der uebrige Platz der Zeile. Bis zu dieser Runde stand die Gruppe im 600px-Block
// auf `width: 100%`, hatte also keinen uebrigen Platz (margin 0px) und schob ihn an den
// auto-Rand des Knopfes DARIN weiter (128.734px). Jetzt steht sie auf `width: auto` und nimmt
// ihn selbst. Es hat sich keine Farbe, kein Rahmen, kein Schatten, kein Innenabstand und keine
// Schriftgroesse bewegt — nur die Stelle, an der derselbe uebrige Platz verbucht wird. Die
// Aenderung selbst ist gewollt: sie gibt der Listenspalte der Truhe 32px zurueck (siehe
// tests/e2e/features/breite-schrift.spec.js).
// Dass ein auto-Rand in diesem Sollstand ueberhaupt als Gestaltwert gefuehrt wird, ist ein
// eigener, offener Befund dieses CI-Laufs und nicht Sache dieser Einheit.

// Globale Ausnahmen (alle drei Durchgaenge). LEER seit M3b — Begruendung im Absatz darueber.
/** @type {string[]} */
const EXPECTED_DEVIATION_KEYS = [];

// Ausnahmen NUR fuer den schmalen Durchgang (375x812). Ebenfalls leer seit M3b. Die Trennung
// bleibt bestehen: eine nur schmal gebrauchte Ausnahme in der globalen Liste blendete sie auch
// in den beiden breiten Durchgaengen aus, wo dieselben Schluessel weiter bewacht gehoeren.
/** @type {string[]} */
const EXPECTED_DEVIATION_KEYS_NARROW = [];

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
 * @param {{viewId: string, properties: string[], maxElements: number, uaProbeProperties: string[]}} args
 */
function captureViewInBrowser({ viewId, properties, maxElements, uaProbeProperties }) {
    /**
     * Reiner UA-Fingerabdruck dieser Plattform und dieses Themas: je Formularelementart ein
     * klassenloses Sondenelement, verkettet ueber `uaProbeProperties`. Die Sonden haengen am
     * `body` und nicht in der Ansicht — sie sollen keine Beobachter der App ausloesen, und keine
     * der fuenf Eigenschaften wird geerbt (das UA-Stilblatt setzt sie am Formularelement selbst,
     * `font: -webkit-small-control` schlaegt dabei auch die geerbte Schriftgroesse).
     * SELBSTKALIBRIEREND: kein Zahlenwert steht im Quelltext, der Vergleich holt sich den
     * Istzustand der laufenden Plattform. Ein Sollstand mit festen Werten waere genau der Fehler,
     * den dieser Befund beschreibt.
     */
    function uaFingerabdruck() {
        const huelle = document.createElement('div');
        huelle.setAttribute('aria-hidden', 'true');
        huelle.style.cssText =
            'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden';
        const arten = {};
        arten.select = document.createElement('select');
        arten.textarea = document.createElement('textarea');
        arten.button = document.createElement('button');
        ['text', 'number', 'search', 'date', 'color', 'checkbox', 'radio', 'range'].forEach(t => {
            const el = document.createElement('input');
            el.type = t;
            arten[`input-${t}`] = el;
        });
        Object.keys(arten).forEach(a => huelle.appendChild(arten[a]));
        document.body.appendChild(huelle);
        const fp = {};
        Object.keys(arten).forEach(a => {
            const cs = getComputedStyle(arten[a]);
            fp[a] = uaProbeProperties.map(p => cs[p]).join('␟');
        });
        huelle.remove();
        return fp;
    }

    /** Elementart im Sinne des Fingerabdrucks — `<input>` traegt sie im type-Attribut. */
    function artDesElements(el) {
        const tag = el.tagName.toLowerCase();
        if (tag === 'input') return `input-${(el.getAttribute('type') || 'text').toLowerCase()}`;
        return tag;
    }

    const container = document.getElementById(`view-${viewId}`);
    if (!container) return { found: false, capped: false, elementCount: 0, elements: {}, uaOnly: [] };

    const fingerabdruck = uaFingerabdruck();
    const uaOnly = [];

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

        // Stimmen alle fuenf UA-gesetzten Eigenschaften mit der Sonde derselben Elementart
        // ueberein, hat dieses Formularelement keine einzige App-Regel abbekommen: sein
        // erfasster Stil ist das Formularthema der Plattform, nicht die Gestalt dieser App.
        // Steht VOR der Animationsschranke, damit ein animiertes ungestaltetes Bedienelement
        // nicht durchfaellt.
        const art = artDesElements(el);
        if (
            fingerabdruck[art] !== undefined &&
            uaProbeProperties.map(p => cs[p]).join('␟') === fingerabdruck[art]
        ) {
            uaOnly.push(
                `${key} (${art}): ` + uaProbeProperties.map(p => `${p}=${cs[p]}`).join(' ')
            );
        }

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

    return { found: true, capped, elementCount: visible.length, elements, uaOnly };
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
 *
 * `uaBefunde` wird MITGEFUELLT, nicht zurueckgegeben: die Fundliste ungestalteter Formular-
 * elemente gehoert nicht in den Digestvergleich (sie ist kein Stilwert), muss aber in jedem
 * Durchgang erhoben und NACH der Digest-Zusicherung geprueft werden. Die Reihenfolge ist
 * Absicht — bei zwei gleichzeitigen Befunden soll die Abweichung zuerst stehen.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string[]} [uaBefunde] Sammelliste fuer ungestaltete Formularelemente
 * @returns {Promise<object>}
 */
async function runPass(page, uaBefunde) {
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
            maxElements: MAX_ELEMENTS_PER_VIEW,
            uaProbeProperties: UA_PROBE_PROPERTIES
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
        if (uaBefunde && captured.uaOnly) {
            captured.uaOnly.forEach(e => uaBefunde.push(`${viewId}/${e}`));
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

/**
 * Zusicherung zum zweiten Befund (siehe Kopfkommentar): kein erfasstes Formularelement darf
 * seinen Stil vollstaendig vom UA-Stilblatt beziehen. Steht in jedem Durchgang NACH der
 * Digest-Zusicherung.
 * @param {string[]} uaBefunde
 * @param {string} durchgang
 */
function assertKeineUaBedienelemente(uaBefunde, durchgang) {
    expect(
        uaBefunde,
        `Ungestaltete Formularelemente (${durchgang}) — alle fuenf UA-gesetzten Eigenschaften ` +
            `stimmen mit einer klassenlosen Sonde derselben Elementart ueberein, die App hat ` +
            `diesen Elementen also keine einzige Regel gegeben. Ihr erfasster Stil ist das ` +
            `Formularthema der Plattform und wandert mit ihr; der Sollstand bewacht hier nicht ` +
            `die App, sondern den Browserbau. Abhilfe ist eine CSS-Regel, keine Ausnahme:\n` +
            uaBefunde.join('\n')
    ).toEqual([]);
}

test.describe('Computed-Style-Vergleichslauf (D-24)', () => {
    test('Standard', async ({ page }) => {
        await seedPopulatedSession(page);
        await loadApp(page);

        const uaBefunde = [];
        const passResult = await runPass(page, uaBefunde);
        const digestPass = toDigestPass(passResult);

        // Lokaler Vollabzug: VOR der Zusicherung geschrieben (auch bei einem roten Lauf verfuegbar
        // fuer die oertliche Fehlersuche) und OHNE Schreibsperre — er ist kein Vergleichsgegenstand.
        currentFullCapture.standard = passResult;
        saveFullCapture(currentFullCapture);

        const unexpected = diffPass(previousBaseline ? previousBaseline.standard : null, digestPass, 'standard');
        currentBaseline.standard = digestPass;

        expect(unexpected, `Unerwartete Stilabweichungen (Standard):\n${unexpected.join('\n')}`).toEqual([]);
        assertKeineUaBedienelemente(uaBefunde, 'Standard');

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

        const uaBefunde = [];
        const passResult = await runPass(page, uaBefunde);
        const digestPass = toDigestPass(passResult);

        currentFullCapture.narrow = passResult;
        saveFullCapture(currentFullCapture);

        const unexpected = diffPass(previousBaseline ? previousBaseline.narrow : null, digestPass, 'narrow');
        currentBaseline.narrow = digestPass;

        expect(unexpected, `Unerwartete Stilabweichungen (schmales Layout):\n${unexpected.join('\n')}`).toEqual([]);
        assertKeineUaBedienelemente(uaBefunde, 'schmales Layout');

        if (!previousBaseline || process.env.UPDATE_STYLE_BASELINE === '1') {
            saveBaseline(currentBaseline);
        }
    });

    test('Emulierte reduzierte Bewegung', async ({ page }) => {
        await seedPopulatedSession(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await loadApp(page);

        const uaBefunde = [];
        const passResult = await runPass(page, uaBefunde);
        const digestPass = toDigestPass(passResult);

        currentFullCapture.reducedMotion = passResult;
        saveFullCapture(currentFullCapture);

        const unexpected = diffPass(previousBaseline ? previousBaseline.reducedMotion : null, digestPass, 'reducedMotion');
        currentBaseline.reducedMotion = digestPass;

        expect(unexpected, `Unerwartete Stilabweichungen (reduzierte Bewegung):\n${unexpected.join('\n')}`).toEqual([]);
        assertKeineUaBedienelemente(uaBefunde, 'reduzierte Bewegung');

        if (!previousBaseline || process.env.UPDATE_STYLE_BASELINE === '1') {
            saveBaseline(currentBaseline);
        }
    });

    /**
     * VIERTER DURCHGANG — die Schranke, die diesem Waechter gefehlt hat (C2, 2026-10-02).
     *
     * Er vergleicht NICHT gegen den eingecheckten Sollstand, sondern DIESELBE Fassung gegen sich
     * selbst unter einer breiter laufenden Schriftmetrik. Damit prueft er die Eigenschaft, die
     * der versionierte Sollstand stillschweigend voraussetzt und die am 2026-10-02 zum ersten Mal
     * gebrochen war: dass ein erfasster Wert von der Schriftmetrik der Plattform UNABHAENGIG ist.
     * Jede Eigenschaft, deren Endwert Chromium aus einer Messung ableitet, faellt hier auf —
     * oertlich, auf dem Entwicklerrechner, in 30 Sekunden, statt erst in CI auf einem anderen
     * Betriebssystem.
     *
     * ZWEI SEITEN, nicht eine: der Durchgang erhebt beide Abzuege selbst, in zwei Seiten
     * desselben Kontexts. Er haengt damit an keinem Sollstand und an keinem vorigen Fall —
     * auch ein `--grep`-Lauf nur dieses Falles und ein Lauf mit `UPDATE_STYLE_BASELINE=1` sagen
     * dasselbe. Der Preis sind zwei zusaetzliche Abzuege (rund 30 s).
     *
     * WAS ER AUF EINEM LINUX-RUNNER MISST. Dort ist Verdana nicht installiert und
     * `Verdana, sans-serif` faellt auf dieselbe Standardschrift wie `'Segoe UI', system-ui,
     * sans-serif`; dasselbe gilt fuer Courier New gegen DejaVu Sans Mono. Beide Seiten messen dann
     * dieselbe Metrik und der Fall kann dort NICHTS finden. Das ist kein Mangel, sondern die
     * Arbeitsteilung: der Fall ist die Schranke fuer den Entwicklerrechner, auf dem die beiden
     * Windows-Erstwahlen greifen und auf dem der Sollstand erhoben wird. Damit das nicht
     * stillschweigend passiert, misst die Vorbedingung beide Breiten und SAGT ins Protokoll,
     * welcher der beiden Faelle vorliegt — ein stiller Uebersprung waere hier dieselbe stille
     * Freigabe wie eine Ausnahmeliste, die nichts mehr ausnimmt.
     */
    test('Breitere Schriftmetrik bewegt den Digest nicht', async ({ page, context }) => {
        await seedPopulatedSession(page);
        await loadApp(page);
        const schmalBefunde = [];
        const schmal = toDigestPass(await runPass(page, schmalBefunde));

        const breiteSeite = await context.newPage();
        // Als ERSTES Kopfkind, also vor den App-Stilen: die App setzt ihre Messtokens beim Start
        // und soll dabei schon die endgueltige Schrift sehen. Dass die Deklaration trotz der
        // frueheren Stellung gewinnt, leistet das `!important` (keine Ratschenverletzung — die
        // Ratsche in tests/unit/design-consistency.test.js zaehlt die Quellen unter
        // assets/styles/, nicht das Stilblatt eines Testlaufs).
        await breiteSeite.addInitScript(quelltext => {
            const einfuegen = () => {
                if (!document.head) return false;
                const s = document.createElement('style');
                s.id = 'breite-schrift-probe';
                s.textContent = quelltext;
                document.head.insertBefore(s, document.head.firstChild);
                return true;
            };
            if (!einfuegen()) {
                const mo = new MutationObserver(() => {
                    if (einfuegen()) mo.disconnect();
                });
                mo.observe(document, { childList: true, subtree: true });
            }
        }, BREITE_SCHRIFT);
        await seedPopulatedSession(breiteSeite);
        await loadApp(breiteSeite);

        // Vorbedingung: ist die Nachstellung angekommen — oder KANN sie auf dieser Plattform
        // nichts aendern? Beides wird benannt, keines verschwiegen.
        const breiten = await breiteSeite.evaluate(t => {
            const messe = familie => {
                const span = document.createElement('span');
                span.style.cssText =
                    'position:absolute;left:-9999px;white-space:pre;font-size:14px;font-family:' +
                    familie;
                span.textContent = t;
                document.body.appendChild(span);
                const b = span.getBoundingClientRect().width;
                span.remove();
                return Math.round(b * 100) / 100;
            };
            return { ist: messe('var(--font-ui)'), segoe: messe('"Segoe UI"') };
        }, PROBETEXT);
        const faktor = breiten.segoe > 0 ? Math.round((breiten.ist / breiten.segoe) * 10000) / 10000 : 0;
        if (faktor > 1.02) {
            console.log(
                `[computed-style-diff] breite Schrift ANGEKOMMEN: "${PROBETEXT}" ` +
                    `${breiten.segoe}px -> ${breiten.ist}px (Faktor ${faktor})`
            );
        } else {
            console.log(
                `[computed-style-diff] breite Schrift AUF DIESER PLATTFORM NICHT NACHSTELLBAR: ` +
                    `"${PROBETEXT}" misst unter var(--font-ui) ${breiten.ist}px und unter ` +
                    `"Segoe UI" ${breiten.segoe}px (Faktor ${faktor}) — beide Ketten fallen auf ` +
                    `dieselbe Schrift. Dieser Fall vergleicht dann zwei gleiche Metriken und kann ` +
                    `nichts finden; er ist die Schranke fuer den Entwicklerrechner, nicht fuer ` +
                    `den Runner.`
            );
        }

        const breitBefunde = [];
        const breit = toDigestPass(await runPass(breiteSeite, breitBefunde));
        await breiteSeite.close();

        // Kein Sollstand im Spiel, also auch keine Erwartungsliste eines Durchgangs: der
        // Vergleich laeuft unter dem eigenen Namen 'breiteSchrift', und die nur fuer das schmale
        // Layout geltenden Ausnahmen greifen hier ausdruecklich nicht.
        const unexpected = diffPass(schmal, breit, 'breiteSchrift');
        expect(
            unexpected,
            `Erfasste Werte haengen an der Schriftmetrik (Faktor ${faktor}). Jeder dieser ` +
                `Schluessel liefert auf einem Betriebssystem mit anderen Standardschriften einen ` +
                `anderen Digest — der versionierte Sollstand bewacht dort das Betriebssystem ` +
                `statt die App. Abhilfe ist, den BERECHNETEN statt den BENUTZTEN Wert zu erfassen ` +
                `(siehe berechneteKante() in captureViewInBrowser), nicht eine Ausnahme:\n` +
                unexpected.join('\n')
        ).toEqual([]);
        assertKeineUaBedienelemente(breitBefunde, 'breite Schrift');
    });
});
