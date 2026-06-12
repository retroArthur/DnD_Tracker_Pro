// @ts-check
import { defineConfig, devices } from '@playwright/test';

// Smoke-Config: in CI gegen lokalen HTTP-Server (SMOKE_BASE_URL gesetzt),
// lokal Fallback auf file://-Doppelklick-Pfad (dev-Bundle).
const BASE_URL =
    process.env.SMOKE_BASE_URL ||
    `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: 'smoke.spec.js',
    timeout: 30 * 1000,
    expect: { timeout: 5000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list']],
    use: {
        baseURL: BASE_URL,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure'
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    outputDir: 'tests/e2e/test-results-smoke'
});
