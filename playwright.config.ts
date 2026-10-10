import { defineConfig, devices } from '@playwright/test';

// Le prove girano sulla build statica servita da `astro preview`.
// PW_CHROMIUM_PATH permette di usare una Chromium già installata (es. /opt/pw-browsers/chromium
// nel container cloud) invece di quella scaricata con `npx playwright install chromium`.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
const port = 4322;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    // Uso principale: telefono in palestra
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // --ignore-lock: tiene il server in primo piano anche quando Astro lo manderebbe in background (es. sotto un agente)
    command: `npm run build && npx astro preview --port ${port} --ignore-lock`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
