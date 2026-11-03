// [SECTION:NPC_RENDER]
// ============================================================
// NPC RENDER - @master-detail @filter @icons
// ============================================================
// State
let selectedNpcId = null;
let currentNpcFilter = 'all';
let currentRelationStatus = 'neutral';
// NPC type icons based on race
const NPC_ICONS = {
    mensch: '👤',
    human: '👤',
    elf: '🧝',
    zwerg: '⛏️',
    dwarf: '⛏️',
    halbling: '🍀',
    halfling: '🍀',
    ork: '👹',
    orc: '👹',
    goblin: '👺',
    drache: '🐉',
    dragon: '🐉',
    untot: '💀',
    undead: '💀',
    dämon: '😈',
    demon: '😈',
    tiefling: '😈',
    gnom: '🎩',
    gnome: '🎩',
    default: '🎭'
};
const RELATION_STATUS = {
    // SENKEN: ohne Prototyp — ein Schluessel aus Daten (`constructor`, `__proto__`) findet nichts
    __proto__: null,
    friendly: { label: 'Freundlich', icon: '🟢', color: 'var(--green)' },
    neutral: { label: 'Neutral', icon: '⚪', color: 'var(--text)' },
    hostile: { label: 'Feindlich', icon: '🔴', color: 'var(--red)' }
};
/**
 * Der Name eines NPC als HTML fuer Liste und Detail (Vertrag NPC-NAME, E1): ohne Namen (auch
 * nur aus Leerzeichen) ein gedimmtes "Unbenannt" (.npc-unbenannt). Gespeichert bleibt '' (so
 * setzt die Datengrenze einen fehlenden Namen, N1), und 💾 verlangt weiter einen Namen. Chips,
 * Popup und Suchen zeigen weiter den gespeicherten Wert. Name und Volk liest diese Datei ueber
 * datenText() (utils/basic.js, N2): Text fuer jeden Wert, auch zur Laufzeit an der Grenze vorbei.
 */
function npcNameHtml(npc) {
    const name = datenText(npc.name);
    return name.trim() ? esc(name) : '<span class="npc-unbenannt">Unbenannt</span>';
}
/**
 * Gets the appropriate icon for an NPC based on race
 */
function getNPCIcon(npc) {
    // Das Volk total gelesen (N2): `(npc.race || '').toLowerCase()` warf bei einer Zahl oder
    // einem Objekt — in jeder Lage — und leerte die ganze Liste.
    const race = datenText(npc.race).toLowerCase();
    // Ueber die Schluessel statt Object.entries: der Rueckgabewert ist sichtbar ein
    // Tabellenwert (Vertrag SENKEN, Ratsche tests/unit/html-senken.test.js).
    for (const key of Object.keys(NPC_ICONS)) {
        if (race.includes(key)) return NPC_ICONS[key];
    }
    return NPC_ICONS.default;
}
/**
 * Ein Dialogtext (HTML aus dem Editor) als sichtbarer Text fuer die Suche, kleingeschrieben
 * (Vertrag NPC-SUCHE, R4): <br> und die Grenzen von div, p, li, td und th (Tabellen schreibt
 * die App selbst in einen Dialog) werden ein Leerzeichen, alle anderen Tags fallen weg, &nbsp;
 * &lt; &gt; &amp; werden dekodiert (&amp; zuletzt, sonst wuerde "&amp;lt;" zu "<"), Leerraum
 * wird zusammengefasst. Ein eigener Normalisierer: stripHtml() klebt die Woerter beiderseits
 * einer Zeilengrenze zusammen ("Rabattenur"), dient aber der Anzeige und bleibt, wie es ist.
 */
function npcDialogSuchtext(html) {
    return html
        .replace(/<(br|\/?(div|p|li|td|th))\b[^>]*>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}
/**
 * Renders the NPC list in master-detail layout
 * Considers active filters and search terms
 */
function renderNPCList() {
    const D = window.D;
    const listContainer = $('npc-list');
    const filterContainer = $('npc-filters');
    if (!listContainer) return;
    // Update counter
    setViewCount('npcs', D.npcs?.length || 0);
    // Render filter chips (by location)
    if (filterContainer) {
        const locations = D.locations || [];
        filterContainer.innerHTML = `
            <div class="npc-filter-chip ${currentNpcFilter === 'all' ? 'active' : ''}" data-action="set-npc-filter" data-value="all">Alle</div>
            ${locations
                .slice(0, 5)
                .map(
                    loc => `
                <div class="npc-filter-chip ${currentNpcFilter === loc.id ? 'active' : ''}"
                     data-action="set-npc-filter" data-id="${esc(loc.id)}">
                    ${esc(loc.name)}
                </div>
            `
                )
                .join('')}
            ${
                locations.length > 5
                    ? `
                <select class="npc-filter-select" data-on-change="setNpcFilter">
                    <option value="">Mehr...</option>
                    ${locations
                        .slice(5)
                        .map(loc => `<option value="${esc(loc.id)}">${esc(loc.name)}</option>`)
                        .join('')}
                </select>
            `
                    : ''
            }
        `;
    }
    // Get search and filter — der Begriff einmal beim Lesen getrimmt (Vertrag NPC-SUCHE, R6):
    // der Leerzustand sieht denselben Begriff wie applyFilters() und der Dialogzweig.
    const searchEl = $('npc-search');
    const search = (searchEl?.value || '').trim().toLowerCase();
    // Apply filters (single pass). Der Dialogtext ist ein ODER-Zweig der Suche (searchAlso, R1),
    // kein customFilter mehr: der schraenkt nur ein, und seit 73d3193b fand die Ansicht einen
    // NPC mit Dialogen nur, wenn der Begriff in einem Feld UND einem Dialog stand. Total (R3):
    // dialogs, das keine Liste ist, und ein Element, dessen text kein String ist, treffen nie.
    const npcs = applyFilters(D.npcs || [], {
        searchText: search,
        searchFields: ['name', 'role', 'race', 'description'],
        searchAlso: (n, s) =>
            Array.isArray(n?.dialogs) &&
            n.dialogs.some(
                d => typeof d?.text === 'string' && npcDialogSuchtext(d.text).includes(s)
            ),
        filters: {
            locationId: currentNpcFilter !== 'all' ? currentNpcFilter : null
        }
    });
    // Alphabetisch, total fuer JEDEN Namen (Vertrag NPC-NAME, N2): `a.name.localeCompare(b.name)`
    // warf an einem Namen, der kein Text war, und leerte die ganze Liste — ob, hing an Lage UND
    // Engine (Chromium letzte/mittlere, Firefox erste/mittlere Lage; npc-altdaten.spec.js).
    // Ein NPC ohne Namen ('') steht vorn. Damit ist RUECKSPRUNG Offen (8) erledigt; Rundlauf
    // (12) haengt nicht mehr an diesem Wurf, sondern an einem Pruefwurf in getNPCIcon().
    npcs.sort((a, b) => datenText(a.name).localeCompare(datenText(b.name)));
    // Empty state
    if (!npcs.length) {
        listContainer.innerHTML = `
            <div class="npc-empty-state">
                <div class="npc-empty-icon">🎭</div>
                <div class="npc-empty-title">${search || currentNpcFilter !== 'all' ? 'Keine Treffer' : 'Keine NPCs'}</div>
                <div class="npc-empty-desc">${search || currentNpcFilter !== 'all' ? 'Versuche andere Suchbegriffe' : 'Erstelle deinen ersten NPC'}</div>
                ${
                    !search && currentNpcFilter === 'all'
                        ? `
                    <button class="npc-add-btn" data-action="show-new-npc-modal" style="margin-top: 12px;">
                        + NPC erstellen
                    </button>
                `
                        : ''
                }
            </div>
        `;
        clearNPCDetail();
        return;
    }
    // Render list items
    listContainer.innerHTML = npcs.map(npc => renderNPCItem(npc)).join('');
    // Auto-select first if none selected
    if (!selectedNpcId || !npcs.find(n => n.id === selectedNpcId)) {
        selectNPC(npcs[0].id, false);
    } else {
        showNPCDetail(selectedNpcId);
    }
}
function renderNPCItem(npc) {
    const location = EntityLookup.location(npc.locationId);
    const icon = getNPCIcon(npc);
    const isSelected = npc.id === selectedNpcId;
    const dialogCount = Number((npc.dialogs || []).length) || 0;
    const triggerCount = Number((npc.triggers || []).length) || 0;
    return `
        <div class="npc-item ${isSelected ? 'selected' : ''}" data-action="select-npc" data-id="${esc(npc.id)}">
            <div class="npc-item-avatar">
                ${sichereBildquelle(npc.avatar) ? `<img src="${esc(npc.avatar)}" alt="">` : icon}
            </div>
            <div class="npc-item-info">
                <div class="npc-item-name">
                    ${npcNameHtml(npc)}
                    ${location ? `<span class="npc-item-tag">${esc(location.name)}</span>` : ''}
                </div>
                <div class="npc-item-meta">
                    ${npc.race ? `<span class="npc-item-race">${esc(npc.race)}</span>` : ''}
                    ${npc.race && npc.role ? ' • ' : ''}
                    ${npc.role ? esc(npc.role) : ''}
                </div>
            </div>
            <div class="npc-item-badges">
                ${dialogCount ? `<span class="npc-badge dialog" title="${dialogCount} Dialoge">💬 ${dialogCount}</span>` : ''}
                ${triggerCount ? `<span class="npc-badge trigger" title="${triggerCount} Trigger">🔔 ${triggerCount}</span>` : ''}
            </div>
        </div>
    `;
}
function selectNPC(id, scroll = true) {
    selectedNpcId = typeof id === 'string' ? parseInt(id) : id;
    // Update selection in list
    document.querySelectorAll('.npc-item').forEach(el => {
        const element = el;
        element.classList.toggle('selected', element.dataset.id === String(selectedNpcId));
    });
    // Show detail
    showNPCDetail(selectedNpcId);
    // Scroll into view if needed
    if (scroll) {
        const item = document.querySelector(`.npc-item[data-id="${selectedNpcId}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
/**
 * Shows the detail view of an NPC in the right panel
 */
function showNPCDetail(id) {
    const LINK_ICONS = window.LINK_ICONS;
    const stripHtml = window.stripHtml;
    const panel = $('npc-detail-panel');
    if (!panel) return;
    const npc = EntityLookup.npc(id);
    if (!npc) {
        clearNPCDetail();
        return;
    }
    const location = EntityLookup.location(npc.locationId);
    const icon = getNPCIcon(npc);
    const dialogs = npc.dialogs || [];
    const triggers = npc.triggers || [];
    const usedDialogs = dialogs.filter(d => d.used).length;
    const tags = npc.tags || [];
    const links = npc.links || [];
    // Build dialogs list
    const dialogsHtml = dialogs.length
        ? dialogs
              .map(
                  (d, idx) => `
        <div class="npc-dialog-item ${d.used ? 'used' : ''}">
            <div class="npc-dialog-marker ${d.used ? 'used' : ''}">${idx + 1}</div>
            <div class="npc-dialog-content">
                <div class="npc-dialog-title">${esc(d.title || d.situation || 'Dialog ' + (idx + 1))}</div>
                <div class="npc-dialog-text">"${esc(stripHtml(d.text || '').substring(0, 100))}${(d.text || '').length > 100 ? '...' : ''}"</div>
            </div>
            <div class="npc-dialog-actions">
                <button class="npc-detail-btn small ${d.used ? '' : 'success'}"
                        data-action="toggle-npc-dialog-stop" data-id="${esc(npc.id)}" data-value="${idx}"
                        title="${d.used ? 'Als unbenutzt markieren' : 'Als verwendet markieren'}">
                    ${d.used ? '↩️' : '✓'}
                </button>
                <button class="npc-detail-btn small" data-action="copy-dialog-text-stop" data-id="${esc(npc.id)}" data-value="${idx}" title="Kopieren">📋</button>
            </div>
        </div>
    `
              )
              .join('')
        : '<div class="npc-detail-empty-text">Keine Dialoge vorhanden</div>';
    // Build triggers list
    const triggersHtml = triggers.length
        ? triggers
              .map(
                  (t, idx) => `
        <div class="npc-trigger-item ${t.triggered ? 'triggered' : ''}">
            <div class="npc-trigger-check ${t.triggered ? 'triggered' : ''}"
                 data-action="toggle-npc-trigger-stop" data-id="${esc(npc.id)}" data-value="${idx}">
                ${t.triggered ? '✓' : ''}
            </div>
            <div class="npc-trigger-content">
                <div class="npc-trigger-condition">${esc(t.condition)}</div>
                ${t.triggered ? `<div class="npc-trigger-reveal">${esc(t.reveal)}</div>` : ''}
            </div>
        </div>
    `
              )
              .join('')
        : '<div class="npc-detail-empty-text">Keine Trigger vorhanden</div>';
    // Build tags — in beiden Formen, die in D stehen (Vertrag NPC-NAME, E4): 🏷️ schreibt
    // {name, color}, Altdaten tragen Text. `esc(t)` zeigte das Objekt als "[object Object]".
    const tagsHtml = tags.length
        ? tags.map(t => `<span class="npc-tag">${esc(tagText(t))}</span>`).join('')
        : '';
    // Build links (LINK_ICONS from core/constants.js)
    const linksHtml = links.length
        ? links
              .map(link => {
                  const target = EntityLookup.get(link.type, link.id);
                  if (!target) return '';
                  return `<span class="npc-link" data-action="navigate-entity" data-type="${esc(link.type)}" data-id="${esc(link.id)}">${LINK_ICONS[link.type] || '🔗'} ${esc(target.name)}</span>`;
              })
              .join('')
        : '';
    panel.innerHTML = `
        <div class="npc-detail-content">
            <div class="npc-detail-header">
                <div class="npc-detail-avatar">
                    ${sichereBildquelle(npc.avatar) ? `<img src="${esc(npc.avatar)}" alt="">` : icon}
                </div>
                <div class="npc-detail-title">
                    <div class="npc-detail-name">${npcNameHtml(npc)}</div>
                    <div class="npc-detail-subtitle">
                        ${npc.race ? `<span class="npc-detail-race">${esc(npc.race)}</span>` : ''}
                        ${npc.race && npc.role ? ' • ' : ''}
                        ${npc.role ? `<span class="npc-detail-role">${esc(npc.role)}</span>` : ''}
                    </div>
                    ${location ? `<div class="npc-detail-location">📍 ${esc(location.name)}</div>` : ''}
                </div>
                <div class="npc-detail-actions">
                    <button class="npc-detail-btn" data-action="show-avatar-modal" data-type="npcs" data-id="${esc(npc.id)}" title="Bild">🖼️</button>
                    <button class="npc-detail-btn" data-action="show-relations-modal-stop" data-id="${esc(npc.id)}" title="Beziehungen">🤝</button>
                    <button class="npc-detail-btn" data-action="show-entity-links-modal" data-type="npcs" data-id="${esc(npc.id)}" title="Verknüpfungen">🔗</button>
                    <button class="npc-detail-btn" data-action="show-tags-modal" data-type="npcs" data-id="${esc(npc.id)}" title="Tags">🏷️</button>
                    <button class="npc-detail-btn" data-action="edit-npc" data-id="${esc(npc.id)}" title="Bearbeiten">✏️</button>
                    <button class="npc-detail-btn danger" data-action="delete-npc" data-id="${esc(npc.id)}" title="Löschen">🗑️</button>
                </div>
            </div>

            ${
                npc.description
                    ? `
                <div class="npc-section">
                    <div class="npc-section-title">Beschreibung</div>
                    <div class="npc-desc">${sanitizeHTML(npc.description)}</div>
                </div>
            `
                    : ''
            }

            ${
                tagsHtml
                    ? `
                <div class="npc-section">
                    <div class="npc-section-title">Tags</div>
                    <div class="npc-tags">${tagsHtml}</div>
                </div>
            `
                    : ''
            }

            <div class="npc-section">
                <div class="npc-section-title">
                    Beziehungen (${Number((npc.relations || []).length)})
                    <button class="npc-section-btn" data-action="show-relations-modal-stop" data-id="${esc(npc.id)}" title="Beziehung hinzufügen">+</button>
                </div>
                ${renderNPCRelations(npc)}
            </div>

            <div class="npc-section">
                <div class="npc-section-title">
                    Dialoge (${usedDialogs}/${Number(dialogs.length)} verwendet)
                    <button class="npc-section-btn" data-action="show-add-dialog-modal-stop" data-id="${esc(npc.id)}" title="Dialog hinzufügen">+</button>
                </div>
                <div class="npc-dialog-list">${dialogsHtml}</div>
            </div>

            <div class="npc-section">
                <div class="npc-section-title">Trigger (${Number(triggers.length)})</div>
                <div class="npc-trigger-list">${triggersHtml}</div>
            </div>

            ${
                linksHtml
                    ? `
                <div class="npc-section">
                    <div class="npc-section-title">Verknüpfungen</div>
                    <div class="npc-links">${linksHtml}</div>
                </div>
            `
                    : ''
            }
        </div>
    `;
}
function clearNPCDetail() {
    const panel = $('npc-detail-panel');
    if (panel) {
        panel.innerHTML = `
            <div class="npc-detail-empty">
                <div class="npc-detail-empty-icon">🎭</div>
                <div class="npc-detail-empty-text">Wähle einen NPC aus der Liste</div>
            </div>
        `;
    }
}
function setNpcFilter(f) {
    // Supports both direct values and element (from data-on-change)
    if (f && f.tagName) {
        // Element passed - extract value
        const val = f.value;
        f = val ? parseInt(val, 10) : 'all';
    }
    currentNpcFilter = f;
    selectedNpcId = null;
    renderNPCList();
}
function toggleNPC(id) {
    // For search navigation: select and show the NPC
    const npc = EntityLookup.npc(id);
    if (!npc) return;
    currentNpcFilter = 'all';
    selectedNpcId = typeof id === 'string' ? parseInt(id) : id;
    renderNPCList();
    setTimeout(() => {
        const item = document.querySelector(`.npc-item[data-id="${selectedNpcId}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.style.transition = 'box-shadow 0.3s ease';
            /* W3-D-05: Farbe aus --glow-gold statt aus volldeckendem
               var(--gold). ZWEI Lagen, weil eine (50 %) gegen die vier
               neutralen Flaechen nur 2,64 / 1,52 / 2,11 / 3,44 liest
               (dark/light/sepia/contrast) — in drei von vier Themes unter den
               3:1, die R-02 fuer nicht-Text verlangt. Zwei uebereinander
               ergeben 75 % und 4,09 / 1,91 / 3,24 / 5,79. Die Marke soll in
               zwei Sekunden zeigen, wohin gesprungen wurde; Zahlen und
               Ruecknahmeweg stehen in W3-F-01 Teil D. */
            item.style.boxShadow = '0 0 20px var(--glow-gold), 0 0 8px var(--glow-gold)';
            setTimeout(() => {
                item.style.boxShadow = '';
            }, 2000);
        }
    }, 100);
}
// Helper functions
function renderNPCTags(n) {
    const D = window.D;
    const questTags = (n.quests || [])
        .map(q => {
            const quest = (D.quests || []).find(
                qst => qst.name && qst.name.toLowerCase() === q.toLowerCase()
            );
            if (quest) {
                return `<span class="npc-list-tag quest clickable" data-action="navigate-entity-stop" data-type="quests" data-id="${esc(quest.id)}">📜 ${esc(q)}</span>`;
            }
            return `<span class="npc-list-tag quest">📜 ${esc(q)}</span>`;
        })
        .join('');
    const relationTags = (n.relationships || [])
        .map(r => {
            const npc = (D.npcs || []).find(
                np => np.name && np.name.toLowerCase() === r.toLowerCase()
            );
            const char = (D.characters || []).find(
                c => c.name && c.name.toLowerCase() === r.toLowerCase()
            );
            if (npc) {
                return `<span class="npc-list-tag relation clickable" data-action="navigate-entity-stop" data-type="npcs" data-id="${esc(npc.id)}">👥 ${esc(r)}</span>`;
            } else if (char) {
                return `<span class="npc-list-tag relation clickable" data-action="navigate-entity-stop" data-type="characters" data-id="${esc(char.id)}">👥 ${esc(r)}</span>`;
            }
            return `<span class="npc-list-tag relation">👥 ${esc(r)}</span>`;
        })
        .join('');
    const infoTags = (n.info || [])
        .map(i => `<span class="npc-list-tag info">ℹ️ ${esc(i)}</span>`)
        .join('');
    return { questTags, relationTags, infoTags };
}
// Legacy compatibility functions
function expandAllNPCCards() {
    showToast('Alle NPCs werden in der Liste angezeigt');
}
function collapseAllNPCCards() {
    selectedNpcId = null;
    clearNPCDetail();
    showToast('Details-Panel geleert');
}
function expandAllNPCDialogs() {
    showToast('Dialoge werden im Detail-Panel angezeigt');
}
function collapseAllNPCDialogs() {
    showToast('Wähle einen NPC für Details');
}
// ============================================================
// NPC RELATIONS SYSTEM
// ============================================================
/** Statuswerte einer Beziehung, die als Klasse landen duerfen (Vertrag SENKEN R2). */
const RELATION_STATUS_KLASSEN = Object.keys(RELATION_STATUS);
function renderNPCRelations(npc) {
    const relations = npc.relations || [];
    if (!relations.length) {
        return '<div class="npc-detail-empty-text">Keine Beziehungen definiert</div>';
    }
    return `
        <div class="npc-relations-list">
            ${relations
                .map((rel, idx) => {
                    let targetName,
                        icon,
                        typeLabel,
                        isClickable = true;
                    if (rel.targetType === 'party') {
                        targetName = 'Die Gruppe';
                        icon = '👥';
                        typeLabel = 'Heldengruppe';
                        isClickable = false; // Party is not a single entity to navigate to
                    } else if (rel.targetType === 'characters') {
                        const target = EntityLookup.character(rel.targetId);
                        if (!target) return '';
                        targetName = target.name;
                        icon = '👤';
                        typeLabel = 'Spielercharakter';
                    } else {
                        const target = EntityLookup.npc(rel.targetId);
                        if (!target) return '';
                        targetName = target.name;
                        icon = '🎭';
                        typeLabel = 'NPC';
                    }
                    const status = RELATION_STATUS[rel.status] || RELATION_STATUS.neutral;
                    // Ein unbekannter Status zeigt schon heute "Neutral" — die Klasse folgt ihm.
                    const statusKlasse = sichereKlasse(
                        rel.status,
                        RELATION_STATUS_KLASSEN,
                        'neutral'
                    );
                    return `
                    <div class="npc-relation-item">
                        <span class="npc-relation-icon">${icon}</span>
                        <div class="npc-relation-info">
                            <div class="npc-relation-name"
                                 ${isClickable ? `data-action="navigate-entity-stop" data-type="${esc(rel.targetType)}" data-id="${esc(rel.targetId)}"` : ''}>
                                ${esc(targetName)}
                            </div>
                            <div class="npc-relation-type">
                                ${typeLabel}
                                ${rel.note ? ` • ${esc(rel.note)}` : ''}
                            </div>
                        </div>
                        <div class="npc-relation-bar">
                            <div class="npc-relation-fill ${statusKlasse}"></div>
                        </div>
                        <span class="npc-relation-status ${statusKlasse}">${status.label}</span>
                        <div class="npc-relation-actions">
                            <button class="npc-relation-btn" data-action="cycle-relation-status-stop" data-id="${esc(npc.id)}" data-value="${idx}" title="Status ändern">🔄</button>
                            <button class="npc-relation-btn danger" data-action="remove-relation-stop" data-id="${esc(npc.id)}" data-value="${idx}" title="Entfernen">✕</button>
                        </div>
                    </div>
                `;
                })
                .filter(Boolean)
                .join('')}
        </div>
    `;
}
function showRelationsModal(npcId) {
    const D = window.D;
    const npc = EntityLookup.npc(npcId);
    if (!npc) return;
    // Build options for Party, NPCs and Characters
    const partyOption =
        D.characters?.length > 0
            ? `<option value="party:0" selected>👥 Die Gruppe (alle Charaktere)</option>`
            : '';
    const npcOptions = (D.npcs || [])
        .filter(n => n.id !== npc.id) // Exclude self
        .map(n => `<option value="npcs:${esc(n.id)}">${esc(n.name)} (NPC)</option>`)
        .join('');
    const charOptions = (D.characters || [])
        .map(c => `<option value="characters:${esc(c.id)}">${esc(c.name)} (Charakter)</option>`)
        .join('');
    const existingRelations = (npc.relations || [])
        .map((rel, idx) => {
            let targetName, targetIcon;
            if (rel.targetType === 'party') {
                targetName = 'Die Gruppe';
                targetIcon = '👥';
            } else if (rel.targetType === 'characters') {
                const target = EntityLookup.character(rel.targetId);
                if (!target) return '';
                targetName = target.name;
                targetIcon = '👤';
            } else {
                const target = EntityLookup.npc(rel.targetId);
                if (!target) return '';
                targetName = target.name;
                targetIcon = '🎭';
            }
            const status = RELATION_STATUS[rel.status] || RELATION_STATUS.neutral;
            return `
            <div class="npc-relation-item">
                <span class="npc-relation-icon">${targetIcon}</span>
                <div class="npc-relation-info">
                    <div class="npc-relation-name">${esc(targetName)}</div>
                </div>
                <span class="npc-relation-status ${sichereKlasse(rel.status, RELATION_STATUS_KLASSEN, 'neutral')}">${status.label}</span>
                <button class="npc-relation-btn danger" data-action="remove-relation-modal" data-id="${esc(npcId)}" data-value="${idx}">✕</button>
            </div>
        `;
        })
        .filter(Boolean)
        .join('');
    const content = `
        <div class="relations-modal-content">
            <div class="relations-modal-header">
                <h3>🤝 Beziehungen verwalten</h3>
                <button class="btn btn-sm" data-action="hide-modal" data-value="relations-modal">✕</button>
            </div>
            <p style="color: var(--text-dim); margin-bottom: 16px;">NPC: <strong>${esc(npc.name)}</strong></p>

            <div class="relations-form">
                <div class="relations-form-row">
                    <select id="relation-target">
                        <option value="">— Ziel wählen —</option>
                        ${partyOption}
                        <optgroup label="NPCs">${npcOptions}</optgroup>
                        <optgroup label="Charaktere">${charOptions}</optgroup>
                    </select>
                </div>
                <div class="relations-form-row">
                    <div class="relations-status-btns">
                        <button class="relations-status-btn friendly" data-action="set-relation-status" data-value="friendly" id="rel-btn-friendly">🟢 Freundlich</button>
                        <button class="relations-status-btn neutral active" data-action="set-relation-status" data-value="neutral" id="rel-btn-neutral">⚪ Neutral</button>
                        <button class="relations-status-btn hostile" data-action="set-relation-status" data-value="hostile" id="rel-btn-hostile">🔴 Feindlich</button>
                    </div>
                </div>
                <div class="relations-form-row">
                    <input type="text" id="relation-note" placeholder="Notiz (optional)...">
                </div>
                <div class="relations-form-row">
                    <button class="relations-add-btn" data-action="add-relation" data-id="${esc(npcId)}">+ Beziehung hinzufügen</button>
                </div>
            </div>

            ${
                existingRelations
                    ? `
                <div class="relations-existing">
                    <div class="relations-existing-title">Bestehende Beziehungen:</div>
                    <div class="npc-relations-list">${existingRelations}</div>
                </div>
            `
                    : ''
            }
        </div>
    `;
    // Create or reuse modal
    let modal = $('relations-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'relations-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 500px;">${content}</div>`;
        modal.onclick = e => {
            if (e.target === modal) hideModal('relations-modal');
        };
        document.body.appendChild(modal);
    } else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) modalContent.innerHTML = content;
    }
    // Store current status
    modal.dataset.currentStatus = 'neutral';
    showModal('relations-modal');
}
function setRelationStatus(status) {
    currentRelationStatus = status;
    document.querySelectorAll('.relations-status-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `rel-btn-${status}`);
    });
}
function addRelation(npcId) {
    const npc = EntityLookup.npc(npcId);
    if (!npc) return;
    const targetEl = $('relation-target');
    const targetVal = targetEl?.value;
    if (!targetVal) {
        showToast('Bitte ein Ziel wählen', 'error');
        return;
    }
    const [targetType, targetIdStr] = targetVal.split(':');
    const targetId = parseInt(targetIdStr);
    // Check if relation already exists
    if (!npc.relations) npc.relations = [];
    if (npc.relations.some(r => r.targetType === targetType && r.targetId === targetId)) {
        showToast('Beziehung existiert bereits', 'warning');
        return;
    }
    pushUndo('Beziehung hinzufügen');
    const noteEl = $('relation-note');
    const note = noteEl?.value?.trim() || '';
    npc.relations.push({
        targetId,
        targetType,
        status: currentRelationStatus,
        note
    });
    hideModal('relations-modal');
    showNPCDetail(npcId);
    save();
    showToast('Beziehung hinzugefügt');
}
function removeRelation(npcId, index) {
    const npc = EntityLookup.npc(npcId);
    if (!npc || !npc.relations) return;
    const idx = typeof index === 'string' ? parseInt(index) : index;
    pushUndo('Beziehung entfernen');
    npc.relations.splice(idx, 1);
    showNPCDetail(npcId);
    showRelationsModal(npcId); // Refresh modal
    save();
    showToast('Beziehung entfernt');
}
function cycleRelationStatus(npcId, index) {
    const npc = EntityLookup.npc(npcId);
    if (!npc || !npc.relations) return;
    const idx = typeof index === 'string' ? parseInt(index) : index;
    if (!npc.relations[idx]) return;
    pushUndo('Beziehungsstatus ändern');
    const statusOrder = ['friendly', 'neutral', 'hostile'];
    const currentIdx = statusOrder.indexOf(npc.relations[idx].status);
    npc.relations[idx].status = statusOrder[(currentIdx + 1) % 3];
    showNPCDetail(npcId);
    save();
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
// toggleNPC() hat im Produktionscode genau einen Verbraucher,
// navigateToResult() in systems/search/global-search.js (NSC ohne Ort); der
// ruft sie ohne window-Export (Export-Audit-Regel). ESLint meldet die Funktion
// trotzdem als unbenutzt — es prueft je Datei. Kein toter Code.
window.selectedNpcId = selectedNpcId;
window.renderNPCList = renderNPCList;
window.selectNPC = selectNPC;
window.setNpcFilter = setNpcFilter;
window.showRelationsModal = showRelationsModal;
window.setRelationStatus = setRelationStatus;
window.addRelation = addRelation;
window.removeRelation = removeRelation;
window.cycleRelationStatus = cycleRelationStatus;
