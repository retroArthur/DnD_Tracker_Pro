// @ts-check
/**
 * E2E — Die gebuendelten Web-Schriften rendern wirklich (SCHR, Einheit 2).
 *
 * DIESE DATEI HAT IHRE RICHTUNG GEWECHSELT. Bis `b0ada5b` lagen in
 * `assets/fonts/` zehn Dateien mit dem falschen Subset: Inter, Roboto und
 * Source Sans trugen Kyrillisch, Poppins trug Devanagari, keine einzige ein
 * lateinisches 'A'. Der Befund war GLEICHHEIT — `'Inter', monospace` fiel
 * zeichenweise auf monospace zurueck und misst bitgleich so breit wie
 * `monospace` allein. Seit dem Austausch sind es sieben Dateien mit dem
 * `latin`-Subset, alle sieben tragen den deutschen Satz vollstaendig
 * (gemessen mit `tools/pruefe-schriftdateien.js`: 217 bis 231 Glyphen je
 * Datei, 0 fehlende deutsche Zeichen). Damit gilt die Umkehrung:
 *
 *     `'Inter', monospace` rendert in Inter und misst ANDERS als
 *     `monospace`. UNGLEICHHEIT ist der Befund, GLEICHHEIT der Fehlschlag.
 *
 * WAS EINHEIT 1 SCHON BEWEIST, und warum das nicht genuegt.
 * `tests/unit/schriftdateien.test.js` liest die sieben woff2 auf Dateiebene
 * (woff2-Kopf -> Tabellenverzeichnis -> Brotli -> cmap -> fvar) und zeigt:
 * jede traegt das lateinische Alphabet samt Umlauten und Eszett. Das ist
 * eine Aussage ueber DATEIKOEPFE. Diese Probe hier macht die Aussage ueber
 * den BROWSER — sie misst, was gerendert wird, nicht was in der cmap steht.
 * Beide Waechter muessen reden, weil eine richtige cmap noch keine Folge
 * hat: der Browser koennte die Datei gar nicht anfordern, eine
 * `unicode-range` koennte sie ausschliessen, `font-display: swap` koennte
 * ihn noch im Rueckfall rendern lassen, oder der Pfad in `url()` koennte
 * neben dem Buendel nicht aufloesen. Keine dieser Erklaerungen trifft zu —
 * aber das ist eine Messung, keine Annahme.
 *
 * DIE POINTE, in sechs Teilen belegt:
 *   Teil 0   Waechter des Waechters. Unter anderem: der Probetext wird von
 *            JEDER der sieben Dateien getragen — sonst koennten Teil 1-3
 *            keinen Unterschied messen.
 *   Teil 1-3 Jedes gebuendelte Face, jeder gebuendelte Menueeintrag und der
 *            echte Weg durchs Schriftmenue des Editors rendern ANDERS als
 *            ihr Rueckfall.
 *   Teil 4   Und sie laden auch: sieben Antworten mit Status 200,
 *            144.608 Byte, alle sieben Faces auf `loaded` — aber erst auf
 *            Anforderung, nicht beim blanken Laden der App.
 *   Teil 5   Die Ausnahmeliste ist LEER, und ein Eintrag wuerde auffallen.
 *   Teil 6   Echte Gewichte. Roboto und Inter kommen aus JE EINER Datei mit
 *            `font-weight: 100 900`; der Browser instanziert daraus echte
 *            Gewichte. Die Gegenprobe an den statischen Familien zeigt den
 *            Unterschied: dort gibt es zwischen den deklarierten Gewichten
 *            nichts, und ein nicht deklariertes Gewicht rendert BITGLEICH
 *            wie sein deklarierter Nachbar.
 *
 * Damit halten die vier Eintraege im Schriftmenue der Editoren
 * (`EDITOR_FONTS`, core/constants.js), was sie versprechen: wer "Inter"
 * waehlt, bekommt Inter.
 *
 * WIE GEMESSEN WIRD (Breitenvergleich, plattformunabhaengig). Zwei Spannen,
 * identisch in Groesse, Gewicht, Laufweite und Umbruchverhalten:
 *
 *     A   font-family: 'Inter', monospace
 *     B   font-family: monospace
 *
 * Traegt Inter die Zeichen des Probetexts, rendert A in Inter und ist
 * breiter oder schmaler als B. Traegt es sie nicht, faellt A zeichenweise
 * auf monospace zurueck und beide sind GENAU gleich breit. `monospace` als
 * Rueckfall und nicht der echte `Arial`-Rueckfall der App: Arial ist auf
 * `ubuntu-latest` nicht installiert, `monospace` auf jedem System. In dieser
 * Sitzung haben benannte Systemschriften schon zwoelf CI-Fehlschlaege
 * verursacht (siehe den Kopf von `breite-schrift.spec.js`); eine Probe, die
 * auf Arial oder Georgia baut, misst die Schriftausstattung des Laeufers.
 * Teil 2 und Teil 3 pruefen den echten Stack zusaetzlich — mit einer
 * gemessenen Begruendung dort, warum das trotzdem traegt.
 *
 * DIE MESSFALLEN DER NEUEN RICHTUNG. Sie sind NICHT dieselben wie vorher;
 * mit der Richtung kippt auch, in welche Richtung ein Fehler faellt.
 *
 *   1. DER PROBETEXT MUSS VON JEDER DATEI GETRAGEN WERDEN — die genaue
 *      UMKEHRUNG der alten Regel. Vorher durfte er kein Zeichen enthalten,
 *      das eine Datei traegt (sonst verliess die Messung den Rueckfall und
 *      meldete falsch "die Schrift funktioniert"). Jetzt gilt: enthaelt er
 *      ein Zeichen, das eine Datei NICHT traegt, mischt sich fuer dieses
 *      Zeichen der Rueckfall in Seite A, und der gemessene Unterschied
 *      kaeme teils aus dem Rueckfall statt aus der Schrift. Teil 0 prueft
 *      das gegen das Werkzeug aus Einheit 1, statt es zu behaupten, und
 *      nennt in der Fehlermeldung die fehlenden Zeichen je Datei.
 *
 *      Der Probetext ist darum ein deutsches Pangramm MIT Umlauten und
 *      Eszett. Das ist Absicht und gemessen: es prueft genau das, was die
 *      Reparatur geliefert hat (der alte Probetext `Handgemenge42Zaehmkraft`
 *      umschrieb die Umlaute und haette ein reines ASCII-Subset nicht von
 *      einem vollstaendigen unterscheiden koennen), und es verdoppelt
 *      nebenbei den schwaechsten Abstand. Gemessen bei 40px gegen den
 *      echten Stack `Arial, sans-serif` — Roboto ist der knappste Fall:
 *          'Handgemenge42Zaehmkraft'   511.46875 gegen 509.203125  = 2.27px
 *          das Pangramm               1123.28125 gegen 1128.703125 = 5.42px
 *
 *   2. DIE FACES MUESSEN GELADEN SEIN, BEVOR GEMESSEN WIRD — und das ist
 *      jetzt GEFAEHRLICHER als vorher. fonts.css setzt `font-display: swap`.
 *      Waehrend der Tauschfrist rendert der Browser im Rueckfall. Vorher war
 *      das ein Falsch-GRUEN (A und B gleich breit = der erwartete Befund,
 *      ohne dass die Schrift je gefragt wurde); jetzt ist es ein
 *      Falsch-ROT. Darum wird jedes Face ueber `document.fonts.load()`
 *      erzwungen, auf `document.fonts.ready` gewartet, und Teil 0 prueft,
 *      dass alle sieben auf `loaded` stehen. Teil 3 messt an
 *      `messeBreiten()` vorbei und ruft `ladeFaces()` darum selbst auf
 *      (dort begruendet).
 *
 *      MIT DEM DATEIAUSTAUSCH IST DIESER ERZWUNGENE LADEWEG KAPUTT GEGANGEN,
 *      still. `document.fonts.load()` nimmt eine `font`-Kurzschreibweise;
 *      `'100 900 16px "Roboto"'` ist keine gueltige, der Aufruf wirft, und
 *      der `catch` schluckte es. Gemessen am Stand `b0ada5b`:
 *      `Roboto/100 900` und `Inter/100 900` standen auf `unloaded`, also
 *      genau die zwei Familien, um die es beim Austausch ging. Geladen wird
 *      darum ueber die EINZELGEWICHTE 100..900 (`MESSGEWICHTE`) statt ueber
 *      die rohe `font-weight`-Angabe des Faces.
 *
 *   3. CHROMIUM LAEDT WEB-SCHRIFTEN FAUL. Ohne `unicode-range` und ohne
 *      Nutzung fordert der Browser KEINE der sieben Dateien an — beim
 *      blanken Laden der App sind es nachgemessen NULL Anfragen. Die App
 *      selbst benutzt keine der vier Familien (`--font-ui` ist 'Segoe UI';
 *      die drei toten Tokens in core.css sind in dieser Runde entfernt
 *      worden). Die 144.608 Byte fliessen erst, wenn jemand im Editor eine
 *      der vier Schriften waehlt. Teil 4 belegt beide Haelften getrennt.
 *
 *   4. NEU MIT DER UMKEHRUNG: EINE MESSUNG, DIE IMMER EINEN UNTERSCHIED
 *      FINDET, IST WERTLOS. Vorher war die Gefahr "wir haben die Familie nie
 *      gefragt" (Gleichheit aus Versehen); jetzt ist sie "die beiden Spannen
 *      sind aus einem anderen Grund verschieden" — etwa weil der
 *      Rueckfall-Stapel versehentlich nicht derselbe ist. Dagegen stehen in
 *      JEDEM messenden Teil zwei Gegenproben in der GLEICHHEITS-Richtung:
 *        - `__nichtda`: eine Familie, die es garantiert nicht gibt, muss
 *          BITGLEICH wie der reine Rueckfall messen;
 *        - `__fremd`: ein Zeichen, das laut cmap KEINE der sieben Dateien
 *          traegt, muss BITGLEICH wie der reine Rueckfall messen — auch
 *          wenn der Messkoerper die Familie nennt.
 *      Die zweite ist die scharfere: sie nennt die echte Familie und zeigt
 *      trotzdem Gleichheit, beweist also, dass der Unterschied beim
 *      Probetext aus der cmap kommt und nicht aus dem Aufbau der Spannen.
 *      Das Fremdzeichen ist NICHT als Literal gewaehlt, sondern aus der
 *      cmap-Vereinigung abgeleitet (`waehleFremdCodepunkt()`), mit einer
 *      gemessenen Zusatzbedingung: HarfBuzz zerlegt ein zusammengesetztes
 *      Zeichen und rendert es aus der Schrift, wenn Basis UND Kombinierer
 *      darin stehen. U+0100 (Ā) ist der Beweis — es steht in keiner der
 *      sieben cmaps, aber Inter traegt 'A' und U+0304, und gemessen rendert
 *      `'Inter', monospace` es 1352.234375px breit gegen 1055.625px fuer
 *      reines `monospace`. Die Ableitung ueberspringt darum alles, was sich
 *      per NFD in getragene Teile zerlegt.
 *
 * KEINE EIGENEN LISTEN. Die Faces kommen aus `assets/styles/fonts.css`, die
 * Menuefamilien aus `window.EDITOR_FONTS` der laufenden App, die Codepunkte
 * aus der cmap der Dateien. Ein achtes Face oder ein fuenfter Menueeintrag
 * mit gebuendelter Schrift faellt damit auf, statt uebersehen zu werden —
 * dieselbe Regel wie in Einheit 1 ("ein Waechter, der seine eigene Liste
 * mitbringt, uebersieht die elfte Datei").
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedPopulatedSession, waitForAppReady } from '../helpers/test-utils.js';
// Das Messwerkzeug aus Einheit 1. Es liest die @font-face-Bloecke und die
// cmap der sieben Dateien und ist hier die Quelle fuer zwei Fragen: welche
// Zeichen tragen die Dateien (daraus folgt, was im Probetext stehen DARF und
// welches Zeichen als Fremdzeichen taugt), und welches Gewicht steht laut
// CSS auf welcher Datei (daraus folgt Teil 6). `tools/package.json` haelt das
// Werkzeug auf CommonJS; der ESM-Import liefert die benannten Exporte ueber
// die Interop.
import * as schriftWerkzeug from '../../../tools/pruefe-schriftdateien.js';

const REPO_ROOT = process.cwd();
const FONTS_CSS = path.join(REPO_ROOT, 'assets/styles/fonts.css');

// ----------------------------------------------------------------------
// SCHRIFT_FAMILIEN_AUSNAHMEN — Menuefamilien, die zu ihrem Rueckfall NICHTS
// beitragen und deren Zustand als bekannt gilt.
//
// BEWUSST LEER, NICHT ABWESEND. Bis `b0ada5b` standen hier alle vier
// Familien mit je einem gemessenen Grund; der Dateiaustausch hat jeden
// Grund hinfaellig gemacht. Die Liste bleibt als Form stehen, weil ein
// kuenftiger Rueckfall einer Familie einen benannten, gezaehlten Ort
// braucht und nicht still durchlaufen soll — Gegenstueck zu
// `EXEC_COMMAND_ALLOWLIST` in `editor-floating.spec.js`, die aus demselben
// Grund leer und nicht abwesend ist, und baugleich zu `SCHRIFT_AUSNAHMEN`
// in `tests/unit/schriftdateien.test.js`.
//
// EIN EINTRAG FUER EINE FUNKTIONIERENDE FAMILIE MUSS ROT WERDEN. Das ist
// die Zaehne-in-der-anderen-Richtung-Probe, und sie ist hier nicht
// theoretisch: eine Ausnahme behauptet GLEICHHEIT mit dem Rueckfall, und
// alle vier Familien sind messbar ungleich. Teil 1, Teil 2, Teil 3 und
// Teil 5 stellen den Eintrag darum von selbst rot. Ohne diese Probe waere
// die Liste nach der naechsten Reparatur wieder eine Luege und der
// Waechter wertlos.
// ----------------------------------------------------------------------
const SCHRIFT_FAMILIEN_AUSNAHMEN = {};

// Festgenagelt auf genau 0. Dieselbe Entscheidung wie bei `AUSNAHMEN_SOLL`
// in Einheit 1: nicht `<= 4`, sondern exakt. Eine Ausnahme, die wieder
// eingefuehrt wird, soll diese Zeile anfassen muessen.
const AUSNAHMEN_SOLL = 0;

// ----------------------------------------------------------------------
// Die Zahl der @font-face-Bloecke in fonts.css. EXAKT, nicht als Untergrenze
// — und das ist eine bewusste Entscheidung, nicht die Fortschreibung des
// alten `MINDEST_FACES = 10`.
//
// WARUM EXAKT. Die Zahl hat EINEN Zweck: Leerlauf erkennen. Ein kaputter
// Leser oder eine geleerte fonts.css soll nicht gruen durchlaufen, weil
// "keine Familie verletzt die Regel" trivial wahr ist. Eine Untergrenze
// faengt den Leerlauf (0 < 7) — aber nur ihn. Mit `>= 7` waere der
// eigentliche Schaden dieser Runde unsichtbar geblieben: der Leser dieser
// Datei sah 5 von 7 Faces (er erkannte nur Einzelgewichte, nicht den
// Bereich `100 900`), und 5 ist genauso `>= 0` wie 7. Die exakte Zahl
// faengt zusaetzlich das Wachsen UND das Schrumpfen, und beides ist hier
// das interessante Ereignis. Der Preis — jede Strukturaenderung an
// fonts.css macht diese Zeile absichtlich rot — ist derselbe, den
// Einheit 1 fuer `SCHRIFTDATEIEN_SOLL = 7` bezahlt hat, und er ist gewollt.
//
// SIEBEN BLOECKE, NICHT ZEHN: Roboto und Inter kommen als variable Schrift
// aus je EINER Datei mit `font-weight: 100 900` (fonts.css begruendet das),
// Poppins hat drei statische Bloecke, Source Sans Pro zwei.
// ----------------------------------------------------------------------
const FACES_SOLL = 7;

// Untergrenzen gegen Leerlauf. Gegen `>= 0`: ein leeres Parse-Ergebnis
// (EDITOR_FONTS nicht exportiert) wuerde sonst gruen durchlaufen.
const MINDEST_MENUEEINTRAEGE = 7;
// Untergrenze fuer die Zahl der Familien aus fonts.css (gemessen 4). Teil 1
// bis Teil 3 fuehren ihre Untergrenze selbst: die von Teil 0 liegt in einem
// FREMDEN describe, und ein gezielter `--grep`-Lauf traegt sie nicht mit.
//
// BLEIBT UNTERGRENZE, anders als `FACES_SOLL`. Begruendung aus der Sache:
// der Dateiaustausch hat die Zahl der FACES geaendert (10 -> 7), die Zahl
// der FAMILIEN nicht (4 -> 4). Was die Reparatur angefasst hat, wird exakt
// festgenagelt; was sie nicht angefasst hat, bleibt wie es war — eine
// fuenfte gebuendelte Familie ist eine Produktentscheidung, ein achtes Face
// an vier Familien ein Strukturbefund.
const MINDEST_CSS_FAMILIEN = 4;

// Untergrenze fuer die Vereinigung ALLER Codepunkte, die die sieben Dateien
// tragen — gemessen 236. Sie sichert die Ableitung des Fremdzeichens gegen
// Leerlauf: aus einer leeren Vereinigung waere JEDER Codepunkt "fremd", und
// die Gegenprobe in der Gleichheits-Richtung wuerde nichts mehr pruefen.
// Untergrenze und nicht exakt: die exakten Glyphenzahlen je Datei nagelt
// Einheit 1 fest (217 bis 231), das ist dort der schaerfere Ort.
const MINDEST_GETRAGENE_CODEPUNKTE = 200;

// Genau so viele Menueeintraege nennen zuerst eine Familie, die fonts.css
// einbindet. Festgenagelt, damit ein fuenfter gebuendelter Eintrag auffaellt.
const GEBUENDELTE_MENUEEINTRAEGE_SOLL = 4;

// Summe der sieben Dateigroessen, mit `ls -l` und ueber die Netzwerkantworten
// gegengemessen. Nicht "gut 140 KB" — die genaue Zahl.
// 48256 + 43136 + 7884 + 7748 + 8000 + 14812 + 14772.
const BYTE_SUMME_SOLL = 144608;

// ----------------------------------------------------------------------
// Der Probetext: ein deutsches Pangramm. Es enthaelt ä, ö, ü und ß — also
// genau die Zeichen, deren Fehlen den alten Bestand ausmachte. Teil 0
// prueft gegen das Werkzeug aus Einheit 1, dass JEDE der sieben Dateien
// JEDES dieser Zeichen traegt, statt es zu behaupten.
// ----------------------------------------------------------------------
const PROBETEXT = 'Victor jagt zwölf Boxkämpfer quer über den großen Sylter Deich';

// Messgroesse. 40px statt 16px: der Breitenunterschied zwischen zwei
// Schriften waechst linear mit der Groesse, die Rundung auf Geraetepixel
// nicht — bei 40px ist das Verhaeltnis von Signal zu Rundung rund 2.5-fach
// besser.
const MESSGROESSE = '40px';

// Ab welchem Abstand in Pixel zwei Spannen als "unterscheidbar" gelten.
// 1px bei 40px Messgroesse — dieselbe Schwelle wie die mono/serif-Kontrolle
// in Teil 0. Der knappste gemessene echte Abstand ist Roboto gegen
// `Arial, sans-serif` mit 5.42px (Teil 2 und Teil 3), also Faktor 5.4
// davor; gegen `monospace` sind es 240.23px.
const MINDESTABSTAND = 1;

// Die Messgroesse, auf die sich `MINDESTABSTAND` bezieht, als Zahl.
const MESSGROESSE_PX = Number.parseFloat(MESSGROESSE);

/**
 * Die Schwelle, umgerechnet auf eine andere Schriftgroesse.
 *
 * Der Breitenunterschied zweier Schriften skaliert LINEAR mit der
 * Schriftgroesse, die Schwelle muss das also mitgehen. Teil 1, 2 und 6
 * messen bei `MESSGROESSE` und nehmen `MINDESTABSTAND` unveraendert; Teil 3
 * misst am LEBENDEN Element des Editors, und das rendert gemessen bei 14px.
 * Dort ist 1px keine gleich strenge, sondern eine 2.9-fach STRENGERE
 * Schwelle — der knappste Fall (Roboto, gemessen 1.890625px Abstand bei
 * 14px) laege nur Faktor 1.9 davor statt der 5.4, die bei 40px gelten
 * (5.421875px gegen 1px). Umgerechnet sind es 0.35px, und der Faktor ist
 * wieder 5.4 — dieselbe Strenge, nicht eine andere.
 * @param {number} groessePx
 * @returns {number}
 */
function schwelleFuer(groessePx) {
    return (MINDESTABSTAND * groessePx) / MESSGROESSE_PX;
}

// Eine Familie, die es garantiert nicht gibt. Sie ist die erste Gegenprobe
// in der Gleichheits-Richtung: ein Messkoerper, der sie nennt, muss
// bitgleich wie der reine Rueckfall messen.
const FAMILIE_OHNE_DATEI = 'Gibtesnichtxyzqjk';

// Wie oft das Fremdzeichen wiederholt wird. 48-mal, damit ein etwaiger
// Abstand gross genug waere, um gesehen zu werden — die Zusicherung ist
// Bitgleichheit, aber eine Fehlermeldung ueber 48 Zeichen ist
// aussagekraeftig (uebernommen von der alten Kontrolle, dort gemessen
// begruendet).
const FREMD_WIEDERHOLUNGEN = 48;

// Die Einzelgewichte, mit denen geladen und in Teil 6 gemessen wird.
// NICHT die rohe `font-weight`-Angabe des Faces: `document.fonts.load()`
// nimmt eine `font`-Kurzschreibweise, und `'100 900 16px "Roboto"'` ist
// keine gueltige (Messfalle 2 im Kopf).
const MESSGEWICHTE = [100, 200, 300, 400, 500, 600, 700, 800, 900];

// Das Gewicht, mit dem ein variables Face in Teil 1 gemessen wird. 400 ist
// die CSS-Vorgabe und liegt in jedem hier vorkommenden Bereich.
const REGELGEWICHT = 400;

// ----------------------------------------------------------------------
// DER MESSKOERPER — eine Quelle, nicht fuenf.
//
// `mitStack()` ist die EINZIGE Stelle, an der eine gebuendelte Familie in
// einen Messkoerper geschrieben wird. Vorher stand derselbe Ausdruck
// viermal im Text, und das war die Luecke: kuerzte man ihn auf den reinen
// Rueckfall, nannte die Probe die Familie an keiner Stelle mehr und
// verglich `monospace` gegen `monospace`.
//
// MIT DER UMKEHRUNG FAELLT GENAU DIESE VERFAELSCHUNG JETZT VON SELBST AUF:
// `monospace` gegen `monospace` ist gleich breit, und Gleichheit ist der
// Fehlschlag. Die Zusicherung "der Messkoerper nennt die Familie" bleibt
// trotzdem stehen — sie benennt den Grund in der Fehlermeldung, statt ihn
// in einer nackten Breitengleichheit raten zu lassen.
// ----------------------------------------------------------------------
const RUECKFALL = 'monospace';

/** Der Messkoerper, der die Familie nennt. Einzige Quelle. */
function mitStack(familie) {
    return `'${familie}', ${RUECKFALL}`;
}

const WERKZEUG_ERGEBNIS = schriftWerkzeug.pruefeAlle();

// Codepunkte je Datei und ihre Vereinigung. Grundlage fuer zwei Dinge: den
// umgekehrten Probetext-Waechter (Teil 0) und die Ableitung des
// Fremdzeichens.
const CODEPUNKTE_JE_DATEI = new Map(
    WERKZEUG_ERGEBNIS.dateien.map(d => [d.name, new Set(d.codepunkte || [])])
);
const GETRAGENE_CODEPUNKTE = new Set();
for (const menge of CODEPUNKTE_JE_DATEI.values()) {
    for (const c of menge) GETRAGENE_CODEPUNKTE.add(c);
}

/**
 * Die Zeichen des Texts, die diese Datei laut cmap NICHT traegt.
 * @param {string} dateiname
 * @param {string} text
 * @returns {string[]}
 */
function fehlendeZeichen(dateiname, text) {
    const menge = CODEPUNKTE_JE_DATEI.get(dateiname);
    if (!menge) return [...new Set([...text])];
    return [...new Set([...text])].filter(z => !menge.has(z.codePointAt(0)));
}

/**
 * Zerlegt sich der Codepunkt per NFD in Teile, die ALLE getragen werden?
 *
 * Dann taugt er NICHT als Fremdzeichen. HarfBuzz normalisiert beim Shapen:
 * fehlt das zusammengesetzte Zeichen in der Schrift, stehen aber Basis und
 * Kombinierer darin, rendert es doch aus der Schrift. Gemessen an U+0100
 * (Ā = 'A' + U+0304): nicht in der cmap, und `'Inter', monospace` rendert
 * es 1352.234375px breit gegen 1055.625px fuer reines `monospace`. Ohne
 * diesen Filter waere die Gegenprobe in der Gleichheits-Richtung also
 * falsch-rot — an genau dem Zeichen, das die Ableitung als erstes findet.
 * @param {number} c
 * @returns {boolean}
 */
function istZerlegbar(c) {
    const zeichen = String.fromCodePoint(c);
    const nfd = zeichen.normalize('NFD');
    if (nfd === zeichen) return false;
    return [...nfd].every(t => GETRAGENE_CODEPUNKTE.has(t.codePointAt(0)));
}

/**
 * Der kleinste druckbare Codepunkt, den KEINE der sieben Dateien traegt und
 * der sich auch nicht in getragene Teile zerlegt. Aus der cmap abgeleitet,
 * nicht als Literal gewaehlt: nach einem weiteren Austausch der Dateien
 * waehlt die Gegenprobe von selbst ein anderes Zeichen.
 * @returns {number|null}
 */
function waehleFremdCodepunkt() {
    for (let c = 0x21; c < 0x3000; c++) {
        // Steuerzeichen (C0/C1) und kombinierende Zeichen haben keinen
        // eigenen Vorschub und messen nichts.
        if (c === 0x7f || (c >= 0x80 && c <= 0x9f)) continue;
        if (c >= 0x0300 && c <= 0x036f) continue;
        if (GETRAGENE_CODEPUNKTE.has(c)) continue;
        if (istZerlegbar(c)) continue;
        return c;
    }
    return null;
}

const FREMD_CODEPUNKT = waehleFremdCodepunkt();
const FREMD_TEXT =
    FREMD_CODEPUNKT === null
        ? ''
        : String.fromCodePoint(FREMD_CODEPUNKT).repeat(FREMD_WIEDERHOLUNGEN);
const FREMD_NAME =
    FREMD_CODEPUNKT === null ? '(keines)' : schriftWerkzeug.zeigeCodepunkt(FREMD_CODEPUNKT);

const GENERISCHE_FAMILIEN = [
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-serif',
    'ui-sans-serif',
    'ui-monospace',
    'ui-rounded',
    'math',
    'emoji',
    'fangsong'
];

// ----------------------------------------------------------------------
// fonts.css lesen — Familie, Gewichtsangabe und Datei je @font-face.
//
// GELESEN WIRD MIT DEM WERKZEUG AUS EINHEIT 1, nicht mit einem eigenen
// Regex. Der eigene Regex war bis `de0a237` genau eine Zeile lang und
// genau eine Zeile falsch:
//
//     const gewicht = (block.match(/font-weight\s*:\s*(\d+)\s*;/) || [])[1];
//
// `font-weight: 100 900;` trifft er nicht — nach `100` folgt kein `;`.
// `gewicht` wurde `undefined`, der Filter `if (familie && gewicht &&
// datei)` warf den Block weg, und diese Datei sah 5 der 7 @font-face-
// Bloecke. Es fehlten AUSGERECHNET Roboto und Inter, also genau die zwei
// Familien, um die es beim Dateiaustausch ging — und das alte
// `MINDEST_FACES = 10` verdeckte es, weil es ohnehin rot war.
//
// `leseSchriftFaces()` loest die Gewichtsangabe ueber
// `leseGewichtsbereich()` in `[von, bis]` auf, kennt also Einzelgewicht,
// Bereich und die Schluesselwoerter `normal`/`bold`, und meldet mit
// `istBereich`, welcher Fall vorliegt. Das ist die Grundlage von Teil 6:
// ohne diese Unterscheidung ist eine variable Familie von einer statischen
// nicht zu trennen.
//
// KEINE EIGENE LISTE wird dadurch eingefuehrt: das Werkzeug liest dieselbe
// fonts.css und nimmt die Dateinamen aus deren `url()`-Angaben.
// ----------------------------------------------------------------------
function leseFaces() {
    return schriftWerkzeug.leseSchriftFaces(FONTS_CSS).map(f => ({
        familie: f.familie ? f.familie.trim() : null,
        gewichtRoh: f.gewichtRoh,
        gewichtVon: f.gewichtVon,
        gewichtBis: f.gewichtBis,
        istBereich: f.istBereich,
        // Ein @font-face kann mehrere `url()` fuehren. Hier ist es je eine;
        // `dateinamen` bleibt trotzdem die Quelle fuer DATEINAMEN, damit ein
        // zweites `url()` nicht still verloren geht.
        dateinamen: f.dateinamen,
        datei: f.dateinamen[0]
    }));
}

const FACES = leseFaces();
const CSS_FAMILIEN = [...new Set(FACES.map(f => f.familie))].sort();
// Alle Dateinamen, die fonts.css einbindet. Ueber `dateinamen` und nicht
// ueber `datei`: ein @font-face mit zwei `url()` wuerde sonst die zweite
// Datei verlieren, und Teil 4 verglich eine zu kurze Namensliste.
const DATEINAMEN = [...new Set(FACES.flatMap(f => f.dateinamen))].sort();

/**
 * Je Familie: variabel oder statisch, und welche Einzelgewichte fonts.css
 * dafuer deklariert. Grundlage von Teil 6 — vollstaendig aus fonts.css
 * abgeleitet, kein Literal je Familie.
 */
const FAMILIEN_INFO = CSS_FAMILIEN.map(familie => {
    const faces = FACES.filter(f => f.familie === familie);
    return {
        familie,
        faces,
        variabel: faces.some(f => f.istBereich),
        // Nur die statischen Bloecke tragen ein Einzelgewicht bei; ein
        // Bereichs-Block deklariert keinen einzelnen Punkt.
        einzelGewichte: [...new Set(faces.filter(f => !f.istBereich).map(f => f.gewichtVon))].sort(
            (a, b) => a - b
        ),
        von: Math.min(...faces.map(f => f.gewichtVon)),
        bis: Math.max(...faces.map(f => f.gewichtBis))
    };
});
const VARIABLE_FAMILIEN = FAMILIEN_INFO.filter(i => i.variabel);
const STATISCHE_FAMILIEN = FAMILIEN_INFO.filter(i => !i.variabel);

// ----------------------------------------------------------------------
// DIE BAUART, AUS DER DATEI GELESEN — und warum es diese zweite Quelle
// geben MUSS.
//
// `FAMILIEN_INFO.variabel` oben kommt aus fonts.css (`istBereich`). Teil 6
// unten leitet daraus ab, WELCHES Verhalten es erwartet: variabel -> neun
// verschiedene Breiten, statisch -> genau so viele wie deklarierte
// Einzelgewichte. SOLL und Messgegenstand haengen damit an DERSELBEN
// Datei — und genau dort war eine Luecke, nachgestellt und nicht vermutet
// (Gegenpruefung, Befund 1):
//
//     # assets/styles/fonts.css Zeile 66 (Roboto):
//     #   font-weight: 100 900;   ->   font-weight: 400;
//     $ PYTHONIOENCODING=utf-8 python build.py            -> exit 0
//     $ npx playwright test ...schriftdateien.spec.js
//       VORHER  16 passed (4.1s)
//       NACHHER 16 passed (4.1s)      <-- UNVERAENDERT GRUEN
//     $ npx jest tests/unit/schriftdateien.test.js   -> 1 failed / 72 / 73
//     $ node tools/pruefe-schriftdateien.js --check   -> exit 0
//
// Der Mechanismus: Roboto wandert durch die Mutation nach
// `STATISCHE_FAMILIEN`, und der statische Zweig verlangt dann 'genau 1
// verschiedene Breite bei 1 deklarierten Gewicht' — was exakt zutrifft.
// Chromium schaltet die `wght`-Achse naemlich ab, sobald der Face kein
// Bereich mehr ist: eigenstaendig am gebauten Buendel gemessen rendern alle
// neun Gewichte dann bitgleich 1123.28125px (gesund: 1085.75 … 1155.53125,
// neun verschiedene Werte). Der DM bekaeme im Editor fuer 400 und 700
// dieselbe Strichstaerke, und diese Datei haette geschwiegen.
//
// DIE ZWEITE QUELLE IST DIE DATEI SELBST: die fvar-Tabelle im woff2. Sie
// kennt kein fonts.css, und eine CSS-Mutation bewegt sie nicht. Das
// Werkzeug aus Einheit 1 liest sie schon (`d.achsen`), es wird hier also
// keine neue Leseart eingefuehrt, nur eine vorhandene als SOLL benutzt.
//
// WARUM DAS PAAR IN BEIDE RICHTUNGEN GILT. Die Richtung 'Bereich erklaert
// -> Achse muss da sein und ihn decken' pruefen Einheit 1 (Teil 8) und
// `--check` (`achsenVerstoesse`) schon. Die GEGENRICHTUNG — 'Achse da ->
// der Face muss den Bereich auch erklaeren' — pruefte niemand, und sie ist
// kein Schoenheitsfehler: eine variable Datei unter einem Einzelgewicht ist
// 43.136 Byte fuer ein einziges Gewicht, acht weggeworfene Schnitte und
// derselbe sichtbare Schaden wie synthetische Fettschrift.
//
// ARBEITSTEILUNG, hier und in Einheit 1 ausdruecklich festgehalten, weil
// sie sonst Zufall bleibt:
//   ZUSAMMENZIEHEN (`100 900` -> `400`)  faengt Einheit 1 Teil 8 ('genau 2
//        Bereiche auf Inter+Roboto') UND ab jetzt diese Zusicherung.
//   VERSCHMAELERN  (`100 900` -> `300 500`) ist in Einheit 1 und im
//        Werkzeug unsichtbar (der Bereich bleibt ein Bereich, die Achse
//        deckt ihn) und nur hier zu sehen — die Gewichte ausserhalb
//        300..500 klemmen auf die Bereichsgrenzen und die neun Breiten
//        werden zu fuenf. Gemessen: jest 73/73 gruen, `--check` exit 0,
//        playwright 1 failed / 15 passed.
//   Einheit 1 nagelt zusaetzlich den BEREICHSWERT auf die volle Achse fest
//        (`Ein erklaerter Gewichtsbereich schoepft die wght-Achse voll
//        aus`), damit auch dort nicht nur die ANZAHL der Bereiche zaehlt.
// ----------------------------------------------------------------------
const WGHT_ACHSE_JE_DATEI = new Map(
    WERKZEUG_ERGEBNIS.dateien.map(d => [
        d.name,
        (d.achsen || []).find(a => a.tag === 'wght') || null
    ])
);

/**
 * Traegt diese Datei eine fvar-`wght`-Achse mit echter Spanne?
 * `min === max` zaehlt NICHT als variabel — eine Achse ohne Spanne gibt
 * genauso wenig Zwischengewichte her wie keine Achse.
 * @param {string} dateiname
 * @returns {boolean}
 */
function hatWghtAchse(dateiname) {
    const a = WGHT_ACHSE_JE_DATEI.get(dateiname);
    return Boolean(a) && a.max > a.min;
}

/** Die Dateien einer Familie, aus fonts.css. */
function dateienDerFamilie(familie) {
    return FACES.filter(f => f.familie === familie).map(f => f.datei);
}

/** Erstes benanntes Glied eines font-family-Stacks, ohne Anfuehrungszeichen. */
function ersteFamilie(stack) {
    return (stack.split(',')[0] || '').trim().replace(/^['"]|['"]$/g, '');
}

/** Derselbe Stack ohne sein erstes Glied — der Rueckfall, den die App nutzt. */
function rueckfallStack(stack) {
    return stack.split(',').slice(1).join(',').trim();
}

/** Das Gewicht, mit dem ein Face in Teil 1 gemessen wird. */
function messGewicht(face) {
    return face.istBereich ? REGELGEWICHT : face.gewichtVon;
}

// ----------------------------------------------------------------------
// Die Faces erzwungen laden. EINE Quelle, von `messeBreiten()` und von
// Teil 3 benutzt.
//
// WARUM NICHT IN `ladeApp()`: Teil 4 behauptet, dass beim BLANKEN Laden der
// App keine einzige woff2 angefordert wird. Ein Ladezwang in `ladeApp()`
// wuerde genau diese Zusicherung von innen aushebeln — sie waere dann
// strukturell unerfuellbar, und zwar ohne sichtbaren Grund. Der Zwang steht
// darum da, wo gemessen wird, nicht da, wo geladen wird.
// ----------------------------------------------------------------------
async function ladeFaces(page, ladeText = PROBETEXT) {
    return page.evaluate(
        async ({ ladeText, gewichte }) => {
            const familien = new Set();
            document.fonts.forEach(ff => familien.add(ff.family));
            for (const familie of familien) {
                for (const gewicht of gewichte) {
                    try {
                        await document.fonts.load(`${gewicht} 16px "${familie}"`, ladeText);
                    } catch (e) {
                        /* Status wird unten mitgemeldet; hier nicht werfen. */
                    }
                }
            }
            await document.fonts.ready;
            const faceStatus = {};
            document.fonts.forEach(ff => {
                faceStatus[`${ff.family}/${ff.weight}`] = ff.status;
            });
            return faceStatus;
        },
        { ladeText, gewichte: MESSGEWICHTE }
    );
}

// ----------------------------------------------------------------------
// Die Messung im Browser. Sie gibt den Face-Status mit zurueck, damit Teil 0
// beweisen kann, dass zum Messzeitpunkt wirklich geladen war (Messfalle 2).
//
// `eintrag.text` ueberschreibt den gemeinsamen Probetext fuer EINEN Eintrag.
// Das brauchen die Gegenproben: sie messen mit dem Fremdzeichen, waehrend
// alle anderen Eintraege beim Probetext bleiben. Erzwungen geladen wird
// ueber die Vereinigung aller vorkommenden Texte.
// ----------------------------------------------------------------------
async function messeBreiten(page, stapel, text = PROBETEXT, groesse = MESSGROESSE) {
    const ladeText = [
        ...new Set([...text, ...Object.values(stapel).flatMap(e => [...(e.text || '')])])
    ].join('');
    const faceStatus = await ladeFaces(page, ladeText);
    const breiten = await page.evaluate(
        ({ stapel, text, groesse }) => {
            const host = document.createElement('div');
            host.id = 'schr-messplatz';
            host.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;';
            document.body.appendChild(host);
            const breiten = {};
            for (const [name, eintrag] of Object.entries(stapel)) {
                const span = document.createElement('span');
                span.style.cssText =
                    `font-family:${eintrag.stack};` +
                    `font-size:${groesse};` +
                    `font-weight:${eintrag.gewicht || 400};` +
                    'font-style:normal;letter-spacing:0;word-spacing:0;' +
                    'white-space:pre;display:inline-block;';
                span.textContent = eintrag.text || text;
                host.appendChild(span);
                breiten[name] = span.getBoundingClientRect().width;
            }
            host.remove();
            return breiten;
        },
        { stapel, text, groesse }
    );
    return { breiten, faceStatus };
}

/** Gefuellte Kampagne, gebautes Bundle, App fertig initialisiert. */
// Chromium hat die generischen Familien beim Start eines Arbeiters noch nicht
// aufgeloest: unter schwerer Maschinenlast messen `monospace` und `serif`
// kurzzeitig EXAKT gleich breit (Differenz 0,0 px). `document.fonts.ready` deckt
// das NICHT ab — es kennt nur @font-face-Ladungen, nicht die Zuordnung
// generischer Familien.
//
// Gemeldet aus der Gegenpruefung, Runde 3: 5 von 18 Eigenlaeufen rot, und zwar
// auf den Meta-Kontrollen selbst (`Math.abs(mono - serif) > 1` -> `Received: 0`
// in Teil 0, und die Empfindlichkeitskontrolle in Teil 3). Die roten Laeufe
// dauerten 35,4 s und 59,3 s statt 4 s — die Maschine lief unter der Last
// anderer Suiten. In 98 Fall-Laeufen nicht nachstellbar (3 gleichzeitige
// Instanzen, dann 4 Instanzen mit je 4 Arbeitern, alles gruen); gehaertet wird
// auf den Mechanismus und die genaue Fehlerausgabe hin, nicht auf eine eigene
// Reproduktion. Kostet im gesunden Fall einen Frame.
//
// Ein Falsch-Rot ist hier besonders teuer: es trifft genau die Zeilen, die
// beweisen sollen, dass die Messung ueberhaupt etwas misst. MIT DER UMKEHRUNG
// IST DIESE HAERTUNG WICHTIGER GEWORDEN, NICHT UNWICHTIGER: solange der Befund
// GLEICHHEIT war, half ein noch nicht aufgeloestes Generikum dem Ergebnis
// (beide Seiten gleich = der erwartete Befund). Jetzt ist der Befund
// UNGLEICHHEIT, und ein noch nicht aufgeloester Rueckfall-Stapel zieht beide
// Seiten auf denselben Wert — also direkt auf den Fehlschlag.
const GENERIKA_FRIST = 15000;

/**
 * Wartet, bis Chromium `monospace` und `serif` unterscheidbar aufgeloest hat.
 * Gegenprobe gegen Leerlauf: bleibt es dabei, WIRFT die Funktion — die Datei
 * misst dann nicht blind weiter, sondern sagt, warum sie nicht messen kann.
 */
async function warteAufGenerika(page) {
    const gemessen = await page
        .waitForFunction(
            ({ groesse, text }) => {
                const mess = fam => {
                    const span = document.createElement('span');
                    span.style.cssText =
                        `font-family:${fam};font-size:${groesse};` +
                        'white-space:pre;display:inline-block;' +
                        'position:absolute;left:-99999px;top:0;visibility:hidden;';
                    span.textContent = text;
                    document.body.appendChild(span);
                    const breite = span.getBoundingClientRect().width;
                    span.remove();
                    return breite;
                };
                const mono = mess('monospace');
                const serif = mess('serif');
                return Math.abs(mono - serif) > 1 ? { mono, serif } : false;
            },
            { groesse: MESSGROESSE, text: PROBETEXT },
            { timeout: GENERIKA_FRIST }
        )
        .then(griff => griff.jsonValue())
        .catch(() => null);

    if (!gemessen) {
        throw new Error(
            `Chromium hat 'monospace' und 'serif' nach ${GENERIKA_FRIST} ms nicht ` +
                'unterscheidbar aufgeloest (Differenz <= 1 px). Jede Breitenmessung ' +
                'dieser Datei waere an dieser Stelle blind — der Lauf wird abgebrochen, ' +
                'statt ein Falsch-Rot auf den Meta-Kontrollen zu melden.'
        );
    }
    return gemessen;
}

async function ladeApp(page) {
    await seedPopulatedSession(page);
    await page.goto(`file:///${REPO_ROOT.replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`);
    await waitForAppReady(page);
    // Erst messen, wenn die generischen Familien stehen. Gilt fuer JEDEN Fall
    // dieser Datei — auch fuer Teil 3, das an messeBreiten() vorbei misst.
    await warteAufGenerika(page);
}

// Wohin build.py die url()-Pfade umschreibt: './assets/fonts/' relativ zur
// erzeugten HTML-Datei (build.py, CR-08).
const DIST_SCHRIFTEN = path.join(REPO_ROOT, 'dist/assets/fonts');

test.describe('SCHR — die gebuendelten Web-Schriften rendern wirklich', () => {
    // ------------------------------------------------------------------
    // Teil 0 — Waechter des Waechters.
    // Ohne diese Faelle koennte alles Folgende leer durchlaufen.
    // ------------------------------------------------------------------
    test.describe('Teil 0 — Waechter des Waechters', () => {
        test(`fonts.css fuehrt genau ${FACES_SOLL} Faces`, async () => {
            expect(
                FACES.length,
                `fonts.css liefert ${FACES.length} @font-face-Bloecke, erwartet ` +
                    `${FACES_SOLL}. Gelesen: ` +
                    `${JSON.stringify(FACES.map(f => `${f.familie}/${f.gewichtRoh}`))}. ` +
                    `Zwei Bloecke tragen einen BEREICH (font-weight: 100 900) — ein ` +
                    `Leser, der nur Einzelgewichte erkennt, verliert genau diese zwei ` +
                    `still, und das sind die beiden variablen Familien.`
            ).toBe(FACES_SOLL);
            expect(CSS_FAMILIEN.length).toBeGreaterThanOrEqual(MINDEST_CSS_FAMILIEN);
            for (const f of FACES) {
                expect(f.familie).toBeTruthy();
                expect(f.gewichtVon, `${f.familie}: Gewicht von`).toBeGreaterThan(0);
                expect(f.gewichtBis, `${f.familie}: Gewicht bis`).toBeGreaterThanOrEqual(
                    f.gewichtVon
                );
                expect(
                    f.dateinamen.length,
                    `${f.familie}/${f.gewichtRoh}: kein url() im Block`
                ).toBeGreaterThan(0);
                for (const n of f.dateinamen) expect(n).toMatch(/\.woff2$/);
            }
            // Beide Bauarten muessen vorkommen, sonst laeuft Teil 6 leer:
            // ohne variable Familie fehlt der Nachweis echter Instanzen,
            // ohne statische die Gegenprobe dazu.
            expect(
                VARIABLE_FAMILIEN.map(i => i.familie),
                'keine variable Familie in fonts.css gelesen — Teil 6 kann echte ' +
                    'Gewichtsinstanzen dann nicht von nachgetaeuschten unterscheiden'
            ).not.toEqual([]);
            expect(
                STATISCHE_FAMILIEN.map(i => i.familie),
                'keine statische Familie in fonts.css gelesen — dann fehlt Teil 6 die ' +
                    'Gegenprobe zu den variablen'
            ).not.toEqual([]);
        });

        test(`Die ${FACES_SOLL} Dateien liegen neben dem gebauten Bundle`, async () => {
            // EIGENE UNTERGRENZE, nicht die des Nachbarfalls (Gegenpruefung
            // Runde 2, B-02). `fehlend` ist bei leerer Facesliste trivial
            // leer: mit `const FACES = []` lief dieser Fall gruen ueber NULL
            // Dateien durch (nachgestellt, MUT23: `--grep` auf diesen
            // Fallnamen -> 1 passed in 575ms, waehrend die volle Datei
            // 8 failed / 6 passed meldete). Teil 1 und Teil 3 fuehren ihre
            // Untergrenze aus genau diesem Grund selbst; dieser Fall kam in
            // 4d6574a dazu und folgte der eigenen Regel noch nicht.
            expect(FACES.length, 'fonts.css liefert keine Faces').toBe(FACES_SOLL);
            // VORAUSSETZUNG, nicht Formalie. Teil 0 (Faces auf "loaded") und
            // Teil 4 (sieben Antworten) koennen nur gruen sein, wenn die
            // Dateien da liegen, wohin build.py die url()-Pfade umschreibt.
            // Ohne diesen Fall meldet die Suite stattdessen 'Roboto/100 900
            // steht auf "error", nicht "loaded"' und 'Expected 7, Received 0'
            // — zwei Meldungen, die auf die Schriftdateien zeigen statt auf
            // den fehlenden Kopierschritt. Genau so war es im CI-Job 'e2e'
            // (gemessen im nachgestellten Zustand: 2 failed / 11 passed,
            // Retries erschoepft), waehrend der Projektbaum durch einen
            // alten, nicht versionierten Rueckstand in dist/ gruen lief.
            const vorhanden = fs.existsSync(DIST_SCHRIFTEN)
                ? fs.readdirSync(DIST_SCHRIFTEN).filter(n => n.endsWith('.woff2'))
                : [];
            const fehlend = DATEINAMEN.filter(n => !vorhanden.includes(n));
            expect(
                fehlend,
                `Diese Dateien fehlen in dist/assets/fonts/: ${JSON.stringify(fehlend)}. ` +
                    `build.py schreibt die url()-Pfade auf './assets/fonts/' um und legt ` +
                    `die Dateien dorthin — fehlen sie, wurde das Bundle mit einem ` +
                    `build.py OHNE Kopierschritt erzeugt, oder dist/ wurde geleert. ` +
                    `Abhilfe: python build.py erneut laufen lassen.`
            ).toEqual([]);
        });

        test('Das Schriftmenue der laufenden App ist vollstaendig und hat ueberall Rueckfall', async ({
            page
        }) => {
            await ladeApp(page);
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            expect(menue).toBeTruthy();
            expect(Object.keys(menue).length).toBeGreaterThanOrEqual(MINDEST_MENUEEINTRAEGE);

            // Die einzige Aussage, die sich fuer die drei Systemfamilien
            // (arial/serif/mono) plattformunabhaengig treffen laesst: kein
            // Eintrag kann ohne Rueckfall enden. Ob Georgia oder Courier New
            // installiert ist, ist eine Eigenschaft des Rechners, nicht
            // dieses Baums — darum macht Teil 1 ueber sie keine Aussage.
            for (const [schluessel, stack] of Object.entries(menue)) {
                const glieder = stack.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                expect(glieder.length, `${schluessel} hat keinen Rueckfall`).toBeGreaterThan(1);
                expect(
                    GENERISCHE_FAMILIEN,
                    `${schluessel} endet auf "${glieder[glieder.length - 1]}"`
                ).toContain(glieder[glieder.length - 1]);
            }

            const gebuendelt = Object.entries(menue)
                .filter(([, stack]) => CSS_FAMILIEN.includes(ersteFamilie(stack)))
                .map(([k]) => k)
                .sort();
            expect(gebuendelt).toHaveLength(GEBUENDELTE_MENUEEINTRAEGE_SOLL);
        });

        test('Jede gebuendelte Datei traegt JEDES Zeichen des Probetexts', async () => {
            // DIE UMKEHRUNG. Bis zum Dateiaustausch stand hier die
            // Gegenrichtung: "der Probetext enthaelt kein Zeichen, das eine
            // der zehn Dateien traegt". Die war die Voraussetzung dafuer,
            // dass Teil 1 bis Teil 3 GLEICHHEIT messen konnten — jedes
            // getragene Zeichen haette die Messung aus dem Rueckfall geholt
            // und falsch "die Schrift funktioniert" gemeldet.
            //
            // Jetzt tragen alle sieben Dateien den lateinischen Satz, und die
            // alte Zusicherung ist UNERFUELLBAR: es gibt keinen deutschen
            // Probetext mehr, der mit keiner cmap kollidiert. Sie wird darum
            // gekehrt und nicht durch einen exotischen Text gerettet — ein
            // Probetext, den die Schriften nicht tragen, koennte in der neuen
            // Richtung gar keinen Unterschied zeigen.
            //
            // Enthaelt der Probetext ein Zeichen, das eine Datei NICHT
            // traegt, mischt sich fuer dieses Zeichen der Rueckfall in
            // Seite A: der gemessene Unterschied kaeme dann teils aus dem
            // Rueckfall statt aus der Schrift.
            const ergebnis = schriftWerkzeug.pruefeAlle();
            expect(ergebnis.dateien.length, 'das Werkzeug liest keine Dateien').toBe(FACES_SOLL);

            // Gegenprobe gegen Leerlauf: eine kaputte Messung wuerde eine
            // leere Codepunktmenge liefern, und dann waere JEDES Zeichen
            // "fehlend" — das faellt unten auf. Umgekehrt wuerde eine
            // Messung, die ALLE Codepunkte behauptet, hier nicht auffallen;
            // dagegen steht die Ableitung des Fremdzeichens (eigener Fall).
            for (const datei of ergebnis.dateien) {
                expect(
                    Array.isArray(datei.codepunkte),
                    `${datei.name}: das Werkzeug liefert keine Codepunktliste`
                ).toBe(true);
            }
            expect(GETRAGENE_CODEPUNKTE.size).toBeGreaterThanOrEqual(MINDEST_GETRAGENE_CODEPUNKTE);

            const luecken = {};
            for (const name of DATEINAMEN) {
                const fehlend = fehlendeZeichen(name, PROBETEXT);
                if (fehlend.length) {
                    luecken[name] = fehlend.map(
                        z => `${z} (${schriftWerkzeug.zeigeCodepunkt(z.codePointAt(0))})`
                    );
                }
            }
            expect(
                luecken,
                `Diese Dateien tragen Zeichen des Probetexts "${PROBETEXT}" NICHT: ` +
                    `${JSON.stringify(luecken)}. Fuer jedes fehlende Zeichen faellt ` +
                    `Seite A der Messung auf den Rueckfall zurueck — der gemessene ` +
                    `Unterschied kaeme dann teils aus dem Rueckfall statt aus der ` +
                    `Schrift. Entweder ist das Subset unvollstaendig (dann ist es ein ` +
                    `echter Befund, siehe tests/unit/schriftdateien.test.js), oder der ` +
                    `Probetext gehoert angepasst.`
            ).toEqual({});
        });

        test(`Das Fremdzeichen ${FREMD_NAME} traegt wirklich keine der Dateien`, async () => {
            // Die Ableitung selbst wird geprueft, nicht nur benutzt. Sie ist
            // die Grundlage der Gegenprobe in der Gleichheits-Richtung, die
            // in jedem messenden Teil steht: findet sie ein Zeichen, das
            // doch getragen wird, waeren alle diese Gegenproben falsch-rot.
            expect(
                FREMD_CODEPUNKT,
                'kein ungetragener, nicht zerlegbarer Codepunkt unter U+3000 gefunden — ' +
                    'dann ist die Gegenprobe in der Gleichheits-Richtung nicht ' +
                    'durchfuehrbar'
            ).not.toBeNull();
            expect(FREMD_TEXT.length).toBe(FREMD_WIEDERHOLUNGEN);
            for (const name of DATEINAMEN) {
                expect(
                    CODEPUNKTE_JE_DATEI.get(name).has(FREMD_CODEPUNKT),
                    `${name} traegt ${FREMD_NAME} doch`
                ).toBe(false);
            }
            // Und es zerlegt sich nicht in getragene Teile — sonst rendert
            // HarfBuzz es aus der Schrift (U+0100 im Kopf, Messfalle 4).
            expect(
                istZerlegbar(FREMD_CODEPUNKT),
                `${FREMD_NAME} zerlegt sich per NFD in Zeichen, die die Dateien tragen`
            ).toBe(false);
        });

        test('Nicht-Leerlauf: das Messwerkzeug unterscheidet, und alle Faces sind geladen', async ({
            page
        }) => {
            await ladeApp(page);
            const { breiten, faceStatus } = await messeBreiten(page, {
                mono: { stack: 'monospace' },
                serif: { stack: 'serif' },
                leer: { stack: 'monospace' }
            });
            // Zwei generische Familien, auf JEDEM System verschieden — auch
            // auf ubuntu-latest. Keine benannte Systemschrift als Kontrolle:
            // Arial und Georgia fehlen auf Linux.
            expect(breiten.mono).toBeGreaterThan(0);
            expect(Math.abs(breiten.mono - breiten.serif)).toBeGreaterThan(MINDESTABSTAND);
            // UND ZWEI GLEICH GEBAUTE SPANNEN MESSEN GLEICH. Das war schon
            // vorher da, ist mit der Umkehrung aber von einer Formalie zur
            // tragenden Gegenprobe geworden: der Befund dieser Datei ist
            // jetzt UNGLEICHHEIT, und eine Messung, die zwei identische
            // Spannen verschieden misst, wuerde ihn ueberall frei Haus
            // liefern.
            expect(
                breiten.leer,
                'zwei identisch gebaute Spannen messen verschieden — dann ist die ' +
                    'Ungleichheit in Teil 1 bis Teil 3 kein Befund, sondern Rauschen'
            ).toBe(breiten.mono);

            // Messfalle 2: ohne diese Zusicherung messen Teil 1 bis Teil 3
            // nur die Tauschfrist von `font-display: swap` — und zwar jetzt
            // in Richtung Falsch-ROT.
            expect(Object.keys(faceStatus).length).toBe(FACES_SOLL);
            for (const [name, status] of Object.entries(faceStatus)) {
                expect(status, `${name} steht auf "${status}", nicht "loaded"`).toBe('loaded');
            }
        });
    });

    // ------------------------------------------------------------------
    // Teil 1 — Breitenvergleich gegen den synthetischen Rueckfall.
    // Je gebuendeltes Face eine Messung, also auch je Gewicht.
    // ------------------------------------------------------------------
    test.describe('Teil 1 — jedes gebuendelte Face gegen monospace', () => {
        // ALLE FACES IN EINEM FALL AUF EINER SEITE, nicht sieben Faelle mit
        // sieben Seiten. Das ist kein Stilentscheid, sondern gemessen: in der
        // ersten Fassung lud diese Datei 25-mal das 3,7-MB-Bundle, und der
        // volle Lauf stellte fuenf FREMDE Faelle rot —
        // `eingaberahmen.spec.js` W6-R-07 Fall 1 (vier Themes) und Fall 2.
        // Diese sammeln ihre Felder ueber feste Wartefristen (400/380/180 ms)
        // und verlangen mehr als 150 sichtbare Felder; unter der zusaetzlichen
        // Last reichten die Fristen nicht. Einzeln laufen sie gruen (12
        // passed), und der Kontrolllauf der vollen Suite OHNE diese Datei
        // ebenfalls (634 passed / 39 skipped / 0 failed). Die Last war die
        // Ursache, nicht ein Logikfehler — die Fremdfaelle sind also
        // lastempfindlich, und diese Probe nimmt darauf Ruecksicht, statt sie
        // umzuschreiben. Je Face bleibt der Befund einzeln benannt: die
        // Zusicherung meldet eine Liste, keine Summe.
        test('Jedes gebuendelte Face rendert anders als sein Rueckfall', async ({ page }) => {
            // Eigene Untergrenze, nicht die des Nachbar-describe. Vorher lag
            // sie allein in Teil 0: mit leerer Facesliste lief dieser Fall
            // gruen ueber NULL Messungen durch, und ein gezielter
            // `--grep "Teil 1"`-Lauf konnte das nicht erkennen.
            expect(FACES.length, 'fonts.css liefert keine Faces').toBe(FACES_SOLL);
            await ladeApp(page);
            const stapel = {};
            for (const face of FACES) {
                const s = `${face.familie}/${face.gewichtRoh}`;
                const gewicht = messGewicht(face);
                stapel[`${s}__mit`] = { stack: mitStack(face.familie), gewicht };
                stapel[`${s}__ohne`] = { stack: RUECKFALL, gewicht };
                // Gegenprobe 1 in der Gleichheits-Richtung: eine Familie, die
                // es nicht gibt, ist vom reinen Rueckfall nicht zu
                // unterscheiden.
                stapel[`${s}__nichtda`] = {
                    stack: mitStack(FAMILIE_OHNE_DATEI),
                    gewicht
                };
                // Gegenprobe 2, die scharfere: DERSELBE Messkoerper, der die
                // echte Familie nennt, aber mit einem Zeichen, das KEINE der
                // Dateien traegt. Muss bitgleich wie der Rueckfall messen.
                stapel[`${s}__fremd`] = {
                    stack: mitStack(face.familie),
                    gewicht,
                    text: FREMD_TEXT
                };
                stapel[`${s}__fremdOhne`] = { stack: RUECKFALL, gewicht, text: FREMD_TEXT };
            }
            const { breiten } = await messeBreiten(page, stapel);

            const stummeFaces = [];
            const abstaende = {};
            let gemessen = 0;
            for (const face of FACES) {
                const s = `${face.familie}/${face.gewichtRoh}`;
                const mit = breiten[`${s}__mit`];
                const ohne = breiten[`${s}__ohne`];
                const nichtda = breiten[`${s}__nichtda`];
                expect(ohne, `${s}: Rueckfall messbar`).toBeGreaterThan(0);
                expect(mit, `${s}: Messkoerper messbar`).toBeGreaterThan(0);

                // Der Messkoerper nennt die Familie ueberhaupt. Billig, und
                // es benennt den Grund in der Fehlermeldung, statt ihn in
                // einer nackten Breitengleichheit raten zu lassen.
                expect(
                    stapel[`${s}__mit`].stack,
                    `${s}: der Messkoerper nennt die Familie nicht`
                ).toContain(face.familie);

                // GEGENPROBE 1 — Gleichheits-Richtung.
                expect(
                    nichtda,
                    `${s}: "${mitStack(FAMILIE_OHNE_DATEI)}" misst ${nichtda}px, der reine ` +
                        `Rueckfall ${ohne}px. Eine Familie ohne Datei MUSS bitgleich wie ` +
                        `der Rueckfall messen — tut sie es nicht, findet diese Messung ` +
                        `Unterschiede, die nicht aus der Schrift kommen, und der Befund ` +
                        `unten ist frei Haus.`
                ).toBe(ohne);

                // GEGENPROBE 2 — Gleichheits-Richtung, mit genannter Familie.
                expect(
                    breiten[`${s}__fremd`],
                    `${s}: der Messkoerper nennt "${face.familie}" und misst mit ` +
                        `${FREMD_NAME} — einem Zeichen, das laut cmap KEINE der ` +
                        `${FACES_SOLL} Dateien traegt. Trotzdem weicht er vom reinen ` +
                        `Rueckfall ab (${breiten[`${s}__fremd`]}px gegen ` +
                        `${breiten[`${s}__fremdOhne`]}px). Dann unterscheidet diese ` +
                        `Messung nicht nach cmap-Inhalt, und die Ungleichheit beim ` +
                        `Probetext sagt nichts ueber die Schrift.`
                ).toBe(breiten[`${s}__fremdOhne`]);

                gemessen++;
                abstaende[s] = Number((mit - ohne).toFixed(6));

                const aufListe = Object.prototype.hasOwnProperty.call(
                    SCHRIFT_FAMILIEN_AUSNAHMEN,
                    face.familie
                );
                if (aufListe) {
                    // Eine Ausnahme behauptet: traegt nichts bei. Dann MUSS
                    // sie bitgleich wie der Rueckfall messen.
                    expect(
                        mit,
                        `${face.datei} steht auf SCHRIFT_FAMILIEN_AUSNAHMEN, rendert aber ` +
                            `${mit}px statt ${ohne}px — die Datei traegt doch bei. Nimm sie ` +
                            `von der Liste und senke AUSNAHMEN_SOLL.`
                    ).toBe(ohne);
                    continue;
                }
                if (Math.abs(mit - ohne) <= MINDESTABSTAND) {
                    stummeFaces.push(
                        `${face.datei} (${s}) ${mit}px gegen Rueckfall ${ohne}px, ` +
                            `Abstand ${Math.abs(mit - ohne)}px`
                    );
                }
            }
            // Es wurde wirklich je Face gemessen, nicht nur die Schleife
            // betreten. `stummeFaces` ist bei leerer Schleife trivial leer.
            expect(gemessen, 'kein einziges Face wurde gemessen').toBe(FACES.length);
            expect(
                stummeFaces,
                `Diese Faces rendern "${PROBETEXT}" nicht mehr als ${MINDESTABSTAND}px ` +
                    `anders als der reine ${RUECKFALL}-Rueckfall — obwohl ihre cmap jedes ` +
                    `Zeichen des Probetexts traegt (Teil 0). Entweder laedt die Datei ` +
                    `nicht, oder sie traegt doch nichts bei. Gemessene Abstaende: ` +
                    `${JSON.stringify(abstaende)}`
            ).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // Teil 2 — derselbe Vergleich am ECHTEN Stack aus EDITOR_FONTS.
    //
    // Hier ist der Rueckfall nicht `monospace`, sondern der, den die App
    // wirklich setzt (`Arial, sans-serif`). Das bleibt plattformunabhaengig,
    // weil die UNGLEICHHEIT aus der gebuendelten Datei kommt: fehlt Arial
    // (ubuntu-latest), loest der Rueckfall auf sans-serif auf — eine andere
    // Zahl, aber weiter eine ANDERE als die der gebuendelten Schrift. Der
    // knappste gemessene Abstand ist Roboto gegen Arial mit 5.42px; auf
    // Linux ist er groesser, weil Liberation/DejaVu weiter von Roboto
    // wegliegt als Arial. Windows ist also der unguenstige Fall, und er ist
    // hier gemessen.
    //
    // WARUM DIESER FALL SEINE EIGENE GEGENPROBE BRAUCHT (Gegenpruefung
    // Runde 2, B-01). Er war der einzige Teil ohne Kontrolle, und das war
    // messbar: seine lebenden Zusicherungen waren `rueck > 0` und
    // `nichtda === rueck`, und die VOLLE Ausnahmeliste filterte den
    // eigentlichen Befund strukturell leer. Beides ueberlebte zwei
    // Verfaelschungen, beide im isolierten HEAD-Export nachgestellt:
    //   MUT9b  `breiten[name] = 500` statt der echten Messung.
    //          --grep "Teil 2" -> 1 passed (UNVERAENDERT GRUEN).
    //   MUT21  `rueckfallStack()` gibt den Stack unverkuerzt zurueck, der
    //          Vergleich wird Stack-gegen-sich-selbst.
    //          --grep "Teil 2" -> 1 passed (UNVERAENDERT GRUEN).
    // Mit der Umkehrung fallen BEIDE jetzt auf die Hauptzusicherung: eine
    // Konstante misst auf beiden Seiten dasselbe, und ein Rueckfall, der die
    // Familie noch nennt, rendert in der Familie — beides ergibt
    // GLEICHHEIT, und Gleichheit ist jetzt der Fehlschlag. Die drei billigen
    // Zusicherungen bleiben trotzdem stehen: sie benennen den Grund, statt
    // ihn aus einer nackten Breitengleichheit raten zu lassen.
    // ------------------------------------------------------------------
    test.describe('Teil 2 — der echte Stack aus EDITOR_FONTS', () => {
        test('Jeder gebuendelte Menueeintrag unterscheidet sich von seinem Rueckfall', async ({
            page
        }) => {
            // Eigene Untergrenze, wie in Teil 1 und Teil 3: die von Teil 0
            // liegt in einem fremden describe und faehrt bei `--grep` nicht
            // mit.
            expect(CSS_FAMILIEN.length, 'fonts.css liefert keine Familien').toBeGreaterThanOrEqual(
                MINDEST_CSS_FAMILIEN
            );
            await ladeApp(page);
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            const gebuendelt = Object.entries(menue).filter(([, stack]) =>
                CSS_FAMILIEN.includes(ersteFamilie(stack))
            );
            expect(gebuendelt.length).toBe(GEBUENDELTE_MENUEEINTRAEGE_SOLL);

            const stapel = {};
            for (const [schluessel, stack] of gebuendelt) {
                const rueckfall = rueckfallStack(stack);
                stapel[`${schluessel}__voll`] = { stack };
                stapel[`${schluessel}__rueckfall`] = { stack: rueckfall };
                stapel[`${schluessel}__nichtda`] = {
                    stack: `'${FAMILIE_OHNE_DATEI}', ${rueckfall}`
                };
                // Gegenprobe in der Gleichheits-Richtung: DERSELBE Stack,
                // aber mit einem Zeichen, das keine Datei traegt.
                stapel[`${schluessel}__fremd`] = { stack, text: FREMD_TEXT };
                stapel[`${schluessel}__fremdOhne`] = { stack: rueckfall, text: FREMD_TEXT };
            }
            const { breiten } = await messeBreiten(page, stapel);

            const stumm = [];
            const blindeKontrollen = [];
            const abstaende = {};
            let gemessen = 0;
            for (const [schluessel, stack] of gebuendelt) {
                const familie = ersteFamilie(stack);
                const rueckfall = rueckfallStack(stack);
                const voll = breiten[`${schluessel}__voll`];
                const rueck = breiten[`${schluessel}__rueckfall`];
                const nichtda = breiten[`${schluessel}__nichtda`];
                expect(rueck).toBeGreaterThan(0);
                expect(voll).toBeGreaterThan(0);
                // Auch hier: der Nichtvorhandene ist die Messlatte.
                expect(
                    nichtda,
                    `${schluessel}: eine Familie ohne Datei misst ${nichtda}px statt ` +
                        `${rueck}px — diese Messung findet Unterschiede, die nicht aus ` +
                        `der Schrift kommen.`
                ).toBe(rueck);

                // Der Messkoerper nennt die Familie ueberhaupt, und der
                // Rueckfall nennt sie NICHT. Ohne die zweite Zusicherung
                // vergleicht dieser Fall zwei gleiche Stacks (MUT21 oben).
                expect(
                    stapel[`${schluessel}__voll`].stack,
                    `${schluessel}: der Messkoerper nennt "${familie}" nicht`
                ).toContain(familie);
                expect(
                    rueckfall,
                    `${schluessel}: der Rueckfall "${rueckfall}" nennt "${familie}" noch — ` +
                        `dann vergleicht dieser Fall den Stack mit sich selbst.`
                ).not.toContain(familie);

                // DIE GEGENPROBE. Gesammelt und am Ende als Liste gemeldet.
                if (breiten[`${schluessel}__fremd`] !== breiten[`${schluessel}__fremdOhne`]) {
                    blindeKontrollen.push(
                        `${schluessel} (${familie}): "${stack}" rendert ${FREMD_NAME} ` +
                            `${breiten[`${schluessel}__fremd`]}px, "${rueckfall}" ` +
                            `${breiten[`${schluessel}__fremdOhne`]}px`
                    );
                }
                gemessen++;
                abstaende[schluessel] = Number((voll - rueck).toFixed(6));

                const aufListe = Object.prototype.hasOwnProperty.call(
                    SCHRIFT_FAMILIEN_AUSNAHMEN,
                    familie
                );
                if (aufListe) {
                    expect(
                        voll,
                        `${schluessel} (${familie}) steht auf SCHRIFT_FAMILIEN_AUSNAHMEN, ` +
                            `rendert aber ${voll}px statt ${rueck}px.`
                    ).toBe(rueck);
                    continue;
                }
                if (Math.abs(voll - rueck) <= MINDESTABSTAND) {
                    stumm.push(
                        `${schluessel} (${familie}) ${voll}px gegen Rueckfall ` +
                            `"${rueckfall}" ${rueck}px`
                    );
                }
            }
            // Es wurde wirklich je Eintrag gemessen, nicht nur die Schleife
            // betreten — `stumm` unten ist bei leerer Schleife trivial leer.
            expect(gemessen, 'kein einziger Menueeintrag wurde gemessen').toBe(gebuendelt.length);
            // Erst die Gegenprobe, dann der Befund: findet die Messung auch
            // dort Unterschiede, wo es keine geben kann, sagt der Befund
            // darunter nichts.
            expect(
                blindeKontrollen,
                `Fuer diese Eintraege findet der Messweg von Teil 2 einen Unterschied, ` +
                    `obwohl mit ${FREMD_NAME} gemessen wird — einem Zeichen, das KEINE ` +
                    `der gebuendelten Dateien traegt. Beide Seiten muessten denselben ` +
                    `Rueckfall rendern. Dann ist die Ungleichheit beim Probetext kein ` +
                    `Befund, sondern eine Eigenschaft der Messung.`
            ).toEqual([]);

            expect(
                stumm,
                `Diese Menueeintraege rendern nicht mehr als ${MINDESTABSTAND}px anders ` +
                    `als ihr Rueckfall ohne die erste Familie. Wer sie im Editor waehlt, ` +
                    `bekommt den Rueckfall. Gemessene Abstaende: ${JSON.stringify(abstaende)}`
            ).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // Teil 3 — der echte Menueweg im Wiki-Editor.
    //
    // Teil 1 und 2 messen Stacks. Dieser Teil geht den Weg, den der Nutzer
    // geht: Text tippen, markieren, im Schriftmenue der Werkzeugleiste eine
    // der vier waehlen. Die App erzeugt dabei ein <font face="...">
    // (ui/editors/rich-text.js, applyFontFamilyToSelection) — und dessen
    // gerenderte Breite ist die Antwort auf "was bekommt der Nutzer?".
    // ------------------------------------------------------------------
    test.describe('Teil 3 — der Menueweg im Wiki-Editor', () => {
        const EDITOR_ID = 'wiki-content';

        // EIN FALL, EINE SEITE, EIN FORMULAR — aus demselben Lastgrund wie in
        // Teil 1 (dort begruendet). Die vier Familien laufen nacheinander im
        // SELBEN Editor, und das ist sogar der treuere Weg: ein zweiter Griff
        // ins Schriftmenue trifft in `applyFontFamilyToSelection()` den Zweig
        // `existingFont.setAttribute('face', ...)`, also genau das, was
        // passiert, wenn ein DM im Editor die Schrift noch einmal wechselt.
        async function tippeProbetext(page) {
            await page.evaluate(() => window.switchView('wiki'));
            await page.waitForSelector('#view-wiki', { state: 'visible' });
            await page.click('[data-action="call"][data-value="showWikiForm"]');
            await page.fill('#wiki-title', 'SCHR Messtext');
            const editor = page.locator(`#${EDITOR_ID}`);
            await editor.click();
            await editor.pressSequentially(PROBETEXT);
        }

        async function waehleSchrift(page, menueSchluessel) {
            // Vor jedem Griff die Auswahl neu setzen: nach `selectOption`
            // liegt der Fokus auf dem Select, und `setEditorFont()` stellt nur
            // einen GESPEICHERTEN Bereich wieder her. Fokus per Tastatur, wie
            // im Auftrag verlangt — der Klick bringt den Einfuegepunkt in den
            // Editor, `Strg+A` markiert dessen Inhalt.
            const editor = page.locator(`#${EDITOR_ID}`);
            await editor.click();
            await page.keyboard.press('Control+a');
            await page.selectOption(
                `[data-action="set-editor-font"][data-editor="${EDITOR_ID}"]`,
                menueSchluessel
            );
            await page.waitForSelector(`#${EDITOR_ID} font[face]`);
        }

        test('Jede gebuendelte Familie im Schriftmenue rendert anders als ihr Rueckfall', async ({
            page
        }) => {
            // Eigene Untergrenze, wie in Teil 1: mit leerer Facesliste war
            // dieser Fall gruen ueber null Messungen, und die Untergrenze lag
            // im fremden describe von Teil 0.
            expect(CSS_FAMILIEN.length, 'fonts.css liefert keine Familien').toBeGreaterThanOrEqual(
                MINDEST_CSS_FAMILIEN
            );
            // UND DIE VORAUSSETZUNG DER EIGENEN BLINDKONTROLLE, aus demselben
            // Grund (Gegenpruefung Runde 4, Befund 2). Die Gegenprobe unten
            // vergleicht zwei Spannen mit FREMD_TEXT. Kann das Werkzeug kein
            // ungetragenes Zeichen mehr benennen, ist FREMD_CODEPUNKT `null`
            // und FREMD_TEXT der LEERE String — dann tragen beide Spannen
            // nichts, messen beide 0, und `messung.fremd !== messung.
            // fremdRueckfall` wird nie wahr. Die Kontrolle laeuft also still
            // mit und prueft nichts.
            //
            // NACHGESTELLT: `leseCmap()` im Werkzeug behauptet, jeder
            // Codepunkt sei getragen (`for (let c = 0x20; c < 0x3000; c++)`).
            //     $ npx playwright test ...schriftdateien.spec.js
            //       3 failed / 13 passed — Teil 0, Teil 1 und Teil 2,
            //       TEIL 3 BLIEB GRUEN.
            //     $ npx jest tests/unit/schriftdateien.test.js
            //       7 failed / 68 passed / 75
            // Heute harmlos, weil Teil 0 denselben Zustand mit eigener
            // Meldung rot stellt und der Lauf ohnehin steht — aber Teil 0
            // liegt in einem FREMDEN describe, und ein gezielter
            // `--grep "Teil 3"`-Lauf traegt seine Aussage nicht mit. Dieselbe
            // Begruendung wie bei der Familienuntergrenze darueber.
            expect(
                FREMD_CODEPUNKT,
                'Das Werkzeug kann kein ungetragenes Zeichen benennen — dann ist die ' +
                    'Blindkontrolle dieses Falls nicht durchfuehrbar und wuerde zwei leere ' +
                    'Spannen vergleichen.'
            ).not.toBeNull();
            expect(
                FREMD_TEXT.length,
                `FREMD_TEXT ist ${FREMD_TEXT.length} Zeichen lang, erwartet ` +
                    `${FREMD_WIEDERHOLUNGEN}. Mit leerem Text messen beide Seiten der ` +
                    `Blindkontrolle 0, und 0 === 0 erfuellt sie, ohne etwas zu pruefen.`
            ).toBe(FREMD_WIEDERHOLUNGEN);
            await ladeApp(page);
            // DER LADEZWANG. Dieser Fall misst an `messeBreiten()` vorbei
            // (eigenes `page.evaluate`), bekommt also deren erzwungenes
            // `document.fonts.load()` nicht. `waitForSelector('font[face]')`
            // unten wartet darauf, dass das ELEMENT da ist, nicht darauf, dass
            // die Schrift eingetauscht ist — und `font-display: swap` rendert
            // bis dahin im Rueckfall. Solange der Befund GLEICHHEIT war, war
            // das harmlos bis hilfreich (Rueckfall = der erwartete Befund);
            // mit der Umkehrung ist genau daraus ein Falsch-ROT geworden.
            //
            // EHRLICHE EINORDNUNG, gemessen und nicht behauptet: nimmt man
            // diesen Aufruf heraus, bleiben alle 16 Faelle GRUEN (Mutation M5
            // im Bericht). Der Editor rendert den Text ja selbst, und das
            // laedt die Schrift von allein. Der Aufruf ist also eine Haertung
            // gegen ein Zeitfenster, kein Fix fuer einen reproduzierbaren
            // Fehlschlag — genau wie `warteAufGenerika()`, das aus demselben
            // Grund dasteht (5 von 18 Fremdlaeufen rot, nur unter Last, nie
            // nachgestellt). Er kostet einen Rundlauf und schliesst das
            // Fenster; der Face-Status wird hier NICHT noch einmal geprueft,
            // das ist Teil 0s Aussage und war als Doppelung messbar: unter M4
            // (kaputter Ladeweg) meldete Teil 3 den Ladefehler ein zweites
            // Mal, obwohl seine eigene Messung in Ordnung war (M5b: Teil 3
            // gruen, Teil 0 rot).
            //
            // `ladeApp()` darf das NICHT tun, weil Teil 4 die Abwesenheit von
            // Anfragen beim blanken Laden behauptet.
            await ladeFaces(page, PROBETEXT + FREMD_TEXT);
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            await tippeProbetext(page);

            const stumm = [];
            const blindeKontrollen = [];
            const untreueNachbauten = [];
            const abstaende = {};
            let gemessen = 0;
            for (const familie of CSS_FAMILIEN) {
                const eintrag = Object.entries(menue).find(
                    ([, stack]) => ersteFamilie(stack) === familie
                );
                expect(eintrag, `Keine EDITOR_FONTS-Familie nennt "${familie}"`).toBeTruthy();
                const [schluessel, stack] = eintrag;

                await waehleSchrift(page, schluessel);

                const messung = await page.evaluate(
                    ({ editorId, rueckfall, fremdText, fremdGroesse }) => {
                        const el = document.querySelector(`#${editorId} font[face]`);
                        const cs = getComputedStyle(el);
                        const host = document.createElement('div');
                        host.style.cssText =
                            'position:absolute;left:-99999px;top:0;visibility:hidden;';
                        document.body.appendChild(host);
                        const mach = (familie, text = el.textContent, groesse = cs.fontSize) => {
                            // LEERER TEXT IST EIN FEHLER, keine Messung von 0.
                            // Ein Standardparameter greift bei `''` NICHT, und
                            // zwei leere Spannen sind bitgleich 0 breit — die
                            // Blindkontrolle unten waere damit erfuellt, ohne
                            // etwas verglichen zu haben (Befund 2). Oben steht
                            // dieselbe Voraussetzung als Zusicherung; hier
                            // steht sie an der Stelle, an der sie gebrochen
                            // wuerde.
                            if (!text || text.length === 0) {
                                throw new Error(
                                    `mach("${familie}") wurde mit leerem Text gerufen. ` +
                                        `Zwei leere Spannen messen beide 0 und machen jede ` +
                                        `Gleichheitskontrolle dieses Falls wertlos.`
                                );
                            }
                            const s = document.createElement('span');
                            s.style.cssText =
                                `font-family:${familie};font-size:${groesse};` +
                                `font-weight:${cs.fontWeight};font-style:${cs.fontStyle};` +
                                `letter-spacing:${cs.letterSpacing};` +
                                `word-spacing:${cs.wordSpacing};` +
                                'white-space:pre;display:inline-block;';
                            s.textContent = text;
                            host.appendChild(s);
                            return s.getBoundingClientRect().width;
                        };
                        // `rechnerFamilie` ist der Stapel, den der Browser
                        // fuer das LEBENDE Element wirklich aufgeloest hat.
                        // Er wird mitgemeldet und unten geprueft: ohne ihn
                        // liess sich diese Messung auf Rueckfall-gegen-
                        // Rueckfall verkuerzen, ohne dass etwas rot wurde.
                        const rechnerFamilie = cs.fontFamily;
                        const ergebnis = {
                            face: el.getAttribute('face'),
                            rechnerFamilie,
                            rueckfallStack: rueckfall,
                            text: el.textContent,
                            // Die Groesse, bei der das LEBENDE Element
                            // rendert (gemessen 14px). Die Schwelle unten
                            // rechnet darauf um.
                            groesse: Number.parseFloat(cs.fontSize),
                            lebend: el.getBoundingClientRect().width,
                            // Derselbe Text, dieselbe aufgeloeste Familie,
                            // aber als nachgebaute Spanne. Belegt, dass der
                            // Nachbauweg, ueber den die Gegenprobe laeuft,
                            // dem lebenden Element entspricht.
                            nachbau: mach(rechnerFamilie),
                            rueckfall: mach(rueckfall),
                            // Dasselbe noch einmal LAUT, bei
                            // MESSGROESSE statt den 14px des Editors.
                            // Nicht als Ersatz fuer das lebende
                            // Element, sondern als zweite, rund
                            // 2.9-fach deutlichere Ablesung desselben
                            // Rechnerstils — der Nachbauweg ist
                            // gleich darunter auf 0.05px Treue
                            // geprueft.
                            lautMit: mach(rechnerFamilie, el.textContent, fremdGroesse),
                            lautOhne: mach(rueckfall, el.textContent, fremdGroesse),
                            // Die Gegenprobe bei der groesseren Messgroesse,
                            // derselbe Messweg, nur lauter.
                            fremd: mach(rechnerFamilie, fremdText, fremdGroesse),
                            fremdRueckfall: mach(rueckfall, fremdText, fremdGroesse)
                        };
                        host.remove();
                        return ergebnis;
                    },
                    {
                        editorId: EDITOR_ID,
                        rueckfall: rueckfallStack(stack),
                        fremdText: FREMD_TEXT,
                        fremdGroesse: MESSGROESSE
                    }
                );

                // Die App hat die Schrift wirklich gesetzt — sonst messen wir
                // am falschen Element. Entscheidend beim Lauf im selben
                // Editor: `face` muss die AKTUELLE Familie nennen, nicht noch
                // die vorige.
                expect(messung.face, `face nach der Wahl von "${schluessel}"`).toContain(familie);
                expect(messung.text).toBe(PROBETEXT);
                // Der Browser hat die Familie fuer das lebende Element
                // wirklich angefordert, und der Rueckfall nennt sie wirklich
                // nicht. Beides muss dastehen, sonst vergleicht der Schluss
                // unten zwei Rueckfaelle.
                expect(
                    messung.rechnerFamilie,
                    `${familie}: der Rechnerstil des lebenden Elements nennt die Familie nicht`
                ).toContain(familie);
                expect(
                    messung.rueckfallStack,
                    `${familie}: der Rueckfall nennt die Familie noch`
                ).not.toContain(familie);
                expect(messung.lebend, `${familie}: lebendes Element messbar`).toBeGreaterThan(0);

                // Der Nachbau ist dem lebenden Element treu. Ein lebendes
                // Inline-Element und eine nachgebaute Spanne liegen nicht
                // bitgenau, sondern unter 0.05px auseinander (gemessen).
                // Ohne diese Zusicherung koennte die Gegenprobe, die ueber
                // `mach()` laeuft, etwas anderes messen als das Element, um
                // das es geht.
                if (Math.abs(messung.lebend - messung.nachbau) >= 0.05) {
                    untreueNachbauten.push(
                        `${familie}: lebend ${messung.lebend}px, Nachbau ` +
                            `${messung.nachbau}px (Rechnerstil "${messung.rechnerFamilie}")`
                    );
                }

                // DIE GEGENPROBE, hier am echten Menueweg: mit einem Zeichen,
                // das KEINE der Dateien traegt, muss derselbe Rechnerstil
                // bitgleich wie der Rueckfall rendern. Gesammelt und am Ende
                // als Liste gemeldet, wie die Befunde daneben.
                if (messung.fremd !== messung.fremdRueckfall) {
                    blindeKontrollen.push(
                        `${familie}: Rechnerstil "${messung.rechnerFamilie}" rendert ` +
                            `${FREMD_NAME} ${messung.fremd}px, der Rueckfall ` +
                            `"${messung.rueckfallStack}" ${messung.fremdRueckfall}px`
                    );
                }
                gemessen++;
                abstaende[familie] = Number((messung.lebend - messung.rueckfall).toFixed(6));

                const aufListe = Object.prototype.hasOwnProperty.call(
                    SCHRIFT_FAMILIEN_AUSNAHMEN,
                    familie
                );
                // Gemessen wird am LEBENDEN Element, nicht am Nachbau. Der
                // Nachbau war der Punkt, an dem sich diese Messung auf
                // Rueckfall-gegen-Rueckfall verkuerzen liess; `lebend` ist
                // das <font face>, das die App selbst erzeugt hat.
                if (aufListe) {
                    expect(
                        messung.lebend,
                        `${familie} steht auf SCHRIFT_FAMILIEN_AUSNAHMEN, rendert im Editor ` +
                            `aber ${messung.lebend}px statt ${messung.rueckfall}px.`
                    ).toBeCloseTo(messung.rueckfall, 1);
                    continue;
                }
                const schwelle = schwelleFuer(messung.groesse);
                if (Math.abs(messung.lebend - messung.rueckfall) <= schwelle) {
                    stumm.push(
                        `"${schluessel}" -> face="${messung.face}" ${messung.lebend}px, ` +
                            `Rueckfall "${rueckfallStack(stack)}" ${messung.rueckfall}px ` +
                            `(bei ${messung.groesse}px, Schwelle ${schwelle}px)`
                    );
                }
                // Und dieselbe Aussage noch einmal bei MESSGROESSE, wo die
                // volle Schwelle gilt. Zwei Ablesungen desselben
                // Rechnerstils: die authentische am lebenden Element bei
                // 14px und die laute bei 40px. Dass eine davon allein
                // genuegen koennte, ist nicht der Punkt — stimmen sie
                // nicht ueberein, ist etwas an der Messung faul.
                if (Math.abs(messung.lautMit - messung.lautOhne) <= MINDESTABSTAND) {
                    stumm.push(
                        `"${schluessel}" bei ${MESSGROESSE}: ${messung.lautMit}px gegen ` +
                            `Rueckfall ${messung.lautOhne}px`
                    );
                }
            }
            expect(gemessen, 'keine einzige Familie wurde gemessen').toBe(CSS_FAMILIEN.length);
            expect(
                untreueNachbauten,
                'Der Nachbau weicht vom lebenden Element ab. Dann messen die Gegenproben ' +
                    'dieses Teils etwas anderes als das Element, um das es geht.'
            ).toEqual([]);
            // Erst die Gegenprobe, dann der Befund.
            expect(
                blindeKontrollen,
                `Fuer diese Familien findet der Messweg von Teil 3 einen Unterschied, ` +
                    `obwohl mit ${FREMD_NAME} gemessen wird — einem Zeichen, das KEINE ` +
                    `gebuendelte Datei traegt. Dann ist die Ungleichheit beim Probetext ` +
                    `kein Befund, sondern eine Eigenschaft der Messung.`
            ).toEqual([]);
            expect(
                stumm,
                `Nach der Wahl dieser Eintraege im Schriftmenue rendert der Text nicht ` +
                    `genug anders als ohne die erste Familie — der Nutzer bekommt den ` +
                    `Rueckfall. Die Schwelle steht in jedem Eintrag: am lebenden Element ` +
                    `die auf dessen Schriftgroesse umgerechnete (schwelleFuer), bei ` +
                    `${MESSGROESSE} die volle von ${MINDESTABSTAND}px. Gemessene ` +
                    `Abstaende am lebenden Element: ${JSON.stringify(abstaende)}`
            ).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // Teil 4 — und sie laden auch, aber erst auf Anforderung.
    // ------------------------------------------------------------------
    test.describe('Teil 4 — die Dateien laden erst auf Anforderung', () => {
        test(`Beim blanken Laden fordert Chromium KEINE der ${FACES_SOLL} Dateien an`, async ({
            page
        }) => {
            const gesehen = [];
            page.on('response', r => {
                if (/\.woff2(\?|$)/i.test(r.url())) gesehen.push(r.url().split('/').pop());
            });
            expect(FACES.length, 'fonts.css liefert keine Faces').toBe(FACES_SOLL);
            await ladeApp(page);
            await page.evaluate(() => document.fonts.ready);
            await page.waitForTimeout(2000);
            // Messfalle 3: ohne `unicode-range` und ohne Nutzung laedt
            // Chromium faul. Die App selbst benutzt keine der vier Familien.
            // Das ist ein Befund, keine Formalie: die 144.608 Byte fliessen
            // erst, wenn jemand im Editor eine der vier waehlt.
            const beimBlankenLaden = gesehen.slice();
            expect(beimBlankenLaden).toEqual([]);

            // DIE GEGENPROBE ZUR VERNEINUNG (Gegenpruefung Runde 2, B-08).
            // Eine Zusicherung, die die ABWESENHEIT von Anfragen behauptet,
            // scheitert in Richtung falsch-gruen: ein blinder Horcher, eine
            // zu kurze Frist oder ein Muster, das nicht mehr greift, sehen
            // alle genauso aus wie "Chromium hat nichts angefordert".
            // Nachgestellt im isolierten HEAD-Export: mit einem Horcher, der
            // grundsaetzlich nichts schiebt (`if (false && ...)`), blieb
            // dieser Fall gruen UND die ganze Datei gruen (14 passed) — die
            // Nachbarfaelle fangen es nicht, weil der Fall darunter seinen
            // eigenen Horcher fuehrt.
            //
            // Darum muss DERSELBE Horcher im SELBEN Lauf zeigen, dass er
            // sehen kann: erzwungen geladen, und die sieben Anfragen muessen
            // auftauchen. Das macht die feste Frist oben belastbar — nicht,
            // weil 2000 ms die richtige Zahl waeren, sondern weil der
            // Erkenner im selben Fenster nachweislich funktioniert.
            // `expect.poll` statt einer zweiten festen Frist, aus dem Grund,
            // der im Fall darunter steht.
            await messeBreiten(page, { mono: { stack: 'monospace' } });
            await expect
                .poll(() => gesehen.length, { timeout: 15000 })
                .toBeGreaterThanOrEqual(DATEINAMEN.length);
        });

        test(`Erzwungen laden alle ${FACES_SOLL} mit Status 200, ${BYTE_SUMME_SOLL} Byte`, async ({
            page
        }) => {
            // Der Horcher sammelt SYNCHRON. Ein `async`-Horcher, der erst
            // `await r.body()` abwartet und danach schiebt, waere ein Rennen:
            // Playwright wartet auf das Versprechen eines Horchers NICHT, der
            // Eintrag koennte also nach den Zusicherungen unten landen und die
            // Namensliste waere mal vollstaendig, mal nicht. Die Koerper
            // werden darum erst im Testkoerper gelesen, wo `await` zaehlt.
            const rohAntworten = [];
            page.on('response', r => {
                if (/\.woff2(\?|$)/i.test(r.url())) rohAntworten.push(r);
            });
            const fehlgeschlagen = [];
            page.on('requestfailed', r => {
                if (/\.woff2(\?|$)/i.test(r.url())) {
                    fehlgeschlagen.push({
                        name: r.url().split('/').pop(),
                        fehler: r.failure() ? r.failure().errorText : '?'
                    });
                }
            });

            await ladeApp(page);
            const { faceStatus } = await messeBreiten(page, { mono: { stack: 'monospace' } });
            // Auf die Namen warten statt auf eine feste Frist: unter Last ist
            // jede feste Frist entweder zu kurz (Fehlalarm) oder verschwendet.
            await expect
                .poll(() => rohAntworten.length, { timeout: 15000 })
                .toBeGreaterThanOrEqual(DATEINAMEN.length);

            // Im selben Lauf mitgenommen (eine Seite statt zwei, Lastgrund
            // siehe Teil 1): `document.fonts.check()` kann die Frage dieser
            // Probe nicht beantworten.
            const checkAntworten = await page.evaluate(
                ({ text, nichtda }) => {
                    const familien = new Set();
                    document.fonts.forEach(ff => familien.add(ff.family));
                    const antworten = {};
                    for (const f of [...familien, nichtda]) {
                        antworten[f] = document.fonts.check(`400 16px "${f}"`, text);
                    }
                    return antworten;
                },
                { text: PROBETEXT, nichtda: FAMILIE_OHNE_DATEI }
            );
            // WARUM DAS EINE ZUSICHERUNG IST UND KEIN KOMMENTAR.
            // `check()` liefert nach Spezifikation `true`, sobald der Text mit
            // der Liste INKLUSIVE Rueckfaellen darstellbar ist. Es sagt also
            // nichts darueber, ob die GENANNTE Familie etwas beitraegt — hier
            // nachgemessen: es liefert `true` auch fuer eine Familie, zu der
            // es keine Datei und keine @font-face-Regel gibt. Darum laeuft der
            // Ladebeleg ueber die Netzwerkantworten und nicht ueber `check()`,
            // und darum laeuft der BEITRAGS-Beleg ueber Breiten. Solange diese
            // Zusicherung haelt, ist die Entscheidung begruendet; kippt sie,
            // gehoert sie neu bewertet.
            expect(
                checkAntworten[FAMILIE_OHNE_DATEI],
                'document.fonts.check() meldet eine Familie ohne Datei als nicht ' +
                    'darstellbar — dann ist check() hier doch brauchbar und der ' +
                    'Ladebeleg gehoert neu bewertet.'
            ).toBe(true);
            for (const familie of CSS_FAMILIEN) {
                expect(checkAntworten[familie], `check() fuer ${familie}`).toBe(true);
            }

            const antworten = [];
            for (const r of rohAntworten) {
                let laenge = null;
                try {
                    laenge = (await r.body()).length;
                } catch (e) {
                    laenge = null;
                }
                antworten.push({ name: r.url().split('/').pop(), status: r.status(), laenge });
            }

            // Kein 404, kein Ladefehler.
            expect(fehlgeschlagen).toEqual([]);
            const namen = antworten.map(a => a.name).sort();
            expect(namen).toEqual(DATEINAMEN);
            for (const a of antworten) {
                expect(a.status, `${a.name} antwortete mit ${a.status}`).toBe(200);
            }
            for (const [name, status] of Object.entries(faceStatus)) {
                expect(status, `${name} steht auf "${status}"`).toBe('loaded');
            }
            const summe = antworten.reduce((s, a) => s + (a.laenge || 0), 0);
            expect(summe).toBe(BYTE_SUMME_SOLL);
        });
    });

    // ------------------------------------------------------------------
    // Teil 5 — die Ratsche: gezaehlte Ausnahmeliste mit Verwesungsprobe.
    // ------------------------------------------------------------------
    test.describe('Teil 5 — gezaehlte Ausnahmeliste', () => {
        const eintraege = Object.keys(SCHRIFT_FAMILIEN_AUSNAHMEN);

        test(`SCHRIFT_FAMILIEN_AUSNAHMEN fuehrt genau ${AUSNAHMEN_SOLL} Eintraege`, async () => {
            expect(eintraege).toHaveLength(AUSNAHMEN_SOLL);
        });

        test('Jeder Eintrag nennt einen Grund', async () => {
            for (const [name, grund] of Object.entries(SCHRIFT_FAMILIEN_AUSNAHMEN)) {
                expect(typeof grund, `${name} hat keinen Grund`).toBe('string');
                expect(grund.length, `${name}: Grund zu kurz`).toBeGreaterThan(20);
            }
        });

        test('Jeder Eintrag nennt eine Familie, die fonts.css einbindet', async () => {
            for (const name of eintraege) {
                expect(CSS_FAMILIEN, `${name} steht in keiner @font-face-Regel`).toContain(name);
            }
        });

        test('Verwesungsprobe: keine Ausnahme ueberlebt ihre Reparatur', async ({ page }) => {
            await ladeApp(page);

            // Im selben Lauf mitgenommen (Lastgrund siehe Teil 1): jeder
            // Eintrag muss eine Familie nennen, die das Menue wirklich
            // anbietet. Ein Tippfehler im Schluessel koennte die
            // Verwesungsprobe sonst leerlaufen lassen.
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            const menueFamilien = Object.values(menue).map(ersteFamilie);
            for (const name of eintraege) {
                expect(menueFamilien, `${name} steht in keinem Menueeintrag`).toContain(name);
            }

            if (eintraege.length === 0) {
                // Leere Liste: nichts zu verwesen. Dieser Zweig schlaeft
                // BEWUSST — er ist die einzige Stelle dieser Datei, die bei
                // leerer Liste nichts messendes tut. Einheit 1 hat dieselbe
                // Stelle gemessen (M1): ein Eintrag weckt ihn von selbst,
                // weil alle vier Familien messbar beitragen und eine
                // Ausnahme GLEICHHEIT behauptet. Die Laengenprobe oben haelt
                // den Zustand fest, und die beiden Zusicherungen hier halten
                // den Zweig davon ab, zu einem stillen `return` zu werden.
                expect(AUSNAHMEN_SOLL).toBe(0);
                expect(CSS_FAMILIEN.length).toBeGreaterThanOrEqual(MINDEST_CSS_FAMILIEN);
                return;
            }
            const stapel = {};
            for (const name of eintraege) {
                stapel[`${name}__mit`] = { stack: mitStack(name) };
                stapel[`${name}__ohne`] = { stack: RUECKFALL };
                stapel[`${name}__fremd`] = { stack: mitStack(name), text: FREMD_TEXT };
                stapel[`${name}__fremdOhne`] = { stack: RUECKFALL, text: FREMD_TEXT };
            }
            const { breiten } = await messeBreiten(page, stapel);

            // Dieselbe Gegenprobe wie in Teil 1, hier je Familie: ohne sie
            // koennte eine Messung, die ueberall Unterschiede findet, die
            // Verwesungsprobe reihenweise rot stellen, ohne dass eine
            // Familie wirklich beitraegt.
            for (const name of eintraege) {
                expect(
                    breiten[`${name}__fremd`],
                    `${name}: der Messkoerper nennt die Familie und misst mit ` +
                        `${FREMD_NAME}, einem Zeichen das KEINE ihrer Dateien ` +
                        `(${dateienDerFamilie(name).join(', ')}) traegt — und weicht ` +
                        `trotzdem vom reinen Rueckfall ab. Dann prueft die ` +
                        `Verwesungsprobe nichts.`
                ).toBe(breiten[`${name}__fremdOhne`]);
            }

            const repariert = eintraege.filter(
                n => Math.abs(breiten[`${n}__mit`] - breiten[`${n}__ohne`]) > MINDESTABSTAND
            );
            expect(
                repariert,
                `Diese Familien stehen auf SCHRIFT_FAMILIEN_AUSNAHMEN, tragen aber in ` +
                    `Wahrheit bei. Nimm sie von der Liste und senke AUSNAHMEN_SOLL auf ` +
                    `${eintraege.length - repariert.length}.`
            ).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // Teil 6 — ECHTE GEWICHTE. Der Nachweis, den der alte Zehnerbau nie
    // treffen konnte.
    //
    // Roboto und Inter kommen seit `b0ada5b` aus JE EINER Datei mit
    // `font-weight: 100 900` — eine variable Schrift mit `wght`-Achse
    // (Einheit 1 liest die Achse aus der fvar-Tabelle und nagelt sie fest).
    // Die Frage, die nur der Browser beantworten kann: macht er daraus
    // ECHTE Instanzen, oder taeuscht er Fettschrift nach?
    //
    // DIE MESSUNG, und warum sie nicht zu umgehen ist. Derselbe Text,
    // dieselbe Familie, nur das Gewicht wandert ueber 100..900. Fuer eine
    // variable Familie muss JEDE Stufe eine EIGENE Breite ergeben — neun
    // Gewichte, neun verschiedene Zahlen, monoton steigend. Fuer eine
    // STATISCHE Familie gibt es zwischen den deklarierten Gewichten nichts:
    // dort muessen genau so viele verschiedene Breiten herauskommen, wie
    // fonts.css Einzelgewichte deklariert, und jedes NICHT deklarierte
    // Gewicht rendert BITGLEICH wie der deklarierte Nachbar, den die
    // CSS-Schriftzuordnung dafuer waehlt.
    //
    // DAS IST DIE GEGENPROBE ZUR GEGENPROBE: dieselbe Messung, aus fonts.css
    // abgeleitet, muss fuer die eine Bauart UNGLEICHHEIT und fuer die andere
    // BITGLEICHHEIT liefern. Eine Messung, die immer Unterschiede findet,
    // scheitert an den statischen Familien; eine, die nie welche findet, an
    // den variablen. Keine der beiden Haelften ist allein zu bestehen.
    //
    // GEMESSEN, mit dem Probetext-Pangramm bei 40px, Windows/Chromium.
    // Die volle Reihe 100..900 steht so auch in der Fehlermeldung dieses
    // Falls, sie ist also nachlesbar und nicht nur hier abgeschrieben:
    //   Roboto   1085.75 · 1093.203125 · 1104.265625 · 1123.28125 ·
    //            1135.09375 · 1140.140625 · 1145 · 1150.484375 · 1155.53125
    //            -> neun verschiedene Werte, streng steigend.
    //            400 gegen 700 = 21.71875px, 400 gegen 600 = 16.859375px
    //   Inter    1143 · 1165.125 · 1187.46875 · 1209.59375 · 1221.71875 ·
    //            1233.671875 · 1245.640625 · 1260.375 · 1276.46875
    //            -> neun verschiedene Werte, streng steigend.
    //            400 gegen 600 = 24.078125px, 400 gegen 700 = 36.046875px
    //   Poppins  1258.84375 (100..400, VIERMAL bitgleich) · 1271.609375
    //            (500) · 1285 (600..900, VIERMAL bitgleich)
    //            -> DREI Werte bei DREI deklarierten Gewichten (400/500/600)
    //   Source Sans Pro 1054.40625 (100..500, FUENFMAL bitgleich) ·
    //            1088.203125 (600..900, VIERMAL bitgleich)
    //            -> ZWEI Werte bei ZWEI deklarierten Gewichten (400/600)
    //
    // Der schwaechste Schritt der variablen Reihe ist Roboto 500 -> 600 mit
    // 5.046875px. Darum urteilt dieser Teil auf VERSCHIEDENHEIT (exakt) und
    // nicht gegen MINDESTABSTAND: Schriftmetriken bei fester Groesse sind
    // deterministisch, und die statische Haelfte verlangt ohnehin
    // Bitgleichheit. Nur die beiden vom Auftrag benannten Paare unten
    // bekommen zusaetzlich die Schwelle, weil dort eine Zahl berichtet wird.
    //
    // KORREKTUR ZUR AUFTRAGSANNAHME. Der Auftrag erwartete, dass der Browser
    // das nicht deklarierte Gewicht 700 bei Source Sans Pro NACHTAEUSCHT und
    // dass genau das den sichtbaren Unterschied macht. Gemessen taeuscht er
    // NICHTS nach: 600 und 700 messen bitgleich. Der Grund steht in der
    // CSS-Schriftzuordnung — fuer das Wunschgewicht 700 gibt es kein
    // deklariertes Gewicht darueber, also wird das naechste darunter gewaehlt
    // (600), und eine synthetische Fettung kommt bei einem bereits
    // halbfetten Face nicht dazu. Der Nachweis wird dadurch SCHAERFER, nicht
    // schwaecher: Bitgleichheit ist eine haertere Zusicherung als "irgendein
    // anderer Unterschied". Dieselbe Mechanik liegt eine Stufe tiefer noch
    // klarer: 400 gegen 500 ist bei Source Sans Pro bitgleich (kein 500
    // deklariert) und bei Roboto und Inter verschieden (Achse).
    // ------------------------------------------------------------------
    test.describe('Teil 6 — echte Gewichtsinstanzen gegen statische Stufen', () => {
        test('Variable Familien liefern je Gewicht eine eigene Breite, statische nicht', async ({
            page
        }) => {
            // Eigene Untergrenzen, wie in Teil 1 bis Teil 3. Beide Bauarten
            // muessen vorkommen, sonst prueft dieser Fall nur eine Haelfte
            // seiner Aussage — und die andere ist die Gegenprobe dazu.
            expect(FACES.length, 'fonts.css liefert keine Faces').toBe(FACES_SOLL);
            expect(
                VARIABLE_FAMILIEN.length,
                'keine variable Familie aus fonts.css gelesen — dann ist der Nachweis ' +
                    'echter Gewichtsinstanzen nicht durchfuehrbar. Zwei Bloecke tragen ' +
                    '`font-weight: 100 900`; ein Leser, der nur Einzelgewichte erkennt, ' +
                    'verliert sie still.'
            ).toBeGreaterThan(0);
            expect(
                STATISCHE_FAMILIEN.length,
                'keine statische Familie aus fonts.css gelesen — dann fehlt die ' +
                    'Gegenprobe, und eine Messung, die immer Unterschiede findet, ' +
                    'bestuende diesen Fall.'
            ).toBeGreaterThan(0);

            // ----------------------------------------------------------
            // DAS SOLL KOMMT NICHT AUS DERSELBEN DATEI WIE DER
            // MESSGEGENSTAND. Begruendung, Mechanismus und die Messung,
            // die diese Zusicherung erzwungen hat, stehen bei
            // `hatWghtAchse()` oben. Kurz: ohne sie laeuft dieser Fall
            // gruen durch, wenn jemand `font-weight: 100 900` auf ein
            // Einzelgewicht zusammenzieht — die Familie wandert dann nach
            // `STATISCHE_FAMILIEN` und der statische Zweig unten ist
            // exakt erfuellt, obwohl Chromium die `wght`-Achse abschaltet
            // und alle neun Gewichte bitgleich rendern.
            //
            // Geprueft wird das PAAR je @font-face, nicht je Familie: so
            // faellt auch ein einzelner neuer Block mit Einzelgewicht auf
            // einer variablen Datei auf, waehrend die Familie daneben
            // weiter einen Bereich fuehrt.
            // ----------------------------------------------------------
            const bauartDrift = [];
            for (const face of FACES) {
                for (const name of face.dateinamen) {
                    const achse = WGHT_ACHSE_JE_DATEI.get(name);
                    const nachDatei = hatWghtAchse(name);
                    if (nachDatei === face.istBereich) continue;
                    bauartDrift.push(
                        nachDatei
                            ? `${face.familie}: fonts.css erklaert font-weight: ` +
                                  `${face.gewichtRoh} (Einzelgewicht), aber ${name} traegt ` +
                                  `eine wght-Achse ${achse.min}..${achse.max}. Chromium ` +
                                  `schaltet die Achse damit ab: alle Gewichte rendern ` +
                                  `bitgleich, 400 und 700 sehen im Editor gleich aus, und ` +
                                  `${MESSGEWICHTE.length - 1} Schnitte der Datei sind ` +
                                  `weggeworfen. Der Bereich muss zurueck in fonts.css.`
                            : `${face.familie}: fonts.css erklaert den Gewichtsbereich ` +
                                  `${face.gewichtVon}..${face.gewichtBis}, aber ${name} ` +
                                  `traegt keine wght-Achse mit Spanne ` +
                                  `(${achse ? `${achse.min}..${achse.max}` : 'keine fvar-Achse'}). ` +
                                  `Dann taeuscht der Browser Fettschrift nur nach.`
                    );
                }
            }
            expect(
                bauartDrift,
                'Die in fonts.css erklaerte Bauart und die Faehigkeit der DATEI laufen ' +
                    'auseinander. Das SOLL dieses Falls (variabel -> neun eigene Breiten, ' +
                    'statisch -> so viele wie deklarierte Einzelgewichte) stammt aus ' +
                    'fonts.css; stimmt fonts.css nicht mit den Dateien ueberein, prueft ' +
                    'dieser Fall ein SOLL, das seinen eigenen Fehler beschreibt.'
            ).toEqual([]);
            // Gegenprobe gegen Leerlauf: das Paar ist auf beiden Seiten
            // wirklich belegt. Liefert der fvar-Leser nichts, waeren oben
            // alle Faces "statisch nach Datei" — und das faellt hier auf,
            // nicht erst beim naechsten Schriftwechsel.
            const variabelNachDatei = DATEINAMEN.filter(hatWghtAchse);
            expect(
                variabelNachDatei.length,
                'keine einzige Datei traegt laut fvar eine wght-Achse mit Spanne — dann ' +
                    'ist die Gegenquelle dieses Falls tot und der Vergleich darueber ' +
                    'trivial erfuellt.'
            ).toBeGreaterThan(0);
            expect(
                DATEINAMEN.length - variabelNachDatei.length,
                'jede Datei traegt laut fvar eine wght-Achse — dann fehlt die statische ' +
                    'Haelfte des Vergleichs.'
            ).toBeGreaterThan(0);

            await ladeApp(page);

            // Ein Stapel ueber alle Familien und alle neun Gewichte, plus je
            // Familie und Gewicht der reine Rueckfall als Vergleich.
            const stapel = {};
            for (const info of FAMILIEN_INFO) {
                for (const gewicht of MESSGEWICHTE) {
                    stapel[`${info.familie}__${gewicht}`] = {
                        stack: mitStack(info.familie),
                        gewicht
                    };
                    stapel[`${info.familie}__${gewicht}__ohne`] = {
                        stack: RUECKFALL,
                        gewicht
                    };
                }
            }
            const { breiten, faceStatus } = await messeBreiten(page, stapel);
            // Ohne geladene Faces misst dieser Fall die Tauschfrist und
            // meldete fuer JEDE Familie "keine eigenen Breiten".
            for (const [name, status] of Object.entries(faceStatus)) {
                expect(status, `${name} steht auf "${status}", nicht "loaded"`).toBe('loaded');
            }

            const befunde = [];
            const gemesseneBreiten = {};
            for (const info of FAMILIEN_INFO) {
                const reihe = MESSGEWICHTE.map(g => breiten[`${info.familie}__${g}`]);
                gemesseneBreiten[info.familie] = reihe;
                for (const [i, b] of reihe.entries()) {
                    expect(b, `${info.familie}/${MESSGEWICHTE[i]}: nicht messbar`).toBeGreaterThan(
                        0
                    );
                }
                // Die Familie rendert ueberhaupt aus ihrer Datei — sonst
                // messen alle neun Stufen den Rueckfall und waeren
                // trivialerweise gleich.
                const ohneRegel = breiten[`${info.familie}__${REGELGEWICHT}__ohne`];
                expect(
                    Math.abs(breiten[`${info.familie}__${REGELGEWICHT}`] - ohneRegel),
                    `${info.familie}: rendert bei Gewicht ${REGELGEWICHT} wie der ` +
                        `Rueckfall — dann sagt die Gewichtsreihe nichts ueber die Datei.`
                ).toBeGreaterThan(MINDESTABSTAND);

                const verschieden = new Set(reihe);
                if (info.variabel) {
                    // ECHTE INSTANZEN: jede Stufe eine eigene Breite.
                    if (verschieden.size !== MESSGEWICHTE.length) {
                        befunde.push(
                            `${info.familie} ist variabel (${info.von}..${info.bis}), ` +
                                `liefert aber nur ${verschieden.size} verschiedene Breiten ` +
                                `fuer ${MESSGEWICHTE.length} Gewichte: ` +
                                `${JSON.stringify(reihe)}`
                        );
                    }
                    // Monoton steigend — eine schwerere Instanz ist breiter.
                    // Das ist mehr als "verschieden": es schliesst aus, dass
                    // die neun Werte aus Rundungsrauschen kommen.
                    for (let i = 1; i < reihe.length; i++) {
                        if (!(reihe[i] > reihe[i - 1])) {
                            befunde.push(
                                `${info.familie}: Gewicht ${MESSGEWICHTE[i]} (${reihe[i]}px) ` +
                                    `ist nicht breiter als ${MESSGEWICHTE[i - 1]} ` +
                                    `(${reihe[i - 1]}px)`
                            );
                        }
                    }
                    // Mehr verschiedene Breiten als deklarierte Bloecke —
                    // die Instanzen koennen also nicht aus den Bloecken
                    // kommen, sondern nur aus der Achse.
                    expect(
                        verschieden.size,
                        `${info.familie}: ${verschieden.size} verschiedene Breiten aus ` +
                            `${info.faces.length} @font-face-Block/-Bloecken — nicht mehr ` +
                            `als deklariert, also kein Beweis fuer die Achse.`
                    ).toBeGreaterThan(info.faces.length);
                } else {
                    // STATISCHE STUFEN: genau so viele verschiedene Breiten,
                    // wie fonts.css Einzelgewichte deklariert.
                    if (verschieden.size !== info.einzelGewichte.length) {
                        befunde.push(
                            `${info.familie} ist statisch mit den deklarierten Gewichten ` +
                                `${JSON.stringify(info.einzelGewichte)}, liefert aber ` +
                                `${verschieden.size} verschiedene Breiten: ` +
                                `${JSON.stringify(reihe)}`
                        );
                    }
                    // UND KONKRET: jedes nicht deklarierte Gewicht rendert
                    // bitgleich wie ein deklariertes. Das ist der Satz
                    // "zwischen den Stufen gibt es nichts" in seiner
                    // schaerfsten Form.
                    const deklarierteBreiten = new Set(
                        info.einzelGewichte.map(g => breiten[`${info.familie}__${g}`])
                    );
                    const nichtDeklariert = MESSGEWICHTE.filter(
                        g => !info.einzelGewichte.includes(g)
                    );
                    // Gegen Leerlauf: gaebe es kein nicht deklariertes
                    // Gewicht, pruefte die Schleife darunter nichts.
                    expect(
                        nichtDeklariert.length,
                        `${info.familie} deklariert alle ${MESSGEWICHTE.length} gemessenen ` +
                            `Gewichte — dann ist die Gegenprobe nicht durchfuehrbar.`
                    ).toBeGreaterThan(0);
                    for (const g of nichtDeklariert) {
                        const b = breiten[`${info.familie}__${g}`];
                        if (!deklarierteBreiten.has(b)) {
                            befunde.push(
                                `${info.familie}: Gewicht ${g} ist nicht deklariert ` +
                                    `(${JSON.stringify(info.einzelGewichte)}), rendert aber ` +
                                    `${b}px — keine der deklarierten Breiten ` +
                                    `${JSON.stringify([...deklarierteBreiten])}. Der Browser ` +
                                    `taeuscht hier ein Gewicht nach, das keine Datei ` +
                                    `hergibt.`
                            );
                        }
                    }
                }
            }

            expect(
                befunde,
                `Gemessene Breiten je Familie, Gewichte ${JSON.stringify(MESSGEWICHTE)}: ` +
                    `${JSON.stringify(gemesseneBreiten)}`
            ).toEqual([]);

            // DIE BEIDEN VOM AUFTRAG BENANNTEN PAARE, namentlich und mit
            // Zahl. Die Gewichte stehen hier, die FAMILIEN nicht: welche
            // variabel ist, kommt aus fonts.css.
            for (const info of VARIABLE_FAMILIEN) {
                for (const gewicht of [600, 700]) {
                    const a = breiten[`${info.familie}__${REGELGEWICHT}`];
                    const b = breiten[`${info.familie}__${gewicht}`];
                    expect(
                        Math.abs(b - a),
                        `${info.familie}: Gewicht ${REGELGEWICHT} (${a}px) und ${gewicht} ` +
                            `(${b}px) messen gleich breit. Aus EINER Datei mit ` +
                            `font-weight: ${info.von} ${info.bis} muss der Browser echte ` +
                            `Instanzen machen.`
                    ).toBeGreaterThan(MINDESTABSTAND);
                }
            }

            // UND DIE GEGENPROBE AN DER STATISCHEN FAMILIE, bitgleich: jedes
            // Gewicht ueber dem hoechsten deklarierten rendert wie dieses.
            // Hier taeuscht der Browser nichts nach — gemessen, nicht
            // angenommen (siehe die Korrektur im Kopf dieses Teils).
            for (const info of STATISCHE_FAMILIEN) {
                const hoechstes = Math.max(...info.einzelGewichte);
                const darueber = MESSGEWICHTE.filter(g => g > hoechstes);
                expect(
                    darueber.length,
                    `${info.familie}: kein gemessenes Gewicht liegt ueber dem hoechsten ` +
                        `deklarierten (${hoechstes}) — dann ist diese Gegenprobe nicht ` +
                        `durchfuehrbar.`
                ).toBeGreaterThan(0);
                for (const g of darueber) {
                    expect(
                        breiten[`${info.familie}__${g}`],
                        `${info.familie}: Gewicht ${g} ist nicht deklariert und misst ` +
                            `${breiten[`${info.familie}__${g}`]}px, das deklarierte ` +
                            `${hoechstes} misst ` +
                            `${breiten[`${info.familie}__${hoechstes}`]}px. Ohne eigene ` +
                            `Datei fuer ${g} muss der Browser auf ${hoechstes} ` +
                            `zurueckfallen — bitgleich.`
                    ).toBe(breiten[`${info.familie}__${hoechstes}`]);
                }
            }
        });
    });
});
