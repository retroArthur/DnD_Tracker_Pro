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
function updateStickyOffsets() {
    const header = document.querySelector('.app-header');
    if (!header) return;
    const isMobile = document.documentElement.dataset.layout === 'mobile';
    if (isMobile) {
        document.documentElement.style.setProperty('--header-height', '0px');
    } else {
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
        const encounterControls = document.querySelector('.encounter-controls');
        if (encounterControls) {
            encounterControls.style.top = headerHeight + 'px';
        }
    }
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.initEditorPasteHandlers = initEditorPasteHandlers;
window.insertTable = insertTable;
window.updateStickyOffsets = updateStickyOffsets;
