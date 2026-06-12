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

    // Fehlgeschlagene Tests nicht wiederholen in CI
    forbidOnly: !!process.env.CI,

    // Wiederholungen bei Fehlern
    retries: process.env.CI ? 2 : 0,

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
