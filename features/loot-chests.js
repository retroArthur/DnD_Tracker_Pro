// [SECTION:LOOT_CHESTS]
// Fest befüllte Truhen mit wiederholbaren, gewichteten Drops.

function isLootChestWeight(weight) {
    return Number.isFinite(weight) && weight >= 0 && weight <= 1e6;
}

function pickLootChestEntry(entries, sample = Math.random()) {
    if (!Array.isArray(entries) || !Number.isFinite(sample) || sample < 0 || sample >= 1) {
        return null;
    }
    const eligible = entries.filter(entry => isLootChestWeight(entry?.weight) && entry.weight > 0);
    const total = eligible.reduce((sum, entry) => sum + entry.weight, 0);
    let remaining = sample * total;
    for (const entry of eligible) {
        if (remaining < entry.weight) return entry;
        remaining -= entry.weight;
    }
    // Rundung nahe am Intervallende darf einen gültigen Wurf nicht verwerfen.
    return eligible.at(-1) ?? null;
}

(() => {
    const modalId = 'loot-chests-modal';
    const quickDropModalId = 'loot-chest-quick-drop-modal';
    const percent = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 2 });
    let selectedId = null;
    let chestMode = 'choose';
    let itemToPlaceId = null;
    let initializedModal;
    let initializedQuickModal;
    let quickDropChest;
    let modalOpening = 0;
    let renderedChest = null;
    let weightInputs = new WeakMap();
    const expandedTemplates = new Set();

    function chests() {
        return Array.isArray(window.D.lootChests) ? window.D.lootChests : [];
    }

    function selectedChest() {
        return chestMode === 'create' ? null : chests().find(chest => chest.id === selectedId);
    }

    function linkedItem(entry, items) {
        if (entry.sourceItemId !== undefined) {
            return items.find(item => item.id === entry.sourceItemId);
        }
        // Ältere Vorlagen haben nur die Kopie. Nur eindeutige Treffer verlinken.
        const matches = items.filter(
            item =>
                item.name.trim() === entry.name &&
                (!entry.category || item.category === entry.category) &&
                (!entry.rarity || item.rarity === entry.rarity) &&
                (!entry.description || stripHtml(item.description) === entry.description)
        );
        return matches.length === 1 ? matches[0] : null;
    }

    function openLinkedItem(entry) {
        const item = linkedItem(entry, catalog());
        if (!item) {
            renderTemplates();
            return;
        }
        window.setLootChestView(false);
        const findRow = () =>
            [...$('loot-list').children].find(row => row.dataset.id === String(item.id));
        if (!findRow()) {
            clearSearchForResult('loot-search');
            window.setLootFilter('all');
        }
        window.selectLoot(item.id);
        requestAnimationFrame(() => {
            const row = findRow();
            if (row?.getClientRects().length) row.focus({ preventScroll: true });
        });
    }

    function renderTemplatePreview(chest, preview) {
        const items = catalog();
        const total = chest.entries.reduce((sum, entry) => sum + entry.weight, 0);
        const rows = document.createDocumentFragment();
        if (chest.entries.length === 0) {
            rows.append(
                createElement(
                    'li',
                    { className: 'loot-chest-preview-entry' },
                    'Die Truhe ist leer.'
                )
            );
        }
        for (const entry of chest.entries) {
            const item = linkedItem(entry, items);
            const label = item
                ? createElement(
                      'button',
                      {
                          type: 'button',
                          className: 'btn btn-sm',
                          title: 'In Items öffnen',
                          onClick: () => openLinkedItem(entry)
                      },
                      entry.name
                  )
                : createElement('span', { title: 'Nur als Truheneintrag verfügbar' }, entry.name);
            rows.append(
                createElement(
                    'li',
                    { className: 'loot-chest-preview-entry' },
                    label,
                    createElement(
                        'span',
                        { className: 'loot-chest-chance' },
                        displayChance(entry.weight, total)
                    )
                )
            );
        }
        preview.replaceChildren(rows);
    }

    function renderTemplates() {
        if ($('loot-chest-templates')?.hidden !== false) return;
        const all = chests();
        const rows = document.createDocumentFragment();
        for (const chest of all) {
            const count = chest.entries.length;
            const canDrop = chest.entries.some(
                entry => isLootChestWeight(entry.weight) && entry.weight > 0
            );
            const previewId = `loot-chest-preview-${chest.id}`;
            const expanded = expandedTemplates.has(chest.id);
            const preview = createElement('ul', {
                id: previewId,
                className: 'loot-chest-template-preview',
                hidden: !expanded
            });
            const toggle = createElement(
                'button',
                {
                    type: 'button',
                    className: 'loot-chest-preview-toggle',
                    'aria-label': chest.name,
                    'aria-controls': previewId,
                    'aria-expanded': String(expanded),
                    onClick: () => {
                        if (preview.hidden) {
                            expandedTemplates.add(chest.id);
                            renderTemplatePreview(chest, preview);
                        } else {
                            expandedTemplates.delete(chest.id);
                        }
                        preview.hidden = !preview.hidden;
                        toggle.setAttribute('aria-expanded', String(!preview.hidden));
                    }
                },
                chest.name
            );
            if (expanded) renderTemplatePreview(chest, preview);
            const action = {
                type: 'button',
                'data-action': 'open-loot-chest-template',
                'data-id': chest.id,
                'aria-haspopup': 'dialog'
            };
            rows.append(
                createElement(
                    'li',
                    { className: 'loot-chest-template' },
                    createElement(
                        'div',
                        { className: 'loot-chest-template-label' },
                        createElement('h3', {}, toggle),
                        createElement(
                            'span',
                            { className: 'loot-chest-template-count' },
                            count === 1 ? '1 Gegenstand' : `${count} Gegenstände`
                        )
                    ),
                    createElement(
                        'div',
                        { className: 'loot-chest-template-actions' },
                        createElement(
                            'button',
                            {
                                ...action,
                                className: 'btn',
                                'aria-label': `${chest.name} bearbeiten`
                            },
                            'Bearbeiten'
                        ),
                        createElement(
                            'button',
                            {
                                ...action,
                                className: 'btn btn-primary',
                                'data-value': 'drop',
                                'aria-label': `Drop aus ${chest.name}`,
                                disabled: !canDrop
                            },
                            'Drop'
                        )
                    ),
                    preview
                )
            );
        }
        $('loot-chest-template-list').replaceChildren(rows);
        $('loot-chest-templates-empty').hidden = all.length > 0;
    }

    function catalog() {
        return (window.D.loot || []).filter(
            item =>
                parseEntityId(item?.id) !== null &&
                typeof item.name === 'string' &&
                item.name.trim()
        );
    }

    function commit(action, update) {
        window.pushUndo(action);
        update();
        const saved = window.saveImmediate();
        renderTemplates();
        return saved;
    }

    function displayChance(weight, total) {
        const chance = total > 0 ? weight / total : 0;
        if (chance > 0 && chance < 0.0001) return '< 0,01 %';
        if (chance < 1 && chance > 0.9999) return '> 99,99 %';
        return percent.format(chance);
    }

    function renderEntry(entry, index, total) {
        const id = `loot-chest-entry-weight-${index}`;
        const input = document.createElement('input');
        input.type = 'number';
        input.id = id;
        input.min = '0';
        input.max = '1000000';
        input.step = 'any';
        input.required = true;
        input.value = weightInputs.get(entry)?.value ?? String(entry.weight);
        weightInputs.set(entry, input);
        input.setAttribute('aria-label', `Drop-Gewicht für ${entry.name}`);
        input.title = 'Drop-Gewicht';

        function saveWeight(event) {
            event.preventDefault();
            const chest = selectedChest();
            const weight = input.valueAsNumber;
            if (!chest?.entries.includes(entry) || !isLootChestWeight(weight)) return;
            if (entry.weight === weight) return;
            commit('Drop-Gewicht geändert', () => {
                entry.weight = weight;
            });
            renderContents(chest);
            $(id)?.focus({ preventScroll: true });
        }

        function remove() {
            const chest = selectedChest();
            const position = chest?.entries.indexOf(entry) ?? -1;
            if (position < 0) return;
            commit('Gegenstand aus Truhe entfernt', () => chest.entries.splice(position, 1));
            renderContents(chest);
            const target = $(id) || $('loot-chest-item');
            (target.disabled ? $('loot-chest-drop') : target).focus({ preventScroll: true });
        }

        return createElement(
            'li',
            { className: 'loot-chest-entry' },
            createElement('strong', {}, entry.name),
            createElement(
                'span',
                { className: 'loot-chest-chance' },
                displayChance(entry.weight, total)
            ),
            createElement(
                'form',
                { className: 'loot-chest-controls', onSubmit: saveWeight },
                createElement('div', { className: 'form-group' }, input),
                createElement(
                    'button',
                    {
                        type: 'submit',
                        className: 'btn btn-sm',
                        title: 'Gewicht speichern',
                        'aria-label': `Gewicht speichern für ${entry.name}`
                    },
                    '✓'
                ),
                createElement(
                    'button',
                    {
                        type: 'button',
                        className: 'btn btn-sm btn-danger',
                        title: 'Entfernen',
                        'aria-label': `${entry.name} aus der Truhe entfernen`,
                        onClick: remove
                    },
                    '×'
                )
            )
        );
    }

    function renderContents(chest) {
        renderedChest = chest;
        const list = $('loot-chest-entries');
        const total = chest.entries.reduce((sum, entry) => sum + entry.weight, 0);
        const fragment = document.createDocumentFragment();
        chest.entries.forEach((entry, index) => fragment.append(renderEntry(entry, index, total)));
        if (chest.entries.length === 0) {
            fragment.append(
                createElement('li', { className: 'loot-chest-hint' }, 'Die Truhe ist leer.')
            );
        }
        list.replaceChildren(fragment);
        $('loot-chest-drop-result').replaceChildren();
        $('loot-chest-drop-assignment').replaceChildren();
        $('loot-chest-drop').disabled = false;
        $('loot-chest-finish-status').textContent = '';
    }

    function renderCatalog(selected = $('loot-chest-item').value) {
        const itemSelect = $('loot-chest-item');
        const items = catalog();
        itemSelect.replaceChildren(
            new window.Option(items.length ? 'Bitte auswählen' : 'Keine Gegenstände vorhanden', '')
        );
        for (const item of items) itemSelect.append(new window.Option(item.name, String(item.id)));
        itemSelect.value = selected;
        if (itemSelect.selectedIndex === -1) itemSelect.selectedIndex = 0;
        itemSelect.disabled = items.length === 0;
        $('loot-chest-weight').disabled = itemSelect.disabled;
        $('loot-chest-add-button').disabled = itemSelect.disabled;
    }

    function readAddDraft() {
        return {
            item: $('loot-chest-item').value,
            weight: $('loot-chest-weight').value
        };
    }

    function indexUniqueChestEntries(entries) {
        const byItem = new Map();
        for (const entry of entries) {
            const { weight: _dropWeight, ...item } = entry;
            const key = JSON.stringify(item);
            byItem.set(key, byItem.has(key) ? null : entry);
        }
        return byItem;
    }

    function carryWeightInputs(previousEntries, entries, previousWeights) {
        const carry = (before, entry) => {
            const input = previousWeights.get(before);
            if (input) weightInputs.set(entry, input);
        };
        if (
            previousEntries === entries ||
            JSON.stringify(previousEntries) === JSON.stringify(entries)
        ) {
            entries.forEach((entry, index) => carry(previousEntries[index], entry));
            return;
        }
        // N57: Undo kann Zeilen verschieben. Ohne Zeilen-ID ist die Zuordnung bei
        // geänderter Liste nur für eindeutige Einträge mit gleichem Gewicht sicher.
        const previous = indexUniqueChestEntries(previousEntries);
        for (const [key, entry] of indexUniqueChestEntries(entries)) {
            const before = previous.get(key);
            if (entry && before?.weight === entry.weight) carry(before, entry);
        }
    }

    function paint({ addDraft, preserveDraft = false } = {}) {
        const previousChest = renderedChest;
        const previousWeights = weightInputs;
        renderedChest = null;
        weightInputs = new WeakMap();
        const select = $('loot-chest-select');
        const details = $('loot-chest-details');
        $('loot-chest-create').hidden = chestMode === 'edit';
        $('loot-chest-picker').hidden = chestMode !== 'choose';
        if (chestMode === 'create') {
            select.value = '';
            details.hidden = true;
            return;
        }

        const all = chests();
        if (!selectedChest()) {
            if (chestMode === 'edit') {
                details.hidden = true;
                hideModal(modalId);
                return;
            }
            selectedId = all[0]?.id ?? null;
        }
        select.replaceChildren();
        for (const chest of all) select.append(new window.Option(chest.name, String(chest.id)));
        select.disabled = all.length === 0;
        if (select.disabled) select.append(new window.Option('Noch keine Truhe angelegt', ''));
        else select.value = String(selectedId);

        const chest = selectedChest();
        details.hidden = !chest;
        const sameChest = preserveDraft && chest && previousChest?.id === chest.id;
        const itemDraft = sameChest ? readAddDraft() : addDraft;
        renderCatalog(itemDraft?.item ?? (itemToPlaceId === null ? '' : String(itemToPlaceId)));
        $('loot-chest-weight').value = itemDraft?.weight ?? '1';
        if (!chest) {
            $('loot-chest-finish-status').textContent = '';
            return;
        }

        if (!sameChest || previousChest.name !== chest.name) {
            $('loot-chest-current-name').value = chest.name;
        }
        if (sameChest) carryWeightInputs(previousChest.entries, chest.entries, previousWeights);
        renderContents(chest);
    }

    function createChest(event) {
        event.preventDefault();
        const input = $('loot-chest-name');
        const name = input.value.trim();
        if (!name) {
            showToast('Bitte einen Namen für die Truhe eingeben.', 'warning');
            return;
        }
        if (warnPendingChestEdits(selectedChest(), 'eine neue Truhe anlegst')) return;
        const addDraft = chestMode === 'choose' ? readAddDraft() : undefined;
        commit('Truhe angelegt', () => {
            const current = chests();
            const id = nextId('lootChests');
            window.D.lootChests = [...current, { id, name, entries: [] }];
            selectedId = id;
            chestMode = 'edit';
        });
        input.value = '';
        paint({ addDraft });
        const itemSelect = $('loot-chest-item');
        (itemSelect.disabled ? $('loot-chest-current-name') : itemSelect).focus();
    }

    function renameChest(event) {
        event.preventDefault();
        const chest = selectedChest();
        const name = $('loot-chest-current-name').value.trim();
        if (!chest) return;
        if (!name) {
            showToast('Bitte einen Namen für die Truhe eingeben.', 'warning');
            return;
        }
        if (name === chest.name) return;
        commit('Truhe umbenannt', () => {
            chest.name = name;
        });
        $('loot-chest-select').selectedOptions[0].textContent = name;
        $('loot-chest-current-name').value = name;
    }

    function deleteChest() {
        const chest = selectedChest();
        if (!chest || !window.confirm(`Truhe „${chest.name}“ mit ihrem Inhalt löschen?`)) return;
        const index = chests().indexOf(chest);
        const addDraft = chestMode === 'choose' ? readAddDraft() : undefined;
        commit('Truhe gelöscht', () => {
            window.D.lootChests = chests().filter(current => current.id !== chest.id);
            expandedTemplates.delete(chest.id);
        });
        paint({ addDraft });
        if (chestMode === 'edit') {
            if (!$('loot-chest-templates').hidden) {
                const editButtons = $('loot-chest-template-list').querySelectorAll(
                    '[data-action="open-loot-chest-template"]:not([data-value])'
                );
                const next = editButtons[Math.min(index, editButtons.length - 1)];
                (next ?? $('loot-view-create')).focus();
            }
            return;
        }
        const select = $('loot-chest-select');
        (select.disabled ? $('loot-chest-name') : select).focus();
    }

    function addItem(event) {
        event.preventDefault();
        const chest = selectedChest();
        const itemSelect = $('loot-chest-item');
        const id = parseEntityId(itemSelect.value);
        const item = catalog().find(current => parseEntityId(current.id) === id);
        const weight = $('loot-chest-weight').valueAsNumber;
        if (!chest || !item || !isLootChestWeight(weight)) return;
        const descriptionHtml = typeof item.description === 'string' ? item.description : '';
        commit('Gegenstand in Truhe gelegt', () => {
            chest.entries.push({
                sourceItemId: id,
                name: item.name,
                description: stripHtml(
                    descriptionHtml.replace(/<\/(?:p|div|li|h[1-6]|tr)>|<br\s*\/?>/gi, '\n')
                ),
                category: typeof item.category === 'string' ? item.category : '',
                rarity: typeof item.rarity === 'string' ? item.rarity : '',
                weight,
                itemDetails: {
                    descriptionHtml,
                    weight: item.weight,
                    value: item.value,
                    origin: item.origin,
                    special: item.special,
                    property: item.property,
                    tags: Array.isArray(item.tags)
                        ? item.tags.filter(tag => typeof tag === 'string')
                        : undefined,
                    attunement: item.attunement
                }
            });
        });
        itemToPlaceId = null;
        itemSelect.value = '';
        $('loot-chest-weight').value = '1';
        renderContents(chest);
        itemSelect.focus();
    }

    function warnEditor(message) {
        const status = $('loot-chest-finish-status');
        status.textContent = message;
        status.scrollIntoView({ block: 'nearest' });
    }

    function warnPendingChestEdits(chest, action) {
        if (!chest) return false;
        const nameChanged = $('loot-chest-current-name').value.trim() !== chest.name;
        if (!nameChanged && !pendingWeight(chest)) return false;
        warnEditor(
            `Speichere geänderte Namen und Drop-Gewichte oder setze sie zurück, bevor du ${action}.`
        );
        return true;
    }

    function warnPendingItem() {
        if (!$('loot-chest-item').value) return false;
        warnEditor('Klicke auf „Gegenstand hinzufügen“ oder wähle „Bitte auswählen“.');
        return true;
    }

    async function finishEditing() {
        const button = $('loot-chest-finish');
        const status = $('loot-chest-finish-status');
        status.textContent = '';
        const newName = $('loot-chest-name');
        if (newName.value.trim()) {
            status.textContent = 'Lege die neue Truhe zuerst mit „Truhe anlegen“ an.';
            newName.focus();
            return;
        }

        const chest = selectedChest();
        if (!chest) {
            hideModal(modalId);
            return;
        }
        if (warnPendingItem()) return;

        const nameInput = $('loot-chest-current-name');
        const name = nameInput.value.trim();
        if (!name) {
            status.textContent = 'Bitte einen Namen für die Truhe eingeben.';
            nameInput.focus();
            return;
        }

        const weights = [];
        for (const entry of chest.entries) {
            const input = weightInputs.get(entry);
            if (!input?.reportValidity()) return;
            weights.push({ entry, input, weight: input.valueAsNumber });
        }

        const changed =
            name !== chest.name || weights.some(({ entry, weight }) => entry.weight !== weight);
        const opening = modalOpening;
        button.disabled = true;
        status.textContent = 'Speichert …';
        let result;
        try {
            result = await (changed
                ? commit('Truhe gespeichert', () => {
                      chest.name = name;
                      for (const { entry, weight } of weights) entry.weight = weight;
                      $('loot-chest-select').selectedOptions[0].textContent = name;
                  })
                : window.saveImmediate());
        } catch (error) {
            window.ErrorHandler?.log('Truhe speichern', error);
        }
        if (opening !== modalOpening) return;
        button.disabled = false;
        if (!$(modalId).classList.contains('show')) return;

        if (!result?.success) {
            status.textContent = 'Speichern fehlgeschlagen. Versuche es erneut.';
            return;
        }
        if (selectedChest() === chest && warnPendingItem()) return;
        if (
            selectedChest() !== chest ||
            chest.entries.length !== weights.length ||
            newName.value.trim() ||
            nameInput.value.trim() !== name ||
            weights.some(
                ({ input, weight }) => !input.isConnected || input.valueAsNumber !== weight
            )
        ) {
            status.textContent = 'Zwischenstand gespeichert. Prüfe die offenen Eingaben.';
        } else {
            hideModal(modalId);
        }
    }

    function renderAssignment({ getChest, result, container, rollButton }, chest, entry) {
        const characters = window.D.characters.filter(ch => parseEntityId(ch?.id) !== null);
        if (characters.length === 0) {
            result.append(
                createElement(
                    'p',
                    { className: 'loot-chest-hint' },
                    'Lege zuerst einen Charakter an, um Drops zuzuweisen.'
                )
            );
            return;
        }

        const select = document.createElement('select');
        select.id = `${rollButton.id}-character`;
        select.required = true;
        select.append(new window.Option('Bitte auswählen', ''));
        for (const ch of characters) select.append(new window.Option(ch.name, String(ch.id)));

        let recipientId = null;
        let draft;
        let saving = false;
        const status = createElement('p');
        const assignButton = createElement(
            'button',
            { type: 'submit', className: 'btn btn-primary' },
            'Zuweisen'
        );

        function isCurrentRoll() {
            return (
                form.parentElement === container &&
                rollButton.closest('.modal-overlay')?.classList.contains('show') &&
                getChest() === chest &&
                chest.entries.includes(entry)
            );
        }

        function prepareAssignment() {
            if (!isCurrentRoll()) return null;
            const character = EntityLookup.character(recipientId);
            if (!character) return null;
            const data = window.D;
            if (!draft || data.loot.some(item => item.id === draft.id)) {
                const { descriptionHtml, tags, ...details } = entry.itemDetails ?? {};
                draft = {
                    ...details,
                    id: nextId('loot'),
                    name: entry.name,
                    description:
                        typeof descriptionHtml === 'string'
                            ? sanitizeHTML(descriptionHtml)
                            : esc(entry.description),
                    category: entry.category || 'misc',
                    rarity: entry.rarity || 'normal',
                    quantity: 1,
                    weight: details.weight ?? 0,
                    value: details.value ?? 0,
                    ...(tags ? { tags: [...tags] } : {})
                };
            }
            const inventory = recipient => {
                const items = Array.isArray(recipient.items)
                    ? recipient.items.map(item =>
                          typeof item === 'number' ? { id: item, quantity: 1 } : item
                      )
                    : [];
                return [...items, { id: draft.id, quantity: 1 }];
            };
            return {
                snapshot: {
                    ...data,
                    loot: [...data.loot, draft],
                    characters: data.characters.map(current =>
                        current === character ? { ...current, items: inventory(current) } : current
                    )
                },
                publish: () => {
                    const current = EntityLookup.character(recipientId);
                    if (current !== character || window.D.loot.some(item => item.id === draft.id))
                        return;
                    window.pushUndo('Truhen-Drop zugewiesen');
                    window.D.loot.push(draft);
                    current.items = inventory(current);
                }
            };
        }

        async function assign(event) {
            event.preventDefault();
            if (saving || !isCurrentRoll()) return;
            const character = EntityLookup.character(recipientId ?? parseEntityId(select.value));
            if (!character) return;

            recipientId = character.id;
            saving = true;
            select.disabled = true;
            assignButton.disabled = true;
            rollButton.disabled = true;
            status.textContent = 'Speichert …';
            result.append(status);
            let saved;
            try {
                saved = await window.saveImmediate(prepareAssignment);
            } catch (error) {
                window.ErrorHandler?.log('Truhen-Drop speichern', error);
            } finally {
                saving = false;
            }

            const published = saved?.success && window.D.loot.includes(draft);
            if (published) {
                renderTemplates();
                if ($(modalId)?.classList.contains('show')) renderCatalog();
                window.renderLootList();
                window.renderParty();
            }
            if (!isCurrentRoll()) return;
            if (!saved?.success) {
                status.textContent = 'Speichern fehlgeschlagen. Versuche es erneut.';
                assignButton.disabled = false;
                assignButton.textContent = 'Erneut speichern';
                assignButton.focus({ preventScroll: true });
                return;
            }
            form.remove();
            status.textContent = published
                ? `${entry.name} wurde ${character.name} zugewiesen.`
                : 'Der Kampagnenstand wurde inzwischen geändert. Würfle erneut.';
            rollButton.disabled = false;
            rollButton.focus({ preventScroll: true });
            status.scrollIntoView({ block: 'nearest' });
        }

        const form = createElement(
            'form',
            { className: 'loot-chest-controls', onSubmit: assign },
            createElement(
                'div',
                { className: 'form-group loot-chest-field' },
                createElement('label', { for: select.id }, 'Charakter'),
                select
            ),
            assignButton
        );
        container.append(form);
    }

    function rollDrop(view) {
        const { getChest, result, container, rollButton } = view;
        const chest = getChest();
        rollButton.disabled = false;
        container.replaceChildren();
        const entry = pickLootChestEntry(chest?.entries);
        if (!entry) {
            result.textContent = chest
                ? 'Kein Drop. Lege einen Gegenstand mit positivem Gewicht in die Truhe.'
                : 'Öffne die Drop-Vorlage erneut.';
            result.scrollIntoView({ block: 'nearest' });
            return;
        }
        const category = window.CATS?.[entry.category];
        const rarity = window.RARITY_LABELS?.[entry.rarity];
        const meta = [category, rarity].filter(Boolean).join(' · ');
        const title = createElement('strong', {}, entry.name);
        result.replaceChildren(title);
        if (meta) result.append(createElement('p', { className: 'loot-chest-hint' }, meta));
        if (entry.itemDetails?.descriptionHtml) {
            const description = createElement('div');
            description.innerHTML = sanitizeHTML(entry.itemDetails.descriptionHtml);
            result.append(description);
        } else if (entry.description) {
            result.append(createElement('p', {}, entry.description));
        }
        renderAssignment(view, chest, entry);
        title.scrollIntoView({ block: 'nearest' });
    }

    function pendingWeight(chest) {
        return chest?.entries.find(
            entry => weightInputs.get(entry)?.valueAsNumber !== entry.weight
        );
    }

    function rollEditorDrop() {
        if (warnPendingItem()) return;
        const pending = pendingWeight(selectedChest());
        if (pending) {
            warnEditor(
                `Speichere das Drop-Gewicht für „${pending.name}“ mit ✓ oder setze es zurück.`
            );
            return;
        }
        $('loot-chest-finish-status').textContent = '';
        rollDrop({
            getChest: selectedChest,
            result: $('loot-chest-drop-result'),
            container: $('loot-chest-drop-assignment'),
            rollButton: $('loot-chest-drop')
        });
    }

    function syncQuickDrop() {
        const all = chests();
        if (all.includes(quickDropChest)) return true;
        // Undo, Redo und Datenersatz liefern neue Objekte für dieselben Truhen-IDs.
        quickDropChest = all.find(chest => chest.id === quickDropChest?.id);
        if (!quickDropChest) {
            hideModal(quickDropModalId);
            return false;
        }
        $('loot-chest-quick-drop-title').textContent = `Drop aus ${quickDropChest.name}`;
        $('loot-chest-quick-drop-assignment').replaceChildren();
        $('loot-chest-quick-drop-result').textContent =
            'Die Truhe wurde aktualisiert. Würfle erneut.';
        $('loot-chest-quick-reroll').disabled = false;
        return true;
    }

    function rollQuickDrop() {
        if (!syncQuickDrop()) return;
        rollDrop({
            getChest: () => (chests().includes(quickDropChest) ? quickDropChest : null),
            result: $('loot-chest-quick-drop-result'),
            container: $('loot-chest-quick-drop-assignment'),
            rollButton: $('loot-chest-quick-reroll')
        });
    }

    function openQuickDrop(chest) {
        const modal = $(quickDropModalId);
        if (!modal) return;
        const reroll = $('loot-chest-quick-reroll');
        if (initializedQuickModal !== modal) {
            initializedQuickModal = modal;
            reroll.addEventListener('click', rollQuickDrop);
        }
        quickDropChest = chest;
        $('loot-chest-quick-drop-title').textContent = `Drop aus ${chest.name}`;
        showModal(quickDropModalId);
        reroll.focus({ preventScroll: true });
        rollQuickDrop();
    }

    function openChestModal(itemId, chestId = null) {
        const modal = $(modalId);
        if (!modal) return;
        if (initializedModal !== modal) {
            initializedModal = modal;
            $('loot-chest-create').addEventListener('submit', createChest);
            $('loot-chest-rename').addEventListener('submit', renameChest);
            $('loot-chest-delete').addEventListener('click', deleteChest);
            $('loot-chest-add').addEventListener('submit', addItem);
            $('loot-chest-finish').addEventListener('click', finishEditing);
            const helpButton = $('loot-chest-weight-help-toggle');
            const help = $('loot-chest-weight-help');
            helpButton.addEventListener('click', () => {
                help.hidden = !help.hidden;
                helpButton.setAttribute('aria-expanded', String(!help.hidden));
                if (!help.hidden) help.scrollIntoView({ block: 'nearest' });
            });
            $('loot-chest-drop').addEventListener('click', rollEditorDrop);
            $('loot-chest-select').addEventListener('change', event => {
                if (chestMode !== 'choose') return;
                const picker = event.target;
                const target = parseEntityId(picker.value);
                if (target === selectedId) return;
                const chest = selectedChest();
                if (chest && warnPendingChestEdits(chest, 'die Truhe wechselst')) {
                    picker.value = String(chest.id);
                    return;
                }
                const addDraft = readAddDraft();
                selectedId = target;
                paint({ addDraft });
            });
        }
        modalOpening++;
        $('loot-chest-finish').disabled = false;
        $('loot-chest-finish-status').textContent = '';
        itemToPlaceId = parseEntityId(itemId);
        chestMode = 'choose';
        if (chestId !== null) {
            chestMode = 'edit';
            selectedId = chestId;
        } else if (itemToPlaceId === null) {
            chestMode = 'create';
        }
        $('loot-chest-name').value = '';
        paint();
        showModal(modalId);
        if (itemToPlaceId !== null) {
            $(selectedChest() ? 'loot-chest-select' : 'loot-chest-name').focus();
        } else if (chestMode === 'create') {
            $('loot-chest-name').focus();
        }
    }

    window.setLootChestView = showTemplates => {
        const panel = $('loot-chest-templates');
        if (!panel || panel.hidden === !showTemplates) return;
        panel.hidden = !showTemplates;
        if (showTemplates) $('loot-items-layout').classList.remove('loot-mobile-detail-open');
        for (const element of document.querySelectorAll('#view-loot [data-loot-items-only]')) {
            element.hidden = showTemplates;
        }
        const toggle = $('loot-chest-view-toggle');
        toggle.textContent = showTemplates ? 'Items' : 'Truhen';
        toggle.dataset.value = showTemplates ? 'items' : 'templates';
        $('loot-view-title').textContent = showTemplates ? '📦 Drop-Vorlagen' : '📦 Truhe';
        const createButton = $('loot-view-create');
        createButton.textContent = showTemplates ? '+ Truhe' : '+ Item';
        createButton.dataset.action = showTemplates ? 'open-loot-chests' : 'show-loot-modal';
        if (showTemplates) renderTemplates();
    };

    window.openLootChests = itemId => openChestModal(itemId);

    window.openLootChestTemplate = (id, roll) => {
        const chest = chests().find(current => current.id === id);
        if (!chest) return;
        if (roll) openQuickDrop(chest);
        else openChestModal(null, id);
    };

    window.renderLootChests = () => {
        renderTemplates();
        if ($(modalId)?.classList.contains('show')) paint({ preserveDraft: true });
        if ($(quickDropModalId)?.classList.contains('show')) syncQuickDrop();
    };
})();
