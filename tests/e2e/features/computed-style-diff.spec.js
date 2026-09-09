// @ts-check
/**
 * Computed-Style-Vergleichslauf — Phase 15, Plan 15-06 (D-24)
 *
 * Dritte Nachweissaeule neben der gruenen Suite und der menschlichen Sichtung:
 * ein Abzug berechneter Endwerte (`getComputedStyle`) ueber ALLE Ansichten, in
 * drei Durchgaengen (Standard / schmales Layoutprofil / emulierte reduzierte
 * Bewegung), verglichen gegen den vorigen Abzug unter
 * `tests/e2e/test-results/computed-style-snapshot.json`. Der dritte Durchgang
 * ist nicht optional — die Zusammenfuehrung aus Plan 15-01 hat die einzige
 * globale Bewegungsunterdrueckung von Kaskadenposition zwoelf auf drei
 * verschoben, und das ist ausschliesslich unter emulierter
 * `prefers-reduced-motion`-Einstellung messbar.
 *
 * Der Diff ist ERWARTUNGSGEFUEHRT, nicht leer: die drei Fixes dieser Phase
 * (15-04 DM-Screen-Widgets, 15-05 Zauberplatz-Pips + Wuerfelfarbe) aendern
 * berechnete Stile absichtlich. Jede Abweichung, deren Element-Schluessel
 * einen der EXPECTED_DEVIATION_KEYS-Fragmente enthaelt, ist erlaubt — jede
 * andere Abweichung laesst den Lauf fehlschlagen (D-24).
 *
 * Der ERSTE Abzug (wenn keine Vorlaufdatei existiert) erzeugt nur die
 * Baseline und vergleicht nichts — er ist der Vergleichsstand fuer den
 * Loeschlauf in Plan 15-07. Ablageort und Erhebungszeitpunkt dieses ersten
 * Abzugs werden im SUMMARY von Plan 15-06 Task 3 festgehalten.
 *
 * Drei Tests = drei Durchgaenge, serialisiert (test.describe.configure mode:
 * 'serial') — alle drei schreiben in dieselbe Snapshot-Datei, und
 * `fullyParallel: true` in playwright.config.js wuerde sie sonst nebenlaeufig
 * ausfuehren und die Datei gegenseitig ueberschreiben.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loadApp, seedCleanSession } from '../helpers/test-utils.js';

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

// Erwartungsliste absichtlicher Abweichungen (D-24) — MUSS nicht leer sein:
// die drei Fixes dieser Phase aendern berechnete Stile absichtlich, ein Gate
// mit leerem Diff waere in derselben Phase nie passierbar. Jeder Eintrag ist
// ein Teilstring, der gegen den Element-Schluessel geprueft wird.
const EXPECTED_DEVIATION_KEYS = [
    'dms-terrain-item', // 15-04: Gelaende-Widget, CSS folgt jetzt dem JS-Markup (D-09)
    'dms-skill-header', // 15-04: Fertigkeiten-Kopfzeilen, color-mix-Attributfarben (D-13)
    'dms-know-skill', // 15-04: Wissensgebiete — Fettung/Farbe des Fertigkeitsnamens
    'dms-know-types', // 15-04: Wissensgebiete — Daempfung der Kreaturentypen
    'slot-pip', // 15-05: Zauberplatz-Pips, neue Klassenfamilie (spell-slots-compact/.slot-pip)
    'dice-hero-result' // 15-05: Wuerfelergebniszahl behaelt Formatierung/Crit-/Fumble-Farbe
];

function isExpectedDeviation(elementKey) {
    return EXPECTED_DEVIATION_KEYS.some(frag => elementKey.includes(frag));
}

const SNAPSHOT_DIR = path.join(process.cwd(), 'tests/e2e/test-results');
const SNAPSHOT_PATH = path.join(SNAPSHOT_DIR, 'computed-style-snapshot.json');

/**
 * Vorlauf-Abzug, EINMAL beim Laden dieses Moduls gelesen (nicht pro Test) —
 * damit alle drei Durchgaenge gegen denselben, unveraenderten Ausgangsstand
 * dieses Prozesslaufs diffen, unabhaengig davon, in welcher Reihenfolge sie
 * selbst schon geschrieben haben.
 * @returns {object|null}
 */
function loadSnapshot() {
    if (!fs.existsSync(SNAPSHOT_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    } catch {
        return null;
    }
}

function saveSnapshot(snapshot) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf8');
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
 * class), nur ohne den Dropdown-Umweg.
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
        result[viewId] = captured;
    }
    return result;
}

/**
 * Vergleicht den aktuellen Durchgang mit dem vorigen (falls vorhanden) und
 * liefert die Liste UNERWARTETER Abweichungen (Schluessel ausserhalb
 * EXPECTED_DEVIATION_KEYS).
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
        for (const key of Object.keys(currView.elements)) {
            const prevEl = prevView.elements[key];
            const currEl = currView.elements[key];
            if (!prevEl) continue; // Element-Schluessel ist neu, kein Rueckbau-Befund
            for (const prop of PROPERTIES) {
                if (prevEl[prop] !== currEl[prop]) {
                    const entry = `${viewId}/${key}/${prop}: "${prevEl[prop]}" -> "${currEl[prop]}"`;
                    if (!isExpectedDeviation(key)) unexpected.push(entry);
                }
            }
        }
    }
    return unexpected;
}

test.describe('Computed-Style-Vergleichslauf (D-24)', () => {
    test('Standard', async ({ page }) => {
        await seedCleanSession(page);
        await loadApp(page);

        const passResult = await runPass(page);
        const unexpected = diffPass(previousSnapshot ? previousSnapshot.standard : null, passResult);

        currentSnapshot.standard = passResult;
        saveSnapshot(currentSnapshot);

        expect(unexpected, `Unerwartete Stilabweichungen (Standard):\n${unexpected.join('\n')}`).toEqual([]);
    });

    test('Schmales Layout', async ({ page }) => {
        await seedCleanSession(page);
        await loadApp(page);
        await page.setViewportSize({ width: 375, height: 812 });
        await page.evaluate(() => {
            // @ts-ignore — global aus ui/layout-profiles.js
            if (typeof window.setLayout === 'function') window.setLayout('mobile');
        });
        await page.waitForTimeout(200);

        const passResult = await runPass(page);
        const unexpected = diffPass(previousSnapshot ? previousSnapshot.narrow : null, passResult);

        currentSnapshot.narrow = passResult;
        saveSnapshot(currentSnapshot);

        expect(unexpected, `Unerwartete Stilabweichungen (schmales Layout):\n${unexpected.join('\n')}`).toEqual([]);
    });

    test('Emulierte reduzierte Bewegung', async ({ page }) => {
        await seedCleanSession(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await loadApp(page);

        const passResult = await runPass(page);
        const unexpected = diffPass(previousSnapshot ? previousSnapshot.reducedMotion : null, passResult);

        currentSnapshot.reducedMotion = passResult;
        saveSnapshot(currentSnapshot);

        expect(unexpected, `Unerwartete Stilabweichungen (reduzierte Bewegung):\n${unexpected.join('\n')}`).toEqual([]);
    });
});
