// [SECTION:RICH_TEXT_INSERT]
// Rich Text Editor — Einfügen, Zwischenablage, Tastatur, Tabelle.
// Selektion/Zeichenformatierung: ui/editors/rich-text.js. Floating- und
// Kontext-Toolbars: ui/editors/rich-text-toolbars.js.
// ============================================================
// EDITOR FORMATTING — EINFÜGEN/ZWISCHENABLAGE/TASTATUR/TABELLE
// ============================================================
function initEditorPasteHandlers() {
    if (editorHandlersInitialized) return;
    editorHandlersInitialized = true;
    const editorIds = [
        'char-notes',
        'npc-desc',
        'loc-desc',
        'quest-desc',
        'quest-epilog',
        'enc-traits',
        'enc-equipment',
        'enc-actions',
        'enc-skills',
        'loot-desc',
        'spell-desc',
        'spell-note',
        'session-text',
        'link-desc',
        'wiki-content',
        'quick-ref-entry-content'
    ];
    // Migrationsgruppe G (Plan 09-09, letzte Call-Site): Der Setup-Aufruf der
    // deprecated Editier-Kommando-API entfällt ersatzlos. Empirisch belegt
    // (09-BASELINE.md, Abschnitt A1): reguläres Enter wird von
    // handleEditorKeydown() immer abgefangen (insertLineBreakAtSelection()),
    // native Absatztrennung greift hier nie; Shift+Enter fällt zwar zur
    // nativen Browser-Behandlung durch, ist aber browserübergreifend als
    // weicher Zeilenumbruch (<br>) spezifiziert — der Browser verwendet hier
    // bereits den in A1 protokollierten Absatztrenner als Vorgabe, unabhängig
    // vom Setup-Aufruf. Der A1-Referenztest (editor-insert.spec.js) bleibt
    // unverändert und beweist das messbar.
    editorIds.forEach(id => {
        const editor = $(id);
        if (editor && editor.getAttribute('contenteditable') === 'true') {
            editor.addEventListener('paste', handleEditorPaste);
            editor.addEventListener('input', handleMarkdownInput);
        }
    });
    document.addEventListener(
        'paste',
        function (e) {
            const target = e.target;
            if (
                target.classList.contains('rich-editor') ||
                target.classList.contains('dialog-text-area')
            ) {
                handleEditorPaste(e);
            }
        },
        true
    );
    document.addEventListener(
        'input',
        function (e) {
            const target = e.target;
            if (
                target.classList.contains('rich-editor') ||
                target.classList.contains('dialog-text')
            ) {
                handleMarkdownInput(e);
            }
        },
        true
    );
    document.addEventListener(
        'keydown',
        function (e) {
            const target = e.target;
            if (
                target.classList.contains('rich-editor') ||
                target.classList.contains('dialog-text-area')
            ) {
                handleEditorKeydown(e);
            }
        },
        true
    );
}
// Migrationsstufe 3 (Plan 09-08, Gruppe E): Ersatz fuer die deprecated
// Editier-Kommando-API ('insertHTML'|'insertText') ueber eine Range-eigene
// Parse-Funktion (Range.createContextualFragment()). Korrektur (Plan 10-06,
// CR-01): die urspruengliche Behauptung, diese Parse-Funktion fuehre
// Skript-Inhalte laut Spezifikation grundsaetzlich nicht aus, war unpraezise
// und gilt NUR fuer parser-erzeugte <script>-Elemente (die sind laut Spec
// inert). Sie gilt NICHT fuer ein eingebettetes Rahmen-Element mit
// Inline-Dokument-Attribut (<iframe srcdoc>) — dessen Inhalt laeuft im
// eigenen, aber origin-erbenden Browsing-Kontext und wird beim Einfuegen
// sofort ausgefuehrt (empirisch bestaetigt, 10-REVIEW.md CR-01). Diese
// Funktion fuegt AUSSCHLIESSLICH ein, sie bereinigt nicht — die Bereinigung
// liegt vollstaendig beim Aufrufer: handleEditorPaste()s Tabellenzweig fuehrt
// sein Markup seit Plan 10-06 durch den projektweiten Allowlist-Sanitizer
// window.sanitizeHTML() (utils/basic.js) als LETZTE Stufe vor diesem Aufruf;
// die Whitelist beim Speichern bleibt zusaetzlich unveraendert nachgeschaltet.
// Modul-intern, kein window-Export (CLAUDE.md "Export Audit Rule").
//
// Stil-Nachbereinigung (D-02, byte-gleiches Markup): die alte
// 'insertHTML'-Editier-Kommando-API wendet auf eingefuegte Inline-Styles
// empirisch eine feste Bereinigung an (per Probe-Skripten gegen das gebaute
// Bundle verifiziert, Chromium 143.0.7499.4, siehe 09-08-SUMMARY.md): Die
// Layout-Eigenschaften padding/margin/width/border-collapse werden IMMER
// entfernt. Bleiben danach mehr als eine Deklaration uebrig, wird eine darin
// enthaltene 'background'-Kurzform in acht LEERE Langform-Eigenschaften
// aufgesplittet und eine enthaltene 'color'-Deklaration ersatzlos entfernt —
// ein reproduzierbarer Chromium-Effekt bei Mehrfach-Deklarationen mit
// CSS-Custom-Property-Werten, der 'border' NICHT betrifft.
// Range.createContextualFragment() durchlaeuft diese Editier-Kommando-eigene
// Bereinigung nicht (reines DOM-Parsing) — die Funktion unten repliziert sie
// bewusst, ausschliesslich fuer neu eingefuegte Elemente, damit das erzeugte
// Markup byte-gleich zur Baseline bleibt.
const STRIP_STYLE_PROPS = new Set(['padding', 'margin', 'width', 'border-collapse']);
const EMPTY_BACKGROUND_LONGHANDS = [
    'background-image',
    'background-position-x',
    'background-position-y',
    'background-size',
    'background-repeat',
    'background-attachment',
    'background-origin',
    'background-clip'
];
function sanitizeInsertedInlineStyle(el) {
    const raw = el.getAttribute('style');
    if (!raw) return;
    const declarations = raw
        .split(';')
        .map(d => d.trim())
        .filter(Boolean)
        .map(d => {
            const idx = d.indexOf(':');
            return idx === -1 ? null : [d.slice(0, idx).trim().toLowerCase(), d.slice(idx + 1).trim()];
        })
        .filter(Boolean);
    const kept = declarations.filter(([name]) => !STRIP_STYLE_PROPS.has(name));
    const stripped = kept.length !== declarations.length;
    if (kept.length === 0) {
        el.removeAttribute('style');
        return;
    }
    if (kept.length === 1 && !stripped) {
        return;
    }
    if (kept.length === 1) {
        el.setAttribute('style', `${kept[0][0]}: ${kept[0][1]};`);
        return;
    }
    const expanded = [];
    kept.forEach(([name, value]) => {
        if (name === 'background') {
            EMPTY_BACKGROUND_LONGHANDS.forEach(longhand => expanded.push(`${longhand}: ;`));
        } else if (name !== 'color') {
            expanded.push(`${name}: ${value};`);
        }
    });
    el.setAttribute('style', expanded.join(' '));
}
// Cursor-Position nach dem Einfuegen: die alte 'insertHTML'-Editier-Kommando-
// API platziert den Cursor empirisch NICHT als Geschwister-Knoten hinter dem
// zuletzt eingefuegten Top-Level-Knoten, sondern am tiefsten letzten
// Nachfahren (z.B. innerhalb der letzten Tabellenzelle, direkt hinter deren
// Textinhalt). Der Abstieg unten repliziert das bewusst, damit das erzeugte
// Markup byte-gleich zur Baseline bleibt (unabhaengig von Fund 3 — dieses
// Verhalten gilt fuer jeden einzelnen insertHtmlAtSelection()-Aufruf, auch
// nach dessen Behebung am 2026-09-06. Vor der Behebung war diese Ablage genau
// der Grund, warum ein doppelt feuernder Paste-Listener eine VERSCHACHTELTE
// statt einer Geschwister-Tabelle erzeugte: die zweite Einfuegung landete am
// hier beschriebenen tiefsten Nachfahren des ersten Einfuegeergebnisses,
// siehe 09-BASELINE.md, Fund 3, Abschnitt „Resolution").
function insertHtmlAtSelection(htmlString) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = range.createContextualFragment(htmlString);
    fragment.querySelectorAll('[style]').forEach(sanitizeInsertedInlineStyle);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);
    if (lastNode) {
        let deepest = lastNode;
        while (deepest.lastChild) {
            deepest = deepest.lastChild;
        }
        if (deepest.nodeType === Node.TEXT_NODE) {
            range.setStart(deepest, deepest.length);
        } else {
            range.setStartAfter(deepest);
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
function insertTextAtSelection(text) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}
// Migrationsstufe 3 (Plan 09-08, Gruppe F): Ersatz fuer die deprecated
// 'insertLineBreak'-Editier-Kommando-API (09-RESEARCH.md Pattern 4). Fuegt
// einen <br>-Knoten an der Selektion ein, sodass unmittelbar weitergetippter
// Text hinter dem Umbruch landet — byte-gleich zur 09-BASELINE.md-Referenz
// ('ZeileEins<br>ZeileZwei', kein zusaetzlicher Knoten im Endergebnis).
//
// Platzhalter-Knoten noetig (empirisch verifiziert, siehe Task-Vorgabe):
// Chromium platziert eine Selektion, die per Range/Selection-API auf die
// Position UNMITTELBAR HINTER einem abschliessenden <br> ohne nachfolgenden
// Inhalt zeigt (egal ob per Container-Kindindex oder per leerem
// Rest-Textknoten adressiert), beim naechsten Tippen NICHT stabil dort —
// der neue Text landet stattdessen kommentarlos VOR dem <br>, der Umbruch
// selbst wandert ans Ende. Ein Textknoten mit sichtbarem (wenn auch
// unsichtbarem Zero-Width-Space-)Inhalt nach dem <br> gibt der Selektion
// einen stabilen Text-Anker, an dem Chromium die Cursor-Position korrekt
// haelt. Der Platzhalter wird beim naechsten echten Tastatur-Input (oder
// beim Verlassen des Editors, falls nie weitergetippt wird) automatisch per
// deleteData() entfernt — deleteData() an der exakten Zeichen-Position laesst
// eine Selektion, die GENAU an der Loeschgrenze steht, unangetastet (im
// Gegensatz zu einer kompletten .data-Neuzuweisung, die eine solche
// Selektion auf den Anfang zurueckwirft), sodass unmittelbar weitergetippter
// Text nicht verspringt und das Endergebnis keinen Zero-Width-Space enthaelt.
function insertLineBreakAtSelection() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const br = document.createElement('br');
    range.insertNode(br);
    const editor = br.parentNode;
    let placeholder = br.nextSibling;
    if (!placeholder || placeholder.nodeType !== Node.TEXT_NODE) {
        placeholder = document.createTextNode('');
        br.after(placeholder);
    }
    const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
    placeholder.data = ZERO_WIDTH_SPACE;
    const newRange = document.createRange();
    newRange.setStart(placeholder, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    const cleanupPlaceholder = () => {
        if (placeholder.isConnected) {
            const zwspIndex = placeholder.data.indexOf(ZERO_WIDTH_SPACE);
            if (zwspIndex !== -1) placeholder.deleteData(zwspIndex, 1);
        }
        editor.removeEventListener('input', cleanupPlaceholder);
        editor.removeEventListener('blur', cleanupPlaceholder);
    };
    editor.addEventListener('input', cleanupPlaceholder, { once: true });
    editor.addEventListener('blur', cleanupPlaceholder, { once: true });
}
function handleEditorKeydown(e) {
    // Strg/Cmd+Shift+V = ohne Formatierung einfuegen. Der Merker wird hier
    // gesetzt und im paste-Handler ausgewertet; der Browser liefert im
    // paste-Ereignis selbst keine Information darueber, welche Tastenkombination
    // es ausgeloest hat.
    if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        editorForcePlainPaste = true;
        return;
    }
    if (e.key === 'T' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        floatingToolbarTarget = e.target;
        insertTable();
        return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
        // W-13: Enter verlaesst einen Baustein, statt darin eine Zeile
        // anzufuegen. Muss VOR dem regulaeren Zweig stehen — jener ruft
        // stopImmediatePropagation() in der Capture-Phase, jeder spaeter
        // registrierte keydown-Listener saehe Enter im Editor nie.
        // Tabellen ausgenommen: dort ist Enter in einer Zelle das erwartete
        // Browserverhalten.
        const selection = window.getSelection();
        let node = selection && selection.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        const block = node?.closest?.(EDITOR_BLOCK_SELECTOR);
        const inTable = node?.closest?.('table');
        if (block && !inTable) {
            const editor = node.closest(window.EDITOR_HOST_SELECTOR);
            // Nur wenn der Block ein direktes Kind der Schreibflaeche ist —
            // sonst waere unklar, wohinter der neue Absatz gehoert.
            let top = block;
            while (top.parentElement && top.parentElement !== editor) {
                top = top.parentElement;
            }
            if (editor && top.parentElement === editor) {
                e.preventDefault();
                e.stopImmediatePropagation();
                const after = document.createElement('p');
                after.appendChild(document.createElement('br'));
                editor.insertBefore(after, top.nextSibling);
                const range = document.createRange();
                range.setStart(after, 0);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                return;
            }
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        insertLineBreakAtSelection();
    }
}
// Fund 3 (09-BASELINE.md, behoben 2026-09-06, erneut gefunden via Phase-13-UAT):
// handleEditorPaste() wurde fuer denselben physischen Paste-Vorgang aus bis zu
// DREI unabhaengigen Registrierungsstellen aufgerufen: (1) ein direkter
// Element-Listener fuer jede ID in initEditorPasteHandlers()s editorIds-Liste,
// (2) ein document-weiter Capture-Listener in derselben Funktion fuer jedes
// Element mit Klasse .rich-editor oder .dialog-text-area, (3) ein weiterer
// direkter Listener in features/npcs/npc-dialogs.js fuer dynamisch erzeugte
// NPC-Dialogfelder. Ein Listener auf dem Zielelement selbst feuert immer in
// der At-Target-Phase, unabhaengig von der Capture/Bubble-Konfiguration der
// uebrigen Listener — bei jedem betroffenen Editor liefen dadurch zwei (teils
// drei) Aufrufe pro echtem Paste, mit sichtbar verdoppeltem/verschachteltem
// Ergebnis. e.preventDefault() unterdrueckt nur das Standardverhalten des
// Browsers, nicht den zweiten Listener-Aufruf.
//
// Fix am Event, nicht an der Registrierung: alle Listener, die auf ein und
// denselben physischen Paste-Vorgang reagieren, erhalten dasselbe
// Event-Objekt (das ist unabhaengig davon, ob es 1, 2 oder 3 Registrierungen
// sind — ein registrierungsseitiger Fix muesste jede aktuelle UND kuenftige
// Registrierungsstelle einzeln korrekt halten). Ein Guard direkt am
// Event-Objekt haelt die Garantie "genau einmal einfuegen" unabhaengig von der
// Anzahl der Registrierungen: nur der zuerst ausgefuehrte Aufruf fuegt ein,
// jeder weitere Aufruf fuer denselben Event kehrt sofort zurueck. Editoren mit
// nur einer Registrierung (z. B. char-notes) sind unveraendert — der Guard
// greift dort beim ersten (einzigen) Aufruf und hat keinen zweiten Aufruf zu
// unterdruecken.
// Wird von Strg/Cmd+Shift+V gesetzt und vom naechsten paste-Ereignis
// verbraucht. Bewusst modulweit und nicht am Event: das keydown- und das
// paste-Ereignis sind zwei verschiedene Objekte.
let editorForcePlainPaste = false;

// Erlaubte Elemente beim formaterhaltenden Einfuegen. Alles andere wird
// aufgeloest (Inhalt bleibt, Huelle faellt weg).
const PASTE_ALLOWED_TAGS = new Set([
    'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'P', 'BR', 'UL', 'OL', 'LI',
    'A', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'TABLE', 'TBODY', 'TR', 'TD', 'TH'
]);

/**
 * Bereitet fremdes HTML aus der Zwischenablage auf.
 *
 * Der eigentliche Punkt ist das Entfernen ALLER Attribute ausser href an <a>:
 * fremde Schriftfarben, -groessen und Klassen sind genau die Ursache des
 * Effekts, den der Handoff als "gelben Wiki-Text" beschreibt — kopierter Text
 * brachte die Farbe seiner Herkunftsseite mit und blieb im dunklen Thema
 * unlesbar.
 *
 * KEINE Sicherheitskontrolle: die uebernimmt danach window.sanitizeHTML().
 *
 * GEPARST UND BEREINIGT WIRD AUSSCHLIESSLICH IM DOMParser-DOKUMENT.
 *
 * Das ist keine Stilfrage, sondern der Unterschied zwischen sicher und nicht:
 *   - div.innerHTML = <fremdes HTML> haengt die Knoten sofort ins LEBENDE
 *     Dokument; ein <img src="x" onerror="..."> laedt, scheitert und FUEHRT
 *     DEN HANDLER AUS, bevor irgendeine Bereinigung greift.
 *   - Auch das Umhaengen der geparsten Knoten in ein
 *     document.createElement('div') genuegt NICHT: dieses div gehoert dem
 *     lebenden Dokument, appendChild adoptiert die Knoten dorthin, und der
 *     Bildladevorgang startet — auch wenn das div nie im Baum haengt.
 * Beides ist beim Bau dieser Funktion nacheinander passiert und jeweils vom
 * Sicherheits-Regressionstest in tests/e2e/features/editor-insert.spec.js
 * gefangen worden ("Einfuege-Fragment mit Ereignis-Attribut und
 * Skript-Element"). Deshalb: nichts adoptieren, am Ende serialisieren.
 */
function sanitizePastedMarkup(html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const holder = parsed.body;

    holder.querySelectorAll('style, script, meta, link, img, svg').forEach(el => el.remove());

    // Ueberschriften auf fetten Absatz abbilden — die Editoren dieser App
    // kennen keine eigene Ueberschriftenebene.
    holder.querySelectorAll('h1, h2, h3').forEach(h => {
        // parsed.createElement, NICHT document.createElement: die neuen Knoten
        // muessen demselben inerten Dokument gehoeren.
        const para = parsed.createElement('p');
        const strong = parsed.createElement('strong');
        while (h.firstChild) strong.appendChild(h.firstChild);
        para.appendChild(strong);
        h.parentNode?.replaceChild(para, h);
    });

    // Rueckwaerts laufen: das Aufloesen eines Elements veraendert die Liste.
    const all = Array.from(holder.querySelectorAll('*'));
    for (let i = all.length - 1; i >= 0; i--) {
        const el = all[i];
        if (!PASTE_ALLOWED_TAGS.has(el.tagName)) {
            const parent = el.parentNode;
            if (!parent) continue;
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
            continue;
        }
        const href = el.tagName === 'A' ? el.getAttribute('href') : null;
        while (el.attributes.length > 0) {
            el.removeAttribute(el.attributes[0].name);
        }
        if (href) el.setAttribute('href', href);
    }
    return holder.innerHTML;
}

// ------------------------------------------------------------
// Bausteine (Statblock, Wuerfeltabelle, Trenner)
// ------------------------------------------------------------
// KLASSENBASIERT, nicht per data-Attribut und nicht per Inline-Stil. Zwei
// harte Grenzen des projektweiten Sanitizers (utils/basic.js) erzwingen das:
//   - data-* steht NICHT in allowedAttributes und wird beim Speichern
//     restlos entfernt. Ein data-block-Marker waere nach dem ersten
//     Neuladen weg, und alles was daran haengt (Block-Handle, Enter-Austritt)
//     erkennt seinen eigenen Block nicht mehr wieder.
//   - Die Stil-Allowlist kennt weder font-style noch border-left, display,
//     box-shadow oder line-height. Das Inline-Markup des Prototyps waere nach
//     einem Speicher-/Ladezyklus praktisch entkleidet.
// 'class' ist dagegen zugelassen (allowedAttributes.class === true) — genau
// deshalb funktioniert die bestehende .read-aloud-Auszeichnung seit Phase 5
// zuverlaessig. Die neuen Bausteine folgen demselben Muster.
const EDITOR_BLOCK_BUILDERS = {
    statblock() {
        const el = document.createElement('div');
        el.className = 'editor-block editor-block-statblock';
        el.appendChild(document.createElement('br'));
        return el;
    },
    table() {
        const table = document.createElement('table');
        table.className = 'editor-block editor-block-table';
        const head = document.createElement('tr');
        ['W20', 'Ergebnis'].forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            head.appendChild(th);
        });
        table.appendChild(head);
        for (let i = 0; i < 2; i++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < 2; c++) {
                const td = document.createElement('td');
                td.innerHTML = '&nbsp;';
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        return table;
    },
    divider() {
        // BEWUSST ein div und kein <hr>: 'hr' steht nicht in der allowedTags-
        // Liste von sanitizeHTML() (utils/basic.js) und wuerde beim Speichern
        // restlos entfernt — der Trenner waere nach dem Neuladen weg. Die
        // Allowlist dafuer aufzuweiten waere die falsche Richtung: ein
        // zugelassenes Element leistet dasselbe, und eine Sicherheits-
        // Allowlist weitet man nicht fuer Kosmetik.
        const el = document.createElement('div');
        el.className = 'editor-block editor-block-divider';
        return el;
    }
};

/**
 * Haengt einen Baustein als ECHTEN Knoten hinter das oberste Kind ein, in dem
 * der Cursor steht — und setzt danach einen leeren Absatz dahinter, damit der
 * Nutzer weiterschreiben kann, ohne im Block gefangen zu sein.
 *
 * Bewusst NICHT ueber insertHtmlAtSelection(): dessen
 * sanitizeInsertedInlineStyle() loescht padding/margin/width und zerlegt
 * background in leere Longhands — ein Block waere danach unbrauchbar.
 * Ausserdem zerreisst ein HTML-String-Einsatz Block-Markup an
 * Absatzgrenzen.
 */
function insertBlockNodeAtSelection(editor, block) {
    if (!editor || !block) return false;
    editor.focus();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
        editor.appendChild(block);
    } else {
        // Vom Cursor nach oben laufen, bis das Elternelement die
        // Schreibflaeche IST — dieses oberste Kind ist der Einfuegepunkt.
        let top = selection.anchorNode;
        if (top && top.nodeType === Node.TEXT_NODE) top = top.parentElement;
        while (top && top.parentElement && top.parentElement !== editor) {
            top = top.parentElement;
        }
        if (top && top.parentElement === editor) {
            editor.insertBefore(block, top.nextSibling);
        } else {
            editor.appendChild(block);
        }
    }

    const after = document.createElement('p');
    after.appendChild(document.createElement('br'));
    editor.insertBefore(after, block.nextSibling);

    const range = document.createRange();
    range.setStart(after, 0);
    range.collapse(true);
    const sel = window.getSelection();
    if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
    }
    return true;
}
window.insertBlockNodeAtSelection = insertBlockNodeAtSelection;
window.EDITOR_BLOCK_BUILDERS = EDITOR_BLOCK_BUILDERS;

function handleEditorPaste(e) {
    if (e.__dndEditorPasteHandled) return;
    e.__dndEditorPasteHandled = true;
    e.preventDefault();
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');
    // Merker verbrauchen, bevor irgendein Zweig zurueckkehrt — sonst wirkt er
    // auf das uebernaechste Einfuegen nach.
    const forcePlain = editorForcePlainPaste;
    editorForcePlainPaste = false;
    if (forcePlain) {
        insertTextAtSelection(text);
        return;
    }
    if (html && (html.includes('<table') || html.includes('<TABLE'))) {
        const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
        if (tableMatch) {
            const cleanTable = tableMatch[0]
                // Kosmetik-Kette (D-01, Plan 10-06): entfernt und normalisiert nur
                // noch Darstellungs-Rauschen (Google-Sheets-Wrapper, Kommentare,
                // Meta-/Style-Bloecke, Layout-Attribute) und injiziert die
                // Default-Tabellenoptik. Sie ist ausdruecklich KEINE
                // Sicherheitskontrolle mehr — die fruehere, leerraum-abhaengige
                // und damit umgehbare Ereignis-Attribut-Ersetzung an dieser
                // Stelle (Plan 10-04) wurde entfernt (10-VERIFICATION.md
                // Anti-Pattern-Tabelle, 10-REVIEW.md CR-01: beide Muster
                // verlangten ein fuehrendes Leerzeichen und liessen sich durch
                // ein direkt anschliessendes Attribut umgehen). Die Sperre
                // nicht erlaubter Elemente und Ereignis-Attribute erfolgt
                // jetzt ausschliesslich DOM-basiert im Allowlist-Sanitizer
                // weiter unten und ist dort nicht an Leerraum vor dem
                // Attributnamen gebunden.
                .replace(
                    /\s+(class|style|width|height|border|cellpadding|cellspacing|align|valign|bgcolor|xmlns|x:|data-[\w-]+)="[^"]*"/gi,
                    ''
                )
                .replace(/<\/?colgroup[^>]*>/gi, '')
                .replace(/<\/?col[^>]*>/gi, '')
                .replace(/<\/?tbody[^>]*>/gi, '')
                .replace(/<\/?thead[^>]*>/gi, '')
                .replace(/<\/?tfoot[^>]*>/gi, '')
                .replace(new RegExp('<!' + '--[\\s\\S]*?-->', 'g'), '')
                .replace(/<google-sheets-html-origin[^>]*>/gi, '')
                .replace(/<\/google-sheets-html-origin>/gi, '')
                .replace(/<meta[^>]*>/gi, '')
                .replace(new RegExp('<style[^>]*>[\\s\\S]*?</sty' + 'le>', 'gi'), '')
                .replace(/\s+>/g, '>')
                .replace(/<(\w+)\s+>/g, '<$1>')
                .replace(
                    /<table>/gi,
                    '<table style="width:100%; border-collapse:collapse; margin:8px 0;">'
                )
                .replace(
                    /<th>/gi,
                    '<th style="border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);">'
                )
                .replace(
                    /<td>/gi,
                    '<td style="border:1px solid var(--border); padding:6px 10px;">'
                );
            // Sanitisierungsstufe (D-01, Plan 10-06, CR-01): der projektweite
            // DOM-basierte Allowlist-Sanitizer laeuft NACH der obigen
            // Kosmetik-Kette, nicht davor — er ist damit die LETZTE
            // Transformation vor dem Einfuegen; nach ihm kann keine
            // Zeichenketten-Ersetzung mehr ein nicht erlaubtes Element
            // (iframe/object/embed/svg/form/img) oder ein gefaehrliches
            // Protokoll (javascript:/vbscript:/data:/file:/blob:, die
            // vollstaendige dangerousProtocols-Liste aus utils/basic.js)
            // wieder einfuehren, auch nicht entitaets-kodiert (der
            // DOM-Parser dekodiert Attributwerte vor der Protokollpruefung).
            // Die von der Kette injizierten
            // Stil-Eigenschaften (border, padding, width, margin,
            // border-collapse, background, color) ueberleben die
            // Stil-Filterung, weil sie saemtlich in sanitizeHTML()s
            // allowedAttributes.style stehen (utils/basic.js) — gegen den
            // dortigen Quelltext geprueft, nicht angenommen. Aufruf ueber die
            // Fenster-Eigenschaft, NICHT ueber eine gleichnamige lokale
            // Konstante (CLAUDE.md, Muster fuer doppelte Deklarationen).
            const sanitizerReachable = typeof window.sanitizeHTML === 'function';
            const safeTable = sanitizerReachable ? window.sanitizeHTML(cleanTable) : '';
            // Fail-closed (T-10-26): ist der Sanitizer zur Laufzeit nicht
            // erreichbar ODER ergibt seine Bereinigung keinen Inhalt (nur
            // Leerraum), wird ausschliesslich der Klartext-Anteil der
            // Zwischenablage eingefuegt — es existiert kein Pfad, auf dem
            // ungeprueftes Markup eingefuegt wird, und es bleibt kein leeres
            // Tabellengeruest zurueck.
            if (!safeTable.trim()) {
                insertTextAtSelection(text);
                return;
            }
            insertHtmlAtSelection(safeTable);
            showToast('📊 Tabelle eingefügt');
            return;
        }
    }
    if (text && text.includes('\t')) {
        const lines = text.trim().split('\n');
        if (lines.length > 1 || lines[0].includes('\t')) {
            let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:8px 0;">';
            lines.forEach((line, rowIndex) => {
                const cells = line.split('\t');
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    if (rowIndex === 0) {
                        tableHtml += `<th style="border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);">${escapeHtml(cell.trim())}</th>`;
                    } else {
                        tableHtml += `<td style="border:1px solid var(--border); padding:6px 10px;">${escapeHtml(cell.trim())}</td>`;
                    }
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</table>';
            insertHtmlAtSelection(tableHtml);
            showToast('📊 Tabelle eingefügt (' + lines.length + ' Zeilen)');
            return;
        }
    }
    // Formaterhaltender Zweig (Handoff 2a, Abschnitt 6). Steht bewusst NACH
    // Tabelle und TSV und VOR dem Klartext-Fallback.
    if (html && html.trim()) {
        const cleaned = sanitizePastedMarkup(html);
        const sanitizerReachable = typeof window.sanitizeHTML === 'function';
        const safe = sanitizerReachable ? window.sanitizeHTML(cleaned) : '';
        // Fail-closed wie im Tabellenzweig: ohne erreichbaren Sanitizer oder
        // ohne verbleibenden Inhalt wird nur der Klartext eingefuegt.
        if (safe.trim()) {
            insertHtmlAtSelection(safe);
            return;
        }
    }
    insertTextAtSelection(text);
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function insertTable(rows = 3, cols = 3) {
    const editor = floatingToolbarTarget || document.activeElement;
    if (
        !editor ||
        (!editor.classList.contains('rich-editor') &&
            !editor.classList.contains('spell-editor') &&
            !editor.classList.contains('dialog-text'))
    ) {
        showToast('⚠️ Bitte erst in ein Textfeld klicken', 'error');
        return;
    }
    editor.focus();
    let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:8px 0;">';
    for (let r = 0; r < rows; r++) {
        tableHtml += '<tr>';
        for (let c = 0; c < cols; c++) {
            if (r === 0) {
                tableHtml += `<th style="border:1px solid var(--border); padding:6px 10px; background:var(--bg-elevated); color:var(--gold);">Spalte ${c + 1}</th>`;
            } else {
                tableHtml += `<td style="border:1px solid var(--border); padding:6px 10px;"></td>`;
            }
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</table><p></p>';
    insertHtmlAtSelection(tableHtml);
    showToast('📊 Tabelle eingefügt (3×3) - Strg+Shift+T');
    hideFloatingToolbar();
}
/**
 * Gesamthoehe der Umrahmung der Listen-Schalen (U6, Glied 0 der Versatzkette).
 *
 * Die fuenf Master-Detail-Schalen (`.loc-view`, `.npc-view`, `.loot-view`,
 * `.enc-view`, `.bestiary-view`) rechnen ihre Hoehe gegen den Fensterrand:
 * `height: calc(100vh - var(--view-frame-height, 134px))` mit `overflow: hidden`.
 * Was von der Fensterhoehe abgeht, ist alles, was AUSSERHALB der Schale
 * vertikalen Platz nimmt:
 *
 *   `imFlussDarueber`  die Kopfzeile, SOFERN sie im Fluss steht (Desktop: ihre
 *                      gemessene Hoehe; Mobil: 0, dort stehen Mobil-Kopf UND
 *                      Kopfzeile `position: fixed`)
 *   + body             padding-top + padding-bottom
 *   + .main-content    padding-top + padding-bottom + margin-top + margin-bottom
 *
 * Die Band-Gegenrechnung steckt im `padding-top` des body
 * (`body.has-migration-hint` / `body.has-divergence-banner`) und wird deshalb
 * NICHT eigens uebergeben: gemessen wird der Platz, den das Band im Fluss
 * tatsaechlich belegt, nicht seine Hoehe. Im Mobil-Layout kommt derselbe Weg mit
 * drei weiteren Reservierungen zurecht, die es im Desktop nicht gibt —
 * `body { padding-bottom: 70px }`, `.main-content { padding-top: 60px }` und
 * `.main-content { margin-bottom: 70px }` halten dort den Platz der beiden
 * festen Leisten frei (gemessen 271px Umrahmung bei 700x800, davon 61px Band).
 *
 * Bis 2026-10 stand dort die feste Zahl 120px, waehrend die Umrahmung
 * tatsaechlich 134px hoch war (102 Kopfzeile + 16 + 16) — und mit stehendem
 * Umzugs-Band 195px. Gemessen am Buendel zu fef3afb, 128 Zustaende: Ueberhang
 * 14px (ohne Band, ab 1280 Breite), 52px (900), 75px (mit Band, ab 1280),
 * 113px (900) — in 128 von 128 Zustaenden groesser als 0. Dieser Ueberhang ist
 * der Weg, auf dem die Seite UEBERHAUPT scrollt, und damit der Weg, auf dem die
 * Werkzeugleiste der Ansicht unter die angeheftete Kopfzeile rutscht (gemessen
 * 59px ab 1280, 74-103px bei 900; das Suchfeld antwortete auf
 * `elementFromPoint` mit `BUTTON.nav-group-btn`). Bei Ueberhang 0 scrollt die
 * Seite nicht, und keine Leiste kann irgendwohin rutschen.
 *
 * Der Rueckfallwert 134px an den Fundstellen ist NICHT die Wahrheit, sondern
 * nur der Zustand vor dem ersten Lauf dieser Funktion: er ist die gemessene
 * Desktop-Umrahmung ohne Band bei >=1280 Breite. Das Token wird in BEIDEN
 * Layout-Zweigen besetzt, damit der Rueckfall im Betrieb nie zum Zug kommt —
 * anders als die drei Anheft-Glieder, die im Mobil-Zweig absichtlich abgeraeumt
 * werden, weil dort spezifischere Mobil-Regeln an ihre Stelle treten. Fuer die
 * Schalenhoehe gibt es keine solche Regel; ein abgeraeumtes Token waere hier
 * also ein stiller Rueckfall auf eine Zahl.
 *
 * @param {HTMLElement} root `document.documentElement`, Traeger der Tokens
 * @param {number} imFlussDarueber Hoehe der Kopfzeile, sofern sie im Fluss steht
 */
function setzeRahmenHoehe(root, imFlussDarueber) {
    const zahl = wert => Math.round(parseFloat(wert) || 0);
    let rahmen = imFlussDarueber;
    const koerper = document.body;
    if (koerper) {
        const stil = getComputedStyle(koerper);
        rahmen += zahl(stil.paddingTop) + zahl(stil.paddingBottom);
    }
    const inhalt = document.querySelector('.main-content');
    if (inhalt) {
        const stil = getComputedStyle(inhalt);
        rahmen +=
            zahl(stil.paddingTop) +
            zahl(stil.paddingBottom) +
            zahl(stil.marginTop) +
            zahl(stil.marginBottom);
    } else {
        // 32 = 16 oben + 16 unten, der Desktop-Innenabstand von .main-content —
        // was die Messung hergaebe, falls der Container noch fehlt.
        rahmen += 32;
    }
    root.style.setProperty('--view-frame-height', rahmen + 'px');
}

/* Luft zwischen der ausgefahrenen Mobil-Leiste und dem tiefsten festen Block am
   Fensterkopf. Ein Bildpunkt genuegte rechnerisch; 8px sind der Abstand, bei dem
   die Leiste als eigene Flaeche zu erkennen ist und nicht am Band klebt. */
const MOBIL_LEISTE_LUFT = 8;

/* Fussboden des Deckels: zwei Reiterreihen (2 x 56px). Er greift nur in einem
   Fenster, das so niedrig ist, dass selbst zwei Reihen nicht mehr unter die
   festen Kopfbloecke passen — dann ist eine Leiste, die ueber das Band laeuft,
   immer noch besser als eine, die auf null zusammenfaellt und den
   Ansichtswechsel ganz verliert. */
const MOBIL_LEISTE_MINDESTFELD = 112;

/**
 * Hoehendeckel der ausgefahrenen Mobil-Navigationsleiste (M1, Glied 4).
 *
 * Die Leiste fuehrt im Mobil-Layout ALLE 24 Ansichten flach in einem Raster aus
 * vier Spalten (`.nav-group { display: contents }` loest die sechs
 * Desktop-Gruppen dort auf). 24 Reiter zu 56px Tippflaeche in sechs Reihen, plus
 * Abstaenden und Innenabstand, sind 382px Rasterinhalt.
 *
 * Bis 2026-10 stand dort `max-height: 300px` — eine Zahl ohne Bezug zum Fenster.
 * GEMESSEN am Buendel zu cecfefe (Mobil-Layout, Umschalter geklickt,
 * `elementFromPoint` auf der Reitermitte): Rasterinhalt 444px gegen 300px
 * Sichtfeld, also 144px Ueberhang; die unterste Reihe (Soundboard, Statistiken,
 * Session-Prep, Daten) lag dauerhaft hinter dem `overflow`. Erreichbar waren
 * 7 von 24 Reitern bei 390x844 und 10 von 24 bei 360x740 — und das, obwohl bei
 * 390x844 unter dem Umzugs-Band 623px frei lagen und die Leiste 300 nahm.
 *
 * WARUM DIE 56px NICHT SCHRUMPFEN. Der andere Weg, 24 Reiter in 300px zu
 * bringen, waere eine kleinere Tippflaeche. Der Nutzer ist Spielleiter am Tisch
 * und bedient die App mit dem Daumen; unter 44px trifft ein Daumen nicht mehr
 * zuverlaessig. Die Leiste waere also genau in dem Moment unbenutzbar geworden,
 * in dem sie vollstaendig wird. Falsch war der Deckel, nicht die Reitergroesse.
 *
 * WAS GEMESSEN WIRD, statt verdrahtet zu werden:
 *
 *   obenUnterkante   die tiefste Unterkante der fest am Fensterkopf sitzenden
 *                    Bloecke — Umzugs-Hinweisband, Divergenz-Banner UND
 *                    Mobil-Kopfzeile. Alle drei sind `position: fixed` am oberen
 *                    Rand, und das Band ist bei 360-390px Breite 157px hoch (es
 *                    bricht um). Gemessen wird `bottom`, damit ein gestapelter
 *                    Zustand ohne Sonderfall richtig herauskommt — dasselbe
 *                    Vorgehen wie bei Glied 1.
 *   umschalterHoehe  die Hoehe der Umschalter-Zeile, die ueber dem Raster in
 *                    derselben Leiste steht (56px laut Regel, hier aber
 *                    abgelesen — sie traegt Text, der umbrechen kann).
 *
 * Der Deckel ist der Rest: `innerHeight - obenUnterkante - umschalterHoehe -
 * Luft`. Bei 390x844 sind das 623px, und das Raster passt ohne Scrollen hinein;
 * im Querformat (740x360) sind es 235px, und dann scrollt die Leiste wirklich —
 * `overflow-y: auto` bleibt der Rueckfall, nicht die Regel.
 *
 * Der CSS-Rueckfallwert 300px an der Fundstelle ist NICHT die Wahrheit, sondern
 * nur der Zustand vor dem ersten Lauf dieser Funktion; er ist bewusst der alte
 * Wert, damit ein ausgefallener Lauf nicht schlechter dasteht als der Stand
 * vorher. Im Betrieb kommt er nie zum Zug: der Mobil-Zweig besetzt das Token bei
 * jedem Lauf, und `loadLayout()` setzt `data-layout` in `core/init.js` VOR dem
 * ersten Aufruf dieser Kette.
 *
 * @param {HTMLElement} root `document.documentElement`, Traeger der Tokens
 * @param {HTMLElement} kopf die Kopfzeile — im Mobil-Layout die Leiste selbst
 */
function setzeMobilLeistenDeckel(root, kopf) {
    const umschalter = kopf.querySelector('.mobile-nav-toggle');
    if (!umschalter) return;
    const obenUnterkante = ['.migration-hint-banner', '.divergence-banner', '.mobile-header']
        .map(auswahl => document.querySelector(auswahl))
        .filter(Boolean)
        .reduce((tiefste, el) => {
            const stil = getComputedStyle(el);
            if (stil.display === 'none' || stil.visibility === 'hidden') return tiefste;
            return Math.max(tiefste, Math.round(el.getBoundingClientRect().bottom));
        }, 0);
    const umschalterHoehe = Math.round(umschalter.getBoundingClientRect().height);
    const deckel = Math.max(
        MOBIL_LEISTE_MINDESTFELD,
        window.innerHeight - obenUnterkante - umschalterHoehe - MOBIL_LEISTE_LUFT
    );
    root.style.setProperty('--mobile-nav-max-height', deckel + 'px');
    // Glied 5 — der Streifen, den die EINGEKLAPPTE Leiste immer belegt. Sie faehrt
    // auf `translateY(calc(100% - 56px))` ein, sichtbar bleibt also genau die
    // Umschalter-Zeile. Wer dort etwas hinlegt, macht alle 24 Ansichten
    // unerreichbar, ohne dass eine Messung an der AUSGEFAHRENEN Leiste das
    // bemerkt: man kommt gar nicht dazu, sie auszufahren. Gemessen am Buendel zu
    // cecfefe mit offenem Kampfprotokoll antwortete `elementFromPoint` auf der
    // Mitte der Umschalter-Zeile bei 740x360 mit DIV.kplog-text.
    root.style.setProperty('--mobile-nav-rest', umschalterHoehe + 'px');
}

/**
 * Setzt die Versatzkette der angehefteten Ebenen (U3) und das Hoehenbudget der
 * Listen-Schalen (U6).
 *
 * Auf Kampf -> Initiative liegen vier Ebenen uebereinander, jede mit eigenem
 * Anheft-Versatz, und jeder Versatz haengt an der gemessenen Unterkante der
 * Ebene darueber:
 *
 *   Glied 1  festes Band        -> .app-header          (--sticky-top-header)
 *   Glied 2  Kopfzeile          -> .encounter-controls  (--sticky-top-round)
 *   Glied 3  Runden-Leiste      -> #quick-actions-bar   (--sticky-top-actions)
 *
 * Aus derselben Messung faellt ein viertes Token ab, das keine Oberkante, sondern
 * eine Gesamthoehe ist: `--view-frame-height` (Glied 0, siehe setzeRahmenHoehe()).
 *
 * Bis 2026-09 war nur Glied 2 berechnet. Die Aktionsleiste behielt ihren 2026
 * fest verdrahteten Wert `top: 145px` und schnitt die Runden-Leiste dadurch um
 * 35px (ab 1280 Breite), 94px (1100) und 87px (1000) — die Leiste bricht um
 * (`flex-wrap: wrap`), ihre Hoehe ist also keine Konstante und laesst sich
 * nicht verdrahten. Glied 1 fehlte ganz: das Band ist `position: fixed` auf
 * --z-panel, die Kopfzeile heftete auf `top: 0` an und fuhr beim Scrollen
 * 61px darunter — App-Titel und globale Suche waren verdeckt.
 *
 * Die Kette wird als Custom Properties auf <html> veroeffentlicht, NICHT
 * als Inline-Stil am Element. Der frueher benutzte Inline-Weg hatte einen
 * stillen Fehler: beim Wechsel in das Mobil-Layout blieb der Desktop-Wert am
 * Element stehen und schlug die Regel
 * `[data-layout="mobile"] .encounter-controls { top: 0 }`. Ueber Custom
 * Properties gewinnt die spezifischere Mobil-Regel immer.
 *
 * Das frueher hier gesetzte --header-height ist entfallen: kein Verbraucher hat
 * es je gelesen (`git log -S 'var(--header-height)' --all` = null Treffer). Die
 * drei kumulativen Glieder ersetzen es.
 *
 * Aufrufer: core/init.js (einmal beim Start und entprellt am resize-Ereignis),
 * setLayout() in ui/layout-profiles.js (der Mobil-Zweig raeumt die Kette ab, der
 * Rueckweg nach Desktop muss sie neu besetzen), renderQuickActionsBar() (Glied 3
 * ist nur messbar, solange die Initiative sichtbar ist) und die fuenf Stellen in
 * systems/migration/migration-wizard.js, an denen ein festes Band erscheint oder
 * verschwindet (ueber die dortige Huelle _updateStickyChainAfterBanner()).
 */
function updateStickyOffsets() {
    const root = document.documentElement;
    const header = document.querySelector('.app-header');
    if (!header) return;

    // Unterkante des tiefsten festen Bands am Fensterkopf, 0 ohne Band — in
    // BEIDEN Layouts gebraucht, deshalb vor der Verzweigung gemessen.
    // BEIDE Baender zaehlen: das Umzugs-Hinweisband (.migration-hint-banner) und
    // das Divergenz-Banner (.divergence-banner). Letzteres war bis 2026-10
    // absichtlich ausgelassen, weil ihm die Gegenrechnung am Seiteninhalt fehlte
    // (die Entsprechung zu `body.has-migration-hint { padding-top }`) und es die
    // Kopfzeile deshalb auch UNGESCROLLT verdeckte, wo ein Anheft-Versatz nichts
    // ausrichtet: gemessen deckte es die Kopfzeile um 40px, App-Titel und globale
    // Suche antworteten auf elementFromPoint mit STRONG bzw.
    // SPAN.divergence-banner-text. Diese Gegenrechnung gibt es jetzt
    // (`body.has-divergence-banner`, migration.css), also traegt das Band hier
    // mit. Gemessen wird `bottom` und nicht `height`, damit ein gestapelter
    // Zustand ohne Sonderfall richtig herauskommt — im Betrieb schliessen sich
    // die beiden Baender aus (startMigrationFileSide() verzweigt entweder/oder,
    // und startMigrationFlow() entfernt den Hinweis im selben synchronen Block).
    const baender = [
        document.querySelector('.migration-hint-banner'),
        document.querySelector('.divergence-banner')
    ].filter(Boolean);

    // Die Hoehe jedes gefundenen Bands wird HIER nachgemessen und sein Token neu
    // gesetzt, statt dem Wert zu glauben, den showMigrationHintBanner() bzw.
    // showDivergenceBanner() bei der Erzeugung EINMAL abgelegt haben.
    //
    // Grund: die Hoehe haengt an der Fensterbreite — das Hinweisband bricht um
    // (gemessen 61px bei 1440, 80px bei 500, 157px bei 390 Breite). Ein
    // Fensterwechsel NACH dem Laden liess die Gegenrechnung am Seiteninhalt
    // (`body.has-migration-hint { padding-top }`) auf dem alten Wert stehen,
    // waehrend Glied 1 unten der neuen Isthoehe folgte. Die angeheftete Kopfzeile
    // rutschte dadurch ueber die Werkzeugleiste der Ansicht und deckte sie bei
    // 1440x800 -> 390x844 um 74 von 74px zu — UNGESCROLLT, wo weder Scrollweg
    // noch Anheft-Versatz etwas ausrichten. Bei 500px waren es 9px. Und weil
    // Glied 0 (setzeRahmenHoehe) denselben body-Innenabstand mitliest, war mit
    // der Gegenrechnung auch das Hoehenbudget falsch.
    //
    // Die Messung ist NICHT zirkulaer: beide Baender sind `position: fixed` und
    // stehen damit ausserhalb des Flusses — ihre eigene Hoehe haengt nicht an dem
    // Innenabstand, den sie setzen.
    //
    // Das Divergenz-Band kann derzeit nicht umbrechen (`height: 40px` +
    // `white-space: nowrap` + Ellipse, migration.css) und wird hier trotzdem
    // mitgefuehrt: sein Token kommt aus derselben Einmal-Messung, und die
    // Symmetrie kostet nichts.
    for (const band of baender) {
        const name = band.classList.contains('migration-hint-banner')
            ? '--migration-hint-height'
            : '--divergence-banner-height';
        root.style.setProperty(name, Math.round(band.getBoundingClientRect().height) + 'px');
    }

    const bandHoehe = baender.reduce(
        (tiefste, el) => Math.max(tiefste, Math.round(el.getBoundingClientRect().bottom)),
        0
    );

    if (root.dataset.layout === 'mobile') {
        // Im Mobil-Layout hat die Kette keinen Gegenstand: die Kopfzeile ist dort
        // eine feste Leiste am UNTEREN Fensterrand (`top: auto`), und Runden-
        // wie Aktionsleiste heften nach eigenen Regeln an
        // ([data-layout="mobile"] ...). Alle drei Glieder werden
        // zurueckgenommen, damit kein Desktop-Wert stehenbleibt — ein Token, das
        // niemand liest, ist genau der Fehler, den --header-height war.
        // Das Abraeumen ist nur deshalb unschaedlich, weil setLayout() diese
        // Funktion auf dem Rueckweg nach Desktop erneut aufruft; ohne diesen
        // Aufruf kamen hier die CSS-Rueckfallwerte 0px/75px/145px zum Zug.
        root.style.removeProperty('--sticky-top-header');
        root.style.removeProperty('--sticky-top-round');
        root.style.removeProperty('--sticky-top-actions');
        // Glied 0 wird dagegen BESETZT, nicht abgeraeumt: fuer die Schalenhoehe
        // gibt es keine spezifischere Mobil-Regel, die an seine Stelle treten
        // koennte (nur `.bestiary-view` setzt dort `height: auto`). Hier geht 0
        // ueber den Inhalt ein, weil Mobil-Kopf UND Kopfzeile `position: fixed`
        // stehen — ihren Platz halten die Innenabstaende an body und
        // .main-content frei, die setzeRahmenHoehe() ohnehin mitmisst.
        // Gemessen: 271px Umrahmung bei 700x800 mit Band, Seitenueberhang 0
        // (vorher mit der verdrahteten 120px: Ueberhang 151px, und das Suchfeld
        // der Werkzeugleiste antwortete gescrollt mit DIV.mobile-header).
        setzeRahmenHoehe(root, 0);
        // Glied 4 — Hoehendeckel der ausgefahrenen Navigationsleiste (M1). NUR im
        // Mobil-Zweig: im Desktop-Layout ist `.mobile-nav-toggle` ausgeblendet und
        // die Leiste steht oben im Fluss, das Token hat dort keinen Verbraucher.
        // Es wird auf dem Rueckweg nach Desktop deshalb auch nicht abgeraeumt —
        // die Regel, die es liest, haengt selbst an `[data-layout="mobile"]`.
        setzeMobilLeistenDeckel(root, header);
        return;
    }

    // Glied 1 — die Kopfzeile heftet unter dem Band an.
    root.style.setProperty('--sticky-top-header', bandHoehe + 'px');

    // Glied 2 — Runden-Leiste unter der Kopfzeile.
    const rundenTop = bandHoehe + Math.round(header.getBoundingClientRect().height);
    root.style.setProperty('--sticky-top-round', rundenTop + 'px');

    // Glied 0 — Hoehenbudget der Listen-Schalen. Im Desktop-Fluss steht ueber
    // .main-content die Kopfzeile (`position: sticky`, also IM Fluss); die
    // Gegenrechnung des Bands liest setzeRahmenHoehe() selbst am body ab.
    setzeRahmenHoehe(root, Math.round(header.getBoundingClientRect().height));

    // Glied 3 — Aktionsleiste unter der Runden-Leiste. Bei verborgener
    // Initiative ist die Leiste 0px hoch; dann bleibt das Glied unveraendert,
    // statt auf einen falschen Wert zu fallen (renderQuickActionsBar() ruft
    // diese Funktion beim Sichtbarwerden erneut auf).
    const runden = document.querySelector('.encounter-controls');
    if (!runden) return;
    const rundenHoehe = Math.round(runden.getBoundingClientRect().height);
    if (rundenHoehe === 0) return;
    const abstand = Math.round(parseFloat(getComputedStyle(runden).marginBottom) || 0);
    root.style.setProperty('--sticky-top-actions', rundenTop + rundenHoehe + abstand + 'px');
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.initEditorPasteHandlers = initEditorPasteHandlers;
window.insertTable = insertTable;
window.updateStickyOffsets = updateStickyOffsets;
