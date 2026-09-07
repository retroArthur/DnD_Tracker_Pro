// [SECTION:EDITOR_TOOLBAR_BUILD]
// Einzige Quelle fuer das Markup aller Editor-Werkzeugleisten.
//
// Warum es dieses Modul gibt: bis Variante 2a standen 24 handgeschriebene
// Leisten in sieben Templates und zwei JS-Dateien. Jede Aenderung war ein
// 24-faches Suchen-und-Ersetzen, und die Kopien waren bereits auseinander-
// gedriftet (mal mit, mal ohne type="button"; mal &#x1F9F9;, mal 🧹; zwei
// Fraktions-Leisten ohne Clear-Button; eine Leiste ganz ohne Tier-Klasse).
//
// Aufbau: EDITOR_TOOLBAR_SPEC beschreibt die Gruppen, buildEditorToolbar()
// setzt daraus den HTML-String zusammen. tools/sync-editor-toolbars.js
// schreibt denselben Output in die Templates (statisches Markup bleibt
// statisch — zur Laufzeit generieren wuerde die einmalige Initialisierung
// und jeden Playwright-Selektor brechen, der direkt nach dem Oeffnen eines
// Formulars klickt).
//
// ATTRIBUTVERTRAG — woertlich beizubehalten, die Delegation haengt daran:
//   format-text            -> data-cmd=<editorId>  data-editor=<format>   (Inversion!)
//   alle uebrigen Aktionen -> data-editor=<editorId>
//   clear-formatting       -> data-value=<editorId>
// ============================================================

// Gruppen und ihr Ausblendeverhalten. data-tb steuert die Media-Query-Leiter
// in assets/styles/editors.css; was ausgeblendet wird, ist im ⋯-Menue
// vollstaendig erreichbar.
//   > 900px : alles inline (Leiste 43px)
//   <= 900px: fonts aus, ⋯ an
//   <= 680px: zusaetzlich mid aus, Textlabels der Menues aus (nur Icons)
const EDITOR_TOOLBAR_GROUPS = ['chars', 'mid', 'label', 'fonts', 'right'];

// Markerfarben. Reduziert von neun auf vier plus "entfernen" (Handoff 2a).
// '#fbbf24' und 'transparent' MUESSEN als Werte erhalten bleiben — das
// eingefrorene Phase-9-Netz selektiert auf genau diese Zeichenketten.
const EDITOR_MARKER_COLORS = [
    { value: '#fbbf24', label: 'Gold' },
    { value: '#7ec4cf', label: 'Eis' },
    { value: '#4ade80', label: 'Gift' },
    { value: '#ef4444', label: 'Blut' }
];

// Bausteine. KLASSENBASIERT, nicht per data-block: sanitizeHTML()
// (utils/basic.js) streicht data-* vollstaendig, ein data-block-Marker
// waere nach dem ersten Speichern weg. Die Werte sind die bestehenden
// READ_ALOUD_STYLES-Schluessel, damit setReadAloudFormat() unveraendert traegt.
const EDITOR_BLOCK_ITEMS = [
    { value: 'parchment', label: 'Pergament', tint: '#d4af37' },
    { value: 'crimson', label: 'Karmesin', tint: '#b91c1c' },
    { value: 'violet', label: 'Violett', tint: '#7c3aed' },
    { value: 'sage', label: 'Salbei', tint: '#4d7c0f' },
    { value: 'sky', label: 'Himmel', tint: '#0369a1' },
    { value: 'slate', label: 'Schiefer', tint: '#475569' }
];

// Schriftarten je Tier. Die Werte sind EDITOR_FONTS-Schluessel (core/constants.js).
const EDITOR_TOOLBAR_FONTS_SHORT = [
    { value: 'arial', label: 'Arial' },
    { value: 'serif', label: 'Serif' },
    { value: 'mono', label: 'Mono' }
];
const EDITOR_TOOLBAR_FONTS_FULL = [
    ...EDITOR_TOOLBAR_FONTS_SHORT,
    { value: 'roboto', label: 'Roboto' },
    { value: 'inter', label: 'Inter' },
    { value: 'poppins', label: 'Poppins' },
    { value: 'source-sans', label: 'Source Sans' }
];
const EDITOR_TOOLBAR_SIZES = ['11px', '13px', '16px', '18px', '20px'];

// Lucide-Pfade, inline. Ersetzt die Emoji-Icons des Alt-Zustands (🧹 📖 📊 ☰ 🔗).
const EDITOR_TOOLBAR_ICONS = {
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="0"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    border: '<rect x="3" y="3" width="18" height="18" rx="0"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    block: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    bubble: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
};

function editorToolbarIcon(name) {
    const path = EDITOR_TOOLBAR_ICONS[name] || '';
    return (
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        path +
        '</svg>'
    );
}

// Kleine Bausteine. attr() haelt die Ausgabe frei von undefined-Attributen.
function editorToolbarAttr(name, value) {
    return value === undefined || value === null || value === '' ? '' : ` ${name}="${value}"`;
}

function editorToolbarButton(opts) {
    const cls = opts.cls || 'editor-btn';
    return (
        `<button type="button" class="${cls}"` +
        editorToolbarAttr('data-action', opts.action) +
        editorToolbarAttr('data-cmd', opts.cmd) +
        editorToolbarAttr('data-editor', opts.editor) +
        editorToolbarAttr('data-value', opts.value) +
        editorToolbarAttr('data-tb-menu', opts.menu) +
        editorToolbarAttr('title', opts.title) +
        `>${opts.body}</button>`
    );
}

function editorToolbarSeparator() {
    return '<span class="toolbar-separator" aria-hidden="true"></span>';
}

// ------------------------------------------------------------
// Gruppen
// ------------------------------------------------------------

// Zeichenformate. Immer sichtbar — auf jeder Breite, in jedem Tier.
// Als Typografie gesetzt (Georgia), nicht als Icon: B/I/U/S sind schneller
// zu lesen, wenn sie so aussehen, wie sie wirken.
function editorToolbarCharsGroup(editorId, tier) {
    const formats = [
        { fmt: 'bold', body: '<b>B</b>', title: 'Fett' },
        { fmt: 'italic', body: '<i>I</i>', title: 'Kursiv' },
        { fmt: 'underline', body: '<u>U</u>', title: 'Unterstrichen' }
    ];
    if (tier !== 'minimal') {
        formats.push({ fmt: 'strikethrough', body: '<s>S</s>', title: 'Durchgestrichen' });
    }
    const buttons = formats
        .map(f =>
            editorToolbarButton({
                cls: 'editor-btn editor-btn-type',
                action: 'format-text',
                cmd: editorId,
                editor: f.fmt,
                title: f.title,
                body: f.body
            })
        )
        .join('');
    return `<div class="toolbar-group" data-tb="chars">${buttons}</div>`;
}

// Struktur: Liste, Link, Tabelle. Wandert unter 680px ins ⋯-Menue.
function editorToolbarMidGroup(editorId, tier, opts) {
    const parts = [
        editorToolbarButton({
            action: 'format-text',
            cmd: editorId,
            editor: 'list',
            title: 'Liste',
            body: editorToolbarIcon('list')
        })
    ];
    if (tier === 'full') {
        parts.push(
            editorToolbarButton({
                action: 'insert-link',
                editor: editorId,
                title: 'Link einfügen',
                body: editorToolbarIcon('link')
            }),
            editorToolbarButton({
                action: 'insert-table',
                editor: editorId,
                title: 'Tabelle',
                body: editorToolbarIcon('table')
            })
        );
        if (opts && opts.wikiLink) {
            // Nur wiki-content: benannte call-Aktion, bereits in
            // CALL_ACTION_WHITELIST (core/constants.js) eingetragen.
            // Aktion und Wert MUESSEN auf derselben Zeile stehen:
            // tests/unit/event-delegation.test.js scannt den Quellbaum
            // zeilenweise und belegt damit, dass die CALL_ACTION_WHITELIST-
            // Ableitung geschlossen ist. Ein Umbruch dazwischen laesst den
            // Waechter das Ziel uebersehen. (Der Waechter greift auch auf
            // Kommentare, deshalb steht die Attributschreibweise hier nicht
            // ausgeschrieben.)
            parts.push(
                '<button type="button" class="editor-btn editor-btn-type" data-action="call" data-value="insertWikiLink" title="Wiki-Link">[[]]</button>'
            );
        }
    }
    return `<div class="toolbar-group" data-tb="mid">${parts.join('')}</div>`;
}

// Marker und Bausteine als verankerte Aufklapp-Menues.
// Der Button traegt data-tb-menu, damit W-03 die Selektion sichert, bevor
// der Fokus den Editor verlaesst.
function editorToolbarLabelGroup(editorId) {
    const markerItems = EDITOR_MARKER_COLORS.map(
        c =>
            `<button type="button" class="tb-menu-item tb-menu-swatch" data-action="set-highlight-color" ` +
            `data-editor="${editorId}" data-value="${c.value}" title="${c.label}">` +
            `<span class="tb-swatch" style="background:${c.value}"></span>${c.label}</button>`
    ).join('');
    const markerMenu =
        `<div class="tb-menu" id="tb-menu-marker-${editorId}" hidden>` +
        '<div class="tb-menu-head">Marker</div>' +
        markerItems +
        `<button type="button" class="tb-menu-item" data-action="set-highlight-color" ` +
        `data-editor="${editorId}" data-value="transparent" title="Marker entfernen">` +
        '<span class="tb-swatch tb-swatch-none"></span>Entfernen</button>' +
        '</div>';

    const blockItems = EDITOR_BLOCK_ITEMS.map(
        b =>
            `<button type="button" class="tb-menu-item" data-action="set-read-aloud-style" ` +
            `data-editor="${editorId}" data-value="${b.value}" title="${b.label}">` +
            `<span class="tb-tint" style="background:${b.tint}"></span>${b.label}</button>`
    ).join('');
    // Die drei strukturellen Bausteine des Handoffs. Vorlesetext steht
    // darueber, weil er eine Auswahl umschliesst statt einen leeren Block
    // einzusetzen — zwei verschiedene Aktionen, ein Menue.
    const structureItems = [
        { value: 'statblock', label: 'Statblock' },
        { value: 'table', label: 'Wuerfeltabelle' },
        { value: 'divider', label: 'Trenner' }
    ]
        .map(
            b =>
                `<button type="button" class="tb-menu-item" data-action="insert-block" ` +
                `data-editor="${editorId}" data-value="${b.value}" title="${b.label}">` +
                `<span class="tb-tint" style="background:var(--border)"></span>${b.label}</button>`
        )
        .join('');

    const blockMenu =
        `<div class="tb-menu" id="tb-menu-block-${editorId}" hidden>` +
        '<div class="tb-menu-head">Vorlesetext</div>' +
        blockItems +
        '<div class="tb-menu-head">Struktur</div>' +
        structureItems +
        '</div>';

    return (
        '<div class="toolbar-group" data-tb="label">' +
        `<span class="tb-anchor">` +
        editorToolbarButton({
            cls: 'editor-btn editor-btn-text',
            action: 'toggle-editor-menu',
            editor: editorId,
            value: `tb-menu-marker-${editorId}`,
            menu: 'marker',
            title: 'Marker',
            body:
                '<span class="tb-swatch tb-swatch-current" style="background:#fbbf24"></span>' +
                '<span class="tb-label">Marker</span><span class="tb-caret">▾</span>'
        }) +
        markerMenu +
        '</span>' +
        `<span class="tb-anchor">` +
        editorToolbarButton({
            cls: 'editor-btn editor-btn-text',
            action: 'toggle-editor-menu',
            editor: editorId,
            value: `tb-menu-block-${editorId}`,
            menu: 'block',
            title: 'Bausteine',
            body:
                editorToolbarIcon('block') +
                '<span class="tb-label">Bausteine</span><span class="tb-caret">▾</span>'
        }) +
        blockMenu +
        '</span>' +
        '</div>'
    );
}

// Schrift und Groesse bleiben native Selects — so sieht es der Entwurf vor,
// und so bleiben die bestehenden Testzugriffe per selectOption() gueltig.
function editorToolbarFontsGroup(editorId, tier) {
    const fonts = tier === 'full' ? EDITOR_TOOLBAR_FONTS_FULL : EDITOR_TOOLBAR_FONTS_SHORT;
    const fontOptions = fonts.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
    let out =
        `<select class="editor-select" data-action="set-editor-font" data-editor="${editorId}" ` +
        `title="Schriftart">${fontOptions}</select>`;
    if (tier === 'full') {
        const sizeOptions = EDITOR_TOOLBAR_SIZES.map(
            sz => `<option value="${sz}"${sz === '16px' ? ' selected' : ''}>${sz}</option>`
        ).join('');
        out +=
            `<select class="editor-select" data-action="set-editor-font-size" data-editor="${editorId}" ` +
            `title="Größe">${sizeOptions}</select>`;
    }
    return `<div class="toolbar-group" data-tb="fonts">${out}</div>`;
}

// Rechts angeschlagen (margin-left:auto): Rahmen, Format entfernen, ⋯.
function editorToolbarRightGroup(editorId, tier, opts) {
    const parts = [];
    if (tier === 'full') {
        parts.push(
            editorToolbarButton({
                action: 'set-border-format',
                editor: editorId,
                title: 'Rahmen',
                body: editorToolbarIcon('border')
            })
        );
    }
    if (!opts || opts.clear !== false) {
        parts.push(
            editorToolbarButton({
                action: 'clear-formatting',
                value: editorId,
                title: 'Formatierung entfernen',
                body: editorToolbarIcon('trash')
            })
        );
    }
    // ⋯ — traegt die unter 900/680px ausgeblendeten Werkzeuge nach.
    parts.push(
        `<span class="tb-anchor" data-tb="more">` +
            editorToolbarButton({
                action: 'toggle-editor-menu',
                editor: editorId,
                value: `tb-menu-more-${editorId}`,
                menu: 'more',
                title: 'Weitere Werkzeuge',
                body: editorToolbarIcon('more')
            }) +
            editorToolbarMoreMenu(editorId, tier) +
            '</span>'
    );
    return `<div class="toolbar-group toolbar-group-right" data-tb="right">${parts.join('')}</div>`;
}

function editorToolbarMoreMenu(editorId, tier) {
    const items = [
        `<button type="button" class="tb-menu-item" data-action="format-text" data-cmd="${editorId}" ` +
            `data-editor="list">Liste</button>`
    ];
    if (tier === 'full') {
        items.push(
            `<button type="button" class="tb-menu-item" data-action="insert-link" data-editor="${editorId}">Link …</button>`,
            `<button type="button" class="tb-menu-item" data-action="insert-table" data-editor="${editorId}">Tabelle</button>`
        );
    }
    const fonts = tier === 'full' ? EDITOR_TOOLBAR_FONTS_FULL : EDITOR_TOOLBAR_FONTS_SHORT;
    items.push(
        '<div class="tb-menu-head">Schrift</div>',
        `<select class="editor-select" data-action="set-editor-font" data-editor="${editorId}" ` +
            `title="Schriftart">${fonts.map(f => `<option value="${f.value}">${f.label}</option>`).join('')}</select>`
    );
    if (tier === 'full') {
        items.push(
            `<select class="editor-select" data-action="set-editor-font-size" data-editor="${editorId}" ` +
                `title="Größe">${EDITOR_TOOLBAR_SIZES.map(sz => `<option value="${sz}"${sz === '16px' ? ' selected' : ''}>${sz}</option>`).join('')}</select>`
        );
    }
    // Werkzeug-Blase: Vorgabe AN, hier abschaltbar. Zustand in localStorage.
    items.push(
        '<div class="tb-menu-head">Ansicht</div>',
        `<button type="button" class="tb-menu-item" data-action="toggle-editor-bubble" data-editor="${editorId}">` +
            editorToolbarIcon('bubble') +
            'Werkzeug-Blase</button>'
    );
    return `<div class="tb-menu tb-menu-right" id="tb-menu-more-${editorId}" hidden>${items.join('')}</div>`;
}

// ------------------------------------------------------------
// Zusammenbau
// ------------------------------------------------------------

/**
 * Baut das Markup einer Editor-Werkzeugleiste.
 *
 * @param {string} editorId  ID des contenteditable-Hosts (NICHT des Wrappers —
 *                           clearFormFields() und ~20 Ladepfade adressieren sie direkt).
 * @param {'minimal'|'mid'|'full'} tier
 * @param {{wikiLink?: boolean, clear?: boolean, extraClass?: string}} [opts]
 * @returns {string} HTML
 */
function buildEditorToolbar(editorId, tier, opts) {
    const t = tier === 'full' || tier === 'mid' ? tier : 'minimal';
    const o = opts || {};
    const groups = [editorToolbarCharsGroup(editorId, t)];
    if (t !== 'minimal') {
        groups.push(editorToolbarSeparator(), editorToolbarMidGroup(editorId, t, o));
    }
    if (t === 'full') {
        groups.push(editorToolbarSeparator(), editorToolbarLabelGroup(editorId));
    }
    if (t !== 'minimal') {
        groups.push(editorToolbarSeparator(), editorToolbarFontsGroup(editorId, t));
    }
    groups.push(editorToolbarRightGroup(editorId, t, o));
    const extra = o.extraClass ? ` ${o.extraClass}` : '';
    return (
        `<div class="editor-toolbar editor-toolbar-${t}${extra}" data-toolbar-for="${editorId}">` +
        groups.join('') +
        '</div>'
    );
}

window.buildEditorToolbar = buildEditorToolbar;
window.EDITOR_MARKER_COLORS = EDITOR_MARKER_COLORS;
window.EDITOR_BLOCK_ITEMS = EDITOR_BLOCK_ITEMS;
window.EDITOR_TOOLBAR_GROUPS = EDITOR_TOOLBAR_GROUPS;
