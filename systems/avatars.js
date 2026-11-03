// [SECTION:AVATARS]
// AVATAR / IMAGE SYSTEM - @avatar @image @portrait
// ============================================================
// URL VALIDATION
// ============================================================
function validateAvatarURL(url) {
    if (!url || url.trim() === '') return true; // Empty is valid (will be removed)
    const trimmed = url.trim();
    // Block dangerous protocols. `file:` steht seit AVATAR-DATEI nicht mehr hier (s. unten). Die
    // Liste bleibt neben sichereBildquelle(), weil sie strenger liest als der Browser: fuer
    // sichereBildquelle() sind `java script:` und `jav\vascript:` relative Pfade.
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:text/html'];
    // WR-01 (Phase 12, Review-Fix): Browser entfernen Steuerzeichen (ASCII C0
    // U+0000-U+001F, DEL U+007F) und Leerzeichen aus der GESAMTEN URL — nicht
    // nur am Rand — bevor sie das Schema bestimmen (WHATWG-URL-Spezifikation).
    // Ein reines trim()+startsWith()-Praefixfilter laesst sich damit umgehen,
    // z. B. "java\tscript:alert(1)" oder "jav\nascript:alert(1)" bestehen die
    // Pruefung, werden vom Browser aber als "javascript:"-URL interpretiert.
    // eslint-disable-next-line no-control-regex -- Zeichenklasse trifft Steuerzeichen ABSICHTLICH (WR-01, Phase 12, Commit d2a521c)
    const strippedForProtocolCheck = trimmed.replace(/[\x00-\x20\x7F\s]/g, '');
    const lowerStrippedForProtocolCheck = strippedForProtocolCheck.toLowerCase();
    if (dangerousProtocols.some(proto => lowerStrippedForProtocolCheck.startsWith(proto))) {
        return false;
    }
    // SENKEN Nachbesserung (16) und AVATAR-DATEI: gespeichert wird genau, was die Anzeige zeigt —
    // dieselbe Pruefung sichereBildquelle() wie Karte, Detail und Vorschau. Erlaubt sind http(s),
    // data:image/, relative Pfade und lokale Dateien (`file:///C:/Bilder/held.png`, nach
    // istLokalerDateipfad()). Gesperrt jeder Netzwerkpfad (`file://host/…`, `file://localhost/…`,
    // `file:////host`, `//host/share`, `/%5C%5Chost/x.png` — unter Windows UNC), jedes andere
    // Schema und relative Werte, die mit `?`/`#` beginnen. Bis AVATAR-DATEI stand `file:` oben in
    // der Sperrliste: das Bild-Modal zeigte ein lokales Portrait in der Vorschau und verweigerte
    // das Speichern. Nutzerentscheidung 03.11. zu SENKEN Offen (15): "Erlauben"
    // (docs/bugfixes.md, AVATAR-DATEI). Die frueheren Zweige danach (relativ, data:image/,
    // `new URL()` mit http(s)) waren nur noch enger als sichereBildquelle(): einen relativen Pfad
    // mit `:` hinter dem Trenner (`bilder/a:b.png`) zeigte die Karte, die Eingabe lehnte ihn ab.
    return sichereBildquelle(trimmed) !== '';
}
// ============================================================
// AVATAR MODAL
// ============================================================
function showAvatarModal(type, id) {
    const typeEl = $('avatar-target-type');
    const idEl = $('avatar-target-id');
    const urlEl = $('avatar-url');
    if (typeEl) typeEl.value = type;
    if (idEl) idEl.value = String(id);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (urlEl) urlEl.value = entity?.avatar || '';
    previewAvatar();
    const showModal = window.showModal;
    if (showModal) showModal('avatar-modal');
}
function previewAvatar() {
    const urlEl = $('avatar-url');
    const preview = $('avatar-preview');
    if (!preview) return;
    const url = urlEl?.value.trim();
    // Die Vorschau laedt sofort, auch einen Wert aus Daten (showAvatarModal fuellt das Feld
    // vor): nur eine sichere Bildquelle (SENKEN R3), sonst das Fehlerzeichen
    if (url && !sichereBildquelle(url)) {
        preview.innerHTML = '';
        preview.textContent = '❌';
    } else if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'avatar avatar-xl';
        img.addEventListener('error', () => {
            preview.innerHTML = '';
            preview.textContent = '❌';
        });
        preview.innerHTML = '';
        preview.appendChild(img);
    } else {
        preview.innerHTML = '?';
        preview.className = 'avatar avatar-xl avatar-placeholder';
    }
}
function saveAvatar() {
    const typeEl = $('avatar-target-type');
    const idEl = $('avatar-target-id');
    const urlEl = $('avatar-url');
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const url = urlEl?.value.trim();
    // Validate URL for security
    if (!validateAvatarURL(url)) {
        showToast(
            '❌ Ungültige URL: Nur http(s), data:image/, lokale Dateien (file:///) oder relative Pfade erlaubt, keine Netzwerkpfade',
            'error'
        );
        return;
    }
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    entity.avatar = url;
    const hideModal = window.hideModal;
    const renderAll = window.renderAll;
    const save = window.save;
    if (hideModal) hideModal('avatar-modal');
    if (renderAll) renderAll();
    if (save) save();
    showToast('Bild gespeichert');
}
function removeAvatar() {
    const typeEl = $('avatar-target-type');
    const idEl = $('avatar-target-id');
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);
    const getEntityByTypeAndId = window.getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    delete entity.avatar;
    const hideModal = window.hideModal;
    const renderAll = window.renderAll;
    const save = window.save;
    if (hideModal) hideModal('avatar-modal');
    if (renderAll) renderAll();
    if (save) save();
    showToast('Bild entfernt');
}
// ============================================================
// ENTITY HELPERS
// ============================================================
function getEntityByTypeAndId(type, id) {
    const D = window.D;
    const collections = {
        character: D.characters,
        characters: D.characters,
        npc: D.npcs,
        npcs: D.npcs,
        location: D.locations,
        locations: D.locations,
        quest: D.quests,
        quests: D.quests,
        encounter: D.encounters,
        encounters: D.encounters,
        spell: D.spells,
        spells: D.spells,
        loot: D.loot,
        item: D.loot,
        items: D.loot,
        wiki: D.wiki,
        combatant: D.initiative?.combatants || []
    };
    const collection = collections[type];
    if (!collection || !Array.isArray(collection)) return null;
    return collection.find(e => e.id === id) || null;
}
function getEntityLink(type, id) {
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return null;
    const views = {
        character: 'party',
        npc: 'npcs',
        location: 'locations',
        quest: 'quests',
        encounter: 'encounter'
    };
    return { name: entity.name || entity.title, view: views[type], type, id };
}
// ============================================================
// OFFLINE MODE
// ============================================================
function initOfflineMode() {
    // Check online status
    function updateOnlineStatus() {
        const indicator = $('offline-indicator');
        if (indicator) {
            indicator.classList.toggle('visible', !navigator.onLine);
        }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    // Das Speichern beim Verlassen liegt in systems/spellslots/persistence.js
    // (initUnloadPersistence/persistOnUnload, Code-Review 2026-09-21, R02)
}
// ============================================================
// TOUCH OPTIMIZATIONS
// ============================================================
function initTouchOptimizations() {
    // Detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }
    // Prevent double-tap zoom on buttons
    let lastTouchEnd = 0;
    document.addEventListener(
        'touchend',
        function (e) {
            const now = Date.now();
            const target = e.target;
            if (now - lastTouchEnd < 300 && target.closest('button, .btn, .nav-tab')) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        },
        { passive: false }
    );
    // Improve touch scrolling in modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener(
            'touchmove',
            function (e) {
                e.stopPropagation();
            },
            { passive: true }
        );
    });
    // Add touch-friendly tap feedback
    document.addEventListener(
        'touchstart',
        function (e) {
            const target = e.target;
            const btn = target.closest('.btn, .nav-tab, .dice-btn');
            if (btn) btn.classList.add('touch-active');
        },
        { passive: true }
    );
    document.addEventListener(
        'touchend',
        function (e) {
            document.querySelectorAll('.touch-active').forEach(el => {
                el.classList.remove('touch-active');
            });
        },
        { passive: true }
    );
}
