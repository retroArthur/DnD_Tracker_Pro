// [SECTION:SOUNDBOARD_RENDER]
// Render-Funktionen fuer Soundboard-Tab (Phase 7 — UX-01, D-02, D-03)
// Implementiert in 07-03.
//
// SECURITY:
//   T-07-AUDIO-NAME — alle user-supplied Strings (Dateiname, Szenenname) per esc() escaped
// CONVENTIONS:
//   - Defensive null-checks fuer Container (TAB_RENDER_REGISTRY-Pattern)
//   - Kein `var X = window.X` fuer const-Globals (CLAUDE.md Dedup-Regel)
//   - data-action fuer alle Event-Handler (kein inline onclick)

/**
 * formatFileSize(bytes) — Lesbare Dateigroesse formatieren.
 * @param {number} bytes
 * @returns {string}
 */
function _sbFormatSize(bytes) {
    if (!bytes || bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * renderAudioLibrary() — Audiobibliothek rendern.
 * Laedt Blob-Metadaten aus IDB und baut die Liste auf.
 * Rendert in #soundboard-library-container.
 */
async function renderAudioLibrary() {
    const container = document.getElementById('soundboard-library-container');
    if (!container) return;

    container.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;">Lade Audiodateien…</p>';

    let blobs = [];
    try {
        if (typeof window.listSoundBlobs === 'function') {
            blobs = await window.listSoundBlobs();
        }
    } catch (e) {
        container.innerHTML = '<p style="color:var(--red);">Fehler beim Laden der Bibliothek.</p>';
        return;
    }

    if (blobs.length === 0) {
        container.innerHTML = '<p class="sb-empty-hint">Noch keine Audiodateien. Datei oben auswaehlen.</p>';
        return;
    }

    const rows = blobs.map(function(b) {
        const sizeClass = b.size > 20 * 1024 * 1024 ? ' sb-file-warn' : '';
        return `<div class="sb-library-row${sizeClass}" data-blob-id="${esc(b.id)}">
            <span class="sb-library-name" title="${esc(b.name)}">${esc(b.name)}</span>
            <span class="sb-library-size">${_sbFormatSize(b.size)}</span>
            <button class="btn-icon sb-remove-btn" data-action="remove-audio" data-id="${esc(b.id)}"
                title="Datei entfernen" aria-label="Entfernen">✕</button>
        </div>`;
    }).join('');

    container.innerHTML = rows;
}

/**
 * renderSceneList() — Szenenliste rendern.
 * Rendert in #soundboard-scenes-container.
 * Laedt Blob-Metadaten fuer Track-Namen.
 */
async function renderSceneList() {
    const container = document.getElementById('soundboard-scenes-container');
    if (!container) return;

    if (typeof window.ensureSoundboardData === 'function') window.ensureSoundboardData();

    const scenes = (window.D && window.D.soundboard && Array.isArray(window.D.soundboard.scenes))
        ? window.D.soundboard.scenes
        : [];

    // Blob-Metadaten fuer Track-Bezeichnungen laden
    let blobMeta = {};
    try {
        if (typeof window.listSoundBlobs === 'function') {
            const blobs = await window.listSoundBlobs();
            blobs.forEach(function(b) { blobMeta[b.id] = b; });
        }
    } catch (e) {
        // Falls IDB nicht verfuegbar: ohne Namen weitermachen
    }

    if (scenes.length === 0) {
        container.innerHTML = '<p class="sb-empty-hint">Noch keine Szenen. Mit "Neue Szene" anlegen.</p>';
        return;
    }

    const cards = scenes.map(function(scene) {
        const slotBadge = scene.slot && scene.slot >= 1 && scene.slot <= 5
            ? `<span class="sb-slot-badge" title="Alt+Shift+${esc(String(scene.slot))}">Alt+⇧+${esc(String(scene.slot))}</span>`
            : '';

        const tracks = Array.isArray(scene.tracks) ? scene.tracks : [];
        const trackRows = tracks.map(function(track) {
            const meta = blobMeta[track.blobId];
            const trackName = meta ? meta.name : track.blobId;
            const vol = typeof track.volume === 'number' ? track.volume : 0.8;
            const isLoop = track.loop !== false; // Default true (abwaertskompatibel)
            return `<div class="sb-track-row" data-blob-id="${esc(track.blobId)}">
                <button class="btn-icon sb-loop-btn${isLoop ? ' active' : ''}"
                    data-action="toggle-track-loop"
                    data-scene-id="${esc(scene.id)}"
                    data-blob-id="${esc(track.blobId)}"
                    title="${isLoop ? 'Wiederholung an (nahtloser Crossfade)' : 'Wiederholung aus (spielt einmal)'}"
                    aria-label="Wiederholung umschalten" aria-pressed="${isLoop}">${isLoop ? '🔁' : '➡️'}</button>
                <div class="sb-track-main">
                    <span class="sb-track-name" title="${esc(trackName)}">${esc(trackName)}</span>
                    <div class="sb-progress" aria-hidden="true"><div class="sb-progress-fill"></div></div>
                </div>
                <label class="sb-volume-label" aria-label="Lautstaerke">
                    <input type="range" class="sb-volume-slider"
                        min="0" max="1" step="0.05" value="${vol}"
                        data-action="set-track-volume"
                        data-scene-id="${esc(scene.id)}"
                        data-blob-id="${esc(track.blobId)}"
                        aria-label="Lautstaerke fuer ${esc(trackName)}">
                    <span class="sb-volume-pct">${Math.round(vol * 100)}%</span>
                </label>
                <button class="btn-icon sb-remove-track-btn"
                    data-action="remove-track"
                    data-scene-id="${esc(scene.id)}"
                    data-blob-id="${esc(track.blobId)}"
                    title="Track entfernen" aria-label="Track entfernen">✕</button>
            </div>`;
        }).join('');

        // Add-Track-Dropdown: Blobs aus Bibliothek die noch nicht in dieser Szene sind
        const existingBlobIds = tracks.map(function(t) { return t.blobId; });
        const availableBlobs = Object.values(blobMeta).filter(function(b) {
            return !existingBlobIds.includes(b.id);
        });
        const addTrackControl = availableBlobs.length > 0
            ? `<div class="sb-add-track-row">
                <select class="sb-add-track-select" id="sb-add-select-${esc(scene.id)}">
                    <option value="">-- Track hinzufuegen --</option>
                    ${availableBlobs.map(function(b) {
                        return `<option value="${esc(b.id)}">${esc(b.name)}</option>`;
                    }).join('')}
                </select>
                <button class="btn btn-sm"
                    data-action="add-track"
                    data-scene-id="${esc(scene.id)}"
                    title="Track zur Szene hinzufuegen">+ Track</button>
            </div>`
            : (Object.keys(blobMeta).length === 0
                ? '<p class="sb-empty-hint" style="font-size:0.8rem">Erst Audiodateien importieren.</p>'
                : '<p class="sb-empty-hint" style="font-size:0.8rem">Alle Bibliothekstracks bereits hinzugefuegt.</p>');

        return `<div class="sb-scene-card" data-scene-id="${esc(scene.id)}">
            <div class="sb-scene-header">
                <span class="sb-scene-title">${esc(scene.name)}</span>
                ${slotBadge}
                <div class="sb-scene-actions">
                    <button class="btn btn-sm btn-primary sb-play-btn"
                        data-action="play-scene" data-id="${esc(scene.id)}"
                        title="Szene abspielen">▶ Play</button>
                    <button class="btn-icon sb-delete-scene-btn"
                        data-action="delete-scene" data-id="${esc(scene.id)}"
                        title="Szene loeschen" aria-label="Szene loeschen">🗑</button>
                </div>
            </div>
            <div class="sb-tracks">${trackRows || '<p class="sb-empty-hint" style="font-size:0.8rem">Keine Tracks. Unten hinzufuegen.</p>'}</div>
            ${addTrackControl}
        </div>`;
    }).join('');

    container.innerHTML = cards;
}

/**
 * renderSoundboard() — Haupt-Render fuer den Soundboard-Tab.
 * Defensive: prueft Container-Existenz mit DEBUG-Hinweis (TAB_RENDER_REGISTRY-Pattern).
 */
function renderSoundboard() {
    var c = $('soundboard-container');
    if (!c) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[renderSoundboard] Container #soundboard-container nicht gefunden — nicht auf Soundboard-Tab?');
        }
        return;
    }

    // Statisches Grundgeruest rendern (async Teile folgend)
    c.innerHTML = `<div class="sb-root">
        <!-- Audio-Bibliothek -->
        <section class="sb-section">
            <h3 class="sb-section-title">🎵 Audio-Bibliothek</h3>
            <p class="sb-section-hint">MP3, OGG, WAV empfohlen (max. 100 MB; Warnung ab 20 MB)</p>
            <div class="sb-import-row">
                <label class="btn btn-primary sb-import-btn" for="soundboard-file-input">
                    + Audiodatei importieren
                </label>
                <input type="file" id="soundboard-file-input" accept="audio/*"
                    style="display:none"
                    data-action="soundboard-file-change">
            </div>
            <div id="soundboard-library-container" class="sb-library">
                <p class="sb-empty-hint">Lade…</p>
            </div>
        </section>

        <!-- Szenen-Verwaltung -->
        <section class="sb-section">
            <h3 class="sb-section-title">🎬 Szenen</h3>
            <p class="sb-section-hint">Alt+Shift+1..5 = Quick-Slot aktivieren &nbsp;|&nbsp; Alt+Shift+0 = Mute toggle</p>
            <div class="sb-scene-toolbar">
                <button class="btn btn-sm" data-action="create-scene">+ Neue Szene</button>
                <button class="btn btn-sm" data-action="stop-all-audio">⏹ Alle stoppen</button>
                <button class="btn btn-sm" data-action="toggle-soundboard-mute">🔇 Mute</button>
            </div>
            <div id="soundboard-scenes-container" class="sb-scenes">
                <p class="sb-empty-hint">Lade…</p>
            </div>
        </section>
    </div>`;

    // Async-Render nachziehen
    renderAudioLibrary();
    renderSceneList();
}

// ============================================================
// Exports
// ============================================================
window.renderSoundboard = renderSoundboard;
window.renderAudioLibrary = renderAudioLibrary;
window.renderSceneList = renderSceneList;
