// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Soundboard (Phase 7 — UX-01)
 *
 * Aktiviert in 07-03 (Wave-0 Stubs entfernt).
 *
 * Kontrakt-Testtitel sind unveraenderlich (grep-Kontrakt: -g "soundboard tab renders" etc.).
 * Kein CommonJS require; kein http://localhost (file:// baseURL aus playwright.config.js).
 *
 * UX-01a — soundboard tab renders
 * UX-01b — import audio file
 * UX-01c — audio blob persists after reload
 * UX-01e — scene quickslot keyboard
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/**
 * makeWavBuffer(sampleCount) — gueltiges PCM-WAV mit echten (stillen) Samples.
 *
 * Die uebrigen Tests dieser Datei nutzen ein 44-Byte-WAV OHNE Samples — damit laesst
 * sich nichts dekodieren, und genau deshalb pruefte bisher niemand, ob eine Audiodatei
 * den Base64-Rundlauf als ABSPIELBARE Datei uebersteht (SAFE-06 / D-08).
 * 4410 Samples bei 44100 Hz = 0,1 Sekunden: klein genug fuer IDB und Base64,
 * gross genug fuer decodeAudioData.
 *
 * @param {number} sampleCount  Anzahl 16-Bit-Mono-Samples
 * @returns {Buffer}
 */
function makeWavBuffer(sampleCount) {
    const sampleRate = 44100;
    const bitsPerSample = 16;
    const numChannels = 1;
    const blockAlign = (numChannels * bitsPerSample) / 8; // 2
    const byteRate = sampleRate * blockAlign; // 88200
    const dataSize = sampleCount * blockAlign;

    const buffer = Buffer.alloc(44 + dataSize); // Samples bleiben 0 = Stille
    buffer.write('RIFF', 0, 'ascii');
    buffer.writeUInt32LE(36 + dataSize, 4); // ChunkSize
    buffer.write('WAVE', 8, 'ascii');
    buffer.write('fmt ', 12, 'ascii');
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat = PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36, 'ascii');
    buffer.writeUInt32LE(dataSize, 40); // Subchunk2Size
    return buffer;
}

/**
 * Laedt die App und navigiert zum Soundboard-Tab.
 */
async function openSoundboardTab(page) {
    await page.goto(APP_URL);
    await page.waitForSelector('.app-title', { timeout: 10000 });
    await page.waitForTimeout(500);
    // Soundboard liegt in der "Werkzeuge"-Gruppe -> Dropdown erst oeffnen
    const tab = page.locator('.nav-tab[data-view="soundboard"]');
    if (!(await tab.isVisible())) {
        await page.locator('.nav-group', { has: page.locator('.nav-tab[data-view="soundboard"]') })
            .locator('.nav-group-btn').click();
        await page.waitForTimeout(50);
    }
    await tab.click();
    await page.waitForTimeout(400);
}

test.describe('Soundboard', function () {

    /**
     * UX-01a — Soundboard-Tab ist sichtbar und zeigt Audio-Bibliothek-UI.
     */
    test('soundboard tab renders', async ({ page }) => {
        await openSoundboardTab(page);

        // Container vorhanden
        const container = page.locator('#soundboard-container');
        await expect(container).toBeVisible({ timeout: 5000 });

        // Audio-Bibliothek Dateiimport-Element vorhanden
        const fileInput = page.locator('#soundboard-file-input');
        await expect(fileInput).toBeAttached({ timeout: 5000 });

        // Szenen-Bereich vorhanden
        const scenesContainer = page.locator('#soundboard-scenes-container');
        await expect(scenesContainer).toBeAttached({ timeout: 5000 });

        // Globale Funktionen verfuegbar (Engine aus 07-02)
        const hasFunctions = await page.evaluate(function() {
            return typeof window.renderSoundboard === 'function' &&
                typeof window.importAudioFile === 'function' &&
                window.D && window.D.soundboard !== undefined;
        });
        expect(hasFunctions).toBe(true);
    });

    /**
     * UX-01b — Nutzer kann Audio-Datei importieren; erscheint in Audio-Bibliothek.
     * Prueft IDB-Write via listSoundBlobs() + DOM-Eintrag in #soundboard-library-container.
     * T-07-AUDIO-NAME: Dateiname muss esc() sein — kein <script> im DOM.
     */
    test('import audio file', async ({ page }) => {
        await openSoundboardTab(page);

        // Kleines synthetisches WAV (44 Bytes Header — reicht fuer IDB-Speicherung; decodeAudioData nicht getestet)
        // Wir testen: IDB-Write + UI-Render, nicht Audio-Ausgabe (UX-01d ist manuell)
        const fileName = 'test-ambient.wav';

        // setInputFiles uebergibt eine synthetische Audiodatei an den versteckten Input
        await page.locator('#soundboard-file-input').setInputFiles({
            name: fileName,
            mimeType: 'audio/wav',
            // Minimales WAV: RIFF-Header (44 Bytes) um type-Pruefung zu bestehen
            buffer: Buffer.from([
                0x52, 0x49, 0x46, 0x46, // "RIFF"
                0x24, 0x00, 0x00, 0x00, // ChunkSize = 36
                0x57, 0x41, 0x56, 0x45, // "WAVE"
                0x66, 0x6d, 0x74, 0x20, // "fmt "
                0x10, 0x00, 0x00, 0x00, // Subchunk1Size = 16
                0x01, 0x00,             // AudioFormat = PCM
                0x01, 0x00,             // NumChannels = 1
                0x44, 0xac, 0x00, 0x00, // SampleRate = 44100
                0x88, 0x58, 0x01, 0x00, // ByteRate = 88200
                0x02, 0x00,             // BlockAlign = 2
                0x10, 0x00,             // BitsPerSample = 16
                0x64, 0x61, 0x74, 0x61, // "data"
                0x00, 0x00, 0x00, 0x00  // Subchunk2Size = 0 (keine Samples)
            ])
        });

        // setInputFiles feuert nativ 'input' + 'change'. NICHT zusaetzlich manuell 'change'
        // dispatchen — das verdeckte den Doppel-Import-Bug (Regression-Guard fuer UX-01b).

        // Warten bis IDB-Write und Re-Render abgeschlossen
        await page.waitForTimeout(800);

        // Pruefe IDB-Eintrag via listSoundBlobs() — GENAU EIN Eintrag pro Import (kein Doppel-Import)
        const blobCount = await page.evaluate(async function() {
            if (typeof window.listSoundBlobs !== 'function') return -1;
            try {
                const blobs = await window.listSoundBlobs();
                return blobs.length;
            } catch (e) {
                return -2;
            }
        });
        expect(blobCount).toBe(1);

        // Pruefe DOM: Dateiname in Bibliothek sichtbar
        const libraryContainer = page.locator('#soundboard-library-container');
        await expect(libraryContainer).toContainText('test-ambient.wav', { timeout: 3000 });

        // XSS-Sicherheit: kein <script>-Tag durch Dateinamen im DOM (T-07-AUDIO-NAME)
        const hasScript = await page.evaluate(function() {
            const lib = document.getElementById('soundboard-library-container');
            return lib ? lib.innerHTML.includes('<script') : false;
        });
        expect(hasScript).toBe(false);
    });

    /**
     * UX-01c — Audio-Blob ueberlebt Seiten-Reload (IDB-Roundtrip unter file://).
     * Importiert eine Datei, laedt die Seite neu, prueft ob der Blob noch in listSoundBlobs() ist.
     */
    test('audio blob persists after reload', async ({ page }) => {
        await openSoundboardTab(page);

        const fileName = 'persist-test.wav';

        // WAV-Datei einlesen
        await page.locator('#soundboard-file-input').setInputFiles({
            name: fileName,
            mimeType: 'audio/wav',
            buffer: Buffer.from([
                0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
                0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20,
                0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
                0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
                0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
                0x00, 0x00, 0x00, 0x00
            ])
        });
        // setInputFiles feuert nativ 'input' + 'change' — kein manuelles 'change' (sonst Doppel-Import)
        await page.waitForTimeout(800);

        // Vor dem Reload pruefen: GENAU EIN Blob in IDB (kein Doppel-Import)
        const beforeCount = await page.evaluate(async function() {
            if (typeof window.listSoundBlobs !== 'function') return 0;
            const blobs = await window.listSoundBlobs();
            return blobs.length;
        });
        expect(beforeCount).toBe(1);

        // Seite neu laden (gleiche IDB-Daten unter file://)
        await page.reload();
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await page.waitForTimeout(800);

        // Nach dem Reload pruefen: Blob immer noch in IDB (A3 IDB-Persistenz unter file://)
        const afterCount = await page.evaluate(async function() {
            if (typeof window.listSoundBlobs !== 'function') return -1;
            try {
                const blobs = await window.listSoundBlobs();
                return blobs.length;
            } catch (e) {
                return -2;
            }
        });
        expect(afterCount).toBe(1);

        // Dateiname immer noch auffindbar
        const names = await page.evaluate(async function() {
            const blobs = await window.listSoundBlobs();
            return blobs.map(function(b) { return b.name; });
        });
        expect(names.some(function(n) { return n.includes('persist-test'); })).toBe(true);
    });

    /**
     * UX-01e — Keyboard Quick-Slot Alt+Shift+1 aktiviert Szene in Slot 1 (D-03).
     * Legt eine Szene in Slot 1 an, drueckt Alt+Shift+1, prueft ob activateSoundScene
     * aufgerufen wurde (via Spy-Flag in window).
     */
    test('scene quickslot keyboard', async ({ page }) => {
        await openSoundboardTab(page);

        // Spy-Flag installieren: fange activateSoundScene auf
        await page.evaluate(function() {
            window._sbQuickslotCalled = false;
            window._sbQuickslotScene = null;
            var _orig = window.activateSoundScene;
            window.activateSoundScene = async function(scene) {
                window._sbQuickslotCalled = true;
                window._sbQuickslotScene = scene;
                // Originale nicht aufrufen (kein echtes Audio in Tests)
            };
            // Auch activateSceneBySlot beobachten
            var _origBySlot = window.activateSceneBySlot;
            window.activateSceneBySlot = async function(slot) {
                window._sbSlotCalled = slot;
                if (_origBySlot) return _origBySlot(slot);
            };
        });

        // Szene in Slot 1 anlegen
        await page.evaluate(function() {
            if (typeof window.createScene === 'function') {
                window.createScene('Test-Szene Slot 1', 1);
            }
        });

        // Alt+Shift+1 druecken (Digit1 code)
        await page.keyboard.press('Alt+Shift+1');
        await page.waitForTimeout(300);

        // Pruefe ob der Slot korrekt ausgeloest wurde
        const result = await page.evaluate(function() {
            return {
                slotCalled: window._sbSlotCalled,
                sceneCalled: window._sbQuickslotCalled
            };
        });

        // Entweder der Slot-Dispatcher wurde aufgerufen ODER activateSoundScene direkt
        expect(result.slotCalled === 1 || result.sceneCalled === true).toBe(true);
    });

    /**
     * Erweiterung (Design 2026-06-20) — Per-Track-Loop-Toggle + Fortschrittsbalken.
     * Loop-Button rendert (Default aktiv), Umschalten persistiert ueber Reload,
     * Fortschrittsbalken-Element ist vorhanden.
     */
    test('track loop toggle and progress bar', async ({ page }) => {
        await openSoundboardTab(page);

        // Datei importieren (setInputFiles feuert input+change -> genau ein Eintrag)
        await page.locator('#soundboard-file-input').setInputFiles({
            name: 'loop-test.wav',
            mimeType: 'audio/wav',
            buffer: Buffer.from([
                0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
                0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20,
                0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
                0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
                0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
                0x00, 0x00, 0x00, 0x00
            ])
        });
        await page.waitForTimeout(600);

        // Szene mit dem Track anlegen + Szenenliste rendern
        await page.evaluate(async function() {
            const blobs = await window.listSoundBlobs();
            const scene = window.createScene('Loop-Test', 0);
            window.addTrackToScene(scene.id, blobs[0].id, 0.8);
            window.renderSceneList();
        });
        await page.waitForTimeout(200);

        // Loop-Button vorhanden und per Default aktiv
        const loopBtn = page.locator('.sb-loop-btn').first();
        await expect(loopBtn).toHaveClass(/active/);

        // Fortschrittsbalken-Element vorhanden
        await expect(page.locator('.sb-track-row .sb-progress-fill')).toHaveCount(1);

        // Umschalten -> loop=false (per Klick, echte EventDelegation)
        await loopBtn.click();
        await page.waitForTimeout(150);
        const loopAfter = await page.evaluate(function() {
            return window.D.soundboard.scenes[0].tracks[0].loop;
        });
        expect(loopAfter).toBe(false);

        // Persistenz ueber Reload (D.soundboard.scenes[].loop in localStorage)
        await page.reload();
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await page.waitForTimeout(300);
        const loopPersist = await page.evaluate(function() {
            const s = (window.D.soundboard.scenes || []).find(function(x) { return x.name === 'Loop-Test'; });
            return s ? s.tracks[0].loop : null;
        });
        expect(loopPersist).toBe(false);
    });

    /**
     * SAFE-03 (Plan 12-06) — Strg+Z nach dem Entfernen einer Audiodatei stellt Blob UND
     * Szenen-Referenz wieder her.
     * Reihenfolge: Import -> Szene mit Track anlegen -> ueber den echten Remove-Button
     * entfernen (Grabstein) -> pruefen dass beides sofort verschwunden ist -> Strg+Z ->
     * pruefen dass beides zurueck ist -> Seiten-Reload (echte IDB/localStorage-Persistenz
     * statt nur In-Memory-Optimismus, gleiche Vorsicht wie "audio blob persists after
     * reload") -> nochmal pruefen, dass beides den Reload ueberlebt hat.
     * Wir testen die Datenebene (listSoundBlobs()/D.soundboard.scenes), nicht die
     * tatsaechliche Audio-Wiedergabe — wie die uebrigen Tests dieser Datei (UX-01d ist
     * manuell; die synthetische WAV-Datei hat 0 Samples und laesst sich nicht dekodieren).
     */
    test('undo after removing audio file restores blob and scene reference', async ({ page }) => {
        await openSoundboardTab(page);

        await page.locator('#soundboard-file-input').setInputFiles({
            name: 'undo-test.wav',
            mimeType: 'audio/wav',
            buffer: Buffer.from([
                0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
                0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20,
                0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
                0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
                0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
                0x00, 0x00, 0x00, 0x00
            ])
        });
        await page.waitForTimeout(600);

        // Szene mit dem importierten Track anlegen
        const blobId = await page.evaluate(async function() {
            const blobs = await window.listSoundBlobs();
            const scene = window.createScene('Undo-Test', 0);
            window.addTrackToScene(scene.id, blobs[0].id, 0.8);
            window.renderSceneList();
            window.renderAudioLibrary();
            return blobs[0].id;
        });
        await page.waitForTimeout(200);

        // Ueber den echten UI-Button entfernen (data-action="remove-audio", EventDelegation)
        const removeBtn = page.locator(`.sb-remove-btn[data-id="${blobId}"]`);
        await expect(removeBtn).toBeVisible({ timeout: 3000 });
        await removeBtn.click();
        await page.waitForTimeout(300);

        // Sofort verschwunden: Bibliothek UND Szenen-Referenz
        const afterRemove = await page.evaluate(async function(id) {
            const blobs = await window.listSoundBlobs();
            const scene = window.D.soundboard.scenes.find(function(s) { return s.name === 'Undo-Test'; });
            return {
                inLibrary: blobs.some(function(b) { return b.id === id; }),
                inScene: scene ? scene.tracks.some(function(t) { return t.blobId === id; }) : null
            };
        }, blobId);
        expect(afterRemove.inLibrary).toBe(false);
        expect(afterRemove.inScene).toBe(false);

        // Strg+Z — Undo-System (systems/undo.js) + Undo-Hook (soundboard-crud.js, Plan 12-06)
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(400);

        const afterUndo = await page.evaluate(async function(id) {
            const blobs = await window.listSoundBlobs();
            const scene = window.D.soundboard.scenes.find(function(s) { return s.name === 'Undo-Test'; });
            return {
                inLibrary: blobs.some(function(b) { return b.id === id; }),
                inScene: scene ? scene.tracks.some(function(t) { return t.blobId === id; }) : null
            };
        }, blobId);
        expect(afterUndo.inLibrary).toBe(true);
        expect(afterUndo.inScene).toBe(true);

        // Reload — echte IDB/localStorage-Persistenz statt In-Memory-Zustand pruefen
        // (Vorsicht: JS-Modul-Caches wie soundboard-player.js:_bufferCache koennten sonst
        // einen kaputten Restore als funktionierend erscheinen lassen)
        await page.reload();
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await page.waitForTimeout(600);

        const afterReload = await page.evaluate(async function(id) {
            const blobs = await window.listSoundBlobs();
            const scene = window.D.soundboard.scenes.find(function(s) { return s.name === 'Undo-Test'; });
            return {
                inLibrary: blobs.some(function(b) { return b.id === id; }),
                inScene: scene ? scene.tracks.some(function(t) { return t.blobId === id; }) : null
            };
        }, blobId);
        expect(afterReload.inLibrary).toBe(true);
        expect(afterReload.inScene).toBe(true);
    });

    /**
     * SAFE-06 / D-08 (Plan 12-07) — Audio-Rundlauf: Export -> harte Loeschung -> Neustart
     * -> Import -> nachweislich ABSPIELBARE Datei in der Szene.
     *
     * Diese Naht war bisher ungeprueft: buildAudioExport() und importAudioExport() haben
     * je eigene Tests, aber niemand lief den Weg von einer Datei ueber Base64 zurueck zu
     * einer dekodierbaren Datei. Genau an so einer Naht entstand DEBT-18.
     *
     * Warum der Neustart in der Mitte nicht schmueckendes Beiwerk ist (T-12-23):
     * soundboard-player.js haelt dekodierte AudioBuffer in `_bufferCache`. Ohne Reload
     * lieferte der Cache den ALTEN Puffer zurueck und der Test waere gruen, selbst wenn
     * der Base64-Rundlauf die Bytes zerstoert haette.
     *
     * Die hoerbare Wiedergabe bleibt bewusst aussen vor (Autoplay-Regel; im Projekt seit
     * Phase 7 als menschliche Pruefung gefuehrt). Der belastbare automatisierte Nachweis
     * ist decodeAudioData: er beweist, dass die Bytes den Rundlauf unbeschaedigt
     * ueberstanden haben und weiterhin abspielbares Audio sind.
     */
    test('audio export roundtrip survives restart and stays decodable', async ({ page }) => {
        await openSoundboardTab(page);

        const fileName = 'roundtrip-test.wav';
        await page.locator('#soundboard-file-input').setInputFiles({
            name: fileName,
            mimeType: 'audio/wav',
            // 4410 Samples = 0,1 s echtes (stilles) PCM — dekodierbar, anders als das
            // 44-Byte-WAV der uebrigen Tests
            buffer: makeWavBuffer(4410)
        });
        // setInputFiles feuert nativ 'input' + 'change' — kein manuelles 'change'
        // nachschieben (das verdeckte den Doppel-Import-Fehler)
        await page.waitForTimeout(800);

        // Szene anlegen und den importierten Track zuordnen
        const ids = await page.evaluate(async function() {
            const blobs = await window.listSoundBlobs();
            const scene = window.createScene('Rundlauf-Test', 0);
            window.addTrackToScene(scene.id, blobs[0].id, 0.8);
            return { blobId: blobs[0].id, sceneId: scene.id, name: blobs[0].name };
        });
        expect(ids.name).toBe(fileName);
        await page.waitForTimeout(200);

        // Die zweite Umzugs-Datei bauen — im Testprozess statt als Download
        const exportJson = await page.evaluate(async function() {
            return JSON.stringify(await window.buildAudioExport());
        });
        const exportObj = JSON.parse(exportJson);
        expect(exportObj._exportType).toBe('audio-export-v1');
        expect(exportObj.audioFiles).toHaveLength(1);
        expect(exportObj.audioFiles[0].id).toBe(ids.blobId);
        expect(typeof exportObj.audioFiles[0].data).toBe('string');
        expect(exportObj.audioFiles[0].data.length).toBeGreaterThan(0);

        // Datei ENDGUELTIG aus der Datenbank entfernen (harte Loeschung, kein Grabstein)
        const afterDelete = await page.evaluate(async function(id) {
            await window.deleteSoundBlob(id);
            const blobs = await window.listSoundBlobs();
            return blobs.some(function(b) { return b.id === id; });
        }, ids.blobId);
        expect(afterDelete).toBe(false); // sonst pruefte der Import nur Ueberreste

        // Neustart — leert den AudioBuffer-Cache in soundboard-player.js (T-12-23)
        await page.reload();
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await page.waitForTimeout(800);

        // Vorbedingung nach dem Neustart: die Datei ist wirklich weg
        const beforeImport = await page.evaluate(async function(id) {
            const blobs = await window.listSoundBlobs();
            return blobs.some(function(b) { return b.id === id; });
        }, ids.blobId);
        expect(beforeImport).toBe(false);

        // Import aus der Umzugs-Datei
        const importResult = await page.evaluate(async function(json) {
            return await window.importAudioExport(JSON.parse(json));
        }, exportJson);
        expect(importResult.imported).toBe(1);
        expect(importResult.skipped).toHaveLength(0);

        // 1. Die Datei ist wieder da — gleiche id, gleicher Name
        const nachImport = await page.evaluate(async function(id) {
            const blobs = await window.listSoundBlobs();
            const treffer = blobs.find(function(b) { return b.id === id; });
            const scene = (window.D.soundboard.scenes || []).find(function(s) {
                return s.name === 'Rundlauf-Test';
            });
            return {
                gefunden: !!treffer,
                name: treffer ? treffer.name : null,
                sceneTrackBlobId: scene && scene.tracks[0] ? scene.tracks[0].blobId : null
            };
        }, ids.blobId);
        expect(nachImport.gefunden).toBe(true);
        expect(nachImport.name).toBe(fileName);
        // 2. Die Szene zeigt unveraendert auf dieselbe blobId
        expect(nachImport.sceneTrackBlobId).toBe(ids.blobId);

        // 3. Der zurueckgeholte Blob ist ABSPIELBAR — der eigentliche Beweis,
        //    dass die Bytes den Base64-Rundlauf unbeschaedigt ueberstanden haben
        const decoded = await page.evaluate(async function(id) {
            const blob = await window.getSoundBlob(id);
            if (!blob) return { ok: false, grund: 'kein Blob in IDB' };
            const arrayBuffer = await blob.arrayBuffer();
            const ctx = window.getAudioContext();
            try {
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                return {
                    ok: true,
                    duration: audioBuffer.duration,
                    sampleRate: audioBuffer.sampleRate,
                    length: audioBuffer.length
                };
            } catch (e) {
                return { ok: false, grund: (e && e.message) || String(e) };
            }
        }, ids.blobId);
        expect(decoded.grund || null).toBeNull();
        expect(decoded.ok).toBe(true);
        expect(decoded.duration).toBeGreaterThan(0);
        // 4410 Samples bei 44100 Hz = 0,1 s. NICHT auf sampleRate/length pruefen:
        // decodeAudioData resampelt auf die Rate des AudioContext (hier 48000) —
        // die Dauer ist die resampling-unabhaengige Groesse. Eine abgeschnittene
        // oder beschaedigte Base64-Nutzlast ergaebe eine andere Dauer.
        expect(decoded.duration).toBeGreaterThan(0.09);
        expect(decoded.duration).toBeLessThan(0.12);

        // 4. Die Szene SPIELT den zurueckgeholten Track wirklich ab (D-08, dritte Etappe).
        //    Bewusst ueber die Produktionsnaht playSceneById() — nicht ueber handgebaute
        //    tracks —, damit die Szenen-Suche und die tracks-Uebergabe aus
        //    soundboard-crud.js mit im Netz haengen.
        //
        //    getActiveSceneId() allein beweist NICHTS: activateSoundScene setzt
        //    _activeScene.sceneId bedingungslos, auch wenn newTracks leer ist, und
        //    loadTrackBuffer schluckt Decode-Fehler (null -> von filter(Boolean)
        //    verworfen). Ebenso ist der getSoundBlob-Spy nur ein Beleg fuer den
        //    BEGINN des Ladens (er feuert vor decodeAudioData). Deshalb werden hier
        //    die Artefakte beobachtet, die es ohne echte Wiedergabe nicht gibt:
        //    eine gestartete BufferSource mit dem dekodierten Puffer, die Verbindung
        //    des Track-Gains zur Ausgabe und die Lautstaerke-Rampe auf den in der
        //    Szene gespeicherten Wert (0,8) statt auf 0.
        const aktiv = await page.evaluate(async function(args) {
            const geladen = [];
            const starts = [];
            const zielVerbindungen = [];
            const rampenZiele = [];

            const origGetSoundBlob = window.getSoundBlob;
            const ctx = window.getAudioContext();
            const ziel = ctx.destination;
            const AudioCtxProto = Object.getPrototypeOf(ctx);
            const origCreateBufferSource = AudioCtxProto.createBufferSource;
            const GainProto = Object.getPrototypeOf(ctx.createGain());
            const origConnect = GainProto.connect;
            const ParamProto = Object.getPrototypeOf(ctx.createGain().gain);
            const origRamp = ParamProto.linearRampToValueAtTime;

            window.getSoundBlob = async function(id) {
                geladen.push(id);
                return origGetSoundBlob(id);
            };
            AudioCtxProto.createBufferSource = function() {
                const src = origCreateBufferSource.apply(this, arguments);
                const origStart = src.start;
                src.start = function() {
                    starts.push({
                        hatPuffer: !!src.buffer,
                        dauer: src.buffer ? src.buffer.duration : null
                    });
                    return origStart.apply(src, arguments);
                };
                return src;
            };
            GainProto.connect = function(dest) {
                if (dest === ziel) zielVerbindungen.push(true);
                return origConnect.apply(this, arguments);
            };
            ParamProto.linearRampToValueAtTime = function(wert) {
                rampenZiele.push(wert);
                return origRamp.apply(this, arguments);
            };

            let zweiterLauf = [];
            try {
                await window.playSceneById(args.sceneId);
                // Zweite Aktivierung: der Puffer-Cache ist nur dann warm, wenn
                // loadTrackBuffer im ersten Lauf wirklich DEKODIERT hat. Ein
                // stillschweigend fehlgeschlagener Decode wuerde erneut aus der
                // IDB laden (soundboard-player.js: Cache-Set erst nach decodeAudioData).
                geladen.length = 0;
                await window.playSceneById(args.sceneId);
                zweiterLauf = geladen.slice();
            } finally {
                window.getSoundBlob = origGetSoundBlob;
                AudioCtxProto.createBufferSource = origCreateBufferSource;
                GainProto.connect = origConnect;
                ParamProto.linearRampToValueAtTime = origRamp;
            }

            return {
                activeSceneId: window.getActiveSceneId(),
                starts: starts,
                zielVerbindungen: zielVerbindungen.length,
                rampenZiele: rampenZiele,
                zweiterLauf: zweiterLauf
            };
        }, ids);

        expect(aktiv.activeSceneId).toBe(ids.sceneId);
        // Mindestens eine Quelle wurde gestartet — pro Aktivierung eine (zwei Laeufe)
        expect(aktiv.starts.length).toBeGreaterThanOrEqual(2);
        // ... und zwar mit dem vom PLAYER dekodierten Puffer des Rundlauf-Tracks
        expect(aktiv.starts[0].hatPuffer).toBe(true);
        expect(aktiv.starts[0].dauer).toBeGreaterThan(0.09);
        expect(aktiv.starts[0].dauer).toBeLessThan(0.12);
        // Der Track-Gain haengt an der Ausgabe — ohne das bleibt es stumm
        expect(aktiv.zielVerbindungen).toBeGreaterThanOrEqual(2);
        // Die Rampe zielt auf die in der Szene gespeicherte Lautstaerke, nicht auf 0
        expect(aktiv.rampenZiele).toContain(0.8);
        // Der Decode ist wirklich geglueckt: zweite Aktivierung trifft den Cache
        expect(aktiv.zweiterLauf).toEqual([]);
    });

});
