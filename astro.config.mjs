// @ts-check

import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import { serviceWorker } from './src/integrations/service-worker';

// Percorso base e sito configurabili (decisioni 7 e 10 del piano): oggi l'app è pubblicata in
// /bodytracker/ sul sito personale, domani su un dominio proprio. Es. BT_BASE=/bodytracker/ npm run build
const base = process.env.BT_BASE || '/';

// https://astro.build/config
export default defineConfig({
  site: process.env.BT_SITE || 'https://francescoperagine.com',
  base: base.endsWith('/') ? base : `${base}/`,
  integrations: [svelte(), serviceWorker()],
  vite: {
    plugins: [tailwindcss()],
  },
});
