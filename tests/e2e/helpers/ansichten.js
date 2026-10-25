// @ts-check
/**
 * DIE ANSICHTENLISTE, ABGELEITET STATT ABGETIPPT
 * ==============================================
 *
 * WOZU DIESE DATEI DA IST. Drei Waechterfamilien des Tastatur-Strangs
 * brauchen die Liste aller Ansichten des gebauten Buendels, und sie stand
 * bis hierher in `tastatur-erreichbarkeit.spec.js` als eigene Funktion —
 * `tastatur-reichweite.spec.js` hatte daneben ein abgetipptes Literal mit
 * 24 Kennungen. Das war Befund 11 der Gegenpruefung: eine 25. Ansicht
 * laeuft in der Erreichbarkeits-Ratsche automatisch mit (nachgestellt und
 * belegt: 67 -> 69 Faelle), in den drei Familien der Reichweite aber NICHT
 * (57 Faelle, unveraendert). Genau die drei Dinge, die E-2 neu zugesichert
 * hat — die Tabulatorflut, "ein Halt je Gruppe" und die Achse —, fielen
 * fuer eine neue Ansicht still aus.
 *
 * EINE QUELLE FUER BEIDE DATEIEN schliesst das. Wer eine Ansicht einbaut,
 * bekommt sie in BEIDEN Pruefdateien mitgeprueft, ohne eine Zeile zu
 * pflegen; die Haltgrenze selbst bleibt zu Recht eine abgetippte GEMESSENE
 * Zahl, und dass sie fuer jede abgeleitete Ansicht existiert, ist dort ein
 * eigener Fall.
 *
 * SIE WIRD AUS DEM GEBAUTEN BUENDEL GELESEN, aus BEIDEN Quellen, die eine
 * Ansicht im Dokument hat:
 *   - dem Abschnitt selbst  `id="view-X" … class="view …"`
 *   - dem Navigationsreiter `data-view="X"`
 * Beide Mengen muessen deckungsgleich sein; die Pruefdateien haben dafuer
 * je einen Fall.
 *
 * WARUM AUS DEM BUENDEL UND NICHT AUS `assets/templates/*.html`: das
 * Buendel ist das, wogegen die Pruefdateien laufen. Eine Vorlage, die der
 * Bau nicht einsammelt, waere sonst eine Ansicht, die die Probe fordert und
 * die es im Lauf nicht gibt.
 *
 * WARUM SYNCHRON BEIM EINLESEN DER DATEI und nicht in einem `beforeAll`:
 * Playwright muss die Faelle beim Einsammeln kennen, lange bevor ein
 * Browser laeuft. Gemessen: der Lesevorgang ueber 3,9 MB kostet rund 30 ms,
 * einmal je Arbeiter.
 */

import { readFileSync } from 'node:fs';

/**
 * Die Ansichten aus einem HTML-Text. Getrennt von `ansichtenAusBuendel()`,
 * damit die Erkennung selbst pruefbar ist, ohne 3,9 MB zu bauen.
 * @param {string} html
 * @returns {{abschnitte: string[], reiter: string[], beschriftung: Map<string, string>}}
 */
/**
 * DER ERKENNER DER ABSCHNITTE — in zwei Schritten statt in einem Ausdruck.
 *
 * WARUM NICHT MEHR EIN AUSDRUCK (Befund 14 der Gegenpruefung). Er lautete
 * `/id="view-([a-z0-9-]+)"\s+class="view\b/` und verlangte damit, dass `id`
 * UNMITTELBAR vor `class="view"` steht. Gemessen gegen fuenf Schreibweisen
 * desselben Abschnitts fand er genau eine; `class` vor `id`, ein Attribut
 * dazwischen, ein Grossbuchstabe oder ein Unterstrich in der Kennung
 * verfehlten ihn. Und er war gleichzeitig zu GIERIG: `\bview\b` passt auch
 * auf `class="view-header"`, weil der Bindestrich eine Wortgrenze ist — ein
 * solches Element waere als Ansicht gezaehlt worden.
 *
 * SO GEHT ES JETZT: erst das ganze Starttag einsammeln (ein beliebiges
 * Element mit `id="view-X"`), dann in seinem Attributteil nachsehen, ob
 * `class` ein Wort `view` fuehrt — mit Leerzeichen oder Anfuehrungszeichen
 * als Grenze, nicht mit `\b`. Die Reihenfolge der Attribute ist damit
 * gleichgueltig, und `view-header` oder `viewport` zaehlen nicht.
 *
 * `[^>]*` ist hier richtig und nicht zu gierig: ein Attributwert in HTML
 * darf kein unmaskiertes `>` enthalten.
 */
const ABSCHNITT_TAG = /<[a-zA-Z][a-zA-Z0-9]*((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const KENNUNG = /\bid\s*=\s*"view-([A-Za-z0-9_-]+)"/;
const KLASSE_VIEW = /\bclass\s*=\s*"([^"]*)"/;

export function ansichtenAusHtml(html) {
    const abschnitte = new Set();
    for (const tag of html.matchAll(ABSCHNITT_TAG)) {
        const attribute = tag[1] || '';
        const kennung = attribute.match(KENNUNG);
        if (!kennung) continue;
        const klasse = attribute.match(KLASSE_VIEW);
        if (!klasse) continue;
        if (!klasse[1].split(/\s+/).includes('view')) continue;
        abschnitte.add(kennung[1]);
    }
    const reiter = new Set();
    const beschriftung = new Map();
    for (const m of html.matchAll(/data-view="([a-z0-9-]+)"([^>]*)>([^<]*)/g)) {
        reiter.add(m[1]);
        // Die Beschriftung des Reiters ist der Name, den der Spielleiter
        // sieht — der Fallbericht nennt damit dieselbe Ansicht wie die App.
        // Fehlt sie, bleibt die Kennung; eine 25. Ansicht laeuft so oder so.
        const text = (m[3] || '').replace(/\s+/g, ' ').trim();
        if (text && !beschriftung.has(m[1])) beschriftung.set(m[1], text);
    }
    return { abschnitte: [...abschnitte].sort(), reiter: [...reiter].sort(), beschriftung };
}

/**
 * Die Ansichten des gebauten Buendels.
 * @param {string} pfad Pfad zur gebauten HTML-Datei
 */
export function ansichtenAusBuendel(pfad) {
    return ansichtenAusHtml(readFileSync(pfad, 'utf8'));
}
