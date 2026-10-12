import { defineConfig, devices } from '@playwright/test';

// Le prove girano sulla build statica servita da `astro preview`.
// PW_CHROMIUM_PATH permette di usare una Chromium già installata (es. /opt/pw-browsers/chromium
// nel container cloud) invece di quella scaricata con `npx playwright install chromium`.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
const port = 4322;
// Con WT_BASE=/workout-tracker/ la suite gira sulla build pubblicata in un percorso del sito: i test usano
// percorsi relativi ('settings/'), risolti rispetto a baseURL, mai assoluti ('/settings').
const rawBase = process.env.WT_BASE || '/';
const base = `/${rawBase.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}${base}`,
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    trace: 'retain-on-failure',
    // Il service worker resta fuori dai test, tranne in quelli della PWA (US-03) che lo riattivano
    serviceWorkers: 'block',
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
    url: `http://localhost:${port}${base}`,
    // la build dei test contiene anche /kit (kit.spec.ts, us-30-themes.spec.ts), esclusa da quella pubblicata
    env: { WT_KIT: '1' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
