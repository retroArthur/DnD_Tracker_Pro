// @ts-check
/**
 * Computed-Style-Vergleichslauf — Phase 15, Plan 15-06 (D-24), repariert in Plan 15-13 (D-17,
 * 15-VERIFICATION.md Gap 2, 15-REVIEW.md CR-04).
 *
 * Dritte Nachweissaeule neben der gruenen Suite und der menschlichen Sichtung: ein Abzug
 * berechneter Endwerte (`getComputedStyle`) ueber ALLE Ansichten, in drei Durchgaengen (Standard /
 * schmales Layoutprofil / emulierte reduzierte Bewegung), verglichen gegen den vorigen Abzug.
 *
 * Der Sollstand liegt unter `tests/e2e/baselines/computed-style-baseline.json` — VERSIONIERT, NICHT
 * unter dem per `.gitignore` ausgeschlossenen Ergebnisverzeichnis. Ein Sollstand, der nur im
 * Arbeitsverzeichnis des Autors existiert, ist in CI und in jedem frischen Klon `null`; der
 * Vergleich liefert dann sofort eine leere Liste und alle drei Faelle laufen gruen OHNE zu
 * vergleichen (15-REVIEW.md CR-04, Mangel 1). Der Sollstand ist damit ein VERTRAG: er wandert in
 * die Git-Historie, und jede Welle, die berechnete Stile absichtlich aendert (Phasen 16-19), muss
 * ihn danach ausdruecklich neu erheben.
 *
 * Schreibsperre (CR-04, Mangel 2): der Sollstand wird nur geschrieben, wenn entweder gar keiner
 * existiert ODER die Umgebungsvariable `UPDATE_STYLE_BASELINE` auf `1` steht — UND in allen drei
 * Faellen steht der Schreibaufruf HINTER der Zusicherung. Beide Aenderungen zusammen: die
 * Reihenfolge allein genuegt nicht (ein Lauf mit gesetztem Schalter wuerde sonst weiterhin vor der
 * Zusicherung schreiben), die Sperre allein genuegt nicht (ein zweiter Lauf nach einem Fehlschlag
 * duerfte sonst wieder schreiben). Ein Waechter, der eine gefundene Abweichung im selben Lauf als
 * neuen Sollstand festschreibt, meldet einen Befund genau einmal und nie wieder — das ist
 * schlechter als gar kein Waechter (T-15-27).
 *
 * Der Diff ist ERWARTUNGSGEFUEHRT, nicht leer verlangt: eine Welle, die berechnete Stile
 * absichtlich aendert, aendert `EXPECTED_DEVIATION_KEYS`. Diese Liste ist NACH der Neuerhebung des
 * Sollstands in Plan 15-13 wieder LEER — siehe Regel im Kommentar dort.
 *
 * Beidseitiger Schluesselmengen-Vergleich (CR-04, Mangel 3): `diffPass()` meldet neben geaenderten
 * Eigenschaften an gemeinsamen Schluesseln zusaetzlich Schluessel, die nur im Vorlauf vorhanden
 * waren (Element verschwunden), UND Schluessel, die nur im aktuellen Lauf vorhanden sind (Element
 * neu erschienen). Die zweite Richtung ist die vom Bericht verlangte; die dritte ist die Richtung,
 * in der die schwerste Regression dieser Phase gewirkt hat — `.init-mob-dmg-inputs.hidden` wurde
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
 * schreiben (bei gesetzter Schreibsperre) in dieselbe Sollstandsdatei, und `fullyParallel: true` in
 * playwright.config.js wuerde sie sonst nebenlaeufig ausfuehren und die Datei gegenseitig
 * ueberschreiben.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
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
const EXPECTED_DEVIATION_KEYS = [];

function isExpectedDeviation(elementKey) {
    return EXPECTED_DEVIATION_KEYS.some(frag => elementKey.includes(frag));
}

// Versionierter Sollstand — NICHT unter dem per .gitignore ausgeschlossenen Ergebnisverzeichnis
// (siehe Kopfkommentar). `UPDATE_STYLE_BASELINE=1` erzwingt eine bewusste Neuerhebung; ohne
// gesetzten Schalter UND ohne fehlenden Sollstand wird nicht geschrieben (Schreibsperre, CR-04
// Mangel 2).
const BASELINE_DIR = path.join(process.cwd(), 'tests/e2e/baselines');
const BASELINE_PATH = path.join(BASELINE_DIR, 'computed-style-baseline.json');

/**
 * Vorlauf-Abzug, EINMAL beim Laden dieses Moduls gelesen (nicht pro Test) —
 * damit alle drei Durchgaenge gegen denselben, unveraenderten Ausgangsstand
 * dieses Prozesslaufs diffen, unabhaengig davon, in welcher Reihenfolge sie
 * selbst schon geschrieben haben.
 * @returns {object|null}
 */
function loadSnapshot() {
    if (!fs.existsSync(BASELINE_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    } catch {
        return null;
    }
}

function saveSnapshot(snapshot) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(snapshot, null, 2), 'utf8');
}

const previousSnapshot = loadSnapshot();
const currentSnapshot = previousSnapshot ? JSON.parse(JSON.stringify(previousSnapshot)) : {};

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
        const record = {};
        properties.forEach(p => {
            record[p] = cs[p];
        });
        elements[key] = record;
    });

    return { found: true, capped, elementCount: visible.length, elements };
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
        await page.waitForTimeout(150);
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
 * Vergleicht den aktuellen Durchgang mit dem vorigen (falls vorhanden) und liefert die Liste
 * UNERWARTETER Abweichungen (Schluessel ausserhalb EXPECTED_DEVIATION_KEYS). Meldet DREI Arten
 * von Befund je Ansicht (CR-04, Mangel 3): eine geaenderte Eigenschaft an einem in beiden
 * Laeufen vorhandenen Schluessel; einen Schluessel, der im Vorlauf vorhanden war und jetzt nicht
 * mehr erfasst wird (Element verschwunden); und einen Schluessel, der im Vorlauf fehlte und jetzt
 * erfasst wird (Element neu erschienen). Alle drei unterliegen derselben Erwartungsliste.
 * @param {object|null} previousPass
 * @param {object} currentPass
 * @returns {string[]}
 */
function diffPass(previousPass, currentPass) {
    if (!previousPass) return [];
    const unexpected = [];
    for (const viewId of Object.keys(currentPass)) {
        const prevView = previousPass[viewId];
        const currView = currentPass[viewId];
        if (!prevView) continue; // Ansicht ist neu im Vergleich zur Vorlaufdatei

        // Art 1: geaenderte Eigenschaft an einem gemeinsamen Schluessel
        for (const key of Object.keys(currView.elements)) {
            const prevEl = prevView.elements[key];
            const currEl = currView.elements[key];
            if (!prevEl) continue; // Art 3, separat unten behandelt
            for (const prop of PROPERTIES) {
                if (prevEl[prop] !== currEl[prop]) {
                    const entry = `${viewId}/${key}/${prop}: "${prevEl[prop]}" -> "${currEl[prop]}"`;
                    if (!isExpectedDeviation(key)) unexpected.push(entry);
                }
            }
        }

        // Art 2: Schluessel im Vorlauf vorhanden, jetzt nicht mehr erfasst (Element verschwunden)
        for (const key of Object.keys(prevView.elements)) {
            if (!currView.elements[key] && !isExpectedDeviation(key)) {
                unexpected.push(`${viewId}/${key}: Element im Vorlauf vorhanden, jetzt nicht mehr erfasst`);
            }
        }

        // Art 3: Schluessel im Vorlauf NICHT vorhanden, jetzt erfasst (Element neu erschienen) —
        // die Richtung, in der die schwerste Regression dieser Phase gewirkt hat
        // (.init-mob-dmg-inputs.hidden geloescht -> Element wurde sichtbar).
        for (const key of Object.keys(currView.elements)) {
            if (!prevView.elements[key] && !isExpectedDeviation(key)) {
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
        const unexpected = diffPass(previousSnapshot ? previousSnapshot.standard : null, passResult);

        currentSnapshot.standard = passResult;

        expect(unexpected, `Unerwartete Stilabweichungen (Standard):\n${unexpected.join('\n')}`).toEqual([]);

        // Schreibsperre (CR-04, Mangel 2): schreibt NUR wenn noch kein Sollstand existiert oder
        // der Schalter gesetzt ist — UND erst NACH der Zusicherung, damit ein gefundener Befund
        // nicht im selben Lauf als neuer Sollstand festgeschrieben wird.
        if (!previousSnapshot || process.env.UPDATE_STYLE_BASELINE === '1') {
            saveSnapshot(currentSnapshot);
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
        const unexpected = diffPass(previousSnapshot ? previousSnapshot.narrow : null, passResult);

        currentSnapshot.narrow = passResult;

        expect(unexpected, `Unerwartete Stilabweichungen (schmales Layout):\n${unexpected.join('\n')}`).toEqual([]);

        if (!previousSnapshot || process.env.UPDATE_STYLE_BASELINE === '1') {
            saveSnapshot(currentSnapshot);
        }
    });

    test('Emulierte reduzierte Bewegung', async ({ page }) => {
        await seedPopulatedSession(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await loadApp(page);

        const passResult = await runPass(page);
        const unexpected = diffPass(previousSnapshot ? previousSnapshot.reducedMotion : null, passResult);

        currentSnapshot.reducedMotion = passResult;

        expect(unexpected, `Unerwartete Stilabweichungen (reduzierte Bewegung):\n${unexpected.join('\n')}`).toEqual([]);

        if (!previousSnapshot || process.env.UPDATE_STYLE_BASELINE === '1') {
            saveSnapshot(currentSnapshot);
        }
    });
});
