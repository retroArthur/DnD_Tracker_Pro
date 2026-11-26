// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Konfiguration für D&D Tracker
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    // Test-Verzeichnis
    testDir: './tests/e2e',

    // Maximale Zeit pro Test
    timeout: 30 * 1000,

    // Erwartungen Timeout
    expect: {
        timeout: 5000
    },

    // Parallele Tests
    fullyParallel: true,

    // Versehentliche test.only-Aufrufe in CI verhindern.
    forbidOnly: !!process.env.CI,

    // Jeder Fall muss im ersten Versuch bestehen, auch in CI.
    retries: 0,

    // Anzahl paralleler Worker
    workers: process.env.CI ? 1 : undefined,

    // Reporter
    reporter: [['html', { outputFolder: 'tests/e2e/reports' }], ['list']],

    // Globale Einstellungen für alle Tests
    use: {
        // Basis-URL (file:// für lokale HTML)
        baseURL: `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`,

        // Screenshots bei Fehlern
        screenshot: 'only-on-failure',

        // Videos bei Fehlern
        video: 'retain-on-failure',

        // Trace bei Fehlern
        trace: 'retain-on-failure',

        // Viewport
        viewport: { width: 1920, height: 1080 }
    },

    // Browser-Projekte
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
        // Optional: Firefox und Safari
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    // Output-Verzeichnis für Test-Artefakte
    outputDir: 'tests/e2e/test-results'
});
