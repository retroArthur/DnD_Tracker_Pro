// [SECTION:MARKDOWN_IMPORT_EXPORT]
// Markdown Import/Export fuer die Formulare von NPC, Quest und Zauber
// ============================================================
// Die Knoepfe "📄 Export" und "📥 Import" stehen im Fuss der drei Formulare
// (assets/templates/modals-entity.html, sichtbar nur beim Bearbeiten) und
// laufen ueber 'export-markdown' / 'import-markdown' in
// ui/actions/system-actions.js.
//
// ZWEI REGELN (MARKDOWN, docs/bugfixes.md):
//  - Der Export liest den GESPEICHERTEN Stand aus D, nicht das Formular.
//  - Der Import schreibt in das Editorfeld des OFFENEN Formulars, nicht nach D.
//    Erst "Speichern" sichert ihn — Undo, Sanitisierung, Speichern und Render
//    kommen aus saveNPC()/saveQuest()/saveSpell(), und ✕ verwirft ihn wie
//    jede andere Aenderung im Formular. Frueher schrieb der Import an D vorbei,
//    und das naechste "Speichern" im noch offenen Formular schrieb die alte
//    Beschreibung zurueck.

/**
 * Die drei Formulare: wo ID, Name, Beschreibung und (nur beim Zauber) die
 * Notiz stehen.
 */
const MARKDOWN_FORMULARE = {
    npcs: {
        modal: 'npc-modal',
        id: 'edit-npc-id',
        name: 'npc-name',
        editor: 'npc-desc',
        notiz: null
    },
    quests: {
        modal: 'quest-modal',
        id: 'edit-quest-id',
        name: 'quest-title',
        editor: 'quest-desc',
        notiz: null
    },
    spells: {
        modal: 'spell-modal',
        id: 'edit-spell-id',
        name: 'spell-name',
        editor: 'spell-desc',
        notiz: 'spell-note'
    }
};

/** Die Labels, die der eigene Export-Kopf schreibt (buildEntityMarkdown()). */
const MARKDOWN_KOPF_LABELS = new Set([
    'Typ',
    'Rasse',
    'Rolle',
    'Status',
    'Auftraggeber',
    'Ort',
    'Stufe',
    'Schule',
    'Klassen'
]);

/**
 * Zustand der EINEN Import-Schale. `lesung` zaehlt Oeffnen und Dateiwahlen:
 * ein FileReader, der erst nach einer neueren Wahl fertig wird, verfaellt.
 */
const markdownImportZustand = { entityType: null, entityId: null, markdown: '', lesung: 0 };

/**
 * ID des Eintrags im offenen Formular ('' ohne Formular oder beim Anlegen).
 * @param {string} entityType - npcs | quests | spells
 * @returns {string}
 */
function markdownFormularId(entityType) {
    const formular = MARKDOWN_FORMULARE[entityType];
    const feld = formular ? document.getElementById(formular.id) : null;
    return feld ? feld.value : '';
}

/**
 * @param {string} entityType - npcs | quests | spells
 * @param {number|string} entityId
 */
function findMarkdownEntity(entityType, entityId) {
    if (entityType === 'npcs') return EntityLookup.npc(entityId);
    if (entityType === 'quests') return EntityLookup.quest(entityId);
    if (entityType === 'spells') return EntityLookup.spell(entityId);
    return null;
}

// ============================================================
// EXPORT
// ============================================================
/**
 * Baut den Markdown-Text eines Eintrags: Titel, Kopf aus "**Label:** Wert"-
 * Zeilen, Beschreibung, beim Zauber die Notiz als "## Notizen".
 * @param {string} entityType - npcs | quests | spells
 * @param {object} entity
 * @returns {string}
 */
function buildEntityMarkdown(entityType, entity) {
    const zeilen = [`# ${entity.name || entity.title || 'Unbekannt'}`, ''];
    if (entityType === 'npcs') {
        zeilen.push('**Typ:** NPC');
        if (entity.race) zeilen.push(`**Rasse:** ${entity.race}`);
        if (entity.role) zeilen.push(`**Rolle:** ${entity.role}`);
    } else if (entityType === 'quests') {
        zeilen.push(`**Status:** ${entity.completed ? 'Abgeschlossen' : 'Offen'}`);
        // giverName/locationName schreibt saveQuest() aus dem Text der
        // gewaehlten Option — ohne Wahl ist das der Platzhalter
        // ("-- NPC wählen --"). Der Name zaehlt darum nur zusammen mit der ID;
        // ohne ID gilt das Altfeld giver/location.
        const auftraggeber = entity.giverId ? entity.giverName : entity.giver;
        const ort = entity.locationId ? entity.locationName : entity.location;
        if (auftraggeber) zeilen.push(`**Auftraggeber:** ${auftraggeber}`);
        if (ort) zeilen.push(`**Ort:** ${ort}`);
    } else if (entityType === 'spells') {
        // "Typ" nennt die Art des Eintrags wie beim NPC — `type` des Zaubers
        // ist seine Farbkategorie (spell/healing/...), kein Text fuer Menschen.
        zeilen.push('**Typ:** Zauber');
        zeilen.push(`**Stufe:** ${entity.level || 0}`);
        zeilen.push(`**Schule:** ${entity.school || 'Unbekannt'}`);
        zeilen.push(`**Klassen:** ${(entity.spellClasses || []).join(', ') || 'Keine'}`);
    }
    let markdown = zeilen.join('\n') + '\n\n';
    const beschreibung = htmlToMarkdown(entity.description || '').trim();
    if (beschreibung) markdown += beschreibung + '\n\n';
    const notiz = htmlToMarkdown(entity.note || '').trim();
    if (notiz) markdown += '## Notizen\n\n' + notiz + '\n\n';
    // Genau EIN Zeilenumbruch am Ende — htmlToMarkdown haengt an Bloecke selbst
    // Leerzeilen an, frueher blieben bis zu sechs stehen.
    return markdown.replace(/\s+$/, '') + '\n';
}

/**
 * Laedt den Text als .md-Datei herunter. Nach dem Muster von
 * downloadHandoutAsHTML() (features/shops/shop-export.js); bis 2026-10-27
 * stand hier ein Aufruf von window.downloadFile, das es nie gab — der Guard
 * davor schwieg, und der Knopf tat nichts.
 * @param {string} dateiname
 * @param {string} markdown
 * @returns {boolean} ob der Download ausgeloest wurde
 */
function downloadMarkdownFile(dateiname, markdown) {
    if (typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
        showToast('⚠️ Browser unterstützt keinen Download', 'error');
        return false;
    }
    try {
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = dateiname;
        link.hidden = true;
        document.body.appendChild(link);
        link.click();
        // Verzoegert aufraeumen: ein sofortiges revokeObjectURL kann den
        // Download in manchen Browsern abbrechen.
        setTimeout(() => {
            link.remove();
            URL.revokeObjectURL(url);
        }, 100);
        return true;
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.log('markdown-export', error, 'Download-Fehler');
        }
        showToast('❌ Download fehlgeschlagen', 'error');
        return false;
    }
}

/**
 * Exportiert den gespeicherten Stand eines Eintrags als Markdown-Datei.
 * @param {string} entityType - npcs | quests | spells
 * @param {number|string} entityId
 */
function exportEntityAsMarkdown(entityType, entityId) {
    const entity = findMarkdownEntity(entityType, entityId);
    if (!entity) {
        showToast('⚠️ Eintrag nicht gefunden', 'error');
        return;
    }
    const markdown = buildEntityMarkdown(entityType, entity);
    const name = String(entity.name || entity.title || '');
    const stamm = name
        .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_');
    const dateiname = `${stamm || 'export'}.md`;
    if (downloadMarkdownFile(dateiname, markdown)) {
        showToast(`📄 ${dateiname} exportiert`);
    }
}

// ============================================================
// IMPORT
// ============================================================
/**
 * Baut die Import-Schale beim ersten Bedarf und danach nie wieder. Projektform
 * `.modal-overlay > .modal`, damit showModal()/ModalFocus sie wie jede andere
 * Schale fuehren (obenauf, Tab gefangen, Escape schliesst nur sie). Die
 * Listener haengen ueber data-action an EventDelegation — nicht an der Schale,
 * also auch nicht bei jedem Oeffnen ein weiterer.
 *
 * Zur Laufzeit und nicht im Template: die eine Inline-Schriftgroesse der
 * "Vorschau:"-Zeile zaehlt die Ratsche W5-R-08 (design-consistency) in genau
 * dieser Datei.
 * @returns {HTMLElement}
 */
function ensureMarkdownImportShell() {
    const vorhanden = document.getElementById('markdown-import-modal');
    if (vorhanden) return vorhanden;
    const huelle = document.createElement('div');
    huelle.innerHTML = `
        <div class="modal-overlay" id="markdown-import-modal">
            <div class="modal" style="max-width: 560px;">
                <div class="modal-header">
                    <span class="modal-title">📥 Markdown importieren</span>
                    <button class="btn btn-sm" data-action="hide-modal" data-value="markdown-import-modal">✕</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-dim); margin-bottom: 12px;">
                        Wähle eine Markdown-Datei (.md). Ihr Inhalt ersetzt die Beschreibung im offenen Formular – gesichert wird er erst mit „Speichern“.
                    </p>
                    <input type="file" id="markdown-import-file" accept=".md,.markdown,.txt" data-action="markdown-import-file">
                    <div id="markdown-import-preview" hidden style="max-height: 300px; overflow-y: auto; padding: 8px; background: var(--bg-elevated); border-radius: 4px; margin-top: 12px;">
                        <div style="color: var(--text-dim); font-size: var(--text-md); margin-bottom: 8px;">Vorschau:</div>
                        <div id="markdown-import-preview-content"></div>
                    </div>
                </div>
                <div class="modal-footer btn-group">
                    <button class="btn btn-primary" id="markdown-import-confirm" data-action="markdown-import-confirm" disabled>Importieren</button>
                    <button class="btn" data-action="hide-modal" data-value="markdown-import-modal">Abbrechen</button>
                </div>
            </div>
        </div>
    `;
    const schale = /** @type {HTMLElement} */ (huelle.firstElementChild);
    document.body.appendChild(schale);
    return schale;
}

/**
 * Oeffnet die Import-Schale fuer das offene Formular — bei JEDEM Oeffnen
 * zurueckgesetzt: Feld leer, Vorschau verborgen, "Importieren" aus.
 * @param {string} entityType - npcs | quests | spells
 * @param {number|string} entityId
 */
function showMarkdownImportModal(entityType, entityId) {
    if (!MARKDOWN_FORMULARE[entityType]) return;
    ensureMarkdownImportShell();
    const zustand = markdownImportZustand;
    zustand.entityType = entityType;
    zustand.entityId = String(entityId);
    zustand.markdown = '';
    zustand.lesung++;
    /** @type {HTMLInputElement} */ (document.getElementById('markdown-import-file')).value = '';
    document.getElementById('markdown-import-preview').hidden = true;
    document.getElementById('markdown-import-preview-content').innerHTML = '';
    /** @type {HTMLButtonElement} */ (document.getElementById('markdown-import-confirm')).disabled =
        true;
    showModal('markdown-import-modal');
}

/**
 * Liest die gewaehlte Datei und zeigt, was in der Beschreibung landen wird.
 * @param {HTMLInputElement} input - #markdown-import-file
 */
function readMarkdownImportFile(input) {
    const datei = input && input.files ? input.files[0] : null;
    if (!datei) return; // Dateidialog abgebrochen
    const zustand = markdownImportZustand;
    const lesung = ++zustand.lesung;
    const leser = new FileReader();
    leser.onload = () => {
        if (lesung !== zustand.lesung) return;
        zustand.markdown = String(leser.result || '');
        const { text } = splitMarkdownImport(
            zustand.entityType,
            zustand.entityId,
            zustand.markdown
        );
        document.getElementById('markdown-import-preview-content').innerHTML = sanitizeHTML(
            markdownToHtml(text)
        );
        document.getElementById('markdown-import-preview').hidden = false;
        /** @type {HTMLButtonElement} */ (
            document.getElementById('markdown-import-confirm')
        ).disabled = !zustand.markdown.trim();
    };
    leser.onerror = () => {
        if (lesung !== zustand.lesung) return;
        showToast('❌ Datei konnte nicht gelesen werden', 'error');
    };
    leser.readAsText(datei);
}

/**
 * Trennt den eigenen Export-Kopf ab, damit Export -> Import eine Rundreise
 * ist. Als eigener Kopf gilt NUR: erste Zeile "# <Name des Eintrags>", eine
 * Leerzeile, dann eine oder mehr Zeilen "**Label:** Wert" mit Labels, die der
 * Export schreibt. Eine fremde Datei mit "# " oben bleibt unangetastet.
 * Steht im Formular ein Notizfeld (Zauber), geht ein "## Notizen"-Abschnitt
 * des eigenen Exports dorthin zurueck; sonst bleibt er in der Beschreibung.
 * @param {string} entityType - npcs | quests | spells
 * @param {string} entityId
 * @param {string} markdown
 * @returns {{text: string, notiz: string|null}}
 */
function splitMarkdownImport(entityType, entityId, markdown) {
    const formular = MARKDOWN_FORMULARE[entityType];
    // markdownToHtml() kennt nur \n — Windows-Zeilenenden und BOM angleichen.
    let text = String(markdown || '')
        .replace(/^\uFEFF/, '')
        .replace(/\r\n?/g, '\n');
    let notiz = null;
    const kopf = text.match(/^# ([^\n]+)\n\n((?:\*\*[^*\n]+:\*\*[^\n]*(?:\n|$))+)/);
    if (kopf && formular) {
        const entity = findMarkdownEntity(entityType, entityId);
        const nameFeld = /** @type {HTMLInputElement|null} */ (
            document.getElementById(formular.name)
        );
        const namen = [entity && (entity.name || entity.title), nameFeld && nameFeld.value]
            .filter(Boolean)
            .map(n => String(n).trim());
        const labels = [...kopf[2].matchAll(/\*\*([^*\n]+):\*\*/g)].map(m => m[1]);
        if (namen.includes(kopf[1].trim()) && labels.every(l => MARKDOWN_KOPF_LABELS.has(l))) {
            text = text.slice(kopf[0].length).replace(/^\n+/, '');
            const marke = '## Notizen\n';
            let stelle = text.lastIndexOf('\n' + marke);
            stelle = stelle === -1 ? (text.startsWith(marke) ? 0 : -1) : stelle + 1;
            if (formular.notiz && stelle !== -1) {
                notiz = text.slice(stelle + marke.length).trim();
                text = text.slice(0, stelle);
            }
        }
    }
    return { text: text.replace(/\s+$/, ''), notiz };
}

/**
 * Schreibt das Markdown in das Editorfeld des offenen Formulars (beim Zauber
 * die Notizen ins Notizfeld). Kein D, kein save() — das macht "Speichern".
 * @param {string} entityType - npcs | quests | spells
 * @param {string} entityId
 * @param {string} markdown
 * @returns {boolean} ob uebernommen wurde
 */
function executeMarkdownImport(entityType, entityId, markdown) {
    const formular = MARKDOWN_FORMULARE[entityType];
    const modal = formular ? document.getElementById(formular.modal) : null;
    const editor = formular ? document.getElementById(formular.editor) : null;
    // Ziel ist das Formular, aus dem die Schale geoeffnet wurde. Ist es zu
    // oder traegt es inzwischen einen anderen Eintrag, wird nichts ueberschrieben.
    if (
        !editor ||
        !modal ||
        !modal.classList.contains('show') ||
        markdownFormularId(entityType) !== String(entityId)
    ) {
        showToast('⚠️ Formular nicht mehr offen – Import verworfen', 'error');
        return false;
    }
    const { text, notiz } = splitMarkdownImport(entityType, entityId, markdown);
    // sanitizeHTML AUSDRUECKLICH: markdownToHtml() sanitisiert nur, wenn
    // sanitizeHTML zur Laufzeit da ist (fail-open), und das Feld steht live im DOM.
    editor.innerHTML = sanitizeHTML(markdownToHtml(text));
    if (notiz !== null) {
        const notizFeld = document.getElementById(formular.notiz);
        if (notizFeld) notizFeld.innerHTML = sanitizeHTML(markdownToHtml(notiz));
    }
    showToast('Markdown übernommen – mit Speichern sichern');
    return true;
}

/** "Importieren" in der Schale: uebernehmen, dann schliessen — der Fokus geht
 *  ueber hideModal()/ModalFocus an "📥 Import" zurueck. */
function confirmMarkdownImport() {
    const zustand = markdownImportZustand;
    if (!zustand.markdown) return;
    executeMarkdownImport(zustand.entityType, zustand.entityId, zustand.markdown);
    zustand.markdown = '';
    hideModal('markdown-import-modal');
}

// ============================================================
// EXPORTS
// ============================================================
// Verbraucher aller fuenf: die Aktionen 'export-markdown', 'import-markdown',
// 'markdown-import-file' und 'markdown-import-confirm' in
// ui/actions/system-actions.js.
window.exportEntityAsMarkdown = exportEntityAsMarkdown;
window.showMarkdownImportModal = showMarkdownImportModal;
window.markdownFormularId = markdownFormularId;
window.readMarkdownImportFile = readMarkdownImportFile;
window.confirmMarkdownImport = confirmMarkdownImport;
