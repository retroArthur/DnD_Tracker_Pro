// [SECTION:MOBILE_HEADER_MENU]
// ============================================================
// DAS PUNKTE-MENUE IM MOBIL-KOPF (MKOPF)
// @aria @keyboard @mobile
// ============================================================
//
// WAS HIER PASSIERT, IN EINEM SATZ: dieses Modul fuellt das leere Menue
// `#mobile-header-menu` bei jedem Oeffnen AUS der Kopfzeile und schaltet es
// auf — es bringt selbst keine Liste der Kopfzeilen-Aktionen mit und keine
// Zeile Pfeiltastenlogik.
//
// DER BEFUND. `[data-layout="mobile"] .header-actions { display: none }`
// (`assets/styles/core.css`) blendet die ganze Knopfreihe der Kopfzeile aus,
// und das Layoutprofil folgt seit der Mobil-Runde dem Fenster
// (`ui/layout-profiles.js`). Gemessen am Buendel zu 28bcab2, gefuellte
// Kampagne, alle sieben `.header-action-btn`, Urteil aus `checkVisibility`
// UND Rechteck UND `elementFromPoint` auf der Knopfmitte:
//
//   1440 / 1200 px             7 von 7 bedienbar
//    900 px                    4 von 7  — redo (x=921),
//                              show-shortcuts-overlay (x=965) und
//                              toggle-layout (x=1009) liegen AUSSERHALB
//                              des 900px-Fensters
//    680 / 390 / 360 / 320 px  0 von 7
//
// Drei der sieben Aktionen faengt der Mobil-Kopf schon auf (`undo`,
// `toggle-combat-log`, `toggle-layout`). VIER hatten auf dem Telefon keinen
// eigenen Weg: `show-about-modal`, `toggle-quick-notes`, `redo` und
// `show-shortcuts-overlay`. Fuer `redo` und `show-about-modal` gibt es im
// ganzen Vorlagenbaum keinen zweiten Knopf; `show-shortcuts-overlay` hat
// einen, aber er liegt drei Griffe tief im Debug-Dialog — und der Kommentar
// in `header.html` nennt genau diesen Fall selbst als Begruendung dafuer,
// warum ein Dialogweg keiner ist: "deshalb hat ihn niemand gefunden."
//
// `toggle-quick-notes` galt dabei als vom Mobil-Kopf aufgefangen. Gemessen
// stimmt das nur fuer die HANDLUNG, nicht fuer den Knopf: der Mobil-Kopf
// traegt `call/showMobileQuickNotes`, und das ist eine andere Aktion mit
// einer eigenen Schale (`#mobile-quicknotes-modal`,
// `utils/performance-extras.js`). Beide schreiben `D.quickNotes`. Das Menue
// traegt darum den Kopfzeilen-Knopf selbst.
//
// ------------------------------------------------------------------
// WARUM DIE EINTRAEGE ZUR LAUFZEIT ENTSTEHEN UND NICHT IM MARKUP STEHEN
//
// Weil es sonst ZWEI Listen der Kopfzeilen-Aktionen gaebe: eine in
// `header.html` und eine im Mobil-Kopf. Das ist genau die Lage, die
// `buildEditorToolbar()` fuer die 24 Editor-Leisten aufgeloest hat ("Das
// Markup ALLER 24 Leisten kommt aus genau einer Quelle"), und sie hat
// dieselbe Krankheit: der naechste Kopfzeilen-Knopf landet in einer der
// beiden Listen und in der anderen nicht. Hier gibt es nur `header.html`;
// ein achter Knopf steht ohne weiteres Zutun im Menue, und der Waechter
// (`tests/e2e/features/mobil-kopfmenue.spec.js`) liest seine Erwartung aus
// derselben Quelle.
//
// BEI JEDEM OEFFNEN NEU, nicht einmal beim Start. Zwei der sieben Knoepfe
// tragen einen ZUSTAND im Markup: `#layout-icon` wechselt zwischen 🖥️ und
// 📱 (`updateLayoutSwitcher()`), und `[data-action="toggle-combat-log"]`
// fuehrt ein `aria-expanded`, das `features/combat-log/combat-log-render.js`
// an JEDEM Traeger nachzieht (`querySelectorAll(
// '[data-action="toggle-combat-log"][aria-expanded]')`). Ein einmal gebautes
// Menue zeigte beides vom Startzeitpunkt. Neu gebaut zeigt es den Iststand —
// und der Eintrag bekommt sein `aria-expanded` mit, wird also von jenem
// Nachzieher ab dem naechsten Umschalten selbst mitversorgt.
//
// KEIN `innerHTML` UND KEIN SANITIZER. Symbol und Beschriftung gehen ueber
// `textContent`, die Attribute ueber `setAttribute`. Die Werte kommen aus
// `header.html` und nicht aus dem Datenbestand; `textContent` macht die
// Frage trotzdem gegenstandslos, statt sie zu beantworten.
//
// WAS NICHT MITKOMMT: die `id`. `#kampflog-toggle` und `#layout-switcher`
// sind einmalig und werden namentlich adressiert (`updateLayoutSwitcher()`
// greift `$('layout-icon')`); eine Abschrift mit derselben `id` nahm dem
// Original den Zugriff. Mitkommen `data-action`, `data-value`,
// `aria-controls`, `aria-expanded` und `title`.
//
// ------------------------------------------------------------------
// DIE TASTATUR KOMMT AUS E-2, NICHT VON HIER
//
// Das Menue ist eine GRUPPE im Sinne von `ui/keyboard-group.js`: ein
// Tabulatorhalt, Pfeiltasten darin, `Pos1`/`Ende`, kein Umlauf,
// Haltgedaechtnis. Angemeldet ist es in `ui/keyboard-group-views.js` bei den
// uebrigen; hier steht nur der Anstoss `KeyboardGroup.aktualisieren()` nach
// dem Aufbau, damit der Halt schon sitzt, wenn der erste Tabulatordruck
// kommt (der Beobachter dort laeuft erst im naechsten Bild).
//
// WARUM `Escape` NICHT HIER HAENGT. Der Ausweg der ganzen App laeuft in
// EINEM Zweig (`systems/spellslots/keyboard-shortcuts.js`), der die Schichten
// der Reihe nach abbaut — Tastenhilfe, Schnellreferenz, dann dieses Menue,
// dann die Dialoge. Ein eigener Lauscher hier haette das Menue auch dann
// geschlossen, wenn darueber die Tastenhilfe stand.

/** Die Kopfzeilen-Knoepfe — DIE EINE Quelle der Liste. */
const MKOPF_QUELLE = '.header-actions .header-action-btn';

/** Attribute, die eine Abschrift mitnimmt. `id` steht absichtlich nicht
 *  dabei; die Begruendung steht im Kopf. */
const MKOPF_ATTRIBUTE = ['data-action', 'data-value', 'aria-controls', 'aria-expanded', 'title'];

/**
 * Der Punkte-Knopf, oder `null`.
 * @returns {HTMLElement|null}
 */
function mobileHeaderMenuButton() {
    return /** @type {HTMLElement|null} */ (document.getElementById('mobile-header-menu-btn'));
}

/**
 * Das Menue, oder `null`.
 * @returns {HTMLElement|null}
 */
function mobileHeaderMenuPanel() {
    return /** @type {HTMLElement|null} */ (document.getElementById('mobile-header-menu'));
}

/**
 * Steht das Menue offen?
 * @returns {boolean}
 */
function isMobileHeaderMenuOpen() {
    const menu = mobileHeaderMenuPanel();
    return !!menu && !menu.hidden;
}

/**
 * Baut die Eintraege aus der Kopfzeile. Leert das Menue zuvor — der Aufbau
 * ist der Normalfall und laeuft bei jedem Oeffnen.
 * @returns {number} Zahl der gebauten Eintraege
 */
function buildMobileHeaderMenu() {
    const menu = mobileHeaderMenuPanel();
    if (!menu) return 0;
    const quellen = Array.from(document.querySelectorAll(MKOPF_QUELLE));
    menu.textContent = '';
    for (const quelle of quellen) {
        const eintrag = document.createElement('button');
        eintrag.type = 'button';
        eintrag.className = 'mobile-header-menu-item';
        for (const name of MKOPF_ATTRIBUTE) {
            const wert = quelle.getAttribute(name);
            if (wert !== null) eintrag.setAttribute(name, wert);
        }

        const symbol = document.createElement('span');
        symbol.className = 'mobile-header-menu-icon';
        symbol.setAttribute('aria-hidden', 'true');
        symbol.textContent = (quelle.textContent || '').trim();

        const wort = document.createElement('span');
        wort.className = 'mobile-header-menu-label';
        // DIE BESCHRIFTUNG, NICHT DAS SYMBOL. Ein Vorleseprogramm liest ein
        // Symbol als nichts Nuetzliches; `aria-label` traegt in `header.html`
        // den ausgeschriebenen Namen ("Letzte Aktion rueckgaengig machen"),
        // `title` den kurzen mit Kuerzel ("Rueckgaengig (Strg+Z)"). Der
        // kurze steht im Menue und der lange im Namen des Eintrags — darum
        // bleibt `aria-label` NICHT am Eintrag haengen: ein `aria-label`
        // verdeckte den sichtbaren Text, und dann stimmte das Gesprochene
        // nicht mehr mit dem Gelesenen ueberein.
        const kurz = (quelle.getAttribute('title') || '').trim();
        const lang = (quelle.getAttribute('aria-label') || '').trim();
        wort.textContent = kurz || lang || quelle.getAttribute('data-action') || '';

        eintrag.appendChild(symbol);
        eintrag.appendChild(wort);
        menu.appendChild(eintrag);
    }
    return quellen.length;
}

/**
 * Oeffnet das Menue. Baut die Eintraege neu und stoesst den Gruppenlauf an.
 */
function openMobileHeaderMenu() {
    const knopf = mobileHeaderMenuButton();
    const menu = mobileHeaderMenuPanel();
    if (!knopf || !menu) return;
    buildMobileHeaderMenu();
    menu.hidden = false;
    knopf.setAttribute('aria-expanded', 'true');
    // Der Halt soll sitzen, BEVOR der erste Tabulatordruck kommt. Der
    // Beobachter in KeyboardGroup laeuft erst im naechsten Bild.
    if (window.KeyboardGroup && typeof window.KeyboardGroup.aktualisieren === 'function') {
        window.KeyboardGroup.aktualisieren();
    }
}

/**
 * Schliesst das Menue.
 * @param {{fokusZurueck?: boolean}} [opt] `fokusZurueck` gibt den Fokus an
 *        den Punkte-Knopf zurueck — der Weg, den `Escape` nimmt. Bei einem
 *        Klick daneben bleibt der Fokus, wo die Hand ihn hingesetzt hat.
 * @returns {boolean} Wahr, wenn etwas zu schliessen war
 */
function closeMobileHeaderMenu(opt) {
    const knopf = mobileHeaderMenuButton();
    const menu = mobileHeaderMenuPanel();
    if (!knopf || !menu) return false;
    const war = !menu.hidden;
    menu.hidden = true;
    knopf.setAttribute('aria-expanded', 'false');
    // DIE EINTRAEGE BLEIBEN STEHEN, obwohl sie beim naechsten Oeffnen neu
    // entstehen. Sie zu leeren waere eine Mutation am Dokument bei jedem
    // Schliessen und damit ein Gruppendurchlauf mehr; und ein Menue mit null
    // Gliedern laesst `KeyboardGroup` seine Rolle abraeumen (Befund 7 der
    // Gegenpruefung dort), die es beim Oeffnen neu setzen muesste. Weggeschaltet
    // ist `hidden` genug: `_bedienbar()` sieht keines der Glieder.
    if (war && opt && opt.fokusZurueck && typeof knopf.focus === 'function') {
        knopf.focus();
    }
    return war;
}

/**
 * Schaltet das Menue um. Der Weg, den `data-action="toggle-mobile-header-menu"`
 * nimmt.
 */
function toggleMobileHeaderMenu() {
    if (isMobileHeaderMenuOpen()) closeMobileHeaderMenu();
    else openMobileHeaderMenu();
}

/**
 * Haengt die zwei Lauscher ein, die das Menue von aussen schliessen.
 */
function initMobileHeaderMenu() {
    // (1) EIN KLICK DANEBEN. `mousedown` und nicht `click`, aus demselben
    //     gemessenen Grund wie in `ui/editors/rich-text-toolbars.js`: der
    //     Verteiler laeuft auf `click`, und ein `click`-Lauscher hier haette
    //     das Menue geschlossen, bevor der Verteiler seine Aktion gefunden
    //     hat. Der Anker (`.mobile-header-more`) deckt Knopf UND Menue ab —
    //     der Knopf schaltet selbst um, das Menue hat (2).
    document.addEventListener('mousedown', ev => {
        if (!isMobileHeaderMenuOpen()) return;
        const ziel = /** @type {Element|null} */ (ev.target);
        if (ziel && typeof ziel.closest === 'function' && ziel.closest('.mobile-header-more')) {
            return;
        }
        closeMobileHeaderMenu();
    });

    // (2) EINE HANDLUNG SCHLIESST DAS MENUE — aber ERST, nachdem sie gelaufen
    //     ist.
    //
    //     DER LAUSCHER HAENGT AM `document` IN DER FANGPHASE, und das ist
    //     gemessen noetig: `ui/event-delegation.js` haengt dort ebenfalls in
    //     der Fangphase und ruft `e.stopPropagation()`, BEVOR es die Aktion
    //     ausfuehrt. Ein Lauscher am Menue selbst wird damit NIE erreicht —
    //     nachgewiesen mit einer Probe in der Fangphase am Menueknoten, die
    //     bei einem echten Klick auf einen Eintrag nicht ein einziges Mal
    //     anschlug, waehrend die Aktion lief (die Tastenhilfe ging auf,
    //     `aria-expanded` blieb auf "true"). `stopPropagation()` haelt
    //     weitere KNOTEN auf, nicht weitere Lauscher am SELBEN Knoten —
    //     darum greift dieser hier unabhaengig von der Anmeldereihenfolge.
    //
    //     DAS SCHLIESSEN STEHT IN EINEM MIKROTASK, ebenfalls aus einem
    //     gemessenen Grund: in der Fangphase am `document` ist noch gar nicht
    //     entschieden, ob die Aktion laeuft, und setzte man `hidden` sofort,
    //     bekaeme `ui/modal-focus.js` einen WEGGESCHALTETEN Knoten als
    //     Oeffner des Dialogs eingetragen — der Rueckweg per `Escape` zielte
    //     danach auf etwas Unsichtbares. Der Mikrotask laeuft nach der
    //     ganzen Zustellung, also nach der Aktion.
    document.addEventListener(
        'click',
        ev => {
            if (!isMobileHeaderMenuOpen()) return;
            const ziel = /** @type {Element|null} */ (ev.target);
            if (!ziel || typeof ziel.closest !== 'function') return;
            if (!ziel.closest('.mobile-header-menu-item')) return;
            Promise.resolve().then(() => closeMobileHeaderMenu());
        },
        { capture: true }
    );
}

window.isMobileHeaderMenuOpen = isMobileHeaderMenuOpen;
window.openMobileHeaderMenu = openMobileHeaderMenu;
window.closeMobileHeaderMenu = closeMobileHeaderMenu;
window.toggleMobileHeaderMenu = toggleMobileHeaderMenu;
window.buildMobileHeaderMenu = buildMobileHeaderMenu;

// Selbstaufruf, dasselbe Muster wie `ui/keyboard-group-views.js`,
// `ui/keyboard-reach.js` und `ui/modal-focus.js`: die Lauscher haengen an
// nichts aus dem Datenbestand und sollen greifen, auch wenn eine spaetere
// init-Stufe scheitert.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initMobileHeaderMenu(), { once: true });
} else {
    initMobileHeaderMenu();
}
