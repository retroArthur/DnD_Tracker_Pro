// [SECTION:COMBAT_LOG_CORE]
// Kampfprotokoll — Ringpuffer, Kategorien, Persistenz (U5)
//
// WOFUER DAS DA IST: die Frage des Spielleiters am Tisch lautet "kann ich nach
// drei Wuerfen noch nachsehen, was der zweite ergeben hat?". Vor U5 lautete die
// Antwort nein — eine Meldung stand 2000 ms (APP_CONFIG.TOAST_DURATION) plus
// 400 ms Ausblendung, und der Dauermodus (Taste L) wirkte nur nach vorne: was
// vor dem Einschalten lief, war unwiederbringlich weg. Dieses Modul ist der
// Speicher, der beide Luecken schliesst; features/combat-log/combat-log-render.js
// ist das Fenster darauf.
//
// ============================================================
// ZWEI ENTSCHEIDUNGEN, DIE HIER BEGRUENDET GEHOEREN
// ============================================================
//
// (1) DER PUFFER IST EINE MODULVARIABLE UND LIEGT NICHT IN `D`.
//     pushUndo() serialisiert bei JEDER destruktiven Aktion das ganze `D`
//     (systems/undo.js) — ein Protokoll, das ueber eine Sitzung auf 200
//     Eintraege waechst, verteuerte damit jeden einzelnen Undo-Schritt, und
//     zwar dauerhaft und fuer alle Zeit danach. Vorbild fuer die Modulvariable
//     ist `diceHistory` in features/dice/dice-core.js, die aus genau demselben
//     Grund dort steht und nicht in `D`. Zwei Testfaelle in
//     tests/unit/combat-log.test.js halten das fest: einer prueft zur Laufzeit,
//     dass `D` unberuehrt bleibt, einer den Quelltext dieser Datei auf
//     schreibende Zugriffe auf das globale Datenobjekt. Der zweite liest den
//     ROHEN Quelltext — ein Kommentar, der das verbotene Muster als Beispiel
//     ausschreibt, faellt selbst durch (dieselbe Kommentarfalle, die CLAUDE.md
//     fuer var() und geschweifte Klammern beschreibt), deshalb steht es hier
//     in Worten.
//
// (2) PERSISTENZ UEBER localStorage, NICHT UEBER DEN IndexedDB-SPEICHER.
//     Der vorhandene IDB-Speicher (features/dice-stats/dice-stats-idb.js,
//     Deckel 50.000, mit sessionId) waere die falsche Wahl, aus drei
//     gemessenen Gruenden:
//       - Er ist asynchron. Das Panel muss beim Oeffnen SOFORT etwas zeigen;
//         localStorage liest synchron, ein IDB-Lesevorgang braeuchte einen
//         Ladezustand im Panel fuer eine Datenmenge von ~30 KB.
//       - Er braeuchte einen neuen Object Store, also eine Versionserhoehung
//         am gemeinsamen `idb`-Handle. Eine Schema-Migration am Speicher, in
//         dem die Wuerfelstatistik UND die Backups liegen, ist ein Risiko, das
//         ein Protokollfenster nicht wert ist.
//       - Sein Deckel von 50.000 ist fuer eine Statistik gedacht, die ueber
//         Jahre Aussagen treffen soll. Das Kampfprotokoll beantwortet eine
//         Frage mit der Reichweite einer Spielsitzung; 200 Eintraege sind
//         dafuer bewusst grosszuegig (der stille Alt-Deckel war 5).
//     Rechnung fuer den Platz: 200 Eintraege x ~150 Byte = ~30 KB, gegen einen
//     localStorage-Rahmen von ~5 MB. Der Schluessel ist KAMPAGNENGEBUNDEN
//     (getActiveCampaignKey, core/data.js) — zwei Kampagnen duerfen sich ihre
//     Protokolle nicht vermischen.

// Deckel des Ringpuffers. Modulkonstante mit Rueckfallwert, Muster wie
// DICE_STATS_MAX_RECORDS in features/dice-stats/dice-stats-idb.js und UNDO_LIMIT
// in systems/undo.js. Verdraengt wird das AELTESTE, nie das Neueste.
const KPLOG_DECKEL = (typeof window !== 'undefined' && window.APP_CONFIG?.COMBAT_LOG_MAX) || 200;

// Die Kategorien, nach denen das Panel filtert. `alles` ist kein Wert, den ein
// Eintrag traegt — es ist der Name des ungefilterten Blicks.
const KPLOG_STANDARD_KATEGORIE = 'system';
const KPLOG_KATEGORIEN = ['system', 'kampf'];

// Verzoegerung fuer das Zurueckschreiben. Ein Mob-Sammelangriff loest mehrere
// Meldungen in derselben Ereignisschleife aus; ohne Verzoegerung waere das
// ebenso viele JSON.stringify-Durchlaeufe ueber den ganzen Puffer.
const KPLOG_SCHREIB_VERZOEGERUNG = 400;

// Der Zusatz, der den Protokollschluessel aus dem Kampagnenschluessel ableitet.
// EXPORTIERT (nach window), weil die Loeschpfade in
// systems/spellslots/persistence.js ihn brauchen: removeCampaignData() raeumt
// die Schluessel EINER Kampagne auf, und dieser hier traegt Namen von
// Charakteren, NSCs und Monstern. Solange er dort fehlte, ueberlebte
// Kampagneninhalt die ausdrueckliche Loeschung ("Alle Daten loeschen") und
// stand nach dem Neustart wieder im Panel. Eine zweite Abschrift der
// Zeichenkette dort waere genau die Drift, die den Befund erzeugt hat — deshalb
// steht sie hier einmal.
const KPLOG_SCHLUESSEL_SUFFIX = '::kampfprotokoll';

let kpLogPuffer = [];
let kpLogNaechsteNr = 1;
let kpLogSchreibTimer = null;
let kpLogGeladen = false;

/**
 * Der Speicherschluessel dieses Protokolls — kampagnengebunden.
 * @returns {string}
 */
function kpLogSpeicherSchluessel() {
    let basis = null;
    if (typeof window !== 'undefined' && typeof window.getActiveCampaignKey === 'function') {
        basis = window.getActiveCampaignKey();
    }
    if (!basis && typeof window !== 'undefined') {
        basis = window.APP_CONFIG?.STORAGE_KEY || null;
    }
    return (basis || 'dnd-tracker-v4') + KPLOG_SCHLUESSEL_SUFFIX;
}

/**
 * Liest rohen Text aus dem Speicher. Nutzt StorageAPI, wenn vorhanden (dort
 * liegt der zentrale try/catch des Projekts), sonst direkt — dieses Modul muss
 * sich fuer seinen Unit-Vertrag ohne den Rest der App laden lassen.
 * @param {string} schluessel
 * @returns {string|null}
 */
function kpLogLiesRoh(schluessel) {
    if (typeof window !== 'undefined' && typeof window.StorageAPI?.get === 'function') {
        return window.StorageAPI.get(schluessel, null);
    }
    try {
        return localStorage.getItem(schluessel);
    } catch {
        // Private Browsing / SecurityError: das Protokoll lebt dann nur in dieser Sitzung
        return null;
    }
}

/**
 * Schreibt rohen Text in den Speicher.
 * @param {string} schluessel
 * @param {string} wert
 */
function kpLogSchreibRoh(schluessel, wert) {
    if (typeof window !== 'undefined' && typeof window.StorageAPI?.set === 'function') {
        window.StorageAPI.set(schluessel, wert);
        return;
    }
    try {
        localStorage.setItem(schluessel, wert);
    } catch {
        // Voll oder gesperrt — ein verlorenes Protokoll darf niemals einen Wurf aufhalten
    }
}

/**
 * Normalisiert einen gelesenen Eintrag. Ein Stand aus dem Speicher ist Daten,
 * nicht Code: Typ und Kategorie werden gegen die erlaubten Werte geprueft, der
 * Text wird auf eine Zeichenkette gezwungen.
 * @param {*} roh
 * @returns {{nr:number,text:string,typ:string,kategorie:string,zeit:number}|null}
 */
function kpLogNormalisiere(roh) {
    if (!roh || typeof roh !== 'object') return null;
    const text = typeof roh.text === 'string' ? roh.text : String(roh.text ?? '');
    if (text === '') return null;
    const typ = ['success', 'error', 'warning', 'info'].includes(roh.typ) ? roh.typ : 'info';
    const kategorie = KPLOG_KATEGORIEN.includes(roh.kategorie)
        ? roh.kategorie
        : KPLOG_STANDARD_KATEGORIE;
    const zeit = Number.isFinite(roh.zeit) ? roh.zeit : 0;
    const nr = Number.isFinite(roh.nr) ? roh.nr : 0;
    return { nr, text, typ, kategorie, zeit };
}

/**
 * Laedt den gespeicherten Stand — genau einmal, beim ersten Zugriff.
 * Ein kaputter Speicherinhalt ergibt ein LEERES Protokoll, keinen Absturz.
 */
function ladeKampfprotokoll() {
    if (kpLogGeladen) return;
    kpLogGeladen = true;
    const roh = kpLogLiesRoh(kpLogSpeicherSchluessel());
    if (!roh) return;
    let liste = null;
    try {
        liste = JSON.parse(roh);
    } catch {
        return;
    }
    if (!Array.isArray(liste)) return;
    kpLogPuffer = liste
        .map(kpLogNormalisiere)
        .filter(e => e !== null)
        .slice(0, KPLOG_DECKEL);
    kpLogNaechsteNr = kpLogPuffer.reduce((max, e) => Math.max(max, e.nr), 0) + 1;
}

/**
 * Schreibt den Puffer sofort zurueck.
 */
function schreibeKampfprotokoll() {
    if (kpLogSchreibTimer) {
        clearTimeout(kpLogSchreibTimer);
        kpLogSchreibTimer = null;
    }
    let text = '[]';
    try {
        text = JSON.stringify(kpLogPuffer);
    } catch {
        return;
    }
    kpLogSchreibRoh(kpLogSpeicherSchluessel(), text);
}

/**
 * Plant das Zurueckschreiben. Mehrere Meldungen in derselben Ereignisschleife
 * ergeben genau einen Schreibvorgang.
 */
function schreibeKampfprotokollVerzoegert() {
    if (kpLogSchreibTimer) clearTimeout(kpLogSchreibTimer);
    kpLogSchreibTimer = setTimeout(() => {
        kpLogSchreibTimer = null;
        schreibeKampfprotokoll();
    }, KPLOG_SCHREIB_VERZOEGERUNG);
}

/**
 * Nimmt eine Meldung ins Protokoll auf. Wird von showToast() fuer JEDE Meldung
 * gerufen — auch fuer die, die keine Kategorie mitbringt.
 * @param {string} text - Der Meldungstext, unveraendert wie angezeigt
 * @param {string} [typ] - success | error | warning | info
 * @param {string} [kategorie] - 'kampf' fuer Ereignisse im Kampf, sonst 'system'
 * @returns {{nr:number,text:string,typ:string,kategorie:string,zeit:number}}
 */
function pushCombatLog(text, typ, kategorie) {
    ladeKampfprotokoll();
    const eintrag = {
        nr: kpLogNaechsteNr++,
        text: typeof text === 'string' ? text : String(text ?? ''),
        typ: ['success', 'error', 'warning', 'info'].includes(typ) ? typ : 'info',
        kategorie: KPLOG_KATEGORIEN.includes(kategorie) ? kategorie : KPLOG_STANDARD_KATEGORIE,
        zeit: Date.now()
    };
    kpLogPuffer.unshift(eintrag);
    // Deckel: das AELTESTE fliegt, nie das Neueste. Genau das war der Fehler des
    // alten stillen Deckels bei fuenf DOM-Eintraegen nicht — der verdraengte
    // ebenfalls von hinten, aber bei 5 statt bei 200, und ohne Puffer dahinter.
    while (kpLogPuffer.length > KPLOG_DECKEL) kpLogPuffer.pop();
    schreibeKampfprotokollVerzoegert();
    // Das Panel, falls es offen ist, aktualisiert sich selbst. Der Kern kennt
    // das Fenster nur ueber diesen einen optionalen Aufruf.
    if (typeof window !== 'undefined' && typeof window.renderCombatLogIfOpen === 'function') {
        window.renderCombatLogIfOpen();
    }
    return eintrag;
}

/**
 * Liest das Protokoll. Gibt eine KOPIE zurueck — der Aufrufer (Panel, Test)
 * darf den Puffer nicht umschreiben koennen.
 * @param {string} [kategorie] - 'kampf' filtert; nichts oder 'alles' filtert nicht
 * @returns {Array<{nr:number,text:string,typ:string,kategorie:string,zeit:number}>}
 */
function getCombatLog(kategorie) {
    ladeKampfprotokoll();
    const gefiltert =
        kategorie && kategorie !== 'alles'
            ? kpLogPuffer.filter(e => e.kategorie === kategorie)
            : kpLogPuffer;
    return gefiltert.map(e => ({ ...e }));
}

/**
 * Leert Puffer UND Speicher.
 */
function clearCombatLog() {
    ladeKampfprotokoll();
    kpLogPuffer = [];
    schreibeKampfprotokoll();
}

if (typeof window !== 'undefined') {
    window.KPLOG_DECKEL = KPLOG_DECKEL;
    window.KPLOG_SCHLUESSEL_SUFFIX = KPLOG_SCHLUESSEL_SUFFIX;
    window.KPLOG_KATEGORIEN = KPLOG_KATEGORIEN;
    window.KPLOG_STANDARD_KATEGORIE = KPLOG_STANDARD_KATEGORIE;
    window.kpLogSpeicherSchluessel = kpLogSpeicherSchluessel;
    window.ladeKampfprotokoll = ladeKampfprotokoll;
    window.schreibeKampfprotokoll = schreibeKampfprotokoll;
    window.pushCombatLog = pushCombatLog;
    window.getCombatLog = getCombatLog;
    window.clearCombatLog = clearCombatLog;
}
