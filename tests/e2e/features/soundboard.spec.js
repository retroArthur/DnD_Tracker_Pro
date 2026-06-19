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
 * Laedt die App und navigiert zum Soundboard-Tab.
 */
async function openSoundboardTab(page) {
    await page.goto(APP_URL);
    await page.waitForSelector('.app-title', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.click('.nav-tab[data-view="soundboard"]');
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

        // change-Event ausloesen (Playwright's setInputFiles loest change aus, aber manuell sichern)
        await page.dispatchEvent('#soundboard-file-input', 'change');

        // Warten bis IDB-Write und Re-Render abgeschlossen
        await page.waitForTimeout(800);

        // Pruefe IDB-Eintrag via listSoundBlobs()
        const blobCount = await page.evaluate(async function() {
            if (typeof window.listSoundBlobs !== 'function') return -1;
            try {
                const blobs = await window.listSoundBlobs();
                return blobs.length;
            } catch (e) {
                return -2;
            }
        });
        expect(blobCount).toBeGreaterThan(0);

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
        await page.dispatchEvent('#soundboard-file-input', 'change');
        await page.waitForTimeout(800);

        // Vor dem Reload pruefen: Blob in IDB
        const beforeCount = await page.evaluate(async function() {
            if (typeof window.listSoundBlobs !== 'function') return 0;
            const blobs = await window.listSoundBlobs();
            return blobs.length;
        });
        expect(beforeCount).toBeGreaterThan(0);

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
        expect(afterCount).toBeGreaterThan(0);

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

});
